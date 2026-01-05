from flask import render_template, request, redirect, session, flash, url_for, send_from_directory, jsonify
from main import app, db, mail, crypt, cache
from models import Usuarios, Grupos, Consultas, Pacientes, Alertas, FolhaEvolucao, ReuniaoGrupos, TrocaSupervisao
from helpers import FormularioInscricao, FormularioGrupo, FormularioPaciente, FormularioAlerta, recupera_imagem_pacientes, deleta_imagem_pacientes, formatar_tempo_decorrido
from sqlalchemy import text, desc, or_
from flask_login import login_required, current_user
from flask_bcrypt import check_password_hash, generate_password_hash
from flask_mail import Message
import random, json, os, base64
import time
from datetime import datetime, date, timedelta
from sqlalchemy.orm import joinedload, aliased

# ------------------- CONSULTAS -------------------

@app.route('/api/consulta_estag', methods=['GET'])
@login_required
def consulta_estag():
    consulta_estag = db.session.query(Consultas, Pacientes.nome_completo).join(Pacientes, Consultas.id_paciente == Pacientes.id_paciente).filter(Consultas.id_usuario==current_user.id_usuario).all()
    consultas_serializadas = []
    for consulta, nome_paciente in consulta_estag:
        start_datetime = datetime.combine(consulta.dia, consulta.hora_inicio).isoformat()
        end_datetime = datetime.combine(consulta.dia, consulta.hora_fim).isoformat()
        consulta_dict = {
            'id': consulta.id_consulta,
            'title': nome_paciente,
            'start': start_datetime,
            'end': end_datetime,
            'color': consulta.cor,
            'status': consulta.status
        }
        consultas_serializadas.append(consulta_dict)
    reunioes_grupo = ReuniaoGrupos.query.filter_by(id_grupo=current_user.grupo).all()
    for reuniao in reunioes_grupo:
        reuniao_dict = {
            'daysOfWeek': [reuniao.dia],
            'title': 'Reunião de Estágio',
            'startTime': reuniao.hora_inicio.strftime('%H:%M:%S'),
            'endTime': reuniao.hora_fim.strftime('%H:%M:%S'),
            'color': 'black',
            'groupId': 'Reuniao'
        }
        consultas_serializadas.append(reuniao_dict)
    return jsonify(consultas_serializadas)

@app.route('/api/consulta_ids_pacientes', methods=['GET'])
@login_required
def consulta_ids_pacientes():
    pacientes_do_usuario = Pacientes.query.filter_by(id_estagiario=current_user.id_usuario, status='true').all()
    pacientes = [{'id_paciente': paciente.id_paciente, 'nome_completo': paciente.nome_completo} for paciente in pacientes_do_usuario]
    return jsonify(pacientes)

@app.route('/api/cadastrar_consulta_estag', methods=['POST'])
@login_required
def cadastrar_consulta_estag():
    paciente = request.form['paciente']
    dia = request.form['dia']
    inicio = request.form['inicio']
    final = request.form['final']
    iso_dia = datetime.strptime(dia, '%Y-%m-%d').date()
    iso_hora_inicio = datetime.strptime(inicio + ':00', '%H:%M:%S').time()
    iso_hora_fim = datetime.strptime(final + ':00', '%H:%M:%S').time()
    consulta_existente = Consultas.query.filter(
        Consultas.id_usuario == current_user.id_usuario,
        Consultas.dia == iso_dia,
        Consultas.hora_inicio < iso_hora_fim,
        Consultas.hora_fim > iso_hora_inicio
    ).first()
    if consulta_existente:
        return jsonify({'status': 'error', 'message': 'O horário selecionado já está ocupado com uma consulta. Por favor, escolha outro horário.'}), 400
    dia_semana = (iso_dia.weekday() + 1) % 7
    reuniao_existente = ReuniaoGrupos.query.filter(
        ReuniaoGrupos.id_grupo == current_user.grupo,
        ReuniaoGrupos.dia == dia_semana,
        ReuniaoGrupos.hora_inicio < iso_hora_fim,
        ReuniaoGrupos.hora_fim > iso_hora_inicio
    ).first()
    if reuniao_existente:
        return jsonify({'status': 'error', 'message': 'O horário selecionado já está ocupado com uma reunião. Por favor, escolha outro horário.'}), 400
    nova_consulta = Consultas(
        id_usuario=current_user.id_usuario,
        id_grupo=current_user.grupo,
        id_paciente=paciente,
        dia=iso_dia,
        hora_inicio=iso_hora_inicio,
        hora_fim=iso_hora_fim
    )
    db.session.add(nova_consulta)
    db.session.commit()
    return jsonify({'status': 'success', 'message': 'Consulta cadastrada com sucesso!'})

