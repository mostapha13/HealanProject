using System.Globalization;
using System.Text.RegularExpressions;

namespace TSEAI.Application.StructuredQuery;

public sealed class PersianNaturalLanguageStructuredQueryInterpreter : INaturalLanguageStructuredQueryInterpreter
{
    private static readonly Regex NumberRx = new(@"(?<n>[0-9۰-۹٠-٩]+(?:[\.,٫][0-9۰-۹٠-٩]+)?)", RegexOptions.Compiled);

    public StructuredQueryInterpretation Interpret(string question, int? requestedTake = null)
    {
        if (string.IsNullOrWhiteSpace(question)) return new(false, null, "empty_question", "متن سؤال خالی است.");
        var q = Normalize(question);
        var rules = new List<string>();
        var conditions = new List<StructuredQueryCondition>();
        var confidence = 0.55;

        AddCondition(q, conditions, rules, StructuredQueryMetric.PE, ["p/e", "pe", "پی ای", "پی‌ای"], ref confidence);
        AddCondition(q, conditions, rules, StructuredQueryMetric.EPS, ["eps", "ای پی اس", "ای‌پی‌اس"], ref confidence);
        AddCondition(q, conditions, rules, StructuredQueryMetric.TradeVolume, ["حجم معاملات", "حجم"], ref confidence);
        AddCondition(q, conditions, rules, StructuredQueryMetric.TradeValue, ["ارزش معاملات"], ref confidence);
        AddCondition(q, conditions, rules, StructuredQueryMetric.TradeCount, ["تعداد معاملات", "تعداد دادوستد", "تعداد تراکنش"], ref confidence);
        AddCondition(q, conditions, rules, StructuredQueryMetric.LastPricePercent, ["درصد آخرین قیمت", "درصد قیمت", "درصد تغییر"], ref confidence);
        AddCondition(q, conditions, rules, StructuredQueryMetric.LastPrice, ["آخرین قیمت", "قیمت آخر"], ref confidence);
        AddCondition(q, conditions, rules, StructuredQueryMetric.ClosingPrice, ["قیمت پایانی", "پایانی"], ref confidence);
        AddCondition(q, conditions, rules, StructuredQueryMetric.MarketValue, ["ارزش بازار"], ref confidence);
        AddCondition(q, conditions, rules, StructuredQueryMetric.FirstPrice, ["قیمت اولین معامله", "اولین قیمت", "قیمت آغازین", "قیمت بازگشایی"], ref confidence);
        AddCondition(q, conditions, rules, StructuredQueryMetric.YesterdayPrice, ["قیمت روز قبل", "قیمت دیروز", "قیمت مبنا"], ref confidence);
        AddCondition(q, conditions, rules, StructuredQueryMetric.HighPrice, ["بالاترین قیمت روز", "بیشترین قیمت روز", "سقف قیمت روز"], ref confidence);
        AddCondition(q, conditions, rules, StructuredQueryMetric.LowPrice, ["کمترین قیمت روز", "پایین ترین قیمت روز", "کف قیمت روز"], ref confidence);
        AddCondition(q, conditions, rules, StructuredQueryMetric.EffectOnIndex, ["اثر مثبت روی شاخص", "اثر منفی روی شاخص", "اثر مثبت بر شاخص", "اثر منفی بر شاخص", "اثر روی شاخص", "اثر بر شاخص", "تاثیر روی شاخص"], ref confidence);
        AddCondition(q, conditions, rules, StructuredQueryMetric.IntradayRange, ["دامنه نوسان روز", "بازه قیمت روز", "فاصله سقف و کف"], ref confidence);
        AddCondition(q, conditions, rules, StructuredQueryMetric.AverageTradePrice, ["میانگین قیمت معامله", "متوسط قیمت معامله"], ref confidence);
        AddCondition(q, conditions, rules, StructuredQueryMetric.AverageTradeValue, ["میانگین ارزش هر معامله", "متوسط ارزش هر معامله"], ref confidence);
        AddCondition(q, conditions, rules, StructuredQueryMetric.AverageTradeVolume, ["میانگین حجم هر معامله", "متوسط حجم هر معامله"], ref confidence);
        AddCondition(q, conditions, rules, StructuredQueryMetric.TurnoverRatio, ["نسبت گردش معاملات", "نسبت ارزش معاملات به ارزش بازار"], ref confidence);
        AddCondition(q, conditions, rules, StructuredQueryMetric.BuyerPower, ["قدرت خریدار", "قدرت خرید حقیقی"], ref confidence);
        AddCondition(q, conditions, rules, StructuredQueryMetric.OrderBookImbalance, ["عدم تعادل اردربوک", "عدم‌تعادل اردربوک", "orderbook imbalance"], ref confidence);
        AddCondition(q, conditions, rules, StructuredQueryMetric.BestBidPrice, ["بهترین قیمت خرید", "قیمت سرخط خرید"], ref confidence);
        AddCondition(q, conditions, rules, StructuredQueryMetric.BestBidVolume, ["حجم بهترین سفارش خرید", "حجم سرخط خرید", "حجم بهترین تقاضا"], ref confidence);
        AddCondition(q, conditions, rules, StructuredQueryMetric.BestAskPrice, ["بهترین قیمت فروش", "قیمت سرخط فروش"], ref confidence);
        AddCondition(q, conditions, rules, StructuredQueryMetric.BestAskVolume, ["حجم بهترین سفارش فروش", "حجم سرخط فروش", "حجم بهترین عرضه"], ref confidence);
        AddCondition(q, conditions, rules, StructuredQueryMetric.SpreadPercent, ["درصد اختلاف مظنه", "درصد اسپرد"], ref confidence);
        AddCondition(q, conditions, rules, StructuredQueryMetric.Spread, ["اختلاف مظنه", "اسپرد", "فاصله خرید و فروش"], ref confidence);
        AddCondition(q, conditions, rules, StructuredQueryMetric.TotalBidVolume, ["عمق خرید", "مجموع حجم خرید", "کل حجم خرید"], ref confidence);
        AddCondition(q, conditions, rules, StructuredQueryMetric.TotalAskVolume, ["عمق فروش", "مجموع حجم فروش", "کل حجم فروش"], ref confidence);
        AddCondition(q, conditions, rules, StructuredQueryMetric.TotalBidCount, ["مجموع تعداد سفارش خرید", "کل تعداد سفارش خرید"], ref confidence);
        AddCondition(q, conditions, rules, StructuredQueryMetric.TotalAskCount, ["مجموع تعداد سفارش فروش", "کل تعداد سفارش فروش"], ref confidence);
        AddCondition(q, conditions, rules, StructuredQueryMetric.DepthRatio, ["نسبت عمق خرید به فروش", "نسبت تقاضا به عرضه"], ref confidence);
        AddCondition(q, conditions, rules, StructuredQueryMetric.VolumeVsBaseVolume, ["نسبت حجم به حجم مبنا", "حجم نسبت به حجم مبنا"], ref confidence);

        var (sortBy, desc) = DetectSort(q, rules, ref confidence);
        var take = Math.Clamp(DetectTake(q) ?? Math.Min(requestedTake ?? 10, 10), 1, 200);
        int? marketTypeId = DetectMarketType(q, rules, ref confidence);
        var screeningLanguage = ContainsAny(q, "نمادها", "نماد های", "نمادهای", "سهم ها", "سهم‌ها", "سهام", "کدام", "بیشترین", "کمترین", "برتر", "بالا", "زیاد", "پرحجم", "اول", "لیست", "فهرست", "پیدا کن", "نشون بده", "نشان بده");

        if (conditions.Count == 0 && sortBy is null)
            return new(false, null, "structured_query_not_detected", null);
        if (!screeningLanguage && conditions.Count == 1 && sortBy is null)
            confidence -= 0.12;

        if (confidence < 0.60)
            return new(false, null, "low_confidence", "منظور شرط یا رتبه‌بندی بازار با اطمینان کافی تشخیص داده نشد.");

        var explanation = BuildExplanation(conditions, sortBy, desc, take, marketTypeId);
        return new(true, new StructuredQueryPlan(conditions, sortBy, desc, take, marketTypeId, null, Math.Clamp(confidence, 0, 0.99), explanation, rules), null, null);
    }

