# TSEAI — SQL AI Data Migration Queries

این سند مرجع کوئری‌های انتقال داده از دیتابیس‌های Source به دیتابیس `[AI]` برای پروژه TSEAI است.
با نهایی‌شدن هر جدول، Query همان جدول به این سند اضافه می‌شود.

---

## 01 — Instrument

**وضعیت:** تایید شده  
**جدول مقصد:** `[AI].[dbo].[Instrument]`  
**حجم مشاهده‌شده:** حدود `82,264` رکورد  
**نوع انتقال اولیه:** Full Snapshot / `SELECT INTO`  
**ستون اضافه‌شده توسط Job:** `SourceCollectedAt`

```sql
-- Instrument
SELECT
    s.*,
    GETDATE() AS SourceCollectedAt
INTO [AI].[dbo].[Instrument]
FROM [SITEDB1].[dbo].[Instrument] AS s;
```

### نکته
- این Query برای **ایجاد اولیه جدول** است و فقط زمانی اجرا می‌شود که `[AI].[dbo].[Instrument]` از قبل وجود نداشته باشد.
- روش Sync دوره‌ای این جدول بعداً جداگانه نهایی می‌شود تا لازم نباشد برای هر اجرا جدول مجدداً ساخته شود.


### تصمیم کلید Instrument
- `InstrumentID` در Source یکتا است.
- `CashMarketCurrent.InstrumentID` دقیقاً معادل `Instrument.InstrumentID` است.
- بنابراین برای ارتباط `CashMarketCurrent` با `Instrument`، `InstrumentID` کلید مرجع اصلی خواهد بود و افزودن `InsCode` به `CashMarketCurrent` الزامی نیست.

---

## جدول‌های بعدی

با نهایی‌شدن هر جدول، Query آن در ادامه همین سند افزوده می‌شود.

---

## 02 — CashMarket

**وضعیت:** تایید شده  
**جدول مقصد:** `[AI].[dbo].[Cashmarket]`  
**جدول مبدا:** `[SITEDB1].[dbo].[Cashmarket2]`  
**نوع انتقال اولیه:** Full Snapshot / `SELECT INTO`  
**کلید ارتباط با Instrument:** `InstrumentID`  
**ستون اضافه‌شده توسط Job:** `SourceCollectedAt`

```sql
-- Cashmarket
SELECT
    csh.*,
    GETDATE() AS SourceCollectedAt
INTO [AI].[dbo].[Cashmarket]
FROM [SITEDB1].[dbo].[Cashmarket2] AS csh;
```

### نکات
- `Cashmarket.InstrumentID` معادل `Instrument.InstrumentID` است و برای Join اصلی استفاده می‌شود.
- این Query برای ایجاد اولیه جدول است؛ Sync دوره‌ای/لحظه‌ای بعداً جداگانه نهایی می‌شود.
- جمله‌سازی، تبدیل واحدها، تاریخچه و پردازش Canonical بر عهده TSEAI است.

---

---

---

## 03 — OrderBookCurrent

**وضعیت:** تایید شده  
**جدول مقصد:** `[AI].[dbo].[OrderBookCurrent]`  
**حجم مشاهده‌شده:** `2,815` رکورد  
**منابع:** `[AI].[dbo].[Cashmarket]`, `[AI].[dbo].[Instrument]`, `[OrderBookDB].[dbo].[OrderBook]`  
**نوع انتقال اولیه:** Current Snapshot / `SELECT INTO`  
**کلید ارتباط:** `InstrumentID` بین CashMarket و Instrument، و `InsCode` بین Instrument و OrderBook  
**کلید منطقی مقصد:** `(InstrumentID, Level)`

```sql
-- Order Book
WITH cte_01 AS
(
    SELECT
        i.InstrumentID,
        i.InsCode,
        ob.[number] AS [Level],

        ob.PMeDem   AS BuyPrice,
        ob.QTitMeDem AS BuyQuantity,
        ob.ZOrdMeDem AS BuyCount,

        ob.PMeOf    AS SellPrice,
        ob.QTitMeOf AS SellQuantity,
        ob.ZOrdMeOf AS SellCount,

        ob.bestlimit_counter AS BestLimitCounter,
        ob.CreationTime      AS OrderBookUpdatedAt,

        GETDATE() AS SourceCollectedAt

    FROM [AI].[dbo].[Cashmarket] AS c

    INNER JOIN [AI].[dbo].[Instrument] AS i
        ON i.InstrumentID = c.InstrumentID

    CROSS APPLY
    (
        SELECT TOP (1)
            x.bestlimit_counter
        FROM [OrderBookDB].[dbo].[OrderBook] AS x
        WHERE x.InsCode = i.InsCode
        ORDER BY
            x.bestlimit_counter DESC,
            x.CreationTime DESC,
            x.Id DESC
    ) AS latest

    INNER JOIN [OrderBookDB].[dbo].[OrderBook] AS ob
        ON ob.InsCode = i.InsCode
       AND ob.bestlimit_counter = latest.bestlimit_counter
       AND ob.[number] BETWEEN 1 AND 5
)

SELECT *
INTO [AI].[dbo].[OrderBookCurrent]
FROM cte_01;
```

