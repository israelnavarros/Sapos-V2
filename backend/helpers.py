import os
from sapo import app
from flask_wtf import FlaskForm
from wtforms import StringField, EmailField, PasswordField, IntegerField, TimeField, DateField, TelField, SelectField, SubmitField, HiddenField, SelectMultipleField, DecimalField, TextAreaField, RadioField, DateTimeLocalField, validators
from wtforms import widgets
from wtforms import validators

class MultiCheckboxField(SelectMultipleField):
    widget = widgets.ListWidget(prefix_label=False)
    option_widget = widgets.CheckboxInput()

class FormularioConsulta(FlaskForm):
    id_consulta = IntegerField('Id', [validators.data_required()])
    psicologo = StringField('Psicologo', [validators.data_required(), validators.length(min=1, max=255)])
    horario = TimeField('Horario', [validators.data_required()])
    salvar = SubmitField('Salvar')

class FormularioLogin(FlaskForm):
    email = EmailField('Email', [validators.data_required(), validators.length(min=1, max=100)])
    senha = PasswordField('Senha', [validators.data_required(), validators.length(min=1, max=100)])
    entrar = SubmitField('Entrar')

class FormularioVaga(FlaskForm):
    id_vaga = HiddenField('id_vaga')
    nome_vaga = StringField('Nome da Vaga', [validators.data_required(), validators.length(min=1, max=100)])
    id_admin = HiddenField('id_admin')
    qnt_pessoas = IntegerField('Quantidade de pessoas na vaga', [validators.data_required()])
    ins_inicio = DateTimeLocalField('Data de inicio dos formulários', [validators.data_required()], format='%Y-%m-%dT%H:%M')
    ins_fim = DateTimeLocalField('Data de fim dos formulários', [validators.data_required()], format='%Y-%m-%dT%H:%M')
    criarvaga = SubmitField('Criar Vaga')

class FormularioGrupo(FlaskForm):
    id_grupo = HiddenField('id_grupo')
    titulo = StringField('Titulo do grupo', [validators.data_required(), validators.length(min=1, max=120)])
    vagas = IntegerField('Quantidade de vagas', [validators.data_required()])
    convenio = StringField('Convênio', [validators.optional(), validators.length(min=1, max=40)])
    local = StringField('Local do Estágio', [validators.data_required(), validators.length(min=1, max=40)])
    resumo = TextAreaField('Resumo', [validators.data_required(), validators.length(max=2000)])
    objetivos = TextAreaField('Objetivos', [validators.data_required(), validators.length(max=2000)])
    atividades = TextAreaField('Atividades', [validators.data_required(), validators.length(max=2000)])
    bibliografia = TextAreaField('Bibliografia', [validators.data_required(), validators.length(max=2000)])
    confirmar_grupo = SubmitField('Confirmar criação do grupo')

class FormularioPaciente(FlaskForm):
    id_paciente = HiddenField('id_paciente')
    id_estagiario = StringField('id_estagiario')
    id_supervisor = StringField('id_supervisor')
    status = SelectField('Status', choices=[('True', 'Ativo'), ('False', 'Desativado')], coerce=lambda x: x == 'True')
    #status = SelectField('Status', choices=[('True', 'Ativo'), ('False', 'Desativado')], coerce=str)
    data_criacao = DateField('Data de Criação')

    nome_completo = StringField('Nome Completo', [validators.data_required(), validators.length(min=1, max=100)])
    nome_responsavel = StringField('Nome do Responsável', [validators.optional(), validators.length(min=1, max=100)])
    grau_parentesco = StringField('Grau de Parentesco', [validators.optional(), validators.length(min=1, max=20)])
    data_nascimento = DateField('Data de Nascimento', [validators.data_required()])
    idade = IntegerField('Idade', [validators.data_required()])
    sexo = SelectField('Sexo', [validators.data_required()], choices=[('M', 'Masculino'), ('F', 'Feminino')])
    escolaridade = SelectField('Escolaridade', [validators.data_required()], choices=[('AN', 'Analfabeto'), ('PE', 'Pré-Escolar'),
                                                                                     ('FI', 'Ensino Fundamental Incompleto'), ('FC', 'Ensino Fundamental Completo'),
                                                                                     ('MI', 'Ensino Médio Incompleto'), ('MC', 'Ensino Médio Completo'),
                                                                                     ('SI', 'Ensino Superior Incompleto'), ('SC', 'Ensino Superior Completo')])
    profissao = StringField('Profissão', [validators.data_required(), validators.length(min=1, max=50)])
    ocupacao = StringField('Ocupação', [validators.data_required(), validators.length(min=1, max=50)])
    salario = DecimalField('Salário', [validators.data_required()], places=2)
    renda_familiar = DecimalField('Renda Familiar', [validators.data_required()], places=2)
    email = EmailField('Email', [validators.length(min=0, max=100)])

    cep = StringField('CEP', [validators.data_required(), validators.length(min=8, max=8)])
    cidade = StringField('Cidade', [validators.data_required(), validators.length(min=1, max=30)])
    bairro = StringField('Bairro', [validators.data_required(), validators.length(min=1, max=30)])
    logradouro = StringField('Logradouro', [validators.data_required(), validators.length(min=1, max=255)])
    complemento = StringField('Complemento', [validators.data_required(), validators.length(min=1, max=255)])
    telefone = TelField('Telefone', [validators.data_required(), validators.length(min=9, max=15)])
    celular1 = TelField('Celular 1', [validators.data_required(), validators.length(min=9, max=15)])
    celular2 = TelField('Celular 2', [validators.optional(), validators.length(min=9, max=15)])

    #origem_encaminhamento = SelectField('Origem do Encaminhamento', [validators.optional(), validators.length(min=1, max=50)])
    origem_encaminhamento = SelectField('Origem do Encaminhamento', [validators.data_required()], choices=[('Procura Espontânea', 'Procura Espontânea'), ('Área de Educação', 'Área de Educação'),
                                                                                     ('Área Jurídica', 'Área Jurídica'), ('Área de Saúde', 'Área de Saúde'),
                                                                                     ('Área de Trabalho', 'Área de Trabalho'), ('Outras', 'Outras(Especificar abaixo)')])
    nome_instituicao = StringField('Nome da Instituição/Empresa', [validators.optional(), validators.length(min=1, max=50)])
    nome_resp_encaminhamento = StringField('Nome de quem assinou o encaminhamento', [validators.optional(), validators.length(min=1, max=50)])

    motivo = TextAreaField('Motivo', [validators.data_required(), validators.length(max=2000)])
    medicamentos = TextAreaField('Medicamentos', [validators.data_required(), validators.length(max=2000)])

    submit = SubmitField('Adicionar Paciente')
    submit_editar = SubmitField('Editar Paciente')


