using System.Globalization;
using System.Text.RegularExpressions;
using TSEAI.Application.Analytics;
using TSEAI.Application.StructuredQuery;
using TSEAI.Shared.Application.Market;

namespace TSEAI.Application.Chat;

public enum AnswerVerbosity { Compact, Standard, Analytical }
public sealed record AnswerComposeContext(string Question, ChatIntent Intent, AnswerVerbosity Verbosity);

public interface IPersianFinancialAnswerComposer
{
    string Compose(AnswerComposeContext context, MarketSymbolSnapshot? market, SymbolMarketAnalytics? analytics, IReadOnlyList<KnowledgeHit> knowledge);
    string ComposeComparison(string question, MarketComparisonResult comparison);
    string ComposeStructured(string question, StructuredQueryExecutionResult result);
}

public sealed class PersianFinancialAnswerComposer : IPersianFinancialAnswerComposer
{
    public string Compose(AnswerComposeContext context, MarketSymbolSnapshot? s, SymbolMarketAnalytics? analytics, IReadOnlyList<KnowledgeHit> hits)
    {
        var parts=new List<string>();
        if(s is not null)
        {
            var asksVolume=context.Question.Contains("حجم",StringComparison.Ordinal);
            var observed=s.SourceLastModified?.ToString("yyyy/MM/dd",CultureInfo.InvariantCulture)??"تاریخ نامشخص";
            if(asksVolume)
                parts.Add($"حجم معاملات {s.Symbol} در آخرین داده ثبت‌شده ({observed})، {s.TradeVolume:N0} سهم است.");
            else
                parts.Add($"{s.Symbol} — {s.SymbolName}: آخرین قیمت {s.LastPrice.ToString("N0",CultureInfo.InvariantCulture)}، قیمت پایانی {s.ClosingPrice.ToString("N0",CultureInfo.InvariantCulture)} و تغییر قیمت {s.LastPricePercent:0.##}٪ است.");
            if(context.Verbosity!=AnswerVerbosity.Compact && !asksVolume)
                parts.Add($"حجم معاملات {s.TradeVolume:N0} و ارزش معاملات {s.TradeValue:N0} است"+(s.PE is null?".":$"؛ P/E برابر {s.PE:0.##} است."));
            if(context.Verbosity==AnswerVerbosity.Analytical && analytics is not null)
            {
                var metrics=new List<string>();
                Add(metrics,"قدرت خریدار حقیقی",analytics.TradingPower.BuyerPower);
                Add(metrics,"عدم‌تعادل اردربوک",analytics.OrderBook.Imbalance);
                Add(metrics,"نسبت حجم به حجم مبنا",analytics.Volume.VolumeVsBaseVolume);
                if(metrics.Count>0) parts.Add("تحلیل محاسباتی: "+string.Join("، ",metrics)+".");
            }
        }
        if(hits.Count>0)
        {
            parts.Add(ComposeKnowledge(hits));
        }
        return parts.Count==0?"داده قابل اتکایی برای پاسخ پیدا نشد.":string.Join("\n\n",parts);
    }

    public string ComposeComparison(string question, MarketComparisonResult c)
    {
        static string Signed(decimal v)=>v>=0?$"+{v:0.##}":$"{v:0.##}";
        static string Metric(AnalyticsMetric<decimal> m)=>m.Availability==AnalyticsAvailability.Available&&m.Value is not null?m.Value.Value.ToString("0.##",CultureInfo.InvariantCulture):"ناموجود";
        var a=c.Primary; var b=c.Secondary;
        return string.Join("\n",new[]{
            $"مقایسه {a.Symbol} و {b.Symbol} بر پایه Snapshot جاری معتبر:",
            $"{a.Symbol}: آخرین قیمت {a.LastPrice:N0} ({Signed(a.LastPricePercent)}٪)، حجم {a.TradeVolume:N0}.",
            $"{b.Symbol}: آخرین قیمت {b.LastPrice:N0} ({Signed(b.LastPricePercent)}٪)، حجم {b.TradeVolume:N0}.",
            $"{a.Symbol}: قدرت خریدار {Metric(c.PrimaryAnalytics.TradingPower.BuyerPower)}، عدم‌تعادل اردربوک {Metric(c.PrimaryAnalytics.OrderBook.Imbalance)}.",
            $"{b.Symbol}: قدرت خریدار {Metric(c.SecondaryAnalytics.TradingPower.BuyerPower)}، عدم‌تعادل اردربوک {Metric(c.SecondaryAnalytics.OrderBook.Imbalance)}."
        });
    }

