using System.Globalization;
using System.Text.RegularExpressions;
using TSEAI.Application.Analytics;
using TSEAI.Application.StructuredQuery;
using TSEAI.Shared.Application.Market;

namespace TSEAI.Application.Chat;

public enum AnswerVerbosity { Compact, Standard, Analytical }
public sealed record AnswerComposeContext(string Question, ChatIntent Intent, AnswerVerbosity Verbosity, IReadOnlyList<string>? RequestedFields = null);

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
            var requested=RequestedMarketFields(context);
            var focused=ComposeRequestedMarketFields(s,analytics,context.Question,requested);
            if(focused is not null)
                parts.Add(focused);
            else
                parts.Add($"{s.Symbol} — {s.SymbolName}: آخرین قیمت {s.LastPrice.ToString("N0",CultureInfo.InvariantCulture)}، قیمت پایانی {s.ClosingPrice.ToString("N0",CultureInfo.InvariantCulture)} و تغییر قیمت {s.LastPricePercent:0.##}٪ است.");
            if(context.Verbosity!=AnswerVerbosity.Compact && requested.Count==0)
                parts.Add($"حجم معاملات {s.TradeVolume:N0} و ارزش معاملات {s.TradeValue:N0} است"+(s.PE is null?".":$"؛ P/E برابر {s.PE:0.##} است."));
            if(context.Verbosity==AnswerVerbosity.Analytical && analytics is not null && requested.Count==0)
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
        var requested=PersianMarketQuestionSemantics.DetectRequestedFields(question)
            .Where(x=>x is "last_price" or "closing_price" or "trade_volume" or "trade_value" or "trade_count" or "market_value" or "pe" or "eps")
            .Distinct(StringComparer.Ordinal).Take(4).ToArray();
        if(requested.Length>0)
        {
            var lines=new List<string> { $"مقایسه {c.Primary.Symbol} و {c.Secondary.Symbol} بر پایه Snapshot معتبر:" };
            foreach(var field in requested)
            {
                var metric=ComparisonMetric(field,c.Primary,c.Secondary);
                if(metric is null) continue;
                var (label,left,right,format,unit)=metric.Value;
                if(left is null||right is null)
                {
                    lines.Add($"{label}: برای مقایسه هر دو نماد داده کافی وجود ندارد.");
                    continue;
                }
                var winner=left==right?"برابر":left>right?c.Primary.Symbol:c.Secondary.Symbol;
                var difference=Math.Abs(left.Value-right.Value);
                lines.Add($"{label}: {c.Primary.Symbol} {left.Value.ToString(format,CultureInfo.InvariantCulture)}{unit}؛ {c.Secondary.Symbol} {right.Value.ToString(format,CultureInfo.InvariantCulture)}{unit}.");
                lines.Add(winner=="برابر"
                    ? $"{label} دو نماد برابر است."
                    : $"{winner} {label} بیشتری دارد؛ اختلاف {difference.ToString(format,CultureInfo.InvariantCulture)}{unit} است.");
            }
            if(lines.Count>1) return string.Join("\n",lines);
        }

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

    private static (string Label,decimal? Left,decimal? Right,string Format,string Unit)? ComparisonMetric(
        string field,MarketSymbolSnapshot left,MarketSymbolSnapshot right)=>field switch
    {
        "last_price"=>("آخرین قیمت",left.LastPrice,right.LastPrice,"N0"," ریال"),
        "closing_price"=>("قیمت پایانی",left.ClosingPrice,right.ClosingPrice,"N0"," ریال"),
        "trade_volume"=>("حجم معاملات",left.TradeVolume,right.TradeVolume,"N0"," سهم"),
        "trade_value"=>("ارزش معاملات",left.TradeValue,right.TradeValue,"N0"," ریال"),
        "trade_count"=>("تعداد معاملات",left.TradeCount,right.TradeCount,"N0",""),
        "market_value"=>("ارزش بازار",left.MarketValue,right.MarketValue,"N0"," ریال"),
        "pe"=>("P/E",left.PE,right.PE,"N2",""),
        "eps"=>("EPS",left.Eps,right.Eps,"N0"," ریال"),
        _=>null
    };

    public string ComposeStructured(string question, StructuredQueryExecutionResult result)
    {
        if(!result.Success||result.Plan is null) return "Query ساختاریافته قابل اجرا نبود.";
        if(result.Results.Count==0) return $"هیچ نمادی با شرایط «{result.Plan.Explanation}» پیدا نشد. {result.Scanned:N0} نماد بررسی شد و {result.QualityRejected:N0} نماد به‌دلیل Quality Gate کنار گذاشته شد.";
        var displayMetric=result.Plan.SortBy??result.Plan.Conditions.FirstOrDefault()?.Metric;
        string Metric(StructuredQueryRow row) => displayMetric switch
        {
            StructuredQueryMetric.TradeVolume => $": حجم معاملات {row.Metrics[nameof(StructuredQueryMetric.TradeVolume)]:N0} سهم",
            StructuredQueryMetric.TradeValue => $": ارزش معاملات {row.Metrics[nameof(StructuredQueryMetric.TradeValue)]:N0} ریال",
            StructuredQueryMetric.TradeCount => $": تعداد معاملات {row.Metrics[nameof(StructuredQueryMetric.TradeCount)]:N0}",
            StructuredQueryMetric.LastPrice => $": آخرین قیمت {row.Metrics[nameof(StructuredQueryMetric.LastPrice)]:N0} ریال",
            StructuredQueryMetric.ClosingPrice => $": قیمت پایانی {row.Metrics[nameof(StructuredQueryMetric.ClosingPrice)]:N0} ریال",
            StructuredQueryMetric.LastPricePercent => $": تغییر آخرین قیمت {row.Metrics[nameof(StructuredQueryMetric.LastPricePercent)]:N2}٪",
            StructuredQueryMetric.ClosingPricePercent => $": تغییر قیمت پایانی {row.Metrics[nameof(StructuredQueryMetric.ClosingPricePercent)]:N2}٪",
            StructuredQueryMetric.PE => $": P/E برابر {row.Metrics[nameof(StructuredQueryMetric.PE)]:N2}",
            StructuredQueryMetric.EPS => $": EPS برابر {row.Metrics[nameof(StructuredQueryMetric.EPS)]:N0} ریال",
            StructuredQueryMetric.MarketValue => $": ارزش بازار {row.Metrics[nameof(StructuredQueryMetric.MarketValue)]:N0} ریال",
            StructuredQueryMetric.FirstPrice => $": قیمت اولین معامله {row.Metrics[nameof(StructuredQueryMetric.FirstPrice)]:N0} ریال",
            StructuredQueryMetric.YesterdayPrice => $": قیمت روز قبل {row.Metrics[nameof(StructuredQueryMetric.YesterdayPrice)]:N0} ریال",
            StructuredQueryMetric.HighPrice => $": بالاترین قیمت روز {row.Metrics[nameof(StructuredQueryMetric.HighPrice)]:N0} ریال",
            StructuredQueryMetric.LowPrice => $": کمترین قیمت روز {row.Metrics[nameof(StructuredQueryMetric.LowPrice)]:N0} ریال",
            StructuredQueryMetric.PriceChange => $": تغییر آخرین قیمت {row.Metrics[nameof(StructuredQueryMetric.PriceChange)]:N0} ریال",
            StructuredQueryMetric.ClosingPriceChange => $": تغییر قیمت پایانی {row.Metrics[nameof(StructuredQueryMetric.ClosingPriceChange)]:N0} ریال",
            StructuredQueryMetric.EffectOnIndex => $": اثر بر شاخص {row.Metrics[nameof(StructuredQueryMetric.EffectOnIndex)]:N2} واحد",
            StructuredQueryMetric.IntradayRange => $": دامنه قیمت روز {row.Metrics[nameof(StructuredQueryMetric.IntradayRange)]:N0} ریال",
            StructuredQueryMetric.AverageTradePrice => $": میانگین قیمت معامله {row.Metrics[nameof(StructuredQueryMetric.AverageTradePrice)]:N2} ریال",
            StructuredQueryMetric.AverageTradeValue => $": میانگین ارزش هر معامله {row.Metrics[nameof(StructuredQueryMetric.AverageTradeValue)]:N0} ریال",
            StructuredQueryMetric.AverageTradeVolume => $": میانگین حجم هر معامله {row.Metrics[nameof(StructuredQueryMetric.AverageTradeVolume)]:N2} سهم",
            StructuredQueryMetric.TurnoverRatio => $": نسبت گردش معاملات {row.Metrics[nameof(StructuredQueryMetric.TurnoverRatio)]:N4}٪",
            StructuredQueryMetric.BestBidPrice => $": بهترین قیمت خرید {row.Metrics[nameof(StructuredQueryMetric.BestBidPrice)]:N0} ریال",
            StructuredQueryMetric.BestBidVolume => $": حجم بهترین سفارش خرید {row.Metrics[nameof(StructuredQueryMetric.BestBidVolume)]:N0} سهم",
            StructuredQueryMetric.BestBidCount => $": تعداد سفارش بهترین خرید {row.Metrics[nameof(StructuredQueryMetric.BestBidCount)]:N0}",
            StructuredQueryMetric.BestAskPrice => $": بهترین قیمت فروش {row.Metrics[nameof(StructuredQueryMetric.BestAskPrice)]:N0} ریال",
            StructuredQueryMetric.BestAskVolume => $": حجم بهترین سفارش فروش {row.Metrics[nameof(StructuredQueryMetric.BestAskVolume)]:N0} سهم",
            StructuredQueryMetric.BestAskCount => $": تعداد سفارش بهترین فروش {row.Metrics[nameof(StructuredQueryMetric.BestAskCount)]:N0}",
            StructuredQueryMetric.Spread => $": اختلاف بهترین فروش و خرید {row.Metrics[nameof(StructuredQueryMetric.Spread)]:N0} ریال",
            StructuredQueryMetric.SpreadPercent => $": اسپرد نسبی {row.Metrics[nameof(StructuredQueryMetric.SpreadPercent)]:N4}٪",
            StructuredQueryMetric.TotalBidVolume => $": عمق خرید پنج سطح {row.Metrics[nameof(StructuredQueryMetric.TotalBidVolume)]:N0} سهم",
            StructuredQueryMetric.TotalAskVolume => $": عمق فروش پنج سطح {row.Metrics[nameof(StructuredQueryMetric.TotalAskVolume)]:N0} سهم",
            StructuredQueryMetric.TotalBidCount => $": مجموع سفارش‌های خرید پنج سطح {row.Metrics[nameof(StructuredQueryMetric.TotalBidCount)]:N0}",
            StructuredQueryMetric.TotalAskCount => $": مجموع سفارش‌های فروش پنج سطح {row.Metrics[nameof(StructuredQueryMetric.TotalAskCount)]:N0}",
            StructuredQueryMetric.OrderBookImbalance => $": عدم‌تعادل عمق {(row.Metrics[nameof(StructuredQueryMetric.OrderBookImbalance)]*100m):N2}٪",
            StructuredQueryMetric.DepthRatio => $": نسبت عمق خرید به فروش {row.Metrics[nameof(StructuredQueryMetric.DepthRatio)]:N4}",
            StructuredQueryMetric.BuyQueueVolume => $": حجم سمت خرید یک‌طرفه {row.Metrics[nameof(StructuredQueryMetric.BuyQueueVolume)]:N0} سهم",
            StructuredQueryMetric.SellQueueVolume => $": حجم سمت فروش یک‌طرفه {row.Metrics[nameof(StructuredQueryMetric.SellQueueVolume)]:N0} سهم",
            _ => ""
        };
        var lines=result.Results.Take(10).Select((x,i)=>$"{i+1}. {x.Symbol} — {x.SymbolName}{Metric(x)}").ToList();
        if(ContainsAny(PersianDisplayText.Normalize(question).Replace('‌',' '),
               "برای اولی","برای اولین مورد","برای مورد اول","مورد اولش","نفر اولش","رتبه اولش"))
        {
            var first=result.Results[0];
            var sortField=displayMetric switch
            {
                StructuredQueryMetric.TradeVolume=>"trade_volume",
                StructuredQueryMetric.TradeValue=>"trade_value",
                StructuredQueryMetric.TradeCount=>"trade_count",
                StructuredQueryMetric.LastPrice=>"last_price",
                StructuredQueryMetric.ClosingPrice=>"closing_price",
                StructuredQueryMetric.PE=>"pe",
                StructuredQueryMetric.EPS=>"eps",
                StructuredQueryMetric.MarketValue=>"market_value",
                _=>null
            };
            var projections=PersianMarketQuestionSemantics.DetectRequestedFields(question)
                .Where(x=>x!=sortField)
                .Select(x=>ProjectedStructuredMetric(first,x))
                .Where(x=>!string.IsNullOrWhiteSpace(x)).Distinct(StringComparer.Ordinal).ToArray();
            if(projections.Length>0)
                lines.Add($"برای رتبه اول، {first.Symbol}: {string.Join("، ",projections)}.");
        }
        if(displayMetric is StructuredQueryMetric.BuyQueueVolume or StructuredQueryMetric.SellQueueVolume)
            lines.Add("این رتبه‌بندی فقط یک‌طرفه‌بودن سطح اول اردربوک را نشان می‌دهد؛ به‌دلیل نبود دامنه مجاز قیمت، صف رسمی تأیید نمی‌شود.");
        if(result.Plan.Conditions.Count>0&&result.Matched>result.Results.Count) lines.Add($"{result.Results.Count:N0} نتیجه اول از {result.Matched:N0} نماد منطبق نمایش داده شد.");
        return string.Join("\n",lines);
    }

    private static string? ProjectedStructuredMetric(StructuredQueryRow row,string field)
    {
        var descriptor=field switch
        {
            "pe"=>(nameof(StructuredQueryMetric.PE),"P/E","N2",""),
            "eps"=>(nameof(StructuredQueryMetric.EPS),"EPS","N0"," ریال"),
            "trade_volume"=>(nameof(StructuredQueryMetric.TradeVolume),"حجم معاملات","N0"," سهم"),
            "trade_value"=>(nameof(StructuredQueryMetric.TradeValue),"ارزش معاملات","N0"," ریال"),
            "trade_count"=>(nameof(StructuredQueryMetric.TradeCount),"تعداد معاملات","N0",""),
            "last_price"=>(nameof(StructuredQueryMetric.LastPrice),"آخرین قیمت","N0"," ریال"),
            "closing_price"=>(nameof(StructuredQueryMetric.ClosingPrice),"قیمت پایانی","N0"," ریال"),
            "market_value"=>(nameof(StructuredQueryMetric.MarketValue),"ارزش بازار","N0"," ریال"),
            _=>default
        };
        if(string.IsNullOrWhiteSpace(descriptor.Item1)) return null;
        if(!row.Metrics.TryGetValue(descriptor.Item1,out var value)||value is null)
            return $"{descriptor.Item2} موجود نیست";
        return $"{descriptor.Item2} {value.Value.ToString(descriptor.Item3,CultureInfo.InvariantCulture)}{descriptor.Item4}";
    }

    public static AnswerVerbosity DetectVerbosity(string q)
    {
        if(q.Contains("کامل",StringComparison.Ordinal)||q.Contains("تحلیل",StringComparison.Ordinal)||q.Contains("چطور",StringComparison.Ordinal)||q.Contains("چرا",StringComparison.Ordinal)) return AnswerVerbosity.Analytical;
        if(q.Contains("قیمت",StringComparison.Ordinal)||q.Contains("چنده",StringComparison.Ordinal)||q.Length<30) return AnswerVerbosity.Compact;
        return AnswerVerbosity.Standard;
    }
    private static HashSet<string> RequestedMarketFields(AnswerComposeContext context)
    {
        var allowed=new HashSet<string>(StringComparer.Ordinal)
        {
            "last_price","closing_price","trade_volume","trade_value","market_value","trade_count","pe","eps","observed_at","market_summary",
            "identity","instrument_id","ins_code","first_price","yesterday_price","high_price","low_price","last_price_change","last_price_change_percent",
            "closing_price_change","closing_price_change_percent","effect_on_index","raw_min_value","raw_max_value","best_bid","best_ask",
            "best_bid_price","best_bid_volume","best_bid_count","best_ask_price","best_ask_volume","best_ask_count",
            "orderbook","bid_levels","ask_levels","orderbook_level","spread","spread_percent","mid_price",
            "total_bid_volume","total_ask_volume","total_bid_count","total_ask_count","total_bid_value","total_ask_value",
            "orderbook_imbalance","depth_ratio","largest_bid_level","largest_ask_level","orderbook_state","orderbook_observed_at","orderbook_sequence",
            "market","board","industry","state","intraday_range","average_trade_price","average_trade_value","average_trade_volume","turnover_ratio",
            "client_type_summary","individual_buy_count","legal_buy_count","individual_sell_count","legal_sell_count",
            "individual_buy_volume","legal_buy_volume","individual_sell_volume","legal_sell_volume","total_buy_volume","total_sell_volume",
            "individual_net_volume","legal_net_volume","individual_buy_per_capita","individual_sell_per_capita","buyer_power","buyer_power_signal",
            "individual_buy_share","legal_buy_share","individual_sell_share","legal_sell_share","counter","updated_at","source_collected_at","money_value_unavailable"
        };
        var result=(context.RequestedFields??[]).Where(allowed.Contains).ToHashSet(StringComparer.Ordinal);
        foreach(var field in PersianMarketQuestionSemantics.DetectRequestedFields(context.Question).Where(allowed.Contains)) result.Add(field);

        // Safe fallback for deterministic plans and old AI nodes during rolling deployment.
        var q=PersianDisplayText.Normalize(context.Question).Replace('‌',' ');
        if(q.Contains("چه تاریخ",StringComparison.Ordinal)||q.Contains("کدام تاریخ",StringComparison.Ordinal)||q.Contains("کدوم تاریخ",StringComparison.Ordinal)||q.Contains("چه زمانی",StringComparison.Ordinal)) result.Add("observed_at");
        if(ContainsAny(q,"نام شرکت","اسم شرکت","نام نماد","این نماد چیه")) result.Add("identity");
        if(ContainsAny(q,"اولین قیمت","قیمت اولین معامله","قیمت آغازین","قیمت بازگشایی")) result.Add("first_price");
        if(ContainsAny(q,"قیمت دیروز","قیمت روز قبل","قیمت مبنا")) result.Add("yesterday_price");
        if(ContainsAny(q,"بالاترین قیمت","بیشترین قیمت","بالاترین نرخ معامله","بیشترین نرخ معامله","سقف قیمت","حداکثر قیمت روز")) result.Add("high_price");
        if(ContainsAny(q,"کمترین قیمت","پایین ترین قیمت","پایین‌ترین قیمت","کمترین نرخ معامله","پایین‌ترین نرخ معامله","کف قیمت","حداقل قیمت روز")) result.Add("low_price");
        if(ContainsAny(q,"درصد تغییر آخرین قیمت","درصد تغییر قیمت آخر","درصد تغییر قیمت")) result.Add("last_price_change_percent");
        if(ContainsAny(q,"تغییر آخرین قیمت","تغییر قیمت آخر")) result.Add("last_price_change");
        if(ContainsAny(q,"درصد تغییر قیمت پایانی","درصد تغییر پایانی")) result.Add("closing_price_change_percent");
        if(ContainsAny(q,"تغییر قیمت پایانی","تغییر پایانی")) result.Add("closing_price_change");
        if(ContainsAny(q,"اثر روی شاخص","اثر بر شاخص","تأثیر روی شاخص","تاثیر روی شاخص","اثر شاخص")) result.Add("effect_on_index");
        if(ContainsAny(q,"حداقل مقدار","کمینه ثبت شده")) result.Add("raw_min_value");
        if(ContainsAny(q,"حداکثر مقدار","بیشینه ثبت شده")) result.Add("raw_max_value");
        if(ContainsAny(q,"کدام بازار","کدوم بازار","چه بازاری","نام بازار","بازار و تابلو")) result.Add("market");
        if(q.Contains("تابلو",StringComparison.Ordinal)) result.Add("board");
        if(ContainsAny(q,"صنعت","گروه صنعتی","گروه صنعت")) result.Add("industry");
        if(ContainsAny(q,"وضعیت معاملاتی","وضعیت نماد","مجاز است","ممنوع است")) result.Add("state");
        if(ContainsAny(q,"دامنه نوسان روز","بازه قیمت روز","فاصله سقف و کف")) result.Add("intraday_range");
        if(ContainsAny(q,"میانگین قیمت معامله","متوسط قیمت معامله")) result.Add("average_trade_price");
        if(ContainsAny(q,"میانگین ارزش هر معامله","متوسط ارزش هر معامله")) result.Add("average_trade_value");
        if(ContainsAny(q,"میانگین حجم هر معامله","متوسط حجم هر معامله")) result.Add("average_trade_volume");
        if(ContainsAny(q,"نسبت گردش معاملات","نسبت ارزش معاملات به ارزش بازار")) result.Add("turnover_ratio");
        if(q.Contains("آخرین قیمت",StringComparison.Ordinal)||q.Contains("قیمت آخر",StringComparison.Ordinal)) result.Add("last_price");
        if(q.Contains("قیمت پایانی",StringComparison.Ordinal)) result.Add("closing_price");
        if(q.Contains("حجم",StringComparison.Ordinal)&&!result.Any(PersianMarketQuestionSemantics.IsOrderBookField)
            &&!result.Any(PersianMarketQuestionSemantics.IsClientTypeField)) result.Add("trade_volume");
        if(q.Contains("ارزش معاملات",StringComparison.Ordinal)) result.Add("trade_value");
        if(q.Contains("ارزش بازار",StringComparison.Ordinal)) result.Add("market_value");
        if(q.Contains("تعداد معاملات",StringComparison.Ordinal)) result.Add("trade_count");
        if(q.Contains("p/e",StringComparison.OrdinalIgnoreCase)||q.Contains("پی ای",StringComparison.Ordinal)) result.Add("pe");
        if(q.Contains("eps",StringComparison.OrdinalIgnoreCase)||q.Contains("ای پی اس",StringComparison.Ordinal)) result.Add("eps");
        // The model may confuse Cashmarket's raw MinValue/MaxValue columns with
        // the actual intraday low/high. Explicit price/rate language is authoritative.
        if(result.Contains("low_price")) result.Remove("raw_min_value");
        if(result.Contains("high_price")) result.Remove("raw_max_value");
        if(result.Contains("closing_price_change_percent")) result.Remove("last_price_change_percent");
        if(result.Any(PersianMarketQuestionSemantics.IsOrderBookField)) result.Remove("trade_volume");
        if(result.Any(PersianMarketQuestionSemantics.IsClientTypeField)&&!ContainsAny(q,"حجم معاملات","حجم دادوستد")) result.Remove("trade_volume");
        if(result.Overlaps(["updated_at","source_collected_at"])&&q.Contains("clienttype",StringComparison.OrdinalIgnoreCase)) result.Remove("observed_at");
        if(result.Contains("orderbook_observed_at")&&!ContainsAny(q,"اردربوک کامل","اوردر بوک کامل","دفتر سفارش کامل","کل اردربوک","پنج سطح","همه ردیف","تمام ردیف"))
        {
            // A timestamp question must not expand a generic model-selected
            // orderbook field into all five levels. Explicit quote/metric fields stay.
            result.Remove("orderbook");
            result.Remove("bid_levels");
            result.Remove("ask_levels");
            result.Remove("orderbook_level");
            result.Remove("observed_at");
        }
        if(result.Contains("turnover_ratio")&&!q.Contains("ارزش معاملات و نسبت",StringComparison.Ordinal))
        {
            result.Remove("trade_value");
            result.Remove("market_value");
        }
        if(result.Contains("average_trade_price")&&!ContainsAny(q,"حجم معاملات و میانگین","ارزش معاملات و میانگین"))
        {
            result.Remove("trade_value");
            result.Remove("trade_volume");
        }
        return result;
    }
    private static string? ComposeRequestedMarketFields(MarketSymbolSnapshot s,SymbolMarketAnalytics? analytics,string question,HashSet<string> fields)
    {
        if(fields.Count==0) return null;
        if(fields.Contains("market_summary")) return ComposeMarketSummary(s);
        var observed=FormatObservedAt(s);
        if(fields.SetEquals(["observed_at"])) return $"آخرین داده ثبت‌شده برای {s.Symbol} مربوط به {observed} است.";
        if(fields.SetEquals(["last_price","observed_at"])) return $"آخرین قیمت {s.Symbol}، {s.LastPrice:N0} ریال است و به داده ثبت‌شده در {observed} مربوط می‌شود.";

        var values=new List<string>();
        var orderBookRequested=fields.Any(PersianMarketQuestionSemantics.IsOrderBookField);
        if(fields.Remove("client_type_summary"))
            fields.UnionWith(["individual_buy_count","individual_buy_volume","legal_buy_count","legal_buy_volume",
                "individual_sell_count","individual_sell_volume","legal_sell_count","legal_sell_volume",
                "individual_net_volume","buyer_power","updated_at","source_collected_at"]);
        var clientTypeRequested=fields.Any(PersianMarketQuestionSemantics.IsClientTypeField);
        if(clientTypeRequested&&!s.ClientType.HasData)
            return $"برای {s.Symbol} در Snapshot جاری ClientType داده‌ای ثبت نشده است.";
        if(orderBookRequested&&s.OrderBookUpdatedAt is null)
            return $"برای {s.Symbol} در جدول OrderBookCurrent رکوردی ثبت نشده است.";
        var levels=s.OrderBook.Where(x=>x.Level is >=1 and <=5).OrderBy(x=>x.Level).ToArray();
        var best=levels.FirstOrDefault(x=>x.Level==1);
        if(fields.Contains("identity")) values.Add($"نام شرکت/نماد «{Clean(s.CompanyName??s.SymbolName)}»");
        if(fields.Contains("instrument_id")) values.Add(string.IsNullOrWhiteSpace(s.SymbolCode)?"InstrumentID ناموجود":$"InstrumentID برابر {s.SymbolCode}");
        if(fields.Contains("ins_code")) values.Add($"InsCode برابر {s.InsCode}");
        if(fields.Contains("last_price")) values.Add($"آخرین قیمت {s.LastPrice:N0} ریال");
        if(fields.Contains("closing_price")) values.Add($"قیمت پایانی {s.ClosingPrice:N0} ریال");
        if(fields.Contains("first_price")) values.Add($"قیمت اولین معامله {s.FirstPrice:N0} ریال");
        if(fields.Contains("yesterday_price")) values.Add($"قیمت روز قبل {s.YesterdayPrice:N0} ریال");
        if(fields.Contains("high_price")) values.Add($"بالاترین قیمت روز {s.MaxPrice:N0} ریال");
        if(fields.Contains("low_price")) values.Add($"کمترین قیمت روز {s.MinPrice:N0} ریال");
        if(fields.Contains("last_price_change")) values.Add($"تغییر آخرین قیمت {SignedNumber(s.PriceChange)} ریال");
        if(fields.Contains("last_price_change_percent")) values.Add($"درصد تغییر آخرین قیمت {SignedNumber(s.LastPricePercent)}٪");
        if(fields.Contains("closing_price_change")) values.Add($"تغییر قیمت پایانی {SignedNumber(s.ClosingPriceChange)} ریال");
        if(fields.Contains("closing_price_change_percent")) values.Add($"درصد تغییر قیمت پایانی {SignedNumber(s.ClosingPricePercent)}٪");
        if(fields.Contains("trade_volume")) values.Add($"حجم معاملات {s.TradeVolume:N0} سهم");
        if(fields.Contains("trade_value")) values.Add($"ارزش معاملات {s.TradeValue:N0} ریال");
        if(fields.Contains("market_value")) values.Add(s.MarketValue is null?"ارزش بازار ناموجود":$"ارزش بازار {s.MarketValue.Value:N0} ریال");
        if(fields.Contains("trade_count")) values.Add($"تعداد معاملات {s.TradeCount:N0}");
        if(fields.Contains("pe")) values.Add(s.PE is null?"P/E ناموجود":$"P/E برابر {s.PE:0.##}");
        if(fields.Contains("eps")) values.Add(s.Eps is null?"EPS ناموجود":$"EPS برابر {s.Eps:N0} ریال");
        if(fields.Contains("effect_on_index")) values.Add(s.EffectOnIndex is null?"اثر بر شاخص در Cashmarket ثبت نشده":$"اثر بر شاخص {SignedNumber(s.EffectOnIndex.Value)} واحد");
        if(fields.Contains("raw_min_value")) values.Add(s.RawMinValue is null?"حداقل مقدار ثبت نشده":$"حداقل مقدار ثبت‌شده در Cashmarket {s.RawMinValue.Value:N0}");
        if(fields.Contains("raw_max_value")) values.Add(s.RawMaxValue is null?"حداکثر مقدار ثبت نشده":$"حداکثر مقدار ثبت‌شده در Cashmarket {s.RawMaxValue.Value:N0}");
        if(fields.Contains("best_bid")) values.Add(QuoteSide("بهترین سفارش خرید",best,true));
        if(fields.Contains("best_bid_price")) values.Add(BidAvailable(best)?$"بهترین قیمت خرید {best!.BuyPrice:N0} ریال":"در سمت خرید سفارش فعالی ثبت نشده");
        if(fields.Contains("best_bid_volume")) values.Add(BidAvailable(best)?$"حجم بهترین سفارش خرید {best!.BuyVolume:N0} سهم":"در سمت خرید سفارش فعالی ثبت نشده");
        if(fields.Contains("best_bid_count")) values.Add(BidAvailable(best)?$"تعداد سفارش‌های بهترین خرید {best!.BuyCount:N0}":"در سمت خرید سفارش فعالی ثبت نشده");
        if(fields.Contains("best_ask")) values.Add(QuoteSide("بهترین سفارش فروش",best,false));
        if(fields.Contains("best_ask_price")) values.Add(AskAvailable(best)?$"بهترین قیمت فروش {best!.SellPrice:N0} ریال":"در سمت فروش سفارش فعالی ثبت نشده");
        if(fields.Contains("best_ask_volume")) values.Add(AskAvailable(best)?$"حجم بهترین سفارش فروش {best!.SellVolume:N0} سهم":"در سمت فروش سفارش فعالی ثبت نشده");
        if(fields.Contains("best_ask_count")) values.Add(AskAvailable(best)?$"تعداد سفارش‌های بهترین فروش {best!.SellCount:N0}":"در سمت فروش سفارش فعالی ثبت نشده");
        if(fields.Contains("spread")) values.Add(Spread(best,false));
        if(fields.Contains("spread_percent")) values.Add(Spread(best,true));
        if(fields.Contains("mid_price")) values.Add(BidAvailable(best)&&AskAvailable(best)?$"قیمت میانی بهترین مظنه‌ها {((best!.BuyPrice+best.SellPrice)/2m):N2} ریال":"قیمت میانی به‌دلیل نبود یکی از دو سمت قابل محاسبه نیست");
        if(fields.Contains("total_bid_volume")) values.Add($"مجموع حجم خرید پنج سطح {levels.Sum(x=>x.BuyVolume):N0} سهم");
        if(fields.Contains("total_ask_volume")) values.Add($"مجموع حجم فروش پنج سطح {levels.Sum(x=>x.SellVolume):N0} سهم");
        if(fields.Contains("total_bid_count")) values.Add($"مجموع تعداد سفارش‌های خرید پنج سطح {levels.Sum(x=>x.BuyCount):N0}");
        if(fields.Contains("total_ask_count")) values.Add($"مجموع تعداد سفارش‌های فروش پنج سطح {levels.Sum(x=>x.SellCount):N0}");
        if(fields.Contains("total_bid_value")) values.Add($"ارزش اسمی سفارش‌های خرید پنج سطح {levels.Sum(x=>x.BuyPrice*x.BuyVolume):N0} ریال");
        if(fields.Contains("total_ask_value")) values.Add($"ارزش اسمی سفارش‌های فروش پنج سطح {levels.Sum(x=>x.SellPrice*x.SellVolume):N0} ریال");
        if(fields.Contains("orderbook_imbalance")) values.Add(ComposeImbalance(levels,analytics));
        if(fields.Contains("depth_ratio")) values.Add(ComposeDepthRatio(levels));
        if(fields.Contains("largest_bid_level")) values.Add(LargestLevel(levels,true));
        if(fields.Contains("largest_ask_level")) values.Add(LargestLevel(levels,false));
        if(fields.Contains("orderbook_state")) values.Add(DescribeOrderBookState(s,best));
        if(fields.Contains("orderbook")) values.Add(FormatOrderBook(levels,null));
        if(fields.Contains("bid_levels")) values.Add(FormatOrderBook(levels,true));
        if(fields.Contains("ask_levels")) values.Add(FormatOrderBook(levels,false));
        if(fields.Contains("orderbook_level"))
        {
            var level=DetectOrderBookLevel(question);
            var row=levels.FirstOrDefault(x=>x.Level==level);
            var buy=ContainsAny(question,"خرید","تقاضا")&&!ContainsAny(question,"فروش","عرضه");
            var sell=ContainsAny(question,"فروش","عرضه")&&!ContainsAny(question,"خرید","تقاضا");
            values.Add(row is null?$"سطح {level} ثبت نشده":FormatOrderBook([row],buy?true:sell?false:null));
        }
        if(fields.Contains("orderbook_observed_at")) values.Add(FormatOrderBookObservedAt(s));
        if(fields.Contains("orderbook_sequence"))
        {
            var counters=levels.Where(x=>x.BestLimitCounter.HasValue).Select(x=>x.BestLimitCounter!.Value).Distinct().ToArray();
            values.Add(counters.Length switch {0=>"BestLimitCounter ثبت نشده",1=>$"BestLimitCounter برابر {counters[0]:N0}",_=>$"BestLimitCounterهای ثبت‌شده {string.Join("، ",counters.Select(x=>x.ToString("N0",CultureInfo.InvariantCulture)))}"});
        }
        if(fields.Contains("market")) values.Add(DescribeMarket(s));
        if(fields.Contains("board")) values.Add(string.IsNullOrWhiteSpace(s.BoardName)?"تابلوی معاملاتی در Cashmarket ثبت نشده":$"تابلوی معاملاتی «{Clean(s.BoardName)}»");
        if(fields.Contains("industry")) values.Add(string.IsNullOrWhiteSpace(s.IndustryName)?"صنعت در Cashmarket ثبت نشده":$"صنعت «{Clean(s.IndustryName)}»"+(string.IsNullOrWhiteSpace(s.IndustrySubName)?"":$"، زیرصنعت «{Clean(s.IndustrySubName)}»"));
        if(fields.Contains("state")) values.Add(string.IsNullOrWhiteSpace(s.StateName)?"وضعیت معاملاتی در Cashmarket ثبت نشده":$"وضعیت معاملاتی «{Clean(s.StateName)}»");
        if(fields.Contains("intraday_range")) values.Add($"فاصله کمترین تا بیشترین قیمت روز {(s.MaxPrice-s.MinPrice):N0} ریال ({s.MinPrice:N0} تا {s.MaxPrice:N0})");
        if(fields.Contains("average_trade_price")) values.Add(s.TradeVolume<=0?"میانگین قیمت معامله قابل محاسبه نیست":$"میانگین وزنی قیمت معامله حدود {(s.TradeValue/s.TradeVolume):N2} ریال");
        if(fields.Contains("average_trade_value")) values.Add(s.TradeCount<=0?"میانگین ارزش هر معامله قابل محاسبه نیست":$"میانگین ارزش هر معامله حدود {(s.TradeValue/s.TradeCount):N0} ریال");
        if(fields.Contains("average_trade_volume")) values.Add(s.TradeCount<=0?"میانگین حجم هر معامله قابل محاسبه نیست":$"میانگین حجم هر معامله حدود {((decimal)s.TradeVolume/s.TradeCount):N2} سهم");
        if(fields.Contains("turnover_ratio")) values.Add(s.MarketValue is null or <=0?"نسبت گردش معاملات قابل محاسبه نیست":$"نسبت ارزش معاملات به ارزش بازار {(s.TradeValue/s.MarketValue.Value*100):N4}٪");
        var ct=s.ClientType;
        var buyTotal=ct.BuyIVolume+ct.BuyNVolume;
        var sellTotal=ct.SellIVolume+ct.SellNVolume;
        var buyPc=ct.BuyCountI>0?(decimal)ct.BuyIVolume/ct.BuyCountI:(decimal?)null;
        var sellPc=ct.SellCountI>0?(decimal)ct.SellIVolume/ct.SellCountI:(decimal?)null;
        var buyerPower=buyPc.HasValue&&sellPc is >0?buyPc.Value/sellPc.Value:(decimal?)null;
        if(fields.Contains("individual_buy_count")) values.Add($"تعداد خریداران حقیقی {ct.BuyCountI:N0} کد معاملاتی");
        if(fields.Contains("legal_buy_count")) values.Add($"تعداد خریداران حقوقی {ct.BuyCountN:N0} کد معاملاتی");
        if(fields.Contains("individual_sell_count")) values.Add($"تعداد فروشندگان حقیقی {ct.SellCountI:N0} کد معاملاتی");
        if(fields.Contains("legal_sell_count")) values.Add($"تعداد فروشندگان حقوقی {ct.SellCountN:N0} کد معاملاتی");
        if(fields.Contains("individual_buy_volume")) values.Add($"حجم خرید حقیقی {ct.BuyIVolume:N0} سهم");
        if(fields.Contains("legal_buy_volume")) values.Add($"حجم خرید حقوقی {ct.BuyNVolume:N0} سهم");
        if(fields.Contains("individual_sell_volume")) values.Add($"حجم فروش حقیقی {ct.SellIVolume:N0} سهم");
        if(fields.Contains("legal_sell_volume")) values.Add($"حجم فروش حقوقی {ct.SellNVolume:N0} سهم");
        if(fields.Contains("total_buy_volume")) values.Add($"مجموع حجم خرید {buyTotal:N0} سهم");
        if(fields.Contains("total_sell_volume")) values.Add($"مجموع حجم فروش {sellTotal:N0} سهم");
        if(fields.Contains("individual_net_volume")) values.Add($"خالص حجم حقیقی {SignedNumber(ct.BuyIVolume-ct.SellIVolume)} سهم");
        if(fields.Contains("legal_net_volume")) values.Add($"خالص حجم حقوقی {SignedNumber(ct.BuyNVolume-ct.SellNVolume)} سهم");
        if(fields.Contains("individual_buy_per_capita")) values.Add(buyPc.HasValue?$"سرانه خرید حقیقی {buyPc:N2} سهم":"سرانه خرید حقیقی قابل محاسبه نیست");
        if(fields.Contains("individual_sell_per_capita")) values.Add(sellPc.HasValue?$"سرانه فروش حقیقی {sellPc:N2} سهم":"سرانه فروش حقیقی قابل محاسبه نیست");
        if(fields.Contains("buyer_power")) values.Add(buyerPower.HasValue?$"قدرت خریدار حقیقی {buyerPower:N4}":"قدرت خریدار قابل محاسبه نیست");
        if(fields.Contains("buyer_power_signal")) values.Add(buyerPower switch {>1m=>"سرانه خرید حقیقی از سرانه فروش بیشتر است",<1m=>"سرانه فروش حقیقی از سرانه خرید بیشتر است",1m=>"سرانه خرید و فروش حقیقی برابر است",_=>"وضعیت قدرت خریدار قابل تعیین نیست"});
        if(fields.Contains("individual_buy_share")) values.Add(buyTotal>0?$"سهم حقیقی از حجم خرید {(decimal)ct.BuyIVolume*100m/buyTotal:N2}٪":"سهم حقیقی از خرید قابل محاسبه نیست");
        if(fields.Contains("legal_buy_share")) values.Add(buyTotal>0?$"سهم حقوقی از حجم خرید {(decimal)ct.BuyNVolume*100m/buyTotal:N2}٪":"سهم حقوقی از خرید قابل محاسبه نیست");
        if(fields.Contains("individual_sell_share")) values.Add(sellTotal>0?$"سهم حقیقی از حجم فروش {(decimal)ct.SellIVolume*100m/sellTotal:N2}٪":"سهم حقیقی از فروش قابل محاسبه نیست");
        if(fields.Contains("legal_sell_share")) values.Add(sellTotal>0?$"سهم حقوقی از حجم فروش {(decimal)ct.SellNVolume*100m/sellTotal:N2}٪":"سهم حقوقی از فروش قابل محاسبه نیست");
        if(fields.Contains("counter")) values.Add($"شمارنده منبع ClientType {ct.Counter:N0} (تعداد معامله نیست)");
        if(fields.Contains("updated_at")) values.Add($"زمان Snapshot منبع {FormatTimestamp(ct.UpdatedAt)}");
        if(fields.Contains("source_collected_at")) values.Add($"زمان دریافت ClientType در SQL {FormatTimestamp(ct.SourceCollectedAt)}");
        if(fields.Contains("money_value_unavailable")) values.Add($"ارزش ریالی حقیقی/حقوقی در ClientType وجود ندارد؛ خالص حجم حقیقی {SignedNumber(ct.BuyIVolume-ct.SellIVolume)} سهم است");
        if(fields.Contains("observed_at")) values.Add($"زمان داده {observed}");
        if(orderBookRequested&&!fields.Contains("orderbook_observed_at")) values.Add($"زمان به‌روزرسانی اردربوک {FormatTimestamp(s.OrderBookUpdatedAt)}");
        return values.Count==0?null:$"{s.Symbol}: {string.Join("، ",values)} است.";
    }

    private static bool ContainsAny(string text,params string[] values)=>values.Any(x=>text.Contains(x,StringComparison.Ordinal));
    private static string Clean(string? value)=>Regex.Replace(PersianDisplayText.Normalize(value??""),@"\s+"," ").Trim();
    private static string SignedNumber(decimal value)=>value>0?$"+{value:N2}":value.ToString("N2",CultureInfo.InvariantCulture);
    private static bool BidAvailable(OrderBookLevel? level)=>level is not null&&level.BuyPrice>0;
    private static bool AskAvailable(OrderBookLevel? level)=>level is not null&&level.SellPrice>0;
    private static string QuoteSide(string label,OrderBookLevel? level,bool bid)
        => bid
            ? BidAvailable(level)?$"{label} با قیمت {level!.BuyPrice:N0} ریال، حجم {level.BuyVolume:N0} سهم و {level.BuyCount:N0} سفارش":$"{label} فعال نیست"
            : AskAvailable(level)?$"{label} با قیمت {level!.SellPrice:N0} ریال، حجم {level.SellVolume:N0} سهم و {level.SellCount:N0} سفارش":$"{label} فعال نیست";
    private static string Spread(OrderBookLevel? best,bool percent)
    {
        if(!BidAvailable(best)||!AskAvailable(best)) return "اختلاف بهترین خرید و فروش به‌دلیل نبود یکی از دو سمت قابل محاسبه نیست";
        var spread=best!.SellPrice-best.BuyPrice;
        if(!percent) return $"اختلاف بهترین قیمت فروش و خرید {spread:N0} ریال";
        var mid=(best.SellPrice+best.BuyPrice)/2m;
        return mid<=0?"درصد اختلاف مظنه قابل محاسبه نیست":$"درصد اختلاف مظنه نسبت به قیمت میانی {(spread*100m/mid):N4}٪";
    }
    private static string ComposeImbalance(IReadOnlyList<OrderBookLevel> levels,SymbolMarketAnalytics? analytics)
    {
        var buy=levels.Sum(x=>x.BuyVolume); var sell=levels.Sum(x=>x.SellVolume); var total=buy+sell;
        if(total<=0) return "عدم‌تعادل عمق اردربوک قابل محاسبه نیست";
        var imbalance=analytics?.OrderBook.Imbalance.Availability==AnalyticsAvailability.Available
            ? analytics.OrderBook.Imbalance.Value!.Value
            : (decimal)(buy-sell)/total;
        return $"عدم‌تعادل حجم پنج سطح {SignedNumber(imbalance*100m)}٪";
    }
    private static string ComposeDepthRatio(IReadOnlyList<OrderBookLevel> levels)
    {
        var buy=levels.Sum(x=>x.BuyVolume); var sell=levels.Sum(x=>x.SellVolume);
        return sell<=0?"نسبت عمق خرید به فروش به‌دلیل نبود حجم فروش قابل محاسبه نیست":$"نسبت عمق خرید به فروش {(decimal)buy/sell:N4}";
    }
    private static string LargestLevel(IReadOnlyList<OrderBookLevel> levels,bool bid)
    {
        var row=bid?levels.Where(x=>x.BuyVolume>0).OrderByDescending(x=>x.BuyVolume).FirstOrDefault():levels.Where(x=>x.SellVolume>0).OrderByDescending(x=>x.SellVolume).FirstOrDefault();
        if(row is null) return bid?"ردیف خرید فعالی ثبت نشده":"ردیف فروش فعالی ثبت نشده";
        return bid?$"بزرگ‌ترین ردیف خرید سطح {row.Level} با حجم {row.BuyVolume:N0} سهم در قیمت {row.BuyPrice:N0} ریال":$"بزرگ‌ترین ردیف فروش سطح {row.Level} با حجم {row.SellVolume:N0} سهم در قیمت {row.SellPrice:N0} ریال";
    }
    private static string DescribeOrderBookState(MarketSymbolSnapshot s,OrderBookLevel? best)
    {
        if(BidAvailable(best)&&!AskAvailable(best))
            return "دفتر سفارش در سطح اول یک‌طرفه خرید است؛ چون دامنه مجاز قیمت در منبع موجود نیست، این وضعیت به‌تنهایی صف خرید رسمی را اثبات نمی‌کند";
        if(!BidAvailable(best)&&AskAvailable(best))
            return "دفتر سفارش در سطح اول یک‌طرفه فروش است؛ چون دامنه مجاز قیمت در منبع موجود نیست، این وضعیت به‌تنهایی صف فروش رسمی را اثبات نمی‌کند";
        if(!BidAvailable(best)&&!AskAvailable(best)) return "در سطح اول سفارش خرید یا فروش فعالی ثبت نشده";
        if(best!.BuyPrice==best.SellPrice) return "دفتر سفارش دوطرفه و قفل‌شده است؛ بهترین قیمت خرید و فروش برابرند";
        return $"دفتر سفارش دوطرفه است و فاصله بهترین فروش تا خرید {best.SellPrice-best.BuyPrice:N0} ریال است";
    }
    private static string FormatOrderBook(IReadOnlyList<OrderBookLevel> levels,bool? bidOnly)
    {
        var rows=levels.Select(x=>bidOnly switch
        {
            true=>$"سطح {x.Level}: خرید {Side(x.BuyPrice,x.BuyVolume,x.BuyCount)}",
            false=>$"سطح {x.Level}: فروش {Side(x.SellPrice,x.SellVolume,x.SellCount)}",
            _=>$"سطح {x.Level}: خرید {Side(x.BuyPrice,x.BuyVolume,x.BuyCount)} | فروش {Side(x.SellPrice,x.SellVolume,x.SellCount)}"
        });
        return "اردربوک:\n"+string.Join("\n",rows);
    }
    private static string Side(decimal price,long volume,long count)=>price<=0?"—":$"{price:N0} ریال، {volume:N0} سهم، {count:N0} سفارش";
    private static int DetectOrderBookLevel(string question)
    {
        var q=PersianDisplayText.Normalize(question).Replace('‌',' ');
        var words=new Dictionary<string,int>{{"اول",1},{"یک",1},{"دوم",2},{"دو",2},{"سوم",3},{"سه",3},{"چهارم",4},{"چهار",4},{"پنجم",5},{"پنج",5}};
        foreach(var pair in words) if(Regex.IsMatch(q,$@"(?:سطح|ردیف|level)\s*{Regex.Escape(pair.Key)}",RegexOptions.IgnoreCase)) return pair.Value;
        var match=Regex.Match(q,@"(?:سطح|ردیف|level)\s*([1-5۱-۵])",RegexOptions.IgnoreCase);
        if(match.Success) return match.Groups[1].Value[0] switch {'۱'=>1,'۲'=>2,'۳'=>3,'۴'=>4,'۵'=>5,var ch=>ch-'0'};
        return 1;
    }
    private static string FormatOrderBookObservedAt(MarketSymbolSnapshot s)
        => $"آخرین زمان اعلام‌شده توسط منبع اردربوک {FormatTimestamp(s.OrderBookUpdatedAt)} و زمان جمع‌آوری آن در SQL {FormatTimestamp(s.OrderBookSourceCollectedAt)}";
    private static string FormatTimestamp(DateTime? value)
    {
        if(value is null) return "نامشخص";
        return PersianDisplayText.FormatPersianDate(value.Value,includeTime:true);
    }
    private static string DescribeMarket(MarketSymbolSnapshot s)
    {
        if(string.IsNullOrWhiteSpace(s.MarketName)&&string.IsNullOrWhiteSpace(s.MarketTypeName)) return "بازار در Cashmarket ثبت نشده";
        var value=string.IsNullOrWhiteSpace(s.MarketName)?Clean(s.MarketTypeName):Clean(s.MarketName);
        var result=$"بازار «{value}»";
        if(!string.IsNullOrWhiteSpace(s.MarketTypeName)&&!string.Equals(Clean(s.MarketName),Clean(s.MarketTypeName),StringComparison.Ordinal)) result+=$" با نوع «{Clean(s.MarketTypeName)}»";
        return result;
    }
    private static string ComposeMarketSummary(MarketSymbolSnapshot s)
    {
        var identity=Clean(s.CompanyName??s.SymbolName);
        var classification=new List<string>();
        if(!string.IsNullOrWhiteSpace(s.MarketName)) classification.Add($"بازار {Clean(s.MarketName)}");
        if(!string.IsNullOrWhiteSpace(s.BoardName)) classification.Add($"تابلوی {Clean(s.BoardName)}");
        if(!string.IsNullOrWhiteSpace(s.StateName)) classification.Add($"وضعیت {Clean(s.StateName)}");
        var valuation=new List<string>();
        if(s.MarketValue is not null) valuation.Add($"ارزش بازار {s.MarketValue.Value:N0} ریال");
        if(s.PE is not null) valuation.Add($"P/E {s.PE:0.##}");
        if(s.Eps is not null) valuation.Add($"EPS {s.Eps:N0} ریال");
        return string.Join("\n",new[]
        {
            $"{s.Symbol} — {identity}",
            $"آخرین قیمت {s.LastPrice:N0} ریال ({SignedNumber(s.LastPricePercent)}٪) و قیمت پایانی {s.ClosingPrice:N0} ریال ({SignedNumber(s.ClosingPricePercent)}٪) است؛ بازه روز {s.MinPrice:N0} تا {s.MaxPrice:N0} ریال بوده است.",
            $"حجم معاملات {s.TradeVolume:N0} سهم در {s.TradeCount:N0} معامله و ارزش معاملات {s.TradeValue:N0} ریال است.",
            string.Join("، ",valuation)+".",
            string.Join("، ",classification)+$"؛ زمان داده {FormatObservedAt(s)}."
        }.Where(x=>!string.IsNullOrWhiteSpace(x)&&x!="."));
    }
    private static string FormatObservedAt(MarketSymbolSnapshot s)
    {
        DateTime? value=s.SourceLastModified;
        if(value is null && s.TradingDate>=19000101)
        {
            var raw=s.TradingDate.ToString("00000000",CultureInfo.InvariantCulture);
            if(DateTime.TryParseExact(raw,"yyyyMMdd",CultureInfo.InvariantCulture,DateTimeStyles.None,out var tradingDate))
            {
                var eventTime=s.EventTime.ToString("000000",CultureInfo.InvariantCulture);
                if(TimeSpan.TryParseExact(eventTime,@"hhmmss",CultureInfo.InvariantCulture,out var time)) tradingDate=tradingDate.Add(time);
                value=tradingDate;
            }
        }
        if(value is null) return "تاریخ نامشخص";
        var dt=value.Value;
        var persian=PersianDisplayText.FormatPersianDate(dt);
        var clock=dt.TimeOfDay==TimeSpan.Zero?"":$" ساعت {dt:HH:mm:ss}";
        return $"{persian}{clock}";
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
        // dbo.Content has no real title; its indexed title is generated from a
        // bounded prefix of Body. Removing that prefix can cut a word in half
        // (for example «مبلغ» -> «بلغ») and discard the most relevant facts.
        if(!hit.Citation.SourceType.Equals("cms_content",StringComparison.OrdinalIgnoreCase)
           && !string.IsNullOrWhiteSpace(title) && text.StartsWith(title,StringComparison.OrdinalIgnoreCase))
            text=text[title.Length..].Trim(' ','-','–','—',':','؛');
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