    private static void AddCondition(string q, List<StructuredQueryCondition> output, List<string> rules, StructuredQueryMetric metric, string[] aliases, ref double confidence)
    {
        foreach (var alias in aliases.OrderByDescending(x => x.Length))
        {
            var idx = q.IndexOf(alias, StringComparison.Ordinal);
            if (idx < 0) continue;
            var window = q.Substring(idx + alias.Length, Math.Min(48, q.Length - idx - alias.Length));
            if (!TryReadOperatorAndNumber(window, metric, out var op, out var value)) continue;
            if (output.Any(x => x.Metric == metric)) return;
            output.Add(new(metric, op, value));
            rules.Add($"condition:{metric}:{op}");
            confidence += 0.12;
            return;
        }
    }

    private static bool TryReadOperatorAndNumber(string text, StructuredQueryMetric metric, out StructuredQueryOperator op, out decimal value)
    {
        op = StructuredQueryOperator.Equal; value = 0;
        var m = NumberRx.Match(text);
        if (!m.Success) return false;
        var prefix = text[..m.Index].Trim();
        var number = NormalizeDigits(m.Groups["n"].Value).Replace('٫', '.').Replace(',', '.');
        if (!decimal.TryParse(number, NumberStyles.Number, CultureInfo.InvariantCulture, out value)) return false;
        var suffix = text[(m.Index + m.Length)..].TrimStart();
        value *= DetectUnitMultiplier(suffix);
        if (IsMoneyMetric(metric) && suffix.StartsWith("تومان", StringComparison.Ordinal)) value *= 10m;
        op = prefix switch
        {
            var x when ContainsAny(x, "کمتر یا مساوی", "کوچکتر یا مساوی", "<=") => StructuredQueryOperator.LessThanOrEqual,
            var x when ContainsAny(x, "بیشتر یا مساوی", "بزرگتر یا مساوی", ">=") => StructuredQueryOperator.GreaterThanOrEqual,
            var x when ContainsAny(x, "کمتر", "زیر", "کوچکتر", "<") => StructuredQueryOperator.LessThan,
            var x when ContainsAny(x, "بیشتر", "بالای", "بالاتر", "بزرگتر", ">") => StructuredQueryOperator.GreaterThan,
            var x when ContainsAny(x, "برابر نیست", "!=") => StructuredQueryOperator.NotEqual,
            _ => StructuredQueryOperator.Equal
        };
        return true;
    }

