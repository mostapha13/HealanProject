using System.Globalization;
using System.Text.RegularExpressions;

namespace TSEAI.Application.Chat;

public static partial class PersianDisplayText
{
    public static string Normalize(string? value)
    {
        if (string.IsNullOrWhiteSpace(value)) return "";
        var text = value.Trim().Replace('ي', 'ی').Replace('ى', 'ی').Replace('ك', 'ک');
        text = MultiSpace().Replace(text, " ");
        text = text
            .Replace("توسعهای", "توسعه‌ای", StringComparison.Ordinal)
            .Replace("حوزههایی", "حوزه‌هایی", StringComparison.Ordinal)
            .Replace("عبارتاند", "عبارت‌اند", StringComparison.Ordinal)
            .Replace("شده اند", "شده‌اند", StringComparison.Ordinal)
            .Replace("همراستا", "هم‌راستا", StringComparison.Ordinal)
            .Replace("مهمترین", "مهم‌ترین", StringComparison.Ordinal)
            .Replace("بهسوی", "به‌سوی", StringComparison.Ordinal)
            .Replace("سرمایه گذاران", "سرمایه‌گذاران", StringComparison.Ordinal);
        text = CommonJoinedWords().Replace(text, match => match.Value switch
        {
            "برنامهریزی" => "برنامه‌ریزی",
            "هیئتمدیره" => "هیئت‌مدیره",
            "اولویتبندی" => "اولویت‌بندی",
            "پاسخگویی" => "پاسخ‌گویی",
            "اندازهگیری" => "اندازه‌گیری",
            "پیشبینی" => "پیش‌بینی",
            "تصمیمگیری" => "تصمیم‌گیری",
            "سرمایهگذاری" => "سرمایه‌گذاری",
            "بازارگردانی" => "بازارگردانی",
            "نامگذاری" => "نام‌گذاری",
            "اطلاعرسانی" => "اطلاع‌رسانی",
            "راهاندازی" => "راه‌اندازی",
            "جمعآوری" => "جمع‌آوری",
            "بهروزرسانی" => "به‌روزرسانی",
            "تعریفشده" => "تعریف‌شده",
            _ => match.Value
        });
        text = text
            .Replace("برنامه ریزی", "برنامه‌ریزی", StringComparison.Ordinal)
            .Replace("سرمایه گذاری", "سرمایه‌گذاری", StringComparison.Ordinal)
            .Replace("دانش بنیان", "دانش‌بنیان", StringComparison.Ordinal)
            .Replace("نرم افزاری", "نرم‌افزاری", StringComparison.Ordinal)
            .Replace("هیئت مدیره", "هیئت‌مدیره", StringComparison.Ordinal);
        text = SeparatedPluralSuffix().Replace(text, "${stem}‌${suffix}");
        text = JoinedPluralSuffix().Replace(text, "${stem}‌${suffix}");
        text = CommonVerbPrefix().Replace(text, "${prefix}‌${verb}");
        return text;
    }

    public static string NormalizeAnswer(string? value)
    {
        var text=Normalize(value);
        if(text.Length==0) return text;
        Span<char> chars=stackalloc char[text.Length];
        for(var index=0;index<text.Length;index++)
        {
            var ch=text[index];
            chars[index]=ch switch
            {
                >= '۰' and <= '۹'=>(char)('0'+ch-'۰'),
                >= '٠' and <= '٩'=>(char)('0'+ch-'٠'),
                _=>ch
            };
        }
        return NumberUnitBoundary().Replace(chars.ToString()," ");
    }

    /// <summary>
    /// Converts Gregorian dates embedded in user-facing prose to the Persian
    /// calendar. Dates that are already Jalali are intentionally left intact.
    /// Machine-readable DTO fields must remain ISO and should not use this method.
    /// </summary>
    public static string LocalizeDates(string? value)
    {
        if (string.IsNullOrWhiteSpace(value)) return "";
        var text = GregorianYearFirstDate().Replace(value, match => LocalizeDateMatch(match, yearFirst: true));
        return GregorianYearLastDate().Replace(text, match => LocalizeDateMatch(match, yearFirst: false));
    }

    public static string FormatPersianDate(DateTime value, bool includeTime = false)
    {
        var calendar = new PersianCalendar();
        var date = $"{calendar.GetYear(value):0000}/{calendar.GetMonth(value):00}/{calendar.GetDayOfMonth(value):00}";
        return includeTime ? $"{date} ساعت {value:HH:mm:ss}" : date;
    }

    public static string? FormatCompactDate(int? value)
    {
        if (value is null) return null;
        var raw = value.Value.ToString("00000000", CultureInfo.InvariantCulture);
        if (raw.Length != 8 || !int.TryParse(raw[..4], out var year) || !int.TryParse(raw.Substring(4, 2), out var month) || !int.TryParse(raw[6..], out var day))
            return null;
        if (year is >= 1200 and <= 1600)
            return IsValidPersianDate(year, month, day) ? $"{year:0000}/{month:00}/{day:00}" : null;
        if (year is < 1900 or > 2200 || !TryCreateDate(year, month, day, out var date)) return null;
        return FormatPersianDate(date);
    }

