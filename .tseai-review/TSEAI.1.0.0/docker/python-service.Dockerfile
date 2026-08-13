FROM python:3.12-slim
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 TZ=Asia/Tehran
WORKDIR /app
COPY AI/tseai-ai/requirements.lock .
RUN pip install --no-cache-dir --require-hashes -r requirements.lock
COPY AI/tseai-ai/app ./app
RUN addgroup --system --gid 10001 tseai && adduser --system --uid 10001 --ingroup tseai --no-create-home tseai \
    && chown -R tseai:tseai /app
EXPOSE 8000
USER 10001:10001
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
