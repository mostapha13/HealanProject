FROM python:3.11-slim-bookworm

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    CHROMA_PERSIST_DIR=/data/chroma \
    HF_HOME=/data/hf-cache \
    TRANSFORMERS_CACHE=/data/hf-cache \
    HOST=0.0.0.0 \
    PORT=8000 \
    TZ=Asia/Tehran

RUN ln -snf /usr/share/zoneinfo/${TZ} /etc/localtime && echo ${TZ} > /etc/timezone \
    && apt-get update \
    && apt-get install -y --no-install-recommends \
        curl \
        gnupg \
        apt-transport-https \
        ca-certificates \
        unixodbc \
        unixodbc-dev \
        build-essential \
        ffmpeg \
    && curl -fsSL https://packages.microsoft.com/keys/microsoft.asc \
        | gpg --dearmor -o /usr/share/keyrings/microsoft-prod.gpg \
    && echo "deb [arch=amd64 signed-by=/usr/share/keyrings/microsoft-prod.gpg] https://packages.microsoft.com/debian/12/prod bookworm main" \
        > /etc/apt/sources.list.d/mssql-release.list \
    && apt-get update \
    && ACCEPT_EULA=Y apt-get install -y --no-install-recommends msodbcsql18 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY Python/requirements.txt ./requirements.txt
RUN pip install --upgrade pip \
    && pip install -r requirements.txt

# Pre-download Persian embedding weights so first ingest is not blocked by HuggingFace
RUN python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('heydariAI/persian-embeddings')"

COPY Python/ ./

COPY docker/python-rag-entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh \
    && mkdir -p /data/chroma /data/hf-cache

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=10s --start-period=180s --retries=10 \
  CMD curl -fsS http://127.0.0.1:8000/health || exit 1

ENTRYPOINT ["/entrypoint.sh"]
