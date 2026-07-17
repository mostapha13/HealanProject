using System.Net.Http.Json;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Logging;

namespace Healan.Application.Portal.Services;

public interface IPortalSmsSender
{
    Task<(bool Ok, string? Error)> SendAsync(string phoneNumber, string message, CancellationToken cancellationToken = default);
}

public sealed class PortalSmsSender : IPortalSmsSender
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly ILogger<PortalSmsSender> _logger;

    public PortalSmsSender(IHttpClientFactory httpClientFactory, ILogger<PortalSmsSender> logger)
    {
        _httpClientFactory = httpClientFactory;
        _logger = logger;
    }

    public async Task<(bool Ok, string? Error)> SendAsync(
        string phoneNumber,
        string message,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var client = _httpClientFactory.CreateClient("SMSProvider");
            if (client.BaseAddress == null)
                return (false, "آدرس سرویس پیامک تنظیم نشده است.");

            var response = await client.PostAsJsonAsync(
                "SendSMS",
                new { Message = message, PhoneNumbers = new[] { phoneNumber } },
                cancellationToken);

            var body = await response.Content.ReadAsStringAsync(cancellationToken);
            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("Portal SMS HTTP {Status}: {Body}", (int)response.StatusCode, body);
                return (false, "ارسال پیامک ناموفق بود.");
            }

            try
            {
                var parsed = System.Text.Json.JsonSerializer.Deserialize<SmsCompatResponse>(body,
                    new System.Text.Json.JsonSerializerOptions { PropertyNameCaseInsensitive = true });
                if (!string.IsNullOrWhiteSpace(parsed?.ErrorMessage))
                    return (false, parsed.ErrorMessage);
                if (parsed is { Success: false } && string.IsNullOrWhiteSpace(parsed.ErrorMessage))
                    return (false, "ارسال پیامک ناموفق بود.");
            }
            catch
            {
                // Some providers return plain OK text.
            }

            return (true, null);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Portal SMS send failed for {Phone}", phoneNumber);
            return (false, "خطا در ارتباط با سرویس پیامک.");
        }
    }

    private sealed class SmsCompatResponse
    {
        public bool Success { get; set; } = true;
        [JsonPropertyName("errorMessage")]
        public string? ErrorMessage { get; set; }
    }
}
