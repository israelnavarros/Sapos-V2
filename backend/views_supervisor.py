from flask import  render_template, request, redirect, session, flash, url_for, send_from_directory
from sapo import app, db, mail, crypt
from models import Usuarios, Grupos, Pacientes, Alertas, ReuniaoGrupos, Consultas, FolhaEvolucao
from helpers import FormularioInscricao, FormularioGrupo, FormularioPaciente, FormularioAlerta, recupera_imagem_pacientes, deleta_imagem_pacientes
from sqlalchemy import text, func
from flask_login import login_required, current_user
from flask_bcrypt import check_password_hash, generate_password_hash
from flask_mail import Message
import random, json, time, os, base64
from flask import jsonify
from datetime import datetime, date, timedelta

# Inicio Consultas dos estagiários
@app.route('/consulta_supervisor', methods=['GET'])
@login_required
def consulta_supervisor():
    estagiarioId = request.args.get('estagiarioId')

    #consulta_grupo = CoordenadoresGrupos.query.filter_by(coordenador_id=current_user.id_usuario).first()

    consultas_serializadas = []

    if(estagiarioId):
        # consulta_estag = db.session.query(Consultas, Pacientes.nome_completo).join(Pacientes, Consultas.id_paciente == Pacientes.id_paciente).filter(Consultas.id_usuario==current_user.id_usuario).all()
        consulta_estag = db.session.query(Consultas, Pacientes.nome_completo).join(Pacientes,Consultas.id_paciente == Pacientes.id_paciente).filter(Consultas.id_usuario == estagiarioId).all()
        # Converter os objetos SQLAlchemy em dicionários
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
    else:
        #consulta_estag = db.session.query(Consultas, Pacientes.nome_completo).join(Pacientes,Consultas.id_paciente == Pacientes.id_paciente).filter(Consultas.id_grupo == consulta_grupo.grupo_id).all()
        consulta_estag = db.session.query(Consultas, Pacientes.nome_completo).join(Pacientes,Consultas.id_paciente == Pacientes.id_paciente).filter(Consultas.id_grupo == current_user.grupo).all()
        # Converter os objetos SQLAlchemy em dicionários
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

    # Adicionar os eventos adicionais
    #reunioes_grupo = ReuniaoGrupos.query.filter_by(id_grupo=consulta_grupo.grupo_id).all()
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

@app.route('/consulta_ids_estagiarios', methods=['GET'])
@login_required
def consulta_ids_estagiarios():
    estags = Usuarios.query.filter_by(grupo=current_user.grupo, cargo='2', status='true').all()

    #print(estags)

    estagiarios = [{'id_estagiario': estagiario.id_usuario, 'nome': estagiario.nome} for estagiario in estags]

    #print(estagiarios)

    return jsonify(estagiarios)
# Final Consultas dos estagiários

# Inicio Administração do grupo

@app.route('/meu_grupo')
@login_required
def meu_grupo():
    #grupo_do_usuario = CoordenadoresGrupos.query.filter_by(coordenador_id=current_user.id_usuario).first()

    grupo_info = Grupos.query.filter_by(id_grupo=current_user.grupo).first()

    #lista_coord_grupo = CoordenadoresGrupos.query.filter_by(grupo_id=current_user.grupo).all()
    #lista_coord_ids = [coord.coordenador_id for coord in lista_coord_grupo]
    #lista_coord = Usuarios.query.filter(Usuarios.id_usuario.in_(lista_coord_ids)).all()
    lista_coord = Usuarios.query.filter_by(grupo=current_user.grupo).filter_by(cargo='1').all()

    #lista_estag_grupo = EstagiariosGrupos.query.filter_by(grupo_id=current_user.grupo).all()
    #lista_estag_ids = [estag.estagiario_id for estag in lista_estag_grupo]
    #lista_estag = Usuarios.query.filter(Usuarios.id_usuario.in_(lista_estag_ids)).all()
    lista_estag = Usuarios.query.filter_by(grupo=current_user.grupo).filter_by(cargo='2').filter_by(status=True).all()
    lista_estag_count = Usuarios.query.filter_by(grupo=current_user.grupo).filter_by(cargo='2').filter_by(status=True).count()

    if lista_estag_count >= grupo_info.vagas:
        botao_vagas = 'disabled'
    else:
        botao_vagas = ''

    #Reuniões

    DIAS_DA_SEMANA = {
        0: 'Domingo',
        1: 'Segunda-feira',
        2: 'Terça-feira',
        3: 'Quarta-feira',
        4: 'Quinta-feira',
        5: 'Sexta-feira',
        6: 'Sábado'
    }

    #reunioes = ReuniaoGrupos.query.filter_by(id_grupo=grupo_do_usuario.grupo_id).all()
    reunioes = ReuniaoGrupos.query.filter_by(id_grupo=current_user.grupo).all()

    # Converte os números dos dias para os nomes dos dias
    for reuniao in reunioes:
        reuniao.dia = DIAS_DA_SEMANA.get(reuniao.dia, 'Entre em contato com o administrador do sistema.')

    return render_template('sup_meu_grupo.html', titulo='Meus Grupos', grupo_info=grupo_info, lista_coord=lista_coord, lista_estag=lista_estag, lista_estag_count=lista_estag_count, botao_vagas=botao_vagas, reunioes=reunioes)

