# TSEAI Intelligence Sprint 1 — Semantic foundation, evaluation and trace

## هدف

این Sprint زیرساخت قابل‌اندازه‌گیری لازم برای ارتقای چت‌بات از مجموعه‌ای از پاسخ‌های موردی به یک سامانه داده‌محور را ایجاد می‌کند. سه خروجی این Sprint منبع حقیقت مشترک مراحل بعدی هستند:

1. Semantic Data Catalog برای تعیین معنی، زمان، واحد، ارتباط، سیاست به‌روزرسانی و روش بازیابی هر منبع؛
2. مجموعه ارزیابی سختگیرانه و قابل اجرای مجدد؛
3. Trace ماندگار و privacy-safe از مسیر هر سؤال تا پاسخ.

## Semantic Data Catalog

کاتالوگ Runtime در `CanonicalSourceCatalog` قرار دارد و از Admin Semantic Registry نیز قابل مشاهده است. هشت منبع زیر در Sprint 1 به‌طور کامل ممیزی شده‌اند:

| منبع | نوع پاسخ مرجع | تاریخچه | سیاست Vector |
|---|---|---|---|
| `Instrument` | Structured | Current-only | فقط Metadata هویتی؛ بدون Vector حقیقت |
| `Cashmarket` | Structured | Current-only | ممنوع؛ اعداد فقط از SQL/Redis |
| `OrderBookCurrent` | Structured | Current-only | ممنوع؛ اعداد فقط از ابزار قطعی |
| `ClientType` | Structured | Current-only | ممنوع؛ محاسبات قطعی |
| `Company` | Structured | Current-only | فیلدهای مرجع Vector نمی‌شوند |
| `Companystate` | Hybrid | SCD2 در Knowledge | فقط دلایل و متن توصیفی؛ فیلدهای کلیدی Metadata |
| `Content` | Hybrid | Append + mutable-row upsert | HTML پاک‌سازی، Chunk پایدار، Qdrant و بازیابی سند والد |
| `Nahad_Mali` | Structured | Current-only | فعلاً Vector نمی‌شود |

اصل حاکم: Vector Search برای یافتن متن توصیفی است و هیچ‌وقت مرجع قیمت، حجم، رتبه‌بندی، تاریخ رسمی یا هویت قطعی نیست.

## Evaluation Suite v2

Manifest اصلی: `tests/table-chat-evaluation-suite.v2.json`

- 404 سؤال SQL-grounded؛
- حداقل 50 سؤال برای هر جدول؛
- کنترل `expectedType`، `expectedEntity`، عبارت‌های الزامی و ممنوع؛
- کنترل حداکثر طول پاسخ؛
- کنترل وجود Trace و ابزار مرجع؛
- جلوگیری از HTML/JSON transport error؛
- ممنوعیت تاریخ نمایشی میلادی؛
- SHA-256 روی Manifest و تمام Corpusها برای Provenance؛
- گزارش خطا به تفکیک منبع، Cluster و نوع شکست.

پیش‌بررسی بدون تماس با Runtime:

```powershell
python scripts/evaluate-table-chat-suite.py --validate-only
```

اجرای کامل روی نسخه محلی:

```powershell
python scripts/evaluate-table-chat-suite.py --base-url http://localhost:8280
```

اجرای یک جدول یا چند Case مشخص:

```powershell
python scripts/evaluate-table-chat-suite.py --source company --ids CO-051,CO-052,CO-053,CO-054
```

## Conversation Golden Suite

مجموعه `tests/conversation-golden-suite.v1.json` شکاف میان تست سؤال‌های منفرد و رفتار واقعی چت را می‌بندد. نسخه ۱.۱ آن شامل هشت جریان و هفده نوبت است و موارد زیر را انتها‌به‌انتها، از HTTP تا SQL/Retrieval/Reflection، کنترل می‌کند:

- حفظ هویت کاربر و `ConversationId` در تمام نوبت‌های یک جریان؛
- ارجاع‌های فارسی مانند «اسمشون»، «سمت‌هاشون» و «زیر مجموعه چه معاونتیه؟»؛
- خروجی دقیق «فقط نام‌ها» بدون عنوان و توضیح اضافه؛
- پاسخ ترکیبی اعضا، نمایندگی شرکت و سابقه با عدم قطعیت صریح؛
- ابزار SQL مورد انتظار، Trace زمینه، Reflection و Answer Validation؛
- تطبیق نام‌ها، سمت‌ها و عرضه اولیه با Claimهای Evidence همان پاسخ؛ بنابراین به‌روزرسانی درست SQL به‌عنوان Regression کاذب گزارش نمی‌شود؛
- منع پاسخ نامرتبط، HTML/JSON transport error و تاریخ نمایشی میلادی؛
- پاسخ شمسی ساعت سیستم و توقف نمایش عدد بازار هنگام stale بودن منبع.
- سقف ۵ ثانیه برای P95 مجموعه و سقف ۶.۵ ثانیه برای هر نوبت.

پیش‌بررسی و اجرای زنده:

```powershell
python scripts/evaluate-conversation-golden.py --validate-only
python scripts/evaluate-conversation-golden.py --base-url http://localhost:8280
```

این suite با نرخ قبولی اجباری ۱۰۰٪ در هر دو `production-e2e` لینوکس و ویندوز اجرا می‌شود. گزارش دارای نسخه محصول، SHA-256 مجموعه، زمان، latency هر نوبت و علت دقیق هر شکست است و `finalize-production-acceptance.py` بدون گزارش تازه و منطبق، انتشار را متوقف می‌کند.

Gate ساختاری `validate-semantic-foundation.py` به Release Gate لینوکس و ویندوز اضافه شده است.

## Persistent Chat Trace

برای هر درخواست موفق `/api/chat/ask`، Metadata زیر در `AuditEvents.MetadataJson` ذخیره می‌شود:

- SHA-256 سؤال، بدون ذخیره متن خام سؤال در Audit؛
- Conversation ID؛
- نوع خروجی، Intent و Confidence؛
- موجودیت اصلی حل‌شده؛
- نوع و تاریخ شمسی Temporal Context؛
- تعداد Evidence و Citation؛
- وضعیت Answer Validation؛
- ترتیب ابزارها، Status، Duration و Detail هر مرحله؛
- زمان کل HTTP و Correlation ID.

متن خام سؤال و پاسخ در Audit ذخیره نمی‌شود تا Trace عملیاتی به مخزن ثانویه اطلاعات شخصی تبدیل نشود. Correlation ID امکان اتصال رخداد API به Log سرویس‌ها را فراهم می‌کند.

## شرط اتمام Sprint

- `CanonicalSourceCatalog.Validate()` بدون خطا؛
- Build بدون Warning؛
- DataQuality smoke test شامل قواعد کاتالوگ پاس شود؛
- پیش‌بررسی 404 Case پاس شود؛
- چهار Regression مربوط به «آخرین عرضه اولیه» روی Runtime پاس شوند؛
- تمام نوبت‌های Conversation Golden Suite روی Runtime پاس شوند؛
- Audit یک درخواست واقعی شامل Trace مرحله‌ای و Question Hash باشد.

موفقیت این Sprint به معنی دقیق‌شدن همه پاسخ‌ها نیست؛ معنی آن این است که از این پس هر خطا قابل بازتولید، قابل طبقه‌بندی و قابل اصلاح در لایه درست است. Sprint بعدی باید Entity Resolver و ابزارهای Typed SQL را بر اساس همین کاتالوگ ارتقا دهد.
