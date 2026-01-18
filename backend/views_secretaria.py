from flask import  jsonify, request, session, flash, url_for, send_from_directory
from main import app, db, mail
from models import Usuarios, Grupos, Pacientes, Alertas, ReuniaoGrupos, Consultas, FolhaEvolucao, TrocaSupervisao, Tag, PacienteTag
from helpers import FormularioInscricao, FormularioGrupo, FormularioPaciente, FormularioAlerta, recupera_imagem_pacientes, deleta_imagem_pacientes
from sqlalchemy import text, func
from flask_login import login_required, current_user
from flask_bcrypt import check_password_hash, generate_password_hash
from flask_mail import Message
import random, json, time, os, base64
from datetime import datetime, date, timedelta
import base64
import re
import os
from sqlalchemy.orm import joinedload, aliased


@app.route('/api/trocas_pendentes', methods=['GET'])
@login_required
def trocas_pendentes():
    """
    Lista solicitações pendentes (acesso reservado à secretaria).
    Ajuste a checagem de cargo conforme sua aplicação (aqui assumo cargo == '0' para secretaria).
    """
    print(current_user.cargo)
    if (current_user.cargo != 0):
        return jsonify({'status': 'error', 'message': 'Acesso não autorizado.'}), 403

    trocas = TrocaSupervisao.query.filter_by(status='pendente').order_by(TrocaSupervisao.data_solicitacao.asc()).all()
    return jsonify([t.to_dict() for t in trocas])


@app.route('/api/secretaria_responder_troca/<int:id_troca>', methods=['POST'])
@login_required
def secretaria_responder_troca(id_troca):
    """
    Secretaria aprova ou rejeita a solicitação.
    Body (json or form): action = 'aprovar' | 'rejeitar'
    Se aprovar e levar_pacientes == True, atualiza todos os pacientes do estagiário para o novo supervisor.
    Também tenta atualizar o campo de supervisor do usuário estagiário se existir.
    """
    if (current_user.cargo != 0):
        return jsonify({'status': 'error', 'message': 'Acesso não autorizado.'}), 403

    data = request.get_json() or request.form
    action = (data.get('action') or '').lower()
    if action not in ('aprovar', 'rejeitar'):
        return jsonify({'status': 'error', 'message': "Parâmetro 'action' deve ser 'aprovar' ou 'rejeitar'."}), 400

    troca = TrocaSupervisao.query.get_or_404(id_troca)

    try:
        if action == 'aprovar':
            troca.status = 'aprovada'
            troca.id_aprovador = current_user.id_usuario
            troca.data_resposta = date.today()

            # buscar supervisor novo para obter seu grupo
            supervisor_novo = Usuarios.query.get(troca.id_supervisor_novo)
            if not supervisor_novo:
                return jsonify({'status': 'error', 'message': 'Supervisor não encontrado.'}), 404
            
            # atualizar grupo do estagiário para o grupo do supervisor novo
            estagiario = Usuarios.query.get(troca.id_estagiario)
            if estagiario:
                estagiario.grupo = supervisor_novo.grupo
                db.session.add(estagiario)

            # se pediu para levar pacientes, atualiza o grupo dos pacientes também
            if troca.levar_pacientes:
                pacientes = Pacientes.query.filter_by(id_estagiario=troca.id_estagiario).all()
                for p in pacientes:
                    p.id_supervisor = supervisor_novo.id_usuario
                    db.session.add(p)

        else:  # rejeitar
            troca.status = 'rejeitada'
            troca.id_aprovador = current_user.id_usuario
            troca.data_resposta = date.today()

        db.session.add(troca)
        db.session.commit()
        return jsonify({'status': 'success', 'message': f'Troca {action}da com sucesso.'})
    except Exception as e:
        db.session.rollback()
        print(f'ERRO secretaria_responder_troca: {e}')
        return jsonify({'status': 'error', 'message': str(e)}), 500