def get_doencas():
    return [(1, 'Nenhum'),
            (2, 'Alergias'),
            (3, 'Anemia'),
            (4, 'Angina'),
            (5, 'Ansiedade'),
            (6, 'Artrite'),
            (7, 'Asma'),
            (8, 'Fibrilação Atrial'),
            (9, 'Hiperplasia Prostática Benigna'),
            (10, 'Hipertrofia'),
            (11, 'Coágulos de Sangue'),
            (12, 'Câncer'),
            (13, 'Acidente Cerebrovascular'),
            (14, 'Doença das Artérias Coronárias'),
            (15, 'COPD (Enfisema)'),
            (16, 'Doença de Crohn'),
            (17, 'Depressão'),
            (18, 'Diabetes'),
            (19, 'Doença da Vesícula Biliar'),
            (20, 'GERD (Refluxo)'),
            (21, 'Hepatite C'),
            (22, 'Hiperlipidemia'),
            (23, 'Hipertensão'),
            (24, 'Síndrome do Intestino Irritável'),
            (25, 'Doença hepática'),
            (26, 'Enxaquecas'),
            (27, 'Infarto do miocárdio'),
            (28, 'Osteoporose'),
            (29, 'Doença da Úlcera Péptica'),
            (30, 'Doença Renal'),
            (31, 'Epilepsia'),
            (32, 'Doença da tireóide')]

