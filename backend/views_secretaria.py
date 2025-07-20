from flask import  jsonify, request, session, flash, url_for, send_from_directory
from main import app, db, mail
from models import Usuarios, Grupos, Pacientes, Alertas, ReuniaoGrupos, Consultas, FolhaEvolucao
from helpers import FormularioInscricao, FormularioGrupo, FormularioPaciente, FormularioAlerta, recupera_imagem_pacientes, deleta_imagem_pacientes
from sqlalchemy import text, func
from flask_login import login_required, current_user
from flask_bcrypt import check_password_hash, generate_password_hash
from flask_mail import Message
import random, json, time, os, base64
from datetime import datetime, date, timedelta
import base64
import re

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

    match usuario.cargo:
        case 0:
            nova_validade = usuario.valido_ate + timedelta(days=910)
        case 1:
            nova_validade = usuario.valido_ate + timedelta(days=1820)
        case 2:
            nova_validade = usuario.valido_ate + timedelta(days=182)
        case _:
            nova_validade = usuario.valido_ate

    usuario.valido_ate = nova_validade
    db.session.commit()
    return jsonify({'success': True, 'valido_ate': str(usuario.valido_ate)})

@app.route('/api/registrar_usuario', methods=['POST'])
@login_required
def api_registrar_usuario():
    data = request.get_json()
    nome = data.get('nome')
    email = data.get('email')
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
            'vagas': g.vagas,
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
    novas_vagas = data.get('vagas')

    if grupo_id is None or novas_vagas is None:
        return jsonify({'success': False, 'message': 'Dados inválidos'}), 400

    grupo = Grupos.query.get(grupo_id)
    if grupo:
        grupo.vagas = novas_vagas
        db.session.commit()
        return jsonify({'success': True})
    else:
        return jsonify({'success': False, 'message': 'Algo ocorreu com o grupo.'}), 404

@app.route('/api/cadastrar_grupo', methods=['POST'])
@login_required
def api_cadastrar_grupo():
    data = request.get_json()
    titulo = data.get('titulo')
    vagas = data.get('vagas')
    convenio = data.get('convenio')
    local = data.get('local')
    resumo = data.get('resumo')
    objetivos = data.get('objetivos')
    atividades = data.get('atividades')
    bibliografia = data.get('bibliografia')

    novo_grupo = Grupos(
        titulo=titulo, vagas=vagas, convenio=convenio, local=local,
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
        'vagas': grupo.vagas,
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
    grupo.vagas = data.get('vagas')
    grupo.convenio = data.get('convenio')
    grupo.local = data.get('local')
    grupo.resumo = data.get('resumo')
    grupo.objetivos = data.get('objetivos')
    grupo.atividades = data.get('atividades')
    grupo.bibliografia = data.get('bibliografia')

    db.session.commit()
    return jsonify({'success': True})

# Administração de pacientes
@app.route('/api/pacientes', methods=['GET'])
@login_required
def api_pacientes():
    pacientes = Pacientes.query.all()
    lista_pacientes = []
    for paciente in pacientes:
        estagiario = Usuarios.query.filter_by(id_usuario=paciente.id_estagiario).first()
        coordenador = Usuarios.query.filter_by(id_usuario=paciente.id_supervisor).first()
        lista_pacientes.append({
            'id_paciente': paciente.id_paciente,
            'nome_completo': paciente.nome_completo,
            'estagiario_nome': estagiario.nome if estagiario else 'N/A',
            'coordenador_nome': coordenador.nome if coordenador else 'N/A',
            'status': paciente.status,
            'data_criacao': str(paciente.data_criacao)
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


@app.route('/api/atualizar_paciente/<int:id>', methods=['POST'])
@login_required
def api_atualizar_paciente(id):
    data = request.get_json()
    paciente = Pacientes.query.filter_by(id_paciente=id).first()
    if not paciente:
        return jsonify({'success': False, 'message': 'Paciente não encontrado'}), 404

    paciente.nome_completo = data.get('nome_completo')
    paciente.nome_responsavel = data.get('nome_responsavel')
    paciente.grau_parentesco = data.get('grau_parentesco')
    paciente.data_nascimento = data.get('data_nascimento')
    paciente.idade = data.get('idade')
    paciente.sexo = data.get('sexo')
    paciente.escolaridade = data.get('escolaridade')
    paciente.profissao = data.get('profissao')
    paciente.ocupacao = data.get('ocupacao')
    paciente.salario = data.get('salario')
    paciente.renda_familiar = data.get('renda_familiar')
    paciente.cep = data.get('cep')
    paciente.cidade = data.get('cidade')
    paciente.bairro = data.get('bairro')
    paciente.logradouro = data.get('logradouro')
    paciente.complemento = data.get('complemento')
    paciente.telefone = data.get('telefone')
    paciente.celular1 = data.get('celular1')
    paciente.celular2 = data.get('celular2')
    paciente.origem_encaminhamento = data.get('origem_encaminhamento')
    paciente.nome_instituicao = data.get('nome_instituicao')
    paciente.nome_resp_encaminhamento = data.get('nome_resp_encaminhamento')
    paciente.motivo = data.get('motivo')
    paciente.medicamentos = data.get('medicamentos')
    paciente.id_estagiario = data.get('id_estagiario')
    paciente.id_supervisor = data.get('id_supervisor')
    paciente.status = data.get('status')
    paciente.data_criacao = data.get('data_criacao')

    cropped_data = data.get('croppedData')
    print(data.get('croppedData'))
    if cropped_data:
        match = re.match(r'data:image/(png|jpg|jpeg);base64,(.*)', cropped_data)
        if match:
            img_str = match.group(2)
            img_bytes = base64.b64decode(img_str)
            img_path = os.path.join(app.config['UPLOAD_PACIENTES_PATH'], f"{id}.png")
            with open(img_path, "wb") as f:
                f.write(img_bytes)

    db.session.commit()
    return jsonify({'success': True})

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
    validade = data.get('validade')

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