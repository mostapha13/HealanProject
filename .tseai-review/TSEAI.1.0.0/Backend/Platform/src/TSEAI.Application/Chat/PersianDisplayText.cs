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
            .Replace("نرم افزاری", "نرم‌افزاری", StringComparison.Ordinal)
            .Replace("هیئت مدیره", "هیئت‌مدیره", StringComparison.Ordinal);
        text = JoinedPluralSuffix().Replace(text, "${stem}‌${suffix}");
        text = CommonVerbPrefix().Replace(text, "${prefix}‌${verb}");
        return text;
    }

    [GeneratedRegex(@"[ \t\r\f\v]+")]
    private static partial Regex MultiSpace();

    [GeneratedRegex(@"برنامهریزی|هیئتمدیره|اولویتبندی|پاسخگویی|اندازهگیری|پیشبینی|تصمیمگیری|سرمایهگذاری|بازارگردانی|نامگذاری|اطلاعرسانی|راهاندازی|جمعآوری|بهروزرسانی|تعریفشده", RegexOptions.CultureInvariant)]
    private static partial Regex CommonJoinedWords();

    [GeneratedRegex(@"(?<stem>[\u0600-\u06FF]{3,}?)(?<suffix>هایی|های|ها)(?=$|[^\u0600-\u06FF])", RegexOptions.CultureInvariant)]
    private static partial Regex JoinedPluralSuffix();

    [GeneratedRegex(@"(?<![\u0600-\u06FF])(?<prefix>ن?می)(?<verb>شود|شوند|کند|کنند|گردد|گردند|باشد|باشند|تواند|توانند|دهد|دهند)(?![\u0600-\u06FF])", RegexOptions.CultureInvariant)]
    private static partial Regex CommonVerbPrefix();
}
