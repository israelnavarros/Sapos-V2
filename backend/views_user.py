from flask import request, redirect, url_for, send_from_directory, jsonify
from main import app
from flask_login import login_user, logout_user, login_required, current_user
from models import Usuarios
from helpers import FormularioLogin, FormularioInscricao, recupera_imagem_usuario, deleta_imagem_usuario
from sqlalchemy import text
from flask_bcrypt import check_password_hash, generate_password_hash
from flask_mail import Message
import random, datetime, json, time, os, base64

# @app.route('/')
# def home():
#     form = FormularioLogin()
#     redirecionar = request.args.get('redirecionar')
#     return render_template('home.html', titulo='Pagina inicial', redirecionar=redirecionar, form=form)

# @app.route('/index')
# @login_required
# def index():
#     return render_template('index.html', titulo='Pagina inicial')

# @app.route('/autenticar', methods=['POST',])
# def autenticar():
#     form = FormularioLogin(request.form)

#     usuario = Usuarios.query.filter_by(email=form.email.data).first()

#     if usuario:
#         senha = check_password_hash(usuario.senha, form.senha.data)
#         if senha:
#             login_user(usuario)

#             flash(usuario.nome + ' logado com sucesso!!')
#             redirecionar = request.form['redirecionar']
#             return redirect(redirecionar)

#     flash('Usuário ou senha incorreta.')
#     return redirect(url_for('home'))

@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    senha = data.get('senha')
    usuario = Usuarios.query.filter_by(email=email).first()
    if usuario and check_password_hash(usuario.senha, senha):
        login_user(usuario)
        return jsonify({
            "success": True,
            "message": f"{usuario.nome} logado com sucesso!",
            "user": {
                "id": usuario.id_usuario,
                "nome": usuario.nome,
                "email": usuario.email,
                "cargo": usuario.cargo,           
                "grupo": usuario.grupo,           
                "matricula": usuario.matricula    
            }
        }), 200
    return jsonify({"success": False, "message": "Usuário ou senha incorreta."}), 401

@app.route('/api/logout', methods=['POST'])
@login_required
def logout():
    logout_user()
    # flash('Usuário deslogado com sucesso.')
    # return redirect(url_for('home'))
    return jsonify({"success": True, "message": "Usuário deslogado com sucesso."}), 200

# @app.route('/unauthorized')
# def unauthorized():
#     return 'Você não tem permissão para acessar esta página.'

# @app.route('/meuperfil/<int:profile>' , methods=["GET", "POST"])
# @login_required
# def meuperfil(profile):
#     if profile != current_user.id_usuario:
#         return redirect(url_for('unauthorized'))

#     profile = Usuarios.query.filter_by(id_usuario=profile).first()

#     return render_template('meuperfil.html', titulo='Perfil de '+profile.nome, profile=profile)

@app.route('/api/meuperfil/<int:profile>', methods=["GET"])
@login_required
def meuperfil(profile):
    if profile != current_user.id_usuario:
        return jsonify({'error': 'Não autorizado.'}), 403

    usuario = Usuarios.query.filter_by(id_usuario=profile).first()
    if not usuario:
        return jsonify({'error': 'Usuário não encontrado.'}), 404

    return jsonify({
        "id": usuario.id_usuario,
        "nome": usuario.nome,
        "email": usuario.email,
        "matricula": usuario.matricula,
        "cargo": usuario.cargo,
        "grupo": usuario.grupo,
        "status": usuario.status,
        "criado_em": str(usuario.criado_em),
        "valido_ate": str(usuario.valido_ate) 
    }), 200
@app.route('/api/atualizar_avatar_usuario/<int:id_usuario>', methods=['POST'])
@login_required
def atualizar_avatar_usuario(id_usuario):
    data = request.get_json()
    cropped_data = data.get('croppedData')
    if cropped_data:
        import base64, os, re
        deleta_imagem_usuario(id_usuario)
        match = re.match(r'data:image/(png|jpg|jpeg);base64,(.*)', cropped_data)
        if match:
            img_str = match.group(2)
            img_bytes = base64.b64decode(img_str)
            img_path = os.path.join(app.config['UPLOAD_USUARIOS_PATH'], f"avatar{id_usuario}.png")
            with open(img_path, "wb") as f:
                f.write(img_bytes)
    return jsonify({'success': True})
@app.route('/api/uploads/usuarios/<id>')
def api_imagem_usuario(id):
    imagem = recupera_imagem_usuario(id)
    return send_from_directory(app.config['UPLOAD_USUARIOS_PATH'], imagem)

@app.route('/api/upload_imagem_usuario_perfil', methods=['POST'])
@login_required
def api_upload_imagem_usuario_perfil():
    if 'avatar' not in request.files:
        return jsonify({'error': 'Nenhuma imagem enviada'}), 400

    file = request.files['avatar']

    if file:
        deleta_imagem_usuario(current_user.id_usuario)
        upload_path = app.config['UPLOAD_USUARIOS_PATH']
        filename = f'avatar{current_user.id_usuario}.jpg'
        file_path = os.path.join(upload_path, filename)
        file.save(file_path)
        avatar_url = url_for('api_imagem_usuario', id=current_user.id_usuario, _external=True)
        return jsonify({'avatarUrl': avatar_url}), 200
    else:
        return jsonify({'error': 'Ocorreu um erro ao adicionar a imagem no Sistema'}), 400

@app.route('/api/remover_imagem_usuario_perfil', methods=['POST'])
@login_required
def api_remover_imagem_usuario_perfil():
    deleta_imagem_usuario(current_user.id_usuario)
    avatar_url = url_for('api_imagem_usuario', id=current_user.id_usuario, _external=True)
    return jsonify({'avatarUrl': avatar_url}), 200

# @app.route('/uploads/usuarios/<id>')
# def imagem_usuario(id):
#     imagem = recupera_imagem_usuario(id)
#     return send_from_directory(app.config['UPLOAD_USUARIOS_PATH'], imagem)

# @app.route('/upload_imagem_usuario_perfil', methods=['POST'])
# def upload_imagem_usuario_perfil():
#     if 'avatar' not in request.files:
#         return jsonify({'error': 'Nenhuma imagem enviada'}), 400

#     file = request.files['avatar']

#     if file:
#         deleta_imagem_usuario(current_user.id_usuario)

#         upload_path = app.config['UPLOAD_USUARIOS_PATH']
#         tempo = time.time()
#         filename = f'avatar{current_user.id_usuario}-{int(tempo)}.jpg'
#         file_path = os.path.join(upload_path, filename)
#         file.save(file_path)

#         avatar_url = url_for('imagem_usuario', id=current_user.id_usuario, _external=True)

#         return jsonify({'avatarUrl': avatar_url}), 200
#     else:
#         return jsonify({'error': 'Ocorreu um erro ao adicionar a imagem no Sistema'}), 400


# @app.route('/remover_imagem_usuario_perfil', methods=['POST'])
# def remover_imagem_usuario_perfil():
#     deleta_imagem_usuario(current_user.id_usuario)

#     avatar_url = url_for('imagem_usuario', id=current_user.id_usuario, _external=True)

#     return jsonify({'avatarUrl': avatar_url}), 200