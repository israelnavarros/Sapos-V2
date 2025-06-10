from flask import  render_template, request, redirect, session, flash, url_for
from sapo import app, db, mail
from models import Formularios
from helpers import FormularioInscricao
from sqlalchemy import text
from flask_mail import Message
import random, datetime

#intenção de excluir este, deixar apenas as rotas com os cargos

@app.route('/inscricao')
def inscricao():
    form_inscricao = FormularioInscricao()
    #futuramente implementar o id sendo passado para as vagas
    id = random.randint(0,1000)
    print(id)
    return render_template('inscricao.html', titulo='Pagina inicial', form_inscricao=form_inscricao, id=id)

@app.route('/email')
def email():
    msg = Message("Teste de assunto",
#        recipients=["copacontabil@hotmail.com", "copacontabil@gmail.com"]
                    recipients=["anbruno@id.uff.br"]
    )
    msg.html = render_template('template_email.html')
    mail.send(msg)
    return redirect(url_for('home'))


@app.route('/inscricaofinalizada', methods=['POST',])
def inscricaofinalizada():
    form_inscricao = FormularioInscricao(request.form)

    nomecompleto = form_inscricao.nomecompleto.data
    cep = form_inscricao.cep.data
    cidade = form_inscricao.cidade.data
    estado = form_inscricao.estado.data
    logradouro = form_inscricao.logradouro.data
    complemento = form_inscricao.complemento.data
    datanasc = form_inscricao.datanasc.data
    cpf = form_inscricao.cpf.data
    email = form_inscricao.email.data
    telefone = form_inscricao.telefone.data
    prefcontato = form_inscricao.prefcontato.data
    sitcivil = form_inscricao.sitcivil.data
    situemprg = form_inscricao.situemprg.data
    renda = form_inscricao.renda.data
    emergencianome = form_inscricao.emergencianome.data
    emergenciatelefone = form_inscricao.emergenciatelefone.data
    emergenciagrau = form_inscricao.emergenciagrau.data
    doencas = form_inscricao.doencas.data
    tabaco = form_inscricao.tabaco.data
    alcool = form_inscricao.alcool.data
    cafeina = form_inscricao.cafeina.data
    condenado = form_inscricao.condenado.data
    medicamentos = form_inscricao.medicamentos.data
    cirurgia = form_inscricao.cirurgia.data
    motivo = form_inscricao.motivo.data
    expectativa = form_inscricao.expectativa.data
    jaconsultou = form_inscricao.jaconsultou.data
    mediahorassono = form_inscricao.mediahorassono.data
    outrasexp = form_inscricao.outrasexp.data
    comentarios = form_inscricao.comentarios.data

    data_atual = datetime.datetime.today()
    ano = str(data_atual.year)[-2:]
    mes = str(data_atual.month).zfill(2)
    dia = str(data_atual.day).zfill(2)
    aleatorio = str(random.randint(10, 99))
    id_form = "9" + ano + mes + dia + aleatorio

    nova_inscricao = Formularios(id_form=id_form,
                                nomecompleto=nomecompleto,
                                cep=cep,
                                cidade=cidade,
                                estado=estado,
                                logradouro=logradouro,
                                complemento=complemento,
                                datanasc=datanasc,
                                cpf=cpf,
                                email=email,
                                telefone=telefone,
                                prefcontato=prefcontato,
                                sitcivil=sitcivil,
                                situemprg=situemprg,
                                renda=renda,
                                emergencianome=emergencianome,
                                emergenciatelefone=emergenciatelefone,
                                emergenciagrau=emergenciagrau,
                                doencas=doencas,
                                tabaco=tabaco,
                                alcool=alcool,
                                cafeina=cafeina,
                                condenado=condenado,
                                medicamentos=medicamentos,
                                cirurgia=cirurgia,
                                motivo=motivo,
                                expectativa=expectativa,
                                jaconsultou=jaconsultou,
                                mediahorassono=mediahorassono,
                                outrasexp=outrasexp,
                                comentarios=comentarios)
    db.session.add(nova_inscricao)
    db.session.commit()

    msg = Message("Sua inscrição foi registrada!",
                  recipients=[email]
                  )
    mensagem = 'Obrigado por participar do formulário. Porém... o processo ainda não acabou! Seu formulário será avaliado e logo terá um email de resposta.'
    msg.html = render_template('template_email.html', mensagem=mensagem, nomecompleto=nomecompleto)
    mail.send(msg)

    flash('Obrigado por completar o formulário. Enviamos para seu email novas instruções.')
    return redirect(url_for('home'))

@app.route('/administrar/avaliarforms')
def avaliarforms():
    formularios = Formularios.query.order_by(text("Formularios.id_form desc")).filter_by(status=None)
    return render_template('avaliar_formularios.html', titulo='Pagina de Administração', formularios=formularios)

@app.route('/administrar/avaliarforms/aceitar/<int:id>')
def aceitarform(id):
    form_modificado = Formularios.query.filter_by(id_form=id).first()
    form_modificado.status = "aceito"
    db.session.add(form_modificado)
    db.session.commit()

    msg = Message("Parabéns, você foi aceito!",
                  recipients=[form_modificado.email]
                  )
    mensagem = 'Agora, o próximo passo é você clicar neste link para criar sua senha.'
    msg.html = render_template('template_email.html',mensagem=mensagem, nomecompleto=form_modificado.nomecompleto)
    mail.send(msg)

    return redirect(url_for('avaliarforms'))

@app.route('/administrar/avaliarforms/recusar/<int:id>')
def recusarform(id):
    form_modificado = Formularios.query.filter_by(id_form=id).first()
    form_modificado.status = "recusado"
    db.session.add(form_modificado)
    db.session.commit()

    msg = Message("Infelizmente você não foi aceito.",
                  recipients=[form_modificado.email]
                  )
    mensagem = 'Agradecemos imensamente sua participação. Pode tentar novamente numa próxima abertura de vagas.'
    msg.html = render_template('template_email.html',mensagem=mensagem, nomecompleto=form_modificado.nomecompleto)
    mail.send(msg)

    return redirect(url_for('avaliarforms'))