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
@app.route('/consulta_secretaria', methods=['GET'])
@login_required
def consulta_secretaria():
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

@app.route('/consulta_ids_grupos', methods=['GET'])
@login_required
def consulta_ids_grupos():
    grupos = Grupos.query.order_by(Grupos.id_grupo.asc()).all()
    grupos = [{'id_grupo': grupo.id_grupo, 'titulo': grupo.titulo} for grupo in grupos]
    return jsonify(grupos)
# Final Consultas da secretaria

@app.route('/administracao')
@login_required
def administracao():
    return render_template('administracao.html', titulo ='Administração')

#criado temporariamente pois vamos discutir como vai ser feito o registro dos psicologos
#As opções são: criar um link para ele se registrar por completo ou apenas um para ele mudar a senha
@app.route('/adm_usuarios')
@login_required
def adm_usuarios():
    lista = Usuarios.query.all()
    habilitar_validade = date.today() + timedelta(days=7)
    return render_template('adm_usuarios.html', titulo='Administração de usuarios', lista=lista, habilitar_validade=habilitar_validade)

@app.route('/adm_alterar_validade/<int:id>')
@login_required
def adm_alterar_validade(id):
    usuario = Usuarios.query.filter_by(id_usuario=id).first()

    match usuario.cargo:
        case 0:
            nova_validade = usuario.valido_ate + datetime.timedelta(days=910)
            usuario.valido_ate = nova_validade
        case 1:
            nova_validade = usuario.valido_ate + datetime.timedelta(days=1820)
            usuario.valido_ate = nova_validade
        case 2:
            nova_validade = usuario.valido_ate + datetime.timedelta(days=182)
            usuario.valido_ate = nova_validade

    db.session.commit()

    return redirect(url_for('adm_usuarios'))


@app.route('/registrar')
@login_required
def registrar():
    criacao = datetime.date.today()
    validade = criacao + datetime.timedelta(days = 1825)
    return render_template('adm_add_usuario.html', criacao=criacao, validade=validade)

@app.route('/concluirregistro', methods=['POST',])
@login_required
def concluirregistro():
    nome = request.form['inputName']
    email = request.form['inputEmail']
    senha = generate_password_hash(request.form['inputPassword']).decode('utf-8')
    matricula = request.form['inputMatricula']
    aux_cargo = request.form['inputCargo']
    grupo = request.form['inputGrupo']
    #status = request.form['inputStatus']
    status = True
    criado_em = request.form['inputDataEntrada']
    valido_ate = request.form['inputDataValidade']

    if aux_cargo == 'Estagiario':
        cargo = 2
    elif aux_cargo == 'Coordenador':
        cargo = 1

    if grupo == '':
        grupo = None

    user = Usuarios(matricula=matricula, nome=nome, email=email, senha=senha, cargo=cargo, grupo=grupo, status=status, criado_em=criado_em, valido_ate=valido_ate)
    db.session.add(user)
    db.session.commit()
    return redirect(url_for('administracao'))

@app.route('/registrar_coordenador')
@login_required
def registrar_coordenador():
    criacao = date.today()
    validade = criacao + timedelta(days = 1825)
    return render_template('adm_add_usuario.html', titulo='Registrar coordenador', cargo='1', criacao=criacao, validade=validade)

#futuramente deletar
@app.route('/registrar_estagiario')
@login_required
def registrar_estagiario():
    criacao = date.today()
    validade = criacao + timedelta(days = 182)
    return render_template('adm_add_usuario.html', titulo='Registrar estagiario', cargo='2', criacao=criacao, validade=validade)

# fim do criado temporariamente

#Bloco de criação dos grupos
@app.route('/adm_grupos')
@login_required
def adm_grupos():
    lista_grupos = Grupos.query.order_by(Grupos.id_grupo)
    return render_template('adm_grupos.html', titulo='Administração de grupos', lista_grupos=lista_grupos)