    private static decimal DetectUnitMultiplier(string suffix)
    {
        if (suffix.StartsWith("هزار میلیارد", StringComparison.Ordinal) || suffix.StartsWith("تریلیون", StringComparison.Ordinal) || suffix.StartsWith("همت", StringComparison.Ordinal)) return 1_000_000_000_000m;
        if (suffix.StartsWith("میلیارد", StringComparison.Ordinal)) return 1_000_000_000m;
        if (suffix.StartsWith("میلیون", StringComparison.Ordinal)) return 1_000_000m;
        if (suffix.StartsWith("هزار", StringComparison.Ordinal)) return 1_000m;
        return 1m;
    }

    private static bool IsMoneyMetric(StructuredQueryMetric metric) =>
        metric is StructuredQueryMetric.TradeValue or StructuredQueryMetric.MarketValue or StructuredQueryMetric.LastPrice or StructuredQueryMetric.ClosingPrice
            or StructuredQueryMetric.FirstPrice or StructuredQueryMetric.YesterdayPrice or StructuredQueryMetric.HighPrice or StructuredQueryMetric.LowPrice
            or StructuredQueryMetric.AverageTradePrice or StructuredQueryMetric.AverageTradeValue or StructuredQueryMetric.BestBidPrice
            or StructuredQueryMetric.BestAskPrice or StructuredQueryMetric.Spread;

