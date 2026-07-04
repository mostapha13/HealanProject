using System.Text.RegularExpressions;

namespace Healan.Application.Common.Validators;

public static class NationalCodeValidator
{
    private static readonly Regex DigitsOnly = new(@"^\d{10}$", RegexOptions.Compiled);

    public static bool IsValid(string? nationalCode)
    {
        if (string.IsNullOrWhiteSpace(nationalCode))
            return false;

        nationalCode = nationalCode.Trim();
        if (!DigitsOnly.IsMatch(nationalCode))
            return false;

        if (nationalCode.Distinct().Count() == 1)
            return false;

        var check = int.Parse(nationalCode[9].ToString());
        var sum = Enumerable.Range(0, 9)
            .Sum(i => int.Parse(nationalCode[i].ToString()) * (10 - i));
        var remainder = sum % 11;

        return remainder < 2 ? check == remainder : check == 11 - remainder;
    }
}
