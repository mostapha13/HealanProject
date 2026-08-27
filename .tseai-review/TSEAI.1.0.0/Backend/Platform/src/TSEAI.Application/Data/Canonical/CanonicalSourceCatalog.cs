namespace TSEAI.Application.Data.Canonical;

public static class CanonicalSourceCatalog
{
    public static IReadOnlyList<CanonicalSourceDescriptor> All { get; } =
    [
        new("instrument", "Instrument", CanonicalSourceMode.Reference, ["InstrumentID"],
            PersianName:"مرجع ابزارهای مالی",
            Description:"هویت، نام، نماد، طبقه‌بندی و محدودیت‌های معاملاتی هر ابزار؛ مرجع اصلی Entity Resolution نماد است.",
            RetrievalMode:CanonicalRetrievalMode.Structured,
            FreshnessClass:CanonicalFreshnessClass.SourceManaged,
            EventTimeColumn:"DEven",
            HistoryMode:CanonicalHistoryMode.CurrentOnly,
            UpdatePolicy:"upsert-by-InstrumentID; latest SourceCollectedAt wins; source schedule is authoritative",
            VectorizationPolicy:"not-vectorized; identity fields are Qdrant metadata only",
            Fields:
            [
                F("InstrumentID","instrument.id","شناسه ابزار","nvarchar",key:true,description:"کلید یکتای ابزار و کلید اتصال به Cashmarket و OrderBookCurrent"),
                F("InsCode","instrument.market_code","کد بازار ابزار","bigint",key:true,description:"کلید اتصال به ClientType و منبع اردربوک"),
                F("CIsin","instrument.isin","کد ISIN","nvarchar"),
                F("LVal18AFC","instrument.symbol","نماد فارسی","nvarchar",key:true),
                F("LVal30","instrument.name","نام فارسی ابزار","nvarchar"),
                F("CSocCSAC","issuer.symbol","نماد ناشر","nvarchar"),
                F("LSoc30","issuer.name","نام شرکت/ناشر","nvarchar"),
                F("marketcatery","instrument.category","دسته ابزار","nvarchar"),
                F("ZTitad","instrument.shares_count","تعداد سهام","decimal","share"),
                F("BaseVol","instrument.base_volume","حجم مبنا","decimal","share"),
                F("PSaiSMinOkValMdv","instrument.min_allowed_price","حداقل قیمت مجاز","decimal","IRR"),
                F("PSaiSMaxOkValMdv","instrument.max_allowed_price","حداکثر قیمت مجاز","decimal","IRR"),
                F("DEven","instrument.event_date","تاریخ رویداد منبع","int","yyyyMMdd"),
                F("SourceCollectedAt","source.collected_at","زمان جمع‌آوری منبع","datetime2","UTC")
            ],
            Relationships:
            [
                R("cash-market",["InstrumentID"],["InstrumentID"],"1:0..1","هویت ابزار به Snapshot جاری بازار"),
                R("order-book",["InstrumentID","InsCode"],["InstrumentID","InsCode"],"1:0..5","هویت ابزار به پنج سطح سفارش جاری"),
                R("client-type",["InsCode"],["InsCode"],"1:0..1","هویت ابزار به تفکیک حقیقی/حقوقی")
            ],
            QuestionFamilies:["مشخصات و هویت نماد","طبقه‌بندی بازار و صنعت","حجم مبنا و تعداد سهام","دامنه قیمت مجاز","تاریخ و تازگی رکورد"],
            Sprint1Audited:true),

        new("cash-market", "Cashmarket", CanonicalSourceMode.CurrentSnapshot, ["InstrumentID"],
            PersianName:"نمای لحظه‌ای معاملات نقدی",
            Description:"آخرین Snapshot قیمت، حجم، ارزش، تعداد معاملات، ارزش بازار و طبقه‌بندی معاملاتی هر ابزار.",
            RetrievalMode:CanonicalRetrievalMode.Structured,
            FreshnessClass:CanonicalFreshnessClass.SecondLevel,
            HistoryMode:CanonicalHistoryMode.CurrentOnly,
            UpdatePolicy:"replace-or-upsert current snapshot by InstrumentID; never infer historical prices from this table",
            VectorizationPolicy:"never-vectorize; numeric facts must come from deterministic SQL/Redis tools",
            Fields:
            [
                F("InstrumentID","instrument.id","شناسه ابزار","nvarchar",key:true),
                F("InstrumentName","instrument.name","نام ابزار","nvarchar"),
                F("CompanyNamePersian","issuer.name","نام شرکت","nvarchar"),
                F("LastPrice","market.last_price","آخرین قیمت","decimal","IRR"),
                F("ClosingPrice","market.closing_price","قیمت پایانی","decimal","IRR"),
                F("YesterdayPrice","market.yesterday_price","قیمت روز قبل","decimal","IRR"),
                F("FirstPrice","market.first_price","قیمت اولین معامله","decimal","IRR"),
                F("HighValue","market.session_high","بیشترین قیمت روز","decimal","IRR"),
                F("LowValue","market.session_low","کمترین قیمت روز","decimal","IRR"),
                F("TradeVolume","market.trade_volume","حجم معاملات","decimal","share"),
                F("TradeValue","market.trade_value","ارزش معاملات","decimal","IRR"),
                F("TradeCount","market.trade_count","تعداد معاملات","decimal","count"),
                F("MarketValue","market.market_value","ارزش بازار","decimal","IRR"),
                F("PE","valuation.pe","نسبت قیمت به سود","decimal","ratio"),
                F("EPS","valuation.eps","سود هر سهم","decimal","IRR/share"),
                F("EffectOnIndex","market.index_effect","اثر بر شاخص","decimal","index-point"),
                F("SourceCollectedAt","source.collected_at","زمان Snapshot","datetime2","UTC")
            ],
            Relationships:[R("instrument",["InstrumentID"],["InstrumentID"],"many:1","هر Snapshot به یک ابزار مرجع تعلق دارد")],
            QuestionFamilies:["قیمت و تغییر قیمت","حجم، ارزش و تعداد معاملات","ارزش بازار و P/E و EPS","رتبه‌بندی و غربال بازار","زمان Snapshot"],
            Sprint1Audited:true),

        new("order-book", "OrderBookCurrent", CanonicalSourceMode.CurrentSnapshot, ["InstrumentID", "Level"],
            PersianName:"پنج سطح سفارش جاری",
            Description:"بهترین سفارش‌های خرید و فروش فعلی در سطوح یک تا پنج؛ داده تاریخی اردربوک نیست.",
            RetrievalMode:CanonicalRetrievalMode.Structured,
            FreshnessClass:CanonicalFreshnessClass.SecondLevel,
            EventTimeColumn:"OrderBookUpdatedAt",
            HistoryMode:CanonicalHistoryMode.CurrentOnly,
            UpdatePolicy:"atomic current-snapshot replacement by InstrumentID and Level; keep only latest BestLimitCounter",
            VectorizationPolicy:"never-vectorize; all prices, quantities and counts are deterministic structured facts",
            Fields:
            [
                F("InstrumentID","instrument.id","شناسه ابزار","nvarchar",key:true),
                F("InsCode","instrument.market_code","کد بازار ابزار","bigint",key:true),
                F("Level","orderbook.level","سطح سفارش","int","level",false,true),
                F("BuyPrice","orderbook.bid.price","قیمت خرید","decimal","IRR"),
                F("BuyQuantity","orderbook.bid.quantity","حجم خرید","decimal","share"),
                F("BuyCount","orderbook.bid.order_count","تعداد سفارش خرید","decimal","count"),
                F("SellPrice","orderbook.ask.price","قیمت فروش","decimal","IRR"),
                F("SellQuantity","orderbook.ask.quantity","حجم فروش","decimal","share"),
                F("SellCount","orderbook.ask.order_count","تعداد سفارش فروش","decimal","count"),
                F("BestLimitCounter","orderbook.snapshot_counter","شمارنده Snapshot","bigint","counter"),
                F("OrderBookUpdatedAt","orderbook.updated_at","زمان تغییر اردربوک","datetime2","UTC"),
                F("SourceCollectedAt","source.collected_at","زمان جمع‌آوری","datetime2","UTC")
            ],
            Relationships:[R("instrument",["InstrumentID","InsCode"],["InstrumentID","InsCode"],"many:1","سطوح سفارش به ابزار مرجع متصل می‌شوند")],
            QuestionFamilies:["بهترین خرید و فروش","صف خرید و صف فروش","عمق پنج سطح","اسپرد و عدم تعادل","زمان به‌روزرسانی اردربوک"],
            Sprint1Audited:true),

        new("client-type", "ClientType", CanonicalSourceMode.CurrentSnapshot, ["InsCode"],
            PersianName:"رفتار حقیقی و حقوقی",
            Description:"تعداد و حجم خریدوفروش سرمایه‌گذاران حقیقی و حقوقی در Snapshot جاری.",
            RetrievalMode:CanonicalRetrievalMode.Structured,
            FreshnessClass:CanonicalFreshnessClass.SecondLevel,
            EventTimeColumn:"creationTime",
            HistoryMode:CanonicalHistoryMode.CurrentOnly,
            UpdatePolicy:"latest row by creationTime, ClientType_counter and Id for each InsCode",
            VectorizationPolicy:"never-vectorize; derived power and per-capita metrics are calculated deterministically",
            Fields:
            [
                F("InsCode","instrument.market_code","کد بازار ابزار","bigint",key:true),
                F("Buy_CountI","client.individual.buy_count","تعداد خریدار حقیقی","decimal","count"),
                F("Buy_CountN","client.legal.buy_count","تعداد خریدار حقوقی","decimal","count"),
                F("Buy_I_Volume","client.individual.buy_volume","حجم خرید حقیقی","decimal","share"),
                F("Buy_N_Volume","client.legal.buy_volume","حجم خرید حقوقی","decimal","share"),
                F("Sell_CountI","client.individual.sell_count","تعداد فروشنده حقیقی","decimal","count"),
                F("Sell_CountN","client.legal.sell_count","تعداد فروشنده حقوقی","decimal","count"),
                F("Sell_I_Volume","client.individual.sell_volume","حجم فروش حقیقی","decimal","share"),
                F("Sell_N_Volume","client.legal.sell_volume","حجم فروش حقوقی","decimal","share"),
                F("ClientType_counter","client.snapshot_counter","شمارنده Snapshot","decimal","counter"),
                F("creationTime","client.updated_at","زمان Snapshot منبع","datetime2","UTC"),
                F("SourceCollectedAt","source.collected_at","زمان جمع‌آوری","datetime2","UTC")
            ],
            Relationships:[R("instrument",["InsCode"],["InsCode"],"many:1","تفکیک حقیقی/حقوقی از طریق InsCode به ابزار متصل می‌شود")],
            QuestionFamilies:["خریدوفروش حقیقی و حقوقی","خالص ورود پول حقیقی","سرانه خریدوفروش","قدرت خریدار","زمان Snapshot"],
            Sprint1Audited:true),

        new("market-summary", "Marketsummary", CanonicalSourceMode.CurrentSnapshot, ["Marketid", "Marketcatery"]),
        new("market-index", "IndexLastLive", CanonicalSourceMode.CurrentSnapshot, ["Instrumentid"]),

        new("company-state", "Companystate", CanonicalSourceMode.CurrentSnapshot, ["Namad"],
            PersianName:"وضعیت جاری شرکت و نماد",
            Description:"وضعیت، علت‌ها، مدیرعامل و اعضای هیئت‌مدیره ثبت‌شده برای شرکت؛ Lastdatechange در منبع رشته تاریخ شمسی است.",
            RetrievalMode:CanonicalRetrievalMode.Hybrid,
            FreshnessClass:CanonicalFreshnessClass.EventDriven,
            EventTimeColumn:"Lastdatechange",
            HistoryMode:CanonicalHistoryMode.Versioned,
            UpdatePolicy:"current projection by Namad; knowledge ingestion archives changed versions as SCD2",
            VectorizationPolicy:"vectorize normalized reasons and descriptive organization text; keep status, dates and identities as metadata",
            Fields:
            [
                F("Namad","instrument.symbol","نماد","nvarchar",key:true),
                F("companyName","issuer.name","نام شرکت","nvarchar"),
                F("Vaziyatdesc","company.status","وضعیت شرکت/نماد","nvarchar"),
                F("Lastdatechange","company.status_changed_on","تاریخ آخرین تغییر","nvarchar","Jalali yyyy/MM/dd"),
                F("Reasons","company.status_reasons","علت‌های وضعیت","nvarchar(max)"),
                F("CEO","company.current_ceo","مدیرعامل ثبت‌شده","nvarchar"),
                F("BOARDMEMBER","company.board_members","اعضای هیئت‌مدیره ثبت‌شده","nvarchar(max)"),
                F("SourceCollectedAt","source.collected_at","زمان جمع‌آوری","datetime2","UTC")
            ],
            Relationships:[R("instrument",["Namad"],["LVal18AFC"],"many:0..1","اتصال معنایی نماد به Instrument پس از نرمال‌سازی فارسی")],
            QuestionFamilies:["وضعیت فعلی نماد","دلایل تعلیق یا محدودیت","آخرین تغییر وضعیت","مدیرعامل و هیئت‌مدیره ثبت‌شده","سوابق وضعیت"],
            Sprint1Audited:true),

        new("content-type", "ContentType", CanonicalSourceMode.Reference, ["Id"]),
        new("content", "Content", CanonicalSourceMode.AppendOrVersioned, ["Id"],
            PersianName:"محتوا و اخبار",
            Description:"بدنه HTML، زمان انتشار، نوع، زبان، وضعیت انتشار و حذف منطقی محتوا؛ منبع اصلی اخبار و اسناد CMS.",
            RetrievalMode:CanonicalRetrievalMode.Hybrid,
            FreshnessClass:CanonicalFreshnessClass.MinuteLevel,
            EventTimeColumn:"PublishAt",
            HistoryMode:CanonicalHistoryMode.AppendWithUpsert,
            UpdatePolicy:"incremental upsert by Id using LastModifiedAt/DeletedAt/CreatedAt/PublishAt watermark; honor logical deletion",
            VectorizationPolicy:"strip HTML, normalize Persian, stable chunk, embed and upsert in Qdrant; retrieve parent document after chunk match",
            Fields:
            [
                F("Id","content.id","شناسه محتوا","int",key:true),
                F("ContentTypeId","content.type_id","نوع محتوا","int",key:true),
                F("LanguageId","content.language_id","زبان","int"),
                F("PublishAt","content.published_at","زمان انتشار","datetime2","UTC"),
                F("ContentStatusId","content.status_id","وضعیت انتشار","int"),
                F("Body","content.body_html","بدنه HTML","nvarchar(max)"),
                F("CreatedAt","content.created_at","زمان ایجاد","datetime2","UTC"),
                F("LastModifiedAt","content.modified_at","زمان آخرین تغییر","datetime2","UTC"),
                F("DeletedAt","content.deleted_at","زمان حذف","datetime2","UTC"),
                F("IsDeleted","content.is_deleted","حذف منطقی","bit"),
                F("SourceCollectedAt","source.collected_at","زمان جمع‌آوری","datetime2","UTC")
            ],
            Relationships:[R("content-type",["ContentTypeId"],["Id"],"many:0..1","نوع محتوا مسیر Structured/RAG/Hybrid را تعیین می‌کند")],
            QuestionFamilies:["آخرین خبر","جست‌وجوی موضوعی خبر","خبرهای شرکت یا نماد","متن و مشخصات رکورد Content","روند زمانی انتشار"],
            Sprint1Audited:true),

        new("faq", "FAQ", CanonicalSourceMode.AppendOrVersioned, ["QuestionText"]),
        new("talar", "Talar", CanonicalSourceMode.Reference, ["Id"]),
        new("talar-info", "TalarInfo", CanonicalSourceMode.CurrentSnapshot, ["Id"]),
        new("financial-institution-type", "Nahad_Mali_Type", CanonicalSourceMode.Reference, ["Id"]),
        new("financial-institution", "Nahad_Mali", CanonicalSourceMode.CurrentSnapshot, ["Id"],
            PersianName:"نهادها و شعب مالی",
            Description:"نام، نوع، اطلاعات تماس و تالار منطقه‌ای نهادهای مالی و شعب ثبت‌شده.",
            RetrievalMode:CanonicalRetrievalMode.Structured,
            FreshnessClass:CanonicalFreshnessClass.SourceManaged,
            HistoryMode:CanonicalHistoryMode.CurrentOnly,
            UpdatePolicy:"upsert current records by Id; do not merge same-name branches without an authoritative identity crosswalk",
            VectorizationPolicy:"not-vectorized in phase 1; names and locations are resolved with structured matching",
            Fields:
            [
                F("Id","financial_institution.id","شناسه نهاد/شعبه","uniqueidentifier",key:true),
                F("Title","financial_institution.name","نام نهاد/شعبه","nvarchar",key:true),
                F("Nahad_Mali_Type_Id","financial_institution.type_id","نوع نهاد مالی","uniqueidentifier",key:true),
                F("TelNo","financial_institution.phone","تلفن","nvarchar"),
                F("Address","financial_institution.address","نشانی","nvarchar"),
                F("Talar_Id","financial_institution.hall_id","تالار منطقه‌ای","uniqueidentifier",key:true),
                F("Broker_TypeId","financial_institution.broker_type_id","نوع کارگزار","uniqueidentifier"),
                F("SourceCollectedAt","source.collected_at","زمان جمع‌آوری","datetime2","UTC")
            ],
            Relationships:
            [
                R("financial-institution-type",["Nahad_Mali_Type_Id"],["Id"],"many:1","هر رکورد یک نوع نهاد مالی دارد"),
                R("talar",["Talar_Id"],["Id"],"many:1","هر شعبه/دفتر به یک تالار منطقه‌ای متصل است")
            ],
            QuestionFamilies:["فهرست و تعداد نهادها","نوع نهاد مالی","اطلاعات تماس و نشانی","نهادهای یک استان یا تالار","کیفیت و تازگی داده"],
            Sprint1Audited:true),

        new("company", "Company", CanonicalSourceMode.CurrentSnapshot, ["Id"],
            PersianName:"مرجع شرکت‌ها",
            Description:"نام شرکت، تالار، وب‌سایت، تلفن، مدیرعامل خام و تاریخ عرضه اولیه ثبت‌شده.",
            RetrievalMode:CanonicalRetrievalMode.Structured,
            FreshnessClass:CanonicalFreshnessClass.EventDriven,
            EventTimeColumn:"Ipo_Date",
            HistoryMode:CanonicalHistoryMode.CurrentOnly,
            UpdatePolicy:"upsert current record by Id; changed officer history is not authoritative until a versioned officer source is connected",
            VectorizationPolicy:"not-vectorized for authoritative fields; descriptive company documents are retrieved from Content",
            Fields:
            [
                F("Id","company.id","شناسه شرکت","uniqueidentifier",key:true),
                F("Title","company.name","نام شرکت","nvarchar",key:true),
                F("Talar_Id","company.hall_id","تالار منطقه‌ای","uniqueidentifier",key:true),
                F("Url","company.website","وب‌سایت","nvarchar"),
                F("Ceo","company.ceo_raw","مدیرعامل ثبت‌شده خام","nvarchar"),
                F("Tel","company.phone","تلفن","nvarchar"),
                F("Ipo_Date","company.ipo_date","تاریخ عرضه اولیه","datetime2","date"),
                F("InstrumentId","company.source_instrument_id","شناسه ابزار منبع","uniqueidentifier"),
                F("SourceCollectedAt","source.collected_at","زمان جمع‌آوری","datetime2","UTC")
            ],
            Relationships:[R("talar",["Talar_Id"],["Id"],"many:0..1","شرکت می‌تواند به یک تالار منطقه‌ای متصل باشد")],
            QuestionFamilies:["مشخصات شرکت","مدیرعامل ثبت‌شده","تاریخ عرضه اولیه و رتبه‌بندی IPO","تلفن و وب‌سایت","تالار و زمان جمع‌آوری"],
            Sprint1Audited:true),

        new("tse-person", "TsePerson", CanonicalSourceMode.CurrentSnapshot, ["ContentId"]),
        new("delivery-category", "EDeliveryCatery", CanonicalSourceMode.Reference, ["Id"], false),
        new("delivery-object", "EDeliveryObject", CanonicalSourceMode.AppendOrVersioned, ["ContentId"], false)
    ];