    private static (StructuredQueryMetric? Metric, bool Desc) DetectSort(string q, List<string> rules, ref double confidence)
    {
        bool desc = ContainsAny(q, "بیشترین", "بالاترین", "بزرگترین", "برتر", "بالا", "زیاد", "پرحجم", "اول از نظر", "top", "تاپ");
        bool asc = ContainsAny(q, "کمترین", "پایین ترین", "پایین‌ترین", "کوچکترین");
        if (!desc && !asc) return (null, true);
        StructuredQueryMetric? metric = null;
        if (ContainsAny(q,"صف خرید")) metric=StructuredQueryMetric.BuyQueueVolume;
        else if (ContainsAny(q,"صف فروش")) metric=StructuredQueryMetric.SellQueueVolume;
        else if (ContainsAny(q,"حجم بهترین سفارش خرید","حجم سرخط خرید","حجم بهترین تقاضا")) metric=StructuredQueryMetric.BestBidVolume;
        else if (ContainsAny(q,"تعداد سفارش بهترین خرید","تعداد سفارش سرخط خرید")) metric=StructuredQueryMetric.BestBidCount;
        else if (ContainsAny(q,"حجم بهترین سفارش فروش","حجم سرخط فروش","حجم بهترین عرضه")) metric=StructuredQueryMetric.BestAskVolume;
        else if (ContainsAny(q,"تعداد سفارش بهترین فروش","تعداد سفارش سرخط فروش")) metric=StructuredQueryMetric.BestAskCount;
        else if (ContainsAny(q,"مجموع تعداد سفارش خرید","کل تعداد سفارش خرید")) metric=StructuredQueryMetric.TotalBidCount;
        else if (ContainsAny(q,"مجموع تعداد سفارش فروش","کل تعداد سفارش فروش")) metric=StructuredQueryMetric.TotalAskCount;
        else if (ContainsAny(q,"عمق خرید","مجموع حجم خرید","کل حجم خرید")) metric=StructuredQueryMetric.TotalBidVolume;
        else if (ContainsAny(q,"عمق فروش","مجموع حجم فروش","کل حجم فروش")) metric=StructuredQueryMetric.TotalAskVolume;
        else if (ContainsAny(q,"عدم تعادل","ایمبالانس","orderbook imbalance")) metric=StructuredQueryMetric.OrderBookImbalance;
        else if (ContainsAny(q,"درصد اختلاف مظنه","درصد اسپرد","اسپرد درصدی")) metric=StructuredQueryMetric.SpreadPercent;
        else if (ContainsAny(q,"اختلاف مظنه","اسپرد","فاصله خرید و فروش")) metric=StructuredQueryMetric.Spread;
        else if (ContainsAny(q,"نسبت عمق خرید به فروش","نسبت تقاضا به عرضه")) metric=StructuredQueryMetric.DepthRatio;
        else if (ContainsAny(q,"بهترین قیمت خرید","قیمت سرخط خرید")) metric=StructuredQueryMetric.BestBidPrice;
        else if (ContainsAny(q,"بهترین قیمت فروش","قیمت سرخط فروش")) metric=StructuredQueryMetric.BestAskPrice;
        else if (ContainsAny(q, "نسبت گردش معاملات", "نسبت ارزش معاملات به ارزش بازار")) metric = StructuredQueryMetric.TurnoverRatio;
        else if (ContainsAny(q, "حجم معاملات", "حجم")) metric = StructuredQueryMetric.TradeVolume;
        else if (ContainsAny(q, "ارزش معاملات")) metric = StructuredQueryMetric.TradeValue;
        else if (ContainsAny(q, "تعداد معاملات", "تعداد دادوستد", "تعداد تراکنش")) metric = StructuredQueryMetric.TradeCount;
        else if (ContainsAny(q, "ارزش بازار")) metric = StructuredQueryMetric.MarketValue;
        else if (ContainsAny(q, "اثر مثبت روی شاخص", "اثر منفی روی شاخص", "اثر مثبت بر شاخص", "اثر منفی بر شاخص", "اثر روی شاخص", "اثر بر شاخص", "تاثیر روی شاخص")) metric = StructuredQueryMetric.EffectOnIndex;
        else if (ContainsAny(q, "دامنه نوسان روز", "بازه قیمت روز", "فاصله سقف و کف")) metric = StructuredQueryMetric.IntradayRange;
        else if (ContainsAny(q, "میانگین قیمت معامله", "متوسط قیمت معامله")) metric = StructuredQueryMetric.AverageTradePrice;
        else if (ContainsAny(q, "میانگین ارزش هر معامله", "متوسط ارزش هر معامله")) metric = StructuredQueryMetric.AverageTradeValue;
        else if (ContainsAny(q, "میانگین حجم هر معامله", "متوسط حجم هر معامله")) metric = StructuredQueryMetric.AverageTradeVolume;
        else if (ContainsAny(q, "درصد تغییر", "رشد", "افت", "ریزش", "منفی ترین", "منفی‌ترین")) metric = StructuredQueryMetric.LastPricePercent;
        else if (ContainsAny(q, "بالاترین قیمت روز", "بیشترین قیمت روز", "سقف قیمت روز")) metric = StructuredQueryMetric.HighPrice;
        else if (ContainsAny(q, "کمترین قیمت روز", "پایین ترین قیمت روز", "پایین‌ترین قیمت روز", "کف قیمت روز")) metric = StructuredQueryMetric.LowPrice;
        else if (ContainsAny(q, "قیمت اولین معامله", "اولین قیمت", "قیمت آغازین", "قیمت بازگشایی")) metric = StructuredQueryMetric.FirstPrice;
        else if (ContainsAny(q, "قیمت روز قبل", "قیمت دیروز", "قیمت مبنا")) metric = StructuredQueryMetric.YesterdayPrice;
        else if (ContainsAny(q, "قیمت پایانی", "پایانی")) metric = StructuredQueryMetric.ClosingPrice;
        else if (ContainsAny(q, "آخرین قیمت", "قیمت آخر")) metric = StructuredQueryMetric.LastPrice;
        else if (ContainsAny(q, "p/e", "pe", "پی ای", "پی‌ای")) metric = StructuredQueryMetric.PE;
        else if (ContainsAny(q, "قدرت خریدار")) metric = StructuredQueryMetric.BuyerPower;
        else if (ContainsAny(q, "درصد")) metric = StructuredQueryMetric.LastPricePercent;
        if(metric==StructuredQueryMetric.EffectOnIndex && ContainsAny(q,"اثر منفی","تاثیر منفی","تأثیر منفی")) { desc=false; asc=true; }
        if(metric==StructuredQueryMetric.LastPricePercent && ContainsAny(q,"بیشترین افت","بیشترین ریزش","منفی ترین","منفی‌ترین")) { desc=false; asc=true; }
        if(metric==StructuredQueryMetric.OrderBookImbalance && ContainsAny(q,"منفی","فشار فروش","عرضه")) { desc=false; asc=true; }
        if (metric is not null) { rules.Add($"sort:{metric}:{(desc ? "desc" : "asc")}"); confidence += 0.16; }
        return (metric, desc || !asc);
    }

