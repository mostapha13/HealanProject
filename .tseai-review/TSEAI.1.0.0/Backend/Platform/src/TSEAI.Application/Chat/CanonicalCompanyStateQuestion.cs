using System.Text.RegularExpressions;

namespace TSEAI.Application.Chat;

public enum CompanyStateAggregateKind
{
    None = 0,
    Statistics,
    StatusDistribution,
    StatusList,
    LatestChanges,
    EarliestChanges,
    ChangeYear,
    ReasonAnalysis,
    DataQuality,
    Schema,
    Comparison
}

public sealed record CanonicalCompanyStateQuestionIntent(
    bool IsMatch,
    CompanyStateAggregateKind Aggregate,
    IReadOnlyList<string> Fields,
    int Limit,
    int? JalaliYear,
    bool NamesOnly,
    bool ExplicitStateContext,
    string? LookupHint);

/// <summary>
/// Deterministic Persian semantics for dbo.Companystate. This table is a
/// current snapshot of suspension-related issuer state and must never be
/// interpreted as market price data or as proof that an absent symbol is active.
/// </summary>
public static class CanonicalCompanyStateQuestion
{
    private static readonly HashSet<string> LookupNoise = new(StringComparer.Ordinal)
    {
        "وضعیت","معاملاتی","شرکت","ناشر","نماد","بورسی","جدول","companystate","company","state",
        "تعلیق","تعلیقش","تعلیقی","شده","است","هست","هستش","میباشد","می باشد","مشمول","فرایند","فرآیند",
        "علت","دلیل","دلایل","چرا","تاریخ","آخرین","تغییر","زمان","از","چه","کی","موقع","کد","سامانه",
        "مدیرعامل","مدیر","عامل","ceo","اعضای","عضو","هیئت","هیات","مدیره","board","member","members",
        "نام","اسم","کامل","اطلاعات","مشخصات","فعلی","نمادش","شرکتی","چیست","کیست","چقدر","آن","این","همان","نسبت","فقط","را","رو","بگو","بده","نمایش","کن","کنید","لطفا","لطفاً",
        "سپس","بعد","بعدش","هم","اضافه","اضافهکن","اضافهکنید","دلیلش","علتش","مدیرعاملش","مدیرعاملشون","شرکتش","آنشرکت",
        "کدام","کدوم","کیا","کیان","چه کسانی","چه","کسی","هستند","هستن","هستند؟","مربوط","در","طبق","برای",
        "sourcecollectedat","statuscode","laststate","lastdatechange","kodnamaddarsamane","داده","منبع","جمع","آوری"
    };

