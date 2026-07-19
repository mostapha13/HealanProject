
using FileManager.Domain.Services;
using FileManager.Infrastructure.Persistence;
using FileManager.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Refit;
using Share.Application.Common.Authorization;
using Share.Application.Common.Cache;
using Share.Application.Common.Interfaces;
using Share.Infrastructure.Services;
using System;

namespace FileManager.Infrastructure
{
    public static class DependencyInjection
    {
        public static void AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
        {
            if (configuration.GetValue<bool>("UseInMemoryDatabase"))
            {
                services.AddDbContext<ApplicationDbContext>(options =>
                    options.UseInMemoryDatabase("TSEDb"));
            }
            else
            {
                services.AddDbContext<ApplicationDbContext>(options =>
                    options.UseSqlServer(
                        configuration.GetConnectionString("DefaultConnection"),
                        b => b.MigrationsAssembly(typeof(ApplicationDbContext).Assembly.FullName)));
            }

            services.AddScoped<IDateTime, DateTimeService>();
            services.AddScoped<IApplicationDbContext>(provider => provider.GetService<ApplicationDbContext>());

            #region API
            services.AddTransient<AuthHeaderHandler>();

            // MarketMaker access check is optional for Healan; missing URL used to throw UriFormatException → HTTP 500 on Upload DI resolve.
            var marketMakerUrl = configuration["MarketMakerFileUrl"];
            if (string.IsNullOrWhiteSpace(marketMakerUrl))
                marketMakerUrl = "http://127.0.0.1";

            services.AddRefitClient<IRefitHasAccessApi>()
            .ConfigureHttpClient(c => c.BaseAddress = new Uri(marketMakerUrl))
            .AddHttpMessageHandler<AuthHeaderHandler>();

            #endregion

        }
    }
}