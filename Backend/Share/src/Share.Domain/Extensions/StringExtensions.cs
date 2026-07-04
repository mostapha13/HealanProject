using System.Globalization;
using System.Linq;
namespace Share.Domain.Extensions
{
    public static class StringExtensions
    {
        public static string? NormalizeDecimal(this decimal value)
        {
            string formattedValue = value.ToString("0.0####").TrimEnd('0').TrimEnd('.');
            if (formattedValue.Contains('.'))
            {
                formattedValue = formattedValue.PadLeft(formattedValue.IndexOf('.') + 1, '0');
            }
            else
            {
                formattedValue = string.Format(CultureInfo.InvariantCulture, "{0:N0}", decimal.ToInt64(value));
            }
            return formattedValue;
        }
        public static string? CommaSeprator(this string value)
        {
            var result = value.ToNumeric();
            if (result is null)
            {
                return value;
            }
            return result.Value.ToString("N0");
        }
    }
}
