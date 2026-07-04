using IdentityServer.GrpcClient.Interfaces;
using IdentityServer.GrpcClient.Services;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using System;

namespace IdentityServer.GrpcClient
{
    public static class DependencyInjection
    {
        public static IServiceCollection AddIdentityServices(this IServiceCollection services, IConfiguration configuration)
        {
            services.AddScoped<IIdentityTool, IdentityTool>();
            return services;
        }
    }
}
