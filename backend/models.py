from main import db, login_manager
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
    vagas_estagiarios = db.Column(db.Integer, nullable=False)
    convenio = db.Column(db.String(50), nullable=True)
    local = db.Column(db.String(50), nullable=False)
    resumo = db.Column(db.String(2000), nullable=False)
    objetivos = db.Column(db.String(2000), nullable=False)
    atividades = db.Column(db.String(2000), nullable=False)
    bibliografia = db.Column(db.String(2000), nullable=False)

    def __repr__(self):
        return f"<{self.__class__.__name__} id_grupo: {self.id_grupo} titulo: {self.titulo} vagas: {self.vagas_estagiarios} >"

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
    __tablename__ = 'pacientes'

    id_paciente = db.Column(db.Integer, primary_key=True, autoincrement=True)
    id_estagiario = db.Column(db.Integer, db.ForeignKey('usuarios.id_usuario'), nullable=True)
    id_supervisor = db.Column(db.Integer, db.ForeignKey('usuarios.id_usuario'), nullable=True)
    status = db.Column(db.Boolean, nullable=True) 
    data_criacao = db.Column(db.Date, nullable=True) 

    # Campos Obrigatórios
    nome_completo = db.Column(db.String(100), nullable=False)
    idade = db.Column(db.Integer, nullable=False)
    celular1 = db.Column(db.String(15), nullable=False)

    # Campos Opcionais
    nome_responsavel = db.Column(db.String(100), nullable=True)
    grau_parentesco = db.Column(db.String(20), nullable=True)
    data_nascimento = db.Column(db.Date, nullable=True) 
    sexo = db.Column(db.String(1), nullable=True) 
    escolaridade = db.Column(db.String(2), nullable=True) 
    profissao = db.Column(db.String(50), nullable=True) 
    ocupacao = db.Column(db.String(50), nullable=True) 
    salario = db.Column(db.Numeric(precision=10, scale=2), nullable=True) 
    renda_familiar = db.Column(db.Numeric(precision=10, scale=2), nullable=True) 
    email = db.Column(db.String(100), nullable=True)

    cep = db.Column(db.Integer, nullable=True) 
    cidade = db.Column(db.String(30), nullable=True) 
    bairro = db.Column(db.String(30), nullable=True) 
    logradouro = db.Column(db.String(255), nullable=True) 
    complemento = db.Column(db.String(50), nullable=True) 
    telefone = db.Column(db.String(15), nullable=True) 
    celular2 = db.Column(db.String(15), nullable=True) 

    origem_encaminhamento = db.Column(db.String(50), nullable=True)
    nome_instituicao = db.Column(db.String(50), nullable=True)
    nome_resp_encaminhamento = db.Column(db.String(50), nullable=True)

    motivo = db.Column(db.Text, nullable=True)
    medicamentos = db.Column(db.Text, nullable=True)
    intervalo_sessoes = db.Column(db.String(50), nullable=True)

    hipotese_diagnostica = db.Column(db.Text, nullable=True)
    ja_fez_terapia = db.Column(db.Boolean, nullable=True)
    etnia = db.Column(db.Text, nullable=True)
    genero = db.Column(db.Text, nullable=True)
    classe_social = db.Column(db.Text, nullable=True)

    # Relacionamento com tags via tabela intermediária
    tags_rel = db.relationship('PacienteTag', backref='paciente', lazy='dynamic')

    def get_tags(self):
        return [pt.tag.nome for pt in self.tags_rel]

    def __repr__(self):
        return f'<Paciente {self.id_paciente}>'

    def serialize(self):
        return {
            'id_paciente': self.id_paciente,
            'nome_completo': self.nome_completo,
            'idade': self.idade,
            'sexo': self.sexo,
            'profissao': self.profissao,
            'cidade': self.cidade,
            'tags': self.get_tags()
            # Adicione outros campos conforme necessário
        }


class FolhaEvolucao(db.Model):
    id_folha = db.Column(db.Integer, primary_key=True, autoincrement=True)
    id_paciente = db.Column(db.Integer, db.ForeignKey('pacientes.id_paciente'), nullable=False)
    id_estagiario = db.Column(db.Integer, db.ForeignKey('usuarios.id_usuario'), nullable=False)
    id_supervisor = db.Column(db.Integer, db.ForeignKey('usuarios.id_usuario'), nullable=True)
    data_postagem = db.Column(db.DateTime, nullable=False)
    hipotese_diagnostica = db.Column(db.Text)
    sintomas_atuais = db.Column(db.Text)
    intervencoes_realizadas = db.Column(db.Text)
    evolucao_clinica = db.Column(db.Text)
    plano_proxima_sessao = db.Column(db.Text)
    observacoes = db.Column(db.Text)
    data_check_supervisor = db.Column(db.DateTime, nullable=True)
    status_validacao = db.Column(db.String(20), nullable=False, default='Pendente')
    feedback = db.Column(db.Text, nullable=True)
    data_status = db.Column(db.DateTime, nullable=False, default=db.func.current_timestamp())
    numero_sessao = db.Column(db.Integer)
    estagiario = db.relationship('Usuarios', foreign_keys=[id_estagiario])
    supervisor = db.relationship('Usuarios', foreign_keys=[id_supervisor])
    


    def serialize(self):
        estagiario = Usuarios.query.get(self.id_estagiario)
        supervisor = Usuarios.query.get(self.id_supervisor) if self.id_supervisor else None
        return {
            'id_folha': self.id_folha,
            'id_paciente': self.id_paciente,
            'id_estagiario': self.id_estagiario,
            'nome_estagiario': estagiario.nome if estagiario else 'Desconhecido',
            'nome_supervisor': supervisor.nome if supervisor else 'Desconhecido',
            'data_postagem': self.data_postagem.strftime('%d/%m/%Y %H:%M:%S'),
            'postagem': self.postagem,
            'hipotese_diagnostica': self.hipotese_diagnostica,
            'sintomas_atuais': self.sintomas_atuais,
            'intervencoes_realizadas': self.intervencoes_realizadas,
            'evolucao_clinica': self.evolucao_clinica,
            'plano_proxima_sessao': self.plano_proxima_sessao,
            'observacoes': self.observacoes,
            'numero_sessao': self.numero_sessao,
            'status_validacao': self.status_validacao,
            'data_check_supervisor': self.data_check_supervisor.strftime('%d/%m/%Y %H:%M:%S') if self.data_check_supervisor else None,
            'status_validacao': self.status_validacao,
            'feedback': self.feedback,
            'data_status': self.data_status.strftime('%d/%m/%Y %H:%M:%S') if self.data_status else None
        }


