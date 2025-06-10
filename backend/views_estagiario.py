from flask import  render_template, request, redirect, session, flash, url_for, send_from_directory
from sapo import app, db, mail, crypt
from models import Usuarios, Grupos, Consultas, Pacientes, Alertas, FolhaEvolucao, ReuniaoGrupos
from helpers import FormularioInscricao, FormularioGrupo, FormularioPaciente, FormularioAlerta, recupera_imagem_pacientes, deleta_imagem_pacientes, formatar_tempo_decorrido
from sqlalchemy import text, desc
from flask_login import login_required, current_user
from flask_bcrypt import check_password_hash, generate_password_hash
from flask_mail import Message
import random, json, os, base64
from flask import jsonify
import time
from datetime import datetime, date, timedelta

# Inicio Consultas
@app.route('/consulta_estag')
@login_required
def consulta_estag():
    consulta_estag = db.session.query(Consultas, Pacientes.nome_completo).join(Pacientes, Consultas.id_paciente == Pacientes.id_paciente).filter(Consultas.id_usuario==current_user.id_usuario).all()

    # Converter os objetos SQLAlchemy em dicionários
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

    # Adicionar os eventos adicionais
    #consulta_grupo = EstagiariosGrupos.query.filter_by(estagiario_id=current_user.id_usuario).first()

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

@app.route('/consulta_ids_pacientes', methods=['GET'])
@login_required
def consulta_ids_pacientes():
    pacientes_do_usuario = Pacientes.query.filter_by(id_estagiario=current_user.id_usuario, status='true').all()

    pacientes = [{'id_paciente': paciente.id_paciente, 'nome_completo': paciente.nome_completo} for paciente in pacientes_do_usuario]
    return jsonify(pacientes)

@app.route('/cadastrar_consulta_estag', methods=['POST',])
@login_required
def cadastrar_consulta_estag():
    #print(request.form)

    paciente = request.form['paciente']
    dia = request.form['dia']
    inicio = request.form['inicio']
    final = request.form['final']

    # Convertendo 'dia', 'inicio' e 'final' para os tipos de dados corretos
    #iso_dia = date.fromisoformat(dia)
    #iso_hora_inicio = time.fromisoformat(inicio)
    #iso_hora_fim = time.fromisoformat(final)
    iso_dia = datetime.strptime(dia, '%Y-%m-%d').date()  # Convertendo para objeto date
    iso_hora_inicio = datetime.strptime(inicio + ':00', '%H:%M:%S').time()  # Convertendo para objeto time
    iso_hora_fim = datetime.strptime(final + ':00', '%H:%M:%S').time()  # Convertendo para objeto time

    # Verificando se há sobreposição na tabela Consultas
    consulta_existente = Consultas.query.filter(
        Consultas.id_usuario == current_user.id_usuario,
        Consultas.dia == iso_dia,
        Consultas.hora_inicio < iso_hora_fim,
        Consultas.hora_fim > iso_hora_inicio
    ).first()

    #print(consulta_existente) #para testar se validou a consulta

    if consulta_existente:
        return jsonify({'status': 'error', 'message': 'O horário selecionado já está ocupado com uma consulta. Por favor, escolha outro horário.'}), 400


    dia_semana = (iso_dia.weekday() + 1) % 7 #Verifica o dia da semana

    #Verificando o grupo do estagiário
    #consulta_grupo = EstagiariosGrupos.query.filter_by(estagiario_id=current_user.id_usuario).first()

    # Verificando se há sobreposição na tabela ReuniaoGrupos
    reuniao_existente = ReuniaoGrupos.query.filter(
        ReuniaoGrupos.id_grupo == current_user.grupo,
        ReuniaoGrupos.dia == dia_semana,
        ReuniaoGrupos.hora_inicio < iso_hora_fim,
        ReuniaoGrupos.hora_fim > iso_hora_inicio
    ).first()

    #print(reuniao_existente) #para testar se validou a reuniao

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

    return jsonify({'status': 'success', 'message': 'Consulta cadastrado com sucesso!'})

