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
            parts.Add(ComposeKnowledge(context,hits));
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
    private static string ComposeKnowledge(AnswerComposeContext context,IReadOnlyList<KnowledgeHit> hits)
    {
        var hit=hits[0];
        var text=NormalizeDocumentText(hit.Text);
        var title=Regex.Replace(hit.Citation.Title??"",@"\s+"," ").Trim();
        if(hit.Citation.SourceType.Equals("organization_person",StringComparison.OrdinalIgnoreCase))
        {
            var name=Regex.Match(hit.Text??"",@"(?:^|\n)\s*نام\s*:\s*(?<value>[^\r\n]+)",RegexOptions.CultureInvariant).Groups["value"].Value.Trim();
            var role=Regex.Match(hit.Text??"",@"(?:^|\n)\s*سمت\s*:\s*(?<value>[^\r\n]+)",RegexOptions.CultureInvariant).Groups["value"].Value.Trim();
            if(string.IsNullOrWhiteSpace(role)) role=title;
            if(!string.IsNullOrWhiteSpace(name)) return PersianDisplayText.Normalize(string.IsNullOrWhiteSpace(role)?EnsureSentence(name):$"{name}، {role} است.");
        }
        if(hit.Citation.SourceType.Equals("faq",StringComparison.OrdinalIgnoreCase))
        {
            text=ExtractFaqAnswer(text);
        }
        if(!string.IsNullOrWhiteSpace(title) && text.StartsWith(title,StringComparison.OrdinalIgnoreCase)) text=text[title.Length..].Trim(' ','-','–','—',':','؛');
        if(string.IsNullOrWhiteSpace(text)) text=title;
        var answer=RequestsFullDocument(context.Question)?text:SummarizeDocument(context.Question,text,context.Verbosity);
        return PersianDisplayText.Normalize(EnsureSentence(answer));
    }
    private static string NormalizeDocumentText(string? value)
    {
        var text=PersianDisplayText.Normalize(value);
        text=Regex.Replace(text,@"[ \t]+"," ");
        return Regex.Replace(text,@"(?:\r?\n){2,}","\n").Trim();
    }
    private static string ExtractFaqAnswer(string? value)
    {
        var text=NormalizeDocumentText(value);
        var question=text.IndexOf('؟');
        return question>=0 && question<text.Length-1?text[(question+1)..].Trim():text;
    }
    private static bool RequestsFullDocument(string question)
    {
        var q=PersianDisplayText.Normalize(question).Replace('‌',' ');
        return new[]{"متن کامل","کل متن","کاملش","بدون خلاصه","عین متن","اصل متن"}.Any(x=>q.Contains(x,StringComparison.Ordinal));
    }
    private static string SummarizeDocument(string question,string document,AnswerVerbosity verbosity)
    {
        var directLimit=verbosity switch { AnswerVerbosity.Compact=>420,AnswerVerbosity.Standard=>700,_=>1000 };
        if(document.Length<=directLimit) return document;
        var sentences=Regex.Split(document,@"(?<=[.!؟!؛])\s+|\r?\n+")
            .Select(x=>x.Trim()).Where(x=>x.Length>0).ToArray();
        if(sentences.Length<=1) return document;
        var queryTerms=MeaningfulTerms(question);
        var ranked=sentences.Select((sentence,index)=>
        {
            var terms=MeaningfulTerms(sentence);
            var overlap=queryTerms.Count==0?0:queryTerms.Count(terms.Contains);
            var coverage=queryTerms.Count==0?0d:(double)overlap/queryTerms.Count;
            return new{Sentence=sentence,Index=index,Score=overlap*10d+coverage};
        }).ToArray();
        var positive=ranked.Where(x=>x.Score>0).ToArray();
        var bestScore=positive.Select(x=>x.Score).DefaultIfEmpty(0).Max();
        var relevant=positive.Where(x=>x.Score>=Math.Max(10,bestScore*.55)).ToArray();
        var source=relevant.Length>0?relevant:ranked;
        var maxSentences=verbosity switch { AnswerVerbosity.Compact=>2,AnswerVerbosity.Standard=>4,_=>6 };
        var maxChars=verbosity switch { AnswerVerbosity.Compact=>700,AnswerVerbosity.Standard=>1200,_=>1800 };
        var selected=source.OrderByDescending(x=>x.Score).ThenBy(x=>x.Index).Take(maxSentences).OrderBy(x=>x.Index);
        var output=new List<string>(); var size=0;
        foreach(var item in selected)
        {
            if(output.Count>0 && size+1+item.Sentence.Length>maxChars) continue;
            output.Add(item.Sentence); size+=item.Sentence.Length+1;
        }
        return output.Count==0?sentences[0]:string.Join(" ",output);
    }
    private static HashSet<string> MeaningfulTerms(string value)
    {
        var normalized=PersianDisplayText.Normalize(value).Replace('‌',' ').ToLowerInvariant();
        return Regex.Matches(normalized,@"[\p{L}\p{Nd}]+")
            .Select(x=>x.Value).Where(x=>x.Length>1&&!SummaryStopWords.Contains(x)).ToHashSet(StringComparer.Ordinal);
    }
    private static readonly HashSet<string> SummaryStopWords=new(StringComparer.Ordinal)
    {
        "است","هست","بود","شد","شود","می","در","از","به","با","برای","را","رو","و","یا","که","چه","کی","کیست","چیه","چیست","دارد","داره","این","آن","یک","بر"
    };
    private static string EnsureSentence(string value)
    {
        value=value.Trim();
        return value.Length==0?"داده مرتبط و قابل اتکایی پیدا نشد.":".!؟".Contains(value[^1])?value:value+".";
    }
}
