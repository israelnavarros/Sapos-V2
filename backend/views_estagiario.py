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

# ------------------- FICHA PACIENTE -------------------
@app.route('/api/meus_pacientes', methods=['GET'])
@login_required
def api_meus_pacientes():
    pacientes = Pacientes.query.filter_by(id_estagiario=current_user.id_usuario, status='True').order_by(Pacientes.nome_completo).all()
    
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
@login_required
def api_ficha_paciente(id):
    dados_paciente = Pacientes.query.get_or_404(id)
    estagiario = Usuarios.query.filter_by(id_usuario=dados_paciente.id_estagiario).first()
    supervisor = Usuarios.query.filter_by(id_usuario=dados_paciente.id_supervisor).first()
    
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
        'data_criacao': str(dados_paciente.data_criacao)
    }
    aux_folhas_pacientes = FolhaEvolucao.query.filter_by(id_paciente=id).order_by(FolhaEvolucao.id_folha.desc()).all()
    folhas_pacientes = []
    for folha in aux_folhas_pacientes:
        estagiario_folha = Usuarios.query.get(folha.id_estagiario)
        supervisor_folha = Usuarios.query.get(folha.id_supervisor)
        try:
            folha_json = {
                'id_folha': folha.id_folha,
                'id_paciente': folha.id_paciente,
                'id_estagiario': folha.id_estagiario,
                'nome_estagiario': estagiario_folha.nome if estagiario_folha else 'Desconhecido',
                'id_supervisor': folha.id_supervisor,
                'nome_supervisor': supervisor_folha.nome if supervisor_folha else 'Desconhecido',
                'data_postagem': str(folha.data_postagem),
                'numero_sessao': folha.numero_sessao,
                'status_validacao': folha.status_validacao,
                'hipotese_diagnostica': crypt.decrypt(folha.hipotese_diagnostica.encode('utf-8')).decode('utf-8'),
                'sintomas_atuais': crypt.decrypt(folha.sintomas_atuais.encode('utf-8')).decode('utf-8'),
                'intervencoes_realizadas': crypt.decrypt(folha.intervencoes_realizadas.encode('utf-8')).decode('utf-8'),
                'evolucao_clinica': crypt.decrypt(folha.evolucao_clinica.encode('utf-8')).decode('utf-8'),
                'plano_proxima_sessao': crypt.decrypt(folha.plano_proxima_sessao.encode('utf-8')).decode('utf-8'),
                'observacoes': crypt.decrypt(folha.observacoes.encode('utf-8')).decode('utf-8'),
            }
            folhas_pacientes.append(folha_json)
        except Exception as e:
            folhas_pacientes.append({
                'id_folha': folha.id_folha,
                'id_paciente': folha.id_paciente,
                'id_estagiario': folha.id_estagiario,
                'nome_estagiario': estagiario_folha.nome if estagiario_folha else 'Desconhecido',
                'id_supervisor': folha.id_supervisor,
                'nome_supervisor': supervisor_folha.nome if supervisor_folha else 'Desconhecido',
                'data_postagem': str(folha.data_postagem),
                'numero_sessao': folha.numero_sessao,
                'status_validacao': folha.status_validacao,
            })

    return jsonify({
        'paciente': paciente_json,
        'folhas_pacientes': folhas_pacientes
    })

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

