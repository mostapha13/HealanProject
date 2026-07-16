using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using SMSProvider.Application.Configs;
using SMSProvider.Application.Interfaces;
using SMSProvider.Application.Models;

namespace SMSProvider.Infrastructure.Services;

public sealed class SmsIrSender : ISmsSender
{
    private readonly HttpClient _httpClient;
    private readonly SmsIrOptions _options;
    private readonly ILogger<SmsIrSender> _logger;

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
    };

    public SmsIrSender(HttpClient httpClient, IOptions<SmsIrOptions> options, ILogger<SmsIrSender> logger)
    {
        _httpClient = httpClient;
        _options = options.Value;
        _logger = logger;
    }

    public async Task<SendSmsResponse> SendAsync(SendSmsRequest request, CancellationToken cancellationToken = default)
    {
        var mobiles = (request.PhoneNumbers ?? new List<string>())
            .Select(NormalizeMobile)
            .Where(m => !string.IsNullOrWhiteSpace(m))
            .Distinct()
            .ToList();

        if (mobiles.Count == 0)
            return Fail("شماره موبایل معتبر نیست.");

        if (string.IsNullOrWhiteSpace(request.Message))
            return Fail("متن پیامک خالی است.");

        if (string.IsNullOrWhiteSpace(_options.ApiKey))
            return Fail("کلید API پیامک (SmsIr:ApiKey) تنظیم نشده است.");

        var otp = OtpMessageHelper.TryExtractCode(request.Message);
        var useVerify = _options.PreferVerifyForOtp
                        && _options.TemplateId > 0
                        && !string.IsNullOrWhiteSpace(otp)
                        && mobiles.Count == 1;

        try
        {
            if (useVerify)
                return await SendVerifyAsync(mobiles[0]!, otp!, cancellationToken);

            if (_options.LineNumber <= 0)
            {
                if (_options.LogOnlyWhenUnconfigured)
                {
                    _logger.LogWarning(
                        "SMS LogOnly mode: LineNumber/TemplateId not set. Message logged for phones {Phones}",
                        string.Join(",", mobiles));
                    return new SendSmsResponse
                    {
                        TraceNumber = $"log-only-{Guid.NewGuid():N}",
                    };
                }

                return Fail(
                    "برای ارسال آزاد، SmsIr:LineNumber را از پنل sms.ir تنظیم کنید؛ " +
                    "یا برای OTP، SmsIr:TemplateId قالب Verify را تنظیم کنید.");
            }

            return await SendBulkAsync(mobiles!, request.Message, cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "SMS.ir send failed");
            return Fail(ex.Message);
        }
    }

    private async Task<SendSmsResponse> SendVerifyAsync(string mobile, string code, CancellationToken ct)
    {
        var body = new
        {
            mobile,
            templateId = _options.TemplateId,
            parameters = new[]
            {
                new { name = _options.VerifyParameterName, value = code },
            },
        };

        using var response = await PostJsonAsync("send/verify", body, ct);
        return await ParseResponseAsync(response, ct);
    }

    private async Task<SendSmsResponse> SendBulkAsync(List<string> mobiles, string message, CancellationToken ct)
    {
        var body = new
        {
            lineNumber = _options.LineNumber,
            messageText = message,
            mobiles,
        };

        using var response = await PostJsonAsync("send/bulk", body, ct);
        return await ParseResponseAsync(response, ct);
    }

    private async Task<HttpResponseMessage> PostJsonAsync(string relativeUrl, object body, CancellationToken ct)
    {
        var json = JsonSerializer.Serialize(body, JsonOptions);
        using var content = new StringContent(json, Encoding.UTF8, "application/json");
        using var request = new HttpRequestMessage(HttpMethod.Post, relativeUrl) { Content = content };
        request.Headers.TryAddWithoutValidation("x-api-key", _options.ApiKey);
        request.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
        return await _httpClient.SendAsync(request, ct);
    }

    private async Task<SendSmsResponse> ParseResponseAsync(HttpResponseMessage response, CancellationToken ct)
    {
        var raw = await response.Content.ReadAsStringAsync(ct);
        _logger.LogInformation("SMS.ir response {Status}: {Body}", (int)response.StatusCode, raw);

        try
        {
            using var doc = JsonDocument.Parse(string.IsNullOrWhiteSpace(raw) ? "{}" : raw);
            var root = doc.RootElement;
            var status = root.TryGetProperty("status", out var st) ? st.GetInt32() : (response.IsSuccessStatusCode ? 1 : 0);
            var message = root.TryGetProperty("message", out var msg) ? msg.GetString() : null;

            if (status != 1)
                return Fail(message ?? raw ?? response.ReasonPhrase ?? "ارسال پیامک ناموفق بود.");

            string? trace = null;
            if (root.TryGetProperty("data", out var data))
            {
                if (data.TryGetProperty("packId", out var pack) && pack.ValueKind == JsonValueKind.String)
                    trace = pack.GetString();
                else if (data.TryGetProperty("messageId", out var mid))
                    trace = mid.ToString();
            }

            return new SendSmsResponse { TraceNumber = trace ?? Guid.NewGuid().ToString("N") };
        }
        catch
        {
            if (!response.IsSuccessStatusCode)
                return Fail(raw ?? response.ReasonPhrase ?? "ارسال پیامک ناموفق بود.");
            return new SendSmsResponse { TraceNumber = Guid.NewGuid().ToString("N") };
        }
    }

    private static string? NormalizeMobile(string? phone)
    {
        if (string.IsNullOrWhiteSpace(phone))
            return null;
        var digits = new string(phone.Where(char.IsDigit).ToArray());
        if (digits.StartsWith("98") && digits.Length == 12)
            digits = "0" + digits[2..];
        if (digits.StartsWith("9") && digits.Length == 10)
            digits = "0" + digits;
        return digits.Length >= 11 ? digits : null;
    }

    private static SendSmsResponse Fail(string error) =>
        new() { ErrorMessage = error };
}
