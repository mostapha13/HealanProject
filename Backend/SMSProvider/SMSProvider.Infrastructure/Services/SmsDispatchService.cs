using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Share.Domain.Models;
using Share.MessageBroker.RabbitMQ.Constants;
using Share.MessageBroker.RabbitMQ.Service;
using SMSProvider.Application.Configs;
using SMSProvider.Application.Interfaces;
using SMSProvider.Application.Models;

namespace SMSProvider.Infrastructure.Services;

public sealed class SmsDispatchService : ISmsDispatchService
{
    private readonly IChannelProvider _channelProvider;
    private readonly ISmsSender _smsSender;
    private readonly IConfiguration _configuration;
    private readonly SmsIrOptions _smsIrOptions;
    private readonly ILogger<SmsDispatchService> _logger;

    public SmsDispatchService(
        IChannelProvider channelProvider,
        ISmsSender smsSender,
        IConfiguration configuration,
        IOptions<SmsIrOptions> smsIrOptions,
        ILogger<SmsDispatchService> logger)
    {
        _channelProvider = channelProvider;
        _smsSender = smsSender;
        _configuration = configuration;
        _smsIrOptions = smsIrOptions.Value;
        _logger = logger;
    }

    public async Task<(SendSmsResponse Response, bool Queued)> DispatchAsync(
        SendSmsRequest request,
        CancellationToken cancellationToken = default)
    {
        // OTP/login must get a real sms.ir result (not "queued success" while LogOnly/fail happens later).
        var isOtp = !string.IsNullOrWhiteSpace(OtpMessageHelper.TryExtractCode(request.Message));
        if (isOtp || !IsRabbitMqEnabled())
        {
            if (isOtp)
                _logger.LogInformation("OTP SMS — sending synchronously so login gets real delivery result.");
            else
                _logger.LogWarning("RabbitMQ disabled — sending SMS synchronously (dev fallback).");

            var direct = await _smsSender.SendAsync(request, cancellationToken);
            return (direct, false);
        }

        if (!CanSendViaSmsIr())
        {
            return (new SendSmsResponse
            {
                ErrorMessage =
                    "SmsIr پیکربندی نشده است: ApiKey و (TemplateId برای OTP یا LineNumber برای ارسال آزاد) را تنظیم کنید.",
            }, false);
        }

        var traceNumber = Guid.NewGuid().ToString("N");
        var queueMessage = new SMSModelRequest
        {
            Message = request.Message,
            PhoneNumbers = request.PhoneNumbers?.ToList() ?? new List<string>(),
        };

        _logger.LogInformation(
            "Publishing SMS to queue {Queue} trace={Trace} phones={Phones}",
            QueueNames.SMS,
            traceNumber,
            string.Join(",", queueMessage.PhoneNumbers));

        _channelProvider.PublishMessage(
            traceNumber,
            queueMessage,
            (QueueNames.SMS, nameof(SMSModelRequest)));

        return (new SendSmsResponse { TraceNumber = traceNumber }, true);
    }

    private bool CanSendViaSmsIr() => true;

    private bool IsRabbitMqEnabled()
    {
        var enabledSetting = _configuration["RabbitMQ:Enabled"];
        if (string.Equals(enabledSetting, "false", StringComparison.OrdinalIgnoreCase))
            return false;

        return !string.IsNullOrWhiteSpace(_configuration["RabbitMQ:HostName"]);
    }
}