    public static IReadOnlyList<CanonicalSourceDescriptor> Sprint1Audited { get; } =
        All.Where(x => x.Sprint1Audited).ToArray();

    public static IReadOnlyList<CanonicalCatalogValidationIssue> Validate()
    {
        var issues=new List<CanonicalCatalogValidationIssue>();
        foreach(var duplicate in All.GroupBy(x=>x.Code,StringComparer.OrdinalIgnoreCase).Where(x=>x.Count()>1))
            issues.Add(new("duplicate_code",duplicate.Key,$"کد منبع {duplicate.Key} تکراری است."));
        foreach(var duplicate in All.GroupBy(x=>x.TableName,StringComparer.OrdinalIgnoreCase).Where(x=>x.Count()>1))
            issues.Add(new("duplicate_table",duplicate.First().Code,$"جدول {duplicate.Key} بیش از یک بار تعریف شده است."));

        var sourceCodes=All.Select(x=>x.Code).ToHashSet(StringComparer.OrdinalIgnoreCase);
        foreach(var source in Sprint1Audited)
        {
            var fields=source.Fields??[];
            var columns=fields.Select(x=>x.Column).ToHashSet(StringComparer.OrdinalIgnoreCase);
            if(string.IsNullOrWhiteSpace(source.PersianName)||string.IsNullOrWhiteSpace(source.Description))
                issues.Add(new("missing_semantics",source.Code,"نام فارسی و توضیح معنایی الزامی است."));
            if(fields.Count<5)
                issues.Add(new("insufficient_fields",source.Code,"حداقل پنج فیلد معنایی باید ثبت شود."));
            foreach(var key in source.BusinessKeys.Where(key=>!columns.Contains(key)))
                issues.Add(new("missing_business_key_field",source.Code,$"کلید {key} در فهرست فیلدها تعریف نشده است."));
            if(source.CollectionTimeColumn is { Length:>0 } collected&&!columns.Contains(collected))
                issues.Add(new("missing_collection_time",source.Code,$"ستون زمان جمع‌آوری {collected} در فهرست فیلدها نیست."));
            if(source.QuestionFamilies is null||source.QuestionFamilies.Count<3)
                issues.Add(new("insufficient_question_families",source.Code,"حداقل سه خانواده سؤال باید ثبت شود."));
            foreach(var relationship in source.Relationships??[])
            {
                if(!sourceCodes.Contains(relationship.TargetSourceCode))
                    issues.Add(new("unknown_relationship_target",source.Code,$"منبع مقصد {relationship.TargetSourceCode} تعریف نشده است."));
                if(relationship.LocalColumns.Count==0||relationship.LocalColumns.Count!=relationship.TargetColumns.Count)
                    issues.Add(new("invalid_relationship_columns",source.Code,$"رابطه با {relationship.TargetSourceCode} ستون‌های معتبر ندارد."));
            }
            if(source.RetrievalMode==CanonicalRetrievalMode.Structured
               &&source.VectorizationPolicy.Contains("vectorize",StringComparison.OrdinalIgnoreCase)
               &&!source.VectorizationPolicy.Contains("not-vectorized",StringComparison.OrdinalIgnoreCase)
               &&!source.VectorizationPolicy.Contains("never-vectorize",StringComparison.OrdinalIgnoreCase))
                issues.Add(new("structured_source_vectorized",source.Code,"منبع Structured نباید منبع حقیقت برداری معرفی شود."));
        }
        return issues;
    }

    private static CanonicalFieldDescriptor F(
        string column,string semantic,string persian,string type,string? unit=null,bool nullable=true,bool key=false,string? description=null)
        => new(column,semantic,persian,type,unit,nullable,key,description);

    private static CanonicalRelationshipDescriptor R(
        string target,IReadOnlyList<string> local,IReadOnlyList<string> remote,string cardinality,string description)
        => new(target,local,remote,cardinality,description);
}