@app.route('/api/editar_consulta_estag', methods=['POST'])
@login_required
def editar_consulta_estag():
    id_req_consulta = request.form['id_consulta']
    dia = request.form['day']
    inicio = request.form['start']
    final = request.form['end']
    iso_dia = datetime.strptime(dia, '%Y-%m-%d').date()
    iso_hora_inicio = datetime.strptime(inicio + ':00', '%H:%M:%S').time()
    iso_hora_fim = datetime.strptime(final + ':00', '%H:%M:%S').time()
    consulta_existente = Consultas.query.filter(
        Consultas.id_usuario == current_user.id_usuario,
        Consultas.dia == iso_dia,
        Consultas.hora_inicio < iso_hora_fim,
        Consultas.hora_fim > iso_hora_inicio
    ).first()
    if consulta_existente and consulta_existente.id_consulta != int(id_req_consulta):
        return jsonify({'status': 'error', 'message': 'O horário selecionado já está ocupado com uma consulta. Por favor, escolha outro horário.'}), 400
    dia_semana = (iso_dia.weekday() + 1) % 7
    reuniao_existente = ReuniaoGrupos.query.filter(
        ReuniaoGrupos.id_grupo == current_user.grupo,
        ReuniaoGrupos.dia == dia_semana,
        ReuniaoGrupos.hora_inicio < iso_hora_fim,
        ReuniaoGrupos.hora_fim > iso_hora_fim
    ).first()
    if reuniao_existente:
        return jsonify({'status': 'error', 'message': 'O horário selecionado já está ocupado com uma reunião. Por favor, escolha outro horário.'}), 400
    consulta = Consultas.query.filter_by(id_consulta=id_req_consulta).first()
    consulta.dia = iso_dia
    consulta.hora_inicio = iso_hora_inicio
    consulta.hora_fim = iso_hora_fim
    db.session.add(consulta)
    db.session.commit()
    return jsonify({'message': 'Consulta editada com sucesso!'})

@app.route('/api/cancelar_consulta_estag', methods=['POST'])
@login_required
def cancelar_consulta_estag():
    consulta = Consultas.query.filter_by(id_consulta=request.form['id_consulta']).first()
    consulta.status = 'Cancelado'
    consulta.cor = '#BD4343'
    db.session.add(consulta)
    db.session.commit()
    return jsonify({'message': 'Consulta cancelada com sucesso!'})

@app.route('/api/realizar_consulta_estag', methods=['POST'])
@login_required
def realizar_consulta_estag():
    consulta = Consultas.query.filter_by(id_consulta=request.form['id_consulta']).first()
    consulta.status = 'Realizado'
    consulta.cor = '#3C7E61'
    db.session.add(consulta)
    db.session.commit()
    return jsonify({'message': 'Consulta realizada com sucesso!'})

@app.route('/api/est_consulta_card', methods=['GET'])
@login_required
def est_consulta_card():
    hoje = date.today()
    consultas_hoje_count = Consultas.query.filter_by(dia=hoje).filter_by(id_usuario=current_user.id_usuario).count()
    inicio_semana = hoje - timedelta(days=hoje.weekday() + 1)
    fim_semana = inicio_semana + timedelta(days=7)
    consultas_semana_count = Consultas.query.filter(Consultas.dia >= inicio_semana, Consultas.dia < fim_semana).filter_by(id_usuario=current_user.id_usuario).count()
    return jsonify({
        'hoje': consultas_hoje_count,
        'semana': consultas_semana_count
    })
