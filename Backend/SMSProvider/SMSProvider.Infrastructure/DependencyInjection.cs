using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using SMSProvider.Application.Configs;
using SMSProvider.Application.Interfaces;
using SMSProvider.Infrastructure.Persistence;
using SMSProvider.Infrastructure.Services;

namespace SMSProvider.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        services.Configure<SmsIrOptions>(configuration.GetSection(SmsIrOptions.SectionName));

        services.AddDbContext<ApplicationDbContext>(options =>
            options.UseSqlServer(
                configuration.GetConnectionString("DefaultConnection"),
                b => b.MigrationsAssembly(typeof(ApplicationDbContext).Assembly.FullName)));

        services.AddScoped<ISmsOutboxStore, SmsOutboxStore>();

        services.AddHttpClient<ISmsSender, SmsIrSender>((_, client) =>
        {
            var options = configuration.GetSection(SmsIrOptions.SectionName).Get<SmsIrOptions>() ?? new SmsIrOptions();
            var baseUrl = string.IsNullOrWhiteSpace(options.BaseUrl)
                ? "https://api.sms.ir/v1/"
                : options.BaseUrl.TrimEnd('/') + "/";
            client.BaseAddress = new Uri(baseUrl);
            client.Timeout = TimeSpan.FromSeconds(30);
        });

        return services;
    }
}
