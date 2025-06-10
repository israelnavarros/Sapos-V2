import psycopg2
from psycopg2 import errors
from flask_bcrypt import generate_password_hash

#O postgree não aceita que a conexão seja feita não determinando um database explicitamente. Então... CRIAR O DATABASE ANTES DE EXECUTAR ESTE CÓDIGO!!!
#Conexão com o banco de dados

try:
    conexao = psycopg2.connect(database="sapos",
                            host="localhost",
                            user="postgres",
                            password="123",
                            port="5432"
                            )
except psycopg2.errors as err:
    print(err)

cursor = conexao.cursor()
#conexao.autocommit = True

#Postgre aceita que se crie uma database depois, porém não para fazer a conexão com o python
#cursor.execute('DROP DATABASE IF EXISTS sapos;')
#cursor.execute('CREATE DATABASE sapos;')

#Exclusão das tabelas
#cursor.execute('DROP TABLE IF EXISTS usuarios')
#cursor.execute('DROP TABLE IF EXISTS consultas')

#Criação das tabelas
# print('CRIAÇÃO DAS TABELAS')
# cursor.execute('''CREATE TABLE usuarios(
#                 matricula SERIAL PRIMARY KEY,
#                 nome VARCHAR(255) NOT NULL, 
#                 email VARCHAR(100) NOT NULL,
#                 senha VARCHAR(100) NOT NULL,
#                 tipo INTEGER NOT NULL
#                 );''')

# cursor.execute('''CREATE TABLE consultas(
#                 id_consulta SERIAL PRIMARY KEY,
#                 psicologo VARCHAR(255) NOT NULL, 
#                 horario TIME
#                 );''')

#Preenchimento das tabelas
print('INSERINDO DADOS')
cursor.execute("INSERT INTO usuarios(nome,email,senha,cargo) VALUES (%s,%s,%s,%s)",("admin","admin@gmail.com",generate_password_hash("123").decode('utf-8'),3))
cursor.execute("INSERT INTO usuarios(nome,email,senha,cargo) VALUES (%s,%s,%s,%s)",("bruno","bruno@gmail.com",generate_password_hash("456").decode('utf-8'),0))


cursor.execute('''INSERT INTO consultas(psicologo,horario)
                VALUES ('Bruno','13:00:00');''')
cursor.execute('''INSERT INTO consultas(psicologo,horario)
                VALUES ('Pedro','14:00:00');''')

print('REALIZANDO O COMIT PARA O SGBD')
conexao.commit()

#Fechando a conexão com o banco de dados
print('FECHANDO CONEXÃO COM BANCO DE DADOS')
cursor.close()
conexao.close()

print(cursor)
print(conexao)
#print(conexao.info)
#print(conexao.status)