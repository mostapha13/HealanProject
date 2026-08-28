using System.Text.RegularExpressions;

namespace TSEAI.Application.Chat;

public enum FinancialInstitutionAggregateKind
{
    None = 0,
    Statistics,
    TypeDistribution,
    HallDistribution,
    HallInstitutions,
    TypeInstitutions,
    Branches,
    Comparison,
    DataQuality,
    SourceTimestamp,
    Schema
}

public sealed record CanonicalFinancialInstitutionQuestionIntent(
    bool IsMatch,
    FinancialInstitutionAggregateKind Aggregate,
    IReadOnlyList<string> Fields,
    IReadOnlyList<string> Lookups,
    Guid? RecordId,
    string? TypeHint,
    int Limit,
    bool NamesOnly);

/// <summary>
/// Deterministic Persian semantics for dbo.Nahad_Mali. Each row represents a
/// regional branch/office of a financial institution, so a repeated title is
/// not automatically a duplicate institution.
/// </summary>
public static class CanonicalFinancialInstitutionQuestion
{
    private static readonly string[] MetricPhrases =
    [
        "شماره تلفن ثبت شده","شماره تلفن","شماره تماس","اطلاعات تماس","راه ارتباطی","تلفن",
        "نشانی دقیق","آدرس دقیق","نشانی شعبه","آدرس شعبه","نشانی","آدرس","کجاست","کجا قرار دارد",
        "نوع نهاد مالی","نوع نهاد","نوع فعالیت","نوع موسسه","نوع مؤسسه","چه نوع نهادی","چه نوع موسسه ای","چه نوع مؤسسه ای",
        "تالار منطقه ای","تالار منطقه‌ای","تالار مربوطه","تالار ثبت شده","کدام تالار","کدوم تالار","چه تالاری",
        "چند شعبه","تعداد شعبه","تعداد شعب","شعبه ها","شعبه‌های","شعبه های","فهرست شعب","لیست شعب","کجاها شعبه",
        "زمان جمع آوری","زمان جمع‌آوری","تاریخ جمع آوری","تاریخ جمع‌آوری","آخرین بروزرسانی","آخرین به روزرسانی","آخرین به‌روزرسانی","sourcecollectedat",
        "شناسه رکورد","شناسه نهاد","nahad mali id","nahad_mali id","broker type id","brokertypeid",
        "مشخصات کامل","اطلاعات کامل","همه اطلاعات","نام نهاد","اسم نهاد"
    ];

    private static readonly HashSet<string> LookupNoise = new(StringComparer.OrdinalIgnoreCase)
    {
        "نهاد","نهادها","نهادهای","مالی","موسسه","مؤسسه","شرکت","دفتر","مرکز","شعبه","شعب","نمایندگی",
        "کارگزاری","کارگزاریها","کارگزار","سبدگردان","سبدگردانها","سبد","گردان","مشاور","مشاوران","سرمایه","گذاری","تامین","تأمین","صندوق","مشترک",
        "جدول","رکورد","داده","sql","nahad","mali","nahad_mali","اطلاعات","مشخصات","کامل","ثبت","شده","فعلی",
        "نام","اسم","نوع","فعالیت","تلفن","شماره","تماس","راه","ارتباطی","آدرس","نشانی","مکان","محل",
        "تالار","منطقه","منطقه‌ای","منطقه ای","استان","شهر","کد","شناسه","brokertypeid","sourcecollectedat",
        "چند","چندتا","چنتا","تعداد","کدام","کدوم","چه","کیا","کجا","کجاها","چطور","چیه","چیست","چنده","کی","مربوطه",
        "است","هست","هستن","دارد","دارند","داره","میباشد","می‌باشد","باشد","شد","شده","میشه","می‌شود","ها","های",
        "را","رو","بهم","بگو","بده","نمایش","اعلام","کن","کنید","لطفا","لطفاً","برای","در","از","به","با","و","یا",
        "فهرست","لیست","تفکیک","بر","اساس","اول","اولین","تا","مورد","بیشترین","کمترین","بالاترین","پایینترین","رتبه",
        "مقایسه","مقایسه‌کن","مقایسهکن","بیشتر","بیشتری","کمتر","فقط","اسامی","نام‌ها","نامهای","شعبه‌ها","شعبه‌های","همه","مجموع","وجود","نامشان","اند","هستند",
        "آذربایجان","شرقی","غربی","خراسان","رضوی","جنوبی","شمالی","اصفهان","البرز","کرج","فارس","شیراز","زنجان",
        "مازندران","ساری","یزد","کرمانشاه","قزوین","خوزستان","اهواز","کرمان","کیش","گیلان","رشت","قم","همدان",
        "مرکزی","سمنان","لرستان","اردبیل","گلستان","چهارمحال","بختیاری","کردستان","هرمزگان","بندرعباس","بوشهر",
        "سیستان","بلوچستان","زاهدان","ایلام","کهگیلویه","بویراحمد","تبریز","ارومیه","مشهد","بیرجند","شهرکرد"
    };