@app.route('/adm_atualizar_vaga_grupo', methods=['POST',])
@login_required
def adm_atualizar_vaga_grupo():
    data = request.get_json()
    grupo_id = data['id']
    novas_vagas = data['vagas']

    if grupo_id is None or novas_vagas is None:
        return jsonify({'success': False, 'message': 'Dados inválidos'}), 400

    grupo = Grupos.query.get(grupo_id)
    if grupo:
        grupo.vagas = novas_vagas
        db.session.commit()
        return jsonify({'success': True})
    else:
        return jsonify({'success': False, 'message': 'Algo ocorreu com o grupo.'}), 404

@app.route('/criar_grupo')
@login_required
def criar_grupo():
    form_grupo = FormularioGrupo()
    return render_template('adm_add_grupo.html', titulo='Criação de grupos', form_grupo=form_grupo)

@app.route('/concluir_cadastro_grupo', methods=['POST',])
@login_required
def concluir_cadastro_grupo():
    form_grupo = FormularioGrupo(request.form)

    #id_grupo criado automaticamente
    titulo = form_grupo.titulo.data
    vagas = form_grupo.vagas.data
    convenio = form_grupo.convenio.data
    local = form_grupo.local.data
    resumo = form_grupo.resumo.data
    objetivos = form_grupo.objetivos.data
    atividades = form_grupo.atividades.data
    bibliografia = form_grupo.bibliografia.data

    novo_grupo = Grupos(titulo=titulo, vagas=vagas, convenio=convenio, local=local, resumo=resumo, objetivos=objetivos, atividades=atividades, bibliografia=bibliografia)

    db.session.add(novo_grupo)
    db.session.commit()
    return redirect(url_for('administracao'))

@app.route('/editar_grupo/<int:id>')
@login_required
def editar_grupo(id):
    #if 'usuario_logado' not in session or session['usuario_logado'] == None:
    #    return redirect(url_for('login', redirecionar=url_for('editar_grupo', id=id)))

    dados_grupo = Grupos.query.filter_by(id_grupo=id).first()

    form_grupo = FormularioGrupo()

    form_grupo.id_grupo.data = dados_grupo.id_grupo
    form_grupo.titulo.data = dados_grupo.titulo
    form_grupo.vagas.data = dados_grupo.vagas
    form_grupo.convenio.data = dados_grupo.convenio
    form_grupo.local.data = dados_grupo.local
    form_grupo.resumo.data = dados_grupo.resumo
    form_grupo.objetivos.data = dados_grupo.objetivos
    form_grupo.atividades.data = dados_grupo.atividades
    form_grupo.bibliografia.data = dados_grupo.bibliografia

    return render_template('adm_edit_grupo.html', titulo='Editando uma consulta', form_grupo=form_grupo)

@app.route('/atualizar_grupo', methods=['POST',])
def atualizar_grupo():
    form_grupo = FormularioGrupo(request.form)

    if form_grupo.validate_on_submit():
        #grupo = Grupos.query.filter_by(id_grupo=request.form['id_grupo']).first()
        grupo = Grupos.query.filter_by(id_grupo=form_grupo.id_grupo.data).first()

        grupo.titulo = form_grupo.titulo.data
        grupo.vagas = form_grupo.vagas.data
        grupo.convenio = form_grupo.convenio.data
        grupo.local = form_grupo.local.data
        grupo.resumo = form_grupo.resumo.data
        grupo.objetivos = form_grupo.objetivos.data
        grupo.atividades = form_grupo.atividades.data
        grupo.bibliografia = form_grupo.bibliografia.data

        db.session.add(grupo)
        db.session.commit()

    return redirect(url_for('adm_grupos'))

@app.route('/coordenador_por_grupo/<int:id>')
@login_required
def coordenador_por_grupo(id):
    id_grupo = id

    lista1 = Usuarios.query.filter_by(cargo='1', grupo=None).all()

    #Deletar comentario após estar tudo ok
    #coordenadores_do_grupo = CoordenadoresGrupos.query.filter_by(grupo_id=id).all()
    coordenadores_do_grupo = Usuarios.query.filter_by(cargo='1', grupo=id_grupo).all()

    lista2 = []

    for coordenador in coordenadores_do_grupo:
        usuario = Usuarios.query.get(coordenador.id_usuario)
        lista2.append(usuario)
        #lista1.remove(usuario) Não precisa, pois já está sendo removido do filtro

    return render_template('adm_coordenador_por_grupo.html', titulo='Alterar ou Incluir coordenador para grupo', lista1=lista1, lista2=lista2, id_grupo=id_grupo)

