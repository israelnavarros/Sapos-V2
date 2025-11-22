FROM python:3.11-slim

WORKDIR /app

# system deps (ajuste conforme necessário)
RUN apt-get update && apt-get install -y build-essential libpq-dev --no-install-recommends && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# copiar app
COPY . .

# porta que o Flask usará
ENV PORT=8080
ENV FLASK_ENV=production

# comando de execução (ajuste se seu app tem outro entrypoint)
CMD ["gunicorn", "--bind", "0.0.0.0:8080", "main:app", "--workers", "2", "--threads", "4"]