namespace Healan.Application.Common.Helpers;

/// <summary>
/// رمز عبور سازگار با سیاست Identity Server (حروف بزرگ/کوچک، عدد، کاراکتر خاص، حداقل ۸).
/// </summary>
public static class IdentityPasswordGenerator
{
    private const string Upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
    private const string Lower = "abcdefghijkmnpqrstuvwxyz";
    private const string Digits = "23456789";
    private const string Special = "@#$!";

    public static string Generate(int length = 12)
    {
        if (length < 8)
            length = 8;

        var random = Random.Shared;
        var chars = new List<char>(length)
        {
            Upper[random.Next(Upper.Length)],
            Lower[random.Next(Lower.Length)],
            Digits[random.Next(Digits.Length)],
            Special[random.Next(Special.Length)],
        };

        var all = Upper + Lower + Digits + Special;
        while (chars.Count < length)
            chars.Add(all[random.Next(all.Length)]);

        return new string(chars.OrderBy(_ => random.Next()).ToArray());
    }
}