@app.route('/reg_estag_diretamente')
@login_required
def reg_estag_diretamente():
    criacao = date.today()
    validade = criacao + timedelta(days = 182)

    grupo_info = Grupos.query.filter_by(id_grupo=current_user.grupo).first()

    return render_template('sup_add_estagiario_diretamente.html', titulo='Registrar estagiario', grupo_info=grupo_info, criacao=criacao, validade=validade)

@app.route('/concluir_reg_estag_diretamente', methods=['POST',])
@login_required
def concluir_reg_estag_diretamente():
    nome = request.form['inputName']
    email = request.form['inputEmail']
    senha = generate_password_hash(request.form['inputPassword']).decode('utf-8')
    matricula = request.form['inputMatricula']
    cargo = request.form['inputCargo']
    grupo = request.form['inputGrupo']
    #status = request.form['inputStatus']
    status = True
    criado_em = request.form['inputDataEntrada']
    valido_ate = request.form['inputDataValidade']

    aux_email = Usuarios.query.filter_by(email=email).first()
    print(aux_email)
    if aux_email:
        flash('Email já cadastrado. Não é possível registrar novamente o mesmo email. Por favor, use a opção de cadastro por lista para verificar se o estagiário está disponivel.')
        return redirect(url_for('meu_grupo'))

    estag_novo = Usuarios(matricula=matricula, nome=nome, email=email, senha=senha, cargo=cargo, grupo=grupo, status=status, criado_em=criado_em, valido_ate=valido_ate)
    db.session.add(estag_novo)
    db.session.commit()

    #estag_novo_adicionado = Usuarios.query.filter_by(email=email).first()

    #grupo_id = current_user.grupo
    #estagiario_id = estag_novo_adicionado.id_usuario
    #coordenador_id = current_user.id_usuario

    #estag_novo_grupo = EstagiariosGrupos(grupo_id=grupo_id, estagiario_id=estagiario_id, coordenador_id=coordenador_id)
    #db.session.add(estag_novo_grupo)

    db.session.commit()

    return redirect(url_for('meu_grupo'))

@app.route('/adicionar_reuniao', methods=['POST',])
@login_required
def adicionar_reuniao():
    data = request.get_json()

    id_grupo = data.get('id_grupo')
    diaReuniao = data.get('diaReuniao')
    horainiReuniao = data.get('horainiReuniao')
    horafimReuniao = data.get('horafimReuniao')

    if not diaReuniao or not horainiReuniao or not horafimReuniao:
        return jsonify({'status': 'error', 'message': 'Missing data'}), 400

    #reuniao_existe = ReuniaoGrupos.query.filter_by(dia=diaReuniao, hora_inicio=horainiReuniao, hora_fim=horafimReuniao).first()
    reuniao_existe = ReuniaoGrupos.query.filter(ReuniaoGrupos.dia == diaReuniao, ReuniaoGrupos.hora_inicio <= horafimReuniao, ReuniaoGrupos.hora_fim >= horainiReuniao).first()

    if reuniao_existe:
        return jsonify({'status': 'error', 'message': 'Já existe uma reunião com o mesmo dia e horários selecionados. Por favor, escolha outro.'}), 400

    nova_reuniao = ReuniaoGrupos(id_grupo=id_grupo, dia=diaReuniao, hora_inicio=horainiReuniao, hora_fim=horafimReuniao)
    db.session.add(nova_reuniao)
    db.session.commit()

    return jsonify({'status': 'success','id_grupo':id_grupo , 'diaR': diaReuniao, 'horainiR': horainiReuniao, 'horafimR':horafimReuniao, 'idRe': nova_reuniao.id_reuniaogrupos })

@app.route('/remover_reuniao', methods=['POST',])
@login_required
def remover_reuniao():
    id_reuniao_grupo = request.form.get('id_reuniao_grupo')
    if id_reuniao_grupo:
        ReuniaoGrupos.query.filter_by(id_reuniaogrupos=id_reuniao_grupo).delete()
        db.session.commit()

        return jsonify({'status': 'success'})
    return jsonify(status='error', message='ID enviado está com problema!')


