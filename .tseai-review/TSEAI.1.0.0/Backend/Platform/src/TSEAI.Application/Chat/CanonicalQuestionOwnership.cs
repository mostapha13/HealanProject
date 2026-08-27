using System.Text.RegularExpressions;

namespace TSEAI.Application.Chat;

public enum CanonicalQuestionDomain
{
    None = 0,
    Knowledge,
    ClientType,
    Company,
    CompanyState,
    Content,
    FinancialInstitution,
    Instrument
}

/// <summary>
/// Resolves the authoritative source of a question before the independent
/// table parsers run. Several landing tables deliberately share column names
/// such as SourceCollectedAt and concepts such as «تالار». Without this
/// arbitration, the first matching parser can answer from the wrong table.
/// </summary>
public static class CanonicalQuestionOwnership
{
    public static CanonicalQuestionDomain Detect(string? question)
    {
        var q=Normalize(question);
        if(q.Length==0) return CanonicalQuestionDomain.None;

        // An explicitly named table is the strongest authority boundary.
        if(ContainsAny(q,"جدول companystate","dbo companystate")||HasWord(q,"companystate")) return CanonicalQuestionDomain.CompanyState;
        if(ContainsAny(q,"جدول clienttype","dbo clienttype")||HasWord(q,"clienttype")||ContainsAny(q,"client type")) return CanonicalQuestionDomain.ClientType;
        if(ContainsAny(q,"جدول content","dbo content")||HasWord(q,"content")) return CanonicalQuestionDomain.Content;
        if(ContainsAny(q,"جدول nahad_mali","dbo nahad_mali")||HasWord(q,"nahad_mali")) return CanonicalQuestionDomain.FinancialInstitution;
        if(ContainsAny(q,"جدول company","dbo company")||HasWord(q,"company")) return CanonicalQuestionDomain.Company;
        if(ContainsAny(q,"جدول instrument","dbo instrument")||HasWord(q,"instrument")) return CanonicalQuestionDomain.Instrument;

        // Source-owned column names also form an explicit boundary. Table-name
        // checks above intentionally run first for cross-table schema questions.
        if(ContainsAny(q,"buy_i_volume","buy_n_volume","sell_i_volume","sell_n_volume","buy_counti","buy_countn","sell_counti","sell_countn","clienttype_counter","creationtime"))
            return CanonicalQuestionDomain.ClientType;
        if(ContainsAny(q,"contenttypeid","contentstatusid","languageid","departmentid","publishat","lastmodifiedat"))
            return CanonicalQuestionDomain.Content;
        if(ContainsAny(q,"lastdatechange","statuscode","kodnamaddarsamane","laststate","desctxt","dalayel","modiramel","aazayeheyatmodire"))
            return CanonicalQuestionDomain.CompanyState;
        if(ContainsAny(q,"ipo_date","talar_id")) return CanonicalQuestionDomain.Company;
        if(ContainsAny(q,"instrumentid","inscode","marketcateryid","industrysubid","psaisminokvalmdv","psaismaxokvalmdv","qtitminsaiomprod","qtitmaxsaiomprod","basevol","qnmvlo","ztitad"))
            return CanonicalQuestionDomain.Instrument;

        // Latest-news questions have a deterministic SQL answer. Other dated,
        // descriptive or event-specific questions belong to document evidence.
        if(ContainsAny(q,"آخرین خبر","جدیدترین خبر","خبر آخر","خبر تازه","تازه ترین خبر","تازه‌ترین خبر"))
            return CanonicalQuestionDomain.Content;
        if(RequiresDocumentEvidence(q)) return CanonicalQuestionDomain.Knowledge;

        // Semantic ownership where the Persian wording names a source concept.
        if(ContainsAny(q,"عرضه اولیه","عرضه شده")||
           (q.Contains("تالار",StringComparison.Ordinal)&&ContainsAny(q,"شرکت ها","شرکت های","شرکت‌ها","شرکت‌های","توزیع شرکت","شرکت اول","شرکت منتسب")))
            return CanonicalQuestionDomain.Company;
        // The current executive name is maintained by Companystate.Modiramel.
        // An explicitly named Company table was already handled above, so a
        // natural CEO question must not fall through to Company.CEO (which is
        // nullable in the landing data and is not the current-role authority).
        if(HasWord(q,"ceo")
           ||(ContainsAny(q,"مدیرعامل","مدیر عامل")
              &&!ContainsAny(q,"بورس تهران","بورس اوراق بهادار تهران")))
            return CanonicalQuestionDomain.CompanyState;
        if(ContainsAny(q,"نهاد مالی","نهادهای مالی","کارگزاری","سبدگردان","تامین سرمایه","تأمین سرمایه","مشاور سرمایه گذاری","مشاور سرمایه‌گذاری")&&
           ContainsAny(q,"شعبه","تالار","شماره تماس","آدرس","فهرست","لیست","چند","تعداد","نوع نهاد"))
            return CanonicalQuestionDomain.FinancialInstitution;
        if(ContainsAny(q,"تعلیق","مشمول فرایند تعلیق","تغییر وضعیت","دلیل وضعیت","علت وضعیت","وضعیت نماد"))
            return CanonicalQuestionDomain.CompanyState;
        if(ContainsAny(q,"حقیقی","حقوقی")&&ContainsAny(q,"خرید","فروش","خریدار","فروشنده","قدرت خریدار","سرانه"))
            return CanonicalQuestionDomain.ClientType;
        return CanonicalQuestionDomain.None;
    }

