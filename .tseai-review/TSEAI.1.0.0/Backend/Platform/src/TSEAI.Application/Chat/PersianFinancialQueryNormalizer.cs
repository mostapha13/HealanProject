using System.Text.RegularExpressions;

namespace TSEAI.Application.Chat;

/// <summary>
/// Corrects small, high-confidence typing errors in market-domain words before
/// deterministic routing. Entity names and symbols are deliberately excluded
/// from the vocabulary so fuzzy correction cannot silently change them.
/// </summary>
public static class PersianFinancialQueryNormalizer
{
    private static readonly string[] DomainTerms =
    [
        "معاملات","قیمت","پایانی","بازار","حجم"
    ];

    public static string Normalize(string? question)
    {
        if(string.IsNullOrWhiteSpace(question)) return question??string.Empty;
        var normalized=PersianDisplayText.Normalize(question)
            .Replace('ي','ی').Replace('ى','ی').Replace('ك','ک');
        normalized=Regex.Replace(normalized,@"[\p{L}‌]+",match=>Correct(match.Value));
        // «ارز معاملات» is a common two-token typo for the market metric
        // «ارزش معاملات». Keep ordinary uses such as «نرخ ارز» untouched.
        normalized=Regex.Replace(normalized,@"(?<![\p{L}])ارز\s+معاملات(?![\p{L}])","ارزش معاملات");
        return normalized;
    }

    private static string Correct(string token)
    {
        var key=token.Replace("‌",string.Empty,StringComparison.Ordinal);
        if(key.Length<4||DomainTerms.Contains(key,StringComparer.Ordinal)) return token;
        var validSuffixes=new[] { "ی","یی","ها","های","هایی","ش","شان","شون","مون","تون" };
        if(DomainTerms.Any(term=>validSuffixes.Any(suffix=>key==term+suffix))) return token;
        var candidates=DomainTerms
            .Where(term=>Math.Abs(term.Length-key.Length)<=1)
            .Select(term=>(Term:term,Distance:Distance(key,term)))
            .Where(x=>x.Distance<=1)
            .OrderBy(x=>x.Distance).ThenBy(x=>x.Term,StringComparer.Ordinal)
            .ToArray();
        if(candidates.Length==0||candidates.Count(x=>x.Distance==candidates[0].Distance)>1) return token;
        return candidates[0].Term;
    }

    private static int Distance(string left,string right)
    {
        var previous=Enumerable.Range(0,right.Length+1).ToArray();
        for(var i=1;i<=left.Length;i++)
        {
            var current=new int[right.Length+1];
            current[0]=i;
            for(var j=1;j<=right.Length;j++)
                current[j]=Math.Min(Math.Min(current[j-1]+1,previous[j]+1),previous[j-1]+(left[i-1]==right[j-1]?0:1));
            previous=current;
        }
        return previous[right.Length];
    }
}

/// <summary>Last-resort boundary that keeps internal diagnostics out of ordinary chat answers.</summary>
public static class PersianUserFacingAnswerPolicy
{
    public static string Sanitize(string question,string answer)
    {
        if(string.IsNullOrWhiteSpace(answer)||IsTechnicalQuestion(question)) return answer;
        var exposesDiagnostics=answer.Contains("Quality Gate",StringComparison.OrdinalIgnoreCase)
            ||answer.Contains("dbo.",StringComparison.OrdinalIgnoreCase)
            ||Regex.IsMatch(answer,@"جدول\s+[A-Za-z_]+\s+دارای",RegexOptions.IgnoreCase|RegexOptions.CultureInvariant)
            ||Regex.IsMatch(answer,@"\d[\d,٬]*\s+رکورد[^\n]{0,100}(?:معتبر|نامعتبر|بررسی)",RegexOptions.CultureInvariant);
        return exposesDiagnostics
            ? "برای این سؤال، پاسخ قابل اتکایی از داده‌های فعلی پیدا نشد."
            : answer;
    }

    private static bool IsTechnicalQuestion(string question)
    {
        var q=PersianDisplayText.Normalize(question).ToLowerInvariant();
        if(new[]
        {
            "جدول","dbo.","schema","اسکیما","ستون","فیلد","رکورد","کلید اصلی","کلید خارجی",
            "foreign key","primary key","کیفیت داده","دیتابیس","پایگاه داده","sql","instrument",
            "cashmarket","orderbook","clienttype","companystate","nahad_mali","company","content","tseperson"
        }.Any(x=>q.Contains(x,StringComparison.Ordinal))) return true;
        var aggregateCue=new[] { "چند","تعداد","آمار","متمایز","تکرار","تکراری","بدون","فاقد","بیشترین" }
            .Any(x=>q.Contains(x,StringComparison.Ordinal));
        var referenceDomain=q.Contains("نهاد مالی",StringComparison.Ordinal)
            ||q.Contains("نهادهای مالی",StringComparison.Ordinal)
            ||q.Contains("وضعیت شرکت",StringComparison.Ordinal)
            ||q.Contains("شرکت ها",StringComparison.Ordinal)
            ||q.Contains("شرکت‌ها",StringComparison.Ordinal)
            ||q.Contains("چند شرکت",StringComparison.Ordinal);
        return aggregateCue&&referenceDomain;
    }
}
