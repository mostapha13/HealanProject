# RAG — Healan Doctor

سرویس AI برای Healan Doctor: **RAG فارسی** با پاسخ مستقیم از دیتابیس (بدون LLM).

## مدل Embedding (وکتورسازی فارسی)

| مورد | مقدار |
|------|--------|
| **مدل** | `heydariAI/persian-embeddings` |
| **لینک HuggingFace** | https://huggingface.co/heydariAI/persian-embeddings |
| **نوع** | Sentence Transformer مخصوص فارسی |
| **ChromaDB** | ذخیره وکتورها با فاصله cosine |

پاسخ نهایی از فیلد `Answer` رکورد بازیابی‌شده برگردانده می‌شود (حالت `direct`).

## پیش‌نیاز

- Python 3.11+
- SQL Server با جداول `RagKnowledgeItems`, `RagSettings`, ...
- ODBC Driver 17 for SQL Server
- اولین اجرا مدل embedding را از HuggingFace دانلود می‌کند

## نصب

```powershell
cd Python
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
# ویرایش SQL_SERVER_CONNECTION_STRING
```

## اجرا

```powershell
python run.py
```

Swagger: http://localhost:8000/docs

## جریان کار

```
SQL Server (FAQ + محتوای سایت + بلاگ + نظرات) 
  → خلاصه LLM فقط برای بلاگ و نظرات (OPENAI_MODEL)
  → Embedding فارسی → ChromaDB
  → Background sync هر N دقیقه (از RagSettings)
سوال کاربر → Healan API → Python /rag/ask → پاسخ مستقیم (برای بلاگ/نظر = همان خلاصه)```

## API

| مسیر | توضیح |
|------|--------|
| `GET /api/v1/rag/status` | وضعیت ایندکس |
| `POST /api/v1/rag/ingest` | همگام‌سازی دستی |
| `POST /api/v1/rag/ask` | پرسش (حالت direct) |

## تنظیمات (.env)

```env
DATA_SOURCE=sqlserver
EMBEDDING_MODEL=heydariAI/persian-embeddings
SQL_SERVER_CONNECTION_STRING=mssql+pyodbc://...
RAG_ANSWER_MODE=direct
RAG_SYNC_ENABLED=true
RAG_SYNC_INTERVAL_MINUTES=10
```

فاصله sync و آستانه شباهت از جدول `RagSettings` در SQL نیز خوانده می‌شود.

## پنل کلینیک

`/site-content/rag` — مدیریت سوال/جواب و تنظیمات RAG

## پورتال

دکمه شناور ربات → `/assistant`
