from sapo import db, login_manager
from flask_login import UserMixin

@login_manager.user_loader
def load_user(id_usuario):
    return Usuarios.query.filter_by(id_usuario=id_usuario).first()

class Usuarios(db.Model, UserMixin):
    id_usuario = db.Column(db.Integer, primary_key=True, autoincrement=True)
    matricula = db.Column(db.String(30), nullable=False)
    nome = db.Column(db.String(255), nullable=False)
    email = db.Column(db.String(100), nullable=False, unique=True)
    senha = db.Column(db.String(100), nullable=False)
    cargo = db.Column(db.Integer, nullable=False)
    grupo = db.Column(db.Integer, db.ForeignKey('grupos.id_grupo'), nullable=True)
    status = db.Column(db.Boolean, nullable=False, default=True)
    criado_em = db.Column(db.Date, nullable=False)
    valido_ate = db.Column(db.Date, nullable=False)
    session_token = db.Column(db.String(80), nullable=True)

    def __repr__(self):
        return f"<{self.__class__.__name__} Matricula: {self.matricula} Nome: {self.nome} Email: {self.email} Cargo:  {self.cargo} >"

    def get_id(self):
        return (self.id_usuario)

class Grupos(db.Model):
    id_grupo = db.Column(db.Integer, primary_key=True, autoincrement=True)
    titulo = db.Column(db.String(120), nullable=False)
    vagas = db.Column(db.Integer, nullable=False)
    convenio = db.Column(db.String(50), nullable=True)
    local = db.Column(db.String(50), nullable=False)
    resumo = db.Column(db.String(2000), nullable=False)
    objetivos = db.Column(db.String(2000), nullable=False)
    atividades = db.Column(db.String(2000), nullable=False)
    bibliografia = db.Column(db.String(2000), nullable=False)

    def __repr__(self):
        return f"<{self.__class__.__name__} id_grupo: {self.id_grupo} titulo: {self.titulo} vagas: {self.vagas} >"

    def get_id(self):
        return (self.id_grupo)

class ReuniaoGrupos(db.Model):
    id_reuniaogrupos = db.Column(db.Integer, primary_key=True, autoincrement=True)
    id_grupo = db.Column(db.Integer, db.ForeignKey('grupos.id_grupo'), nullable=False)
    dia = db.Column(db.Integer, nullable=False)
    hora_inicio = db.Column(db.Time, nullable=False)
    hora_fim = db.Column(db.Time, nullable=False)

""" BLOCO DESATIVADO POR MOTIVO DE MUDANÇA DE CLASSES
class CoordenadoresGrupos(db.Model):
    id_cg = db.Column(db.Integer, primary_key=True, autoincrement=True)
    grupo_id = db.Column(db.Integer, db.ForeignKey('grupos.id_grupo'), nullable=False)
    coordenador_id = db.Column(db.Integer, db.ForeignKey('usuarios.id_usuario'), nullable=False)

class EstagiariosGrupos(db.Model):
    id_eg = db.Column(db.Integer, primary_key=True, autoincrement=True)
    grupo_id = db.Column(db.Integer, db.ForeignKey('grupos.id_grupo'), nullable=False)
    estagiario_id = db.Column(db.Integer, db.ForeignKey('usuarios.id_usuario'), nullable=False)
    coordenador_id = db.Column(db.Integer, db.ForeignKey('usuarios.id_usuario'), nullable=False)



class Psicologos(db.Model):
    id_psicologo = db.Column(db.Integer, primary_key=True, autoincrement=True)
    id_usuario = db.Column(db.Integer, db.ForeignKey('usuarios.matricula'), nullable=True)
    cip = db.Column(db.Integer, nullable=False)
    nome_completo = db.Column(db.String(255), nullable=False)
    status = db.Column(db.String(15), nullable=False)

    def __repr__(self):
        return '<Name %r>' % self.name
"""


