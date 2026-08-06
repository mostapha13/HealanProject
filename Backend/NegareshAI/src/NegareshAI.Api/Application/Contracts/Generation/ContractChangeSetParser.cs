using System.Globalization;
using System.Text.RegularExpressions;
using NegareshAI.Api.Application.Common.Dates;
using NegareshAI.Api.Data;

namespace NegareshAI.Api.Application.Contracts.Generation;

public sealed record ContractChangeSet(
    DateOnly? StartDate, DateOnly? EndDate, decimal? Amount, decimal? IncreasePercent,
    decimal? CalculatedAmount, string? NewClause, IReadOnlyList<string> Questions,
    DateOnly? FirstPaymentDate = null, DateOnly? SecondPaymentDate = null,
    IReadOnlyList<string>? NewClauses = null);

public static partial class ContractChangeSetParser
{
    public static ContractChangeSet Parse(string instruction, Contract contract)
    {
        var normalized = NormalizePersianMonthDates(NormalizeGroupedNumbers(ToLatinDigits(instruction)));
        var invalidDates = new List<string>();
        DateOnly? firstPaymentDate = null;
        DateOnly? secondPaymentDate = null;
        var paymentDateSpans = new HashSet<(int Index, int Length)>();
        foreach (Match paymentMatch in PaymentDateRegex().Matches(normalized))
        {
            var dateGroup = paymentMatch.Groups["date"];
            paymentDateSpans.Add((dateGroup.Index, dateGroup.Length));
            var parsed = TryParseFlexiblePersianDate(dateGroup.Value);
            if (!parsed.HasValue) invalidDates.Add(dateGroup.Value);
            else if (paymentMatch.Groups["order"].Value is "اول" or "نخست" or "یکم" or "1")
                firstPaymentDate = parsed;
            else
                secondPaymentDate = parsed;
        }
        var dateMatches = DateRegex().Matches(normalized).Cast<Match>()
            .Where(match => !paymentDateSpans.Contains((match.Index, match.Length))).ToList();
        var dates = dateMatches.Select(match =>
        {
            var parsed = TryParseFlexiblePersianDate(match.Value);
            if (!parsed.HasValue) invalidDates.Add(match.Value);
            return parsed;
        }).Where(value => value.HasValue).Select(value => value!.Value).ToList();
        var percentMatch = PercentRegex().Matches(normalized).LastOrDefault();
        var amountMatch = AmountRegex().Matches(normalized).LastOrDefault();
        decimal? percent = percentMatch is { Success: true }
            ? decimal.Parse(percentMatch.Groups[1].Value, CultureInfo.InvariantCulture) : null;
        decimal? explicitAmount = amountMatch is { Success: true }
            ? decimal.Parse(amountMatch.Groups[1].Value, CultureInfo.InvariantCulture) : null;
        decimal? percentAmount = percent.HasValue && contract.Amount.HasValue
            ? decimal.Round(contract.Amount.Value * (1 + percent.Value / 100m), 2) : null;
        decimal? calculated = explicitAmount ?? percentAmount;
        var clauses = ExtractClauses(instruction);
        var questions = new List<string>();
        if (invalidDates.Count > 0)
            questions.Add($"تاریخ «{invalidDates[^1]}» شمسی معتبر نیست؛ تاریخ را با قالب سال/ماه/روز، مانند ۱۴۰۵/۱۲/۲۹، وارد کنید.");
        if (dates.Count == 1 && contract.EndDate.HasValue && contract.EndDate.Value <= dates[0])
            questions.Add("تاریخ پایان قرارداد جدید را مشخص کنید؛ تاریخ پایان قرارداد سابق قبل از شروع جدید است و قابل استفاده نیست.");
        else if (dates.Count < 2 && (!contract.StartDate.HasValue || !contract.EndDate.HasValue))
            questions.Add("تاریخ شروع و پایان قرارداد را مشخص کنید.");
        if (!calculated.HasValue)
            questions.Add("مبلغ نهایی یا درصد تغییر مبلغ را مشخص کنید.");
        var explicitWins = normalized.Contains("مبلغ قطعی", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("مبلغ صریح", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("مبلغ اعلام", StringComparison.OrdinalIgnoreCase);
        var percentWins = normalized.Contains("درصد مبنا", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("درصد اعمال", StringComparison.OrdinalIgnoreCase);
        if (percentWins) calculated = percentAmount;
        else if (explicitWins) calculated = explicitAmount;
        if (explicitAmount.HasValue && percentAmount.HasValue && !explicitWins && !percentWins &&
            Math.Abs(explicitAmount.Value - percentAmount.Value) > 1m)
            questions.Add($"مبلغ صریح ({explicitAmount:N0}) با مبلغ حاصل از درصد ({percentAmount:N0}) متفاوت است؛ کدام مبنا اعمال شود؟");
        if (clauses.Count == 0 &&
            (instruction.Contains("بند") || instruction.Contains("ماده")))
            questions.Add("متن یا موضوع دقیق بند جدید را مشخص کنید.");
        var selectedDates = dates.Count >= 2 ? dates.TakeLast(2).ToArray() : dates.ToArray();
        DateOnly? effectiveStart = selectedDates.Length > 0 ? selectedDates[0] : null;
        DateOnly? effectiveEnd = selectedDates.Length > 1 ? selectedDates[1] : null;
        var mentionsPaymentSchedule = PaymentDateRegex().IsMatch(normalized);
        if (mentionsPaymentSchedule && (!firstPaymentDate.HasValue || !secondPaymentDate.HasValue))
            questions.Add("تاریخ پرداخت اول و پرداخت دوم را مشخص کنید.");
        if (firstPaymentDate.HasValue && secondPaymentDate.HasValue
            && secondPaymentDate <= firstPaymentDate)
            questions.Add("تاریخ پرداخت دوم باید بعد از پرداخت اول باشد.");
        if (effectiveStart.HasValue && effectiveEnd.HasValue
            && ((firstPaymentDate.HasValue && (firstPaymentDate.Value < effectiveStart.Value
                    || firstPaymentDate.Value > effectiveEnd.Value))
                || (secondPaymentDate.HasValue && (secondPaymentDate.Value < effectiveStart.Value
                    || secondPaymentDate.Value > effectiveEnd.Value))))
            questions.Add("تاریخ‌های پرداخت باید داخل بازه قرارداد باشند.");
        return new(effectiveStart, effectiveEnd, explicitAmount,
            percent, calculated, clauses.LastOrDefault(), questions, firstPaymentDate,
            secondPaymentDate, clauses);
    }

    private static IReadOnlyList<string> ExtractClauses(string instruction)
    {
        var candidates = new List<(int Index, string Text)>();
        var occupied = new List<(int Start, int End)>();
        AddMatches(QuotedClauseRegex().Matches(instruction), candidates, occupied);
        AddMatches(QuotedClauseBeforeActionRegex().Matches(instruction), candidates, occupied);
        AddMatches(ClauseRegex().Matches(instruction), candidates, occupied, skipQuoted: true);
        AddMatches(RequiredClauseRegex().Matches(instruction), candidates, occupied, skipQuoted: true);
        AddMatches(BroadClauseRegex().Matches(instruction), candidates, occupied, skipQuoted: true);
        return candidates.OrderBy(x => x.Index).Select(x => CleanClause(x.Text))
            .Where(x => !string.IsNullOrWhiteSpace(x)).Distinct(StringComparer.OrdinalIgnoreCase).ToArray();
    }

    private static void AddMatches(MatchCollection matches, List<(int Index, string Text)> target,
        List<(int Start, int End)> occupied, bool skipQuoted = false)
    {
        foreach (Match match in matches)
        {
            if (skipQuoted && (match.Value.Contains('"') || match.Value.Contains('«'))) continue;
            var end = match.Index + match.Length;
            if (occupied.Any(range => match.Index < range.End && end > range.Start)) continue;
            if (match.Groups.Count > 1)
            {
                target.Add((match.Index, match.Groups[1].Value));
                occupied.Add((match.Index, end));
            }
        }
    }

    private static string CleanClause(string value) =>
        value.Trim().Trim('"', '«', '»', ' ', '.', '،', '؛');

    private static string ToLatinDigits(string value) => value
        .Replace('۰', '0').Replace('۱', '1').Replace('۲', '2').Replace('۳', '3')
        .Replace('۴', '4').Replace('۵', '5').Replace('۶', '6').Replace('۷', '7')
        .Replace('۸', '8').Replace('۹', '9').Replace('٠', '0').Replace('١', '1')
        .Replace('٢', '2').Replace('٣', '3').Replace('٤', '4').Replace('٥', '5')
        .Replace('٦', '6').Replace('٧', '7').Replace('٨', '8').Replace('٩', '9');

    private static string NormalizeGroupedNumbers(string value) =>
        GroupedNumberRegex().Replace(value, match => Regex.Replace(match.Value, @"[/.,٬،]", ""))
            .Replace("٬", "").Replace(",", "");

    private static string NormalizePersianMonthDates(string value)
    {
        var months = new Dictionary<string, int>
        {
            ["فروردین"] = 1, ["اردیبهشت"] = 2, ["خرداد"] = 3, ["تیر"] = 4,
            ["مرداد"] = 5, ["شهریور"] = 6, ["مهر"] = 7, ["آبان"] = 8,
            ["آذر"] = 9, ["دی"] = 10, ["بهمن"] = 11, ["اسفند"] = 12
        };
        var monthPattern = string.Join('|', months.Keys.OrderByDescending(x => x.Length));
        value = Regex.Replace(value,
            $@"(?<!\d)(\d{{1,2}})\s+({monthPattern})\s+(1[3-5]\d{{2}})(?!\d)",
            match => $"{match.Groups[3].Value}/{months[match.Groups[2].Value]:00}/{int.Parse(match.Groups[1].Value):00}");
        return Regex.Replace(value,
            $@"(?<!\d)(1[3-5]\d{{2}})\s+({monthPattern})\s+(\d{{1,2}})(?!\d)",
            match => $"{match.Groups[1].Value}/{months[match.Groups[2].Value]:00}/{int.Parse(match.Groups[3].Value):00}");
    }

    private static DateOnly? TryParseFlexiblePersianDate(string value)
    {
        var parts = Regex.Split(value, @"[/.\-]").Select(int.Parse).ToArray();
        if (parts.Length != 3) return null;
        var candidates = parts[0] is >= 1300 and <= 1600
            ? new[] { (Year: parts[0], Month: parts[1], Day: parts[2]),
                      (Year: parts[0], Month: parts[2], Day: parts[1]) }
            : parts[2] is >= 1300 and <= 1600
                ? new[] { (Year: parts[2], Month: parts[1], Day: parts[0]),
                          (Year: parts[2], Month: parts[0], Day: parts[1]) }
                : [];
        foreach (var candidate in candidates.Distinct())
        {
            if (candidate.Month is < 1 or > 12 || candidate.Day is < 1 or > 31) continue;
            try
            {
                return PersianDate.ParseDateOnly(
                    $"{candidate.Year:0000}/{candidate.Month:00}/{candidate.Day:00}");
            }
            catch (FormatException) { }
        }
        return null;
    }

    [GeneratedRegex(@"(?<!\d)(?:1[3-5]\d{2}[/.\-]\d{1,2}[/.\-]\d{1,2}|\d{1,2}[/.\-]\d{1,2}[/.\-]1[3-5]\d{2})(?!\d)")]
    private static partial Regex DateRegex();
    [GeneratedRegex(@"(?<!\d)\d{1,3}(?:[/.,٬،]\d{3}){2,}(?![/\d])")]
    private static partial Regex GroupedNumberRegex();
    [GeneratedRegex(@"(\d+(?:\.\d+)?)\s*درصد")]
    private static partial Regex PercentRegex();
    [GeneratedRegex(@"(\d{6,})\s*(?:ریال|تومان)")]
    private static partial Regex AmountRegex();
    [GeneratedRegex(@"(?:بند|ماده)(?:\s+جدید)?\s+(.+?)(?:\s+(?:را|به\s+(?:آن|قرارداد))\s+)?(?:اضافه|الحاق)(?:\s+(?:کن(?:ید)?|شود))")]
    private static partial Regex ClauseRegex();
    [GeneratedRegex("(?:بند|ماده)(?:\\s+جدید)?.*?(?:اضافه|الحاق).*?(?:که|:)?\\s*[\\\"«](.+?)[\\\"»]", RegexOptions.Singleline)]
    private static partial Regex QuotedClauseRegex();
    [GeneratedRegex("(?:بند|ماده)(?:\\s+جدید)?\\s*[\\\"«](.+?)[\\\"»]\\s*(?:هم\\s*)?(?:به\\s+قرارداد\\s*)?(?:اضافه|الحاق)", RegexOptions.Singleline)]
    private static partial Regex QuotedClauseBeforeActionRegex();
    [GeneratedRegex(@"بند\s+(.+?)\s+(?:باید\s+)?(?:باشد|باشه)(?=(?:[.،؛]|\s+و\s+|$))")]
    private static partial Regex RequiredClauseRegex();
    [GeneratedRegex(@"بند\s+(.{8,}?)(?=(?:\n|$))")]
    private static partial Regex BroadClauseRegex();
    [GeneratedRegex(@"(?:پرداخت|قسط)\s*(?<order>اول|نخست|یکم|1|دوم|2)\s*(?:در\s*)?(?:تاریخ\s*)?(?<date>(?:1[3-5]\d{2}[/.-]\d{1,2}[/.-]\d{1,2}|\d{1,2}[/.-]\d{1,2}[/.-]1[3-5]\d{2}))")]
    private static partial Regex PaymentDateRegex();
}
