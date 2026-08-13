using System.Text;
using System.Text.RegularExpressions;

namespace TSEAI.Application.Temporal;

internal static partial class PersianTemporalNormalizer
{
    private static readonly Dictionary<char, char> DigitMap = new()
    {
        ['۰']='0',['۱']='1',['۲']='2',['۳']='3',['۴']='4',['۵']='5',['۶']='6',['۷']='7',['۸']='8',['۹']='9',
        ['٠']='0',['١']='1',['٢']='2',['٣']='3',['٤']='4',['٥']='5',['٦']='6',['٧']='7',['٨']='8',['٩']='9'
    };

    public static string Normalize(string? value)
    {
        if (string.IsNullOrWhiteSpace(value)) return string.Empty;
        var b = new StringBuilder(value.Length);
        foreach (var ch in value.Trim())
        {
            if (DigitMap.TryGetValue(ch, out var digit)) { b.Append(digit); continue; }
            b.Append(ch switch
            {
                'ي' => 'ی',
                'ى' => 'ی',
                'ك' => 'ک',
                '\u200c' => ' ',
                '\u200f' => ' ',
                '\u200e' => ' ',
                '\u00a0' => ' ',
                _ => ch
            });
        }
        return MultiWhitespace().Replace(b.ToString(), " ").Trim();
    }

    [GeneratedRegex(@"\s+")]
    private static partial Regex MultiWhitespace();
}
