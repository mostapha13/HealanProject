namespace Share.Domain.Extensions
{
    public static class Converters
    {
        public static int? ToInt(this string value)
        {
            int vout = 0;
            if (int.TryParse(value, out vout))
                return vout;
            return null;
        }
        public static decimal? ToDecimal(this string value)
        {
            decimal vout = 0;
            if (decimal.TryParse(value, out vout))
                return vout;
            return null;
        }
        public static double? ToDouble(this string value)
        {
            double vout = 0;
            if (double.TryParse(value, out vout))
                return vout;
            return null;
        }
        public static long? ToLong(this string value)
        {
            long vout = 0;
            if (long.TryParse(value, out vout))
                return vout;
            return null;
        }
        public static Guid? ToGuid(this string value)
        {
            Guid vout = Guid.Empty;
            if (Guid.TryParse(value, out vout))
                return vout;
            return null;
        }

        public static double? ToNumeric(this string value)
        {
            if (long.TryParse(value, out long num))
                return num;
            return null;
        }

        public static long? ToLong(this decimal value)
        {
            long vout = 0;
            try
            {
                vout = Convert.ToInt64(value);
                return vout;
            }
            catch (Exception)
            {
                return null;
            }

        }
    }
}
