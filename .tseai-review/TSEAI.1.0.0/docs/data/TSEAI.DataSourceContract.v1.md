# TSEAI — Canonical Data Source Contract v1

## هدف
این سند مرجع ثابت داده‌های ورودی TSEAI برای ساخت یک Chatbot بسیار دقیق بازار سرمایه است.

## اصول قطعی
- Sourceها باید تا حد ممکن **Fact/عدد/شناسه/تاریخ** بدهند؛ جمله‌بندی پاسخ بر عهده TSEAI است.
- `CreatedDate` در Feedهای فعلی **زمان جمع‌آوری** است، نه لزوماً تاریخ وقوع واقعیت.
- TSEAI برای Sourceهای Snapshot/Replace تاریخچه مستقل نگه می‌دارد.
- Structured facts از SQL/Redis Tool خوانده می‌شوند؛ متن‌های بلند با RAG/Qdrant؛ سؤال ترکیبی با Hybrid Plan.
- اگر عدد Canonical موجود باشد، LLM حق استخراج مجدد عدد از متن یا محاسبه حدسی ندارد.
- تمام مبالغ در لایه Canonical TSEAI به **ریال (IRR)** نرمال می‌شوند و فقط در Presentation به تومان/هزار/میلیون/میلیارد/همت تبدیل می‌شوند.
- HTML و Tagهای CMS/FAQ در Raw نگه داشته می‌شوند و همزمان PlainText پاک‌سازی‌شده برای Search/RAG تولید می‌شود.

## قابلیت‌های Source که قطعی شد
1. `CreatedDate` فعلی = زمان جمع‌آوری.
2. CashMarket قابل اصلاح است و Source می‌تواند فقط اعداد/فیلدهای واقعی بدهد؛ **TSEAI خودش جمله می‌سازد**.
3. لیست نمادهای تعلیق‌شده و علت‌ها قابل دریافت جداگانه است.
4. مدیرعامل، هیئت‌مدیره، معاونین و مدیران به‌صورت Structured قابل دریافت‌اند؛ History در TSEAI نگه داشته می‌شود.
5. `SiteDB-View-InstrumentAlllive` به‌عنوان یکی از Sourceهای اصلی Instrument/Reference قابل استفاده است.
6. FAQ به‌صورت Question + Answer قابل دریافت است؛ Answer ممکن است HTML/Tag داشته باشد.
7. Download Center می‌تواند Direct Download URL بدهد.
8. داده نهادهای مالی قابل Structured شدن است.
9. RegionHall به‌صورت Structured قابل دریافت است؛ جمله‌سازی در TSEAI.
10. TsePerson وضعیت فعلی را می‌دهد؛ تغییر/حذف به‌صورت Temporal History در TSEAI نگه داشته می‌شود.
11. Static Facts بهتر است در خود Chatbot با Form Builder/Admin Form تعریف شوند.
12. Financial Statement قابل Structured شدن است؛ جمله‌سازی در TSEAI.
13. تبدیل واحد مبالغ به IRR در TSEAI انجام می‌شود.
14. هر جا Raw numeric data وجود داشته باشد، TSEAI به‌جای Parse متن از همان Raw data استفاده می‌کند.
15. Symbol/Instrument feed Structured در دسترس است.
16. Canonical Instrument Master را خود TSEAI می‌سازد؛ Source جدید جداگانه لازم نیست.
17. فیلدهای تکمیلی بعداً per-resource بررسی می‌شوند.
18. Sourceهای فعلی به سیستم‌های دیگر سرویس می‌دهند و ممکن است Schema آنها قابل تغییر نباشد؛ Job روزانه/دوره‌ای می‌تواند داده را به SQL Server خود TSEAI منتقل کند.

## Content Types CMS
- `1` — اخبار و اطلاعیه
- `2` — محتوا
- `3` — بنر
- `4` — ویدیو
- `5` — دانلود سنتر
- `6` — پذیرش های بازار نقد
- `7` — پذیرش های بازار آتی
- `8` — پذیرش های بازار بدهی
- `9` — خلاصه معیارهای طبقه بندی
- `10` — آخرین وضعیت شرکت ها
- `11` — طبقه بندی
- `12` — شرکت های لغو پذیرش شده
- `13` — پارامترهای بازارگردانی
- `14` — نمادهای دارای بازارگردان
- `15` — آخرین وضعیت شرکت های پذیرش شده
- `16` — ناشران پذیرفته شده
- `17` — اوراق بدهی
- `18` — صندوق سرمایه گذاری
- `19` — ابزارهای نوین-آتی
- `20` — ابزارهای نوین-اختیار
- `21` — ابزارهای نوین-تبعی
- `22` — تصاویر چندرسانه ای
- `23` — بولتن خبری چندرسانه ای
- `24` — برند بوک چندرسانه ای
- `25` — پنل مدیران
- `26` — تغییر وضعیت شرکت

## Canonical Tables

### Instrument
Source: `SiteDB-View-InstrumentAlllive` + Symbol Feed.

کلیدها و شناسه‌های اصلی:
`InstrumentId`, `InsCode`, `CIsin`, `IssuingCompanyCode`.