    public static CanonicalFinancialInstitutionQuestionIntent Parse(string? question)
    {
        var q=Normalize(question);
        var fields=new HashSet<string>(StringComparer.Ordinal);
        void Add(string field,params string[] aliases)
        {
            if(aliases.Any(x=>q.Contains(x,StringComparison.Ordinal))) fields.Add(field);
        }

        Add("title","نام نهاد","اسم نهاد","نام موسسه","نام مؤسسه");
        Add("type","نوع نهاد","نوع فعالیت","چه نوع نهادی","کارگزاری است یا","سبدگردان است یا");
        Add("phone","شماره تلفن","شماره تماس","اطلاعات تماس","راه ارتباطی","تلفن");
        if(q.Contains("اطلاعات تماس",StringComparison.Ordinal)) fields.Add("address");
        Add("address","نشانی","آدرس","کجاست","کجا قرار دارد","محل شعبه");
        Add("hall","تالار منطقه ای","تالار منطقه‌ای","تالار مربوطه","کدام تالار","کدوم تالار","چه تالاری","استان فعالیت");
        Add("source_collected_at","sourcecollectedat","زمان جمع آوری","زمان جمع‌آوری","تاریخ جمع آوری","تاریخ جمع‌آوری","آخرین بروزرسانی","آخرین به روزرسانی","آخرین به‌روزرسانی");
        Add("record_id","شناسه رکورد","شناسه نهاد","nahad mali id","nahad_mali id");
        Add("broker_type_id","broker type id","brokertypeid","broker_typeid");
        Add("full","مشخصات کامل","اطلاعات کامل","همه اطلاعات");

        var recordId=ExtractGuid(q);
        var typeHint=DetectType(q);
        var aggregate=DetectAggregate(q,fields,typeHint);
        var comparison=aggregate==FinancialInstitutionAggregateKind.Comparison;
        var lookups=ExtractLookupTexts(q,comparison);
        var mentionsTable=ContainsAny(q,"nahad_mali","nahad mali","جدول نهاد مالی","جدول نهادهای مالی");
        var mentionsInstitution=ContainsAny(q,"نهاد مالی","نهادهای مالی","نهاد های مالی","کارگزاری","کارگزار","سبدگردان","سبد گردان","مشاور سرمایه گذاری","مشاور سرمایه‌گذاری","تامین سرمایه","تأمین سرمایه","موسسه مالی","مؤسسه مالی");
        var isMatch=aggregate!=FinancialInstitutionAggregateKind.None||recordId is not null||mentionsTable||
            (mentionsInstitution&&(fields.Count>0||lookups.Count>0||typeHint is not null));
        var asksCount=ContainsAny(q,"چند نهاد","چندتا نهاد","چنتا نهاد","تعداد نهاد","چند کارگزاری","چندتا کارگزاری","چنتا کارگزاری","تعداد کارگزاری","چند سبدگردان","تعداد سبدگردان","چند رکورد","تعداد رکورد","شمارش","تعدادش");
        var namesOnly=ContainsAny(q,"فقط اسم","فقط نام","فقط اسامی","اسامی را","نام‌ها را")
            ||aggregate==FinancialInstitutionAggregateKind.HallInstitutions&&!asksCount
              &&!fields.Contains("phone")&&!fields.Contains("address")
              &&ContainsAny(q,"کیا","فهرست","لیست","چه نهاد","کدام نهاد","کدوم نهاد","نهاد های مالی","نهادهای مالی","کارگزاری ها","کارگزاری های","کارگزاری‌ها","سبدگردان ها","سبدگردان های","سبدگردان‌ها","مشاوران");
        return new(isMatch,aggregate,fields.ToArray(),lookups,recordId,typeHint,DetectLimit(q),namesOnly);
    }

