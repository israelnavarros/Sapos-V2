from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_wtf.csrf import CSRFProtect
from flask_bcrypt import Bcrypt
from flask_mail import Mail
from flask_login import LoginManager
from flask_simple_crypt import SimpleCrypt
from flask_caching import Cache



app = Flask(__name__)
cors = CORS(app, supports_credentials=True, origins=['http://localhost:5173'])
app.config.from_pyfile('config.py')

db = SQLAlchemy(app)
login_manager = LoginManager(app)
# csrf = CSRFProtect(app)
bcrypt = Bcrypt(app)
mail = Mail(app)
crypt = SimpleCrypt(app)
config = {
    "DEBUG": True,          
    "CACHE_TYPE": "FileSystemCache", 
    "CACHE_DIR": "cache",
    "CACHE_DEFAULT_TIMEOUT": 300 
}
app.config.from_mapping(config)
cache = Cache(app)

from views_user import *
from views_coordenador_spa import *
# from views_formulario import *
from views_secretaria import *
from views_supervisor import *
from views_estagiario import *
from views_comuns import *

# with app.app_context():
#     db.create_all()
# @app.route("/" ,methods=['GET'])
# def home():
#     return jsonify({"message": "Welcome to the Flask API!"})


if __name__ == "__main__":
    app.run(debug=True, port=5000)