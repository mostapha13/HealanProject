#!/bin/sh
set -eu

# Prefer MSSQL_SA_PASSWORD from compose/.env (URL-encoded safely).
if [ -n "${MSSQL_SA_PASSWORD:-}" ]; then
  ENC="$(PASS="$MSSQL_SA_PASSWORD" python -c "import urllib.parse,os; print(urllib.parse.quote(os.environ['PASS'], safe=''))")"
  export SQL_SERVER_CONNECTION_STRING="mssql+pyodbc://sa:${ENC}@sqlserver:1433/Healan?driver=ODBC+Driver+18+for+SQL+Server&TrustServerCertificate=yes"
  echo "python-rag: SQL_SERVER_CONNECTION_STRING built from MSSQL_SA_PASSWORD"
elif [ -z "${SQL_SERVER_CONNECTION_STRING:-}" ] \
  || echo "${SQL_SERVER_CONNECTION_STRING}" | grep -q '__SQL_PASSWORD'; then
  PASS="YourStrong!Passw0rd"
  ENC="$(PASS="$PASS" python -c "import urllib.parse,os; print(urllib.parse.quote(os.environ['PASS'], safe=''))")"
  export SQL_SERVER_CONNECTION_STRING="mssql+pyodbc://sa:${ENC}@sqlserver:1433/Healan?driver=ODBC+Driver+18+for+SQL+Server&TrustServerCertificate=yes"
  echo "python-rag: SQL_SERVER_CONNECTION_STRING built from default password"
fi

export HOST="${HOST:-0.0.0.0}"
export PORT="${PORT:-8000}"
export DATA_SOURCE="${DATA_SOURCE:-sqlserver}"
export SQL_SERVER_USE_HEALAN_BUNDLE="${SQL_SERVER_USE_HEALAN_BUNDLE:-true}"
export EMBEDDING_MODEL="${EMBEDDING_MODEL:-heydariAI/persian-embeddings}"
export CHROMA_PERSIST_DIR="${CHROMA_PERSIST_DIR:-/data/chroma}"
export CHROMA_COLLECTION="${CHROMA_COLLECTION:-healan_rag}"
export RAG_AUTO_INGEST="${RAG_AUTO_INGEST:-true}"
export RAG_ANSWER_MODE="${RAG_ANSWER_MODE:-direct}"
export RAG_SYNC_ENABLED="${RAG_SYNC_ENABLED:-true}"

exec python run.py