# Consultas da secretaria
@app.route('/api/consulta_secretaria', methods=['GET'])
@login_required
def api_consulta_secretaria():
    gruposId = request.args.get('gruposId')
    consultas_serializadas = []

    if gruposId:
        consulta_estag = db.session.query(Consultas, Usuarios.nome).join(
            Usuarios, Consultas.id_usuario == Usuarios.id_usuario
        ).filter(Consultas.id_grupo == gruposId).all()
    else:
        consulta_estag = db.session.query(Consultas, Usuarios.nome).join(
            Usuarios, Consultas.id_usuario == Usuarios.id_usuario
        ).all()
    for consulta, nome_usuario in consulta_estag:
        start_datetime = datetime.combine(consulta.dia, consulta.hora_inicio).isoformat()
        end_datetime = datetime.combine(consulta.dia, consulta.hora_fim).isoformat()
        consulta_dict = {
            'id': consulta.id_consulta,
            'title': nome_usuario,
            'start': start_datetime,
            'end': end_datetime,
            'color': consulta.cor,
            'status': consulta.status,
        }
        consultas_serializadas.append(consulta_dict)

    return jsonify(consultas_serializadas)

@app.route('/api/consulta_ids_grupos', methods=['GET'])
@login_required
def api_consulta_ids_grupos():
    grupos = Grupos.query.order_by(Grupos.id_grupo.asc()).all()
    grupos_json = [{'id_grupo': grupo.id_grupo, 'titulo': grupo.titulo} for grupo in grupos]
    return jsonify(grupos_json)

# Administração de usuários
@app.route('/api/usuarios', methods=['GET'])
@login_required
def api_usuarios():
    lista = Usuarios.query.all()
    usuarios_json = [
        {
            'id': u.id_usuario,
            'nome': u.nome,
            'email': u.email,
            'matricula': u.matricula,
            'cargo': u.cargo,
            'grupo': u.grupo,
            'status': u.status,
            'criado_em': str(u.criado_em),
            'valido_ate': str(u.valido_ate)
        } for u in lista
    ]
    return jsonify(usuarios_json)

@app.route('/api/alterar_validade_usuario/<int:id>', methods=['POST'])
@login_required
def api_alterar_validade_usuario(id):
    usuario = Usuarios.query.filter_by(id_usuario=id).first()
    if not usuario:
        return jsonify({'success': False, 'message': 'Usuário não encontrado'}), 404

    # Ajuste UTC-3 para garantir a data correta (Brasília)
    hoje = (datetime.utcnow() - timedelta(hours=3)).date()
    base_date = usuario.valido_ate if usuario.valido_ate and usuario.valido_ate >= hoje else hoje

    match usuario.cargo:
        case 0:
            nova_validade = base_date + timedelta(days=910)
        case 1:
            nova_validade = base_date + timedelta(days=1820)
        case 2:
            nova_validade = base_date + timedelta(days=182)
        case 3:
            nova_validade = base_date + timedelta(days=1820)
        case _:
            nova_validade = base_date + timedelta(days=182)

    usuario.valido_ate = nova_validade
    db.session.commit()
    return jsonify({'success': True, 'valido_ate': str(usuario.valido_ate)})

@app.route('/api/alterar_status_usuario/<int:id>', methods=['POST'])
@login_required
def api_alterar_status_usuario(id):
    usuario = Usuarios.query.filter_by(id_usuario=id).first()
    if not usuario:
        return jsonify({'success': False, 'message': 'Usuário não encontrado'}), 404

    usuario.status = not usuario.status
    db.session.commit()
    return jsonify({'success': True, 'status': usuario.status})

@app.route('/api/registrar_usuario', methods=['POST'])
@login_required
def api_registrar_usuario():
    data = request.get_json()
    nome = data.get('nome')
    email = data.get('email')

    if Usuarios.query.filter_by(email=email).first():
        return jsonify({'success': False, 'message': 'Email já cadastrado.'}), 400

    senha = generate_password_hash(data.get('senha')).decode('utf-8')
    matricula = data.get('matricula')
    cargo = int(data.get('cargo'))
    grupo = data.get('grupo') or None
    status = True
    criado_em = data.get('criado_em')
    valido_ate = data.get('valido_ate')

    user = Usuarios(
        matricula=matricula, nome=nome, email=email, senha=senha,
        cargo=cargo, grupo=grupo, status=status,
        criado_em=criado_em, valido_ate=valido_ate
    )
    db.session.add(user)
    db.session.commit()
    return jsonify({'success': True, 'message': 'Usuário registrado com sucesso.'}), 201

# Administração de grupos
@app.route('/api/grupos', methods=['GET'])
@login_required
def api_grupos():
    lista_grupos = Grupos.query.order_by(Grupos.id_grupo).all()
    grupos_json = [
        {
            'id_grupo': g.id_grupo,
            'titulo': g.titulo,
            'vagas_estagiarios': g.vagas_estagiarios,
            'convenio': g.convenio,
            'local': g.local,
            'resumo': g.resumo,
            'objetivos': g.objetivos,
            'atividades': g.atividades,
            'bibliografia': g.bibliografia
        } for g in lista_grupos
    ]
    return jsonify(grupos_json)

