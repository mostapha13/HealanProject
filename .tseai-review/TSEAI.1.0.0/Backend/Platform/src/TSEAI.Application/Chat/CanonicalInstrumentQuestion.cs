using System.Text.RegularExpressions;

namespace TSEAI.Application.Chat;

public enum InstrumentAggregateKind
{
    None = 0,
    Statistics,
    CategoryCounts,
    CategoryInstruments,
    LatestInstruments,
    TopShares,
    TopBaseVolume,
    TopNominalValue,
    DuplicateSymbols,
    CompanyInstruments,
    IndustryInstruments,
    MissingAllowedPrices,
    CashMarketCoverage,
    OrderBookCoverage
}

public sealed record CanonicalInstrumentQuestionIntent(
    bool IsMatch,
    InstrumentAggregateKind Aggregate,
    IReadOnlyList<string> Fields,
    string? Category,
    int? IndustryId,
    int Limit,
    bool IncludeInactive)
{
    public bool IsAggregate => Aggregate != InstrumentAggregateKind.None;
}

/// <summary>
/// Deterministic semantics for reference facts owned by dbo.Instrument. It is
/// deliberately separate from current market metrics such as price and volume.
/// </summary>
public static partial class CanonicalInstrumentQuestion
{
    private static readonly string[] LookupMetricPhrases=
    [
        "حداقل و حداکثر حجم هر سفارش","حداقل و حداکثر قیمت مجاز","زمان جمع آوری instrument","زمان جمع‌آوری instrument",
        "ابزارهای شرکت","نمادهای شرکت","ابزارهای ناشر","نمادهای ناشر","ابزارهای صنعت","نمادهای صنعت",
        "تعداد سهام منتشره","تعداد کل سهام","تعداد سهام شرکت","تعداد سهام","دامنه قیمت مجاز","بازه قیمت مجاز",
        "مشخصات کامل ابزار","اطلاعات کامل ابزار","تمام مشخصات instrument","همه اطلاعات instrument","اطلاعات پایه نماد","مشخصات نماد",
        "تاریخ رویداد ابزار","آخرین رویداد ابزار","تاریخ ورود به بازار","تاریخ ثبت ابزار","تاریخ درج ابزار","تاریخ درج نماد",
        "حداقل قیمت مجاز","حداکثر قیمت مجاز","حداقل حجم هر سفارش","حداکثر حجم هر سفارش","حداقل حجم سفارش","حداکثر حجم سفارش","کمترین حجم سفارش","بیشترین حجم سفارش",
        "زمان جمع آوری داده instrument","زمان جمع‌آوری داده instrument","تاریخ جمع آوری داده instrument","تاریخ جمع‌آوری داده instrument",
        "نام کامل نماد","اسم کامل نماد","نام کامل سهم","اسم کامل سهم","نام کامل ابزار","عنوان کامل ابزار","نماد انگلیسی","کد انگلیسی","نام انگلیسی","اسم انگلیسی",
        "شناسه بین المللی","شناسه بین‌المللی","کد شناسایی اوراق","شناسه ی ابزار","شناسه ابزار","شناسه نماد",
        "شناسه دسته بازار","کد دسته بازار","شناسه زیرصنعت","کد زیرصنعت","شناسه صنعت","کد صنعت",
        "شرکت ناشر","نام ناشر","نماد ناشر","کد ناشر","نام شرکت","شرکت مربوط","متعلق به چه شرکت",
        "دسته ای از ابزار","دسته‌ای از ابزار","نوع ابزار","دسته ابزار","گروه ابزار","حجم مبنا","ارزش اسمی","مبلغ اسمی",
        "وضعیت اعتبار","اعتبار ابزار","معتبر است","جریان بازار","کد بازار ynsc","کد flow","کد yval",
        "instrumentid","instrument id","inscode","ins code","marketcateryid","marketcatery","industrysubid","industryid",
        "sourcecollectedat","psaisminokvalmdv","psaismaxokvalmdv","qtitminsaiomprod","qtitmaxsaiomprod","basevol","qnmvlo","ztitad","cvalmne","lval18","lval30","csoccsac","dinmar","deven","yval","ymarnsc","isin"
    ];

