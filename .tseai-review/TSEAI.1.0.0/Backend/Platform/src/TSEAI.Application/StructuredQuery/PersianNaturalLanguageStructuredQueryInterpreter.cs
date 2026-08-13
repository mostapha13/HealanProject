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
        AddCondition(q, conditions, rules, StructuredQueryMetric.TradeCount, ["تعداد معاملات"], ref confidence);
        AddCondition(q, conditions, rules, StructuredQueryMetric.LastPricePercent, ["درصد آخرین قیمت", "درصد قیمت", "درصد تغییر"], ref confidence);
        AddCondition(q, conditions, rules, StructuredQueryMetric.LastPrice, ["آخرین قیمت", "قیمت آخر"], ref confidence);
        AddCondition(q, conditions, rules, StructuredQueryMetric.ClosingPrice, ["قیمت پایانی", "پایانی"], ref confidence);
        AddCondition(q, conditions, rules, StructuredQueryMetric.MarketValue, ["ارزش بازار"], ref confidence);
        AddCondition(q, conditions, rules, StructuredQueryMetric.BuyerPower, ["قدرت خریدار", "قدرت خرید حقیقی"], ref confidence);
        AddCondition(q, conditions, rules, StructuredQueryMetric.OrderBookImbalance, ["عدم تعادل اردربوک", "عدم‌تعادل اردربوک", "orderbook imbalance"], ref confidence);
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
        metric is StructuredQueryMetric.TradeValue or StructuredQueryMetric.MarketValue or StructuredQueryMetric.LastPrice or StructuredQueryMetric.ClosingPrice;

    private static (StructuredQueryMetric? Metric, bool Desc) DetectSort(string q, List<string> rules, ref double confidence)
    {
        bool desc = ContainsAny(q, "بیشترین", "بالاترین", "بزرگترین", "برتر", "بالا", "زیاد", "پرحجم", "top", "تاپ");
        bool asc = ContainsAny(q, "کمترین", "پایین ترین", "پایین‌ترین", "کوچکترین");
        if (!desc && !asc) return (null, true);
        StructuredQueryMetric? metric = null;
        if (ContainsAny(q, "حجم معاملات", "حجم")) metric = StructuredQueryMetric.TradeVolume;
        else if (ContainsAny(q, "ارزش معاملات")) metric = StructuredQueryMetric.TradeValue;
        else if (ContainsAny(q, "تعداد معاملات")) metric = StructuredQueryMetric.TradeCount;
        else if (ContainsAny(q, "ارزش بازار")) metric = StructuredQueryMetric.MarketValue;
        else if (ContainsAny(q, "p/e", "pe", "پی ای", "پی‌ای")) metric = StructuredQueryMetric.PE;
        else if (ContainsAny(q, "قدرت خریدار")) metric = StructuredQueryMetric.BuyerPower;
        else if (ContainsAny(q, "درصد", "رشد", "افت")) metric = StructuredQueryMetric.LastPricePercent;
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
