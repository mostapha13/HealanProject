using System.Text.RegularExpressions;

namespace TSEAI.Application.Chat;

public sealed record CanonicalMarketCompositeAnalysis(
    bool IsComposite,
    string? Symbol,
    IReadOnlyList<string> MarketFields);

public sealed record MarketComparisonEntities(string Primary,string Secondary);

/// <summary>
/// Deterministic facet analysis for questions that need more than one bounded
/// data source. It prevents a complete canonical SQL answer from hiding an
/// independent market facet and extracts the entity of symbol-specific news.
/// </summary>
public static class PersianQuestionFacetAnalysis
{
    private static readonly HashSet<string> CanonicalOwnedMarketFields = new(StringComparer.Ordinal)
    {
        "identity","instrument_id","ins_code","market","board","industry","state","market_summary",
        "observed_at","orderbook_observed_at","updated_at","source_collected_at"
    };

    private static readonly HashSet<string> TargetNoise = new(StringComparer.Ordinal)
    {
        "آخرین","جدیدترین","جدید","جدیدی","تازه","تازهترین","خبر","اخبار","خبرش","نام","اسم","نماد","شرکت","بورسی",
        "چیست","چیه","کدام","کدوم","بگو","بده","را","رو","لطفا","لطفاً","مربوط","به",
        "و","همچنین","حجم","ارزش","تعداد","معاملات","معامله","قیمت","پایانی","بازار","چقدر",
        "است","هست","هستش","داری","دارید","داره","اگر","خلاصه","خطی","یک","میباشد","می","باشد","آن","اون","این","اش","اشو"
    };

    public static CanonicalMarketCompositeAnalysis AnalyzeCanonicalMarket(
        string question,CanonicalReferenceAnswer? canonical)
    {
        if(canonical is null)
            return new(false,null,[]);

        var fields=PersianMarketQuestionSemantics.DetectRequestedFields(question)
            .Where(x=>!CanonicalOwnedMarketFields.Contains(x))
            .Distinct(StringComparer.Ordinal)
            .ToArray();
        if(fields.Length==0)
            return new(false,null,[]);

        var symbol=canonical.Facts
            .Where(x=>x.Key is "linked_symbol" or "symbol")
            .Select(x=>x.Value?.Trim())
            .FirstOrDefault(x=>!string.IsNullOrWhiteSpace(x));
        return string.IsNullOrWhiteSpace(symbol)
            ? new(false,null,[])
            : new(true,symbol,fields);
    }

    public static string? TryExtractTargetedNewsEntity(string? question)
    {
        var q=Normalize(question);
        if(!ContainsAny(q,"آخرین خبر","جدیدترین خبر","تازه ترین خبر","خبر آخر","خبر تازه")
           &&!Regex.IsMatch(q,@"(?:خبر|اخبار)\s+(?:جدید|جدیدی|تازه)(?:\s+از\s+|\s+(?:نماد|شرکت)\s+)")
           &&!Regex.IsMatch(q,@"(?:از|درباره)\s+.+?\s+چه\s+خبر")
           && !(q.Contains("خبر",StringComparison.Ordinal)&&q.Contains("نماد",StringComparison.Ordinal)))
            return null;

        var explicitSymbol=Regex.IsMatch(q,@"(?:^|\s)نماد(?:\s|$)");
        var possessive=Regex.Match(q,
            @"^(?<before>.+?)\s+و\s+(?:آخرین|جدیدترین|تازه\s*ترین)\s+خبرش(?:\s|$)");
        var direct=Regex.Match(q,
            @"(?:آخرین|جدیدترین|تازه\s*ترین)\s+خبر(?:\s+(?:نماد|شرکت))?\s+(?<after>.+)$");
        var reverse=Regex.Match(q,@"خبر\s+(?:آخر|تازه)(?:\s+(?:نماد|شرکت))?\s+(?<after>.+)$");
        var natural=Regex.Match(q,
            @"(?:خبر|اخبار)\s+(?:جدید|جدیدی|تازه)\s+از\s+(?<after>.+?)(?=\s+(?:داری|دارید|داره|هست|منتشر|اگر|و\s+(?:حجم|ارزش|قیمت|تعداد))|$)");
        var whatNews=Regex.Match(q,
            @"(?:از|درباره)\s+(?<after>.+?)\s+چه\s+خبر(?:ی)?(?:\s|$)");
        var value=possessive.Success?possessive.Groups["before"].Value
            :direct.Success?direct.Groups["after"].Value
            :reverse.Success?reverse.Groups["after"].Value
            :natural.Success?natural.Groups["after"].Value
            :whatNews.Success?whatNews.Groups["after"].Value
            :q;
        string[] phrases=
        [
            "آخرین خبرش","جدیدترین خبرش","تازه ترین خبرش",
            "آخرین خبر","جدیدترین خبر","تازه ترین خبر","خبر آخر","خبر تازه",
            "حجم معاملات","ارزش معاملات","تعداد معاملات","آخرین قیمت","قیمت پایانی","ارزش بازار",
            "نسبت قیمت به سود","پی بر ای","پی ای","سود هر سهم"
        ];
        foreach(var phrase in phrases.OrderByDescending(x=>x.Length))
            value=value.Replace(phrase," ",StringComparison.Ordinal);

        var tokens=Regex.Matches(value,@"[\p{L}\p{Nd}_\-]+")
            .Select(x=>x.Value)
            .Where(x=>x.Length>=2&&!TargetNoise.Contains(x))
            .Where(x=>!Regex.IsMatch(x,@"^(?:چنده|چی|میشه|مربوطه|داره|دارد|بود)$"))
            .Take(6)
            .ToArray();
        if(tokens.Length==0) return null;
        var candidate=string.Join(' ',tokens);
        if(!explicitSymbol&&candidate is "بورس" or "بورس تهران" or "تهران" or "بازار سرمایه")
            return null;
        return candidate;
    }