    private static readonly HashSet<string> LookupStopWords=new(StringComparer.OrdinalIgnoreCase)
    {
        "نماد","سهم","ابزار","شرکت","ناشر","جدول","instrument","کد","شناسه","اطلاعات","مشخصات","کامل","پایه",
        "مال","متعلق","مربوط","به","از","در","برای","و","یا","این","آن","رو","را","بهم","لطفا","لطفاً",
        "چه","چی","چیست","چیه","چند","چقدر","چنده","کدام","کدوم","است","هست","میباشد","می‌باشد","می باشد",
        "بگو","بده","اعلام","کن","شود","شده","ثبت","معتبر","فعال","فعلی"
    };

    public static CanonicalInstrumentQuestionIntent Parse(string question)
    {
        var q=Normalize(question);
        var fields=new HashSet<string>(StringComparer.Ordinal);
        void Add(string field,params string[] aliases)
        {
            if(aliases.Any(x=>q.Contains(x,StringComparison.Ordinal))) fields.Add(field);
        }

        Add("instrument_id","instrumentid","instrument id","شناسه ابزار","شناسه ی ابزار","شناسه نماد");
        Add("ins_code","inscode","ins code","کد اینس","کد tsetmc","کد تی اس ای");
        Add("isin","isin","آیزین","ایزین","شناسه بین المللی","شناسه بین‌المللی","کد شناسایی اوراق");
        Add("english_symbol","نماد انگلیسی","کد انگلیسی","cvalmne");
        Add("english_name","نام انگلیسی","اسم انگلیسی","lval18");
        Add("name","نام کامل نماد","اسم کامل نماد","نام کامل سهم","اسم کامل سهم","نام کامل ابزار","عنوان کامل ابزار","lval30");
        if(ContainsAny(q,"کدام نماد","کدوم نماد","چه نمادی","مال کدام نماد","مال کدوم نماد","متعلق به کدام نماد","متعلق به کدوم نماد")) fields.Add("name");
        Add("issuer","شرکت ناشر","نام ناشر","ناشر این","متعلق به چه شرکت","نام شرکت","شرکت مربوط");
        if(Regex.IsMatch(q,@"(?:^|\s)ناشر(?:\s|$)")) fields.Add("issuer");
        Add("issuer_symbol","نماد ناشر","کد ناشر","csoccsac");
        Add("category","نوع ابزار","نوع نماد","نوع سهم","دسته ابزار","گروه ابزار","دسته ای از ابزار","دسته‌ای از ابزار","marketcatery");
        Add("market_category_id","marketcateryid","شناسه دسته بازار","کد دسته بازار");
        Add("industry","کد صنعت","شناسه صنعت","industryid");
        Add("subindustry","کد زیرصنعت","شناسه زیرصنعت","industrysubid");
        Add("base_volume","حجم مبنا","basevol","base volume");
        Add("shares_count","تعداد کل سهام","تعداد سهام منتشره","تعداد سهام شرکت","تعداد سهام","ztitad");
        Add("nominal_value","ارزش اسمی","مبلغ اسمی","qnmvlo");
        Add("min_allowed_price","حداقل قیمت مجاز","کف مجاز قیمت","psaisminokvalmdv");
        Add("max_allowed_price","حداکثر قیمت مجاز","سقف مجاز قیمت","psaismaxokvalmdv");
        if(ContainsAny(q,"دامنه قیمت مجاز","بازه قیمت مجاز","حداقل و حداکثر قیمت مجاز"))
        {
            fields.Add("min_allowed_price"); fields.Add("max_allowed_price");
        }
        Add("min_order_volume","حداقل حجم هر سفارش","حداقل حجم سفارش","کمترین حجم سفارش","qtitminsaiomprod");
        Add("max_order_volume","حداکثر حجم هر سفارش","حداکثر حجم سفارش","بیشترین حجم سفارش","qtitmaxsaiomprod");
        if(ContainsAny(q,"حداقل و حداکثر حجم هر سفارش","بازه حجم سفارش"))
        {
            fields.Add("min_order_volume"); fields.Add("max_order_volume");
        }
        Add("validity","معتبر است","اعتبار ابزار","وضعیت اعتبار","valid");
        Add("market_entry_date","تاریخ ثبت ابزار","تاریخ درج ابزار","تاریخ درج نماد","تاریخ ورود به بازار","dinmar");
        Add("event_date","تاریخ رویداد ابزار","آخرین رویداد ابزار","deven");
        Add("source_observed_at","تاریخ داده instrument","زمان داده instrument","زمان جمع آوری instrument","زمان جمع‌آوری instrument","زمان جمع آوری داده instrument","زمان جمع‌آوری داده instrument","تاریخ جمع آوری داده instrument","تاریخ جمع‌آوری داده instrument","sourcecollectedat");
        Add("flow","کد flow","جریان بازار");
        Add("instrument_type_code","کد yval","yval");
        Add("market_code","کد بازار ynsc","ymarnsc");
        Add("full","مشخصات کامل ابزار","اطلاعات کامل ابزار","تمام مشخصات instrument","همه اطلاعات instrument","مشخصات نماد","اطلاعات پایه نماد");

        var aggregate=DetectAggregate(q,out var category,out var industryId);
        var includeInactive=ContainsAny(q,"نامعتبر","غیرفعال","قدیمی","منقضی","همه رکورد","کل جدول");
        var limit=DetectLimit(q);
        var match=aggregate!=InstrumentAggregateKind.None||fields.Count>0;
        return new(match,aggregate,fields.ToArray(),category,industryId,limit,includeInactive);
    }

