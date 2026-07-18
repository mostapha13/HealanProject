# RAG — Healan Doctor

سرویس AI برای Healan Doctor: **RAG فارسی** با پاسخ مستقیم از دیتابیس (حالت `direct`).

## مستندات کامل

- **Markdown:** [`Docs/RAG-Healan-Guide.md`](../Docs/RAG-Healan-Guide.md)
- **Word (RTL):** با اجرای `python Docs/generate_rag_guide_docx.py` فایل `Docs/راهنمای-ساخت-چت‌بات-RAG-Healan.docx` ساخته می‌شود.

## خلاصه سریع

| موضوع | مقدار |
|------|--------|
| Embedding | `heydariAI/persian-embeddings` (قابل تغییر از UI / RagSettings) |
| خلاصه بلاگ/نظر | `qwen2.5:3b` روی Ollama (قابل تغییر از UI) |
| Vector DB | Chroma · کالکشن `healan_rag` · cosine |
| Ask | برگرداندن `metadata.answer` بدون LLM |

جریان:

```
SQL (FAQ + CMS + بلاگ + نظرات)
  → خلاصه LLM فقط برای بلاگ و نظرات
  → Embedding → Chroma
  → sync هر N دقیقه از RagSettings
سوال → Healan API → Python /rag/ask → پاسخ مستقیم
```

## پیش‌نیاز

- Python 3.11+
- SQL Server با جداول `RagKnowledgeItems`, `RagSettings`, ...
- ODBC Driver 17/18 for SQL Server
- برای خلاصه بلاگ: Ollama + `qwen2.5:3b` (اختیاری ولی توصیه‌شده)
- اولین اجرا مدل embedding را از HuggingFace دانلود می‌کند

## نصب

```powershell
cd Python
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
# ویرایش SQL_SERVER_CONNECTION_STRING و در صورت نیاز OPENAI_* برای Ollama
```

## اجرا

```powershell
python run.py
```

Swagger: http://localhost:8000/docs

## API

| مسیر | توضیح |
|------|--------|
| `GET /api/v1/rag/status` | وضعیت ایندکس |
| `POST /api/v1/rag/ingest` | همگام‌سازی دستی |
| `POST /api/v1/rag/ask` | پرسش (حالت direct) |

## پنل کلینیک

- `/site-content/rag` — سوال/جواب FAQ
- `/basic-data/assistant` — سقف سوال + مدل Embedding + مدل خلاصه‌ساز
- `/site-content/rag-logs` — گفتگوها

## پورتال

دکمه شناور ربات → `/assistant`
