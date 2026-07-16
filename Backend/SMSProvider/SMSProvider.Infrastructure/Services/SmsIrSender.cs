using IPE.SmsIrClient;
using IPE.SmsIrClient.Models.Requests;
using Microsoft.Extensions.Logging;
using SMSProvider.Application.Configs;
using SMSProvider.Application.Interfaces;
using SMSProvider.Application.Models;

namespace SMSProvider.Infrastructure.Services;

/// <summary>
/// ارسال از طریق پکیج رسمی IPE.SmsIR — تنظیمات از ISmsRuntimeSettings خوانده می‌شود.
/// </summary>
public sealed class SmsIrSender : ISmsSender
{
    private readonly ISmsRuntimeSettings _runtimeSettings;
    private readonly ILogger<SmsIrSender> _logger;

    public SmsIrSender(ISmsRuntimeSettings runtimeSettings, ILogger<SmsIrSender> logger)
    {
        _runtimeSettings = runtimeSettings;
        _logger = logger;
    }

    public async Task<SendSmsResponse> SendAsync(SendSmsRequest request, CancellationToken cancellationToken = default)
    {
        var mobiles = (request.PhoneNumbers ?? new List<string>())
            .Select(NormalizeMobileForSmsIr)
            .Where(m => !string.IsNullOrWhiteSpace(m))
            .Distinct()
            .Cast<string>()
            .ToList();

        if (mobiles.Count == 0)
            return Fail("شماره موبایل معتبر نیست.");

        if (string.IsNullOrWhiteSpace(request.Message))
            return Fail("متن پیامک خالی است.");

        var settings = await _runtimeSettings.GetAsync(cancellationToken);

        if (!settings.SendEnabled)
        {
            _logger.LogInformation(
                "SMS send disabled — recording only. phones={Phones}",
                string.Join(",", mobiles));
            return new SendSmsResponse
            {
                TraceNumber = $"disabled-{Guid.NewGuid():N}",
            };
        }

        if (string.IsNullOrWhiteSpace(settings.ApiKey))
            return Fail("کلید API پیامک (ApiKey) تنظیم نشده است.");

        var otp = OtpMessageHelper.TryExtractCode(request.Message);
        var useVerify = settings.PreferVerifyForOtp
                        && settings.TemplateId > 0
                        && !string.IsNullOrWhiteSpace(otp)
                        && mobiles.Count == 1;

        try
        {
            var smsIr = new SmsIr(settings.ApiKey);

            if (useVerify)
                return await SendVerifyAsync(smsIr, mobiles[0], otp!, settings);

            var lineNumber = await ResolveLineNumberAsync(smsIr, settings);
            if (lineNumber <= 0)
            {
                if (settings.LogOnlyWhenUnconfigured)
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
                    "برای ارسال آزاد، LineNumber را تنظیم کنید؛ " +
                    "برای OTP ترجیحاً TemplateId قالب Verify را تنظیم کنید.");
            }

            return await SendBulkAsync(smsIr, lineNumber, request.Message, mobiles);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "SMS.ir send failed");
            return Fail(ex.Message);
        }
    }

    private async Task<SendSmsResponse> SendVerifyAsync(
        SmsIr smsIr,
        string mobile,
        string code,
        SmsRuntimeSnapshot settings)
    {
        var paramName = string.IsNullOrWhiteSpace(settings.VerifyParameterName)
            ? "Code"
            : settings.VerifyParameterName;

        var response = await smsIr.VerifySendAsync(
            mobile,
            settings.TemplateId,
            new[] { new VerifySendParameter(paramName, code) });

        if (response.Status != 1)
            return Fail(response.Message ?? "ارسال Verify ناموفق بود.");

        var messageId = response.Data?.MessageId.ToString();
        _logger.LogInformation(
            "SMS.ir Verify OK mobile={Mobile} template={Template} messageId={MessageId}",
            mobile,
            settings.TemplateId,
            messageId);

        return new SendSmsResponse { TraceNumber = messageId ?? Guid.NewGuid().ToString("N") };
    }

    private async Task<SendSmsResponse> SendBulkAsync(
        SmsIr smsIr,
        long lineNumber,
        string message,
        IReadOnlyList<string> mobiles)
    {
        var response = await smsIr.BulkSendAsync(lineNumber, message, mobiles.ToArray());

        if (response.Status != 1)
            return Fail(response.Message ?? "ارسال Bulk ناموفق بود.");

        var packId = response.Data?.PackId.ToString("N");
        _logger.LogInformation(
            "SMS.ir Bulk OK line={Line} phones={Phones} packId={PackId}",
            lineNumber,
            string.Join(",", mobiles),
            packId);

        return new SendSmsResponse { TraceNumber = packId ?? Guid.NewGuid().ToString("N") };
    }

    private async Task<long> ResolveLineNumberAsync(SmsIr smsIr, SmsRuntimeSnapshot settings)
    {
        if (settings.LineNumber > 0)
            return settings.LineNumber;

        try
        {
            var lines = await smsIr.GetLinesAsync();
            if (lines.Status == 1 && lines.Data is { Length: > 0 })
            {
                var line = lines.Data[0];
                _logger.LogInformation("SmsIr LineNumber not set — using first panel line {Line}", line);
                return line;
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "GetLinesAsync failed while resolving default line number");
        }

        return 0;
    }

    private static string? NormalizeMobileForSmsIr(string? phone)
    {
        if (string.IsNullOrWhiteSpace(phone))
            return null;

        var digits = new string(phone.Where(char.IsDigit).ToArray());
        if (digits.StartsWith("98") && digits.Length == 12)
            digits = digits[2..];
        if (digits.StartsWith("0") && digits.Length == 11)
            digits = digits[1..];
        if (digits.Length == 10 && digits.StartsWith('9'))
            return digits;

        return null;
    }

    private static SendSmsResponse Fail(string error) =>
        new() { ErrorMessage = error };
}
