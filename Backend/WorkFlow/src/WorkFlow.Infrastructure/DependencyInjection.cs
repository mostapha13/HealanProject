using WorkFlow.Application.Common.Interfaces;
using WorkFlow.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Share.Application.Common.Cache;
using Share.Application.Common.Interfaces;
using Share.Infrastructure;
using Share.Infrastructure.Cache;
using Share.Infrastructure.Cache.Abstract;
using Share.Infrastructure.Services;
using StackExchange.Redis.Extensions.Core.Abstractions;
using StackExchange.Redis.Extensions.Core.Configuration;
using StackExchange.Redis.Extensions.MsgPack;

namespace WorkFlow.Infrastructure
{
    public static class DependencyInjection
    {
        public static void AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
        {

            services.AddDbContext<ApplicationDbContext>(options =>
                options.UseSqlServer(
                    configuration.GetConnectionString("DefaultConnection"),
                    b => b.MigrationsAssembly(typeof(ApplicationDbContext).Assembly.FullName)));

            //services.AddDbContext<ApplicationDbContext>(options =>
            //       options.UseOracle(
            //           configuration.GetConnectionString("OracleConnection"),
            //           b => b.MigrationsAssembly(typeof(ApplicationDbContext).Assembly.FullName)));

            services.AddScoped<IDateTime, DateTimeService>(); 
            services.AddScoped<IApplicationDbContext>(provider => provider.GetService<ApplicationDbContext>());
            services.AddTransient<ISmsApiService, SmsApiService>();
            services.AddLoginProviderServices(configuration);
            //services.AddAuthentication()
            //    .AddIdentityServerJwt();

            services.AddAuthorization(options =>
            {
                options.AddPolicy("CanPurge", policy => policy.RequireRole("Administrator"));
            });

        }

        public static void AddLocalCache(this IServiceCollection services, IConfiguration configuration)
        {
            services.AddMemoryCache();
            services.AddScoped(typeof(ICacheManager<>), typeof(MemoryCacheManager<>));
        
        }

        public static void AddDistributedCache(this IServiceCollection services, IConfiguration configuration)
        {
            services.AddScoped(typeof(ICacheManager<>), typeof(RedisCacheManager<>));
            ConfigRedis(services, configuration);
        }

        public static void AddHybridCache(this IServiceCollection services, IConfiguration configuration)
        {
            services.AddScoped(typeof(ICacheManager<>), typeof(HybridCacheManager<>));

            services.AddScoped(typeof(IAppCacheManager<>), typeof(MemoryCacheManager<>));
            services.AddMemoryCache();

            services.AddScoped(typeof(IAppDistributedCacheManager<>), typeof(RedisCacheManager<>));
            ConfigRedis(services, configuration);
        }

        public static void AddNoCache(this IServiceCollection services, IConfiguration configuration)
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