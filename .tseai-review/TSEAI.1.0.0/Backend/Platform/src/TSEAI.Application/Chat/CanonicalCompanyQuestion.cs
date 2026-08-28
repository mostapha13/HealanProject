using System.Text.RegularExpressions;

namespace TSEAI.Application.Chat;

public enum CompanyAggregateKind
{
    None = 0,
    Statistics,
    DataQuality,
    HallDistribution,
    HallCompanies,
    WebsiteCoverage,
    LatestIpo,
    EarliestIpo,
    IpoYear,
    Comparison,
    Schema
}

public sealed record CanonicalCompanyQuestionIntent(
    bool IsMatch,
    CompanyAggregateKind Aggregate,
    IReadOnlyList<string> Fields,
    IReadOnlyList<string> Lookups,
    int Limit,
    int? JalaliYear,
    bool NamesOnly);

/// <summary>
/// Deterministic Persian semantics for dbo.Company. The table is a current
/// reference snapshot for company identity/contact, regional hall and the
/// source IPO date; it is not a source for prices or financial statements.
/// </summary>
public static class CanonicalCompanyQuestion
{
    private static readonly string[] MetricPhrases =
    [
        "تاریخ عرضه اولیه ثبت شده","تاریخ عرضه اولیه","زمان عرضه اولیه","عرضه اولیه","تاریخ ورود به بورس","تاریخ پذیرش","ipo_date","ipo",
        "وب سایت رسمی","وب‌سایت رسمی","آدرس وب سایت","آدرس وب‌سایت","وب سایت","وب‌سایت","سایت اینترنتی","سایت شرکت","سایت",
        "شماره تلفن","شماره تماس","تلفن شرکت","راه ارتباطی","اطلاعات تماس","تلفن","تماس",
        "مدیر عامل","مدیرعامل","ceo","تالار منطقه ای","تالار منطقه‌ای","تالار شرکت","استان شرکت","کدام تالار","کدوم تالار",
        "آخرین زمان جمع آوری","آخرین زمان جمع‌آوری","زمان جمع آوری","زمان جمع‌آوری","زمان ثبت در sql","sourcecollectedat",
        "شناسه منبع instrument","شناسه instrument منبع","source instrument id","instrumentid","شناسه رکورد company","شناسه رکورد شرکت","company id",
        "نام کامل شرکت","اسم کامل شرکت","نام شرکت","اسم شرکت","نماد بورسی شرکت","نماد شرکت","مشخصات کامل company","اطلاعات کامل company"
    ];

    private static readonly HashSet<string> LookupNoise = new(StringComparer.OrdinalIgnoreCase)
    {
        "شرکت","شرکتی","شرکتا","شرکتای","شرکتاش","کمپانی","company","جدول","sql","رکورد","اطلاعات","مشخصات","کامل","فعلی","منبع","ثبت","شده",
        "نام","اسم","کامل","نماد","نمادش","سمبلش","بورسی","وب","سایت","وبسایت","اینترنتی","آدرس","رسمی","تلفن","شماره","تماس","راه","ارتباطی",
        "مدیرعامل","مدیر","عامل","ceo","تالار","استان","منطقه","منطقه‌ای","منطقه ای","عرضه","اولیه","تاریخ","زمان","زمانی","ورود","پذیرش","بورس",
        "شناسه","instrumentid","instrument","sourcecollectedat","جمع","آوری","بروزرسانی","به‌روزرسانی","به","روز","رسانی",
        "چیست","چیه","کیه","کیست","کیا","کدام","کدوم","چه","چند","چندتا","چنتا","چقدر","آن","این","همان","ایشان","است","هست","هستن","هستند","اند","بود","بوده","نبود","میباشد","می‌باشد","دارد","دارند","داره",
        "یک","دو","سه","چهار","پنج","شش","هفت","هشت","نه","ده","تا","مورد","موارد",
        "را","رو","بگو","بده","نمایش","اعلام","کن","کنید","لطفا","لطفاً","مربوط","متعلق","که","هم","سپس","بعد","اضافه","برای","در","از","به","با","و","یا",
        "مقایسه","مقایسه‌کن","مقایسهکن","قدیمی","جدید","تازه","ترین","اخیر","اخیرترین","قدیمی‌ترین","جدیدترین","اولین","آخرین","بر اساس","براساس","فهرست","لیست"
    };

