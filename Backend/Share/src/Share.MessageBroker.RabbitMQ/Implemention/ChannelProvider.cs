using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using RabbitMQ.Client;
using RabbitMQ.Client.Events;
using Share.Domain.Extensions;
using Share.MessageBroker.RabbitMQ.Constants;
using Share.MessageBroker.RabbitMQ.Service;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using System.Text;
using System.Threading.Tasks;

namespace Share.MessageBroker.RabbitMQ.Implemention
{
    public class ChannelProvider : IChannelProvider
    {
        private readonly IConfiguration _configuration;
        private readonly ILogger<ChannelProvider> _logger;
        public  ChannelProvider(IConfiguration configuration, ILogger<ChannelProvider> logger)
        {
            _configuration = configuration;
            _logger = logger;
            CreateGlobalPublishChannel().GetAwaiter().GetResult();
            CreatePublishChannel().GetAwaiter().GetResult();
            CreateCunsumerChannel().GetAwaiter().GetResult();
            if (GlobalChannel == null || PublishingChannel == null)
                return;
            var queues = GetConstants(typeof(QueueNames));
            foreach (var queue in queues)
            {
                GlobalChannel.QueueDeclareAsync(queue, true, false, false, null).GetAwaiter().GetResult();
                GlobalChannel.QueueBindAsync(queue, ExchangeName.GlobalExchangeName, "anything").GetAwaiter().GetResult();
                PublishingChannel.QueueBindAsync(queue, ExchangeName.MasterExchangeName, queue).GetAwaiter().GetResult();
            }
        }
        private List<string> GetConstants(Type type)
        {
            FieldInfo[] fieldInfos = type.GetFields(BindingFlags.Public |
                 BindingFlags.Static | BindingFlags.FlattenHierarchy);

            return fieldInfos.Where(fi => fi.IsLiteral && !fi.IsInitOnly).Select(s => s.GetValue(s).ToString()).ToList();
        }
        public IChannel PublishingChannel { get; private set; }
        public IChannel GlobalChannel { get; private set; }
        public IChannel CunsumerChannel { get; private set; }
        public async void SubscribeMessage<T>(Func<string, T, bool> callBackdata, params (string queue, string routingKey)[] pairs) where T:class
        {
            foreach (var item in pairs)
            {
                await CunsumerChannel.QueueBindAsync(item.queue, ExchangeName.MasterExchangeName, item.routingKey);
            }
            var Consumer = new AsyncEventingBasicConsumer(CunsumerChannel);
            Consumer.ReceivedAsync += async(model, ea) =>
              {
                  var body = ea.Body.ToArray();
                  var objectBody = body.ByteArrayToObject<T>();
                  if (objectBody!=null && callBackdata(ea.BasicProperties.MessageId, objectBody))
                     await CunsumerChannel.BasicAckAsync(ea.DeliveryTag, false);
              };
            foreach (var queue in pairs)
                await CunsumerChannel.BasicConsumeAsync(queue.queue, autoAck: false, consumer: Consumer);
        }
        public bool PublishMessage(string messageId, object data, params (string queue, string routingKey)[] pairs)
        {

                var channel = PublishingChannel;
            //var properties = channel.CreateBasicProperties();
            //properties.MessageId = messageId;
            var properties = new BasicProperties
            {
                MessageId = messageId
            };
            var dataByteArray = data.ConvertToByteArray();
                foreach (var pair in pairs)
                {
                    channel.BasicPublishAsync(ExchangeName.MasterExchangeName, pair.routingKey,true, properties, dataByteArray).GetAwaiter().GetResult();
                }
                return true;
        }
        public bool PublishGlobalMessage(string messageId, object data)
        {

            //var properties = GlobalChannel.CreateBasicProperties();
            //properties.MessageId = messageId;
            var properties = new BasicProperties
            {
                MessageId = messageId
            };
            var dataByteArray = data.ConvertToByteArray();
            GlobalChannel.BasicPublishAsync(ExchangeName.GlobalExchangeName, "",true, properties, dataByteArray).GetAwaiter().GetResult();
            return true;

        }

        private async Task<IChannel> CreatePublishChannel()
        {
            if (PublishingChannel != null)
                return PublishingChannel;
            PublishingChannel = await GetNewChannel(ExchangeName.MasterExchangeName, false);

            return PublishingChannel;
        }
        private async Task<IChannel> CreateGlobalPublishChannel()
        {
            if (GlobalChannel != null)
                return GlobalChannel;
            GlobalChannel = await GetNewChannel(ExchangeName.GlobalExchangeName, true);
            return GlobalChannel;
        }
        private async Task<IChannel> CreateCunsumerChannel()
        {
            if (CunsumerChannel != null)
                return CunsumerChannel;
            CunsumerChannel =await GetNewChannel(string.Empty, false);

            //CunsumerChannel.BasicQos(0, 1, true);
            return CunsumerChannel;
        }
        private async Task<IChannel> GetNewChannel(string exchangeName, bool isFanout, params (string queue, string routingKey)[] pairs)
        {
            ConnectionFactory factory = new ConnectionFactory();
                factory.UserName = _configuration["RabbitMQ:UserName"];
                factory.Password = _configuration["RabbitMQ:Password"];
                factory.VirtualHost = @"/";
                factory.HostName = _configuration["RabbitMQ:HostName"];
                factory.Port = _configuration["RabbitMQ:Port"].ToInt() ?? 5672;
                var conn =await factory.CreateConnectionAsync();
                var channel =await conn.CreateChannelAsync();

                if (!string.IsNullOrEmpty(exchangeName))
                {
                    if (isFanout)
                       await channel.ExchangeDeclareAsync(exchangeName, ExchangeType.Fanout, false, true, null);
                    else
                       await channel.ExchangeDeclareAsync(exchangeName, ExchangeType.Direct);
                }


                return channel;
        }

    }
}
