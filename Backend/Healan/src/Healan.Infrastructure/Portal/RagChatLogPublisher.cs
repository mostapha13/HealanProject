using Healan.Application.Portal.Messages;
using Healan.Application.Portal.Services;
using Microsoft.Extensions.Logging;
using Share.MessageBroker.RabbitMQ.Constants;
using Share.MessageBroker.RabbitMQ.Service;

namespace Healan.Infrastructure.Portal;

public sealed class RagChatLogPublisher : IRagChatLogPublisher
{
    private readonly IChannelProvider _channelProvider;
    private readonly ILogger<RagChatLogPublisher> _logger;

    public RagChatLogPublisher(IChannelProvider channelProvider, ILogger<RagChatLogPublisher> logger)
    {
        _channelProvider = channelProvider;
        _logger = logger;
    }

    public void Publish(RagChatLogMessage message)
    {
        try
        {
            var trace = Guid.NewGuid().ToString("N");
            _channelProvider.PublishMessage(
                trace,
                message,
                (QueueNames.RagChatLog, nameof(RagChatLogMessage)));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to publish RagChatLogMessage to RabbitMQ");
        }
    }
}