    private static int? DetectTake(string q)
    {
        foreach (Match m in NumberRx.Matches(q))
        {
            var tail = q[Math.Min(q.Length, m.Index + m.Length)..];
            var head = q[..m.Index];
            if (!ContainsAny(head, "اول", "برتر", "بیشترین", "کمترین", "تاپ", "top") && !ContainsAny(tail, "نماد", "سهم")) continue;
            if (int.TryParse(NormalizeDigits(m.Groups["n"].Value), out var n)) return n;
        }
        var words=new Dictionary<string,int>(StringComparer.Ordinal)
        {
            ["یک"]=1,["دو"]=2,["سه"]=3,["چهار"]=4,["پنج"]=5,["شش"]=6,["هفت"]=7,["هشت"]=8,["نه"]=9,["ده"]=10
        };
        foreach(var pair in words)
            if(Regex.IsMatch(q,$@"(?:^|\s){Regex.Escape(pair.Key)}\s+(?:نماد|سهم)")) return pair.Value;
        return null;
    }

    private static int? DetectMarketType(string q, List<string> rules, ref double confidence)
    {
        if (ContainsAny(q, "فرابورس")) { rules.Add("market:farabourse"); confidence += 0.05; return 30; }
        if (ContainsAny(q, "بورس تهران", "بورس")) { rules.Add("market:tse"); confidence += 0.05; return 20; }
        return null;
    }

    private static string BuildExplanation(IReadOnlyList<StructuredQueryCondition> conditions, StructuredQueryMetric? sort, bool desc, int take, int? market)
    {
        var parts = conditions.Select(c => $"{c.Metric} {c.Operator} {c.Value.ToString(CultureInfo.InvariantCulture)}").ToList();
        if (sort is not null) parts.Add($"مرتب‌سازی {(desc ? "نزولی" : "صعودی")} بر اساس {sort}");
        if (market is not null) parts.Add($"MarketTypeId={market}");
        parts.Add($"حداکثر {take} نتیجه");
        return string.Join("؛ ", parts);
    }

    private static string Normalize(string s) => NormalizeDigits(s.Trim().ToLowerInvariant().Replace('ي','ی').Replace('ى','ی').Replace('ك','ک').Replace('ۀ','ه').Replace('ة','ه').Replace('‌',' ')).Replace("  ", " ");
    private static string NormalizeDigits(string s) => string.Concat(s.Select(ch => ch switch { >= '۰' and <= '۹' => (char)('0' + ch - '۰'), >= '٠' and <= '٩' => (char)('0' + ch - '٠'), _ => ch }));
    private static bool ContainsAny(string text, params string[] values) => values.Any(v => text.Contains(v, StringComparison.Ordinal));
}
