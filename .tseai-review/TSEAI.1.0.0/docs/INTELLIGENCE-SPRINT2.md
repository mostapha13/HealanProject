# TSEAI Intelligence Sprint 2 — typed SQL tools and entity safety

## نتیجه

Sprint 2 مسیر پاسخ ساختاریافته را از یک Trace عمومی به عملیات SQL تایپ‌شده و قابل ممیزی ارتقا می‌دهد و اجازه نمی‌دهد Hint آزاد مدل مستقیماً یک مفهوم عمومی را به نماد تبدیل کند.

## ابزارهای SQL تایپ‌شده

هر پاسخ مرجع SQL علاوه بر `structured.reference` یکی از ابزارهای محدود زیر را در Trace ثبت می‌کند:

- `sql.company.ipo` و `sql.company.lookup`؛
- `sql.company.state`؛
- `sql.organization.people`؛
- `sql.content.lookup` و `sql.content.latest_news`؛
- `sql.market.instrument`، `sql.market.clienttype` و `sql.market.reference`؛
- `sql.financial_institution.lookup` و `sql.region_hall.lookup`؛
- `sql.clock.current`.

نام جدول یا SQL از مدل پذیرفته نمی‌شود. مدل فقط می‌تواند در محدوده Capabilityهای از پیش تعریف‌شده عمل کند و Queryهای پارامتری در کد برنامه مالکیت می‌شوند. ابزار انتخاب‌شده همراه با نوع مرجع، موضوع و تعداد Factها در Audit ماندگار است.

## Entity Hint Guard

خروجی Planner مرجع Entity نیست. اگر Planner واژه‌ای مفهومی مانند «اولیه» در سؤال «عرضه اولیه بورس» را به‌عنوان نماد برگرداند، Hint رد و سؤال به مسیر Knowledge امن هدایت می‌شود. نمادهای صریح مانند «نماد بورس» و درخواست‌های دارای Metric بازار همچنان به Entity Resolver معتبر می‌رسند.

## پایداری Market Runtime

- Timeout یا Reader ناقص، اتصال فیزیکی معیوب را از Pool حذف می‌کند؛
- شکست Refresh جدول Instrument دیگر Poll قیمت و اردربوک را متوقف نمی‌کند؛
- Refresh ناموفق با فاصله مستقل Retry می‌شود؛
- Timeout فرمان و فاصله Retry از Docker Compose قابل تنظیم هستند.

آخرین داده فعلی SQL منبع برای `Cashmarket` تاریخ ۱۴۰۵/۰۵/۲۰ است. به همین علت درخواست «قیمت جاری» در تاریخ اجرای این Sprint باید توسط Freshness Gate متوقف شود؛ این رفتار با خرابی ingestion متفاوت است و نباید با افزایش مصنوعی آستانه پنهان شود.

## شواهد اجرای زنده

- Build API و Market Runtime: صفر Warning و صفر Error؛
- Smokeهای Capability Router، Entity Resolver و Evidence/Citation: پاس؛
- چهار Regression عرضه اولیه: ۴ از ۴ پاس با Trace الزامی `sql.company.ipo`؛
- نمونه بین‌جدولی غیرلحظه‌ای: ۷ از ۷ پاس؛
- تست Failure ایزوله: Query ابزار Instrument عمداً خراب شد، خطا مشاهده شد، `Market polling failed` رخ نداد و ۵۶۷ Snapshot در Redis آزمایشی نوشته شد؛
- API در پایان `healthy` و Market Runtime در وضعیت `running` بدون خطای Poll است.

## تکمیل Sprint 2 — مسیر Evidence قطعی و کاهش تأخیر

برای سؤال‌های سازمانی دارای facet محدود `member_history`، `person_history` یا `representing_company`، وجود پاسخ SQL ناقص اما معتبر اکنون مستقیماً مسیر Knowledge قطعی را فعال می‌کند. Planner مدل دیگر برای تشخیص مسیری که از قبل توسط SQL مشخص شده فراخوانی نمی‌شود.

- پاسخ نهایی از roster جاری SQL و excerptهای تاریخ‌دار و فیلترشده ساخته می‌شود؛
- `answer.compose.canonical` جای Synthesis مولد را در این مسیر می‌گیرد؛
- Reflection قطعی پس از Compose، پوشش همه اشخاص و نبود ادعای نمایندگی بدون سند را بررسی می‌کند؛
- Answer Validation همچنان آخرین گیت است؛
- facet ناشناخته اجازه bypass کردن Planner را ندارد.

Multi-query Retrieval با حداکثر هشت Query به `/knowledge/retrieve-batch` منتقل شد. Embedding تمام Queryها در یک batch محلی انجام می‌شود و Queryهای Qdrant مانند قبل به‌شکل موازی و محدود اجرا می‌شوند. Cache به‌ازای هر Query مستقل باقی مانده و برای retrieval تاریخی ۶۰ ثانیه اعتبار دارد.

برای جلوگیری از رقابت ingestion با چت روی مدل embedding محلی، صف embedding اولویت‌دار شد: درخواست‌های retrieval کاربر قبل از batch بعدی indexing پذیرفته می‌شوند. ظرفیت هم‌زمانی با `EMBEDDING_MAX_CONCURRENCY` و اندازه batch ایندکس با `EMBEDDING_INDEX_BATCH_SIZE` محدود می‌شود؛ در Preview تک‌ظرفیتی اندازه batch برابر ۴ و در Production دوظرفیتی برابر ۸ است. ایندکس متوقف نمی‌شود و فقط در مرز امن batch به سؤال کاربر اولویت می‌دهد.

پاک‌سازی Entity نیز qualifierهای زمانی مانند «تاریخی» را پیش از SQL lookup حذف می‌کند. در نتیجه پرسش «آخرین قیمت نماد فملی مربوط به چه تاریخی است؟» دیگر `فملی تاریخی` را به fuzzy full-catalog lookup نمی‌فرستد و همان نماد `فملی` با مسیر exact حل می‌شود.

Conversation Golden Suite نسخه ۱.۱ علاوه بر ۱۷ نوبت، نبود Planner/Synthesis غیرضروری، اجرای Reflection قطعی و P95 حداکثر پنج ثانیه را به‌عنوان Release Gate کنترل می‌کند.

اجرای زنده نهایی روی Docker Compose محلی: ۱۷ از ۱۷ نوبت پاس، نرخ موفقیت ۱۰۰٪، میانه ۷۳٫۴۹ میلی‌ثانیه و P95 برابر ۱۶۸۵٫۱۱ میلی‌ثانیه. سؤال تاریخ قیمت stale پس از اصلاح Entity در ۱۲۴٫۹۲ میلی‌ثانیه پاسخ داده شد. گزارش ممیزی در `artifacts/conversation-evaluation-live.json` ثبت شده است.
