# Sprint 2 — Market Runtime correctness and freshness

## نتیجه اجرایی

مسیر `SQL AI -> MarketRuntime -> Redis -> Chat/Filter` اکنون برای Feedهای جاری دو حالت مستقل دارد:

1. Poll افزایشی سریع با Watermark منبع؛
2. آشتی کامل دوره‌ای برای حذف نمادها، OrderBookها و Levelهایی که دیگر در Snapshot منبع وجود ندارند.

Watermark زمان ingestion نیست و همیشه از `SourceCollectedAt` منبع گرفته می‌شود. تازه‌سازی Redis هیچ‌وقت زمان قدیمی SQL را به زمان جاری تبدیل نمی‌کند.

## وضعیت پایدار در Redis

Hash زیر وضعیت هر Feed را مستقل نگه می‌دارد:

```text
tseai:market:sync-state:v1
```

Fieldها:

- `cashmarket`
- `clienttype`
- `orderbookcurrent`

هر مقدار شامل Watermark، آخرین زمان مشاهده‌شده منبع، زمان آخرین تلاش و موفقیت، تعداد ردیف آخر، تعداد ردیف آخرین Full Reconciliation و خطای آخر است. این State بعد از Restart باقی می‌ماند و برای Health Check و ممیزی قابل استفاده است.

## قواعد ایمنی

- Full Reconciliation ناقص یا خالی، قبل از حذف Snapshotهای معتبر رد می‌شود.
- حداقل تعداد رکورد و حداقل نسبت پوشش نسبت به Full قبلی قابل تنظیم است.
- `OrderBookCurrent` در Full Reconciliation ابتدا به پنج Level خالی بازنشانی و سپس از Snapshot کامل منبع بازسازی می‌شود؛ بنابراین Level حذف‌شده در Redis باقی نمی‌ماند.
- Snapshotهای حذف‌شده‌ی Cashmarket از Active Universe و Redis حذف می‌شوند.
- Poll کاملِ بدون تغییر، Snapshot را دوباره نمی‌نویسد و Event تکراری منتشر نمی‌کند.
- شکست Refresh جدول Instrument مانع Poll قیمت و OrderBook نمی‌شود.
- Timeout/Reader خراب از Connection Pool خارج می‌شود.
- پاسخ Chat برای Snapshot قدیمی Fail Closed است؛ عدد قدیمی و Payload بازار به مصرف‌کننده برگردانده نمی‌شود و تاریخ آخرین داده فقط به شمسی نمایش داده می‌شود.

## تنظیمات Docker Compose

```text
MARKET_FULL_RECONCILIATION_SECONDS=60
MARKET_MINIMUM_CURRENT_SNAPSHOT_ROWS=1
MARKET_MINIMUM_ORDERBOOK_SNAPSHOT_ROWS=1
MARKET_MINIMUM_RECONCILIATION_COVERAGE_PERCENT=50
MARKET_COMMAND_TIMEOUT_SECONDS=30
```

مقادیر حداقل برای محیط عملیاتی واقعی باید پس از مشاهده‌ی حجم عادی هر بازار سخت‌گیرانه‌تر شوند؛ نسبت پوشش ۵۰٪ از پاک‌سازی مخرب ناشی از Snapshot ناقص جلوگیری می‌کند.

## شواهد اجرای محلی در ۱۴۰۵/۰۶/۰۵

- `Cashmarket`: تعداد ۵۶۷ رکورد؛ آخرین منبع `۱۴۰۵/۰۵/۲۰ ۱۱:۲۹:۲۲`؛
- `OrderBookCurrent`: تعداد ۲٬۸۱۵ رکورد؛ آخرین منبع `۱۴۰۵/۰۵/۲۰ ۱۲:۱۸:۵۹`؛
- `ClientType`: تعداد ۱٬۸۸۰ رکورد؛ آخرین دریافت SQL `۱۴۰۵/۰۵/۲۰ ۱۳:۲۸:۰۵`؛
- Full و Incremental Poll بدون خطا اجرا شد؛ Poll بدون تغییر، صفر Event منتشر کرد؛
- Health Check کانتینر MarketRuntime در وضعیت `healthy` است؛
- تست ۵۰ درخواست با ۲۰ کاربر هم‌زمان: صفر خطا، P95 برابر ۱٬۷۶۹٫۳۲ میلی‌ثانیه؛
- Smoke Testهای Reconciliation و Data Quality پاس شدند.

## مانع بالادست داده زنده

سند Migration، منابع `SITEDB1.dbo.Cashmarket2` و `OrderBookDB.dbo.OrderBook` را معرفی می‌کند؛ اما این دو دیتابیس روی SQL Server محلی موجود نیستند. روی همان Instance هیچ SQL Agent Job انتقال داده‌ای نیز نصب نشده است و Windows Task مرتبطی پیدا نشد. بنابراین قدیمی‌بودن داده ناشی از Chat، Redis یا Watermark نیست؛ Landing Database محلی ورودی تازه دریافت نمی‌کند.

برای فعال‌شدن پاسخ بازار جاری باید یکی از این دو مسیر فراهم شود:

1. دسترسی Read-only شبکه‌ای به Source DBهای واقعی و نصب Job اتمیک `stage -> validate -> replace`؛ یا
2. Job موجود سازمان که جدول‌های `AI.dbo.Cashmarket` و `AI.dbo.OrderBookCurrent` را به‌روز می‌کند، روی این سیستم/محیط اجرا و مانیتور شود.

تا آن زمان افزایش مصنوعی Freshness Threshold ممنوع است؛ سامانه باید عدد قدیمی را رد کند.