@app.route('/editar_consulta_estag', methods=['POST',])
@login_required
def editar_consulta_estag():
    id_req_consulta = request.form['id_consulta']
    dia = request.form['day']
    inicio = request.form['start']
    final = request.form['end']

    # Convertendo 'dia', 'inicio' e 'final' para os tipos de dados corretos
    #iso_dia = date.fromisoformat(dia)
    #iso_hora_inicio = time.fromisoformat(inicio)
    #iso_hora_fim = time.fromisoformat(final)
    iso_dia = datetime.strptime(dia, '%Y-%m-%d').date()  # Convertendo para objeto date
    iso_hora_inicio = datetime.strptime(inicio + ':00', '%H:%M:%S').time()  # Convertendo para objeto time
    iso_hora_fim = datetime.strptime(final + ':00', '%H:%M:%S').time()  # Convertendo para objeto time

    # Verificando se há sobreposição na tabela Consultas
    consulta_existente = Consultas.query.filter(
        Consultas.id_usuario == current_user.id_usuario,
        Consultas.dia == iso_dia,
        Consultas.hora_inicio < iso_hora_fim,
        Consultas.hora_fim > iso_hora_inicio
    ).first()

    #Caso a consulta exista e seja a mesma consulta, ele não passa aqui.
    if consulta_existente and consulta_existente.id_consulta != int(id_req_consulta):
        return jsonify({'status': 'error', 'message': 'O horário selecionado já está ocupado com uma consulta. Por favor, escolha outro horário.'}), 400


    dia_semana = (iso_dia.weekday() + 1) % 7 #Verifica o dia da semana

    #Verificando o grupo do estagiário
    #consulta_grupo = EstagiariosGrupos.query.filter_by(estagiario_id=current_user.id_usuario).first()

    # Verificando se há sobreposição na tabela ReuniaoGrupos
    reuniao_existente = ReuniaoGrupos.query.filter(
        ReuniaoGrupos.id_grupo == current_user.grupo,
        ReuniaoGrupos.dia == dia_semana,
        ReuniaoGrupos.hora_inicio < iso_hora_fim,
        ReuniaoGrupos.hora_fim > iso_hora_fim
    ).first()

    #print(reuniao_existente) #para testar se validou a reuniao

    if reuniao_existente:
        return jsonify({'status': 'error', 'message': 'O horário selecionado já está ocupado com uma reunião. Por favor, escolha outro horário.'}), 400

    consulta = Consultas.query.filter_by(id_consulta=id_req_consulta).first()
    consulta.dia = iso_dia
    consulta.hora_inicio = iso_hora_inicio
    consulta.hora_fim = iso_hora_fim

    db.session.add(consulta)
    db.session.commit()

    return jsonify({'message': 'Consulta editada com sucesso!'})

@app.route('/cancelar_consulta_estag', methods=['POST',])
@login_required
def cancelar_consulta_estag():
    consulta = Consultas.query.filter_by(id_consulta=request.form['id_consulta']).first()
    consulta.status = 'Cancelado'
    consulta.cor = '#ff0000'

    db.session.add(consulta)
    db.session.commit()

    #não queremos mais deletar, e sim mudar o status
    #Consultas.query.filter_by(id_consulta=request.form['id_consulta']).delete()
    #db.session.commit()

    return jsonify({'message': 'Consulta cancelada com sucesso!'})

@app.route('/realizar_consulta_estag', methods=['POST',])
@login_required
def realizar_consulta_estag():
    consulta = Consultas.query.filter_by(id_consulta=request.form['id_consulta']).first()
    consulta.status = 'Realizado'
    consulta.cor = '#008000'

    db.session.add(consulta)
    db.session.commit()

    return jsonify({'message': 'Consulta realizada com sucesso!'})

@app.route('/est_consulta_card', methods=['GET'])
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


# Final Consultas

# Inicio Ficha Paciente
@app.route('/meus_pacientes')
@login_required
def meus_pacientes():
    lista_pacientes_sql = Pacientes.query.filter_by(id_estagiario=current_user.id_usuario).filter_by(status='True').order_by(Pacientes.nome_completo).all()

    ultimas_atividades_pacientes = []

    for paciente in lista_pacientes_sql:
        ultima_atividade = atividade_paciente(paciente.id_paciente)
        ultimas_atividades_pacientes.append(ultima_atividade)

    lista_pacientes = zip(lista_pacientes_sql, ultimas_atividades_pacientes)

    return render_template('est_meus_pacientes.html', titulo='Meus Pacientes', lista_pacientes=lista_pacientes)


@app.route('/est_adicionar_paciente')
@login_required
def est_adicionar_paciente():
    formulario_paciente = FormularioPaciente()
    hoje = date.today()
    return render_template('est_add_paciente.html', titulo='Adicionar Paciente', formulario_paciente=formulario_paciente, hoje=hoje)

@app.route('/consulta_ids_supervisores', methods=['GET'])
@login_required
def consulta_ids_supervisores():
    supervisores = Usuarios.query.filter_by(grupo=current_user.grupo, cargo='1',status='true').all()
    supervisor = [{'id_supervisor': supervisor_unico.id_usuario, 'nome': supervisor_unico.nome} for supervisor_unico in supervisores]
    return jsonify(supervisor)

