using FileManager.GrpcClient.Interfaces;
using FileManager.GrpcClient.Services;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using System;

namespace FileManager.GrpcClient
{
    public static class DependencyInjection
    {
        public static IServiceCollection AddFileManagerServices(this IServiceCollection services, IConfiguration configuration)
        {
            services.AddScoped<IFileManagerTool, FileManagerTool>();
            return services;
        }
    }
}
