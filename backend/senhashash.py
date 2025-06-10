from flask_bcrypt import Bcrypt
import psycopg2

# Inicialize o Bcrypt
bcrypt = Bcrypt()

# Conecte ao banco de dados
conexao = psycopg2.connect(
    database="sapos",
    host="localhost",
    user="postgres",
    password="123",
    port="5432"
)
cursor = conexao.cursor()

# Gere os hashes das senhas
senhas = {
    "joao": bcrypt.generate_password_hash("senha123").decode("utf-8"),
    "maria": bcrypt.generate_password_hash("senha456").decode("utf-8"),
    "carlos": bcrypt.generate_password_hash("senha789").decode("utf-8"),
    "teste": bcrypt.generate_password_hash("123").decode("utf-8"),
    "secretaria": bcrypt.generate_password_hash("senha123").decode("utf-8")
}

# Atualize as senhas no banco de dados
cursor.execute("UPDATE usuarios SET senha = %s WHERE email = 'joao.silva@hospital.com'", (senhas["joao"],))
cursor.execute("UPDATE usuarios SET senha = %s WHERE email = 'maria.oliveira@hospital.com'", (senhas["maria"],))
cursor.execute("UPDATE usuarios SET senha = %s WHERE email = 'carlos.souza@hospital.com'", (senhas["carlos"],))
cursor.execute("UPDATE usuarios SET senha = %s WHERE email = 'teste@gmail.com'", (senhas["teste"],))
cursor.execute("UPDATE usuarios SET senha = %s WHERE email = 'secretaria@hospital.com'", (senhas["secretaria"],))

# Confirme as alterações
conexao.commit()

# Feche a conexão
cursor.close()
conexao.close()

print("Senhas atualizadas com sucesso!")