@app.route('/est_paciente_adicionado', methods=['POST',])
def est_paciente_adicionado():
    formulario_paciente = FormularioPaciente(request.form)

    #id_paciente = formulario_paciente.
    id_estagiario = current_user.id_usuario
    id_supervisor = request.form.get('supervisor')
    #status = formulario_paciente.
    #data_criacao = formulario_paciente.
    #data_criacao = datetime.date.today.strftime("%d/%m/%Y")
    data_criacao = date.today().strftime("%d/%m/%Y")

    nome_completo = formulario_paciente.nome_completo.data
    nome_responsavel = formulario_paciente.nome_responsavel.data
    grau_parentesco = formulario_paciente.grau_parentesco.data
    data_nascimento = formulario_paciente.data_nascimento.data
    idade = formulario_paciente.idade.data
    sexo = formulario_paciente.sexo.data
    escolaridade = formulario_paciente.escolaridade.data
    profissao = formulario_paciente.profissao.data
    ocupacao = formulario_paciente.ocupacao.data
    salario = formulario_paciente.salario.data
    renda_familiar = formulario_paciente.renda_familiar.data
    cep = formulario_paciente.cep.data
    cidade = formulario_paciente.cidade.data
    bairro = formulario_paciente.bairro.data
    logradouro = formulario_paciente.logradouro.data
    complemento = formulario_paciente.complemento.data
    telefone = formulario_paciente.telefone.data
    celular1 = formulario_paciente.celular1.data
    celular2 = formulario_paciente.celular2.data
    email = formulario_paciente.email.data
    origem_encaminhamento = formulario_paciente.origem_encaminhamento.data
    nome_instituicao = formulario_paciente.nome_instituicao.data
    nome_resp_encaminhamento = formulario_paciente.nome_resp_encaminhamento.data
    motivo = formulario_paciente.motivo.data
    medicamentos = formulario_paciente.medicamentos.data

    if origem_encaminhamento == 'Outras':
        origem_encaminhamento = request.form['outrasOpcao']

    novo_paciente = Pacientes(id_estagiario=id_estagiario,id_supervisor=id_supervisor,data_criacao=data_criacao, nome_completo=nome_completo, nome_responsavel=nome_responsavel, grau_parentesco=grau_parentesco,
                             data_nascimento=data_nascimento, idade=idade, sexo=sexo, escolaridade=escolaridade, profissao=profissao, ocupacao=ocupacao,
                             salario=salario, renda_familiar=renda_familiar, cep=cep, cidade=cidade, bairro=bairro, logradouro=logradouro, complemento=complemento,
                             telefone=telefone, celular1=celular1, celular2=celular2, email=email, origem_encaminhamento=origem_encaminhamento, nome_instituicao=nome_instituicao,
                             nome_resp_encaminhamento=nome_resp_encaminhamento, motivo=motivo, medicamentos=medicamentos)

    db.session.add(novo_paciente)
    db.session.commit()

    cropped_image_data = request.form['croppedData']
    # Verifica se os dados estão no formato correto
    if cropped_image_data.startswith('data:image'):
        try:
            # Divide a string nos dois pontos para obter a codificação base64
            header, encoded_data = cropped_image_data.split(',', 1)

            # Decodifica os dados da imagem de base64
            cropped_image_bytes = base64.b64decode(encoded_data)

            # Define o caminho do arquivo onde a imagem será salva
            timestamp = time.time()
            filename = f'capa{novo_paciente.id_paciente}-{timestamp}.png'
            filepath = os.path.join(app.config['UPLOAD_PACIENTES_PATH'], filename)

            # Salva a imagem no diretório especificado
            with open(filepath, 'wb') as f:
                f.write(cropped_image_bytes)
        except Exception as e:
            return 'Error: {}'.format(e)

    return redirect(url_for('meus_pacientes'))