    public static CanonicalCompanyStateQuestionIntent Parse(string? question)
    {
        var q=Normalize(question);
        var fields=new HashSet<string>(StringComparer.Ordinal);
        void Add(string field,params string[] aliases)
        {
            if(aliases.Any(x=>q.Contains(x,StringComparison.Ordinal))) fields.Add(field);
        }

        Add("status","وضعیت","تعلیق","توقف","قابل معامله","مشمول فرایند","مشمول فرآیند");
        Add("reason","علت","دلیل","دلایل","چرا","عدم ارائه","اشاره دارند","reason","dalil");
        Add("last_change","آخرین تغییر","تاریخ تغییر","زمان تغییر","از چه زمانی","از کی","lastdatechange");
        Add("system_code","کد نماد در سامانه","کد سامانه","کدناماددرسامانه","kodnamaddarsamane","شناسه سامانه");
        Add("company_name","نام شرکت","اسم شرکت","نام ناشر","شرکت مربوط","companyname");
        Add("symbol","نام نماد","خود نماد","نماد شرکت","نمادش","نماد چیست","symbol");
        Add("ceo","مدیرعامل","مدیر عامل","ceo");
        Add("board_members","اعضای هیئت مدیره","اعضای هیئت‌مدیره","اعضای هیات مدیره","هیئت مدیره","هیئت‌مدیره","هیات مدیره","boardmember","board member");
        Add("status_code","statuscode","کد وضعیت");
        Add("last_state","laststate","کد آخرین وضعیت","شناسه آخرین وضعیت");
        Add("source_collected_at","sourcecollectedat","زمان جمع آوری","زمان جمع‌آوری","زمان دریافت داده","آخرین بروزرسانی داده","آخرین به روزرسانی داده");
        Add("full","اطلاعات کامل وضعیت","مشخصات کامل وضعیت","همه اطلاعات وضعیت","رکورد کامل companystate");

        var explicitContext=ContainsAny(q,
            "companystate","company state","جدول وضعیت شرکت","جدول وضعیت نماد","داده وضعیت شرکت",
            "وضعیت شرکت ها","وضعیت شرکت‌های","وضعیت ناشران");
        var stateCue=ContainsAny(q,"تعلیق","مشمول فرایند","مشمول فرآیند","علت توقف","دلیل توقف","وضعیت نماد","وضعیت معاملاتی","آخرین تغییر وضعیت","کد وضعیت","کد سامانه","شناسه سامانه","laststate","statuscode","kodnamaddarsamane");
        var companyPersonCue=(fields.Contains("ceo")||fields.Contains("board_members"))
            && !q.Contains("بورس تهران",StringComparison.Ordinal)
            && !Regex.IsMatch(q,@"(?:^|\s)بورس(?:\s|$)");
        var detailCue=fields.Contains("source_collected_at")
            ||(fields.Contains("reason")&&fields.Contains("status"))
            ||(fields.Contains("status")&&ContainsAny(q,
                "چه وضعیتی دارد","چه وضعیتی داره","وضعیتش چیست","وضعیتش چیه","وضعیت آن چیست","وضعیت اون چیه"));

        var aggregate=DetectAggregate(q,fields,out var year);
        var isMatch=explicitContext||stateCue||companyPersonCue||detailCue||aggregate!=CompanyStateAggregateKind.None;
        return new(isMatch,aggregate,fields.ToArray(),DetectLimit(q),year,
            ContainsAny(q,"فقط اسم","فقط نام","فقط نماد","صرفا اسم","صرفاً اسم","اسامی را","نام ها","نام‌ها"),
            explicitContext||stateCue||companyPersonCue,ExtractLookupHint(q));
    }

    private static CompanyStateAggregateKind DetectAggregate(string q,HashSet<string> fields,out int? year)
    {
        year=ExtractJalaliYear(q);
        if(ContainsAny(q,"مقایسه","کدام دیرتر","کدوم دیرتر","کدام زودتر","کدوم زودتر")&&fields.Contains("last_change"))
            return CompanyStateAggregateKind.Comparison;
        if(ContainsAny(q,"معنی ستون","معنی فیلد","چه معنایی","چه مفهومی","نوع داده","lastdatechange","رابطه با instrument","وصل می شود","وصل میشه","foreign key","کلید خارجی","ایندکس","index","primary key","کلید اصلی")
            ||(q.Contains("companystate",StringComparison.Ordinal)&&ContainsAny(q,"قیمت","حجم","ارزش معاملات","اطلاعات مالی","تاریخچه")))
            return CompanyStateAggregateKind.Schema;
        if(ContainsAny(q,"کیفیت داده","فیلد خالی","مقادیر خالی","داده ناقص","تکراری","بدون مدیرعامل","فاقد مدیرعامل","بدون هیئت مدیره","فاقد هیئت مدیره","بدون اعضای هیئت مدیره","فاقد اعضای هیئت مدیره","یتیم","قابل اتصال به instrument"))
            return CompanyStateAggregateKind.DataQuality;
        if(fields.Contains("reason")&&ContainsAny(q,"رایج ترین","رایج‌ترین","فراوانی","چند نماد","چند شرکت","چند رکورد","تعداد نماد","تعداد رکورد","بیشترین علت","دسته علل","دسته دلایل"))
            return CompanyStateAggregateKind.ReasonAnalysis;
        if(year is not null&&ContainsAny(q,"تغییر وضعیت","وضعیتشان تغییر","آخرین تغییر","در سال")&&ContainsAny(q,"چند","کدام","کدوم","فهرست","لیست","نمادها","نماد ها","فقط نماد","شرکت ها","شرکت‌ها"))
            return CompanyStateAggregateKind.ChangeYear;
        if(fields.Contains("last_change")&&ContainsAny(q,"جدیدترین","اخیرترین","آخرین تغییرها","آخرین تغییرات","تازه ترین","تازه‌ترین"))
            return CompanyStateAggregateKind.LatestChanges;
        if(fields.Contains("last_change")&&ContainsAny(q,"قدیمی ترین","قدیمی‌ترین","کهنه ترین","کهنه‌ترین","اولین تغییرها","قدیمی ها","قدیمی‌ها"))
            return CompanyStateAggregateKind.EarliestChanges;
        if(fields.Contains("status")&&ContainsAny(q,"کدام نمادها","کدوم نمادها","چه نمادهایی","فهرست نماد","لیست نماد","فهرست","لیست","نمادهای تعلیق","شرکت های تعلیق","شرکت‌های تعلیق","فقط نماد"))
            return CompanyStateAggregateKind.StatusList;
        if(fields.Contains("status")&&ContainsAny(q,"چند نماد","چند شرکت","تعداد نماد","تعداد شرکت","تفکیک وضعیت","توزیع وضعیت","آمار وضعیت"))
            return CompanyStateAggregateKind.StatusDistribution;
        if(q.Contains("companystate",StringComparison.Ordinal)&&ContainsAny(q,"چند رکورد","تعداد رکورد","چند نماد","تعداد نماد","آمار جدول","کل جدول","بازه تاریخ","زمان جمع آوری","زمان جمع‌آوری"))
            return CompanyStateAggregateKind.Statistics;
        return CompanyStateAggregateKind.None;
    }

