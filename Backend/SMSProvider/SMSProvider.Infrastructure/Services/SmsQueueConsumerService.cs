using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Share.Domain.Models;
using Share.MessageBroker.RabbitMQ.Constants;
using Share.MessageBroker.RabbitMQ.Service;
using SMSProvider.Application.Configs;
using SMSProvider.Application.Entities;
using SMSProvider.Application.Interfaces;
using SMSProvider.Application.Models;

namespace SMSProvider.Infrastructure.Services;

public sealed class SmsQueueConsumerService : BackgroundService
{
    private readonly IChannelProvider _channelProvider;
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<SmsQueueConsumerService> _logger;

    public SmsQueueConsumerService(
        IChannelProvider channelProvider,
        IServiceScopeFactory scopeFactory,
        ILogger<SmsQueueConsumerService> logger)
    {
        _channelProvider = channelProvider;
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override Task ExecuteAsync(CancellationToken stoppingToken)
    {
        return Task.Factory.StartNew(() =>
        {
            _channelProvider.SubscribeMessage<SMSModelRequest>((messageId, model) =>
            {
                try
                {
                    using var scope = _scopeFactory.CreateScope();
                    var sender = scope.ServiceProvider.GetRequiredService<ISmsSender>();
                    var outbox = scope.ServiceProvider.GetRequiredService<ISmsOutboxStore>();

                    var message = model.Message ?? string.Empty;
                    var phones = model.PhoneNumbers?.Where(p => !string.IsNullOrWhiteSpace(p)).Distinct().ToList()
                                 ?? new List<string>();

                    var request = new SendSmsRequest
                    {
                        Message = message,
                        PhoneNumbers = phones,
                    };

                    var result = sender.SendAsync(request, CancellationToken.None).GetAwaiter().GetResult();
                    var otp = OtpMessageHelper.TryExtractCode(message);
                    var channel = result.Success
                        ? (result.TraceNumber?.StartsWith("log-only", StringComparison.OrdinalIgnoreCase) == true ? "LogOnly" : "sms.ir")
                        : "Failed";

                    foreach (var phone in phones.DefaultIfEmpty("?"))
                    {
                        outbox.SaveAsync(new SmsOutboxLog
                        {
                            CreatedAt = DateTime.Now,
                            PhoneNumber = phone,
                            Message = message,
                            ExtractedCode = otp,
                            Success = result.Success,
                            Channel = channel,
                            TraceNumber = result.TraceNumber ?? messageId,
                            ErrorMessage = result.ErrorMessage,
                        }, CancellationToken.None).GetAwaiter().GetResult();
                    }

                    if (!result.Success)
                    {
                        _logger.LogWarning(
                            "SMS queue consumer failed trace={Trace} error={Error}",
                            messageId,
                            result.ErrorMessage);
                        return false;
                    }

                    _logger.LogInformation("SMS sent from queue trace={Trace}", messageId);
                    return true;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "SMS queue consumer error trace={Trace}", messageId);
                    return false;
                }
            }, (QueueNames.SMS, nameof(SMSModelRequest)));
        }, TaskCreationOptions.LongRunning);
    }
}
