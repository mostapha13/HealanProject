using System.Globalization;
using System.Text.Json;
using System.Text.RegularExpressions;
using NegareshAI.Api.Data;

namespace NegareshAI.Api.Services;

public sealed record ComparisonSource(
    Guid DocumentId, Guid VersionId, string Title, string Text);

public sealed record ComparisonFindingDraft(
    Guid? RuleId,
    FindingType Type,
    int Severity,
    string Title,
    string Reason,
    string? TargetEvidence,
    int? TargetPage,
    string? TargetSection,
    string? ReferenceEvidence,
    int? ReferencePage,
    string? Suggestion,
    decimal Confidence);

public interface IComparisonEngine
{
    IReadOnlyList<ComparisonFindingDraft> Evaluate(
        string targetText,
        IReadOnlyCollection<Rule> rules,
        IReadOnlyCollection<ComparisonSource> references,
        string? userInstruction);
}

public sealed class ComparisonEngine : IComparisonEngine
{
    public IReadOnlyList<ComparisonFindingDraft> Evaluate(
        string targetText,
        IReadOnlyCollection<Rule> rules,
        IReadOnlyCollection<ComparisonSource> references,
        string? userInstruction)
    {
        var findings = new List<ComparisonFindingDraft>();
        foreach (var rule in rules.Where(item => item.IsActive).OrderBy(item => item.Order))
            findings.Add(EvaluateRule(targetText, rule));
        foreach (var reference in references)
            findings.Add(EvaluateReference(targetText, reference));
        if (!string.IsNullOrWhiteSpace(userInstruction))
            findings.Add(EvaluateInstruction(targetText, userInstruction));
        return findings;
    }

    private static ComparisonFindingDraft EvaluateRule(string text, Rule rule)
    {
        var parameters = rule.Parameters.ToDictionary(
            item => item.Key.Trim(), item => ParameterValue(item.ValueJson),
            StringComparer.OrdinalIgnoreCase);
        var required = Value(parameters, "requiredTerm", "required", "value");
        var forbidden = Value(parameters, "forbiddenTerm", "forbidden");
        var pattern = Value(parameters, "regex", "pattern");
        var expectedNumber = Value(parameters, "expectedNumber", "number");

        if (!string.IsNullOrWhiteSpace(forbidden))
        {
            var match = Find(text, forbidden);
            return Draft(rule, match is null ? FindingType.Matched : FindingType.Forbidden,
                match is null ? $"عبارت ممنوع «{forbidden}» در سند دیده نشد."
                    : $"عبارت ممنوع «{forbidden}» در سند وجود دارد.",
                match, match is null ? null : "عبارت ممنوع را حذف یا با متن مجاز جایگزین کنید.");
        }

        if (!string.IsNullOrWhiteSpace(pattern))
        {
            var match = Regex.Match(text, pattern, RegexOptions.IgnoreCase,
                TimeSpan.FromSeconds(1));
            var evidence = match.Success ? Locate(text, match.Index, match.Length) : null;
            return Draft(rule, match.Success ? FindingType.Matched : FindingType.Missing,
                match.Success ? "الگوی تعیین‌شده در سند یافت شد."
                    : "الگوی تعیین‌شده در سند یافت نشد.",
                evidence, match.Success ? null : rule.Instruction);
        }

        if (!string.IsNullOrWhiteSpace(expectedNumber))
        {
            var normalizedNumber = NormalizeDigits(expectedNumber);
            var normalizedText = NormalizeDigits(text);
            var index = normalizedText.IndexOf(normalizedNumber,
                StringComparison.OrdinalIgnoreCase);
            var evidence = index >= 0 ? Locate(text, index, expectedNumber.Length) : null;
            return Draft(rule, index >= 0 ? FindingType.Matched : FindingType.Different,
                index >= 0 ? $"مقدار مورد انتظار {expectedNumber} یافت شد."
                    : $"مقدار مورد انتظار {expectedNumber} یافت نشد.",
                evidence, index >= 0 ? null : $"مقدار {expectedNumber} را بررسی و اصلاح کنید.");
        }

        var term = required ?? rule.Title;
        var requiredEvidence = Find(text, term);
        return Draft(rule,
            requiredEvidence is null ? FindingType.Missing : FindingType.Matched,
            requiredEvidence is null ? $"الزام «{term}» در سند یافت نشد."
                : $"الزام «{term}» در سند پوشش داده شده است.",
            requiredEvidence, requiredEvidence is null ? rule.Instruction : null);
    }

