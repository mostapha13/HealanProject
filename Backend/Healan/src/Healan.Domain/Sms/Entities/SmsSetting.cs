namespace Healan.Domain.Sms.Entities;

/// <summary>تنظیمات پیامک (سینگلتون — منبع حقیقت در دیتابیس Healan)</summary>
public class SmsSetting
{
    public int SmsSettingId { get; set; } = 1;

    /// <summary>کلید API پنل sms.ir — از UI تنظیمات پیامک وارد شود</summary>
    public string ApiKey { get; set; } = string.Empty;

    /// <summary>شناسه قالب Verify (پیش‌فرض پنل)</summary>
    public int TemplateId { get; set; } = 640023;

    /// <summary>شماره خط ارسال آزاد (۰ یعنی از خط پیش‌فرض پنل استفاده شود)</summary>
    public long LineNumber { get; set; }

    /// <summary>نام پارامتر قالب Verify</summary>
    public string VerifyParameterName { get; set; } = "Code";

    /// <summary>اگر false باشد به sms.ir ارسال نمی‌شود ولی در گزارش ثبت می‌شود</summary>
    public bool SendEnabled { get; set; } = true;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
