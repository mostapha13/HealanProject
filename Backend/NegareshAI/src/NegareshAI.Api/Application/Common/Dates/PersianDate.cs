using System.Globalization;

namespace NegareshAI.Api.Application.Common.Dates;

/// <summary>
/// The server-side PersianCalendar contract adapted from Healan.
/// Persistence and transport remain UTC/Gregorian; only human-facing values use this formatter.
/// </summary>
public static class PersianDate
{
    private static readonly PersianCalendar Calendar = new();
    private static readonly TimeZoneInfo IranTimeZone = ResolveIranTimeZone();
    private static readonly string[] MonthNames =
    [
        "فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور",
        "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"
    ];
    private static readonly string[] WeekdayNames =
    [
        "یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنجشنبه", "جمعه", "شنبه"
    ];

    public static string Format(DateTime value)
    {
        return FormatIranDate(ToIranTime(value));
    }

    public static string Format(DateOnly value) =>
        Format(value.ToDateTime(new TimeOnly(12, 0)));

    public static string FormatDateTime(DateTime value)
    {
        var local = ToIranTime(value);
        return $"{FormatIranDate(local)}، ساعت {ToPersianDigits(local.ToString("HH:mm", CultureInfo.InvariantCulture))}";
    }

    public static string FormatLong(DateTime value)
    {
        var local = ToIranTime(value);
        var month = MonthNames[Calendar.GetMonth(local) - 1];
        var weekday = WeekdayNames[(int)local.DayOfWeek];
        return $"{weekday}، {ToPersianDigits(Calendar.GetDayOfMonth(local).ToString())} {month} {ToPersianDigits(Calendar.GetYear(local).ToString())}";
    }

    public static DateOnly ParseDateOnly(string value)
    {
        var parts = ToLatinDigits(value).Replace('-', '/').Replace('.', '/').Split('/');
        if (parts.Length != 3 ||
            !int.TryParse(parts[0], out var year) ||
            !int.TryParse(parts[1], out var month) ||
            !int.TryParse(parts[2], out var day))
        {
            throw new FormatException("Persian date must use YYYY/MM/DD format.");
        }

        try
        {
            return DateOnly.FromDateTime(Calendar.ToDateTime(year, month, day, 0, 0, 0, 0));
        }
        catch (ArgumentOutOfRangeException exception)
        {
            throw new FormatException("Persian date is outside the valid calendar range.", exception);
        }
    }

    private static string ToPersianDigits(string value) =>
        value
            .Replace('0', '۰').Replace('1', '۱').Replace('2', '۲').Replace('3', '۳').Replace('4', '۴')
            .Replace('5', '۵').Replace('6', '۶').Replace('7', '۷').Replace('8', '۸').Replace('9', '۹');

    private static string ToLatinDigits(string value) =>
        value
            .Replace('۰', '0').Replace('۱', '1').Replace('۲', '2').Replace('۳', '3').Replace('۴', '4')
            .Replace('۵', '5').Replace('۶', '6').Replace('۷', '7').Replace('۸', '8').Replace('۹', '9')
            .Replace('٠', '0').Replace('١', '1').Replace('٢', '2').Replace('٣', '3').Replace('٤', '4')
            .Replace('٥', '5').Replace('٦', '6').Replace('٧', '7').Replace('٨', '8').Replace('٩', '9');

    private static string FormatIranDate(DateTime local) =>
        ToPersianDigits(
            $"{Calendar.GetYear(local):0000}/{Calendar.GetMonth(local):00}/{Calendar.GetDayOfMonth(local):00}");

    private static DateTime ToIranTime(DateTime value)
    {
        var utc = value.Kind switch
        {
            DateTimeKind.Utc => value,
            DateTimeKind.Local => value.ToUniversalTime(),
            _ => DateTime.SpecifyKind(value, DateTimeKind.Utc)
        };
        return TimeZoneInfo.ConvertTimeFromUtc(utc, IranTimeZone);
    }

    private static TimeZoneInfo ResolveIranTimeZone()
    {
        foreach (var id in new[] { "Asia/Tehran", "Iran Standard Time" })
        {
            try { return TimeZoneInfo.FindSystemTimeZoneById(id); }
            catch (TimeZoneNotFoundException) { }
            catch (InvalidTimeZoneException) { }
        }

        return TimeZoneInfo.CreateCustomTimeZone(
            "Iran", TimeSpan.FromHours(3.5), "Iran", "Iran");
    }
}