    /// <summary>Removes the requested Instrument facets and keeps only the entity key.</summary>
    public static string ExtractLookupText(string question)
    {
        var normalized=Normalize(question);
        var identifier=Identifier().Match(normalized);
        if(identifier.Success) return identifier.Value;
        var numeric=LongIdentifier().Match(normalized);
        if(numeric.Success) return ToLatinDigits(numeric.Value);
        var quoted=QuotedEntity().Match(PersianDisplayText.Normalize(question??string.Empty));
        if(quoted.Success) return quoted.Groups["entity"].Value.Trim();
        foreach(var phrase in LookupMetricPhrases.OrderByDescending(x=>x.Length))
            normalized=normalized.Replace(phrase," ",StringComparison.OrdinalIgnoreCase);
        var tokens=Regex.Matches(normalized,@"[\p{L}\p{Nd}‌_-]+")
            .Select(x=>x.Value).Where(x=>x.Length>=2&&!LookupStopWords.Contains(x)).ToArray();
        return string.Join(' ',tokens);
    }

    private static InstrumentAggregateKind DetectAggregate(string q,out string? category,out int? industryId)
    {
        category=DetectCategory(q);
        industryId=null;
        var industry=IndustryCode().Match(q);
        if(industry.Success&&int.TryParse(ToLatinDigits(industry.Groups["id"].Value),out var parsedIndustry)) industryId=parsedIndustry;
        var aggregateCue=ContainsAny(q,"چند ابزار","چند نماد","چه تعداد ابزار","چه تعداد نماد","تعداد ابزار","تعداد نماد","چند رکورد","تعداد رکورد","چند ناشر","تعداد ناشر","چند شرکت","تعداد شرکت","چند صنعت","تعداد صنعت","چند زیرصنعت","تعداد زیرصنعت","چند isin","تعداد isin","تعداد اوراق بدهی","چه تعداد قرارداد آتی","تعداد قرارداد آتی","فهرست ابزار","لیست ابزار","ابزارهای","نمادهای","بیشترین","جدیدترین","آخرین ابزار","آخرین نماد","تکراری","کل جدول instrument");
        if(!aggregateCue) return InstrumentAggregateKind.None;
        if(ContainsAny(q,"وصل به cashmarket","متصل به cashmarket","در cashmarket","cashmarket وصل","cashmarket متصل")) return InstrumentAggregateKind.CashMarketCoverage;
        if(ContainsAny(q,"وصل به orderbook","متصل به orderbook","در orderbookcurrent","در orderbook","orderbookcurrent رکورد","orderbook رکورد","دفتر سفارش دارند","اردربوک دارند")) return InstrumentAggregateKind.OrderBookCoverage;
        if(ContainsAny(q,"قیمت مجاز صفر","بدون قیمت مجاز","فاقد قیمت مجاز")) return InstrumentAggregateKind.MissingAllowedPrices;
        if(ContainsAny(q,"نماد تکراری","نمادهای تکراری","سمبل تکراری")) return InstrumentAggregateKind.DuplicateSymbols;
        if(ContainsAny(q,"بیشترین تعداد سهام","بیشترین سهام منتشره")) return InstrumentAggregateKind.TopShares;
        if(q.Contains("بیشترین حجم مبنا",StringComparison.Ordinal)) return InstrumentAggregateKind.TopBaseVolume;
        if(q.Contains("بیشترین ارزش اسمی",StringComparison.Ordinal)) return InstrumentAggregateKind.TopNominalValue;
        if(ContainsAny(q,"جدیدترین","آخرین ابزار","آخرین نماد")) return InstrumentAggregateKind.LatestInstruments;
        if(ContainsAny(q,"هر دسته","تفکیک دسته","دسته بندی","دسته‌بندی","گروه های ابزار","گروه‌های ابزار")) return InstrumentAggregateKind.CategoryCounts;
        if(ContainsAny(q,"ابزارهای شرکت","نمادهای شرکت","ابزارهای ناشر","نمادهای ناشر")) return InstrumentAggregateKind.CompanyInstruments;
        if(ContainsAny(q,"ابزارهای صنعت","نمادهای صنعت")) return InstrumentAggregateKind.IndustryInstruments;
        if(category is not null) return InstrumentAggregateKind.CategoryInstruments;
        return InstrumentAggregateKind.Statistics;
    }

