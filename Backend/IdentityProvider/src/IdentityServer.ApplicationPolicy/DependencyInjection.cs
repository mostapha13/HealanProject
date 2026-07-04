
using IdentityServer.ApplicationPolicy.Implementions;
using IdentityServer.ApplicationPolicy.Services;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Share.MessageBroker.RabbitMQ;

namespace IdentityServer.ApplicationPolicy
{
    public static class DependencyInjection
    {
        public static IServiceCollection AddPolicyService(this IServiceCollection services, IConfiguration configuration)
        {

            services.AddScoped<IUserAccessActionService, UserAccessActionService>();
            services.AddChannelService();
            return services;
        }
    }
}