    private static ComparisonFindingDraft EvaluateReference(
        string targetText, ComparisonSource reference)
    {
        var targetTokens = Tokens(targetText);
        var referenceTokens = Tokens(reference.Text);
        var common = targetTokens.Intersect(referenceTokens).Count();
        var coverage = referenceTokens.Count == 0 ? 0m
            : decimal.Round(common * 100m / referenceTokens.Count, 2);
        var type = coverage >= 75 ? FindingType.Matched
            : coverage >= 45 ? FindingType.Different : FindingType.Missing;
        var targetEvidence = FirstEvidence(targetText);
        var referenceEvidence = FirstEvidence(reference.Text);
        return new(null, type, coverage < 45 ? 4 : coverage < 75 ? 3 : 1,
            $"پوشش سند مرجع «{reference.Title}»",
            $"پوشش واژگانی قابل بازتولید نسبت به نسخه مرجع {coverage.ToString(CultureInfo.InvariantCulture)} درصد است.",
            targetEvidence?.Text, targetEvidence?.Page, "مقایسه با سند مرجع",
            referenceEvidence?.Text, referenceEvidence?.Page,
            type == FindingType.Matched ? null
                : "اختلاف‌های محتوایی با سند مرجع را توسط کارشناس بررسی کنید.",
            decimal.Clamp(0.50m + coverage / 200m, 0.50m, 0.99m));
    }

    private static ComparisonFindingDraft EvaluateInstruction(string text, string instruction)
    {
        var evidence = Find(text, instruction);
        return new(null, evidence is null ? FindingType.Missing : FindingType.Matched,
            evidence is null ? 3 : 1, "دستور تکمیلی کاربر",
            evidence is null ? "عبارت یا معیار دستور تکمیلی عیناً در سند یافت نشد و نیازمند بررسی انسانی است."
                : "دستور تکمیلی کاربر در سند شاهد مستقیم دارد.",
            evidence?.Text, evidence?.Page, "دستور کاربر", null, null,
            evidence is null ? "کارشناس انطباق معنایی دستور را بررسی کند." : null,
            evidence is null ? 0.50m : 0.95m);
    }

    private static ComparisonFindingDraft Draft(
        Rule rule, FindingType type, string reason,
        Evidence? evidence, string? suggestion) =>
        new(rule.Id, type, Math.Clamp(rule.Severity, 1, 5), rule.Title, reason,
            evidence?.Text, evidence?.Page, rule.Code, null, null, suggestion,
            type == FindingType.Matched ? 0.98m : 0.95m);

    private static string? Value(
        IReadOnlyDictionary<string, string?> values, params string[] keys) =>
        keys.Select(key => values.GetValueOrDefault(key))
            .FirstOrDefault(value => !string.IsNullOrWhiteSpace(value));

    private static string? ParameterValue(string json)
    {
        using var document = JsonDocument.Parse(json);
        var root = document.RootElement;
        if (root.ValueKind == JsonValueKind.String) return root.GetString();
        if (root.ValueKind == JsonValueKind.Number) return root.GetRawText();
        if (root.ValueKind == JsonValueKind.Object)
        {
            foreach (var key in new[] { "value", "term", "pattern", "expected" })
                if (root.TryGetProperty(key, out var value))
                    return value.ValueKind == JsonValueKind.String
                        ? value.GetString() : value.GetRawText();
        }
        return root.GetRawText();
    }

    private static Evidence? Find(string text, string term)
    {
        var index = NormalizeDigits(text).IndexOf(
            NormalizeDigits(term), StringComparison.OrdinalIgnoreCase);
        return index < 0 ? null : Locate(text, index, term.Length);
    }

    private static Evidence Locate(string text, int index, int length)
    {
        var pages = text.Split('\f');
        var offset = 0;
        for (var page = 0; page < pages.Length; page++)
        {
            if (index <= offset + pages[page].Length)
            {
                var local = Math.Max(0, index - offset);
                var start = Math.Max(0, local - 90);
                var count = Math.Min(pages[page].Length - start, length + 180);
                return new(pages[page].Substring(start, count).Trim(), page + 1);
            }
            offset += pages[page].Length + 1;
        }
        return new(text[..Math.Min(text.Length, 240)].Trim(), 1);
    }

    private static Evidence? FirstEvidence(string text)
    {
        var pages = text.Split('\f');
        for (var page = 0; page < pages.Length; page++)
        {
            var value = pages[page].Trim();
            if (value.Length > 0)
                return new(value[..Math.Min(value.Length, 260)], page + 1);
        }
        return null;
    }

    private static HashSet<string> Tokens(string text) =>
        Regex.Matches(NormalizeDigits(text).ToLowerInvariant(), @"[\p{L}\p{N}]{2,}")
            .Select(match => match.Value)
            .ToHashSet(StringComparer.Ordinal);

    private static string NormalizeDigits(string value) => value
        .Replace('۰', '0').Replace('۱', '1').Replace('۲', '2')
        .Replace('۳', '3').Replace('۴', '4').Replace('۵', '5')
        .Replace('۶', '6').Replace('۷', '7').Replace('۸', '8')
        .Replace('۹', '9').Replace('٠', '0').Replace('١', '1')
        .Replace('٢', '2').Replace('٣', '3').Replace('٤', '4')
        .Replace('٥', '5').Replace('٦', '6').Replace('٧', '7')
        .Replace('٨', '8').Replace('٩', '9').Replace('ي', 'ی')
        .Replace('ك', 'ک');

    private sealed record Evidence(string Text, int Page);
}
