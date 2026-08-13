using System.Globalization;
using System.Text;

namespace TSEAI.Application.Entities;

public static class PersianEntityNormalizer
{

    private static readonly HashSet<string> LookupPrefixes = new(StringComparer.Ordinal)
    {
        "نماد", "سهم", "شرکت", "سهامی", "عام", "خاص",
        "آقای", "آقا", "خانم", "جناب", "دکتر", "مهندس"
    };

    private static readonly Dictionary<char, char> DigitMap = new()
    {
        ['۰']='0',['۱']='1',['۲']='2',['۳']='3',['۴']='4',['۵']='5',['۶']='6',['۷']='7',['۸']='8',['۹']='9',
        ['٠']='0',['١']='1',['٢']='2',['٣']='3',['٤']='4',['٥']='5',['٦']='6',['٧']='7',['٨']='8',['٩']='9'
    };

    public static string Normalize(string? value)
    {
        if (string.IsNullOrWhiteSpace(value)) return string.Empty;
        var sb = new StringBuilder(value.Length);
        var previousWasSpace = false;

        foreach (var original in value.Trim().Normalize(NormalizationForm.FormKC))
        {
            var c = DigitMap.TryGetValue(original, out var digit) ? digit : original;
            c = c switch
            {
                'ي' or 'ى' => 'ی',
                'ك' => 'ک',
                '\u200c' or '\u200d' or '\u00a0' => ' ',
                'ـ' => ' ',
                _ => c
            };

            var category = CharUnicodeInfo.GetUnicodeCategory(c);
            if (category is UnicodeCategory.NonSpacingMark or UnicodeCategory.SpacingCombiningMark)
                continue;

            if (char.IsWhiteSpace(c) || IsSeparator(c))
            {
                if (!previousWasSpace && sb.Length > 0) sb.Append(' ');
                previousWasSpace = true;
                continue;
            }

            if (char.IsLetterOrDigit(c))
            {
                sb.Append(char.ToLowerInvariant(c));
                previousWasSpace = false;
            }
        }

        return sb.ToString().Trim();
    }


    public static IReadOnlyList<string> LookupForms(string? value)
    {
        var normalized = Normalize(value);
        if (normalized.Length == 0) return [];

        var forms = new List<string> { normalized };
        var tokens = normalized.Split(' ', StringSplitOptions.RemoveEmptyEntries).ToList();
        while (tokens.Count > 1 && LookupPrefixes.Contains(tokens[0]))
            tokens.RemoveAt(0);

        var stripped = string.Join(" ", tokens);
        if (stripped.Length > 0 && !string.Equals(stripped, normalized, StringComparison.Ordinal))
            forms.Add(stripped);
        return forms;
    }

    public static string Compact(string? value)
    {
        var normalized = Normalize(value);
        if (normalized.Length == 0) return normalized;
        var sb = new StringBuilder(normalized.Length);
        foreach (var c in normalized)
            if (!char.IsWhiteSpace(c)) sb.Append(c);
        return sb.ToString();
    }

    private static bool IsSeparator(char c) => c is '-' or '_' or '/' or '\\' or '.' or ',' or '،' or ':' or ';' or '؛' or '(' or ')' or '[' or ']' or '{' or '}' or '«' or '»' or '"' or '\'' or '?' or '؟' or '!' or '+' or '=';
}