    public static CanonicalCompanyQuestionIntent Parse(string? question)
    {
        var q=Normalize(question);
        var fields=new HashSet<string>(StringComparer.Ordinal);
        void Add(string field,params string[] aliases)
        {
            if(aliases.Any(x=>q.Contains(x,StringComparison.Ordinal))) fields.Add(field);
        }

        Add("title","نام کامل شرکت","اسم کامل شرکت","نام شرکت","اسم شرکت","company title","title company");
        Add("symbol","نماد بورسی شرکت","نماد شرکت","نماد این شرکت","چه نمادی","کدام نماد","کدوم نماد","نمادش","سمبلش");
        Add("hall","تالار شرکت","تالار منطقه ای","تالار منطقه‌ای","در کدام تالار","در کدوم تالار","کدام تالار است","کدوم تالار است","استان شرکت","مربوط به کدام تالار","مربوط به کدوم تالار","متعلق به کدام تالار","متعلق به کدوم تالار");
        Add("url","وب سایت","وبسایت","سایت شرکت","سایت رسمی","آدرس سایت","سایت","url");
        Add("ceo","مدیرعامل","مدیر عامل","ceo");
        Add("phone","شماره تلفن","شماره تماس","تلفن شرکت","راه ارتباطی","اطلاعات تماس","تلفن");
        Add("ipo_date","عرضه اولیه","عرضه شده","عرضه‌شده","وارد بورس","ورود به بورس","ipo","تاریخ ورود به بورس","تاریخ پذیرش");
        Add("source_collected_at","sourcecollectedat","زمان جمع آوری","زمان جمع‌آوری","زمان ثبت در sql","آخرین بروزرسانی","آخرین به روزرسانی","آخرین به‌روزرسانی");
        Add("company_id","company id","شناسه رکورد company","شناسه رکورد شرکت");
        Add("source_instrument_id","source instrument id","شناسه منبع instrument","شناسه instrument منبع","instrumentid جدول company");
        Add("full","مشخصات کامل company","اطلاعات کامل company","همه اطلاعات company","اطلاعات تماس و عرضه","مشخصات ثبتی و تماس");

        var aggregate=DetectAggregate(q,fields,out var year);
        var isComparison=ContainsAny(q,"مقایسه","کدام زودتر","کدوم زودتر","قدیمی تر است","قدیمی‌تر است","جدیدتر است")
            && fields.Contains("ipo_date");
        if(isComparison) aggregate=CompanyAggregateKind.Comparison;
        var lookups=ExtractLookupTexts(q,isComparison);
        if(aggregate is CompanyAggregateKind.LatestIpo or CompanyAggregateKind.EarliestIpo
            &&lookups.Count>0)
            aggregate=CompanyAggregateKind.None;
        var mentionsCompanyTable=q.Contains("جدول company",StringComparison.Ordinal)
            ||q.Contains("در company",StringComparison.Ordinal)
            ||q.Contains("داده company",StringComparison.Ordinal);
        return new(fields.Count>0||aggregate!=CompanyAggregateKind.None||mentionsCompanyTable,
            aggregate,fields.ToArray(),lookups,DetectLimit(q,aggregate),year,
            ContainsAny(q,"فقط اسم","فقط نام","اسامی را","نام ها","نام‌ها","اسمشون","نامشون","کیا","چه شرکت","شرکتای","شرکتاش","اسم شرکت"));
    }

