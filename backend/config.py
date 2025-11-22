import os
from urllib.parse import urlparse, urlunparse, parse_qs, urlencode

SECRET_KEY = 'sapo'
SIMPLE_CRYPT_SECRET = 'saposecreto'

# Lê DATABASE_URL do ambiente (Cloud Run / Secret Manager) ou usa localhost em dev
DATABASE_URL = os.environ.get("DATABASE_URL")

if DATABASE_URL:
    # Analisa a URL original para manipular os parâmetros de forma segura
    parsed_url = urlparse(DATABASE_URL)
    query_params = parse_qs(parsed_url.query)

    # Garante que sslmode=require e client_encoding=utf8 estejam presentes
    query_params['sslmode'] = 'require'
    query_params['client_encoding'] = 'utf8'

    # Remonta a URL com os parâmetros corretos
    new_query_string = urlencode(query_params, doseq=True)
    SQLALCHEMY_DATABASE_URI = urlunparse(parsed_url._replace(query=new_query_string))
else:
    # fallback para desenvolvimento local
    SQLALCHEMY_DATABASE_URI = '{SGBD}://{username}:{password}@{host}:{port}/{database}'.format(
        SGBD = 'postgresql',
        username = 'postgres',
        password = '123',
        host = 'localhost',
        port = '5432',
        database = 'sapos'
    )

# Configurações essenciais para cookies de sessão em produção com domínios diferentes
SESSION_COOKIE_SAMESITE = "None"
SESSION_COOKIE_SECURE = True

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