    public string ComposeStructured(string question, StructuredQueryExecutionResult result)
    {
        if(!result.Success||result.Plan is null) return "Query ساختاریافته قابل اجرا نبود.";
        if(result.Results.Count==0) return $"هیچ نمادی با شرایط «{result.Plan.Explanation}» پیدا نشد. {result.Scanned:N0} نماد بررسی شد و {result.QualityRejected:N0} نماد به‌دلیل Quality Gate کنار گذاشته شد.";
        string Metric(StructuredQueryRow row) => result.Plan.SortBy switch
        {
            StructuredQueryMetric.TradeVolume => $": حجم معاملات {row.Metrics[nameof(StructuredQueryMetric.TradeVolume)]:N0} سهم",
            StructuredQueryMetric.TradeValue => $": ارزش معاملات {row.Metrics[nameof(StructuredQueryMetric.TradeValue)]:N0} ریال",
            StructuredQueryMetric.TradeCount => $": تعداد معاملات {row.Metrics[nameof(StructuredQueryMetric.TradeCount)]:N0}",
            _ => ""
        };
        var lines=result.Results.Take(10).Select((x,i)=>$"{i+1}. {x.Symbol} — {x.SymbolName}{Metric(x)}");
        return string.Join("\n",lines);
    }

    public static AnswerVerbosity DetectVerbosity(string q)
    {
        if(q.Contains("کامل",StringComparison.Ordinal)||q.Contains("تحلیل",StringComparison.Ordinal)||q.Contains("چطور",StringComparison.Ordinal)||q.Contains("چرا",StringComparison.Ordinal)) return AnswerVerbosity.Analytical;
        if(q.Contains("قیمت",StringComparison.Ordinal)||q.Contains("چنده",StringComparison.Ordinal)||q.Length<30) return AnswerVerbosity.Compact;
        return AnswerVerbosity.Standard;
    }
    private static void Add(List<string> xs,string label,AnalyticsMetric<decimal> m){if(m.Availability==AnalyticsAvailability.Available&&m.Value is not null)xs.Add($"{label} {m.Value.Value:0.##}");}
    private static string ComposeKnowledge(IReadOnlyList<KnowledgeHit> hits)
    {
        var hit=hits[0];
        var text=Regex.Replace(hit.Text??"",@"\s+"," ").Trim();
        var title=Regex.Replace(hit.Citation.Title??"",@"\s+"," ").Trim();
        if(hit.Citation.SourceType.Equals("organization_person",StringComparison.OrdinalIgnoreCase))
        {
            var name=Regex.Match(hit.Text??"",@"(?:^|\n)\s*نام\s*:\s*(?<value>[^\r\n]+)",RegexOptions.CultureInvariant).Groups["value"].Value.Trim();
            var role=Regex.Match(hit.Text??"",@"(?:^|\n)\s*سمت\s*:\s*(?<value>[^\r\n]+)",RegexOptions.CultureInvariant).Groups["value"].Value.Trim();
            if(string.IsNullOrWhiteSpace(role)) role=title;
            if(!string.IsNullOrWhiteSpace(name)) return string.IsNullOrWhiteSpace(role)?EnsureSentence(name):$"{name}، {role} است.";
        }
        if(hit.Citation.SourceType.Equals("faq",StringComparison.OrdinalIgnoreCase))
        {
            var faq=ComposeFaq(hits);
            if(!string.IsNullOrWhiteSpace(faq)) return EnsureSentence(Trim(faq,360));
        }
        if(!string.IsNullOrWhiteSpace(title) && text.StartsWith(title,StringComparison.OrdinalIgnoreCase)) text=text[title.Length..].Trim(' ','-','–','—',':','؛');
        if(string.IsNullOrWhiteSpace(text)) text=title;
        return EnsureSentence(Trim(text,320));
    }
    private static string ComposeFaq(IReadOnlyList<KnowledgeHit> hits)
    {
        var first=hits[0];
        if(!int.TryParse(first.Citation.SourceId,out var anchor)) return ExtractFaqAnswer(first.Text);
        var fragments=hits
            .Where(x=>x.Citation.SourceType.Equals("faq",StringComparison.OrdinalIgnoreCase) && int.TryParse(x.Citation.SourceId,out var id) && id>=anchor && id<=anchor+4)
            .OrderBy(x=>int.Parse(x.Citation.SourceId))
            .Select(x=>Regex.Replace(x.Text??"",@"\s+"," ").Trim())
            .Where(x=>x.Length>0)
            .ToArray();
        if(fragments.Length==0) return ExtractFaqAnswer(first.Text);
        fragments[0]=ExtractFaqAnswer(fragments[0]);
        return Regex.Replace(string.Join(" ",fragments),@"\s+"," ").Trim();
    }
    private static string ExtractFaqAnswer(string? value)
    {
        var text=Regex.Replace(value??"",@"\s+"," ").Trim();
        var question=text.IndexOf('؟');
        return question>=0 && question<text.Length-1?text[(question+1)..].Trim():text;
    }
    private static string EnsureSentence(string value)
    {
        value=value.Trim();
        return value.Length==0?"داده مرتبط و قابل اتکایی پیدا نشد.":".!؟".Contains(value[^1])?value:value+".";
    }
    private static string Trim(string s,int n)=>s.Length<=n?s:s[..n]+"…";
}