# ------------------- TROCAS -------------------
@app.route('/api/consulta_todos_supervisores', methods=['GET'])
@login_required
def consulta_todos_supervisores():
    """
    Retorna todos os usuários com cargo de supervisor (cargo == 1).
    Inclui id, nome e grupo.
    """
    supervisores = Usuarios.query.filter_by(cargo=1, status=True).order_by(Usuarios.nome).all()
    result = [{'id_usuario': s.id_usuario, 'nome': s.nome, 'grupo': s.grupo} for s in supervisores]
    return jsonify(result)


@app.route('/api/solicitar_troca_supervisor', methods=['POST'])
@login_required
def solicitar_troca_supervisor():
    data = request.get_json() or request.form
    try:
        id_supervisor_novo = data.get('id_supervisor_novo') or data.get('id_supervisor')
        if id_supervisor_novo is None:
            return jsonify({'status': 'error', 'message': 'id_supervisor_novo é obrigatório.'}), 400
        try:
            id_supervisor_novo = int(id_supervisor_novo)
        except ValueError:
            return jsonify({'status': 'error', 'message': 'id_supervisor_novo inválido.'}), 400

        levar_raw = data.get('levar_pacientes', False)
        levar_pacientes = str(levar_raw).lower() in ('true', '1', 'yes') if levar_raw is not None else False
        justificativa = data.get('justificativa') or None

        # grupo de origem (do estagiário)
        grupo_origem = getattr(current_user, 'grupo', None)

        # tenta obter um "supervisor atual" do grupo atual (primeiro supervisor encontrado) - pode ser None
        supervisor_atual = Usuarios.query.filter_by(grupo=grupo_origem, cargo=1, status=True).first()
        id_supervisor_atual = supervisor_atual.id_usuario if supervisor_atual else None

        # obter dados do supervisor novo para obter grupo destino
        supervisor_novo = Usuarios.query.get(id_supervisor_novo)
        id_grupo_destino = supervisor_novo.grupo if supervisor_novo else None

        troca = TrocaSupervisao(
            id_estagiario=current_user.id_usuario,
            id_supervisor_atual=id_supervisor_atual,
            id_supervisor_novo=id_supervisor_novo,
            id_grupo_origem=grupo_origem,
            id_grupo_destino=id_grupo_destino,
            levar_pacientes=bool(levar_pacientes),
            justificativa=justificativa,
            status='pendente',
            data_solicitacao=date.today()
        )
        db.session.add(troca)
        db.session.commit()
        return jsonify({'status': 'success', 'id_troca': troca.id_troca}), 201
    except Exception as e:
        db.session.rollback()
        print(f'ERRO solicitar_troca_supervisor: {e}')
        return jsonify({'status': 'error', 'message': str(e)}), 500


@app.route('/api/minhas_trocas', methods=['GET'])
@login_required
def minhas_trocas():
    """
    Retorna as solicitações do estagiário logado.
    """
    trocas = TrocaSupervisao.query.filter_by(id_estagiario=current_user.id_usuario).order_by(TrocaSupervisao.data_solicitacao.desc()).all()
    return jsonify([t.to_dict() for t in trocas])

# ------------------- FICHA PACIENTE -------------------
@app.route('/api/meus_pacientes', methods=['GET'])
@login_required
def api_meus_pacientes():
    pacientes = Pacientes.query.filter_by(id_estagiario=current_user.id_usuario, status='True').order_by(Pacientes.nome_completo).all()
    #pacientes = Pacientes.query.filter_by(id_estagiario=current_user.id_usuario).order_by(Pacientes.nome_completo).all()
    
    lista = []
    for paciente in pacientes:
        atividade = atividade_paciente(paciente.id_paciente)
        lista.append({
            'id_paciente': paciente.id_paciente,
            'nome_completo': paciente.nome_completo,
            'atividade_recente': atividade,
            'data_criacao': paciente.data_criacao,
            'status': paciente.status,
            # 'imagem_url': url_for('imagem_paciente', id=paciente.id_paciente),  
            # outros campos úteis aqui
        })
    
    return jsonify(lista)