@app.route('/atualizado_coordenadores', methods=['POST'])
def atualizado_coordenadores():
    id_grupo_selecionado = request.form['id_grupo']
    opcoes_selecionadas_json = request.form.get('opcoesSelecionadas')
    opcoes_selecionadas = json.loads(opcoes_selecionadas_json) if opcoes_selecionadas_json else []

    #Deletar após verificar que está tudo certo
    #coordenadores_do_grupo = CoordenadoresGrupos.query.filter_by(grupo_id=id_grupo_selecionado).all()
    coordenadores_do_grupo = Usuarios.query.filter_by(grupo=id_grupo_selecionado).all()

    for coordenador in coordenadores_do_grupo:
        #if Usuarios.query.get(coordenador.coordenador_id) not in opcoes_selecionadas:
        if Usuarios.query.get(coordenador.id_usuario) not in opcoes_selecionadas:
            db.session.delete(coordenador)

            usuario = Usuarios.query.get(coordenador.id_usuario)
            usuario.grupo = None
            db.session.add(usuario)

    for usuario in opcoes_selecionadas:
        #novo_coordenador = CoordenadoresGrupos(grupo_id=id_grupo_selecionado, coordenador_id=usuario)
        #db.session.add(novo_coordenador)

        usuario = Usuarios.query.get(usuario)
        usuario.grupo = id_grupo_selecionado
        db.session.add(usuario)

    db.session.commit()

    #return jsonify({'message': opcoes_selecionadas})
    return redirect(url_for('adm_grupos'))

## fim do bloco de grupos
## inicio bloco pacientes
@app.route('/adm_pacientes')
@login_required
def adm_pacientes():
    pacientes = Pacientes.query.all()
    lista_pacientes = []

    for paciente in pacientes:
        estagiario = Usuarios.query.filter_by(id_usuario=paciente.id_estagiario).first()
        coordenador = Usuarios.query.filter_by(id_usuario=paciente.id_supervisor).first()
        lista_pacientes.append({
            'paciente': paciente,
            'estagiario_nome': estagiario.nome if estagiario else 'N/A',
            'coordenador_nome': coordenador.nome if coordenador else 'N/A'
        })

    return render_template('adm_pacientes.html', titulo='Administração de pacientes', lista_pacientes=lista_pacientes)

@app.route('/adm_editar_paciente/<int:id>')
@login_required
def adm_editar_paciente(id):
    dados_paciente = Pacientes.query.filter_by(id_paciente=id).first()

    formulario_paciente = FormularioPaciente(request.form)

    outrasopcoes = ""

    if dados_paciente.origem_encaminhamento == 'Procura Espontânea' or dados_paciente.origem_encaminhamento == 'Área de Educação' or dados_paciente.origem_encaminhamento == 'Área Jurídica' or dados_paciente.origem_encaminhamento == 'Área de Saúde' or dados_paciente.origem_encaminhamento == 'Área de Trabalho':
        formulario_paciente.origem_encaminhamento.data = dados_paciente.origem_encaminhamento
    else:
        outrasopcoes = dados_paciente.origem_encaminhamento
        dados_paciente.origem_encaminhamento = 'Outras'
        formulario_paciente.origem_encaminhamento.data = dados_paciente.origem_encaminhamento

    estagiario_responsavel = Usuarios.query.filter_by(id_usuario=dados_paciente.id_estagiario).first()
    supervisor_responsavel = Usuarios.query.filter_by(id_usuario=dados_paciente.id_supervisor).first()


    formulario_paciente.id_estagiario.data              = estagiario_responsavel.nome
    formulario_paciente.id_supervisor.data              = supervisor_responsavel.nome
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


    capa = recupera_imagem_pacientes(id)

    return render_template('adm_edit_paciente.html', titulo='Administração de pacientes', formulario_paciente=formulario_paciente, outrasopcoes=outrasopcoes, capa=capa)

