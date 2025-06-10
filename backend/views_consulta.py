from flask import  render_template, request, redirect, session, flash, url_for, send_from_directory
from sapo import app, db
from flask_login import login_required
from models import Consultas, Vagas, Pacientes, ReuniaoGrupos, Usuarios
from helpers import recupera_imagem, deleta_imagem, FormularioConsulta, FormularioVaga
from flask_login import login_required, current_user
from sqlalchemy import join
from flask import jsonify


#intenção de finalizar essa consulta, para poder deixar apenas as rotas com os cargos























@app.route('/novo')
def novo():
    if 'usuario_logado' not in session or session['usuario_logado'] == None:
        return redirect(url_for('login', redirecionar=url_for('novo')))
    form = FormularioConsulta()
    return render_template('novo.html', titulo='Criação de uma consulta', form=form)

@app.route('/criar', methods=['POST',])
def criar():
    form = FormularioConsulta(request.form)

    if not form.validate_on_submit():
        return redirect((url_for('novo')))

    id_consulta = form.id_consulta.data
    psicologo = form.psicologo.data
    horario = form.horario.data

    #id_consulta = request.form['id']
    #psicologo = request.form['psicologo']
    #horario = request.form['horario']
    #step="1", value="00:00:00" PARA TRATAMENTO DE SEGUNDOS
    #consulta = Consulta(id, psicologo, horario)
    #lista.append(consulta)

    #Validação sendo feita pelo ID, mudar futuramente
    consulta = Consultas.query.filter_by(id_consulta=id_consulta).first()

    if consulta:
        flash('Consulta já existente!')
        return redirect(url_for('index'))

    nova_consulta = Consultas(id_consulta=id_consulta, psicologo=psicologo, horario=horario)
    db.session.add(nova_consulta)
    db.session.commit()

    arquivo = request.files['arquivo']
    upload_path = app.config['UPLOAD_PATH']
    timestamp = time.time()
    arquivo.save(f'{upload_path}/capa{nova_consulta.id_consulta}-{timestamp}.jpg')

    return redirect(url_for('index'))

@app.route('/editar/<int:id>')
def editar(id):
    if 'usuario_logado' not in session or session['usuario_logado'] == None:
        return redirect(url_for('login', redirecionar=url_for('editar', id=id)))
    consulta = Consultas.query.filter_by(id_consulta=id).first()
    form = FormularioConsulta()

    form.id_consulta.data = consulta.id_consulta
    form.psicologo.data = consulta.psicologo
    form.horario.data = consulta.horario

    capa = recupera_imagem(id)
    return render_template('editar.html', titulo='Editando uma consulta', id=id, capa=capa, form=form)
    #return render_template('editar.html', titulo='Editando uma consulta', consulta=consulta, capa=capa, form=form)

@app.route('/atualizar', methods=['POST',])
def atualizar():
    form = FormularioConsulta(request.form)

    if form.validate_on_submit():
        consulta = Consultas.query.filter_by(id_consulta=request.form['id']).first()
        consulta.psicologo = form.psicologo.data
        consulta.horario = form.horario.data

        db.session.add(consulta)
        db.session.commit()

        arquivo = request.files['arquivo']
        upload_path = app.config['UPLOAD_PATH']
        timestamp = time.time()
        deleta_imagem(consulta.id_consulta)
        arquivo.save(f'{upload_path}/capa{consulta.id_consulta}-{timestamp}.jpg')

    return redirect(url_for('index'))

@app.route('/deletar/<int:id>')
def deletar(id):
    if 'usuario_logado' not in session or session['usuario_logado'] == None:
        return redirect(url_for('login'))

    Consultas.query.filter_by(id_consulta=id).delete()
    db.session.commit()
    flash('Consulta deletado com sucesso!')

    return redirect(url_for('index'))



@app.route('/uploads/<nome_arquivo>')
def imagem(nome_arquivo):
    return send_from_directory('uploads', nome_arquivo)

@app.route('/administrar/abrirvagas')
def abrirvagas():
    form_vaga = FormularioVaga()
    return render_template('abrirvagas.html', titulo='Pagina de Administração', form_vaga=form_vaga)

@app.route('/confirmarvaga', methods=['POST',])
def confirmarvaga():
    form_vaga = FormularioVaga(request.form)

    #id_vaga = form_vaga.id_vaga.data ID da vaga é criado automaticamente
    nome_vaga = form_vaga.nome_vaga.data
    id_admin = form_vaga.id_admin.data
    qnt_pessoas = form_vaga.qnt_pessoas.data
    ins_inicio = form_vaga.ins_inicio.data
    ins_fim = form_vaga.ins_fim.data


    nova_vaga = Vagas(nome_vaga=nome_vaga, id_admin=id_admin, qnt_pessoas=qnt_pessoas, ins_inicio=ins_inicio, ins_fim=ins_fim)
    db.session.add(nova_vaga)
    db.session.commit()

    return form_vaga.data


#def nome_paciente(id):
#    paciente = Pacientes.query.filter_by(id_paciente=id).first()
#
#    return paciente.nome_completo