@app.route('/api/ficha_paciente/<int:id>', methods=['GET'])
# @cache.cached(timeout=3600, key_prefix='ficha_paciente_%s')
@login_required
def api_ficha_paciente(id):
    print(f"!!!!!!!! CACHE MISS! EXECUTANDO FUNÇÃO REAL PARA PACIENTE {id} !!!!!")
    dados_paciente = Pacientes.query.get_or_404(id)
    estagiario = Usuarios.query.get(dados_paciente.id_estagiario)
    supervisor = Usuarios.query.get(dados_paciente.id_supervisor)
    
    tags = [{
        'id_tag': pt.tag.id_tag,
        'nome': pt.tag.nome
    } for pt in dados_paciente.tags_rel]

    paciente_json = {
        'id_paciente': dados_paciente.id_paciente,
        'nome_completo': dados_paciente.nome_completo,
        'nome_responsavel': dados_paciente.nome_responsavel,
        'grau_parentesco': dados_paciente.grau_parentesco,
        'email': dados_paciente.email,
        'data_nascimento': str(dados_paciente.data_nascimento),
        'idade': dados_paciente.idade,
        'sexo': dados_paciente.sexo,
        'escolaridade': dados_paciente.escolaridade,
        'profissao': dados_paciente.profissao,
        'ocupacao': dados_paciente.ocupacao,
        'salario': dados_paciente.salario,
        'renda_familiar': dados_paciente.renda_familiar,
        'cep': dados_paciente.cep,
        'cidade': dados_paciente.cidade,
        'bairro': dados_paciente.bairro,
        'logradouro': dados_paciente.logradouro,
        'complemento': dados_paciente.complemento,
        'telefone': dados_paciente.telefone,
        'celular1': dados_paciente.celular1,
        'celular2': dados_paciente.celular2,
        'origem_encaminhamento': dados_paciente.origem_encaminhamento,
        'nome_instituicao': dados_paciente.nome_instituicao,
        'nome_resp_encaminhamento': dados_paciente.nome_resp_encaminhamento,
        'motivo': dados_paciente.motivo,
        'medicamentos': dados_paciente.medicamentos,
        'id_estagiario': estagiario.id_usuario if estagiario else None,
        'nome_estagiario': estagiario.nome if estagiario else None,
        'id_supervisor': supervisor.id_usuario if supervisor else None,
        'nome_supervisor': supervisor.nome if supervisor else None,
        'status': dados_paciente.status,
        'data_criacao': str(dados_paciente.data_criacao),
        'hipotese_diagnostica': dados_paciente.hipotese_diagnostica or None,
        'ja_fez_terapia':dados_paciente.ja_fez_terapia,
        'etnia':dados_paciente.etnia,
        'genero':dados_paciente.genero,
        'classe_social':dados_paciente.classe_social,
        'intervalo_sessoes': dados_paciente.intervalo_sessoes,
        'tags': tags,
    }
    Estagiario = aliased(Usuarios)
    Supervisor = aliased(Usuarios)

    folhas_db = FolhaEvolucao.query.filter_by(id_paciente=id)\
        .options(           
            joinedload(FolhaEvolucao.estagiario.of_type(Estagiario)),
            joinedload(FolhaEvolucao.supervisor.of_type(Supervisor))
        )\
        .order_by(FolhaEvolucao.data_postagem.desc())\
        .all()
    folhas_pacientes = []
    for folha in folhas_db:
        def descriptografar_campo(campo_criptografado):
            if not campo_criptografado: return ""
            try: return crypt.decrypt(campo_criptografado.encode('utf-8')).decode('utf-8')
            except Exception: return 'Erro na descriptografia.'
        folha_json = {
            'id_paciente': folha.id_paciente,
            'id_estagiario': folha.id_estagiario,
            'id_supervisor': folha.id_supervisor,
            'id_folha': folha.id_folha,
            'nome_estagiario': folha.estagiario.nome if folha.estagiario else 'Desconhecido',
            'nome_supervisor': folha.supervisor.nome if folha.supervisor else 'Desconhecido',
            'data_postagem': str(folha.data_postagem),
            'numero_sessao': folha.numero_sessao,
            'status_validacao': folha.status_validacao,
            'feedback': folha.feedback,
            'data_status': str(folha.data_status) if folha.data_status else None,
            # 'hipotese_diagnostica': descriptografar_campo(folha.hipotese_diagnostica),
            # 'sintomas_atuais': descriptografar_campo(folha.sintomas_atuais),
            # 'intervencoes_realizadas': descriptografar_campo(folha.intervencoes_realizadas),
            # 'evolucao_clinica': descriptografar_campo(folha.evolucao_clinica),
            # 'plano_proxima_sessao': descriptografar_campo(folha.plano_proxima_sessao),
            # 'observacoes': descriptografar_campo(folha.observacoes),
            'hipotese_diagnostica': folha.hipotese_diagnostica,
            'sintomas_atuais': folha.sintomas_atuais,
            'intervencoes_realizadas': folha.intervencoes_realizadas,
            'evolucao_clinica': folha.evolucao_clinica,
            'plano_proxima_sessao': folha.plano_proxima_sessao,
            'observacoes': folha.observacoes,
        }
        folhas_pacientes.append(folha_json)

    return jsonify({
        'paciente': paciente_json,
        'folhas_pacientes': folhas_pacientes
    })