    private static CompanyAggregateKind DetectAggregate(string q,HashSet<string> fields,out int? jalaliYear)
    {
        jalaliYear=ExtractJalaliYear(q);
        if(ContainsAny(q,"معنی ستون","معنی فیلد","چه مفهومی","چه ارتباطی","رابطه","وصل میشه","وصل می شود","نوع داده","کلید خارجی","foreign key","فرق instrumentid")
            ||(q.Contains("company",StringComparison.Ordinal)&&ContainsAny(q,"قیمت","حجم معاملات","ارزش معاملات","اطلاعات مالی","صورت مالی")))
            return CompanyAggregateKind.Schema;
        if((q.Contains("company",StringComparison.Ordinal)&&ContainsAny(q,"کیفیت داده","فیلدهای خالی","مقادیر خالی","داده ناقص","تکراری","یتیم"))
            ||(ContainsAny(q,"talar id","talar_id","شناسه تالار","کد تالار")&&q.Contains("یتیم",StringComparison.Ordinal))
            ||ContainsAny(q,"عنوان خالی","تلفن خالی","شناسه تکراری","عنوان تکراری","عنوان های تکراری","عنوان‌های تکراری","رکورد یتیم","بدون تالار"))
            return CompanyAggregateKind.DataQuality;
        if(ContainsAny(q,"توزیع شرکت","تفکیک تالار","به تفکیک تالار","هر تالار","بیشترین شرکت","کمترین شرکت"))
            return CompanyAggregateKind.HallDistribution;
        if(q.Contains("تالار",StringComparison.Ordinal)&&(ContainsAny(q,"شرکت های","شرکت‌های","شرکت ها","شرکت‌ها","شرکتای","شرکتا","شرکتاش","اسم شرکت","چند شرکت","چندتا شرکت","چنتا شرکت","فهرست شرکت","لیست شرکت","چه شرکت")
            ||Regex.IsMatch(q,@"(?:^|\s)(?:[0-9۰-۹]+|یک|دو|سه|چهار|پنج|شش|هفت|هشت|نه|ده)\s+شرکت")))
            return CompanyAggregateKind.HallCompanies;
        // «زیرمجموعه تالار» describes the Company -> Talar relationship in
        // this source.  Treat the whole relation as the semantic cue so small
        // colloquial/typing variations in the question word (کیا/چی‌ها/...)
        // do not send the request to an unrelated model-generated route.
        if(q.Contains("تالار",StringComparison.Ordinal)
           &&ContainsAny(q,"زیر مجموع","منتسب به تالار","وابسته به تالار")
           &&!ContainsAny(q,"کدام معاونت","کدوم معاونت","چه معاونتی","بالادست"))
            return CompanyAggregateKind.HallCompanies;
        if(ContainsAny(q,"چند شرکت وب سایت","چند شرکت وبسایت","تعداد شرکت دارای سایت","تعداد شرکت های دارای سایت","فاقد وب سایت","بدون وب سایت","پوشش وب سایت")
            ||(fields.Contains("url")&&ContainsAny(q,"چند شرکت","تعداد شرکت","معتبر ندارند","ندارند")))
            return CompanyAggregateKind.WebsiteCoverage;
        if(fields.Contains("ceo")&&ContainsAny(q,"چند شرکت","تعداد شرکت","چند رکورد","کل جدول"))
            return CompanyAggregateKind.DataQuality;
        if(fields.Contains("ipo_date")&&jalaliYear is not null&&ContainsAny(q,"شرکت ها","شرکت‌های","شرکت های","چند شرکت","تعداد شرکت","عرضه ها","عرضه‌های"))
            return CompanyAggregateKind.IpoYear;
        if(fields.Contains("ipo_date")&&ContainsAny(q,"جدیدترین","آخرین","اخیرترین","تازه ترین","تازه‌ترین","اخیر"))
            return CompanyAggregateKind.LatestIpo;
        if(fields.Contains("ipo_date")&&ContainsAny(q,"قدیمی ترین","قدیمی‌ترین","اولین","نخستین"))
            return CompanyAggregateKind.EarliestIpo;
        if(fields.Contains("source_collected_at")&&q.Contains("company",StringComparison.Ordinal)&&ContainsAny(q,"کل company","کل جدول","آخرین زمان"))
            return CompanyAggregateKind.Statistics;
        if(q.Contains("company",StringComparison.Ordinal)&&ContainsAny(q,"چند رکورد","تعداد رکورد","چند شرکت","تعداد شرکت","چند عنوان","تعداد عنوان","چند تالار","تعداد تالار","چند instrumentid","تعداد instrumentid","آمار جدول","وضعیت جدول","کل جدول"))
            return CompanyAggregateKind.Statistics;
        return CompanyAggregateKind.None;
    }

