from operator import or_
from flask import request, jsonify
from main import app, db, mail, crypt, cache
from models import Usuarios, Grupos, Pacientes, Alertas, ReuniaoGrupos, Consultas, FolhaEvolucao, Tag, PacienteTag, SolicitacaoAcesso, Reunioes, ReuniaoParticipantes
from helpers import FormularioInscricao, FormularioGrupo, FormularioPaciente, FormularioAlerta, recupera_imagem_pacientes, deleta_imagem_pacientes
from sqlalchemy import text, func
from flask_login import login_required, current_user
from flask_bcrypt import check_password_hash, generate_password_hash
from flask_mail import Message
import random, json, time, os, base64
from datetime import datetime, date, timedelta
from sqlalchemy.orm import joinedload, aliased

# Inicio Consultas dos estagiários
@app.route('/api/consulta_supervisor', methods=['GET'])
@login_required
def api_consulta_supervisor():
    estagiarioId = request.args.get('estagiarioId')
    consultas_serializadas = []

    if estagiarioId:
        consulta_estag = db.session.query(Consultas, Pacientes.nome_completo).join(
            Pacientes, Consultas.id_paciente == Pacientes.id_paciente
        ).filter(Consultas.id_usuario == estagiarioId).all()
    else:
        consulta_estag = db.session.query(Consultas, Pacientes.nome_completo).join(
            Pacientes, Consultas.id_paciente == Pacientes.id_paciente
        ).filter(Consultas.id_grupo == current_user.grupo).all()

    for consulta, nome_paciente in consulta_estag:
        start_datetime = datetime.combine(consulta.dia, consulta.hora_inicio).isoformat()
        end_datetime = datetime.combine(consulta.dia, consulta.hora_fim).isoformat()
        consulta_dict = {
            'id': consulta.id_consulta,
            'title': nome_paciente,
            'start': start_datetime,
            'end': end_datetime,
            'color': consulta.cor,
            'status': consulta.status,
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

    # Busca reuniões agendadas (específicas)
    reunioes_agendadas = Reunioes.query.filter_by(id_supervisor=current_user.id_usuario).all()
    for r in reunioes_agendadas:
        start_datetime = datetime.combine(r.dia, r.hora_inicio).isoformat()
        end_datetime = datetime.combine(r.dia, r.hora_fim).isoformat()
        part_names = [p.participante.nome for p in r.participantes]
        
        reuniao_dict = {
            'id': f"reuniao_{r.id_reuniao}",
            'title': f"{r.titulo}",
            'start': start_datetime,
            'end': end_datetime,
            'color': 'black',
            'extendedProps': {'type': 'reuniao', 'participantes': part_names}
        }
        consultas_serializadas.append(reuniao_dict)

    return jsonify(consultas_serializadas)

@app.route('/api/consulta_ids_estagiarios', methods=['GET'])
@login_required
def api_consulta_ids_estagiarios():
    estags = Usuarios.query.filter_by(grupo=current_user.grupo, cargo='2', status='true').all()
    estagiarios = [{'id_estagiario': estagiario.id_usuario, 'nome': estagiario.nome} for estagiario in estags]
    return jsonify(estagiarios)

@app.route('/api/cadastrar_consulta_supervisor', methods=['POST'])
@login_required
def api_cadastrar_consulta_supervisor():
    paciente = request.form['paciente']
    dia = request.form['dia']
    inicio = request.form['inicio']
    final = request.form['final']
    iso_dia = datetime.strptime(dia, '%Y-%m-%d').date()
    iso_hora_inicio = datetime.strptime(inicio + ':00', '%H:%M:%S').time()
    iso_hora_fim = datetime.strptime(final + ':00', '%H:%M:%S').time()

    # Verifica conflitos (opcional, mas recomendado)
    consulta_existente = Consultas.query.filter(
        Consultas.id_usuario == current_user.id_usuario,
        Consultas.dia == iso_dia,
        Consultas.hora_inicio < iso_hora_fim,
        Consultas.hora_fim > iso_hora_inicio
    ).first()
    if consulta_existente:
        return jsonify({'status': 'error', 'message': 'Horário ocupado.'}), 400

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

@app.route('/api/criar_reuniao_supervisor', methods=['POST'])
@login_required
def api_criar_reuniao_supervisor():
    data = request.get_json()
    titulo = data.get('titulo')
    dia_str = data.get('dia')
    inicio_str = data.get('inicio')
    final_str = data.get('final')
    participantes_ids = data.get('participantes', [])

    dia = datetime.strptime(dia_str, '%Y-%m-%d').date()
    inicio = datetime.strptime(inicio_str + ':00', '%H:%M:%S').time()
    final = datetime.strptime(final_str + ':00', '%H:%M:%S').time()

    nova_reuniao = Reunioes(
        id_supervisor=current_user.id_usuario,
        titulo=titulo,
        dia=dia,
        hora_inicio=inicio,
        hora_fim=final
    )
    db.session.add(nova_reuniao)
    db.session.flush() # Gera o ID

    for pid in participantes_ids:
        part = ReuniaoParticipantes(id_reuniao=nova_reuniao.id_reuniao, id_participante=pid)
        db.session.add(part)
    
    db.session.commit()
    return jsonify({'status': 'success', 'message': 'Reunião agendada com sucesso!'})

# Administração do grupo
@app.route('/api/meu_grupo', methods=['GET'])
@login_required
def api_meu_grupo():
    grupo_info = Grupos.query.filter_by(id_grupo=current_user.grupo).first()
    lista_coord = Usuarios.query.filter_by(grupo=current_user.grupo, cargo='1').all()
    lista_estag = Usuarios.query.filter_by(grupo=current_user.grupo, cargo='2', status=True).all()
    lista_estag_count = Usuarios.query.filter_by(grupo=current_user.grupo, cargo='2', status=True).count()
    botao_vagas = 'disabled' if lista_estag_count >= grupo_info.vagas_estagiarios else ''

    DIAS_DA_SEMANA = {
        0: 'Domingo', 1: 'Segunda-feira', 2: 'Terça-feira', 3: 'Quarta-feira',
        4: 'Quinta-feira', 5: 'Sexta-feira', 6: 'Sábado'
    }
    reunioes = ReuniaoGrupos.query.filter_by(id_grupo=current_user.grupo).all()
    reunioes_json = [
        {
            'id_reuniaogrupos': r.id_reuniaogrupos,
            'dia': DIAS_DA_SEMANA.get(r.dia, 'Desconhecido'),
            'hora_inicio': r.hora_inicio.strftime('%H:%M:%S'),
            'hora_fim': r.hora_fim.strftime('%H:%M:%S')
        }
        for r in reunioes
    ]

    return jsonify({
    'grupo_info': {
        'id_grupo': grupo_info.id_grupo,
        'titulo': grupo_info.titulo,
        'vagas_estagiarios': grupo_info.vagas_estagiarios,
        'local': grupo_info.local,
        'convenio': grupo_info.convenio,
        'resumo': grupo_info.resumo,
        'objetivos': grupo_info.objetivos,
        'atividades': grupo_info.atividades,
        'bibliografia': grupo_info.bibliografia
    },
    'coordenadores': [{'id': c.id_usuario, 'nome': c.nome} for c in lista_coord],
    'estagiarios': [{'id': e.id_usuario, 'nome': e.nome} for e in lista_estag],
    'estagiarios_count': lista_estag_count,
    'botao_vagas': botao_vagas,
    'reunioes': reunioes_json
})

@app.route('/api/reg_estag_diretamente', methods=['POST'])
@login_required
def api_reg_estag_diretamente():
    data = request.get_json()
    nome = data.get('nome')
    email = data.get('email')
    senha = generate_password_hash(data.get('senha')).decode('utf-8')
    matricula = data.get('matricula')
    cargo = data.get('cargo')
    grupo = data.get('grupo')
    status = True
    criado_em = data.get('criado_em')
    valido_ate = data.get('valido_ate')

    aux_email = Usuarios.query.filter_by(email=email).first()
    if aux_email:
        return jsonify({'success': False, 'message': 'Email já cadastrado.'}), 400

    estag_novo = Usuarios(
        matricula=matricula, nome=nome, email=email, senha=senha, cargo=cargo,
        grupo=grupo, status=status, criado_em=criado_em, valido_ate=valido_ate
    )
    db.session.add(estag_novo)
    db.session.commit()
    return jsonify({'success': True, 'message': 'Estagiário registrado com sucesso.'}), 201

@app.route('/api/adicionar_reuniao', methods=['POST'])
@login_required
def api_adicionar_reuniao():
    data = request.get_json()
    id_grupo = data.get('id_grupo')
    diaReuniao = data.get('diaReuniao')
    horainiReuniao = data.get('horainiReuniao')
    horafimReuniao = data.get('horafimReuniao')

    if not diaReuniao or not horainiReuniao or not horafimReuniao:
        return jsonify({'success': False, 'message': 'Dados faltando.'}), 400

    reuniao_existe = ReuniaoGrupos.query.filter(
        ReuniaoGrupos.dia == diaReuniao,
        ReuniaoGrupos.hora_inicio <= horafimReuniao,
        ReuniaoGrupos.hora_fim >= horainiReuniao
    ).first()

    if reuniao_existe:
        return jsonify({'success': False, 'message': 'Já existe uma reunião nesse horário.'}), 400

    nova_reuniao = ReuniaoGrupos(
        id_grupo=id_grupo, dia=diaReuniao,
        hora_inicio=horainiReuniao, hora_fim=horafimReuniao
    )
    db.session.add(nova_reuniao)
    db.session.commit()
    return jsonify({
        'success': True,
        'id_grupo': id_grupo,
        'diaR': diaReuniao,
        'horainiR': horainiReuniao,
        'horafimR': horafimReuniao,
        'idRe': nova_reuniao.id_reuniaogrupos
    }), 201

@app.route('/api/remover_reuniao', methods=['POST'])
@login_required
def api_remover_reuniao():
    data = request.get_json()
    id_reuniao_grupo = data.get('id_reuniao_grupo')
    if id_reuniao_grupo:
        ReuniaoGrupos.query.filter_by(id_reuniaogrupos=id_reuniao_grupo).delete()
        db.session.commit()
        return jsonify({'success': True})
    return jsonify({'success': False, 'message': 'ID enviado está com problema!'}), 400

@app.route('/api/sup_meu_estagiario/<int:id_estagiario>', methods=['GET'])
@login_required
def api_sup_meu_estagiario(id_estagiario):
    estagiario_info = Usuarios.query.filter_by(id_usuario=id_estagiario).first()
    pacientes_info = Pacientes.query.filter_by(id_estagiario=estagiario_info.id_usuario).all()
    media_idade = db.session.query(func.avg(Pacientes.idade)).filter_by(id_estagiario=estagiario_info.id_usuario).scalar() or 0
    quantidade_fichas = FolhaEvolucao.query.filter_by(id_estagiario=estagiario_info.id_usuario).count()
    quantidade_consultas = Consultas.query.filter_by(id_usuario=estagiario_info.id_usuario, status='Realizado').count()
    consultas_realizadas = Consultas.query.filter_by(id_usuario=estagiario_info.id_usuario, status='Realizado').all()
    total_horas_consultas = sum([
        (consulta.hora_fim.hour - consulta.hora_inicio.hour) +
        (consulta.hora_fim.minute - consulta.hora_inicio.minute) / 60.0
        for consulta in consultas_realizadas
    ]) or 0

    # ...existing code...
    return jsonify({
        'estagiario_info': {
            'id': estagiario_info.id_usuario,
            'nome': estagiario_info.nome,
            'email': estagiario_info.email,
            'matricula': estagiario_info.matricula,
            'criado_em': estagiario_info.criado_em.strftime('%Y-%m-%d') if estagiario_info.criado_em else '',
            'valido_ate': estagiario_info.valido_ate.strftime('%Y-%m-%d') if estagiario_info.valido_ate else '',
            'avatar_url': f'/api/uploads/usuarios/{estagiario_info.id_usuario}'
        },
        'pacientes_info': [
            {
                'id_paciente': p.id_paciente,
                'nome_completo': p.nome_completo,
                'status': p.status
            } for p in pacientes_info
        ],
        'media_idade': media_idade,
        'quantidade_fichas': quantidade_fichas,
        'quantidade_consultas': quantidade_consultas,
        'total_horas_consultas': total_horas_consultas
    })

@app.route('/api/sup_primeira_estatistica_estagiario/<int:id_estagiario>', methods=['GET'])
@login_required
def api_sup_primeira_estatistica_estagiario(id_estagiario):
    pacientes = Pacientes.query.filter_by(id_estagiario=id_estagiario).all()
    idades = [p.idade for p in pacientes]
    return jsonify(idades)

@app.route('/api/sup_segunda_estatistica_estagiario/<int:id_estagiario>', methods=['GET'])
@login_required
def api_sup_segunda_estatistica_estagiario(id_estagiario):
    pacientes = Pacientes.query.filter_by(id_estagiario=id_estagiario).all()
    generos = {'M': 0, 'F': 0}
    for p in pacientes:
        if p.sexo in generos:
            generos[p.sexo] += 1
    return jsonify(generos)

@app.route('/api/sup_terceira_estatistica_estagiario/<int:id_estagiario>', methods=['GET'])
@login_required
def api_sup_terceira_estatistica_estagiario(id_estagiario):
    pacientes = Pacientes.query.filter_by(id_estagiario=id_estagiario).all()
    escolaridade = {}
    for p in pacientes:
        if p.escolaridade in escolaridade:
            escolaridade[p.escolaridade] += 1
        else:
            escolaridade[p.escolaridade] = 1
    return jsonify(escolaridade)

@app.route('/api/sup_quarta_estatistica_estagiario/<int:id_estagiario>', methods=['GET'])
@login_required
def api_sup_quarta_estatistica_estagiario(id_estagiario):
    pacientes = Pacientes.query.filter_by(id_estagiario=id_estagiario).all()
    rendas = {
        '<2000': 0,
        '2000-3000': 0,
        '3000-4000': 0,
        '4000-5000': 0,
        '>5000': 0
    }
    for p in pacientes:
        if p.renda_familiar < 2000:
            rendas['<2000'] += 1
        elif 2000 <= p.renda_familiar < 3000:
            rendas['2000-3000'] += 1
        elif 3000 <= p.renda_familiar < 4000:
            rendas['3000-4000'] += 1
        elif 4000 <= p.renda_familiar < 5000:
            rendas['4000-5000'] += 1
        else:
            rendas['>5000'] += 1
    return jsonify(rendas)

@app.route('/api/sup_ficha_paciente/<int:id>', methods=['GET'])
@login_required
def api_sup_ficha_paciente(id):
    dados_paciente = Pacientes.query.filter_by(id_paciente=id).first()
    estagiario = Usuarios.query.filter_by(id_usuario=dados_paciente.id_estagiario).first()
    supervisor = Usuarios.query.filter_by(id_usuario=dados_paciente.id_supervisor).first()
    tags = [{
        'id_tag': pt.tag.id_tag,
        'nome': pt.tag.nome
    } for pt in dados_paciente.tags_rel]


    paciente_json = {
        'id_paciente': dados_paciente.id_paciente,
        'nome_completo': dados_paciente.nome_completo,
        'nome_responsavel': dados_paciente.nome_responsavel,
        'grau_parentesco': dados_paciente.grau_parentesco,
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
        'acesso_liberado': dados_paciente.acesso_liberado
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
    
    # 3. Monta o JSON das folhas SEM TENTAR DESCRIPTOGRAFAR
    folhas_pacientes = []
    for folha in folhas_db:
        folha_json = {
            'id_folha': folha.id_folha,
            'id_paciente': folha.id_paciente,
            'id_estagiario': folha.id_estagiario,
            'nome_estagiario': folha.estagiario.nome if folha.estagiario else 'Desconhecido',
            'id_supervisor': folha.id_supervisor,
            'nome_supervisor': folha.supervisor.nome if folha.supervisor else 'Desconhecido',
            'data_postagem': str(folha.data_postagem),
            'numero_sessao': folha.numero_sessao,
            'status_validacao': folha.status_validacao,
            'feedback': folha.feedback,
            'data_status': str(folha.data_status) if folha.data_status else None,
            
            # Lendo os campos diretamente do banco (agora em texto plano)
            'hipotese_diagnostica': folha.hipotese_diagnostica,
            'sintomas_atuais': folha.sintomas_atuais,
            'intervencoes_realizadas': folha.intervencoes_realizadas,
            'evolucao_clinica': folha.evolucao_clinica,
            'plano_proxima_sessao': folha.plano_proxima_sessao,
            'observacoes': folha.observacoes,
            'valor': str(folha.valor) if folha.valor else None,
        }
        folhas_pacientes.append(folha_json)

    return jsonify({
        'paciente': paciente_json,
        'folhas_pacientes': folhas_pacientes
    })

@app.route('/api/sup_check_ficha/<int:id>', methods=['POST'])
@login_required
def api_sup_check_ficha(id):
    folha = FolhaEvolucao.query.get_or_404(id)
    folha.check_supervisor = f"{current_user.id_usuario}+{current_user.nome}"
    # Ajuste UTC-3
    folha.data_check_supervisor = (datetime.utcnow() - timedelta(hours=3)).replace(microsecond=0)
    db.session.commit()
    return jsonify({
        'revisor': current_user.nome,
        'data_revisao': folha.data_check_supervisor.strftime('%d/%m/%Y %H:%M:%S')
    })
@app.route('/api/sup_atribuir_estagiario/<int:id_paciente>', methods=['POST'])
@login_required
def sup_atribuir_estagiario(id_paciente):
    # 1. Controle de Acesso: Garante que apenas supervisores (cargo '1') podem usar esta rota
    if current_user.cargo != 1:
        return jsonify({'message': 'Acesso não autorizado'}), 403

    try:
        paciente = Pacientes.query.get_or_404(id_paciente)
        data = request.get_json()
        id_estagiario_novo = data.get('id_estagiario')

        # 2. REGRA DE NEGÓCIO: O supervisor só pode alterar pacientes que ele já supervisiona
        if paciente.id_supervisor != current_user.id_usuario:
            return jsonify({'message': 'Este paciente não pertence ao seu grupo de supervisão.'}), 403

        # 3. REGRA DE NEGÓCIO: Valida se o estagiário a ser atribuído pertence ao mesmo grupo do supervisor
        # (Permite que id_estagiario_novo seja None ou "" para desatribuir)
        if id_estagiario_novo:
            estagiario = Usuarios.query.get(id_estagiario_novo)
            if not estagiario or estagiario.grupo != current_user.grupo:
                return jsonify({'message': 'Estagiário inválido ou não pertence ao seu grupo.'}), 400

        # 4. Se tudo estiver ok, faz a atualização
        # A lógica 'or None' converte uma string vazia "" para None (NULL no banco)
        paciente.id_estagiario = id_estagiario_novo or None
        
        db.session.commit()

        # 5. IMPORTANTE: Limpa o cache da ficha deste paciente para que a mudança apareça
        cache.delete(f'ficha_paciente_{id_paciente}')

        return jsonify({'status': 'success', 'message': 'Estagiário atribuído com sucesso!'})

    except Exception as e:
        db.session.rollback()
        print(f"ERRO AO ATRIBUIR ESTAGIÁRIO: {e}")
        return jsonify({'message': f'Ocorreu um erro interno: {e}'}), 500
    
@app.route('/api/sup_estagiarios_do_grupo', methods=['GET'])
@login_required
def sup_estagiarios_do_grupo():
    # Garante que apenas supervisores (cargo '1') e talvez coordenadores ('3') possam acessar
    if current_user.cargo not in [1, 3]:
        return jsonify({'message': 'Acesso não autorizado'}), 403

    # Busca todos os usuários com cargo '2' (Estagiário) que pertencem ao mesmo grupo do supervisor
    # e que estão com status 'true'
    estagiarios = Usuarios.query.filter_by(
        grupo=current_user.grupo, 
        cargo='2', 
        status='true'
    ).order_by(Usuarios.nome).all()
    
    # Cria uma lista de dicionários com id e nome para o <select> do frontend
    lista = [{'id': user.id_usuario, 'nome': user.nome} for user in estagiarios]
    
    return jsonify(lista)

@app.route('/api/sup_pacientes_supervisionados', methods=['GET'])
@login_required
def sup_pacientes_supervisionados():
    print("Acessando sup_pacientes_supervisionados com usuário:", current_user.cargo, current_user.id_usuario)
    if current_user.cargo != 1: # Garante que apenas supervisores acessem
        return jsonify({'message': 'Acesso não autorizado'}), 403

    # Usamos a query otimizada com 'aliased' e 'joinedload'
    Estagiario = aliased(Usuarios)
    
    # Busca pacientes que pertencem a este supervisor
    pacientes_db = Pacientes.query\
    .filter_by(id_supervisor=current_user.id_usuario)\
    .options(
        joinedload(Pacientes.estagiario.of_type(Estagiario))
    )\
    .order_by(Pacientes.nome_completo)\
    .all()
    
    lista_pacientes = []
    for paciente in pacientes_db:
        lista_pacientes.append({
            'id_paciente': paciente.id_paciente,
            'nome_completo': paciente.nome_completo,
            'status': paciente.status,
            'id_estagiario': paciente.id_estagiario,
            'estagiario_nome': paciente.estagiario.nome if paciente.estagiario else None,
        })
    
    return jsonify(lista_pacientes)

@app.route('/api/dashboard_coordenacao', methods=['POST'])
@login_required
def api_dashboard_coordenacao():
    return jsonify({'status': 'success'})

@app.route('/api/sup_pacientes_para_assumir', methods=['GET'])
@login_required
def sup_pacientes_para_assumir():
    """
    Lista pacientes para um supervisor assumir ou gerenciar.
    Critérios:
    1. Paciente não tem supervisor.
    2. Paciente já é supervisionado pelo supervisor logado.
    """
    if current_user.cargo != 1:
        return jsonify({'message': 'Acesso não autorizado'}), 403

    Estagiario = aliased(Usuarios)
    Supervisor = aliased(Usuarios)

    pacientes_query = Pacientes.query\
        .outerjoin(Estagiario, Pacientes.id_estagiario == Estagiario.id_usuario)\
        .outerjoin(Supervisor, Pacientes.id_supervisor == Supervisor.id_usuario)\
        .filter(
            or_(
                Pacientes.id_supervisor == None,
                Pacientes.id_supervisor == current_user.id_usuario
            )
        )\
        .add_columns(
            Pacientes.id_paciente,
            Pacientes.nome_completo,
            Pacientes.idade,
            Pacientes.motivo,
            Estagiario.nome.label('estagiario_nome'),
            Supervisor.nome.label('supervisor_nome')
        ).order_by(Pacientes.data_criacao.desc()).all()

    pacientes_disponiveis = [
        {'id_paciente': p.id_paciente, 'nome_completo': p.nome_completo, 'idade': p.idade, 'motivo': p.motivo, 'estagiario_nome': p.estagiario_nome, 'supervisor_nome': p.supervisor_nome}
        for p in pacientes_query
    ]

    return jsonify(pacientes_disponiveis)

@app.route('/api/sup_assumir_ou_atualizar_paciente/<int:id_paciente>', methods=['POST'])
@login_required
def sup_assumir_ou_atualizar_paciente(id_paciente):
    if current_user.cargo != 1:
        return jsonify({'message': 'Acesso não autorizado'}), 403

    paciente = Pacientes.query.get_or_404(id_paciente)
    data = request.get_json()
    id_estagiario_novo = data.get('id_estagiario') or None

    # Define o supervisor atual como o supervisor do paciente
    paciente.id_supervisor = current_user.id_usuario
    # Atribui o estagiário (ou remove a atribuição se for None)
    paciente.id_estagiario = id_estagiario_novo

    db.session.commit()
    return jsonify({'status': 'success', 'message': 'Paciente atualizado com sucesso!'})

@app.route('/api/sup_alternar_acesso_pasta/<int:id_paciente>', methods=['POST'])
@login_required
def sup_alternar_acesso_pasta(id_paciente):
    if current_user.cargo != 1:
        return jsonify({'message': 'Acesso não autorizado'}), 403

    paciente = Pacientes.query.get_or_404(id_paciente)
    if paciente.id_supervisor != current_user.id_usuario:
        return jsonify({'message': 'Este paciente não pertence ao seu grupo.'}), 403

    paciente.acesso_liberado = not paciente.acesso_liberado
    db.session.commit()
    cache.delete(f'ficha_paciente_{id_paciente}')
    
    return jsonify({'status': 'success', 'novo_status': paciente.acesso_liberado})

@app.route('/api/sup_listar_solicitacoes_acesso', methods=['GET'])
@login_required
def sup_listar_solicitacoes_acesso():
    if current_user.cargo != 1:
        return jsonify({'message': 'Acesso não autorizado'}), 403
    
    solicitacoes = SolicitacaoAcesso.query.filter_by(
        id_supervisor=current_user.id_usuario,
        status='pendente'
    ).order_by(SolicitacaoAcesso.data_solicitacao.desc()).all()

    return jsonify([s.to_dict() for s in solicitacoes])

@app.route('/api/sup_responder_solicitacao_acesso/<int:id_solicitacao>', methods=['POST'])
@login_required
def sup_responder_solicitacao_acesso(id_solicitacao):
    if current_user.cargo != 1:
        return jsonify({'message': 'Acesso não autorizado'}), 403

    solicitacao = SolicitacaoAcesso.query.get_or_404(id_solicitacao)
    if solicitacao.id_supervisor != current_user.id_usuario:
        return jsonify({'message': 'Solicitação não pertence a este supervisor.'}), 403

    data = request.get_json()
    acao = data.get('acao') # 'aprovar' ou 'rejeitar'

    if acao == 'aprovar':
        solicitacao.status = 'aprovado'
        solicitacao.data_resposta = datetime.utcnow() - timedelta(hours=3)
        
        paciente = Pacientes.query.get(solicitacao.id_paciente)
        if paciente:
            paciente.acesso_liberado = True
            cache.delete(f'ficha_paciente_{paciente.id_paciente}')
            
    elif acao == 'rejeitar':
        solicitacao.status = 'rejeitado'
        solicitacao.data_resposta = datetime.utcnow() - timedelta(hours=3)
    else:
        return jsonify({'message': 'Ação inválida.'}), 400

    db.session.commit()
    return jsonify({'status': 'success', 'message': f'Solicitação {acao} com sucesso.'})

@app.route('/api/sup_validar_folha/<int:id_folha>', methods=['POST'])
@login_required
def sup_validar_folha(id_folha):
    data = request.get_json()
    status = data.get('status')
    feedback = data.get('feedback', '')

    folha = FolhaEvolucao.query.get_or_404(id_folha)
    folha.status_validacao = status
    folha.feedback = feedback
    # Ajuste UTC-3
    folha.data_status = datetime.utcnow() - timedelta(hours=3)

    db.session.commit()
    return jsonify({'message': 'Folha validada com sucesso!'})

@app.route('/api/tags', methods=['GET'])
@login_required
def api_get_all_tags():
    """ Retorna todas as tags cadastradas no sistema. """
    tags = Tag.query.order_by(Tag.nome).all()
    return jsonify([{'id_tag': tag.id_tag, 'nome': tag.nome} for tag in tags])

@app.route('/api/tags', methods=['POST'])
@login_required
def api_create_tag():
    """ Cria uma nova tag. """
    data = request.get_json()
    nome_tag = data.get('nome')
    if not nome_tag:
        return jsonify({'message': 'O nome da tag é obrigatório.'}), 400

    # Verifica se a tag já existe (ignorando maiúsculas/minúsculas)
    tag_existente = Tag.query.filter(func.lower(Tag.nome) == func.lower(nome_tag)).first()
    if tag_existente:
        return jsonify({'message': 'Essa tag já existe.'}), 409

    nova_tag = Tag(nome=nome_tag)
    db.session.add(nova_tag)
    db.session.commit()
    return jsonify({'id_tag': nova_tag.id_tag, 'nome': nova_tag.nome}), 201

@app.route('/api/paciente/<int:id_paciente>/tags', methods=['PUT'])
@login_required
def api_update_paciente_tags(id_paciente):
    """ Atualiza as tags de um paciente. """
    paciente = Pacientes.query.get_or_404(id_paciente)
    data = request.get_json()
    tag_ids = data.get('tag_ids', [])

    # REGRA DE NEGÓCIO: Apenas o supervisor do paciente pode alterar as tags
    if paciente.id_supervisor != current_user.id_usuario:
        return jsonify({'message': 'Acesso não autorizado para alterar tags deste paciente.'}), 403

    # 1. Remove todas as tags atuais do paciente
    PacienteTag.query.filter_by(id_paciente=id_paciente).delete()

    # 2. Adiciona as novas tags selecionadas
    for tag_id in tag_ids:
        nova_associacao = PacienteTag(id_paciente=id_paciente, id_tag=tag_id)
        db.session.add(nova_associacao)

    db.session.commit()
    cache.delete(f'ficha_paciente_{id_paciente}') # Limpa o cache para refletir a mudança

    return jsonify({'message': 'Tags do paciente atualizadas com sucesso.'})

@app.route('/api/paciente/<int:id_paciente>/intervalo', methods=['PUT'])
@login_required
def api_update_paciente_intervalo(id_paciente):
    """ Atualiza o intervalo de atendimento de um paciente. """
    paciente = Pacientes.query.get_or_404(id_paciente)
    data = request.get_json()
    intervalo = data.get('intervalo')

    # REGRA DE NEGÓCIO: Apenas o supervisor do paciente pode alterar o intervalo
    if paciente.id_supervisor != current_user.id_usuario:
        return jsonify({'message': 'Acesso não autorizado para alterar o intervalo deste paciente.'}), 403

    # Atualiza o campo no banco de dados
    paciente.intervalo_sessoes = intervalo
    db.session.commit()

    # Limpa o cache para que a mudança seja refletida imediatamente em qualquer lugar
    # que consuma os dados da ficha do paciente.
    cache.delete(f'ficha_paciente_{id_paciente}')

    return jsonify({'message': 'Intervalo de atendimento atualizado com sucesso.'})