    private static FinancialInstitutionAggregateKind DetectAggregate(string q,HashSet<string> fields,string? typeHint)
    {
        var hasFinancialScope=HasFinancialScope(q);
        if(hasFinancialScope&&(ContainsAny(q,"معنی ستون","معنی فیلد","چه ستون","ساختار جدول","schema","کلید اصلی","primary key","کلید خارجی","foreign key","ایندکس","index")
            ||(ContainsAny(q,"nahad_mali","nahad mali","talar","nahad_mali_type")&&ContainsAny(q,"رابطه","مرتبط","اتصال","وصل"))
            ||ContainsAny(q,"قیمت","حجم معاملات","ارزش معاملات","صورت مالی")))
            return FinancialInstitutionAggregateKind.Schema;
        if((hasFinancialScope||(q.Contains("نهاد",StringComparison.Ordinal)&&q.Contains("تالار",StringComparison.Ordinal)))&&
            ContainsAny(q,"کیفیت داده","داده ناقص","مقدار خالی","فیلد خالی","عنوان خالی","تلفن خالی","آدرس خالی","نشانی خالی","رکورد یتیم","بدون نوع","بدون تالار","تلفن نامعتبر","شماره نامعتبر","رکورد تکراری","رکوردهای کاملا تکراری","کاملا تکراری","تکراری دقیق","ردیف اضافه","تکرار نام")
            ||((q.Contains("broker_typeid",StringComparison.Ordinal)||q.Contains("broker type id",StringComparison.Ordinal))&&q.Contains("خالی",StringComparison.Ordinal)))
            return FinancialInstitutionAggregateKind.DataQuality;
        if((ContainsAny(q,"nahad_mali","جدول نهاد مالی","جدول نهادهای مالی")&&ContainsAny(q,"چند رکورد","تعداد رکورد","چند نهاد","تعداد نهاد","چند عنوان","تعداد عنوان","چند تالار","تعداد تالار","چند نوع","تعداد نوع","آمار جدول","وضعیت جدول","کل جدول"))
            ||(q.Contains("آمار",StringComparison.Ordinal)&&q.Contains("نهاد",StringComparison.Ordinal)&&ContainsAny(q,"کلی","خلاصه","چند","تعداد")))
            return FinancialInstitutionAggregateKind.Statistics;
        if(fields.Contains("source_collected_at")&&ContainsAny(q,"جدول","کل داده","همه رکورد","آخرین"))
            return FinancialInstitutionAggregateKind.SourceTimestamp;
        if(ContainsAny(q,"توزیع نوع","تفکیک نوع","هر نوع نهاد","تعداد هر نوع","بیشترین نوع نهاد","نوع های نهاد","نوع‌های نهاد")
            ||(q.Contains("نوع",StringComparison.Ordinal)&&ContainsAny(q,"هیچ رکوردی ندارند","بدون رکورد","صفر رکورد")))
            return FinancialInstitutionAggregateKind.TypeDistribution;
        if(ContainsAny(q,"توزیع تالار","تفکیک تالار","هر تالار چند","به تفکیک تالار","بیشترین نهاد مالی","بیشترین شعبه","کمترین نهاد مالی","بر اساس تالار","از نظر تعداد شعب")&&ContainsAny(q,"تالار","استان","شهر","نهاد","شعبه"))
            return FinancialInstitutionAggregateKind.HallDistribution;
        if(ContainsAny(q,"مقایسه","کدام شعبه بیشتر","کدوم شعبه بیشتر","کدام نهاد شعب بیشتری","کدوم نهاد شعب بیشتری","بیشتر شعبه دارد","بیشتر شعبه داره")
            ||(q.Contains("شعب",StringComparison.Ordinal)&&q.Contains("بیشتری",StringComparison.Ordinal)&&ContainsAny(q,"کدام کارگزاری","کدوم کارگزاری","یا")))
            return FinancialInstitutionAggregateKind.Comparison;
        if(ContainsAny(q,"شعبه","شعب","کجاها","چند تالار")&&!ContainsAny(q,"جدول","هر تالار","تفکیک تالار","بیشترین شعبه"))
            return FinancialInstitutionAggregateKind.Branches;
        var asksListOrCount=ContainsAny(q,"فهرست","لیست","کدام نهاد","کدوم نهاد","چه نهاد","چند نهاد","چندتا نهاد","چنتا نهاد","تعداد نهاد","نهاد های مالی","نهادهای مالی","کدام کارگزاری","کدوم کارگزاری","چه کارگزاری","چند کارگزاری","چندتا کارگزاری","چنتا کارگزاری","تعداد کارگزاری","کارگزاری ها","کارگزاری های","کارگزاری‌ها","چند مشاور","تعداد مشاور","مشاوران","چند سبدگردان","تعداد سبدگردان","سبدگردان ها","سبدگردان های","سبدگردان‌ها","چند رکورد","تعداد رکورد","شمارش","تعدادش","فقط اسم","فقط نام","همه سبدگردان","در مجموع");
        if(asksListOrCount&&(q.Contains("تالار",StringComparison.Ordinal)||ContainsAny(q,"استان","اهواز","خوزستان","اصفهان","مشهد","شیراز","تبریز","کرج","یزد","کیش","رشت","ساری","قم","همدان","کرمان","کرمانشاه","قزوین","زنجان","لرستان","اردبیل","بوشهر","سمنان","ارومیه","بندرعباس","بیرجند","بجنورد","زاهدان","ایلام","یاسوج","شهرکرد","گرگان","سنندج","اراک")))
            return FinancialInstitutionAggregateKind.HallInstitutions;
        if(asksListOrCount&&typeHint is not null)
            return FinancialInstitutionAggregateKind.TypeInstitutions;
        return FinancialInstitutionAggregateKind.None;
    }

