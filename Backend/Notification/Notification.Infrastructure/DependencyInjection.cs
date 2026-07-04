using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Notification.Application.Services;
using Notification.Application.Interface;
using System;
using Notification.Infrastructure.Persistence;
using Share.Application.Common.Interfaces;
using Share.Infrastructure.Services;
using Share.MessageBroker.RabbitMQ;

namespace Notification.Infrastructure
{
    public static class DependencyInjection
    {
        public static void AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
        {
            services.AddSingleton<IDateTime, DateTimeService>();
            services.AddChannelService();
            services.AddScoped<ICurrentUserService, CurrentUserService>();
            services.AddDbContext<ApplicationDbContext>(options =>
                options.UseSqlServer(
                    configuration.GetConnectionString("DefaultConnection"),
                    b => b.MigrationsAssembly(typeof(ApplicationDbContext).Assembly.FullName)));

            services.AddScoped<IApplicationDbContext>(provider => provider.GetService<ApplicationDbContext>());



        }
    }
}