@app.route('/est_ficha_paciente/<int:id>')
@login_required
def est_ficha_paciente(id):
    #Dados do paciente
    dados_paciente = Pacientes.query.filter_by(id_paciente=id).first()

    formulario_paciente = FormularioPaciente(request.form)

    outrasopcoes = ""

    if dados_paciente.origem_encaminhamento == 'Procura Espontânea' or dados_paciente.origem_encaminhamento == 'Área de Educação' or dados_paciente.origem_encaminhamento == 'Área Jurídica' or dados_paciente.origem_encaminhamento == 'Área de Saúde' or dados_paciente.origem_encaminhamento == 'Área de Trabalho':
        formulario_paciente.origem_encaminhamento.data = dados_paciente.origem_encaminhamento
    else:
        outrasopcoes = dados_paciente.origem_encaminhamento
        dados_paciente.origem_encaminhamento = 'Outras'
        formulario_paciente.origem_encaminhamento.data = dados_paciente.origem_encaminhamento

    estagiario = Usuarios.query.filter_by(id_usuario=dados_paciente.id_estagiario).first()
    supervisor = Usuarios.query.filter_by(id_usuario=dados_paciente.id_supervisor).first()

    formulario_paciente.id_estagiario.data              = estagiario.nome
    formulario_paciente.id_supervisor.data              = supervisor.nome
    formulario_paciente.status.data                     = dados_paciente.status
    formulario_paciente.data_criacao.data               = dados_paciente.data_criacao

    formulario_paciente.id_paciente.data                = dados_paciente.id_paciente
    formulario_paciente.nome_completo.data              = dados_paciente.nome_completo
    formulario_paciente.nome_responsavel.data           = dados_paciente.nome_responsavel
    formulario_paciente.grau_parentesco.data            = dados_paciente.grau_parentesco
    formulario_paciente.data_nascimento.data            = dados_paciente.data_nascimento
    formulario_paciente.idade.data                      = dados_paciente.idade
    formulario_paciente.sexo.data                       = dados_paciente.sexo
    formulario_paciente.escolaridade.data               = dados_paciente.escolaridade
    formulario_paciente.profissao.data                  = dados_paciente.profissao
    formulario_paciente.ocupacao.data                   = dados_paciente.ocupacao
    formulario_paciente.salario.data                    = dados_paciente.salario
    formulario_paciente.renda_familiar.data             = dados_paciente.renda_familiar
    formulario_paciente.cep.data                        = dados_paciente.cep
    formulario_paciente.cidade.data                     = dados_paciente.cidade
    formulario_paciente.bairro.data                     = dados_paciente.bairro
    formulario_paciente.logradouro.data                 = dados_paciente.logradouro
    formulario_paciente.complemento.data                = dados_paciente.complemento
    formulario_paciente.telefone.data                   = dados_paciente.telefone
    formulario_paciente.celular1.data                   = dados_paciente.celular1
    formulario_paciente.celular2.data                   = dados_paciente.celular2
    #formulario_paciente.origem_encaminhamento.data      = dados_paciente.origem_encaminhamento
    formulario_paciente.nome_instituicao.data           = dados_paciente.nome_instituicao
    formulario_paciente.nome_resp_encaminhamento.data   = dados_paciente.nome_resp_encaminhamento
    formulario_paciente.motivo.data                     = dados_paciente.motivo
    formulario_paciente.medicamentos.data               = dados_paciente.medicamentos

    #capa = recupera_imagem_pacientes(id)

    #Ficha de evolução
    #folhas_pacientes = FolhaEvolucao.query.filter_by(id_paciente=id).all()

    #return render_template('est_ficha_paciente.html', titulo='Ficha do Paciente', formulario_paciente=formulario_paciente, outrasopcoes=outrasopcoes, capa=capa, folhas_pacientes=folhas_pacientes)
    return render_template('est_ficha_paciente.html', titulo='Ficha do Paciente', formulario_paciente=formulario_paciente, outrasopcoes=outrasopcoes)

@app.route('/est_lista_folhas_atualizada/<int:id>')
@login_required
def est_lista_folhas_atualizada(id):
    aux_folha_paciente = FolhaEvolucao.query.filter_by(id_paciente=id).order_by(FolhaEvolucao.id_folha.asc()).all()
    if aux_folha_paciente:
        folha_paciente = []
        for folha in aux_folha_paciente:
            try:
                postagem_descriptografada = crypt.decrypt(folha.postagem.encode('utf-8')).decode('utf-8')
                folha.postagem = postagem_descriptografada
                folha_paciente.append(folha.serialize())
            except Exception as e:
                print(f'Erro ao descriptografar a postagem: {e}')
                folha_paciente.append({
                    'id_folha': folha.id_folha,
                    'postagem': 'Erro na descriptografia. Favor consultar um supervisor.',
                    'id_paciente': folha.id_paciente,
                    'id_estagiario': folha.id_estagiario,
                    'nome_estagiario': folha.nome_estagiario,
                    'data_postagem': folha.data_postagem
                })

        return jsonify({'folhas_pacientes': folha_paciente})
    return jsonify({'status': 'error', 'message': 'Paciente não possui nenhum histórico de evolução.'}), 400