@app.route('/api/est_editar_paciente/<int:id>', methods=['POST'])
@login_required
def est_editar_paciente(id):
    paciente_para_atualizar = Pacientes.query.get_or_404(id)
    data = request.form
    try:
        if not all(data.get(key) for key in ['nome_completo', 'idade', 'celular1']):
            return jsonify({'message': 'Nome completo, idade e celular 1 são obrigatórios.'}), 400
        
        def to_int_or_none(value):
            if value is None or str(value).strip() == '': return None
            return int(value)
            
        def to_numeric_or_none(value):
            if value is None or str(value).strip() == '': return None
            return float(value)

        def to_date_or_none(value_str):
            if not value_str: return None
            try: return datetime.strptime(value_str, '%Y-%m-%d').date()
            except (ValueError, TypeError): return None

        def to_bool_or_none(value_str):
            if value_str is None or str(value_str).strip() == '': return None
            return str(value_str).lower() == 'true'
        
        
        paciente_para_atualizar.nome_completo=data.get('nome_completo')
        paciente_para_atualizar.idade=to_int_or_none(data.get('idade'))
        paciente_para_atualizar.celular1=data.get('celular1')
        
        paciente_para_atualizar.id_supervisor=to_int_or_none(data.get('id_supervisor'))
        paciente_para_atualizar.nome_responsavel=data.get('nome_responsavel') or None
        paciente_para_atualizar.grau_parentesco=data.get('grau_parentesco') or None
        paciente_para_atualizar.data_nascimento=to_date_or_none(data.get('data_nascimento'))
        paciente_para_atualizar.sexo=data.get('sexo') or None
        paciente_para_atualizar.escolaridade=data.get('escolaridade') or None
        paciente_para_atualizar.profissao=data.get('profissao') or None
        paciente_para_atualizar.ocupacao=data.get('ocupacao') or None
        paciente_para_atualizar.salario=to_numeric_or_none(data.get('salario')),
        paciente_para_atualizar.renda_familiar=to_numeric_or_none(data.get('renda_familiar'))
        paciente_para_atualizar.email=data.get('email') or None
        paciente_para_atualizar.cep=to_int_or_none(data.get('cep'))
        paciente_para_atualizar.cidade=data.get('cidade') or None
        paciente_para_atualizar.bairro=data.get('bairro') or None
        paciente_para_atualizar.logradouro=data.get('logradouro') or None
        paciente_para_atualizar.complemento=data.get('complemento') or None
        paciente_para_atualizar.telefone=data.get('telefone') or None
        paciente_para_atualizar.celular2=data.get('celular2') or None
        paciente_para_atualizar.origem_encaminhamento=data.get('origem_encaminhamento') or None
        paciente_para_atualizar.nome_instituicao=data.get('nome_instituicao') or None
        paciente_para_atualizar.nome_resp_encaminhamento=data.get('nome_resp_encaminhamento') or None
        paciente_para_atualizar.motivo=data.get('motivo') or None
        paciente_para_atualizar.medicamentos=data.get('medicamentos') or None
        paciente_para_atualizar.intervalo_sessoes=data.get('intervalo_sessoes') or None
        paciente_para_atualizar.hipotese_diagnostica=data.get('hipotese_diagnostica') or None
        paciente_para_atualizar.ja_fez_terapia=to_bool_or_none(data.get('ja_fez_terapia'))
        paciente_para_atualizar.etnia=data.get('etnia') or None
        paciente_para_atualizar.genero=data.get('genero') or None
        paciente_para_atualizar.classe_social=data.get('classe_social') or None
        paciente_para_atualizar.status=True
        paciente_para_atualizar.data_criacao=date.today()

        if 'imagem_paciente' in request.files:
            imagem = request.files['imagem_paciente']
            if imagem.filename != '':
                upload_path = app.config['UPLOAD_PACIENTES_PATH']
                filename = f'paciente_{paciente_para_atualizar.id_paciente}.jpg'
                
                deleta_imagem_pacientes(paciente_para_atualizar.id_paciente)
                
                imagem.save(os.path.join(upload_path, filename))

        db.session.commit()
        cache.delete(f'ficha_paciente_{id}')

        return jsonify({'status': 'success', 'id_paciente': paciente_para_atualizar.id_paciente})
    except Exception as e:
        db.session.rollback()
        print(f"ERRO AO CRIAR PACIENTE: {e}")
        return jsonify({'message': f'Ocorreu um erro interno: {e}'}), 500
    
