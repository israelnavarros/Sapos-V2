#!/usr/bin/env python3
"""
Script para fazer backup do Supabase com melhor tratamento de encoding.
Uso: python backup_supabase.py
"""

import subprocess
import os
from datetime import datetime

# Seus dados do Supabase
HOST = "db.ucakixwdjlvtceygnpmt.supabase.co"
PORT = "5432"
USER = "postgres"
DB = "postgres"
PASSWORD = input("Digite a senha do Supabase (da connection string): ")

# Criar pasta de backup se não existir
backup_dir = r"C:\Users\isral\Documents\TCC\Meu Tcc\backups"
os.makedirs(backup_dir, exist_ok=True)

# Nome do arquivo com data/hora
timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
backup_file = os.path.join(backup_dir, f"backup_sapos_{timestamp}.sql")

print(f"📦 Iniciando backup do Supabase...")
print(f"Destino: {backup_file}")

# Executar pg_dump
try:
    env = os.environ.copy()
    env["PGPASSWORD"] = PASSWORD
    
    # Usar shell True no Windows para evitar problemas de encoding
    with open(backup_file, "wb") as f:
        result = subprocess.run(
            [
                "pg_dump",
                "-h", HOST,
                "-p", PORT,
                "-U", USER,
                "-d", DB,
                "--verbose"
            ],
            stdout=f,
            stderr=subprocess.PIPE,
            env=env,
            check=False,
            text=False  # Usar modo binário para evitar problemas de encoding
        )
    
    if result.returncode == 0:
        file_size = os.path.getsize(backup_file)
        print(f"✅ Backup criado com sucesso!")
        print(f"📁 Arquivo: {backup_file}")
        print(f"📊 Tamanho: {file_size / (1024*1024):.2f} MB")
    else:
        # Tenta decodificar o erro com fallback
        try:
            error_msg = result.stderr.decode('utf-8')
        except UnicodeDecodeError:
            error_msg = result.stderr.decode('latin-1')
        
        print(f"❌ Erro ao fazer backup: {error_msg}")
        if os.path.exists(backup_file):
            os.remove(backup_file)
        
except FileNotFoundError:
    print("❌ pg_dump não encontrado!")
    print("Instale o PostgreSQL Client Tools:")
    print("   → https://www.postgresql.org/download/windows/")
    print("   → Ou rode: choco install postgresql")
except Exception as e:
    print(f"❌ Erro: {e}")

# Limpar variável de ambiente
try:
    del env["PGPASSWORD"]
except:
    pass

print("\nBone!")
