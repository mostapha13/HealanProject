using NegareshAI.Api.Data;

namespace NegareshAI.Api.Application.Contracts.Generation;

public sealed record ContractConflict(
    string Code, string Category, int Severity, bool IsBlocking, string Message,
    string? Before, string? Proposed, string Suggestion, string Source);

public static class ContractConflictAnalyzer
{
    public static IReadOnlyList<ContractConflict> Analyze(
        string instruction, Contract contract, ContractChangeSet changes,
        string? baseText, IReadOnlyCollection<string> approvedClauseTexts)
    {
        var result = new List<ContractConflict>();
        var resolvedAsReplacement = instruction.Contains("جایگزین", StringComparison.OrdinalIgnoreCase)
            || instruction.Contains("نسخ شود", StringComparison.OrdinalIgnoreCase)
            || instruction.Contains("ملاک باشد", StringComparison.OrdinalIgnoreCase);
        var start = changes.StartDate ?? contract.StartDate;
        var end = changes.EndDate ?? contract.EndDate;
        if (start.HasValue && end.HasValue && end <= start)
            result.Add(new("DATE_ORDER", "date", 4, true,
                "تاریخ پایان باید بعد از تاریخ شروع باشد.", contract.EndDate?.ToString(),
                end?.ToString(), "بازه زمانی معتبر دیگری اعلام کنید.", "user-instruction"));
        if (start.HasValue && end.HasValue && contract.StartDate.HasValue && contract.EndDate.HasValue)
        {
            var beforeDays = contract.EndDate.Value.DayNumber - contract.StartDate.Value.DayNumber;
            var afterDays = end.Value.DayNumber - start.Value.DayNumber;
            if (Math.Abs(beforeDays - afterDays) > 45)
                result.Add(new("DURATION_CHANGE", "date", 2, false,
                    "مدت قرارداد نسبت به مرجع بیش از ۴۵ روز تغییر کرده است.",
                    $"{beforeDays} روز", $"{afterDays} روز",
                    "مدت جدید را در بازبینی کنترل کنید.", "base-contract"));
        }
        if (changes.CalculatedAmount <= 0)
            result.Add(new("INVALID_AMOUNT", "amount", 4, true,
                "مبلغ قرارداد باید بزرگ‌تر از صفر باشد.", contract.Amount?.ToString(),
                changes.CalculatedAmount?.ToString(), "مبلغ معتبر اعلام کنید.", "user-instruction"));
        var clause = changes.NewClause;
        if (!string.IsNullOrWhiteSpace(clause))
        {
            AddLegalConflict(result, instruction, baseText, clause, "حل اختلاف", "DISPUTE_CONFLICT",
                "بند حل اختلاف جدید با متن مرجع هم‌موضوع است.", resolvedAsReplacement);
            AddLegalConflict(result, instruction, baseText, clause, "فسخ", "TERMINATION_CONFLICT",
                "بند فسخ جدید ممکن است با شرایط فسخ مرجع تعارض داشته باشد.", resolvedAsReplacement);
            AddLegalConflict(result, instruction, baseText, clause, "تعهد", "OBLIGATION_CONFLICT",
                "تعهد جدید باید از نظر مسئول، موعد و ضمانت اجرا کنترل شود.", false, blocking: false);
            foreach (var approved in approvedClauseTexts.Where(x => SharesLegalTopic(x, clause)))
                if (!Normalize(approved).Contains(Normalize(clause), StringComparison.OrdinalIgnoreCase)
                    && !Normalize(clause).Contains(Normalize(approved), StringComparison.OrdinalIgnoreCase))
                    result.Add(new("CATALOG_CLAUSE_DIFFERENCE", "clause", 3, false,
                        "بند مستقیم کاربر با بند مصوب هم‌موضوع یکسان نیست.", approved, clause,
                        "کارشناس تفاوت بند مستقیم و کاتالوگ مصوب را بررسی کند.", "approved-clause-catalog"));
        }
        return result;
    }

    private static void AddLegalConflict(List<ContractConflict> result, string instruction,
        string? baseText, string clause, string keyword, string code, string message,
        bool resolved, bool blocking = true)
    {
        if (!clause.Contains(keyword, StringComparison.OrdinalIgnoreCase)
            || string.IsNullOrWhiteSpace(baseText)
            || !baseText.Contains(keyword, StringComparison.OrdinalIgnoreCase)) return;
        result.Add(new(code, "clause", 3, blocking && !resolved, message,
            ExtractContext(baseText, keyword), clause,
            resolved ? "طبق دستور کاربر به‌عنوان جایگزین ثبت شد؛ کارشناس کنترل کند."
                : "مشخص کنید بند جدید جایگزین بند مرجع است یا به آن الحاق می‌شود.",
            "final-base-version"));
    }

    private static bool SharesLegalTopic(string left, string right) =>
        new[] { "حل اختلاف", "فسخ", "تعهد", "پرداخت", "ضمانت", "محرمانگی" }
            .Any(x => left.Contains(x, StringComparison.OrdinalIgnoreCase)
                && right.Contains(x, StringComparison.OrdinalIgnoreCase));
    private static string Normalize(string value) => string.Join(' ',
        value.Replace('ي', 'ی').Replace('ك', 'ک').Split(
            [' ', '\r', '\n', '\t'], StringSplitOptions.RemoveEmptyEntries));
    private static string ExtractContext(string text, string keyword)
    {
        var index = text.IndexOf(keyword, StringComparison.OrdinalIgnoreCase);
        var start = Math.Max(0, index - 120);
        return text.Substring(start, Math.Min(360, text.Length - start)).Trim();
    }
}