@app.route('/sup_meu_estagiario/<int:id_estagiario>')
@login_required
def sup_meu_estagiario(id_estagiario):
    estagiario_info = Usuarios.query.filter_by(id_usuario=id_estagiario).first()

    pacientes_info = Pacientes.query.filter_by(id_estagiario=estagiario_info.id_usuario).all()

    media_idade = db.session.query(func.avg(Pacientes.idade)).filter_by(id_estagiario=estagiario_info.id_usuario).scalar()
    media_idade = media_idade if media_idade is not None else 0

    quantidade_fichas = FolhaEvolucao.query.filter_by(id_estagiario=estagiario_info.id_usuario).count()

    quantidade_consultas = Consultas.query.filter_by(id_usuario=estagiario_info.id_usuario, status='Realizado').count()

    consultas_realizadas = Consultas.query.filter_by(id_usuario=estagiario_info.id_usuario, status='Realizado').all()
    total_horas_consultas = sum([(consulta.hora_fim.hour - consulta.hora_inicio.hour) +
                                 (consulta.hora_fim.minute - consulta.hora_inicio.minute) / 60.0 for consulta in consultas_realizadas])
    total_horas_consultas = total_horas_consultas if total_horas_consultas is not None else 0

    return render_template('sup_meu_estagiario.html', titulo='Meu estagiário', estagiario_info=estagiario_info, pacientes_info=pacientes_info, media_idade=media_idade, quantidade_fichas=quantidade_fichas, quantidade_consultas=quantidade_consultas, total_horas_consultas=total_horas_consultas)


@app.route('/sup_primeira_estatistica_estagiario/<int:id_estagiario>')
@login_required
def sup_primeira_estatistica_estagiario(id_estagiario):
    estagiario_info = Usuarios.query.filter_by(id_usuario=id_estagiario).first()
    pacientes = Pacientes.query.filter_by(id_estagiario=estagiario_info.id_usuario).all()
    idades = [p.idade for p in pacientes]
    return jsonify(idades)

@app.route('/sup_segunda_estatistica_estagiario/<int:id_estagiario>')
@login_required
def sup_segunda_estatistica_estagiario(id_estagiario):
    estagiario_info = Usuarios.query.filter_by(id_usuario=id_estagiario).first()
    pacientes = Pacientes.query.filter_by(id_estagiario=estagiario_info.id_usuario).all()
    generos = {'M': 0, 'F': 0}
    for p in pacientes:
        if p.sexo in generos:
            generos[p.sexo] += 1
    return jsonify(generos)

@app.route('/sup_terceira_estatistica_estagiario/<int:id_estagiario>')
@login_required
def sup_terceira_estatistica_estagiario(id_estagiario):
    estagiario_info = Usuarios.query.filter_by(id_usuario=id_estagiario).first()
    pacientes = Pacientes.query.filter_by(id_estagiario=estagiario_info.id_usuario).all()
    escolaridade = {}
    for p in pacientes:
        if p.escolaridade in escolaridade:
            escolaridade[p.escolaridade] += 1
        else:
            escolaridade[p.escolaridade] = 1
    return jsonify(escolaridade)

@app.route('/sup_quarta_estatistica_estagiario/<int:id_estagiario>')
@login_required
def sup_quarta_estatistica_estagiario(id_estagiario):
    estagiario_info = Usuarios.query.filter_by(id_usuario=id_estagiario).first()
    pacientes = Pacientes.query.filter_by(id_estagiario=estagiario_info.id_usuario).all()
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

@app.route('/sup_ficha_paciente/<int:id>')
@login_required
def sup_ficha_paciente(id):
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
    aux_folhas_pacientes = FolhaEvolucao.query.filter_by(id_paciente=id).order_by(FolhaEvolucao.id_folha.asc()).all()

    folhas_pacientes = []
    for folha in aux_folhas_pacientes:
        try:
            postagem_descriptografada = crypt.decrypt(folha.postagem.encode('utf-8')).decode('utf-8')
            folha.postagem = postagem_descriptografada
            folhas_pacientes.append(folha)
        except Exception as e:
            print(f'Erro ao descriptografar a postagem: {e}')
            folhas_pacientes.append({
                'id_folha': folha.id_folha,
                'postagem': 'Erro na descriptografia',
                'id_paciente': folha.id_paciente,
                'id_estagiario': folha.id_estagiario,
                'nome_estagiario': folha.nome_estagiario,
                'data_postagem': folha.data_postagem
            })

    #return render_template('est_ficha_paciente.html', titulo='Ficha do Paciente', formulario_paciente=formulario_paciente, outrasopcoes=outrasopcoes, capa=capa, folhas_pacientes=folhas_pacientes)
    return render_template('sup_ficha_paciente.html', titulo='Ficha do Paciente', formulario_paciente=formulario_paciente, outrasopcoes=outrasopcoes, folhas_pacientes=folhas_pacientes)


@app.route('/sup_check_ficha/<int:id>', methods=['POST'])
@login_required
def sup_check_ficha(id):
    folha = FolhaEvolucao.query.get_or_404(id)
    folha.check_supervisor = f"{current_user.id_usuario}+{current_user.nome}"
    folha.data_check_supervisor = datetime.now().replace(microsecond=0)
    db.session.commit()
    return jsonify({'revisor': current_user.nome, 'data_revisao': folha.data_check_supervisor.strftime('%d/%m/%Y %H:%M:%S')})


@app.route('/dashboard_coordenacao', methods=['POST',])
@login_required
def dashboard_coordenacao():
    return jsonify({'status': 'success'})