# @app.route('/api/est_lista_folhas_atualizada/<int:id>', methods=['GET'])
# @login_required
# def est_lista_folhas_atualizada(id):
#     aux_folha_paciente = FolhaEvolucao.query.filter_by(id_paciente=id).order_by(FolhaEvolucao.id_folha.asc()).all()
#     if aux_folha_paciente:
#         folha_paciente = []
#         for folha in aux_folha_paciente:
#             estagiario_folha = Usuarios.query.get(folha.id_estagiario)
#             supervisor_folha = Usuarios.query.get(folha.id_supervisor)
#             try:
#                 hipotese_diagnostica_descriptografada = crypt.decrypt(folha.hipotese_diagnostica.encode('utf-8')).decode('utf-8')
#                 sintomas_atuais_descriptografada = crypt.decrypt(folha.sintomas_atuais.encode('utf-8')).decode('utf-8')
#                 intervencoes_realizadas_descriptografada = crypt.decrypt(folha.intervencoes_realizadas.encode('utf-8')).decode('utf-8')
#                 evolucao_clinica_descriptografada = crypt.decrypt(folha.evolucao_clinica.encode('utf-8')).decode('utf-8')
#                 plano_proxima_sessao_descriptografada = crypt.decrypt(folha.plano_proxima_sessao.encode('utf-8')).decode('utf-8')
#                 observacoes_descriptografada = crypt.decrypt(folha.observacoes.encode('utf-8')).decode('utf-8')
#                 folha.hipotese_diagnostica = hipotese_diagnostica_descriptografada
#                 folha.sintomas_atuais = sintomas_atuais_descriptografada
#                 folha.intervencoes_realizadas = intervencoes_realizadas_descriptografada
#                 folha.evolucao_clinica = evolucao_clinica_descriptografada
#                 folha.plano_proxima_sessao = plano_proxima_sessao_descriptografada
#                 folha.observacoes = observacoes_descriptografada
#                 folha_paciente.append(folha.serialize())

#             except Exception as e:
#                 print(f'Erro ao descriptografar a postagem: {e}')
#                 folha_paciente.append({
#                     'id_folha': folha.id_folha,
#                     'hipotese_diagnostica': 'Erro na descriptografia. Favor consultar um supervisor.',
#                     'sintomas_atuais': 'Erro na descriptografia. Favor consultar um supervisor.',
#                     'intervencoes_realizadas': 'Erro na descriptografia. Favor consultar um supervisor.',
#                     'evolucao_clinica': 'Erro na descriptografia. Favor consultar um supervisor.',
#                     'plano_proxima_sessao': 'Erro na descriptografia. Favor consultar um supervisor.',
#                     'observacoes': 'Erro na descriptografia. Favor consultar um supervisor.',
#                     'id_paciente': folha.id_paciente,
#                     'id_estagiario': folha.id_estagiario,
#                     'nome_estagiario': estagiario_folha.nome if estagiario_folha else 'Desconhecido',
#                     'id_supervisor': folha.id_supervisor,
#                     'nome_supervisor': supervisor_folha.nome if supervisor_folha else 'Desconhecido',
#                     'data_postagem': folha.data_postagem,
#                     'numero_sessao': folha.numero_sessao,
#                     'status_validacao': folha.status_validacao,

#                 })
#         return jsonify({'folhas_pacientes': folha_paciente})
#     return jsonify({'status': 'error', 'message': 'Paciente não possui nenhum histórico de evolução.'}), 400


@app.route('/api/est_ficha_adicionada', methods=['POST'])
@login_required
def est_ficha_adicionada():
    id_paciente = request.form['id_paciente']
    id_estagiario = current_user.id_usuario
    id_supervisor = request.form['id_supervisor']
    data_postagem = datetime.now().replace(microsecond=0)
    data_status = datetime.now().replace(microsecond=0)
    hipotese_diagnostica = crypt.encrypt(request.form['hipotese_diagnostica']).decode('utf-8')
    sintomas_atuais = crypt.encrypt(request.form['sintomas_atuais']).decode('utf-8')
    intervencoes_realizadas = crypt.encrypt(request.form['intervencoes_realizadas']).decode('utf-8')
    evolucao_clinica = crypt.encrypt(request.form['evolucao_clinica']).decode('utf-8')
    plano_proxima_sessao = crypt.encrypt(request.form['plano_proxima_sessao']).decode('utf-8')
    observacoes = crypt.encrypt(request.form['observacoes']).decode('utf-8')
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
        data_status=data_status
    )
    db.session.add(nova_folha)
    db.session.commit()

    return jsonify({'message': 'Folha adicionada com sucesso!'})


@app.route('/api/est_ficha_deletada/<int:id>', methods=['DELETE'])
@login_required
def est_ficha_deletada(id):
    folha = FolhaEvolucao.query.get_or_404(id)
    db.session.delete(folha)
    db.session.commit()

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