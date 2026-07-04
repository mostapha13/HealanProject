using System;

namespace Share.MessageBroker.RabbitMQ.Service
{
    public interface IChannelProvider
    {
        bool PublishMessage(string messageId, object data, params (string queue, string routingKey)[] pairs);
        bool PublishGlobalMessage(string messageId, object data);
        void SubscribeMessage<T>(Func<string, T, bool> callBackData, params (string queue, string routingKey)[] pairs) where T : class;
    }
}
