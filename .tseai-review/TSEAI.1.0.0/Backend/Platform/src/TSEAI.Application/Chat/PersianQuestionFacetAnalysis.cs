using System.Text.RegularExpressions;

namespace TSEAI.Application.Chat;

public sealed record CanonicalMarketCompositeAnalysis(
    bool IsComposite,
    string? Symbol,
    IReadOnlyList<string> MarketFields);

/// <summary>
/// Deterministic facet analysis for questions that need more than one bounded
/// data source. It prevents a complete canonical SQL answer from hiding an
/// independent market facet and extracts the entity of symbol-specific news.
/// </summary>
public static class PersianQuestionFacetAnalysis
{
    private static readonly HashSet<string> CanonicalOwnedMarketFields = new(StringComparer.Ordinal)
    {
        "identity","instrument_id","ins_code","market","board","industry","state",
        "observed_at","orderbook_observed_at","updated_at","source_collected_at"
    };

    private static readonly HashSet<string> TargetNoise = new(StringComparer.Ordinal)
    {
        "آخرین","جدیدترین","تازه","تازهترین","خبر","اخبار","خبرش","نماد","شرکت","بورسی",
        "چیست","چیه","کدام","کدوم","بگو","بده","را","رو","لطفا","لطفاً","مربوط","به",
        "و","همچنین","حجم","ارزش","تعداد","معاملات","معامله","قیمت","پایانی","بازار","چقدر",
        "است","هست","هستش","میباشد","می","باشد","آن","اون","این","اش","اشو"
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
           && !(q.Contains("خبر",StringComparison.Ordinal)&&q.Contains("نماد",StringComparison.Ordinal)))
            return null;

        var value=q;
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
