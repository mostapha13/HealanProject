
using Ganss.Xss;
using Microsoft.AspNetCore.Mvc.ViewFeatures;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Refit;
using Share.Application.Common.Cache;
using Share.Application.Common.Interfaces;
using Share.Infrastructure.ApiProviders.AccessFile;
using Share.Infrastructure.ApiProviders.DateProvider;
using Share.Infrastructure.ApiProviders.LoginProvider;
using Share.Infrastructure.Cache;
using Share.Infrastructure.Cache.Abstract;
using Share.Infrastructure.SecurityMiddlewares;
using Share.Infrastructure.Services;
using Share.MessageBroker.RabbitMQ;
using Share.MessageBroker.RabbitMQ.Implemention;
using Share.MessageBroker.RabbitMQ.Service;
using StackExchange.Redis;
using StackExchange.Redis.Extensions.Core.Configuration;
using StackExchange.Redis.Extensions.MsgPack;
using System;
using WkHtmlToPdfDotNet;
using WkHtmlToPdfDotNet.Contracts;

namespace Share.Infrastructure
{
    public static class DependencyInjection
    {
        public static IServiceCollection AddFileAccessStatusServices(this IServiceCollection services, IConfiguration configuration)
        {

            services.AddSingleton<IFileAccessStatus, FileAccessStatus>();

            return services;
        }
        public static IServiceCollection AddLoginProviderServices(this IServiceCollection services, IConfiguration configuration)
        {
            services.AddRefitClient<IRefitLoginProvider>()
                 .ConfigureHttpClient(c => c.BaseAddress = new Uri(configuration["LoginProviderBaseUrl"]));

            services.AddSingleton<ILoginProviderApi, RefitLoginProviderWrapper>();

            return services;
        }
        public static IServiceCollection AddDocumentService(this IServiceCollection services, IConfiguration configuration)
        {
            services.AddSingleton(typeof(IConverter), new SynchronizedConverter(new PdfTools()));
            services.AddScoped<IDocumentManagement, DocumentManagement>();
            return services;
        }
        public static IServiceCollection AddDateProviderServices(this IServiceCollection services, IConfiguration configuration)
        {
            services.AddRefitClient<IRefitDateProvider>()
                 .ConfigureHttpClient(c => c.BaseAddress = new Uri(configuration["DateProviderBaseUrl"]));

            services.AddSingleton<IDateProviderApi, RefitDateProviderWrapper>();
            services.AddMemoryCache();
            return services;
        }

        public static IServiceCollection AddSmsServices(this IServiceCollection services)
        {
            services.AddChannelService();
            services.AddMemoryCache();
            services.AddSingleton<ISmsService, SmsService>();
            return services;
        }
        public static IServiceCollection AddEmailServices(this IServiceCollection services)
        {
            services.AddChannelService();
            services.AddMemoryCache();
            services.AddSingleton<IEmailService, EmailService>();
            return services;
        }
        public static IServiceCollection AddHtmlSanitizer(this IServiceCollection services)
        {
            var htmlSanitizer = new HtmlSanitizer();
            var styleFormatter = new SemicolonStyleFormatter();
            htmlSanitizer.StyleFormatter = styleFormatter;
            services.AddSingleton<IHtmlSanitizer>(_ => htmlSanitizer);


            return services;
        }


        public static IServiceCollection AddRedisCache(this IServiceCollection services, IConfiguration configuration)
        {
            services.AddScoped<IDatabase>(cfg =>
            {
                var redisConfiguration = configuration.GetSection("Redis").Get<RedisConfiguration>().ConfigurationOptions;

                redisConfiguration.SyncTimeout = 30*60*1000;
                redisConfiguration.ConnectTimeout = 30 * 60 *1000;
                redisConfiguration.KeepAlive = 60;


                IConnectionMultiplexer multiplexer = ConnectionMultiplexer.Connect(redisConfiguration);
                return multiplexer.GetDatabase();
            });
            services.AddTransient<ICacheManager, CacheManager>();
            return services;
        }



        public static IServiceCollection AddCache(this IServiceCollection services, IConfiguration configuration)
        {
            var cacheType = configuration["Cache:Type"];

            switch (cacheType?.ToLower())
            {
                case "hybrid":
                    services.AddHybridCache(configuration);
                    break;

                case "local":
                    services.AddLocalCache(configuration);
                    break;

                case "distributed":
                    services.AddDistributedCache(configuration);
                    break;

                default: //no-cache
                    services.AddNoCache(configuration);
                    break;
            }


            services.AddSingleton<IDateTime, DateTimeService>();
            return services;
        }
        private static void AddLocalCache(this IServiceCollection services, IConfiguration configuration)
        {
            services.AddMemoryCache();
            services.AddScoped(typeof(ICacheManager<>), typeof(MemoryCacheManager<>));
        }
        private static void AddDistributedCache(this IServiceCollection services, IConfiguration configuration)
        {
            services.AddScoped(typeof(ICacheManager<>), typeof(RedisCacheManager<>));
            ConfigRedis(services, configuration);
        }
        private static void AddHybridCache(this IServiceCollection services, IConfiguration configuration)
        {
            services.AddScoped(typeof(ICacheManager<>), typeof(HybridCacheManager<>));

            services.AddScoped(typeof(IAppCacheManager<>), typeof(MemoryCacheManager<>));
            services.AddMemoryCache();

            services.AddScoped(typeof(IAppDistributedCacheManager<>), typeof(RedisCacheManager<>));
            ConfigRedis(services, configuration);
        }
        private static void AddNoCache(this IServiceCollection services, IConfiguration configuration)
        {
            services.AddScoped(typeof(ICacheManager<>), typeof(NoCacheManager<>));
        }
        private static void ConfigRedis(IServiceCollection services, IConfiguration configuration)
        {
            var redisConfiguration = configuration.GetSection("Redis").Get<RedisConfiguration>();
            services.AddStackExchangeRedisExtensions<MsgPackObjectSerializer>(redisConfiguration);
            //services.AddSingleton((provider) =>
            //{
            //    return provider.GetRequiredService<IRedisCacheClient>().GetDbFromConfiguration();
            //});
        }
    }

}