فیلدهای مرجع مهم:
نام نماد و شرکت، Market/Board/Industry/SubIndustry، نوع ابزار، وضعیت، DueDate، SharesCount، BaseVol، EPS، PE، FreeFloat، قیمت‌های مرجع و Low/Highهای هفتگی/ماهانه/سالانه.

### CashMarket
Source فقط عدد و Fact بدهد. حداقل:
`InstrumentId`, `InsCode`, `MarketDate`, `AsOfDateTime`, `TradeVolume`, `TradeValueIRR`,
`TradeCount`, `YesterdayPriceIRR`, `FirstPriceIRR`, `MinPriceIRR`, `MaxPriceIRR`,
`LastPriceIRR`, `ClosingPriceIRR`, تغییرات قیمت و درصد، `MarketCapIRR`, `EPS`, `PE`,
Best Bid/Ask Price/Volume.

اگر ممکن باشد: حقیقی/حقوقی و OrderBook 1..5 نیز اضافه شود.

نمونه Sentence Template در Answer Layer:
> نماد {Symbol} تا ساعت {AsOfTime} با حجم {TradeVolumeDisplay} سهم و ارزش معاملات {TradeValueDisplay} معامله شده است. آخرین قیمت {LastPriceDisplay} و قیمت پایانی {ClosingPriceDisplay} است. بازه روز بین {MinPriceDisplay} تا {MaxPriceDisplay} بوده و آخرین قیمت نسبت به روز قبل {LastPriceChangePercent}% تغییر کرده است.

### CompanyState
Header:
`InstrumentId`, `InsCode`, `StateCode`, `StateTitle`, `EffectiveDate`.

Child:
`CompanyStateReason(CompanyStateId, ReasonCode, ReasonTitle)`.

### Content / CMS
Raw HTML حفظ شود.
TSEAI تولید کند:
`BodyPlainText`, `ContentHash`, `DetectedSymbols`, `DetectedCompanies`, `DetectedPersons`, `Tags`, `RagChunks`.

Routing اولیه:
- RAG-first: اخبار/اطلاعیه، محتوای متنی، ویدیو/چندرسانه‌ای دارای متن، بولتن، Brand Book.
- Structured/Hybrid: Download Center، پذیرش‌ها، وضعیت شرکت‌ها، طبقه‌بندی، بازارگردانی، ناشران، اوراق بدهی، صندوق‌ها، ابزارهای نوین، پنل مدیران، تغییر وضعیت شرکت.
- Banner به‌صورت پیش‌فرض وارد QA/RAG نشود.

### FAQ
`QuestionId`, `QuestionText`, `AnswerRaw`, `AnswerPlainText`, `Category`, `SourceCollectedAt`, `ContentHash`.

### DownloadCenter
`ContentId`, `ReportType`, `ReportDate`, `Title`, `Description`, `PageUrl`, `DirectFileUrl`, `PublishedAt`.

### RegionHall
فیلدهای فعلی Structured خوب هستند؛ فقط حتماً اضافه شود:
`ProvinceId`, `ProvinceName`, `ReferenceYearOrDate`, `HasOffice`.

Sentence Template:
> تالار/دفتر منطقه‌ای {ProvinceName} {OfficeStatus}. مدیر/سرپرست: {Manager}. شماره تماس {Tel}. آدرس: {Address}. نرخ بیکاری {UnemploymentRate}%، رشد اقتصادی {EconomicRate}% و نرخ تورم {InflationRate}% است؛ این شاخص‌ها مربوط به {ReferenceDate} هستند.

### TsePerson
Source:
`ContentId`, `TsePersonCategoryId`, `Fullname`, `Role`, `PhoneNumber`, `Fax`, `Email`, `Row`, `IsMaster`, `IsManager`.

TSEAI اضافه می‌کند:
`NormalizedRoleCode`, `ValidFrom`, `ValidTo`, `IsCurrent`, `SourceHash`.

### StaticFact
داخل Admin/FormBuilder TSEAI:
`FactCode`, `FactTitle`, `Value`, `ValueType`, `SourceUrl`, `ValidFrom`, `ValidTo`, `IsCurrent`.

### FinancialStatement
Header:
`TracingNo`, Instrument identifiers, Symbol/Company, MarketType, AuditStatus, PeriodMonths,
`PeriodEndDate`, `FiscalYear`, `PublishedAt`, `StatementType`.

Metrics:
`MetricCode`, `MetricTitle`, `CurrentValueIRR`, `PreviousValueIRR`, `ChangeValueIRR`, `ChangePercent`.

NarrativeSummary را TSEAI تولید می‌کند؛ متن تولیدشده Source of Truth نیست.

## Sync / History
Modeهای قابل استفاده:
`SnapshotReplace`, `Upsert`, `AppendOnly`, `Versioned`, `Temporal`.

برای هر Batch:
`BatchId`, `ResourceCode`, زمان شروع/پایان، تعداد Source، Insert/Update/Close/Duplicate/Reject، Status و SourceCollectedAt.

## معماری پاسخ
`Question -> Persian Normalize -> Entity/Symbol Resolver -> Intent -> Temporal Resolver -> Capability Planner -> Structured/RAG/Hybrid -> Evidence Validation -> Freshness Validation -> Calculation -> Persian Answer Composer`

LLM حق اجرای arbitrary SQL/URL/tool یا اختراع عدد ندارد.
