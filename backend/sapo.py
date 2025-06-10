from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_wtf.csrf import CSRFProtect
from flask_bcrypt import Bcrypt
from flask_mail import Mail
from flask_login import LoginManager
from flask_simple_crypt import SimpleCrypt

app = Flask(__name__)
app.config.from_pyfile('config.py')

db = SQLAlchemy(app)
login_manager = LoginManager(app)
csrf = CSRFProtect(app)
bcrypt = Bcrypt(app)
mail = Mail(app)
crypt = SimpleCrypt(app)


from views_user import *
from views_formulario import *
from views_consulta import *
from views_coordenador_spa import *
from views_secretaria import *
from views_supervisor import *
from views_estagiario import *

#Criação automática do bd com o sqlalchemy
with app.app_context():
    db.create_all()

if __name__ == '__main__':
        app.run(debug=True)
        #app.run(debug=True, host= '192.168.1.2') #iniciando com o ipv4 para entrar com o celular

#emailparatcc: tcc.sapos@gmail.com
#senhaparatcc: 75u7HEQb7ZmO
#senhadoapp: jdkpozkzpawpnxjj