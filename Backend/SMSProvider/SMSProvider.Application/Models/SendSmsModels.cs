namespace SMSProvider.Application.Models;

public class SendSmsRequest
{
    public string Message { get; set; } = string.Empty;
    public List<string> PhoneNumbers { get; set; } = new();
}

public class SendSmsResponse
{
    public string? TraceNumber { get; set; }
    public string? ErrorMessage { get; set; }
    public bool Success => string.IsNullOrWhiteSpace(ErrorMessage);
}