@app.route('/est_ficha_adicionada', methods=['POST',])
@login_required
def est_ficha_adicionada():
    id_paciente = request.form['id_paciente']
    id_estagiario = current_user.id_usuario
    nome_estagiario = current_user.nome
    data_postagem = datetime.now().replace(microsecond=0)
    #postagem = request.form['postagem']
    postagem = crypt.encrypt(request.form['postagem']).decode('utf-8')

    nova_folha = FolhaEvolucao(id_paciente=id_paciente, id_estagiario=id_estagiario, nome_estagiario=nome_estagiario, data_postagem=data_postagem, postagem=postagem)
    db.session.add(nova_folha)
    db.session.commit()

    return redirect(url_for('est_ficha_paciente', id=id_paciente))

@app.route('/est_ficha_deletada/<int:id>', methods=['DELETE',])
@login_required
def est_ficha_deletada(id):

    folha = FolhaEvolucao.query.get_or_404(id)
    db.session.delete(folha)
    db.session.commit()

    return jsonify({'message': 'Folha excluída com sucesso'})


@app.route('/est_primeira_estatistica_paciente/<int:id_paciente>')
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

@app.route('/est_segunda_estatistica_paciente/<int:id_paciente>')
def est_segunda_estatistica_paciente(id_paciente):
    consultas = Consultas.query.filter_by(id_paciente=id_paciente).all()
    marcadas = [0] * 7
    realizadas = [0] * 7
    canceladas = [0] * 7

    for consulta in consultas:
        dia_semana = consulta.dia.weekday()  # 0 = Segunda-feira, 6 = Domingo
        if consulta.status == 'Agendado':
            marcadas[dia_semana] += 1
        elif consulta.status == 'Realizado':
            realizadas[dia_semana] += 1
        elif consulta.status == 'Cancelado':
            canceladas[dia_semana] += 1

    # Ajustando para começar no domingo
    marcadas = marcadas[-1:] + marcadas[:-1]
    realizadas = realizadas[-1:] + realizadas[:-1]
    canceladas = canceladas[-1:] + canceladas[:-1]

    data = {
        'marcadas': marcadas,
        'realizadas': realizadas,
        'canceladas': canceladas
    }
    return jsonify(data)

@app.route('/est_terceira_estatistica_paciente/<int:id_paciente>')
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

    # Filtrando apenas os horários de 6h às 20h
    marcadas = marcadas[6:21]
    realizadas = realizadas[6:21]
    canceladas = canceladas[6:21]

    data = {
        'marcadas': marcadas,
        'realizadas': realizadas,
        'canceladas': canceladas
    }
    return jsonify(data)

# Final Ficha Paciente

#@app.route('/uploads/pacientes/<nome_arquivo>')
#def imagem_paciente(nome_arquivo):
#    return send_from_directory(app.config['UPLOAD_PACIENTES_PATH'], nome_arquivo)

@app.route('/uploads/pacientes/paciente/<id>')
def imagem_paciente_tabela(id):
    imagem = recupera_imagem_pacientes(id)
    return send_from_directory(app.config['UPLOAD_PACIENTES_PATH'], imagem)


def atividade_paciente(id):
    # Obter a última folha de evolução
    ultima_folha = FolhaEvolucao.query.filter_by(id_paciente=id).order_by(desc(FolhaEvolucao.id_folha)).first()

    # Obter a última consulta
    ultima_consulta = Consultas.query.filter_by(id_paciente=id).order_by(desc(Consultas.id_consulta)).first()

    # Converter data_postagem de FolhaEvolucao para datetime
    if ultima_folha:
        data_folha = ultima_folha.data_postagem
    else:
        data_folha = None

    # Combinar dia e hora_fim de Consulta para converter para um objeto datetime
    if ultima_consulta:
        data_consulta = datetime.combine(ultima_consulta.dia, ultima_consulta.hora_fim)
    else:
        data_consulta = None

    # Calcular o tempo decorrido em relação ao momento atual
    agora = datetime.now()
    if data_folha and data_consulta:
        if data_folha > data_consulta:
            ultima_atividade = data_folha
        else:
            ultima_atividade = data_consulta
    elif data_folha:
        ultima_atividade = data_folha
    elif data_consulta:
        ultima_atividade = data_consulta
    else:
        return 'Nenhuma atividade encontrada'

    # Verificar se nenhuma atividade é posterior a data atual (atividades que estão marcadas para acontecer)
    if ultima_atividade > agora:
        return 'Consulta marcada para os próximos dias'

    # Calcular o tempo decorrido
    tempo_decorrido = agora - ultima_atividade

    # Formatar o tempo decorrido
    tempo_formatado = formatar_tempo_decorrido(tempo_decorrido)

    return tempo_formatado