@app.route('/api/atualizar_vaga_grupo', methods=['POST'])
@login_required
def api_atualizar_vaga_grupo():
    data = request.get_json()
    grupo_id = data.get('id')
    novas_vagas = data.get('vagas_estagiarios')

    if grupo_id is None or novas_vagas is None:
        return jsonify({'success': False, 'message': 'Dados inválidos'}), 400

    grupo = Grupos.query.get(grupo_id)
    if grupo:
        grupo.vagas_estagiarios = novas_vagas
        db.session.commit()
        return jsonify({'success': True})
    else:
        return jsonify({'success': False, 'message': 'Algo ocorreu com o grupo.'}), 404

@app.route('/api/cadastrar_grupo', methods=['POST'])
@login_required
def api_cadastrar_grupo():
    data = request.get_json()
    titulo = data.get('titulo')
    vagas_estagiarios = data.get('vagas_estagiarios')
    convenio = data.get('convenio')
    local = data.get('local')
    resumo = data.get('resumo')
    objetivos = data.get('objetivos')
    atividades = data.get('atividades')
    bibliografia = data.get('bibliografia')

    novo_grupo = Grupos(
        titulo=titulo, vagas_estagiarios=vagas_estagiarios, convenio=convenio, local=local,
        resumo=resumo, objetivos=objetivos, atividades=atividades, bibliografia=bibliografia
    )
    db.session.add(novo_grupo)
    db.session.commit()
    return jsonify({'success': True, 'id_grupo': novo_grupo.id_grupo}), 201

@app.route('/api/editar_grupo/<int:id>', methods=['GET'])
@login_required
def api_editar_grupo(id):
    grupo = Grupos.query.filter_by(id_grupo=id).first()
    if not grupo:
        return jsonify({'success': False, 'message': 'Grupo não encontrado'}), 404

    grupo_json = {
        'id_grupo': grupo.id_grupo,
        'titulo': grupo.titulo,
        'vagas_estagiarios': grupo.vagas_estagiarios,
        'convenio': grupo.convenio,
        'local': grupo.local,
        'resumo': grupo.resumo,
        'objetivos': grupo.objetivos,
        'atividades': grupo.atividades,
        'bibliografia': grupo.bibliografia
    }
    return jsonify(grupo_json)

@app.route('/api/atualizar_grupo', methods=['POST'])
@login_required
def api_atualizar_grupo():
    data = request.get_json()
    grupo_id = data.get('id_grupo')
    grupo = Grupos.query.filter_by(id_grupo=grupo_id).first()
    if not grupo:
        return jsonify({'success': False, 'message': 'Grupo não encontrado'}), 404

    grupo.titulo = data.get('titulo')
    grupo.vagas_estagiarios = data.get('vagas_estagiarios')
    grupo.convenio = data.get('convenio')
    grupo.local = data.get('local')
    grupo.resumo = data.get('resumo')
    grupo.objetivos = data.get('objetivos')
    grupo.atividades = data.get('atividades')
    grupo.bibliografia = data.get('bibliografia')

    db.session.commit()
    return jsonify({'success': True})

# Administração de pacientes
# No seu arquivo de rotas Flask

