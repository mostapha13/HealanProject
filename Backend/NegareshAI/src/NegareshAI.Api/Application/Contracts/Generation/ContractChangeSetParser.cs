using System.Globalization;
using System.Text.RegularExpressions;
using NegareshAI.Api.Application.Common.Dates;
using NegareshAI.Api.Data;

namespace NegareshAI.Api.Application.Contracts.Generation;

public sealed record ContractChangeSet(
    DateOnly? StartDate, DateOnly? EndDate, decimal? Amount, decimal? IncreasePercent,
    decimal? CalculatedAmount, string? NewClause, IReadOnlyList<string> Questions);

public static partial class ContractChangeSetParser
{
    public static ContractChangeSet Parse(string instruction, Contract contract)
    {
        var normalized = ToLatinDigits(instruction).Replace("٬", "").Replace(",", "");
        var dates = DateRegex().Matches(normalized).Select(match =>
        {
            try { return PersianDate.ParseDateOnly(match.Value); }
            catch (FormatException) { return (DateOnly?)null; }
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
        var clause = ClauseRegex().Matches(instruction).LastOrDefault();
        var broadClause = BroadClauseRegex().Matches(instruction).LastOrDefault();
        var questions = new List<string>();
        if (dates.Count < 2 && (!contract.StartDate.HasValue || !contract.EndDate.HasValue))
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
        var clauseText = clause is { Success: true } ? clause.Groups[1].Value.Trim()
            : broadClause is { Success: true } ? broadClause.Groups[1].Value.Trim() : null;
        if (string.IsNullOrWhiteSpace(clauseText) && instruction.Contains("بند"))
            questions.Add("متن یا موضوع دقیق بند جدید را مشخص کنید.");
        var selectedDates = dates.Count >= 2 ? dates.TakeLast(2).ToArray() : dates.ToArray();
        return new(selectedDates.ElementAtOrDefault(0), selectedDates.ElementAtOrDefault(1), explicitAmount,
            percent, calculated, clauseText, questions);
    }

    private static string ToLatinDigits(string value) => value
        .Replace('۰', '0').Replace('۱', '1').Replace('۲', '2').Replace('۳', '3')
        .Replace('۴', '4').Replace('۵', '5').Replace('۶', '6').Replace('۷', '7')
        .Replace('۸', '8').Replace('۹', '9').Replace('٠', '0').Replace('١', '1')
        .Replace('٢', '2').Replace('٣', '3').Replace('٤', '4').Replace('٥', '5')
        .Replace('٦', '6').Replace('٧', '7').Replace('٨', '8').Replace('٩', '9');

    [GeneratedRegex(@"\b1[34]\d{2}[\/\-]\d{1,2}[\/\-]\d{1,2}\b")]
    private static partial Regex DateRegex();
    [GeneratedRegex(@"(\d+(?:\.\d+)?)\s*درصد")]
    private static partial Regex PercentRegex();
    [GeneratedRegex(@"(\d{6,})\s*(?:ریال|تومان)")]
    private static partial Regex AmountRegex();
    [GeneratedRegex(@"بند\s+(.+?)(?:\s+را\s+)?(?:اضافه|الحاق)(?:\s+کن|\s+شود|$)")]
    private static partial Regex ClauseRegex();
    [GeneratedRegex(@"بند\s+(.{8,}?)(?=(?:\n|$))")]
    private static partial Regex BroadClauseRegex();
}