    private static string? ExtractLookupHint(string q)
    {
        var quoted=Regex.Match(q,"[\"«](?<v>[^\"»]{2,100})[\"»]");
        if(quoted.Success) return quoted.Groups["v"].Value.Trim();
        var tokens=Regex.Matches(q,@"[\p{L}\p{Nd}_\-‌]+")
            .Select(x=>x.Value.Trim())
            .Where(x=>x.Length>=2&&!LookupNoise.Contains(x))
            .Where(x=>!Regex.IsMatch(x,@"^(?:چنده|چیه|کیه|هستش|میشه|مربوطه|بگوید|نمایش)$"))
            .ToArray();
        return tokens.Length==0?null:string.Join(' ',tokens);
    }

    private static int DetectLimit(string q)
    {
        var match=Regex.Match(q,@"(?<n>[0-9۰-۹]{1,2})\s*(?:نماد|شرکت|مورد|تا)");
        if(match.Success&&int.TryParse(ToLatinDigits(match.Groups["n"].Value),out var value)) return Math.Clamp(value,1,20);
        var words=new Dictionary<string,int>(StringComparer.Ordinal){{"یک",1},{"دو",2},{"سه",3},{"چهار",4},{"پنج",5},{"شش",6},{"هفت",7},{"هشت",8},{"نه",9},{"ده",10}};
        foreach(var (word,count) in words)
            if(Regex.IsMatch(q,$@"(?:^|\s){word}\s+(?:نماد|شرکت|مورد)")) return count;
        return 10;
    }

    private static int? ExtractJalaliYear(string q)
    {
        var match=Regex.Match(ToLatinDigits(q),@"(?<!\d)(?<year>1[34][0-9]{2})(?!\d)");
        return match.Success&&int.TryParse(match.Groups["year"].Value,out var year)?year:null;
    }

    public static string Normalize(string? value)
    {
        var q=PersianDisplayText.Normalize(value??string.Empty).ToLowerInvariant().Replace('‌',' ')
            .Replace('ي','ی').Replace('ى','ی').Replace('ك','ک').Replace('ة','ه').Replace('ۀ','ه');
        q=Regex.Replace(q,@"[^\p{L}\p{Nd}_/\-""«»]+"," ");
        return Regex.Replace(q,@"\s+"," ").Trim();
    }

    public static string MatchKey(string? value)=>Regex.Replace(Normalize(value),@"[^\p{L}\p{Nd}]+",string.Empty);
    private static bool ContainsAny(string value,params string[] candidates)=>candidates.Any(x=>value.Contains(x,StringComparison.Ordinal));
    private static string ToLatinDigits(string value)=>string.Concat(value.Select(ch=>ch is >= '۰' and <= '۹'?(char)('0'+ch-'۰'):ch));
}
