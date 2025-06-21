from flask import  render_template, request, jsonify, session, flash, url_for
from main import app, db, mail
from models import Formularios
from helpers import FormularioInscricao
from sqlalchemy import text
from flask_mail import Message
import random, datetime

#intenção de excluir este, deixar apenas as rotas com os cargos

# Endpoint para obter um id de inscrição (exemplo)
@app.route('/api/inscricao', methods=['GET'])
def api_inscricao():
    id = random.randint(0, 1000)
    return jsonify({
        "id": id,
        "mensagem": "Use este endpoint para obter um id de inscrição. O formulário deve ser enviado via POST para /api/inscricaofinalizada"
    })

# Endpoint para registrar inscrição
@app.route('/api/inscricaofinalizada', methods=['POST'])
def api_inscricaofinalizada():
    data = request.get_json()
    if not data:
        return jsonify({"success": False, "message": "Dados não enviados."}), 400

    data_atual = datetime.datetime.today()
    ano = str(data_atual.year)[-2:]
    mes = str(data_atual.month).zfill(2)
    dia = str(data_atual.day).zfill(2)
    aleatorio = str(random.randint(10, 99))
    id_form = "9" + ano + mes + dia + aleatorio

    nova_inscricao = Formularios(
        id_form=id_form,
        nomecompleto=data.get('nomecompleto'),
        cep=data.get('cep'),
        cidade=data.get('cidade'),
        estado=data.get('estado'),
        logradouro=data.get('logradouro'),
        complemento=data.get('complemento'),
        datanasc=data.get('datanasc'),
        cpf=data.get('cpf'),
        email=data.get('email'),
        telefone=data.get('telefone'),
        prefcontato=data.get('prefcontato'),
        sitcivil=data.get('sitcivil'),
        situemprg=data.get('situemprg'),
        renda=data.get('renda'),
        emergencianome=data.get('emergencianome'),
        emergenciatelefone=data.get('emergenciatelefone'),
        emergenciagrau=data.get('emergenciagrau'),
        doencas=data.get('doencas'),
        tabaco=data.get('tabaco'),
        alcool=data.get('alcool'),
        cafeina=data.get('cafeina'),
        condenado=data.get('condenado'),
        medicamentos=data.get('medicamentos'),
        cirurgia=data.get('cirurgia'),
        motivo=data.get('motivo'),
        expectativa=data.get('expectativa'),
        jaconsultou=data.get('jaconsultou'),
        mediahorassono=data.get('mediahorassono'),
        outrasexp=data.get('outrasexp'),
        comentarios=data.get('comentarios')
    )
    db.session.add(nova_inscricao)
    db.session.commit()

    # Envia email de confirmação
    msg = Message("Sua inscrição foi registrada!",
                  recipients=[data.get('email')])
    mensagem = 'Obrigado por participar do formulário. Porém... o processo ainda não acabou! Seu formulário será avaliado e logo terá um email de resposta.'
    # Você pode criar um template de email em string ou usar render_template se quiser manter HTML
    msg.html = f"<p>{mensagem}</p><p>Nome: {data.get('nomecompleto')}</p>"
    mail.send(msg)

    return jsonify({'success': True, 'message': 'Inscrição registrada! Verifique seu email para mais instruções.'}), 201

# Listar formulários pendentes para avaliação
@app.route('/api/avaliarforms', methods=['GET'])
def api_avaliarforms():
    formularios = Formularios.query.order_by(text("Formularios.id_form desc")).filter_by(status=None)
    forms_json = [
        {
            'id_form': f.id_form,
            'nomecompleto': f.nomecompleto,
            'email': f.email,
            # adicione outros campos necessários
        } for f in formularios
    ]
    return jsonify(forms_json)

# Aceitar formulário
@app.route('/api/avaliarforms/aceitar/<int:id>', methods=['POST'])
def api_aceitarform(id):
    form_modificado = Formularios.query.filter_by(id_form=id).first()
    if not form_modificado:
        return jsonify({'success': False, 'message': 'Formulário não encontrado'}), 404

    form_modificado.status = "aceito"
    db.session.add(form_modificado)
    db.session.commit()

    msg = Message("Parabéns, você foi aceito!",
                  recipients=[form_modificado.email])
    mensagem = 'Agora, o próximo passo é você clicar neste link para criar sua senha.'
    msg.html = f"<p>{mensagem}</p><p>Nome: {form_modificado.nomecompleto}</p>"
    mail.send(msg)

    return jsonify({'success': True, 'message': 'Formulário aceito e email enviado.'})

# Recusar formulário
@app.route('/api/avaliarforms/recusar/<int:id>', methods=['POST'])
def api_recusarform(id):
    form_modificado = Formularios.query.filter_by(id_form=id).first()
    if not form_modificado:
        return jsonify({'success': False, 'message': 'Formulário não encontrado'}), 404

    form_modificado.status = "recusado"
    db.session.add(form_modificado)
    db.session.commit()

    msg = Message("Infelizmente você não foi aceito.",
                  recipients=[form_modificado.email])
    mensagem = 'Agradecemos imensamente sua participação. Pode tentar novamente numa próxima abertura de vagas.'
    msg.html = f"<p>{mensagem}</p><p>Nome: {form_modificado.nomecompleto}</p>"
    mail.send(msg)

    return jsonify({'success': True, 'message': 'Formulário recusado e email enviado.'})