namespace TSEAI.Identity.Infrastructure.Auth;
public static class PhoneNormalizer
{
    public static string NormalizeIran(string input)
    {
        if (string.IsNullOrWhiteSpace(input)) throw new ArgumentException("Mobile is required.");
        var map = "۰۱۲۳۴۵۶۷۸۹";
        var a = "٠١٢٣٤٥٦٧٨٩";
        var digits = new string(input.Trim().Select(ch =>
            map.Contains(ch) ? (char)('0' + map.IndexOf(ch)) :
            a.Contains(ch) ? (char)('0' + a.IndexOf(ch)) : ch).Where(char.IsDigit).ToArray());
        if (digits.StartsWith("0098")) digits = digits[4..];
        if (digits.StartsWith("98")) digits = digits[2..];
        if (digits.StartsWith("0")) digits = digits[1..];
        if (digits.Length != 10 || !digits.StartsWith("9")) throw new ArgumentException("Invalid Iranian mobile number.");
        return "+98" + digits;
    }
}
