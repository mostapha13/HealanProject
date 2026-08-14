using System.Text.RegularExpressions;
using TSEAI.Application.Temporal;

namespace TSEAI.Application.Chat;

/// <summary>Answers pure current date/time questions from the system clock.</summary>
public static class CanonicalClockAnswer
{
    public static string? TryAnswer(string question,TemporalResolution temporal,DateTimeOffset utcNow)
    {
        var normalized=Normalize(question);
        if(normalized.Length==0||HasMarketContext(normalized)) return null;

        var asksDate=Regex.IsMatch(normalized,@"(?:امروز|اکنون|الان|فعلی).*(?:چندم|چه روز|چه تاریخ|تاریخ)|(?:تاریخ|روز).*(?:امروز|فعلی|چندم|چنده)");
        var asksTime=Regex.IsMatch(normalized,@"(?:ساعت|زمان).*(?:چند|چیست|است)|(?:الان|اکنون).*(?:ساعت|زمان)");
        if(!asksDate&&!asksTime) return null;

        var point=temporal.ReferenceDate;
        var date=$"{PersianWeekday(point.DayOfWeek)}، {point.JalaliDate} شمسی";
        if(!asksTime) return $"امروز {date} است.";

        var tehran=TimeZoneInfo.ConvertTime(utcNow,TehranTimeZone());
        var time=tehran.ToString("HH:mm:ss",System.Globalization.CultureInfo.InvariantCulture);
        return asksDate
            ? $"اکنون ساعت {time} به وقت تهران است؛ امروز {date} است."
            : $"اکنون ساعت {time} به وقت تهران است.";
    }

    private static bool HasMarketContext(string value) =>
        Regex.IsMatch(value,@"(?:قیمت|نماد|سهم|معامله|بورس|بازار|شاخص|حجم|ارزش|خبر|اطلاعیه)");

    private static string Normalize(string value) => Regex.Replace((value??string.Empty).Trim().ToLowerInvariant()
        .Replace('ي','ی').Replace('ك','ک').Replace('\u200c',' '),@"\s+"," ");

    private static string PersianWeekday(DayOfWeek day)=>day switch
    {
        DayOfWeek.Saturday=>"شنبه",
        DayOfWeek.Sunday=>"یکشنبه",
        DayOfWeek.Monday=>"دوشنبه",
        DayOfWeek.Tuesday=>"سه‌شنبه",
        DayOfWeek.Wednesday=>"چهارشنبه",
        DayOfWeek.Thursday=>"پنجشنبه",
        DayOfWeek.Friday=>"جمعه",
        _=>string.Empty
    };

    private static TimeZoneInfo TehranTimeZone()
    {
        foreach(var id in new[]{"Asia/Tehran","Iran Standard Time"})
            try { return TimeZoneInfo.FindSystemTimeZoneById(id); }
            catch(TimeZoneNotFoundException) { }
        return TimeZoneInfo.Utc;
    }
}
