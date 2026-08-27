# MarketRuntime operational observability

## هدف

سلامت اجرای Worker و تازگی داده‌ی بازار دو مفهوم مستقل‌اند. ممکن است Worker بدون خطا SQL را Poll کند، اما Source بالادست رکورد تازه‌ای تولید نکند. Control Plane این دو وضعیت را جدا گزارش می‌کند تا سلامت کانتینر با سلامت داده اشتباه نشود.

## API محافظت‌شده

```http
GET /api/admin/data-quality/market-runtime
Authorization: Bearer <token with Operations.Read>
```

پاسخ شامل وضعیت کلی و وضعیت مستقل سه Feed زیر است:

- `cashmarket`
- `orderbookcurrent`
- `clienttype`

برای هر Feed، `WorkerHealthy`، `SourceFresh`، `Watermark`، زمان آخرین تلاش/موفقیت/شکست، تعداد رکورد Poll آخر، تعداد رکورد آخرین Full Reconciliation، سن Source، آستانه‌ی مجاز و Issueهای قابل ممیزی گزارش می‌شود.

Endpoint زیر نیز نتیجه‌ی تجمیع‌شده را در Control Plane نمایش می‌دهد:

```http
GET /api/admin/operations/health
Authorization: Bearer <token with Operations.Read>
```

## نمایش در پنل وب

بخش «تازگی داده بازار» در «مرکز مدیریت AI» همین قرارداد را مصرف می‌کند. وضعیت کلی و کارت مستقل هر Feed شامل سلامت Worker، تازگی Source، امکان ارائه، تعداد رکورد Full، آخرین زمان Source، Watermark، آخرین Sync موفق و سن Source است. تمام زمان‌ها با timezone صریح از API ارسال و در UI به تقویم شمسی و منطقه زمانی تهران نمایش داده می‌شوند.

دکمه‌ی بروزرسانی، داده‌های Operations، Runtime و Semantic Registry را دوباره می‌خواند. خطای قدیمی پنل که پاسخ Semantic Registry را دریافت ولی ذخیره نمی‌کرد نیز اصلاح شده است.

## قواعد وضعیت

- State مفقود یا JSON خراب: Worker ناسالم و وضعیت `Invalid`؛
- آخرین Sync ناموفق، نداشتن موفقیت قبلی یا Full Snapshot خالی: Worker ناسالم؛
- توقف Poll بیش از دو دقیقه در ساعات زنده‌ی بازار: Worker ناسالم؛
- Worker سالم و Source قدیمی‌تر از سیاست Freshness: وضعیت `Stale` و Feed غیرقابل ارائه؛
- فقط Feed دارای `WorkerHealthy=true` و `SourceFresh=true` برای پاسخ بازار قابل ارائه است.

آستانه‌ی Freshness از همان تنظیمات Data Quality خوانده می‌شود: در بازار زنده برحسب ثانیه، در ساعات غیرزنده برحسب ساعت و در تعطیلات پایان هفته با آستانه‌ی جداگانه.

## دسترسی و ممیزی

مجوز `Operations.Read` در Identity ثبت می‌شود و به نقش‌های `Admin` و `SuperAdmin` تخصیص دارد. درخواست بدون توکن یا بدون این Claim مجاز نیست. API مقدار Secret، Connection String یا Payload خام Redis را برنمی‌گرداند.

## نتیجه‌ی تست محلی در ۱۴۰۵/۰۶/۰۵

- هر دو کانتینر `identity-api` و `tseai-api` سالم‌اند؛
- درخواست ناشناس به گزارش MarketRuntime با `401` رد شد؛
- مجوز `Operations.Read` برای هر دو نقش ممتاز در SQL تأیید شد؛
- Worker هر سه Feed سالم و آخرین Full Reconciliation موفق است؛
- Source هر سه Feed مربوط به `۱۴۰۵/۰۵/۲۰` و حدود ۱۶ روز قدیمی است؛
- هر سه پرچم ارائه‌ی داده `false` و وضعیت Operations برای MarketRuntime برابر `Degraded` است؛
- ۱۴ تست Smoke پلتفرم بدون شکست پاس شد.

این نتیجه نشان می‌دهد Fail Closed فعال است: سامانه از سالم‌بودن Worker نتیجه نمی‌گیرد که عدد بازار نیز تازه است.