    private static IReadOnlyList<string> ExtractLookupTexts(string q,bool comparison)
    {
        var value=q;
        foreach(var phrase in MetricPhrases.OrderByDescending(x=>x.Length)) value=value.Replace(phrase," ",StringComparison.OrdinalIgnoreCase);
        value=Regex.Replace(value,@"(?i)\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b"," ");
        var segments=comparison
            ? Regex.Split(value,@"\s+(?:را\s+با|در\s+برابر|نسبت\s+به|با)\s+|\s+(?:و|یا)\s+")
            : [value];
        var result=new List<string>();
        foreach(var segment in segments)
        {
            var tokens=Regex.Matches(segment,@"[\p{L}\p{Nd}_‌\-()]+")
                .Select(x=>x.Value.Trim('(',')'))
                .Where(x=>x.Length>=2&&!LookupNoise.Contains(x))
                .Where(x=>!Regex.IsMatch(x.Replace("‌",string.Empty,StringComparison.Ordinal),@"^(?:چند|کدام|کدوم|چی|میشه|میباشد|مربوط|شعبه).*$"))
                .ToArray();
            var candidate=string.Join(' ',tokens).Trim();
            if(candidate.Length>0&&!result.Contains(candidate,StringComparer.OrdinalIgnoreCase)) result.Add(candidate);
        }
        return result.Take(comparison?2:1).ToArray();
    }

