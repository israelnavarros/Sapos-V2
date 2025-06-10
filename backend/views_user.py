from flask import  render_template, request, redirect, session, flash, url_for, send_from_directory, jsonify
from sapo import app, db, mail
from flask_login import login_user, logout_user, login_required, current_user
from models import Usuarios, Formularios
from helpers import FormularioLogin, FormularioInscricao, recupera_imagem_usuario, deleta_imagem_usuario
from sqlalchemy import text
from flask_bcrypt import check_password_hash, generate_password_hash
from flask_mail import Message
import random, datetime, json, time, os, base64

@app.route('/')
def home():
    form = FormularioLogin()
    redirecionar = request.args.get('redirecionar')
    return render_template('home.html', titulo='Pagina inicial', redirecionar=redirecionar, form=form)

@app.route('/index')
@login_required
def index():
    return render_template('index.html', titulo='Pagina inicial')

@app.route('/autenticar', methods=['POST',])
def autenticar():
    form = FormularioLogin(request.form)

    usuario = Usuarios.query.filter_by(email=form.email.data).first()

    if usuario:
        senha = check_password_hash(usuario.senha, form.senha.data)
        if senha:
            #session['usuario_logado'] = [usuario.email, usuario.nome, usuario.matricula] substituido pelo flask-login
            login_user(usuario)

            flash(usuario.nome + ' logado com sucesso!!')
            redirecionar = request.form['redirecionar']
            return redirect(redirecionar)

    flash('Usuário ou senha incorreta.')
    return redirect(url_for('home'))

#    if request.form['email'] in usuarios:
#        usuario = usuarios[request.form['email']]
#        if request.form['senha'] == usuario.senha:
#            session['usuario_logado'] = usuario.email
#            flash(usuario.nome + ' logado com sucesso!')
#            redirecionar = request.form['redirecionar']
#            return redirect(redirecionar)

@app.route('/logout')
@login_required
def logout():
    #session['usuario_logado'] = None substituido pelo flask-login
    logout_user()
    #session.clear()
    flash('Usuário deslogado com sucesso.')
    return redirect(url_for('home'))

@app.route('/unauthorized')
def unauthorized():
    return 'Você não tem permissão para acessar esta página.'

@app.route('/meuperfil/<int:profile>' , methods=["GET", "POST"])
@login_required
def meuperfil(profile):
    if profile != current_user.id_usuario:
        return redirect(url_for('unauthorized'))

    profile = Usuarios.query.filter_by(id_usuario=profile).first()

    return render_template('meuperfil.html', titulo='Perfil de '+profile.nome, profile=profile)

@app.route('/uploads/usuarios/<id>')
def imagem_usuario(id):
    imagem = recupera_imagem_usuario(id)
    return send_from_directory(app.config['UPLOAD_USUARIOS_PATH'], imagem)

@app.route('/upload_imagem_usuario_perfil', methods=['POST'])
def upload_imagem_usuario_perfil():
    if 'avatar' not in request.files:
        return jsonify({'error': 'Nenhuma imagem enviada'}), 400

    file = request.files['avatar']

    if file:
        deleta_imagem_usuario(current_user.id_usuario)

        upload_path = app.config['UPLOAD_USUARIOS_PATH']
        tempo = time.time()
        filename = f'avatar{current_user.id_usuario}-{int(tempo)}.jpg'
        file_path = os.path.join(upload_path, filename)
        file.save(file_path)

        # Gera a URL para a imagem com um parâmetro de tempo para evitar cache
        avatar_url = url_for('imagem_usuario', id=current_user.id_usuario, _external=True)

        return jsonify({'avatarUrl': avatar_url}), 200
    else:
        return jsonify({'error': 'Ocorreu um erro ao adicionar a imagem no Sistema'}), 400


@app.route('/remover_imagem_usuario_perfil', methods=['POST'])
def remover_imagem_usuario_perfil():
    deleta_imagem_usuario(current_user.id_usuario)

    # Gera a URL para a imagem padrão
    avatar_url = url_for('imagem_usuario', id=current_user.id_usuario, _external=True)

    return jsonify({'avatarUrl': avatar_url}), 200