@app.route('/adm_paciente_atualizado', methods=['POST',])
def adm_paciente_atualizado():
    formulario_paciente = FormularioPaciente(request.form)

    paciente_atualizado = Pacientes.query.filter_by(id_paciente=formulario_paciente.id_paciente.data).first()

    formulario_paciente.id_estagiario = paciente_atualizado.id_estagiario
    formulario_paciente.id_supervisor = paciente_atualizado.id_supervisor
    formulario_paciente.status.data = True
    #formulario_paciente.status.data = paciente_atualizado.status
    formulario_paciente.data_criacao.data = paciente_atualizado.data_criacao

    if formulario_paciente.validate_on_submit():

        paciente_atualizado.nome_completo = formulario_paciente.nome_completo.data
        paciente_atualizado.nome_responsavel = formulario_paciente.nome_responsavel.data
        paciente_atualizado.grau_parentesco = formulario_paciente.grau_parentesco.data
        paciente_atualizado.data_nascimento = formulario_paciente.data_nascimento.data
        paciente_atualizado.idade = formulario_paciente.idade.data
        paciente_atualizado.sexo = formulario_paciente.sexo.data
        paciente_atualizado.escolaridade = formulario_paciente.escolaridade.data
        paciente_atualizado.profissao = formulario_paciente.profissao.data
        paciente_atualizado.ocupacao = formulario_paciente.ocupacao.data
        paciente_atualizado.salario = formulario_paciente.salario.data
        paciente_atualizado.renda_familiar = formulario_paciente.renda_familiar.data
        paciente_atualizado.cep = formulario_paciente.cep.data
        paciente_atualizado.cidade = formulario_paciente.cidade.data
        paciente_atualizado.bairro = formulario_paciente.bairro.data
        paciente_atualizado.logradouro = formulario_paciente.logradouro.data
        paciente_atualizado.complemento = formulario_paciente.complemento.data
        paciente_atualizado.telefone = formulario_paciente.telefone.data
        paciente_atualizado.celular1 = formulario_paciente.celular1.data
        paciente_atualizado.celular2 = formulario_paciente.celular2.data
        paciente_atualizado.origem_encaminhamento = formulario_paciente.origem_encaminhamento.data
        paciente_atualizado.nome_instituicao = formulario_paciente.nome_instituicao.data
        paciente_atualizado.nome_resp_encaminhamento = formulario_paciente.nome_resp_encaminhamento.data
        paciente_atualizado.motivo = formulario_paciente.motivo.data
        paciente_atualizado.medicamentos = formulario_paciente.medicamentos.data

        if formulario_paciente.origem_encaminhamento.data == 'Outras':
            paciente_atualizado.origem_encaminhamento = request.form['outrasOpcao']

        db.session.add(paciente_atualizado)
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
                deleta_imagem_pacientes(paciente_atualizado.id_paciente)
                filename = f'capa{paciente_atualizado.id_paciente}-{timestamp}.png'
                filepath = os.path.join(app.config['UPLOAD_PACIENTES_PATH'], filename)

                # Salva a imagem no diretório especificado
                with open(filepath, 'wb') as f:
                    f.write(cropped_image_bytes)
            except Exception as e:
                return 'Error: {}'.format(e)

    else:
        print(formulario_paciente.errors)

    return redirect(url_for('adm_pacientes'))

@app.route('/adm_mudar_status_paciente/<int:id>')
@login_required
def adm_mudar_status_paciente(id):
    dados_paciente = Pacientes.query.filter_by(id_paciente=id).first()

    if dados_paciente.status == True:
        dados_paciente.status = False
    else:
        dados_paciente.status = True

    db.session.commit()

    return redirect(url_for('adm_pacientes'))