    public static string? DetectType(string normalizedQuestion)
    {
        if(ContainsAny(normalizedQuestion,"مشاور سرمایه گذاری","مشاور سرمایه‌گذاری","مشاور سرمایه گذرای","مشاوران سرمایه گذاری","مشاوران سرمایه‌گذاری")) return "مشاور سرمایه گذاری";
        if(ContainsAny(normalizedQuestion,"تامین سرمایه","تأمین سرمایه")) return "تامین سرمایه";
        if(ContainsAny(normalizedQuestion,"سبدگردان","سبد گردان")) return "سبدگردان";
        if(ContainsAny(normalizedQuestion,"کارگزاری","کارگزار")) return "کارگزاری";
        return null;
    }

    public static string MatchKey(string? value)
    {
        var q=Normalize(value);
        q=Regex.Replace(q,@"^(?:شرکت|موسسه|مؤسسه|کارگزاری|کارگزار|سبدگردان|سبد گردان|مشاور سرمایه گذاری|مشاور سرمایه گذرای|تامین سرمایه|تأمین سرمایه|صندوق سرمایه گذاری مشترک)\s+","",RegexOptions.CultureInvariant);
        q=Regex.Replace(q,@"\s*\((?:شعبه|دفتر پذیرش)\)\s*$","",RegexOptions.CultureInvariant);
        return Regex.Replace(q,@"[^\p{L}\p{Nd}]+",string.Empty,RegexOptions.CultureInvariant);
    }

    public static string Normalize(string? value)
    {
        var q=PersianDisplayText.Normalize(value??string.Empty).ToLowerInvariant().Replace('‌',' ')
            .Replace('ي','ی').Replace('ى','ی').Replace('ك','ک').Replace('ة','ه').Replace('ۀ','ه');
        q=Regex.Replace(q,@"[^\p{L}\p{Nd}_/()\-.]+"," ");
        return Regex.Replace(q,@"\s+"," ").Trim();
    }

    public static bool HasHistoricalReference(string? value)
    {
        var q=ToLatinDigits(Normalize(value));
        return Regex.IsMatch(q,@"(?<!\d)1[34][0-9]{2}(?!\d)")&&ContainsAny(q,"سال","در تاریخ","در گذشته","آن زمان","اون زمان");
    }

    private static Guid? ExtractGuid(string q)
    {
        var match=Regex.Match(q,@"(?i)(?<id>[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})");
        return match.Success&&Guid.TryParse(match.Groups["id"].Value,out var value)?value:null;
    }

    private static bool HasFinancialScope(string q)=>ContainsAny(q,
        "nahad_mali","nahad mali","nahad_mali_type","جدول نهاد مالی","جدول نهادهای مالی","نهاد مالی","نهاد های مالی","نهادهای مالی",
        "کارگزاری","کارگزار","سبدگردان","سبد گردان","مشاور سرمایه","تامین سرمایه","تأمین سرمایه","broker_typeid","broker type id");

    private static int DetectLimit(string q)
    {
        var match=Regex.Match(q,@"(?<n>[0-9۰-۹]{1,2})\s*(?:نهاد|کارگزاری|سبدگردان|شعبه|تالار|مورد|تا)");
        if(match.Success&&int.TryParse(ToLatinDigits(match.Groups["n"].Value),out var value)) return Math.Clamp(value,1,25);
        var words=new Dictionary<string,int>(StringComparer.Ordinal){{"یک",1},{"دو",2},{"سه",3},{"چهار",4},{"پنج",5},{"شش",6},{"هفت",7},{"هشت",8},{"نه",9},{"ده",10}};
        foreach(var (word,count) in words)
            if(Regex.IsMatch(q,$@"(?:^|\s){word}\s+(?:نهاد|کارگزاری|سبدگردان|شعبه|تالار|مورد)")) return count;
        return 10;
    }

    private static bool ContainsAny(string value,params string[] candidates)=>candidates.Any(x=>value.Contains(x,StringComparison.Ordinal));
    private static string ToLatinDigits(string value)=>string.Concat(value.Select(ch=>ch is >= '۰' and <= '۹'?(char)('0'+ch-'۰'):ch));
}
