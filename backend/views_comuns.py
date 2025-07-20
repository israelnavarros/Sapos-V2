from flask import send_from_directory
from helpers import recupera_imagem_pacientes
from flask_login import login_required, current_user
from main import app, db, mail
import os

@app.route('/api/uploads/pacientes/<id>', methods=['GET'])
@login_required
def imagem_paciente_tabela(id):
    imagem = recupera_imagem_pacientes(id)
    return send_from_directory(app.config['UPLOAD_PACIENTES_PATH'], imagem)