# Healan AI (Python)

سرویس AI برای Healan Doctor: چت LLM، خلاصه‌سازی، و **RAG** (پاسخ بر اساس دادهٔ اکسل / بعداً SQL Server).

## پیش‌نیاز

- Python 3.11+ (ترجیحاً 3.11 یا 3.12؛ 3.14 ممکن است با برخی پکیج‌ها سازگ نباشد)
- کلید API سازگار با OpenAI
- برای RAG: اولین اجرا مدل embedding فارسی را از HuggingFace دانلود می‌کند (حدود چندصد مگابایت)

## نصب

```powershell
cd Python
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
python scripts\create_sample_excel.py
```

## مدل‌ها برای فارسی

| نقش | پیش‌فرض | توضیح |
|-----|---------|--------|
| **Embedding (RAG)** | `heydariAI/persian-embeddings` | مخصوص فارسی؛ tokenization و شباهت معنایی بهتر |
| **LLM (پاسخ نهایی)** | `gpt-4o-mini` | برای کیفیت بالاتر فارسی: `gpt-4o` |
| **LLM لوکال (Ollama)** | `qwen2.5:7b` | فارسی قابل قبول بدون API ابری |

```env
EMBEDDING_MODEL=heydariAI/persian-embeddings
OPENAI_MODEL=gpt-4o
```

## اجرا

```powershell
python run.py
```

Swagger: http://localhost:8000/docs

**UI تست RAG:** http://localhost:8000/

## RAG — جریان کار

```
Excel (هر ردیف = یک سند) → Embedding فارسی → ChromaDB
سوال کاربر → جستجوی شباهت → Top-K ردیف → LLM با context → پاسخ
```

### API

| مسیر | توضیح |
|------|--------|
| `GET /api/v1/rag/status` | وضعیت ایندکس |
| `POST /api/v1/rag/ingest` | بارگذاری مجدد از اکسل |
| `POST /api/v1/rag/ask` | پرسش بر اساس داده |

### نمونه پرسش

```powershell
curl -X POST http://localhost:8000/api/v1/rag/ask `
  -H "Content-Type: application/json" `
  -d "{\"question\": \"پزشک متخصص قلب کیست و شماره تماسش چیه؟\"}"
```

پاسخ شامل `answer` و `sources` (ردیف‌های بازیابی‌شده از اکسل) است.

### فایل Excel خودتان

1. ستون‌ها را با نام فارسی یا انگلیسی بگذارید (هر ردیف یک رکورد).
2. مسیر را در `.env` تنظیم کنید: `EXCEL_FILE_PATH=data/my_data.xlsx`
3. `POST /api/v1/rag/ingest` را بزنید.

## SQL Server (فاز بعد)

```env
DATA_SOURCE=sqlserver
SQL_SERVER_CONNECTION_STRING=mssql+pyodbc://user:pass@SERVER/HealanDB?driver=ODBC+Driver+17+for+SQL+Server
SQL_SERVER_QUERY=SELECT Id, FullName, Specialty, Phone, Address FROM Doctors
```

نیاز: `pip install pyodbc sqlalchemy`

کلاس آماده: `app/data/sql_server_source.py`

## ساختار

```
Python/
  app/
    data/
      excel_source.py       # خواندن اکسل
      sql_server_source.py  # آماده برای SQL Server
    rag/
      embeddings.py         # heydariAI/persian-embeddings
      vector_store.py       # ChromaDB
      pipeline.py           # ingest + ask
    routers/rag.py
  data/
    sample.xlsx             # بعد از create_sample_excel.py
  scripts/create_sample_excel.py
```

## تست

```powershell
pytest
```

## APIهای قبلی

| مسیر | توضیح |
|------|--------|
| `POST /api/v1/chat` | چت آزاد |
| `POST /api/v1/summarize` | خلاصه متن |
