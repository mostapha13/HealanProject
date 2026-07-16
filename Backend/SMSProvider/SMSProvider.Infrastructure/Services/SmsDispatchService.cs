using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Share.Domain.Models;
using Share.MessageBroker.RabbitMQ.Constants;
using Share.MessageBroker.RabbitMQ.Service;
using SMSProvider.Application.Interfaces;
using SMSProvider.Application.Models;

namespace SMSProvider.Infrastructure.Services;

public sealed class SmsDispatchService : ISmsDispatchService
{
    private readonly IChannelProvider _channelProvider;
    private readonly ISmsSender _smsSender;
    private readonly IConfiguration _configuration;
    private readonly ILogger<SmsDispatchService> _logger;

    public SmsDispatchService(
        IChannelProvider channelProvider,
        ISmsSender smsSender,
        IConfiguration configuration,
        ILogger<SmsDispatchService> logger)
    {
        _channelProvider = channelProvider;
        _smsSender = smsSender;
        _configuration = configuration;
        _logger = logger;
    }

    public async Task<(SendSmsResponse Response, bool Queued)> DispatchAsync(
        SendSmsRequest request,
        CancellationToken cancellationToken = default)
    {
        if (!IsRabbitMqEnabled())
        {
            _logger.LogWarning("RabbitMQ disabled — sending SMS synchronously (dev fallback).");
            var direct = await _smsSender.SendAsync(request, cancellationToken);
            return (direct, false);
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

    private bool IsRabbitMqEnabled()
    {
        var enabledSetting = _configuration["RabbitMQ:Enabled"];
        if (string.Equals(enabledSetting, "false", StringComparison.OrdinalIgnoreCase))
            return false;

        return !string.IsNullOrWhiteSpace(_configuration["RabbitMQ:HostName"]);
    }
}