### Mapping
- `number` → `Level`
- `PMeDem` → `BuyPrice`
- `QTitMeDem` → `BuyQuantity`
- `ZOrdMeDem` → `BuyCount`
- `PMeOf` → `SellPrice`
- `QTitMeOf` → `SellQuantity`
- `ZOrdMeOf` → `SellCount`

### نکات
- این Query برای ایجاد اولیه جدول مقصد است.
- فقط Instrumentهای موجود در `AI.dbo.Cashmarket` وارد می‌شوند.
- برای هر `InsCode` آخرین `bestlimit_counter` انتخاب می‌شود.
- فقط Levelهای 1 تا 5 وارد می‌شوند.
- برای Jobهای بعدی، جدول Current بهتر است با `TRUNCATE + INSERT` Refresh شود.

---

## 04 — ClientType

**وضعیت:** تایید شده  
**جدول مقصد:** `[AI].[dbo].[ClientType]`  
**جدول مبدا:** `[SITEDB1].[dbo].[ClientType]`  
**حجم مشاهده‌شده:** `1,880` رکورد  
**نوع انتقال اولیه:** Full Snapshot / `SELECT INTO`  
**کلید اتصال به Instrument:** `InsCode`  
**ستون اضافه‌شده توسط Job:** `SourceCollectedAt`

```sql
-- ClientType
SELECT
    ct.*,
    GETDATE() AS SourceCollectedAt
INTO [AI].[dbo].[ClientType]
FROM [SITEDB1].[dbo].[ClientType] AS ct;
```

### نکات
- نام ستون‌های Source بدون تغییر در Landing DB نگه داشته می‌شوند.
- `InsCode` برای اتصال به `Instrument.InsCode` استفاده می‌شود.
- تفسیر `I = Individual/حقیقی` و `N = Legal/حقوقی` در لایه Canonical TSEAI انجام می‌شود.
- محاسباتی مثل خالص حجم حقیقی، سرانه خرید/فروش و قدرت خریدار در Source ذخیره نمی‌شوند و توسط TSEAI محاسبه خواهند شد.

---

## 05 — MarketSummary

**وضعیت:** تایید شده  
**جدول مقصد:** `[AI].[dbo].[Marketsummary]`  
**جدول مبدا:** `[SITEDB1].[dbo].[Marketsummary]`  
**حجم مشاهده‌شده:** `8` رکورد  
**نوع انتقال اولیه:** Full Snapshot / `SELECT INTO`  
**کلید منطقی Current:** `(Marketid, Marketcategory)`  
**ستون اضافه‌شده توسط Job:** `SourceCollectedAt`

```sql
-- Marketsummary
SELECT
    ms.*,
    GETDATE() AS SourceCollectedAt
INTO [AI].[dbo].[Marketsummary]
FROM [SITEDB1].[dbo].[Marketsummary] AS ms;
```

### نکات
- داده شامل `Marketvalue`, `Tradecount`, `Tradevolume`, `Tradevalue` به تفکیک `Marketcategory` و `Marketid` است.
- `marketcategory = total` به‌عنوان Fact منبع نگه داشته می‌شود و TSEAI آن را بدون Data Dictionary جمع سایر Categoryها فرض نمی‌کند.
- برای Jobهای دوره‌ای، این جدول Current می‌تواند با `TRUNCATE + INSERT` Refresh شود.

---

---

---

## 06 — IndexLastLive

**وضعیت:** تایید شده  
**جدول مقصد:** `[AI].[dbo].[IndexLastLive]`  
**جدول مبدا:** `[SITEDB1].[dbo].[IndexLastLive]`  
**حجم مشاهده‌شده:** `71` رکورد  
**نوع انتقال اولیه:** Full Current Snapshot / `SELECT INTO`  
**ستون اضافه‌شده توسط Job:** `SourceCollectedAt`

```sql
-- IndexLastLive
SELECT
    il.*,
    GETDATE() AS SourceCollectedAt
INTO [AI].[dbo].[IndexLastLive]
FROM [SITEDB1].[dbo].[IndexLastLive] AS il;
```