    private static string LocalizeDateMatch(Match match, bool yearFirst)
    {
        var year = ParseDigits(match.Groups[yearFirst ? "year" : "lastYear"].Value);
        var month = ParseDigits(match.Groups["month"].Value);
        var day = ParseDigits(match.Groups["day"].Value);
        if (year is < 1900 or > 2200 || !TryCreateDate(year, month, day, out var date)) return match.Value;

        if (match.Groups["hour"].Success)
        {
            var hour = ParseDigits(match.Groups["hour"].Value);
            var minute = ParseDigits(match.Groups["minute"].Value);
            var second = match.Groups["second"].Success ? ParseDigits(match.Groups["second"].Value) : 0;
            if (hour is >= 0 and <= 23 && minute is >= 0 and <= 59 && second is >= 0 and <= 59)
                date = date.AddHours(hour).AddMinutes(minute).AddSeconds(second);
            var precision = match.Groups["second"].Success ? "HH:mm:ss" : "HH:mm";
            return $"{FormatPersianDate(date)} ساعت {date.ToString(precision, CultureInfo.InvariantCulture)}";
        }
        return FormatPersianDate(date);
    }

    private static int ParseDigits(string value)
    {
        Span<char> chars = stackalloc char[value.Length];
        for (var i = 0; i < value.Length; i++)
            chars[i] = value[i] is >= '۰' and <= '۹' ? (char)('0' + value[i] - '۰') : value[i];
        return int.TryParse(chars, NumberStyles.None, CultureInfo.InvariantCulture, out var result) ? result : -1;
    }

    private static bool TryCreateDate(int year, int month, int day, out DateTime date)
    {
        try { date = new DateTime(year, month, day); return true; }
        catch (ArgumentOutOfRangeException) { date = default; return false; }
    }

    private static bool IsValidPersianDate(int year, int month, int day)
    {
        try { _ = new PersianCalendar().ToDateTime(year, month, day, 0, 0, 0, 0); return true; }
        catch (ArgumentOutOfRangeException) { return false; }
    }

    [GeneratedRegex(@"[ \t\r\f\v]+")]
    private static partial Regex MultiSpace();

    [GeneratedRegex(@"برنامهریزی|هیئتمدیره|اولویتبندی|پاسخگویی|اندازهگیری|پیشبینی|تصمیمگیری|سرمایهگذاری|بازارگردانی|نامگذاری|اطلاعرسانی|راهاندازی|جمعآوری|بهروزرسانی|تعریفشده", RegexOptions.CultureInvariant)]
    private static partial Regex CommonJoinedWords();

    [GeneratedRegex(@"(?<stem>[\u0600-\u06FF]{3,}?)(?<suffix>هایی|های|ها)(?=$|[^\u0600-\u06FF])", RegexOptions.CultureInvariant)]
    private static partial Regex JoinedPluralSuffix();

    [GeneratedRegex(@"(?<stem>[\u0600-\u06FF]{2,})\s+(?<suffix>هایی|های|ها)(?=$|[^\u0600-\u06FF])", RegexOptions.CultureInvariant)]
    private static partial Regex SeparatedPluralSuffix();

    [GeneratedRegex(@"(?<![\u0600-\u06FF])(?<prefix>ن?می)(?<verb>شود|شوند|کند|کنند|گردد|گردند|باشد|باشند|تواند|توانند|دهد|دهند)(?![\u0600-\u06FF])", RegexOptions.CultureInvariant)]
    private static partial Regex CommonVerbPrefix();

    [GeneratedRegex(@"(?<!\p{Nd})(?<year>[0-9۰-۹]{4})\s*[/\.\-]\s*(?<month>[0-9۰-۹]{1,2})\s*[/\.\-]\s*(?<day>[0-9۰-۹]{1,2})(?:(?:T|\s+)(?<hour>[0-9۰-۹]{1,2}):(?<minute>[0-9۰-۹]{2})(?::(?<second>[0-9۰-۹]{2})(?:\.[0-9۰-۹]+)?)?(?:Z|[+\-][0-9۰-۹]{2}:?[0-9۰-۹]{2})?)?(?:\s*میلادی)?(?!\p{Nd})", RegexOptions.CultureInvariant)]
    private static partial Regex GregorianYearFirstDate();

    [GeneratedRegex(@"(?<=[0-9])(?=(?:شرکت|همت|سال|ماه|درصد|ریال|تومان|سهم|واحد|نفر|روز)(?:\s|$))",RegexOptions.CultureInvariant)]
    private static partial Regex NumberUnitBoundary();

    [GeneratedRegex(@"(?<!\p{Nd})(?<day>[0-9۰-۹]{1,2})\s*[/\.\-]\s*(?<month>[0-9۰-۹]{1,2})\s*[/\.\-]\s*(?<lastYear>[0-9۰-۹]{4})(?:(?:T|\s+)(?<hour>[0-9۰-۹]{1,2}):(?<minute>[0-9۰-۹]{2})(?::(?<second>[0-9۰-۹]{2})(?:\.[0-9۰-۹]+)?)?(?:Z|[+\-][0-9۰-۹]{2}:?[0-9۰-۹]{2})?)?(?:\s*میلادی)?(?!\p{Nd})", RegexOptions.CultureInvariant)]
    private static partial Regex GregorianYearLastDate();
}
