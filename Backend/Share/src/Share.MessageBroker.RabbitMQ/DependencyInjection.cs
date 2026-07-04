
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Share.MessageBroker.RabbitMQ.Implemention;
using Share.MessageBroker.RabbitMQ.Service;
using System;

namespace Share.MessageBroker.RabbitMQ
{
    public static class DependencyInjection
    {
        public static IServiceCollection AddChannelService(this IServiceCollection services)
        {
            services.AddSingleton<IChannelProvider>(sp =>
            {
                var configuration = sp.GetRequiredService<IConfiguration>();
                if (IsRabbitMqEnabled(configuration))
                {
                    return new ChannelProvider(
                        configuration,
                        sp.GetRequiredService<ILogger<ChannelProvider>>());
                }

                return new NullChannelProvider(sp.GetRequiredService<ILogger<NullChannelProvider>>());
            });
            return services;
        }

        private static bool IsRabbitMqEnabled(IConfiguration configuration)
        {
            var enabledSetting = configuration["RabbitMQ:Enabled"];
            if (string.Equals(enabledSetting, "false", StringComparison.OrdinalIgnoreCase))
                return false;

            return !string.IsNullOrWhiteSpace(configuration["RabbitMQ:HostName"]);
        }
    }
}