class FormularioInscricao(FlaskForm):
    id_form = HiddenField('id_form')
    #Dados Paciente
    nomecompleto = StringField('Nome Completo', [validators.data_required(), validators.length(min=1, max=255)])
    cep = StringField('CEP', [validators.data_required(), validators.length(min=8, max=8)])
    cidade = StringField('Cidade', [validators.data_required(), validators.length(min=1, max=30)])
    estado = StringField('Estado', [validators.data_required(), validators.length(min=1, max=30)])
    logradouro = StringField('Logradouro', [validators.data_required(), validators.length(min=1, max=255)])
    complemento = StringField('Complemento', [validators.data_required(), validators.length(min=1, max=255)])
    datanasc = DateField('Data de Nascimento', [validators.data_required()])
    cpf = StringField('CPF', [validators.data_required(), validators.length(min=11, max=11)])
    email = EmailField('Email', [validators.data_required(), validators.length(min=3, max=100)])
    telefone = TelField('Telefone', [validators.data_required(), validators.length(min=9, max=11)])
    prefcontato = RadioField('Método preferido para contato', [validators.data_required()], choices=[('Email', 'Email'), ('Celular', 'Celular'), ('WhatsApp', 'WhatsApp')])
    sitcivil = RadioField('Estado Civil', [validators.data_required()], choices=[('Solteiro', 'Solteiro(a)'), ('Casado', 'Casado(a)'), ('Divorciado', 'Divorciado(a)'), ('Viúvo', 'Viúvo(a)')])
    situemprg = RadioField('Situação Empregatícia', [validators.data_required()], choices=[('Empregado', 'Empregado'), ('Desempregado', 'Desempregado'), ('Deficiente', 'Deficiente'), ('Aposentado', 'Aposentado'), ('Estudante', 'Estudante')])
    renda = DecimalField('Renda Familiar', [validators.data_required()], places=2)
    #Contato Emergência
    emergencianome = StringField('Nome Completo', [validators.data_required(), validators.length(min=1, max=255)])
    emergenciatelefone = TelField('Telefone', [validators.data_required(), validators.length(min=9, max=11)])
    emergenciagrau = StringField('Grau de parentesco/Relacionamento', [validators.data_required(), validators.length(min=1, max=50)])
    #Histórico Médico
    doencas = MultiCheckboxField('Marcar as doenças que se aplicam a você', [validators.optional()], choices=get_doencas(), coerce=int)
    tabaco = SelectField('Você usa tabaco?', [validators.data_required()], choices=[('1', 'Não'),('2', 'Diariamente'),('3', 'Semanalmente'),('4', 'Raramente'),('5', 'Ex-usuário')], coerce=int)
    alcool = SelectField('Você ingere bebidas alcoólicas?', [validators.data_required()], choices=[('1', 'Não'),('2', 'Diariamente'),('3', 'Semanalmente'),('4', 'Raramente'),('5', 'Ex-usuário')], coerce=int)
    cafeina = SelectField('Você consome cafeína?', [validators.data_required()], choices=[('1', 'Não'),('2', 'Diariamente'),('3', 'Semanalmente'),('4', 'Raramente'),('5', 'Ex-usuário')], coerce=int)
    condenado = SelectField('Você já foi condenado por acusações relacionadas a drogas?', [validators.data_required()], choices=[('sim', 'Sim'), ('nao', 'Não')])
    medicamentos = SelectField('Você está atualmente tomando medicamentos prescritos?', [validators.data_required()], choices=[('sim', 'Sim'), ('nao', 'Não')])
    cirurgia = SelectField('Você já fez alguma cirurgia nos últimos 5 anos?', [validators.data_required()], choices=[('sim', 'Sim'), ('nao', 'Não')])
    #Historico Saúde Mental
    motivo = TextAreaField('Por que você está procurando tratamento?', [validators.data_required(), validators.length(max=200)])
    expectativa = TextAreaField('O que você espera deste acolhimento?', [validators.data_required(), validators.length(max=200)])
    jaconsultou = SelectField('Você já se consultou com um orientador, psicólogo, psiquiatra ou outro profissional de saúde mental antes?', [validators.input_required()], choices=[('sim', 'Sim'), ('nao', 'Não')])
    mediahorassono = StringField('Média de horas de sono por noite', [validators.data_required(), validators.length(min=1, max=20)])
    outrasexp = TextAreaField('Descreva quaisquer outras experiências com as quais você tenha tido problemas', [validators.optional(), validators.length(max=200)])
    comentarios = TextAreaField('Comentário adicionais', [validators.optional(), validators.length(max=200)])

    concluir = SubmitField('Concluir inscrição')

class FormularioAlerta(FlaskForm):
    id_alerta = HiddenField('id_alerta')
    titulo = StringField('Título', [validators.data_required(), validators.length(min=1, max=100)])
    mensagem = TextAreaField('Mensagem', [validators.data_required(), validators.length(max=2000)])
    validade = DateField('Validade', [validators.data_required()])
    criar_alerta = SubmitField('Criar alerta')


def recupera_imagem(id):
    for nome_arquivo in os.listdir(app.config['UPLOAD_PATH']):
        if f'capa{id}' in nome_arquivo:
            return nome_arquivo
    return 'capa_padrao.jpg'

def deleta_imagem(id):
    arquivo = recupera_imagem(id)
    if arquivo != 'capa_padrao.jpg':
        os.remove(os.path.join(app.config['UPLOAD_PATH'], arquivo))

def recupera_imagem_pacientes(id):
    for nome_arquivo in os.listdir(app.config['UPLOAD_PACIENTES_PATH']):
        if f'capa{id}' in nome_arquivo:
            return nome_arquivo
    return 'capa_padrao.jpg'

def deleta_imagem_pacientes(id):
    arquivo = recupera_imagem_pacientes(id)
    if arquivo != 'capa_padrao.jpg':
        os.remove(os.path.join(app.config['UPLOAD_PACIENTES_PATH'], arquivo))

def recupera_imagem_usuario(id):
    for nome_arquivo in os.listdir(app.config['UPLOAD_USUARIOS_PATH']):
        if f'avatar{id}' in nome_arquivo:
            return nome_arquivo
    return 'avatar_padrao.jpg'

def deleta_imagem_usuario(id):
    arquivo = recupera_imagem_usuario(id)
    if arquivo != 'avatar_padrao.jpg':
        os.remove(os.path.join(app.config['UPLOAD_USUARIOS_PATH'], arquivo))


def formatar_tempo_decorrido(tempo_delta):
    segundos = tempo_delta.seconds
    dias = tempo_delta.days

    if dias > 0:
        if dias == 1:
            return f'{dias} dia atrás'
        else:
            return f'{dias} dias atrás'
    elif segundos >= 0 and segundos < 60:
        return 'agora mesmo'
    elif segundos >= 60 and segundos < 3600:
        minutos = segundos // 60
        if minutos == 1:
            return '1 minuto atrás'
        else:
            return f'{minutos} minutos atrás'
    else:
        horas = segundos // 3600
        if horas == 1:
            return '1 hora atrás'
        else:
            return f'{horas} horas atrás'