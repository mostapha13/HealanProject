using Microsoft.Extensions.Logging;
using Share.MessageBroker.RabbitMQ.Service;
using System;

namespace Share.MessageBroker.RabbitMQ.Implemention
{
    /// <summary>
    /// No-op broker for local development when RabbitMQ is unavailable.
    /// </summary>
    public class NullChannelProvider : IChannelProvider
    {
        private readonly ILogger<NullChannelProvider> _logger;

        public NullChannelProvider(ILogger<NullChannelProvider> logger)
        {
            _logger = logger;
            _logger.LogWarning("RabbitMQ is disabled (RabbitMQ:Enabled=false). Messages will not be published.");
        }

        public bool PublishMessage(string messageId, object data, params (string queue, string routingKey)[] pairs)
        {
            _logger.LogDebug("Skipped RabbitMQ publish for message {MessageId}", messageId);
            return true;
        }

        public bool PublishGlobalMessage(string messageId, object data)
        {
            _logger.LogDebug("Skipped RabbitMQ global publish for message {MessageId}", messageId);
            return true;
        }

        public void SubscribeMessage<T>(Func<string, T, bool> callBackData, params (string queue, string routingKey)[] pairs) where T : class
        {
            _logger.LogDebug("Skipped RabbitMQ subscribe (RabbitMQ disabled).");
        }
    }
}
