import os

SECRET_KEY = 'sapo'
SIMPLE_CRYPT_SECRET = 'saposecreto'

SQLALCHEMY_DATABASE_URI = '{SGBD}://{username}:{password}@{host}:{port}/{database}'.format(
        SGBD = 'postgresql',
        username = 'postgres',
        password = '123',
        host = 'localhost',
        port = '5432',
        database = 'sapos'
    )

# SESSION_COOKIE_SAMESITE = "None"
# SESSION_COOKIE_SECURE = True

UPLOAD_PATH = os.path.dirname(os.path.abspath(__file__)) + '/uploads'
UPLOAD_PACIENTES_PATH = os.path.dirname(os.path.abspath(__file__)) + '/uploads/pacientes'
UPLOAD_USUARIOS_PATH = os.path.dirname(os.path.abspath(__file__)) + '/uploads/usuarios'

MAIL_SERVER = "smtp.googlemail.com"
MAIL_PORT = 587
MAIL_USE_TLS = True
MAIL_USE_SSL = False
MAIL_USERNAME = "tcc.sapos@gmail.com"
MAIL_DEFAULT_SENDER = "tcc.sapos@gmail.com"
MAIL_PASSWORD = "jdkpozkzpawpnxjj"

