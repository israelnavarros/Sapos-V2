from flask import send_from_directory
from helpers import recupera_imagem_pacientes
from flask_login import login_required, current_user
from main import app, db, mail
import os

@app.route('/api/uploads/pacientes/<id>', methods=['GET'])
@login_required
def imagem_paciente_tabela(id):
    imagem = recupera_imagem_pacientes(id)
    send_path = app.config['UPLOAD_PACIENTES_PATH']
    if imagem == 'capa_padrao.jpg':
        send_path = app.config['DEFAULT_IMAGES_PATH']
    return send_from_directory(send_path, imagem)