from flask import send_from_directory, redirect, Response
from helpers import recupera_imagem_pacientes, gcs_signed_url, get_gcs_bucket
from flask_login import login_required, current_user
from main import app, db, mail
import os

@app.route('/api/uploads/pacientes/<id>', methods=['GET'])
@login_required
def imagem_paciente_tabela(id):
    imagem = recupera_imagem_pacientes(id)
    blob = get_gcs_bucket().blob(imagem)
    data = blob.download_as_bytes()
    return Response(data, mimetype=blob.content_type or 'image/jpeg')