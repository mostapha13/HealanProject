
using FluentValidation;
using MediatR;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Share.Application.Common.Behaviours;
using Share.Application.Common.Cache;
using Share.Application.Common.Interfaces;
using System.Reflection;

namespace Share.Application
{
    public static class DependencyInjection
    {
        public static IServiceCollection AddPipelineBehavior(this IServiceCollection services, IConfiguration configuration)
        {
            services.AddTransient(typeof(IPipelineBehavior<,>), typeof(UnhandledExceptionBehaviour<,>));
            services.AddTransient(typeof(IPipelineBehavior<,>), typeof(AuthorizationBehaviour<,>));
            services.AddTransient(typeof(IPipelineBehavior<,>), typeof(ValidationBehaviour<,>));
            services.AddTransient(typeof(IPipelineBehavior<,>), typeof(PerformanceBehaviour<,>));
            services.AddTransient(typeof(IPipelineBehavior<,>), typeof(ConcurrentRequestSupervisorBehaviour<,>));
            //services.AddTransient(typeof(IPipelineBehavior<,>), typeof(HtmlSanitizerBehavior<,>));
            return services;
        }
    }
}