@app.route('/api/adicionar_paciente_secretaria', methods=['POST'])
@login_required
def adicionar_paciente_secretaria():
    data = request.form

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
    
    try:
        novo_paciente = Pacientes(
            nome_completo=data.get('nome_completo'),
            idade=to_int_or_none(data.get('idade')),
            celular1=data.get('celular1'),
            
            id_supervisor=to_int_or_none(data.get('id_supervisor')),
            nome_responsavel=data.get('nome_responsavel') or None,
            grau_parentesco=data.get('grau_parentesco') or None,
            data_nascimento=to_date_or_none(data.get('data_nascimento')),
            sexo=data.get('sexo') or None,
            escolaridade=data.get('escolaridade') or None,
            profissao=data.get('profissao') or None,
            ocupacao=data.get('ocupacao') or None,
            salario=to_numeric_or_none(data.get('salario')),
            renda_familiar=to_numeric_or_none(data.get('renda_familiar')),
            email=data.get('email') or None,
            cep=to_int_or_none(data.get('cep')),
            cidade=data.get('cidade') or None,
            bairro=data.get('bairro') or None,
            logradouro=data.get('logradouro') or None,
            complemento=data.get('complemento') or None,
            telefone=data.get('telefone') or None,
            celular2=data.get('celular2') or None,
            origem_encaminhamento=data.get('origem_encaminhamento') or None,
            nome_instituicao=data.get('nome_instituicao') or None,
            nome_resp_encaminhamento=data.get('nome_resp_encaminhamento') or None,
            motivo=data.get('motivo') or None,
            medicamentos=data.get('medicamentos') or None,
            intervalo_sessoes=data.get('intervalo_sessoes') or None,
            hipotese_diagnostica=data.get('hipotese_diagnostica') or None,
            ja_fez_terapia=to_bool_or_none(data.get('ja_fez_terapia')),
            etnia=data.get('etnia') or None,
            genero=data.get('genero') or None,
            classe_social=data.get('classe_social') or None,

            status=True,
            data_criacao=date.today(),
        )

        db.session.add(novo_paciente)
        db.session.flush()

        if 'imagem_paciente' in request.files:
            imagem = request.files['imagem_paciente']
            if imagem.filename != '':
                upload_path = app.config['UPLOAD_PACIENTES_PATH']
                filename = f'paciente_{novo_paciente.id_paciente}.jpg'
                
                deleta_imagem_pacientes(novo_paciente.id_paciente)
                
                imagem.save(os.path.join(upload_path, filename))

        db.session.commit()

        return jsonify({'status': 'success', 'id_paciente': novo_paciente.id_paciente})

    except Exception as e:
        db.session.rollback()
        print(f"ERRO AO CRIAR PACIENTE: {e}")
        return jsonify({'message': f'Ocorreu um erro interno: {e}'}), 500




# Rota para buscar todos os SUPERVISORES disponíveis
@app.route('/api/lista_supervisores', methods=['GET'])
@login_required
def lista_supervisores():
    # Supondo que cargo '1' é Supervisor
    supervisores = Usuarios.query.filter_by(cargo='1', status='true').all()
    lista = [{'id': user.id_usuario, 'nome': user.nome, 'grupo': user.grupo} for user in supervisores]
    return jsonify(lista)

@app.route('/api/atribuir_supervisor_grupo', methods=['POST'])
@login_required
def atribuir_supervisor_grupo():
    data = request.get_json()
    id_supervisor = data.get('id_supervisor')
    id_grupo = data.get('id_grupo')
    
    supervisor = Usuarios.query.get(id_supervisor)
    if supervisor:
        supervisor.grupo = id_grupo
        db.session.commit()
        return jsonify({'success': True})
    return jsonify({'success': False, 'message': 'Supervisor não encontrado'}), 404

# Rota para buscar ESTAGIÁRIOS de um SUPERVISOR específico
@app.route('/api/lista_estagiarios_por_supervisor/<int:id_supervisor>', methods=['GET'])
@login_required
def lista_estagiarios_por_supervisor(id_supervisor):
    # Supondo que cargo '2' é Estagiário e 'grupo' liga estagiário ao supervisor
    supervisor = Usuarios.query.get(id_supervisor)
    if not supervisor:
        return jsonify([])
    
    estagiarios = Usuarios.query.filter_by(grupo=supervisor.grupo, cargo='2', status='true').all()
    lista = [{'id': user.id_usuario, 'nome': user.nome} for user in estagiarios]
    return jsonify(lista)

# Rota para ATRIBUIR um supervisor ou estagiário a um paciente
@app.route('/api/atribuir_paciente/<int:id_paciente>', methods=['POST'])
@login_required
def atribuir_paciente(id_paciente):
    paciente = Pacientes.query.get_or_404(id_paciente)
    data = request.get_json()
    
    if 'id_supervisor' in data:
        paciente.id_supervisor = data['id_supervisor']
    
    if 'id_estagiario' in data:
        paciente.id_estagiario = data['id_estagiario']
    
    db.session.commit()
    return jsonify({'status': 'success', 'message': 'Atribuição realizada com sucesso!'})

# @app.route('/api/pacientes', methods=['GET'])
# @login_required
# # Garanta que 'aliased' e 'joinedload' estão importados no topo do arquivo


