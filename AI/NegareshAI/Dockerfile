FROM python:3.11-slim-bookworm

WORKDIR /app
RUN sed -i 's|http://deb.debian.org|https://deb.debian.org|g; s|http://security.debian.org|https://security.debian.org|g' /etc/apt/sources.list.d/debian.sources \
    && apt-get -o Acquire::Retries=5 -o Acquire::https::Timeout=30 update \
    && apt-get install -y --no-install-recommends tesseract-ocr tesseract-ocr-fas tesseract-ocr-eng \
    && rm -rf /var/lib/apt/lists/*
COPY AI/NegareshAI/requirements.txt .
COPY docker/local-publish/torch-2.6.0+cpu-cp311-cp311-linux_x86_64.whl /tmp/torch-2.6.0+cpu-cp311-cp311-linux_x86_64.whl
RUN pip install --no-deps /tmp/torch-2.6.0+cpu-cp311-cp311-linux_x86_64.whl \
    && rm /tmp/torch-2.6.0+cpu-cp311-cp311-linux_x86_64.whl
RUN --mount=type=cache,id=negareshai-pip-runtime,target=/root/.cache/pip \
    pip install --timeout 600 --retries 10 -r requirements.txt
COPY AI/NegareshAI/ .

EXPOSE 8000
HEALTHCHECK --interval=10s --timeout=5s --start-period=30s --retries=10 \
  CMD ["python", "-c", "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8000/health', timeout=3)"]
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
