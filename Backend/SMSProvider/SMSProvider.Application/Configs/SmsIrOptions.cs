using System.Text.RegularExpressions;

namespace SMSProvider.Application.Configs;

public class SmsIrOptions
{
    public const string SectionName = "SmsIr";

    /// <summary>کلید API پنل sms.ir — از محیط/کانفیگ خوانده شود، داخل کد hardcode نشود.</summary>
    public string ApiKey { get; set; } = string.Empty;

    public string BaseUrl { get; set; } = "https://api.sms.ir/v1/";

    /// <summary>شماره خط ارسال (برای Bulk). از پنل sms.ir بردارید.</summary>
    public long LineNumber { get; set; }

    /// <summary>شناسه قالب Verify — اگر &gt; 0 باشد برای کد OTP اولویت دارد.</summary>
    public int TemplateId { get; set; }

    /// <summary>نام پارامتر قالب Verify (معمولاً CODE یا Code)</summary>
    public string VerifyParameterName { get; set; } = "CODE";

    /// <summary>اگر true و TemplateId تنظیم شده، از /send/verify استفاده می‌شود وقتی متن شبیه OTP باشد.</summary>
    public bool PreferVerifyForOtp { get; set; } = true;

    /// <summary>
    /// اگر خط/قالب تنظیم نباشد، پیامک واقعی ارسال نشود ولی به‌عنوان موفق لاگ شود (مناسب تست).
    /// </summary>
    public bool LogOnlyWhenUnconfigured { get; set; } = true;
}

public static class OtpMessageHelper
{
    private static readonly Regex Digits = new(@"\d{4,8}", RegexOptions.Compiled);

    public static string? TryExtractCode(string? message)
    {
        if (string.IsNullOrWhiteSpace(message))
            return null;
        var match = Digits.Match(message);
        return match.Success ? match.Value : null;
    }
}