### نکات
- کل شاخص‌های Current منتقل می‌شوند.
- `Datetime` زمان Snapshot شاخص است و `SourceCollectedAt` زمان انتقال به SQL AI.
- در TSEAI شاخص‌ها Hard-code نمی‌شوند و با Mapping قابل مدیریت شناخته خواهند شد.

---

## 07 — CompanyState

**وضعیت:** تایید شده  
**جدول مقصد:** `[AI].[dbo].[Companystate]`  
**جدول مبدا:** `[SITEDB1].[dbo].[Companystate]`  
**حجم مشاهده‌شده:** `58` رکورد  
**نوع انتقال اولیه:** Full Snapshot / `SELECT INTO`  
**ستون اضافه‌شده توسط Job:** `SourceCollectedAt`

```sql
-- Companystate
SELECT
    cs.*,
    GETDATE() AS SourceCollectedAt
INTO [AI].[dbo].[Companystate]
FROM [SITEDB1].[dbo].[Companystate] AS cs;
```

### نکات
- این جدول وضعیت فعلی شرکت/نمادها را نگه می‌دارد.
- تاریخچه تغییر وضعیت در لایه TSEAI ساخته خواهد شد.
- دلایل وضعیت/تعلیق در جدول مستقل بعدی نگه‌داری می‌شوند.


### تصمیم درباره دلایل وضعیت شرکت
- جدول Source مستقل برای `CompanyStateReason` لازم نیست.
- ستون دلیل موجود در `[AI].[dbo].[Companystate]` به همان شکل Raw/HTML منتقل می‌شود.
- TSEAI در لایه Canonical از همان ستون موارد زیر را تولید می‌کند:
  - `ReasonRawHtml`
  - `ReasonPlainText`
  - `CompanyStateReason` به‌صورت چند رکورد مستقل در صورت وجود چند دلیل
  - `ReasonHash` برای Deduplication
- پاک‌سازی HTML، نرمال‌سازی فارسی، تفکیک چند دلیل و تاریخچه‌سازی بر عهده TSEAI است.
- بنابراین این مورد یک **Derived/Core Table** است و Query انتقال Source جداگانه ندارد.

---

## 08 — ContentType

**وضعیت:** تایید شده  
**جدول مقصد:** `[AI].[dbo].[ContentType]`  
**جدول مبدا:** `[DB_CMS1].[dbo].[ContentType]`  
**حجم مشاهده‌شده:** `26` رکورد  
**نوع انتقال اولیه:** Full Snapshot / `SELECT INTO`  
**ستون اضافه‌شده توسط Job:** `SourceCollectedAt`

```sql
-- ContentType
SELECT
    ct.*,
    GETDATE() AS SourceCollectedAt
INTO [AI].[dbo].[ContentType]
FROM [DB_CMS1].[dbo].[ContentType] AS ct;
```

### نکات
- این جدول Master/Reference است.
- `ContentTypeId` در جدول Content برای تعیین نوع Route (Structured/RAG/Hybrid/Ignore) استفاده خواهد شد.
- برای Sync دوره‌ای، `TRUNCATE + INSERT` مناسب است.

---

## 09 — Content

**وضعیت:** تایید شده  
**جدول مقصد:** `[AI].[dbo].[Content]`  
**جدول مبدا:** `[DB_CMS1].[dbo].[Content]`  
**حجم مشاهده‌شده:** `61,859` رکورد  
**نوع انتقال اولیه:** Full Snapshot / `SELECT INTO`  
**ستون اضافه‌شده توسط Job:** `SourceCollectedAt`

```sql
-- Content
SELECT
    c.*,
    GETDATE() AS SourceCollectedAt
INTO [AI].[dbo].[Content]
FROM [DB_CMS1].[dbo].[Content] AS c;
```

### نکات
- HTML ستون `Body` به‌صورت Raw حفظ می‌شود.
- TSEAI بعداً `BodyPlainText`, `ContentHash`, Entity/Symbol extraction و RAG chunks را تولید می‌کند.
- `ContentTypeId` برای Route کردن Content به Structured/RAG/Hybrid/Ignore استفاده می‌شود.
- برای Sync دوره‌ای، Upsert بر اساس `Id` و وضعیت `IsDeleted/LastModifiedAt` مناسب‌تر از Full Replace خواهد بود.

---

---

## Pending/Ready — FAQ / Questions

**وضعیت:** ساختار Query نهایی شد؛ فقط نام جدول مبدا باید جایگزین شود.  
**جدول مقصد پیشنهادی:** `[AI].[dbo].[FAQ]`

### Query انتقال و تفکیک سؤال/جواب

