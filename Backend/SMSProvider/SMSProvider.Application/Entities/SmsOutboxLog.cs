namespace SMSProvider.Application.Entities;

public class SmsOutboxLog
{
    public long Id { get; set; }
    public DateTime CreatedAt { get; set; }
    public string PhoneNumber { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    /// <summary>کد OTP استخراج‌شده از متن (در صورت وجود)</summary>
    public string? ExtractedCode { get; set; }
    public bool Success { get; set; }
    public string? ErrorMessage { get; set; }
    public string? TraceNumber { get; set; }
    /// <summary>sms.ir | LogOnly | Failed</summary>
    public string Channel { get; set; } = string.Empty;
}
