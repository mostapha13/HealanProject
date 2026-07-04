using FileManager.GrpcClient;
using FluentValidation;
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