    public static bool RequiresDocumentEvidence(string? question)
    {
        var q=Normalize(question);
        if(q.Length==0) return false;
        if(ContainsAny(q,"در گزارش","طبق گزارش","در خبر","طبق خبر","خبر تازه","در مراسم","طبق اطلاعیه","تاریخچه","چه سالی تاسیس","چه سالی تأسیس","به جمع ناشران","ناشر پذیرفته شده","ناشر پذیرفته‌شده")) return true;
        if(ContainsAny(q,"اوراق مرابحه","صکوک مرابحه","اوراق ایراندار","صدار704","صدار 704")&&
           ContainsAny(q,"نماد","ارزش","نرخ سود","هدف","دوره عمر","پرداخت سود","ناشر","تضمین","رتبه","بازارگردان","موسسه رتبه بندی","مؤسسه رتبه‌بندی","حسابرس","عامل فروش","عامل پرداخت")) return true;
        if(ContainsAny(q,"صندوق مسیر سبز","صندوق سبز آبنوس","سبز آبنوس","صندوق دلتا","صندوق بخشی صنایع تمدن")&&
           ContainsAny(q,"نماد","واحد","پذیره نویسی","پذیره‌نویسی","موسس","مؤسس","بنیان گذار","بنیان‌گذار","مدیر","مدیریت","متولی","حسابرس","بازارگردان","کارگزار","سایت","اطلاعات بیشتر")) return true;
        if(ContainsAny(q,"ریزساختار معاملات","ریختار معاملات","طبقات حجمی سفارش","تغییرات جدید سفارش","اصلاح طبقات","حداقل تغییر قیمت","حداکثر حجم هر سفارش طبق تغییر")) return true;
        var asksAcceptanceProcess=q.Contains("پذیرش",StringComparison.Ordinal)
            && q.Contains("ناشر",StringComparison.Ordinal)
            && ContainsAny(q,"فرایند","فرآیند");
        if((ContainsAny(q,"بازار خصوصی","اولویت پذیرش")||asksAcceptanceProcess)&&
           ContainsAny(q,"طراحی","خبر داده","چه شرکت","هدف","گودرزی","الکترونیکی","دیجیتال")) return true;
        return false;
    }

    private static string Normalize(string? value)
    {
        var q=PersianDisplayText.Normalize(value??string.Empty).ToLowerInvariant().Replace('‌',' ')
            .Replace('ي','ی').Replace('ى','ی').Replace('ك','ک').Replace('ة','ه').Replace('ۀ','ه');
        q=string.Concat(q.Select(ch=>ch switch
        {
            >= '۰' and <= '۹'=>(char)('0'+ch-'۰'),
            >= '٠' and <= '٩'=>(char)('0'+ch-'٠'),
            _=>ch
        }));
        q=Regex.Replace(q,@"[^\p{L}\p{Nd}_]+"," ");
        return Regex.Replace(q,@"\s+"," ").Trim();
    }

    private static bool HasWord(string text,string word)=>Regex.IsMatch(text,$@"(?:^|\s){Regex.Escape(word)}(?:\s|$)",RegexOptions.CultureInvariant);
    private static bool ContainsAny(string text,params string[] values)=>values.Any(x=>text.Contains(x,StringComparison.Ordinal));
}
