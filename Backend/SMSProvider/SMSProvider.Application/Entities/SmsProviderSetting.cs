namespace SMSProvider.Application.Entities;

/// <summary>کپی runtime تنظیمات پیامک (همگام از Healan)</summary>
public class SmsProviderSetting
{
    public int Id { get; set; } = 1;
    public string ApiKey { get; set; } = string.Empty;
    public int TemplateId { get; set; } = 640023;
    public long LineNumber { get; set; }
    public string VerifyParameterName { get; set; } = "Code";
    public bool SendEnabled { get; set; } = true;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