@app.route('/api/adicionar_paciente', methods=['POST'])
@login_required
def api_adicionar_paciente():
    data = request.get_json()
    
    novo_paciente = Pacientes(
        id_estagiario=current_user.id_usuario,
        id_supervisor=data['id_supervisor'],
        nome_completo=data['nome_completo'],
        data_nascimento=datetime.strptime(data['data_nascimento'], '%Y-%m-%d').date(),
        idade=data['idade'],
        sexo=data['sexo'],
        cidade=data['cidade'],
        bairro=data['bairro'],
        telefone=data['telefone'],
        email=data['email'],
        motivo=data['motivo'],
        medicamentos=data['medicamentos'],
        status='True',
        data_criacao=date.today().strftime('%d/%m/%Y')
    )
    
    db.session.add(novo_paciente)
    db.session.commit()
    
    return jsonify({'status': 'success', 'id_paciente': novo_paciente.id_paciente})

@app.route('/api/consulta_ids_supervisores', methods=['GET'])
@login_required
def consulta_ids_supervisores():
    supervisores = Usuarios.query.filter_by(grupo=current_user.grupo, cargo='1', status='true').all()
    supervisor = [{'id_supervisor': supervisor_unico.id_usuario, 'nome': supervisor_unico.nome} for supervisor_unico in supervisores]
    return jsonify(supervisor)

@app.route('/api/est_ficha_adicionada', methods=['POST'])
@login_required
def est_ficha_adicionada():
    id_paciente = request.form['id_paciente']
    id_estagiario = current_user.id_usuario
    id_supervisor = request.form['id_supervisor']
    data_postagem = datetime.now().replace(microsecond=0)
    data_status = datetime.now().replace(microsecond=0)
    # hipotese_diagnostica = crypt.encrypt(request.form['hipotese_diagnostica']).decode('utf-8')
    # sintomas_atuais = crypt.encrypt(request.form['sintomas_atuais']).decode('utf-8')
    # intervencoes_realizadas = crypt.encrypt(request.form['intervencoes_realizadas']).decode('utf-8')
    # evolucao_clinica = crypt.encrypt(request.form['evolucao_clinica']).decode('utf-8')
    # plano_proxima_sessao = crypt.encrypt(request.form['plano_proxima_sessao']).decode('utf-8')
    # observacoes = crypt.encrypt(request.form['observacoes']).decode('utf-8')
    hipotese_diagnostica = request.form['hipotese_diagnostica']
    sintomas_atuais = request.form['sintomas_atuais']
    intervencoes_realizadas = request.form['intervencoes_realizadas']
    evolucao_clinica = request.form['evolucao_clinica']
    plano_proxima_sessao = request.form['plano_proxima_sessao']
    observacoes = request.form['observacoes']
    valor = request.form.get('valor', None)
    numero_sessao = FolhaEvolucao.query.filter_by(id_paciente=id_paciente).count() + 1

    nova_folha = FolhaEvolucao(
        id_paciente=id_paciente,
        id_estagiario=id_estagiario,
        data_postagem=data_postagem,
        hipotese_diagnostica=hipotese_diagnostica,
        sintomas_atuais=sintomas_atuais,
        intervencoes_realizadas=intervencoes_realizadas,
        evolucao_clinica=evolucao_clinica,
        plano_proxima_sessao=plano_proxima_sessao,
        observacoes=observacoes,
        id_supervisor=id_supervisor,
        numero_sessao=numero_sessao,
        status_validacao='Validação Pendente', 
        valor=valor,
        data_status=data_status
    )
    db.session.add(nova_folha)
    db.session.commit()
    print(f"--- ADICIONAR: Tentando limpar o cache para a chave: 'ficha_paciente_{id_paciente}' ---")
    cache.delete(f'ficha_paciente_{id_paciente}')
    return jsonify({'message': 'Folha adicionada com sucesso!'})