class Tag(db.Model):
    __tablename__ = 'tags'

    id_tag = db.Column(db.Integer, primary_key=True)
    nome = db.Column(db.String(50), nullable=False)

    def __repr__(self):
        return f"<Tag {self.nome}>"

class PacienteTag(db.Model):
    __tablename__ = 'paciente_tags'

    id_paciente = db.Column(db.Integer, db.ForeignKey('pacientes.id_paciente'), primary_key=True)
    id_tag = db.Column(db.Integer, db.ForeignKey('tags.id_tag'), primary_key=True)

    tag = db.relationship('Tag', backref=db.backref('paciente_tags', cascade='all, delete-orphan'))

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
    cor = db.Column(db.String(10), nullable=False, default="#26268D")
    status = db.Column(db.String(10), nullable=False, default='Agendado')
    """
    Apenas para parametrizar:
    Agendado -> #0000ff
    Cancelado -> #ff0000
    Realizado -> #008000
    """

    def __repr__(self):
        return '<Consulta %r>' % self.id_consulta

# class Vagas(db.Model):
#     id_vaga = db.Column(db.Integer, primary_key=True, autoincrement=True)
#     nome_vaga = db.Column(db.String(255), nullable=False)
#     id_admin = db.Column(db.Integer, db.ForeignKey('usuarios.id_usuario'), nullable=False)
#     qnt_pessoas = db.Column(db.Integer, nullable=False)
#     ins_inicio = db.Column(db.DateTime, nullable=False)
#     ins_fim = db.Column(db.DateTime, nullable=False)

#     def __repr__(self):
#         return '<Name %r>' % self.name

class HistoricoDoencas(db.Model):
    id_doenca = db.Column(db.Integer, primary_key=True, autoincrement=True)
    nome = db.Column(db.String(50), nullable=False)

    def __repr__(self):
        return '<Name %r>' % self.name

# class Formularios(db.Model):
#     id_form = db.Column(db.Integer, primary_key=True, autoincrement=True)
#     status = db.Column(db.String(20))
#     nomecompleto = db.Column(db.String(255), nullable=False)
#     cep = db.Column(db.Integer, nullable=False)
#     cidade = db.Column(db.String(30), nullable=False)
#     estado = db.Column(db.String(30), nullable=False)
#     logradouro = db.Column(db.String(255), nullable=False)
#     complemento = db.Column(db.String(50), nullable=False)
#     datanasc = db.Column(db.Date, nullable=False)
#     cpf = db.Column(db.String(11), nullable=False)
#     email = db.Column(db.String(100), nullable=False)
#     telefone = db.Column(db.String(11), nullable=False)
#     prefcontato = db.Column(db.String(12), nullable=False)
#     sitcivil = db.Column(db.String(15), nullable=False)
#     situemprg = db.Column(db.String(15), nullable=False)
#     renda = db.Column(db.Float, nullable=False)
#     emergencianome = db.Column(db.String(255), nullable=False)
#     emergenciatelefone = db.Column(db.String(11), nullable=False)
#     emergenciagrau = db.Column(db.String(50), nullable=False)
#     doencas = db.Column(db.String(50), nullable=False)
#     tabaco = db.Column(db.Integer, nullable=False)
#     alcool = db.Column(db.Integer, nullable=False)
#     cafeina = db.Column(db.Integer, nullable=False)
#     condenado = db.Column(db.String(3), nullable=False)
#     medicamentos = db.Column(db.String(3), nullable=False)
#     cirurgia = db.Column(db.String(3), nullable=False)
#     motivo = db.Column(db.Text, nullable=False)
#     expectativa = db.Column(db.Text, nullable=False)
#     jaconsultou = db.Column(db.String(3), nullable=False)
#     mediahorassono = db.Column(db.String(20), nullable=False)
#     outrasexp = db.Column(db.Text, nullable=True)
#     comentarios = db.Column(db.Text, nullable=True)

#     def __repr__(self):
#         return '<Name %r>' % self.name