    public static MarketComparisonEntities? TryExtractMarketComparisonEntities(string? question)
    {
        var q=Normalize(question);
        if(!ContainsAny(q,"مقایسه","بین","کدام بیشتر","کدوم بیشتر","اختلافشان","اختلاف شون"))
            return null;

        var match=Regex.Match(q,
            @"(?:^|\s)بین\s+(?:نماد\s+)?(?<left>.+?)\s+و\s+(?:نماد\s+)?(?<right>.+?)(?=\s+(?:کدام|کدوم|از\s+نظر|چه\s+تفاوت|اختلاف|را\s+مقایسه|رو\s+مقایسه)|$)");
        if(!match.Success)
            match=Regex.Match(q,
                @"(?:نماد\s+)?(?<left>[^\s]+)\s+(?:را\s+با|رو\s+با|با)\s+(?:نماد\s+)?(?<right>[^\s]+)\s+(?:از\s+نظر|مقایسه)");
        if(!match.Success) return null;

        static string Clean(Group group)
        {
            var value=Regex.Replace(group.Value,@"^(?:نماد|سهم|شرکت)\s+"," ").Trim();
            value=Regex.Replace(value,@"\s+(?:نماد|سهم|شرکت)$"," ").Trim();
            return value;
        }
        var left=Clean(match.Groups["left"]);
        var right=Clean(match.Groups["right"]);
        return left.Length<2||right.Length<2||string.Equals(left,right,StringComparison.Ordinal)
            ?null:new(left,right);
    }

    public static IReadOnlyList<string> SplitIndependentClauses(string? question)
    {
        var value=PersianDisplayText.Normalize(question??string.Empty).Replace('‌',' ').Trim();
        if(value.Length==0) return [];
        value=Regex.Replace(value,@"[،؛;]+"," | ");
        value=Regex.Replace(value,@"\s+و\s+(?=(?:آخرین|جدیدترین|تازه|مدیرعامل|مدیر عامل|رئیس|نام|اسم|نماد|قیمت|حجم|ارزش|تعداد|نسبت|علت|دلیل|امروز|فردا|دیروز|چه|کدام|کدوم))"," | ");
        return value.Split('|',StringSplitOptions.RemoveEmptyEntries|StringSplitOptions.TrimEntries)
            .Select(x=>Regex.Replace(x,@"\s+"," ").Trim(' ','؟','?','.'))
            .Where(x=>x.Length>=3)
            .Distinct(StringComparer.Ordinal)
            .Take(4)
            .ToArray();
    }

    public static string? TryExtractDescriptiveEntity(string? question)
    {
        var q=Normalize(question);
        var match=Regex.Match(q,
            @"(?:درباره|در مورد)\s+(?:نماد\s+|شرکت\s+)?(?<entity>.+?)\s+(?:چه\s+میدانی|چه\s+میدونی|چه\s+می\s+دانی|چه\s+می\s+دونی|توضیح\s+بده|معرفی\s+کن)(?:\s|$)");
        if(!match.Success) return null;
        var tokens=Regex.Matches(match.Groups["entity"].Value,@"[\p{L}\p{Nd}_\-]+")
            .Select(x=>x.Value).Where(x=>x.Length>=2&&!TargetNoise.Contains(x)).Take(6).ToArray();
        return tokens.Length==0?null:string.Join(' ',tokens);
    }

    private static string Normalize(string? value)
    {
        var q=PersianDisplayText.Normalize(value??string.Empty).ToLowerInvariant().Replace('‌',' ')
            .Replace('ي','ی').Replace('ى','ی').Replace('ك','ک').Replace('ة','ه').Replace('ۀ','ه');
        q=Regex.Replace(q,@"[^\p{L}\p{Nd}_/\-]+"," ");
        return Regex.Replace(q,@"\s+"," ").Trim();
    }

    private static bool ContainsAny(string value,params string[] candidates)
        => candidates.Any(x=>value.Contains(x,StringComparison.Ordinal));
}