@app.route('/api/est_ficha_deletada/<int:id>', methods=['DELETE'])
@login_required
def est_ficha_deletada(id):
    folha = FolhaEvolucao.query.get_or_404(id)
    id_paciente = folha.id_paciente
    db.session.delete(folha)
    db.session.commit()
    cache.delete(f'ficha_paciente_{id_paciente}')

    return jsonify({'message': 'Folha excluída com sucesso'})
# ------------------- ESTATÍSTICAS -------------------

@app.route('/api/est_primeira_estatistica_paciente/<int:id_paciente>', methods=['GET'])
@login_required
def est_primeira_estatistica_paciente(id_paciente):
    consultas_marcadas = Consultas.query.filter_by(id_paciente=id_paciente, status='Agendado').count()
    consultas_realizadas = Consultas.query.filter_by(id_paciente=id_paciente, status='Realizado').count()
    consultas_canceladas = Consultas.query.filter_by(id_paciente=id_paciente, status='Cancelado').count()
    data = {
        'marcadas': consultas_marcadas,
        'realizadas': consultas_realizadas,
        'canceladas': consultas_canceladas
    }
    return jsonify(data)

@app.route('/api/est_segunda_estatistica_paciente/<int:id_paciente>', methods=['GET'])
@login_required
def est_segunda_estatistica_paciente(id_paciente):
    consultas = Consultas.query.filter_by(id_paciente=id_paciente).all()
    marcadas = [0] * 7
    realizadas = [0] * 7
    canceladas = [0] * 7
    for consulta in consultas:
        dia_semana = consulta.dia.weekday()
        if consulta.status == 'Agendado':
            marcadas[dia_semana] += 1
        elif consulta.status == 'Realizado':
            realizadas[dia_semana] += 1
        elif consulta.status == 'Cancelado':
            canceladas[dia_semana] += 1
    marcadas = marcadas[-1:] + marcadas[:-1]
    realizadas = realizadas[-1:] + realizadas[:-1]
    canceladas = canceladas[-1:] + canceladas[:-1]
    data = {
        'marcadas': marcadas,
        'realizadas': realizadas,
        'canceladas': canceladas
    }
    return jsonify(data)

@app.route('/api/est_terceira_estatistica_paciente/<int:id_paciente>', methods=['GET'])
@login_required
def est_terceira_estatistica_paciente(id_paciente):
    consultas = Consultas.query.filter_by(id_paciente=id_paciente).all()
    marcadas = [0] * 24
    realizadas = [0] * 24
    canceladas = [0] * 24
    for consulta in consultas:
        hora = consulta.hora_inicio.hour
        if consulta.status == 'Agendado':
            marcadas[hora] += 1
        elif consulta.status == 'Realizado':
            realizadas[hora] += 1
        elif consulta.status == 'Cancelado':
            canceladas[hora] += 1
    marcadas = marcadas[6:21]
    realizadas = realizadas[6:21]
    canceladas = canceladas[6:21]
    data = {
        'marcadas': marcadas,
        'realizadas': realizadas,
        'canceladas': canceladas
    }
    return jsonify(data)

