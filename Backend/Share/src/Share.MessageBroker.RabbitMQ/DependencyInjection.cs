
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Share.MessageBroker.RabbitMQ.Implemention;
using Share.MessageBroker.RabbitMQ.Service;
using System.Reflection;

namespace Share.MessageBroker.RabbitMQ
{
    public static class DependencyInjection
    {
        public static IServiceCollection AddChannelService(this IServiceCollection services)
        {
            services.AddSingleton<IChannelProvider, ChannelProvider>();
            return services;
        }
    }
}
