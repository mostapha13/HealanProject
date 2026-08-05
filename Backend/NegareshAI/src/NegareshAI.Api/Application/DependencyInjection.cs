using MediatR;
using NegareshAI.Api.Application.Common.Auditing;
using NegareshAI.Api.Application.Common.Tenancy;
using System.Reflection;
using NegareshAI.Api.Services;
using NegareshAI.Api.Application.Access;
using NegareshAI.Api.Application.ContractOperations;

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
        services.AddScoped<IDataScopeAuthorizer, DataScopeAuthorizer>();
        services.AddScoped<ContractOperationScope>();
        services.AddScoped<IContractOperationReminderProcessor,
            ContractOperationReminderProcessor>();
        return services;
    }
}
