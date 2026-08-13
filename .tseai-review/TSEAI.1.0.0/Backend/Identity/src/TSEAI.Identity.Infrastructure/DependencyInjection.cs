using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using StackExchange.Redis;
using TSEAI.Identity.Application.Auth;
using TSEAI.Identity.Domain.Entities;
using TSEAI.Identity.Infrastructure.Auth;
using TSEAI.Identity.Infrastructure.Persistence;
using TSEAI.Identity.Infrastructure.Health;
namespace TSEAI.Identity.Infrastructure;
public static class DependencyInjection
{
    public static IServiceCollection AddIdentityInfrastructure(this IServiceCollection services, IConfiguration cfg)
    {
        services.AddDbContext<IdentityDbContext>(o => o.UseSqlServer(cfg.GetConnectionString("IdentityDb")));
        services.AddIdentityCore<ApplicationUser>(o => { o.User.RequireUniqueEmail = false; o.Lockout.MaxFailedAccessAttempts = 5; })
            .AddRoles<ApplicationRole>().AddEntityFrameworkStores<IdentityDbContext>().AddDefaultTokenProviders();
        services.AddStackExchangeRedisCache(o => o.Configuration = cfg["Redis:ConnectionString"]);
            services.AddSingleton<IConnectionMultiplexer>(_ => ConnectionMultiplexer.Connect(cfg["Redis:ConnectionString"] ?? "redis:6379"));
        services.AddScoped<IOtpService, RedisOtpService>();
        services.AddScoped<ITokenService, JwtTokenService>();
        services.AddHttpClient<ISmsSender, ConfigurableSmsSender>(client => client.Timeout = TimeSpan.FromSeconds(10));
        services.AddHealthChecks().AddCheck<IdentityReadinessHealthCheck>("identity-dependencies", tags: ["ready"]);
        return services;
    }
}
