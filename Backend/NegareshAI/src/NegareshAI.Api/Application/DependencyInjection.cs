using MediatR;
using NegareshAI.Api.Application.Common.Auditing;
using NegareshAI.Api.Application.Common.Tenancy;
using System.Reflection;
using NegareshAI.Api.Services;

namespace NegareshAI.Api.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        var assembly = Assembly.GetExecutingAssembly();
        services.AddAutoMapper(assembly);
        services.AddMediatR(assembly);
        services.AddHttpContextAccessor();
        services.AddScoped<ICurrentTenant, CurrentTenant>();
        services.AddScoped<IAuditWriter, AuditWriter>();
        services.AddScoped<IComparisonEngine, ComparisonEngine>();
        return services;
    }
}