@app.route('/api/pacientes', methods=['GET'])
@login_required
def api_pacientes():
    # Criamos "apelidos" para a tabela Usuarios para fazer o JOIN duas vezes
    Estagiario = aliased(Usuarios)
    Supervisor = aliased(Usuarios)

    # Query otimizada que busca Pacientes e faz JOIN com Usuarios para pegar os nomes
    # Usamos outerjoin para garantir que pacientes sem estagiário/supervisor ainda apareçam
    pacientes_db = Pacientes.query\
    .options(
        # O joinedload já vai criar os LEFT OUTER JOINs necessários
        joinedload(Pacientes.estagiario.of_type(Estagiario)),
        joinedload(Pacientes.supervisor.of_type(Supervisor))
    )\
    .order_by(Pacientes.nome_completo)\
    .all()
    
    lista_pacientes = []
    for paciente in pacientes_db:
        lista_pacientes.append({
            'id_paciente': paciente.id_paciente,
            'nome_completo': paciente.nome_completo,
            'status': paciente.status,
            'data_criacao': str(paciente.data_criacao.strftime('%Y-%m-%d')),
            
            # Agora os nomes e IDs estão disponíveis através dos relacionamentos
            'id_estagiario': paciente.id_estagiario,
            'estagiario_nome': paciente.estagiario.nome if paciente.estagiario else None,
            
            'id_supervisor': paciente.id_supervisor, # <-- CORRIGIDO: ID do supervisor adicionado
            'supervisor_nome': paciente.supervisor.nome if paciente.supervisor else None,
        })
    
    return jsonify(lista_pacientes)


@app.route('/api/editar_paciente/<int:id>', methods=['GET'])
@login_required
def api_editar_paciente(id):
    paciente = Pacientes.query.filter_by(id_paciente=id).first()
    if not paciente:
        return jsonify({'success': False, 'message': 'Paciente não encontrado'}), 404
    supervisor = Usuarios.query.get(paciente.id_supervisor)
    estagiario = Usuarios.query.get(paciente.id_estagiario)
    paciente_json = {
        'id_paciente': paciente.id_paciente,
        'nome_completo': paciente.nome_completo,
        'nome_responsavel': paciente.nome_responsavel,
        'grau_parentesco': paciente.grau_parentesco,
        'data_nascimento': str(paciente.data_nascimento),
        'idade': paciente.idade,
        'sexo': paciente.sexo,
        'escolaridade': paciente.escolaridade,
        'profissao': paciente.profissao,
        'ocupacao': paciente.ocupacao,
        'salario': paciente.salario,
        'renda_familiar': paciente.renda_familiar,
        'cep': paciente.cep,
        'cidade': paciente.cidade,
        'bairro': paciente.bairro,
        'logradouro': paciente.logradouro,
        'complemento': paciente.complemento,
        'telefone': paciente.telefone,
        'celular1': paciente.celular1,
        'celular2': paciente.celular2,
        'origem_encaminhamento': paciente.origem_encaminhamento,
        'nome_instituicao': paciente.nome_instituicao,
        'nome_resp_encaminhamento': paciente.nome_resp_encaminhamento,
        'motivo': paciente.motivo,
        'medicamentos': paciente.medicamentos,
        'id_estagiario': paciente.id_estagiario,
        'id_supervisor': paciente.id_supervisor,
        'supervisor_nome': supervisor.nome if supervisor else '',
        'estagiario_nome': estagiario.nome if estagiario else '',
        'status': paciente.status,
        'data_criacao': str(paciente.data_criacao)
    }
    return jsonify(paciente_json)

@app.route('/api/sec_ficha_paciente/<int:id>', methods=['GET'])
@login_required
def api_sec_ficha_paciente(id):
    # Acesso permitido para secretaria (cargo 0)
    if current_user.cargo != 0:
        return jsonify({'message': 'Acesso não autorizado'}), 403

    dados_paciente = Pacientes.query.get_or_404(id)
    estagiario = Usuarios.query.get(dados_paciente.id_estagiario) if dados_paciente.id_estagiario else None
    supervisor = Usuarios.query.get(dados_paciente.id_supervisor) if dados_paciente.id_supervisor else None
    
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
        'ja_fez_terapia': dados_paciente.ja_fez_terapia,
        'etnia': dados_paciente.etnia,
        'genero': dados_paciente.genero,
        'classe_social': dados_paciente.classe_social,
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
    
    folhas_pacientes = [f.to_dict() for f in folhas_db] # Assumindo que to_dict existe ou construindo manualmente
    # Como to_dict pode não existir no modelo FolhaEvolucao baseado no contexto anterior, vamos construir manualmente:
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