    private static IReadOnlyList<string> ExtractLookupTexts(string normalized,bool comparison)
    {
        var value=normalized;
        value=Regex.Replace(value,@"\b(?:بورس(?: اوراق بهادار)? تهران|بازار سرمایه(?: ایران)?|بازار بورس(?: ایران)?)\b"," ",RegexOptions.CultureInvariant);
        foreach(var phrase in MetricPhrases.OrderByDescending(x=>x.Length)) value=value.Replace(phrase," ",StringComparison.OrdinalIgnoreCase);
        value=Regex.Replace(value,@"\b(?:فقط|لطفا|لطفاً|بهم|برا|برایم|جدول)\b"," ");
        var segments=comparison
            ? Regex.Split(value,@"\s+(?:را\s+با|در\s+برابر|نسبت\s+به|با)\s+|\s+(?:و|یا)\s+")
            : [value];
        var result=new List<string>();
        foreach(var segment in segments)
        {
            var tokens=Regex.Matches(segment,@"[\p{L}\p{Nd}_‌\-()]+")
                .Select(x=>x.Value.Trim('(',')'))
                .Where(x=>x.Length>=2&&!LookupNoise.Contains(x))
                .Where(x=>!Regex.IsMatch(x,@"^(?:چند|کدام|کدوم|چی|میشه|می‌شود|میباشد|مربوطه|قدیمیتر|جدیدتر).*$"))
                .ToArray();
            var candidate=string.Join(' ',tokens).Trim();
            if(candidate.Length>0&&!result.Contains(candidate,StringComparer.OrdinalIgnoreCase)) result.Add(candidate);
        }
        return result.Take(comparison?2:1).ToArray();
    }

    private static int DetectLimit(string q,CompanyAggregateKind aggregate)
    {
        var match=Regex.Match(q,@"(?<![0-9۰-۹])(?<n>[0-9۰-۹]{1,2})(?![0-9۰-۹])\s*(?:شرکت|مورد|تا|عرضه)");
        if(match.Success&&int.TryParse(ToLatinDigits(match.Groups["n"].Value),out var value)) return Math.Clamp(value,1,20);
        var words=new Dictionary<string,int>(StringComparer.Ordinal){{"یک",1},{"دو",2},{"سه",3},{"چهار",4},{"پنج",5},{"شش",6},{"هفت",7},{"هشت",8},{"نه",9},{"ده",10}};
        foreach(var (word,count) in words)
            if(Regex.IsMatch(q,$@"(?:^|\s){word}\s+(?:شرکت|مورد|عرضه)")) return count;
        if(aggregate is CompanyAggregateKind.LatestIpo or CompanyAggregateKind.EarliestIpo
            &&!ContainsAny(q,"فهرست","لیست","چند","شرکت ها","شرکت های","عرضه ها","عرضه های","موارد"))
            return 1;
        return aggregate==CompanyAggregateKind.HallCompanies?20:10;
    }

    private static int? ExtractJalaliYear(string value)
    {
        var latin=ToLatinDigits(value);
        var match=Regex.Match(latin,@"(?<!\d)(?<year>1[34][0-9]{2})(?!\d)");
        return match.Success&&int.TryParse(match.Groups["year"].Value,out var year)?year:null;
    }

    public static string Normalize(string? value)
    {
        var q=PersianDisplayText.Normalize(value??string.Empty).ToLowerInvariant().Replace('‌',' ')
            .Replace('ي','ی').Replace('ى','ی').Replace('ك','ک').Replace('ة','ه').Replace('ۀ','ه');
        q=Regex.Replace(q,@"[^\p{L}\p{Nd}_/()\-]+"," ");
        return Regex.Replace(q,@"\s+"," ").Trim();
    }

    public static string MatchKey(string? value)
    {
        var q=Normalize(value);
        q=Regex.Replace(q,@"^(?:شرکت|گروه|صنایع|کارخانجات)\s+","",RegexOptions.CultureInvariant);
        q=Regex.Replace(q,@"\b(?:سهامی|عام|خاص)\b"," ",RegexOptions.CultureInvariant);
        return Regex.Replace(q,@"[^\p{L}\p{Nd}]+",string.Empty,RegexOptions.CultureInvariant);
    }

    private static bool ContainsAny(string value,params string[] candidates)=>candidates.Any(x=>value.Contains(x,StringComparison.Ordinal));
    private static string ToLatinDigits(string value)=>string.Concat(value.Select(ch=>ch is >= '۰' and <= '۹'?(char)('0'+ch-'۰'):ch));
}
