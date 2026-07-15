using FileManager.GrpcClient;
using FluentValidation;
using Healan.Application.Common.ClinicAccess;
using Healan.Application.Common.Services;
using IdentityServer.GrpcClient;


//using Healan.Application.Health;
using MediatR;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Share.Application;
using Share.Application.Common.Behaviours;
using System.Reflection;

namespace Healan.Application
{
    public static class DependencyInjection
    {
        public static IServiceCollection AddApplication(this IServiceCollection services, IConfiguration configuration)
        {

            services.AddIdentityServices(configuration);
            services.AddAutoMapper(Assembly.GetExecutingAssembly());
            services.AddValidatorsFromAssembly(Assembly.GetExecutingAssembly());
            services.AddMediatR(Assembly.GetExecutingAssembly());
            services.AddPipelineBehavior(configuration);
            services.AddFileManagerServices(configuration);
            services.AddScoped<IInvoiceCalculationService, InvoiceCalculationService>();
            services.AddScoped<IClinicAccessScopeService, ClinicAccessScopeService>();
            services.AddHttpClient("SMSProvider", (sp, client) =>
            {
                var config = sp.GetRequiredService<IConfiguration>();
                var baseUrl = config["SMSProviderBaseUrl"]?.Trim();
                if (!string.IsNullOrWhiteSpace(baseUrl))
                {
                    if (!baseUrl.EndsWith('/'))
                        baseUrl += "/";
                    client.BaseAddress = new Uri(baseUrl);
                }
                client.Timeout = TimeSpan.FromSeconds(30);
            });
            services.AddHttpClient<Portal.Services.IRagPythonService, Portal.Services.RagPythonService>(client =>
            {
                client.Timeout = TimeSpan.FromSeconds(120);
            });

            #region Caching
            //Behavior
            services.AddTransient(typeof(IPipelineBehavior<,>), typeof(CachingBehaviour<,>));
            services.AddTransient(typeof(IPipelineBehavior<,>), typeof(ResetCachingBehaviour<,>));

            #endregion

            return services;
        }

        //public static IServiceCollection AddHealthCheck(this IServiceCollection services, IConfiguration configuration)
        //{
        //    services.AddHealthChecks()
        //        .AddSqlServer(configuration.GetConnectionString("DefaultConnection"), name: "Sql server database")
        //        .AddCheck<SignatureHealthCheck>(name:"SignatureService")
        //        .AddCheck<IdentityHealthCheck>(name: "IdentityService")
        //        .AddCheck<FileManagerHealthCheck>(name:"FileManagerService")
        //        ;



        //    return services;
        //}
    }
}
