# راهنمای کامل RAG — سامانه Healan (دستیار هوشمند مطب)

مخاطب: توسعه‌دهنده .NET / Python / DevOps  
تاریخ به‌روزرسانی: شاخه `ai` — خلاصه بلاگ با Ollama، مدل‌های قابل تنظیم از UI، حالت `direct`

---

## فهرست

1. [هدف و صورت مسئله](#۱-هدف-و-صورت-مسئله)
2. [معماری و دو جریان اصلی](#۲-معماری-و-دو-جریان-اصلی)
3. [جداول SQL و فیلدها](#۳-جداول-sql-و-فیلدها)
4. [خواندن داده‌ها از بخش‌های مختلف دیتابیس](#۴-خواندن-داده‌ها-از-بخش‌های-مختلف-دیتابیس)
5. [ChromaDB چیست و چه چیزی داخلش می‌ماند](#۵-chromadb)
6. [پایپ‌لاین Ingest با مثال عددی](#۶-پایپ‌لاین-ingest)
7. [سرویس‌های Background](#۷-سرویس‌های-background)
8. [جریان Ask با مثال کامل FAQ](#۸-جریان-ask--مثال-faq)
9. [جریان Ask با مثال کامل بلاگ](#۹-جریان-ask--مثال-بلاگ)
10. [سقف سوال، OTP و لاگ](#۱۰-سقف-سوال-otp-و-لاگ)
11. [تنظیم مدل‌ها از UI](#۱۱-تنظیم-مدل‌ها-از-ui)
12. [نقشه کلاس‌ها و فایل‌ها (C# و Python)](#۱۲-نقشه-کلاس‌ها-و-فایل‌ها)
13. [نصب Ollama و دیپلوی](#۱۳-نصب-ollama-و-دیپلوی)
14. [رزرو نوبت از چت (جدا از RAG)](#۱۴-رزرو-نوبت-از-چت)

---

## ۱. هدف و صورت مسئله

مطب روی `/assistant` دستیار می‌خواهد که:

- فقط از دانش تأییدشده جواب بدهد (`RagKnowledgeItems`، `PortalSiteSettings`، `PortalContentItems`، `BlogPosts`، `PatientReviews`).
- اگر شباهت کافی نبود حدس نزند.
- مهمان سقف روزانه داشته باشد؛ بعد OTP.
- لاگ بدون کند کردن پاسخ (RabbitMQ).

### رویکرد: `answer_mode = direct`

```
سوال کاربر
  → Embedding (PersianEmbeddingFunction)
  → جستجو در Chroma collection = healan_rag
  → اگر score ≥ SimilarityThreshold → برگرداندن metadata["answer"]
```

LLM (`qwen2.5:3b` روی Ollama) فقط در **Ingest** برای خلاصه `blog` و `review` استفاده می‌شود — نه برای ساخت جواب در Ask.

---

## ۲. معماری و دو جریان اصلی

```
┌─────────────────────────────────────────────────────────────┐
│  جریان A — ایندکس (Background / استارت)                     │
│  SQL (۵ جدول) → Document[] → summarize(blog/review)         │
│       → Embedding → clear+upsert Chroma(healan_rag)         │
│       → UPDATE RagSettings.LastSyncedAt                     │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  جریان B — پرسش (آنلاین)                                    │
│  Portal /assistant → PortalPublicController.RagAsk          │
│       → RagAskQueryHandler → سقف Redis                      │
│       → RagPythonService → POST /api/v1/rag/ask             │
│       → VectorStore.search → ask_direct → answer            │
│       → RagChatLogPublisher → Q_RagChatLog                  │
│       → RagChatLogConsumerService → INSERT RagChatLogs      │
└─────────────────────────────────────────────────────────────┘
```

| لایه | نقش |
|------|-----|
| `healan-portal` | UI چت |
| `healan-webapi` | سقف، فراخوانی Python، Publish لاگ |
| `python-rag` | Ingest + Ask + background sync |
| SQL Server | منبع حقیقت |
| Chroma (`/data/chroma`) | ایندکس برداری |
| Ollama `:11434` | فقط summarize |
| Redis | شمارنده سقف |
| RabbitMQ `Q_RagChatLog` | لاگ async |

---

## ۳. جداول SQL و فیلدها

همه نام‌ها دقیقاً همان‌هایی هستند که در EF و کوئری Python آمده‌اند.

### ۳-۱. `RagKnowledgeItems` (FAQ رسمی)

| فیلد | نقش در RAG |
|------|------------|
| `RagKnowledgeItemId` | PK → id سند `faq-{id}` |
| `Question` | سوال اصلی |
| `QuestionSummary` | غنی‌سازی SearchText |
| `Keywords` | غنی‌سازی SearchText |
| `Topic` | موضوع + metadata |
| `Answer` | **جواب کاربر** = `metadata.answer` |
| `SimilarQuestions` | غنی‌سازی SearchText |
| `SearchText` | **متنی که Embed می‌شود** = `Document.content` |
| `Priority` / `SortOrder` | اولویت |
| `IsActive` | فقط `= 1` ایندکس می‌شود |
| `IsDeleted` | فقط `= 0` |

Entity: `RagKnowledgeItem` · Config: `RagKnowledgeItemConfiguration` → `ToTable("RagKnowledgeItems")`

### ۳-۲. `RagSettings` (یک ردیف `RagSettingId = 1`)

| فیلد | پیش‌فرض | نقش |
|------|---------|-----|
| `RagSettingId` | `1` | PK ثابت |
| `SyncIntervalMinutes` | `10` | فاصله background sync پایتون |
| `SimilarityThresholdPercent` | `55` | آستانه Ask (۰٫۵۵) |
| `PythonApiUrl` | `http://python-rag:8000` | آدرس سرویس |
| `IsEnabled` | `1` | اگر `0` sync و Ask خاموش |
| `GuestDailyLimit` | `10` | سقف مهمان |
| `AuthenticatedDailyLimit` | `200` | سقف لاگین |
| `EmbeddingModel` | `heydariAI/persian-embeddings` | مدل بردار |
| `SummarizeModel` | `qwen2.5:3b` | مدل خلاصه بلاگ/نظر |
| `LastSyncedAt` | NULL | آخرین ingest موفق |
| `UpdatedAt` | UtcNow | زمان ویرایش |

Entity: `RagSetting` · Migration مدل‌ها: `20260718194500_AddRagModelSettings.cs`

### ۳-۳. `RagChatLogs`

| فیلد | نقش |
|------|-----|
| `RagChatLogId` | PK |
| `Question` / `Answer` | متن گفتگو |
| `MatchedKnowledgeItemId` | id سند مچ‌شده (FAQ یا blog id و …) |
| `SimilarityScore` | نمره کسینوسی |
| `SourceType` | `faq` / `setting` / `content` / `blog` / `review` |
| `SessionId` / `GuestKey` / `IdentityUserId` / `PhoneNumber` | هویت و سهمیه |
| `WasAnswered` | آیا جواب معتبر بود |
| `CreatedAt` | UTC |

### ۳-۴. `PortalSiteSettings`

| فیلد خوانده‌شده | نقش |
|-----------------|-----|
| `SettingKey` | id سند `setting-{key}` |
| `SettingValue` | `metadata.answer` |
| `Description` | بخشی از content برای جستجو |

شرط: همه ردیف‌ها (بدون فیلتر Publish).

### ۳-۵. `PortalContentItems`

| فیلد | نقش |
|------|-----|
| `PortalContentItemId` | `content-{id}` |
| `SectionType` / `Title` / `Subtitle` / `Body` | content و answer |

شرط: `IsPublished = 1 AND IsDeleted = 0`

### ۳-۶. `BlogPosts`

| فیلد | نقش |
|------|-----|
| `BlogPostId` | `blog-{id}` |
| `Title` | عنوان + بخشی از content |
| `Excerpt` | بخشی از `raw_text` |
| `Body` | HTML → `strip_html` → `raw_text` برای خلاصه‌ساز |
| `IsPublished` / `IsDeleted` | فیلتر |

بعد از summarize: `content = "عنوان | خلاصه"` و `answer = خلاصه`.

### ۳-۷. `PatientReviews`

| فیلد | نقش |
|------|-----|
| `PatientReviewId` | `review-{id}` |
| `DisplayName` / `Rating` / `ReviewText` | content و answer |
| `Status` | فقط `Status = 2` (Approved) |

---

## ۴. خواندن داده‌ها از بخش‌های مختلف دیتابیس

کلاس: **`HealanSqlDataSource`**  
فایل: `Python/app/data/healan_sql_source.py`

### ۴-۱. نقطه ورود

```python
def load(self) -> list[Document]:
    documents.extend(self._load_faq(...))
    documents.extend(self._load_settings(...))
    documents.extend(self._load_content(...))
    documents.extend(self._load_blogs(...))
    documents.extend(self._load_reviews(...))
    return documents
```

یک بار به SQL وصل می‌شود و **پنج کوئری جدا** می‌زند. خروجی همه در یک لیست `Document` مخلوط می‌شود — هنوز به Chroma نرفته.

ساختار `Document` (`Python/app/data/base.py`):

| فیلد | معنی |
|------|------|
| `id` | شناسه یکتا در Chroma (`faq-4`, `blog-12`, …) |
| `content` | متنی که Embedding می‌شود |
| `metadata` | حداقل: `answer`, `source`, `id` (+ برای بلاگ `raw_text`, `title`) |

### ۴-۲. جدول مقایسه منابع

| متد Python | جدول SQL | شرط WHERE | id در Chroma | `source` | چه Embed می‌شود | چه به کاربر نشان داده می‌شود |
|------------|----------|-----------|--------------|----------|-----------------|------------------------------|
| `_load_faq` | `RagKnowledgeItems` | `IsActive=1 AND IsDeleted=0` | `faq-{RagKnowledgeItemId}` | `faq` | `SearchText` | `Answer` |
| `_load_settings` | `PortalSiteSettings` | همه | `setting-{SettingKey}` | `setting` | `Description \| Key \| Value` | `SettingValue` |
| `_load_content` | `PortalContentItems` | `IsPublished=1 AND IsDeleted=0` | `content-{PortalContentItemId}` | `content` | Title\|Subtitle\|Body\|Section | Title — Subtitle — Body |
| `_load_blogs` | `BlogPosts` | `IsPublished=1 AND IsDeleted=0` | `blog-{BlogPostId}` | `blog` | بعد از summarize: عنوان\|خلاصه | خلاصه |
| `_load_reviews` | `PatientReviews` | `Status=2 AND IsDeleted=0` | `review-{PatientReviewId}` | `review` | نام\|امتیاز\|خلاصه | `نظر {نام}: خلاصه` |

**نکته مهم:** سیستم از قبل «نمی‌گوید این سوال بلاگ است». همه اسناد در **یک** کالکشن Chroma هستند؛ نزدیک‌ترین سند برنده است و `source` فقط برچسب نتیجه است.

### ۴-۳. تنظیمات sync از همان SQL

| متد | SQL | کاربرد |
|-----|-----|--------|
| `read_sync_settings()` | `SELECT TOP 1 * FROM RagSettings` | فاصله sync، `IsEnabled`، `EmbeddingModel`، `SummarizeModel`، آستانه |
| `touch_last_synced()` | `UPDATE RagSettings SET LastSyncedAt = SYSUTCDATETIME() WHERE RagSettingId = 1` | بعد از ingest موفق |

---

## ۵. ChromaDB

کلاس: **`VectorStore`** · فایل: `Python/app/rag/vector_store.py`  
Embedding: **`PersianEmbeddingFunction`** · `Python/app/rag/embeddings.py`

| تنظیم | مقدار |
|-------|--------|
| Collection | `healan_rag` (`CHROMA_COLLECTION`) |
| Persist | Docker: `/data/chroma` · لوکال: `Python/data/chroma` |
| Client | `chromadb.PersistentClient(path=...)` |
| فاصله | cosine (`hnsw:space=cosine`) |
| Score در Ask | `1 - distance` |

### چرخه هر Ingest

1. `VectorStore.clear()` → حذف کالکشن + ساخت دوباره  
2. `add_documents()` → `collection.upsert` در batchهای ۱۰۰تایی  
3. هر سند: `ids=[doc.id]`, `documents=[doc.content]`, `metadatas=[doc.metadata]`

یعنی Chroma همیشه **عکس لحظه‌ای کامل** دانش SQL است؛ آپدیت جزئی ردیف‌به‌ردیف ندارد — clear و دوباره پر می‌شود.

---

## ۶. پایپ‌لاین Ingest

کلاس: **`RagPipeline`** · `ingest()` در `Python/app/rag/pipeline.py`

```
1) apply_rag_sql_overrides()     # EmbeddingModel / SummarizeModel از RagSettings
2) HealanSqlDataSource.load()    # ۵ منبع
3) enrich_documents_with_summaries()  # فقط blog و review
4) store.clear() + store.add_documents()
5) touch_last_synced()
```

فایل‌های مرتبط:

| فایل | کلاس / تابع |
|------|-------------|
| `pipeline.py` | `RagPipeline.ingest` |
| `summarize_docs.py` | `enrich_documents_with_summaries` |
| `services/summarizer.py` | `summarize_for_rag`, `fallback_summary`, `strip_html` |
| `runtime_settings.py` | `apply_rag_sql_overrides` |
| `service.py` | `init_rag`, `get_rag_pipeline`, `is_ingesting` |

### مثال عددی Ingest (بلاگ فشار خون)

فرض ردیف در `BlogPosts`:

| فیلد | مقدار |
|------|--------|
| `BlogPostId` | `12` |
| `Title` | علائم فشار خون بالا |
| `Excerpt` | (خالی) |
| `Body` | HTML بلند چند هزار کاراکتری |
| `IsPublished` | `1` |

**گام ۱ — `_load_blogs`:**

```text
Document(
  id="blog-12",
  content="علائم فشار خون بالا | …متن کامل body…",
  metadata={
    "source": "blog",
    "id": "12",
    "title": "علائم فشار خون بالا",
    "raw_text": "…متن کامل…",
    "answer": "…برش اولیه…"
  }
)
```

**گام ۲ — `enrich_documents_with_summaries` → `summarize_for_rag`:**

- مدل از `RagSettings.SummarizeModel` یا env (`qwen2.5:3b`)
- اگر Ollama قطع باشد: `fallback_summary` (~۶۰۰ کاراکتر)

بعد از خلاصه:

```text
Document(
  id="blog-12",
  content="علائم فشار خون بالا | سردرد، تاری دید، تپش قلب و ...",
  metadata={
    "source": "blog",
    "id": "12",
    "answer": "سردرد، تاری دید، تپش قلب و ..."
  }
)
```

**گام ۳ — Embedding + upsert در `healan_rag`.**

FAQها در همین ingest بدون LLM می‌آیند: `SearchText` embed، `Answer` در metadata.

---

## ۷. سرویس‌های Background

دو background جدا داریم: یکی در **Python** (ایندکس) و یکی در **C#** (لاگ).

### ۷-۱. Python: `run_background_sync` (همگام‌سازی Chroma)

| مورد | مقدار |
|------|--------|
| فایل | `Python/app/rag/background_sync.py` |
| تابع | `run_background_sync(settings, stop_event)` |
| شروع | `Python/app/main.py` → `lifespan` → `asyncio.create_task(...)` |
| شرط اجرا | `rag_sync_enabled`، `DATA_SOURCE=sqlserver`، connection string پر |

**حلقه هر دور:**

```
while not stop:
  1. اگر ingest دیگری در حال اجراست → صبر (is_ingesting)
  2. read_sync_settings() از جدول RagSettings
  3. اگر IsEnabled=false → skip body
  4. else → _sync_once():
        reset_rag_pipeline()
        apply_rag_sql_overrides(settings)   # مدل‌ها از SQL
        pipeline = RagPipeline(runtime)
        pipeline.ingest()                   # load + summarize + clear Chroma + upsert
        touch_last_synced()
  5. sleep(SyncIntervalMinutes * 60)        # پیش‌فرض ۱۰ دقیقه از RagSettings
```

**استارت جداگانه:** در `lifespan` یک بار `init_rag()` هم صدا می‌شود (`rag_auto_ingest`) تا قبل از اولین sync دوره‌ای، ایندکس آماده باشد.

فاصله sync از env (`RAG_SYNC_INTERVAL_MINUTES`) شروع می‌شود ولی **هر دور از `RagSettings.SyncIntervalMinutes` override می‌شود**.

### ۷-۲. C#: `RagChatLogConsumerService` (لاگ گفتگو)

| مورد | مقدار |
|------|--------|
| کلاس | `RagChatLogConsumerService : BackgroundService` |
| فایل | `Backend/Healan/src/Healan.Infrastructure/Portal/RagChatLogConsumerService.cs` |
| ثبت DI | `AddHostedService<RagChatLogConsumerService>()` در Infrastructure DI |
| صف | `QueueNames.RagChatLog` = `Q_RagChatLog` |
| پیام | `RagChatLogMessage` |
| ناشر | `RagChatLogPublisher.Publish` (بعد از Ask موفق/ناموفق) |

**کار هر پیام:**

1. Subscribe روی RabbitMQ  
2. ساخت `RagChatLog` با فیلدهای Question، Answer، SimilarityScore، SourceType، GuestKey / IdentityUserId، …  
3. `db.RagChatLogs.Add` + `SaveChanges`  
4. ack/nack بر اساس موفقیت

هدف: مسیر Ask معطل INSERT SQL نشود.

### ۷-۳. چه چیزی Background نیست؟

- Ask آنلاین در request thread / HTTP است.  
- CRUD FAQ در کلینیک فقط SQL را عوض می‌کند؛ تا sync بعدی (یا recreate `python-rag`) در Chroma دیده نمی‌شود.

---

## ۸. جریان Ask — مثال FAQ «آدرس مطب کجاست؟»

### ۸-۱. دانش از قبل در SQL (Seed یا UI)

جدول `RagKnowledgeItems`:

| فیلد | مقدار نمونه |
|------|-------------|
| `RagKnowledgeItemId` | `4` |
| `Question` | آدرس مطب کجاست؟ |
| `Keywords` | آدرس، مکان، شوشتر |
| `Answer` | آدرس مطب: شوشتر، خیابان طالقانی، … |
| `SearchText` | آدرس مطب کجاست؟ \| آدرس، مکان، شوشتر \| … (ساخته با `RagSearchTextBuilder.Build`) |
| `IsActive` | `1` |

بعد از ingest → Chroma id = `faq-4` با `metadata.answer` = همان Answer.

### ۸-۲. گام‌به‌گام Ask (کلاس‌ها به ترتیب)

| # | لایه | کلاس / متد | چه می‌کند |
|---|------|------------|-----------|
| 1 | Portal UI | `Assistant/index.tsx` | کاربر سوال می‌فرستد + `guestKey` کوکی |
| 2 | API | `PortalPublicController.RagAsk` | `POST .../PortalPublic/RagAsk` |
| 3 | MediatR | `RagAskQueryHandler.Handle` | ورود به منطق Ask |
| 4 | SQL | خواندن `RagSettings` | `IsEnabled`, limits, threshold, `PythonApiUrl` |
| 5 | سقف | `RagQuotaCounter.GetUsedTodayAsync` + `RagQuotaHelper.Evaluate` | Redis کلید `rag:quota:g:{guest}:{yyyyMMdd}` |
| 6 | HTTP | `RagPythonService.AskAsync` | POST `{PythonApiUrl}/api/v1/rag/ask` با `answer_mode:"direct"`, `top_k:3`, `similarity_threshold:0.55` |
| 7 | FastAPI | `routers/rag.py` → `rag_ask` | دریافت درخواست |
| 8 | Pipeline | `RagPipeline.ask` | ارکستراسیون |
| 9 | Vector | `VectorStore.search` | Embed سوال + query cosine |
| 10 | جواب | `ask_direct` در `direct_answer.py` | اگر score≥آستانه → `metadata["answer"]`؛ وگرنه fallback کلیدواژه؛ وگرنه پیام عدم پاسخ |
| 11 | سقف | `RagQuotaCounter.IncrementTodayAsync` | used++ |
| 12 | صف | `RagChatLogPublisher.Publish` | پیام به `Q_RagChatLog` |
| 13 | BG | `RagChatLogConsumerService` | INSERT در `RagChatLogs` با `SourceType=faq`, `MatchedKnowledgeItemId=4`, `SimilarityScore≈0.82` |

### ۸-۳. درخواست / پاسخ نمونه

```http
POST /Healan/api/v1/PortalPublic/RagAsk
{
  "question": "آدرس مطب کجاست؟",
  "sessionId": "uuid",
  "guestKey": "uuid-from-cookie"
}
```

```json
{
  "answer": "آدرس مطب: شوشتر، خیابان طالقانی، …",
  "wasAnswered": true,
  "similarityScore": 0.82,
  "matchedKnowledgeItemId": 4,
  "sourceType": "faq",
  "usedCount": 3,
  "dailyLimit": 10,
  "remainingCount": 7,
  "isAuthenticated": false,
  "requiresLogin": false
}
```

اگر کاربر بپرسد «قیمت بیت‌کوین؟» و هیچ سندی نزدیک نباشد → `wasAnswered=false` و پیام عدم پاسخ؛ ربات حدس نمی‌زند.

---

## ۹. جریان Ask — مثال بلاگ «فشار خون»

Ask از نظر کلاس‌ها **عین FAQ** است (همان جدول گام‌ها در بخش ۸). تفاوت فقط در **محتوای ایندکس‌شده** است.

| مرحله | FAQ | بلاگ |
|-------|-----|------|
| منبع SQL | `RagKnowledgeItems` | `BlogPosts` |
| متد load | `_load_faq` | `_load_blogs` |
| قبل از Embed | بدون LLM | `enrich_documents_with_summaries` |
| id Chroma | `faq-4` | `blog-12` |
| `metadata.answer` | متن ثابت `Answer` | خلاصه LLM |
| `sourceType` در پاسخ | `faq` | `blog` |

**سوال کاربر:** «فشار خون بالا چه علائمی دارد؟»

1. `VectorStore.search` روی کل `healan_rag` (بدون فیلتر source)  
2. اگر FAQ دقیقی نباشد، `blog-12` با score بالاتر می‌آید  
3. `ask_direct` همان خلاصه را برمی‌گرداند — نه کل مقاله و نه فقط عنوان  
4. لاگ: `SourceType = blog`, `MatchedKnowledgeItemId = 12`

اگر همزمان FAQای با کلمات «فشارخون» داشته باشید، ممکن است FAQ برنده شود — رفتار شباهت است نه باگ.

---

## ۱۰. سقف سوال، OTP و لاگ

### سقف

| نوع کاربر | فیلد | پیش‌فرض | کلید Redis |
|-----------|------|---------|------------|
| مهمان | `GuestDailyLimit` | 10 | `rag:quota:g:{guestKey}:{yyyyMMdd}` |
| لاگین | `AuthenticatedDailyLimit` | 200 | `rag:quota:u:{userId:N}:{yyyyMMdd}` |

فایل‌ها: `RagQuotaHelper.cs`, `RagQuotaCounter.cs`  
اگر Redis قطع باشد: `COUNT` روی `RagChatLogs` برای همان روز.

### OTP

- `PortalOtpRequest` / `PortalOtpVerify` روی `PortalPublicController`
- توکن فرانت: `portal_rag_access_token`
- بعد از لاگین Ask با Bearer و سقف ۲۰۰تایی

### لاگ

- Publish: `RagChatLogPublisher` → `Q_RagChatLog`
- Consume: `RagChatLogConsumerService` → جدول `RagChatLogs`
- مشاهده کلینیک: `RagChatLogListQuery` / UI `RagLogs.tsx`

---

## ۱۱. تنظیم مدل‌ها از UI

مسیر کلینیک: **اطلاعات پایه → دستیار هوشمند**  
فرانت: `healan-clinic/.../BasicData/AssistantSettings.tsx`  
API: `RagKnowledgeController.SettingGet` / `SettingSave`  
Handler: `RagSettingGetQueryHandler` / `RagSettingSaveCommandHandler`

| فیلد UI | ستون SQL | نمونه | اثر بعد از sync |
|---------|----------|--------|-----------------|
| مدل Embedding | `EmbeddingModel` | `heydariAI/persian-embeddings` | clear+upsert دوباره با مدل جدید |
| مدل خلاصه‌ساز | `SummarizeModel` | `qwen2.5:3b` | خلاصه blog/review دوباره |

Python هر sync با `apply_rag_sql_overrides` این ستون‌ها را می‌خواند.

---

## ۱۲. نقشه کلاس‌ها و فایل‌ها

### ۱۲-۱. Python

| مسیر | کلاس / نماد | نقش |
|------|-------------|-----|
| `Python/app/main.py` | `lifespan` | استارت ingest + `run_background_sync` |
| `Python/app/config.py` | `Settings`, `get_settings` | env |
| `Python/app/data/base.py` | `Document`, `DataSource` | مدل سند |
| `Python/app/data/healan_sql_source.py` | `HealanSqlDataSource` | خواندن ۵ جدول |
| `Python/app/rag/pipeline.py` | `RagPipeline` | `ingest`, `ask` |
| `Python/app/rag/summarize_docs.py` | `enrich_documents_with_summaries` | خلاصه blog/review |
| `Python/app/services/summarizer.py` | `summarize_for_rag` | فراخوانی Ollama |
| `Python/app/rag/runtime_settings.py` | `apply_rag_sql_overrides` | مدل از SQL |
| `Python/app/rag/embeddings.py` | `PersianEmbeddingFunction` | بردار فارسی |
| `Python/app/rag/vector_store.py` | `VectorStore` | Chroma clear/upsert/search |
| `Python/app/rag/direct_answer.py` | `ask_direct` | پاسخ مستقیم |
| `Python/app/rag/background_sync.py` | `run_background_sync`, `_sync_once` | sync دوره‌ای |
| `Python/app/rag/service.py` | `init_rag`, `get_rag_pipeline` | singleton pipeline |
| `Python/app/routers/rag.py` | `rag_ask`, `rag_ingest`, `rag_status` | HTTP API |

### ۱۲-۲. C# Backend

| مسیر | کلاس | نقش |
|------|------|-----|
| `.../Domain/Portal/Entities/RagKnowledgeItem.cs` | `RagKnowledgeItem` | FAQ |
| `.../Domain/Portal/Entities/RagSetting.cs` | `RagSetting` | تنظیمات |
| `.../Domain/Portal/Entities/RagChatLog.cs` | `RagChatLog` | لاگ |
| `.../Domain/Portal/Entities/BlogPost.cs` | `BlogPost` | بلاگ |
| `.../Domain/Portal/Entities/PatientReview.cs` | `PatientReview` | نظرات |
| `.../Domain/Portal/Entities/PortalSiteSetting.cs` | `PortalSiteSetting` | تنظیمات سایت |
| `.../Domain/Portal/Entities/PortalContentItem.cs` | `PortalContentItem` | CMS |
| `.../Queries/RagAsk/RagAskQuery.cs` | `RagAskQueryHandler` | هسته Ask |
| `.../Services/RagPythonService.cs` | `RagPythonService` | HTTP به Python |
| `.../Services/RagQuotaHelper.cs` | `RagQuotaHelper` | ارزیابی سقف |
| `.../Infrastructure/Portal/RagQuotaCounter.cs` | `RagQuotaCounter` | Redis |
| `.../Infrastructure/Portal/RagChatLogPublisher.cs` | `RagChatLogPublisher` | Publish صف |
| `.../Infrastructure/Portal/RagChatLogConsumerService.cs` | `RagChatLogConsumerService` | BackgroundService لاگ |
| `.../Infrastructure/Portal/RagKnowledgeSeed.cs` | `RagKnowledgeSeed` | seed FAQ + settings |
| `.../Application/Portal/RagSearchTextBuilder.cs` | `RagSearchTextBuilder` | ساخت `SearchText` |
| `.../Controllers/PortalControllers.cs` | `PortalPublicController`, `RagKnowledgeController` | endpointها |

### ۱۲-۳. Frontend

| مسیر | نقش |
|------|-----|
| `healan-portal/.../Assistant/index.tsx` | چت RAG (+ رزرو جدا) |
| `healan-clinic/.../SiteContent/Rag.tsx` | CRUD FAQ |
| `healan-clinic/.../BasicData/AssistantSettings.tsx` | سقف + مدل‌ها |
| `healan-clinic/.../SiteContent/RagLogs.tsx` | مشاهده لاگ |

### ۱۲-۴. Endpointهای مهم

| متد | مسیر | Handler |
|-----|------|---------|
| POST | `/Healan/api/v1/PortalPublic/RagAsk` | `RagAskQuery` |
| GET | `/Healan/api/v1/PortalPublic/RagQuota` | `RagQuotaStatusQuery` |
| GET/POST | `/Healan/api/v1/RagKnowledge/SettingGet\|SettingSave` | تنظیمات |
| CRUD | `/Healan/api/v1/RagKnowledge/List\|Register\|…` | FAQ |
| POST | `{Python}/api/v1/rag/ask` | `rag_ask` |
| POST | `{Python}/api/v1/rag/ingest` | ingest دستی |
| GET | `{Python}/api/v1/rag/status` | وضعیت ایندکس |

---

## ۱۳. نصب Ollama و دیپلوی

```bash
sudo snap start ollama
ollama pull qwen2.5:3b
curl -s http://127.0.0.1:11434/api/tags
docker exec healan-python-rag curl -s http://host.docker.internal:11434/api/tags
```

env کانتینر: `OPENAI_API_KEY=ollama`, `OPENAI_BASE_URL=http://host.docker.internal:11434/v1`

### دیپلوی هدفمند

```bash
cd /opt/healan
git stash push -m "server-local-before-pull" -- \
 docker/config/*/appsettings.Production.json \
 docker/scripts/apply-server-appsettings.sh \
 || true
git fetch origin && git checkout ai && git pull origin ai
set -a && source .env && set +a
export SQL_PASSWORD="$MSSQL_SA_PASSWORD"
chmod +x docker/scripts/apply-server-appsettings.sh
./docker/scripts/apply-server-appsettings.sh
export COMPOSE_PARALLEL_LIMIT=1
docker compose build --no-cache healan-webapi healan-clinic healan-portal python-rag
docker compose up -d --force-recreate healan-webapi healan-clinic healan-portal python-rag
docker compose up -d --force-recreate nginx-gateway
```

### عیب‌یابی

| علامت | احتمال |
|-------|--------|
| فقط عنوان بلاگ | Ollama خاموش / summarize fail → fallback |
| مدل عوض شد جواب قدیمی | sync هنوز اجرا نشده |
| کانتینر به Ollama نمی‌رسد | `host.docker.internal` + `snap start ollama` |
| FAQ جدید در چت نیست | صبر تا `SyncIntervalMinutes` یا recreate `python-rag` |

---

## ۱۴. رزرو نوبت از چت

در `/assistant` اگر پیام درباره نوبت باشد، فرانت **بدون `RagAsk`** وارد جریان رزرو می‌شود (`bookingIntent.ts`, orchestrator در `Assistant/index.tsx`). این مسیر با Ingest/Chroma اشتباه گرفته نشود.

---

## جمع‌بندی اسکلت

1. دانش ساخت‌یافته در جداول SQL با فیلدهای مشخص  
2. `HealanSqlDataSource.load` → پنج منبع → یک لیست Document  
3. خلاصه اختیاری فقط برای `blog` / `review`  
4. `VectorStore` روی کالکشن `healan_rag`  
5. Background Python برای sync دوره‌ای؛ Background C# برای لاگ  
6. Ask = Embedding + cosine + `metadata.answer`  
7. سقف Redis + OTP + لاگ RabbitMQ  
