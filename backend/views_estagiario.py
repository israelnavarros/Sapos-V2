from flask import render_template, request, redirect, session, flash, url_for, send_from_directory, jsonify
from main import app, db, mail, crypt
from models import Usuarios, Grupos, Consultas, Pacientes, Alertas, FolhaEvolucao, ReuniaoGrupos
from helpers import FormularioInscricao, FormularioGrupo, FormularioPaciente, FormularioAlerta, recupera_imagem_pacientes, deleta_imagem_pacientes, formatar_tempo_decorrido
from sqlalchemy import text, desc
from flask_login import login_required, current_user
from flask_bcrypt import check_password_hash, generate_password_hash
from flask_mail import Message
import random, json, os, base64
import time
from datetime import datetime, date, timedelta

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
    consulta.cor = '#ff0000'
    db.session.add(consulta)
    db.session.commit()
    return jsonify({'message': 'Consulta cancelada com sucesso!'})

@app.route('/api/realizar_consulta_estag', methods=['POST'])
@login_required
def realizar_consulta_estag():
    consulta = Consultas.query.filter_by(id_consulta=request.form['id_consulta']).first()
    consulta.status = 'Realizado'
    consulta.cor = '#008000'
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

# ------------------- FICHA PACIENTE -------------------

@app.route('/api/consulta_ids_supervisores', methods=['GET'])
@login_required
def consulta_ids_supervisores():
    supervisores = Usuarios.query.filter_by(grupo=current_user.grupo, cargo='1', status='true').all()
    supervisor = [{'id_supervisor': supervisor_unico.id_usuario, 'nome': supervisor_unico.nome} for supervisor_unico in supervisores]
    return jsonify(supervisor)

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