    private static string? DetectCategory(string q)
    {
        if(ContainsAny(q,"tradeoption","اختیار معامله بورسی")) return "tradeoption";
        if(ContainsAny(q,"etf","صندوق قابل معامله","صندوق های قابل معامله","صندوق‌های قابل معامله")) return "etf";
        if(ContainsAny(q,"اوراق بدهی","صکوک","اوراق گام")) return "debt";
        if(ContainsAny(q,"قرارداد آتی","ابزار آتی","نماد آتی","future")) return "future";
        if(ContainsAny(q,"بازار نقدی","ابزار نقدی","نماد نقدی","سهام نقدی","cash")) return "cash";
        if(ContainsAny(q,"بدون دسته","دسته نامشخص")) return "__null__";
        if(ContainsAny(q,"اختیار معامله","آپشن","option")) return "__option_family__";
        return null;
    }

    private static int DetectLimit(string q)
    {
        var match=TopCount().Match(q);
        if(match.Success&&int.TryParse(ToLatinDigits(match.Groups["n"].Value),out var value)) return Math.Clamp(value,1,20);
        return 10;
    }

    private static string Normalize(string value)=>Regex.Replace(PersianDisplayText.Normalize(value??string.Empty).ToLowerInvariant().Replace('‌',' '),@"\s+"," ").Trim();
    private static bool ContainsAny(string value,params string[] candidates)=>candidates.Any(x=>value.Contains(x,StringComparison.Ordinal));
    private static string ToLatinDigits(string value)=>string.Concat(value.Select(ch=>ch is >= '۰' and <= '۹'?(char)('0'+ch-'۰'):ch));

    [GeneratedRegex(@"(?:صنعت|industry)\s*(?<id>[0-9۰-۹]{1,4})",RegexOptions.IgnoreCase|RegexOptions.CultureInvariant)]
    private static partial Regex IndustryCode();

    [GeneratedRegex(@"(?<n>[0-9۰-۹]{1,2})\s*(?:ابزار|نماد|مورد|تا)",RegexOptions.CultureInvariant)]
    private static partial Regex TopCount();

    [GeneratedRegex(@"\bIR[A-Z0-9]{8,}\b",RegexOptions.IgnoreCase|RegexOptions.CultureInvariant)]
    private static partial Regex Identifier();

    [GeneratedRegex(@"(?<![0-9۰-۹])[0-9۰-۹]{8,}(?![0-9۰-۹])",RegexOptions.CultureInvariant)]
    private static partial Regex LongIdentifier();

    [GeneratedRegex("[«\\\"](?<entity>[^»\\\"]{2,128})[»\\\"]",RegexOptions.CultureInvariant)]
    private static partial Regex QuotedEntity();
}
