namespace Healan.Application.Reports.Dtos;

public class SmsSettingDto
{
    public int SmsSettingId { get; set; }
    /// <summary>ApiKey ماسک‌شده برای نمایش</summary>
    public string ApiKeyMasked { get; set; } = string.Empty;
    public bool HasApiKey { get; set; }
    public int TemplateId { get; set; }
    public long LineNumber { get; set; }
    public string VerifyParameterName { get; set; } = "Code";
    public bool SendEnabled { get; set; }
    public DateTime UpdatedAt { get; set; }
}
