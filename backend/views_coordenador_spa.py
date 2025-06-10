from flask import  render_template, request, redirect, session, flash, url_for, send_from_directory
from sapo import app, db, mail
from models import Usuarios, Grupos, Pacientes, Alertas, ReuniaoGrupos, Consultas, FolhaEvolucao
from helpers import FormularioInscricao, FormularioGrupo, FormularioPaciente, FormularioAlerta, recupera_imagem_pacientes, deleta_imagem_pacientes
from sqlalchemy import text, func
from flask_login import login_required, current_user
from flask_bcrypt import check_password_hash, generate_password_hash
from flask_mail import Message
import random, json, time, os, base64
from flask import jsonify
from datetime import datetime, date, timedelta

# Inicio Consultas da secretaria
@app.route('/cod_consulta', methods=['GET'])
@login_required
def cod_consulta():
    gruposId = request.args.get('gruposId')

    consultas_serializadas = []

    if(gruposId):
        consulta_estag = db.session.query(Consultas, Usuarios.nome).join(Usuarios, Consultas.id_usuario == Usuarios.id_usuario).filter(Consultas.id_grupo == gruposId).all()
    else:
        consulta_estag = db.session.query(Consultas, Usuarios.nome).join(Usuarios, Consultas.id_usuario == Usuarios.id_usuario).all()
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

#Reaproveitado a rota /consulta_ids_grupos
# Final Consultas da secretaria
@app.route('/cod_chart/usuarios_por_cargo', methods=['GET'])
@login_required
def usuarios_por_cargo():
    grupo = request.args.get('grupo')
    status = request.args.get('status')
    status = None if status == "0" else (True if status == "1" else False)

    query = Usuarios.query
    if grupo:
        query = query.filter_by(id_grupo=grupo)
    if status is not None:
        query = query.filter_by(ativo=status)

    usuarios = query.all()
    cargos = {0: 'Secretaria', 1: 'Supervisor', 2: 'Estagiário', 3: 'Coordenador do Curso'}
    cargo_counts = {cargos[cargo]: 0 for cargo in cargos}

    for usuario in usuarios:
        cargo_counts[cargos[usuario.cargo]] += 1

    return jsonify(cargo_counts)


@app.route('/cod_chart/usuarios_por_grupo', methods=['GET'])
@login_required
def usuarios_por_grupo():
    status = request.args.get('status')
    status = None if status == "0" else (True if status == "1" else False)

    grupos = db.session.query(Usuarios.id_grupo, db.func.count(Usuarios.id_usuario)).group_by(Usuarios.id_grupo).all()
    grupo_counts = {grupo: 0 for grupo, _ in grupos}

    for grupo, count in grupos:
        if status is not None:
            usuarios = Usuarios.query.filter_by(id_grupo=grupo, ativo=status).count()
        else:
            usuarios = Usuarios.query.filter_by(id_grupo=grupo).count()
        grupo_counts[grupo] = usuarios

    return jsonify(grupo_counts)