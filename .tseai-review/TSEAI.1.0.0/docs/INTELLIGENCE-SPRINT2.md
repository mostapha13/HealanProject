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