class Alertas(db.Model):
    id_alerta = db.Column(db.Integer, primary_key=True, autoincrement=True)
    titulo = db.Column(db.String(100), nullable=False)
    mensagem = db.Column(db.String(2000), nullable=False)
    validade = db.Column(db.Date, nullable=False)

class Pacientes(db.Model):
    id_paciente = db.Column(db.Integer, primary_key=True, autoincrement=True)
    id_estagiario = db.Column(db.Integer, db.ForeignKey('usuarios.id_usuario'), nullable=True)
    id_supervisor = db.Column(db.Integer, db.ForeignKey('usuarios.id_usuario'), nullable=True)
    status = db.Column(db.Boolean, nullable=False, default=True)
    data_criacao = db.Column(db.Date, nullable=False)

    nome_completo = db.Column(db.String(100), nullable=False)
    nome_responsavel = db.Column(db.String(100), nullable=True)
    grau_parentesco = db.Column(db.String(20), nullable=True)
    data_nascimento = db.Column(db.Date, nullable=False)
    idade = db.Column(db.Integer, nullable=False)
    sexo = db.Column(db.String(1), nullable=False)
    escolaridade = db.Column(db.String(2), nullable=False)
    profissao = db.Column(db.String(50), nullable=False)
    ocupacao = db.Column(db.String(50), nullable=False)
    salario = db.Column(db.Numeric(precision=10, scale=2), nullable=False)
    renda_familiar = db.Column(db.Numeric(precision=10, scale=2), nullable=False)
    email = db.Column(db.String(100), nullable=True)

    cep = db.Column(db.Integer, nullable=False)
    cidade = db.Column(db.String(30), nullable=False)
    bairro = db.Column(db.String(30), nullable=False)
    logradouro = db.Column(db.String(255), nullable=False)
    complemento = db.Column(db.String(50), nullable=False)
    telefone = db.Column(db.String(15), nullable=False)
    celular1 = db.Column(db.String(15), nullable=False)
    celular2 = db.Column(db.String(15), nullable=False)

    origem_encaminhamento = db.Column(db.String(50), nullable=True)
    nome_instituicao = db.Column(db.String(50), nullable=True)
    nome_resp_encaminhamento = db.Column(db.String(50), nullable=True)

    motivo = db.Column(db.Text, nullable=False)
    medicamentos = db.Column(db.Text, nullable=True)


    def __repr__(self):
        return '<Paciente %r>' % self.id_paciente

class FolhaEvolucao(db.Model):
    id_folha = db.Column(db.Integer, primary_key=True, autoincrement=True)
    id_paciente = db.Column(db.Integer, db.ForeignKey('pacientes.id_paciente'), nullable=False)
    id_estagiario = db.Column(db.Integer, db.ForeignKey('usuarios.id_usuario'), nullable=False)
    nome_estagiario = db.Column(db.String(100), nullable=False)
    data_postagem = db.Column(db.DateTime, nullable=False)
    postagem = db.Column(db.Text, nullable=False)
    check_supervisor = db.Column(db.String(100), nullable=True)
    data_check_supervisor = db.Column(db.DateTime, nullable=True)

    def serialize(self):
        return {
            'id_folha': self.id_folha,
            'id_paciente': self.id_paciente,
            'id_estagiario': self.id_estagiario,
            'nome_estagiario': self.nome_estagiario,
            #'data_postagem': self.data_postagem.strftime('%Y-%m-%d %H:%M:%S'),
            'data_postagem': self.data_postagem.strftime('%d/%m/%Y %H:%M:%S'),
            'postagem': self.postagem,
            'check_supervisor': self.check_supervisor if self.check_supervisor else None,
            'data_check_supervisor': self.data_check_supervisor.strftime('%d/%m/%Y %H:%M:%S')if self.data_check_supervisor else None
        }