@app.route('/api/atualizar_paciente/<int:id>', methods=['POST'])
@login_required
def api_atualizar_paciente(id):
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
        paciente_para_atualizar.salario=to_numeric_or_none(data.get('salario'))
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
        paciente_para_atualizar.hipotese_diagnostica=data.get('hipotese_diagnostica') or None
        paciente_para_atualizar.ja_fez_terapia=to_bool_or_none(data.get('ja_fez_terapia'))
        paciente_para_atualizar.etnia=data.get('etnia') or None
        paciente_para_atualizar.genero=data.get('genero') or None
        paciente_para_atualizar.classe_social=data.get('classe_social') or None
        paciente_para_atualizar.status=True

        # Tratamento da imagem
        if 'imagem_paciente' in request.files:
            arquivo = request.files['imagem_paciente']
            if arquivo and arquivo.filename != '':
                deleta_imagem_pacientes(id)
                img_array = base64.b64encode(arquivo.read()).decode('utf-8')
                img_path = os.path.join(app.config['UPLOAD_PACIENTES_PATH'], f"{id}.png")
                with open(img_path, "wb") as f:
                    f.write(base64.b64decode(img_array))

        db.session.commit()
        return jsonify({'message': 'Paciente atualizado com sucesso.', 'success': True}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Erro ao atualizar: {str(e)}', 'success': False}), 500

@app.route('/api/mudar_status_paciente/<int:id>', methods=['POST'])
@login_required
def api_mudar_status_paciente(id):
    paciente = Pacientes.query.filter_by(id_paciente=id).first()
    if not paciente:
        return jsonify({'success': False, 'message': 'Paciente não encontrado'}), 404

    paciente.status = not paciente.status
    db.session.commit()
    return jsonify({'success': True, 'status': paciente.status})

@app.route('/api/atualizar_responsavel_paciente/<int:id>', methods=['POST'])
@login_required
def api_atualizar_responsavel_paciente(id):
    data = request.get_json()
    grupo_id = data.get('grupo_id')
    supervisor_id = data.get('supervisor_id')
    estagiario_id = data.get('estagiario_id')

    paciente = Pacientes.query.filter_by(id_paciente=id).first()
    if not paciente:
        return jsonify({'success': False, 'message': 'Paciente não encontrado'}), 404

    paciente.id_estagiario = estagiario_id
    paciente.id_supervisor = supervisor_id
    db.session.commit()
    return jsonify({'success': True})

@app.route('/api/busca_supervisores/<grupo_id>', methods=['GET'])
@login_required
def api_busca_supervisores(grupo_id):
    supervisores = Usuarios.query.filter_by(grupo=grupo_id, cargo="1").all()
    return jsonify([{'id': s.id_usuario, 'nome': s.nome} for s in supervisores])

@app.route('/api/busca_estagiarios/<grupo_id>', methods=['GET'])
@login_required
def api_busca_estagiarios(grupo_id):
    estagiarios = Usuarios.query.filter_by(grupo=grupo_id, cargo="2").all()
    return jsonify([{'id': e.id_usuario, 'nome': e.nome} for e in estagiarios])

# Administração de alertas
@app.route('/api/alertas', methods=['GET'])
@login_required
def api_alertas():
    lista = Alertas.query.all()
    alertas_json = [
        {
            'id_alerta': a.id_alerta,
            'titulo': a.titulo,
            'mensagem': a.mensagem,
            'validade': str(a.validade)
        } for a in lista
    ]
    return jsonify(alertas_json)

@app.route('/api/adicionar_alerta', methods=['POST'])
@login_required
def api_adicionar_alerta():
    data = request.get_json()
    titulo = data.get('titulo')
    mensagem = data.get('mensagem')
    validade_str = data.get('validade')

    try:
        validade = datetime.strptime(validade_str, '%Y-%m-%d').date()
    except (ValueError, TypeError):
        return jsonify({'success': False, 'message': 'Data de validade inválida.'}), 400

    novo_alerta = Alertas(titulo=titulo, mensagem=mensagem, validade=validade)
    db.session.add(novo_alerta)
    db.session.commit()
    return jsonify({'success': True, 'id_alerta': novo_alerta.id_alerta}), 201

@app.route('/api/deletar_alerta/<int:id>', methods=['DELETE'])
@login_required
def api_deletar_alerta(id):
    Alertas.query.filter_by(id_alerta=id).delete()
    db.session.commit()
    return jsonify({'success': True})