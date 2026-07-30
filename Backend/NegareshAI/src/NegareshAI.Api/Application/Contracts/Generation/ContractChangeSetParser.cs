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
        var percentMatch = PercentRegex().Match(normalized);
        var amountMatch = AmountRegex().Match(normalized);
        decimal? percent = percentMatch.Success
            ? decimal.Parse(percentMatch.Groups[1].Value, CultureInfo.InvariantCulture) : null;
        decimal? explicitAmount = amountMatch.Success
            ? decimal.Parse(amountMatch.Groups[1].Value, CultureInfo.InvariantCulture) : null;
        decimal? calculated = explicitAmount ??
            (percent.HasValue && contract.Amount.HasValue
                ? decimal.Round(contract.Amount.Value * (1 + percent.Value / 100m), 2)
                : null);
        var clause = ClauseRegex().Match(instruction);
        var questions = new List<string>();
        if (dates.Count < 2 && (!contract.StartDate.HasValue || !contract.EndDate.HasValue))
            questions.Add("تاریخ شروع و پایان قرارداد را مشخص کنید.");
        if (!calculated.HasValue)
            questions.Add("مبلغ نهایی یا درصد تغییر مبلغ را مشخص کنید.");
        if (string.IsNullOrWhiteSpace(clause.Groups[1].Value) && instruction.Contains("بند"))
            questions.Add("متن یا موضوع دقیق بند جدید را مشخص کنید.");
        return new(dates.ElementAtOrDefault(0), dates.ElementAtOrDefault(1), explicitAmount,
            percent, calculated, clause.Success ? clause.Groups[1].Value.Trim() : null, questions);
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
}