class Consultas(db.Model):
    id_consulta = db.Column(db.Integer, primary_key=True, autoincrement=True)
    id_usuario = db.Column(db.Integer, db.ForeignKey('usuarios.id_usuario'), nullable=False)
    id_grupo = db.Column(db.Integer, db.ForeignKey('grupos.id_grupo'), nullable=False)
    id_paciente = db.Column(db.Integer, db.ForeignKey('pacientes.id_paciente'), nullable=False)
    dia = db.Column(db.Date, nullable=False)
    hora_inicio = db.Column(db.Time, nullable=False)
    hora_fim = db.Column(db.Time, nullable=False)
    #datetime_inicio = db.Column(db.DateTime, nullable=False)
    #datetime_fim = db.Column(db.DateTime, nullable=False)
    cor = db.Column(db.String(10), nullable=False, default='#0000ff')
    status = db.Column(db.String(10), nullable=False, default='Agendado')
    """
    Apenas para parametrizar:
    Agendado -> #0000ff
    Cancelado -> #ff0000
    Realizado -> #008000
    """

    def __repr__(self):
        return '<Consulta %r>' % self.id_consulta

class Vagas(db.Model):
    id_vaga = db.Column(db.Integer, primary_key=True, autoincrement=True)
    nome_vaga = db.Column(db.String(255), nullable=False)
    id_admin = db.Column(db.Integer, db.ForeignKey('usuarios.id_usuario'), nullable=False)
    qnt_pessoas = db.Column(db.Integer, nullable=False)
    ins_inicio = db.Column(db.DateTime, nullable=False)
    ins_fim = db.Column(db.DateTime, nullable=False)

    def __repr__(self):
        return '<Name %r>' % self.name

class HistoricoDoencas(db.Model):
    id_doenca = db.Column(db.Integer, primary_key=True, autoincrement=True)
    nome = db.Column(db.String(50), nullable=False)

    def __repr__(self):
        return '<Name %r>' % self.name

class Formularios(db.Model):
    id_form = db.Column(db.Integer, primary_key=True, autoincrement=True)
    status = db.Column(db.String(20))
    nomecompleto = db.Column(db.String(255), nullable=False)
    cep = db.Column(db.Integer, nullable=False)
    cidade = db.Column(db.String(30), nullable=False)
    estado = db.Column(db.String(30), nullable=False)
    logradouro = db.Column(db.String(255), nullable=False)
    complemento = db.Column(db.String(50), nullable=False)
    datanasc = db.Column(db.Date, nullable=False)
    cpf = db.Column(db.String(11), nullable=False)
    email = db.Column(db.String(100), nullable=False)
    telefone = db.Column(db.String(11), nullable=False)
    prefcontato = db.Column(db.String(12), nullable=False)
    sitcivil = db.Column(db.String(15), nullable=False)
    situemprg = db.Column(db.String(15), nullable=False)
    renda = db.Column(db.Float, nullable=False)
    emergencianome = db.Column(db.String(255), nullable=False)
    emergenciatelefone = db.Column(db.String(11), nullable=False)
    emergenciagrau = db.Column(db.String(50), nullable=False)
    doencas = db.Column(db.String(50), nullable=False)
    tabaco = db.Column(db.Integer, nullable=False)
    alcool = db.Column(db.Integer, nullable=False)
    cafeina = db.Column(db.Integer, nullable=False)
    condenado = db.Column(db.String(3), nullable=False)
    medicamentos = db.Column(db.String(3), nullable=False)
    cirurgia = db.Column(db.String(3), nullable=False)
    motivo = db.Column(db.Text, nullable=False)
    expectativa = db.Column(db.Text, nullable=False)
    jaconsultou = db.Column(db.String(3), nullable=False)
    mediahorassono = db.Column(db.String(20), nullable=False)
    outrasexp = db.Column(db.Text, nullable=True)
    comentarios = db.Column(db.Text, nullable=True)

    def __repr__(self):
        return '<Name %r>' % self.name