@app.route('/adm_modificar_responsavel_paciente/<int:id>')
@login_required
def adm_modificar_responsavel_paciente(id):
    dados_paciente = Pacientes.query.filter_by(id_paciente=id).first()

    dados_estagiario = Usuarios.query.filter_by(id_usuario=dados_paciente.id_estagiario).first()
    dados_supervisor = Usuarios.query.filter_by(id_usuario=dados_paciente.id_supervisor).first()
    dados_grupo = Grupos.query.filter_by(id_grupo=dados_estagiario.grupo).first()

    grupos = Grupos.query.all()

    return render_template('adm_modificar_responsavel_paciente.html', titulo='Modificar Responsável', nome_grupo=dados_grupo.titulo, nome_estagiario=dados_estagiario.nome, nome_supervisor=dados_supervisor.nome, grupos=grupos)

@app.route('/adm_atualizar_responsavel_paciente/<int:id>', methods=['POST'])
@login_required
def adm_atualizar_responsavel_paciente(id):
    data = request.get_json()

    grupo_id = data.get('grupo_id')
    supervisor_id = data.get('supervisor_id')
    estagiario_id = data.get('estagiario_id')

    print(id)
    print(grupo_id)
    print(supervisor_id)
    print(estagiario_id)

    dados_paciente = Pacientes.query.filter_by(id_paciente=id).first()
    dados_paciente.id_estagiario = estagiario_id
    dados_paciente.id_supervisor = supervisor_id

    db.session.commit()

    #return redirect(url_for('adm_pacientes'))
    return jsonify({'status': 'success', 'redirect_url': url_for('adm_pacientes')})

@app.route('/adm_busca_supervisores/<grupo_id>')
def adm_busca_supervisores(grupo_id):
    supervisores = Usuarios.query.filter_by(grupo=grupo_id).filter_by(cargo="1").all()
    return jsonify([{'id': s.id_usuario, 'nome': s.nome} for s in supervisores])

@app.route('/adm_busca_estagiarios/<grupo_id>')
def adm_busca_estagiarios(grupo_id):
    estagiarios = Usuarios.query.filter_by(grupo=grupo_id).filter_by(cargo="2").all()
    return jsonify([{'id': e.id_usuario, 'nome': e.nome} for e in estagiarios])

## fim do bloco pacientes

##inicio do bloco de avisos
@app.route('/adm_alertas')
@login_required
def adm_alertas():
    lista = Alertas.query.all()
    return render_template('adm_alertas.html', titulo='Administração de Alertas', lista=lista)


@app.route('/adm_adicionar_alerta')
@login_required
def adm_adicionar_alerta():
    formulario_alerta = FormularioAlerta()
    return render_template('adm_add_alerta.html', titulo='Criação de Alertas', formulario_alerta=formulario_alerta)

@app.route('/adm_alerta_adicionado', methods=['POST',])
@login_required
def adm_alerta_adicionado():
    formulario_alerta = FormularioAlerta(request.form)

    titulo = formulario_alerta.titulo.data
    mensagem = formulario_alerta.mensagem.data
    validade = formulario_alerta.validade.data


    novo_alerta = Alertas(titulo=titulo, mensagem=mensagem, validade=validade)

    db.session.add(novo_alerta)
    db.session.commit()

    return redirect(url_for('adm_alertas'))

@app.route('/adm_deletar_alerta/<int:id>')
@login_required
def adm_deletar_alerta(id):

    Alertas.query.filter_by(id_alerta=id).delete()
    db.session.commit()

    return redirect(url_for('adm_alertas'))

## fim do bloco de avisos


## bloco de charts
''' Desativado
@app.route('/sec_visualizar_consultas_diaria')
@login_required
def sec_visualizar_consultas_diaria():

    hoje = datetime.date.today()

    data_especifica = datetime.date.today()

    print(hoje)

    #consultas_diarias = Consultas.query.filter_by(datetime_inicio=hoje).all()
    #consultas_diarias = Consultas.query.filter_by(func.date(Consultas.datetime_inicio) == hoje).all()
    consultas_diarias = Consultas.query.filter_by(func.date(Consultas.datetime_inicio) == data_especifica).all()

    return jsonify(consultas_diarias)'''