```sql
-- FAQ / Questions
SELECT
    q.Title AS RawTitle,

    LTRIM(RTRIM(
        CASE
            WHEN br.BreakPos IS NULL THEN q.Title
            ELSE LEFT(q.Title, br.BreakPos - 1)
        END
    )) AS QuestionText,

    LTRIM(RTRIM(
        CASE
            WHEN br.BreakPos IS NULL THEN NULL
            ELSE SUBSTRING(
                q.Title,
                br.BreakPos + LEN(br.Delimiter),
                LEN(q.Title)
            )
        END
    )) AS AnswerRaw,

    q.ResourceCode,
    q.CreatedDate,
    GETDATE() AS SourceCollectedAt

INTO [AI].[dbo].[FAQ]

FROM [SOURCE_DB].[dbo].[SOURCE_QUESTION_TABLE] AS q

OUTER APPLY
(
    SELECT TOP (1)
        v.Delimiter,
        CHARINDEX(v.Delimiter, q.Title) AS BreakPos
    FROM
    (
        VALUES
            (N'<\br>'),
            (N'<br>'),
            (N'<br/>'),
            (N'<br />')
    ) AS v(Delimiter)
    WHERE CHARINDEX(v.Delimiter, q.Title) > 0
    ORDER BY CHARINDEX(v.Delimiter, q.Title)
) AS br;
```

### تصمیم
- `RawTitle` برای Audit/Provenance حفظ می‌شود.
- `QuestionText` سؤال خالص است.
- `AnswerRaw` پاسخ با HTML/Tagهای داخلی است.
- HTML پاسخ در TSEAI پاک‌سازی و به `AnswerPlainText` تبدیل می‌شود.
- اگر جداکننده `<br>` پیدا نشود، کل `Title` به‌عنوان سؤال ذخیره و `AnswerRaw = NULL` می‌شود.
---

## 10 — Download Center / EDelivery

**وضعیت:** در حال نهایی‌سازی  
**Source tables شناخته‌شده:**
- `EDeliveryCategory`
- `EDeliveryObject`

**حجم مشاهده‌شده EDeliveryObject:** `3,753` رکورد

### EDeliveryCategory
فیلدهای مشاهده‌شده:
- `Id`
- `Name`
- `ParentRef`
- `LanguageId`
- `Order`

### EDeliveryObject
نمونه داده دریافت شد، اما Header کامل ستون‌ها هنوز ثبت نشده است؛ بنابراین Mapping معنایی ستون‌ها تا دریافت Header قطعی نمی‌شود.

### نیاز باقی‌مانده
- Header/نام ستون‌های کامل `EDeliveryObject`
- Source جدول/رابطه‌ای که Direct Download URL یا فایل ضمیمه را به `EDeliveryObject.Id` متصل می‌کند
- نام دقیق Database/Schema مبدا برای ثبت Query نهایی انتقال

### تصمیم معماری
- Category و Object هر دو به SQL AI منتقل می‌شوند.
- ساختار سلسله‌مراتبی Category با `ParentRef` حفظ می‌شود.
- TSEAI از Category برای ReportType/Topic resolution استفاده می‌کند.
- در صورت وجود فایل/لینک مستقیم، Relation آن جداگانه حفظ می‌شود و فایل‌ها می‌توانند برای RAG ingest شوند.

---

# Phase 1 Data Baseline — Frozen

تصمیم نهایی:
فاز اول TSEAI با همین Sourceهایی که تا این مرحله به SQL AI منتقل شده‌اند شروع می‌شود.
موارد Pending مانع شروع نیستند و بعداً به همین معماری اضافه خواهند شد.

## Sourceهای فعال فاز اول

1. `Instrument`
2. `Cashmarket`
3. `OrderBookCurrent`
4. `ClientType`
5. `Marketsummary`
6. `IndexLastLive`
7. `Companystate`
8. `ContentType`
9. `Content`
10. `FAQ`
11. `Talar`
12. `TalarInfo`
13. `Nahad_Mali_Type`
14. `Nahad_Mali`
15. `Company`
16. `TsePerson`
17. `EDeliveryCategory` — موجود
18. `EDeliveryObject` — موجود

## Pending برای فازهای بعد

- `CompanyOfficer`
- `CompanyFinancialStatement`
- `CompanyFinancialStatementMetric`
- `MarketDailyHistory`
- `DerivativeContract`
- `MarketMaker`

## اصل اجرایی
- Sourceهای فعلی به سیستم‌های دیگر سرویس می‌دهند و تغییر اجباری روی Schema آنها انجام نمی‌شود.
- SQL AI به‌عنوان Landing/Read Model مستقل TSEAI استفاده می‌شود.
- Jobها داده را روزانه/لحظه‌ای به SQL AI منتقل می‌کنند.
- TSEAI خودش Canonicalization، History، Deduplication، HTML cleanup، RAG indexing، Entity resolution، محاسبات و جمله‌سازی فارسی را انجام می‌دهد.