# ------------------- UPLOADS -------------------

# @app.route('/api/uploads/pacientes/paciente/<id>', methods=['GET'])
# def imagem_paciente_tabela(id):
#     imagem = recupera_imagem_pacientes(id)
#     return send_from_directory(app.config['UPLOAD_PACIENTES_PATH'], imagem)

# ------------------- FUNÇÕES AUXILIARES -------------------

def atividade_paciente(id):
    ultima_folha = FolhaEvolucao.query.filter_by(id_paciente=id).order_by(desc(FolhaEvolucao.id_folha)).first()
    ultima_consulta = Consultas.query.filter_by(id_paciente=id).order_by(desc(Consultas.id_consulta)).first()
    if ultima_folha:
        data_folha = ultima_folha.data_postagem
    else:
        data_folha = None
    if ultima_consulta:
        data_consulta = datetime.combine(ultima_consulta.dia, ultima_consulta.hora_fim)
    else:
        data_consulta = None
    agora = datetime.now()
    if data_folha and data_consulta:
        ultima_atividade = max(data_folha, data_consulta)
    elif data_folha:
        ultima_atividade = data_folha
    elif data_consulta:
        ultima_atividade = data_consulta
    else:
        return 'Nenhuma atividade encontrada'
    if ultima_atividade > agora:
        return 'Consulta marcada para os próximos dias'
    tempo_decorrido = agora - ultima_atividade
    tempo_formatado = formatar_tempo_decorrido(tempo_decorrido)
    return tempo_formatado

@app.route('/api/pacientes_disponiveis', methods=['GET'])
@login_required
def pacientes_disponiveis():
    """
    Lista pacientes disponíveis para um estagiário assumir.
    Critérios:
    1. Paciente não tem estagiário (`id_estagiario` é NULL).
    2. O paciente ou não tem supervisor ou o supervisor pertence ao mesmo grupo do estagiário.
    """
    if current_user.cargo != 2: # Apenas para estagiários
        return jsonify({'message': 'Acesso não autorizado'}), 403

    supervisores_grupo_ids = [u.id_usuario for u in Usuarios.query.filter_by(grupo=current_user.grupo, cargo=1).all()]

    Supervisor = aliased(Usuarios)
    pacientes_query = Pacientes.query.outerjoin(Supervisor, Pacientes.id_supervisor == Supervisor.id_usuario).filter(
        Pacientes.id_estagiario == None,
        or_(
            Pacientes.id_supervisor == None,
            Pacientes.id_supervisor.in_(supervisores_grupo_ids)
        )
    ).add_columns(
        Pacientes.id_paciente,
        Pacientes.nome_completo,
        Pacientes.idade,
        Pacientes.motivo,
        Supervisor.nome.label('supervisor_nome')
    ).order_by(Pacientes.data_criacao.desc()).all()

    pacientes_disponiveis = [
        {'id_paciente': p.id_paciente, 'nome_completo': p.nome_completo, 'idade': p.idade, 'motivo': p.motivo, 'supervisor_nome': p.supervisor_nome}
        for p in pacientes_query
    ]

    return jsonify(pacientes_disponiveis)


@app.route('/api/assumir_paciente/<int:id_paciente>', methods=['POST'])
@login_required
def assumir_paciente(id_paciente):
    """
    Estagiário assume um paciente.
    Atualiza o id_estagiario e o id_supervisor do paciente.
    """
    if current_user.cargo != 2:
        return jsonify({'message': 'Acesso não autorizado'}), 403

    paciente = Pacientes.query.get_or_404(id_paciente)
    if paciente.id_estagiario:
        return jsonify({'message': 'Este paciente já foi assumido por outro estagiário.'}), 400

    supervisor = Usuarios.query.filter_by(grupo=current_user.grupo, cargo=1).first()

    paciente.id_estagiario = current_user.id_usuario
    paciente.id_supervisor = supervisor.id_usuario if supervisor else None
    db.session.commit()

    return jsonify({'status': 'success', 'message': 'Paciente assumido com sucesso!'})