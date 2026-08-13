namespace TSEAI.Application.Temporal;

internal static class PersianNumberParser
{
    private static readonly Dictionary<string, int> Values = new(StringComparer.Ordinal)
    {
        ["صفر"] = 0,
        ["یک"] = 1, ["یکم"] = 1, ["اول"] = 1,
        ["دو"] = 2, ["دوم"] = 2,
        ["سه"] = 3, ["سوم"] = 3,
        ["چهار"] = 4, ["چهارم"] = 4,
        ["پنج"] = 5, ["پنجم"] = 5,
        ["شش"] = 6, ["ششم"] = 6,
        ["هفت"] = 7, ["هفتم"] = 7,
        ["هشت"] = 8, ["هشتم"] = 8,
        ["نه"] = 9, ["نهم"] = 9,
        ["ده"] = 10, ["دهم"] = 10,
        ["یازده"] = 11, ["یازدهم"] = 11,
        ["دوازده"] = 12, ["دوازدهم"] = 12,
        ["سیزده"] = 13, ["سیزدهم"] = 13,
        ["چهارده"] = 14, ["چهاردهم"] = 14,
        ["پانزده"] = 15, ["پانزدهم"] = 15,
        ["شانزده"] = 16, ["شانزدهم"] = 16,
        ["هفده"] = 17, ["هفدهم"] = 17,
        ["هجده"] = 18, ["هجدهم"] = 18,
        ["نوزده"] = 19, ["نوزدهم"] = 19,
        ["بیست"] = 20, ["بیستم"] = 20,
        ["سی"] = 30, ["سیام"] = 30, ["سی ام"] = 30,
        ["چهل"] = 40, ["پنجاه"] = 50, ["شصت"] = 60, ["هفتاد"] = 70, ["هشتاد"] = 80, ["نود"] = 90,
        ["صد"] = 100, ["یکصد"] = 100, ["دویست"] = 200, ["سیصد"] = 300, ["چهارصد"] = 400,
        ["پانصد"] = 500, ["ششصد"] = 600, ["هفتصد"] = 700, ["هشتصد"] = 800, ["نهصد"] = 900
    };

    public static bool TryParse(string? raw, out int value)
    {
        value = 0;
        var text = PersianTemporalNormalizer.Normalize(raw);
        if (text.Length == 0) return false;
        if (int.TryParse(text, out value)) return value >= 0;

        if (Values.TryGetValue(text, out value)) return true;
        if (text.EndsWith(" ام", StringComparison.Ordinal) && Values.TryGetValue(text[..^3].Trim(), out value)) return true;

        var parts = text.Split(" و ", StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
        if (parts.Length == 0) return false;
        var total = 0;
        foreach (var part in parts)
        {
            if (!Values.TryGetValue(part, out var n)) return false;
            total += n;
        }
        value = total;
        return true;
    }
}
