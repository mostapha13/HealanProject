using FileManager.GrpcClient.Interfaces;
using IdentityServer.GrpcClient.Interfaces;
using Microsoft.Extensions.Diagnostics.HealthChecks;

namespace Healan.Application.Health;

public class IdentityHealthCheck : IHealthCheck
{
    private readonly IIdentityTool _identityTool;

    public IdentityHealthCheck(IIdentityTool identityTool)
    {
        _identityTool = identityTool;
    }

    public async Task<HealthCheckResult> CheckHealthAsync(HealthCheckContext context, CancellationToken cancellationToken = default)
    {
        try
        {
            var allRole = await _identityTool.GetAllRole(new IdentityServer.GrpcClient.Empty());

            return allRole.RoleInfos_ != null
                ? HealthCheckResult.Healthy("Identity is healthy")
                : HealthCheckResult.Unhealthy("Identity is not healthy");
        }
        catch (Exception ex)
        {
            return HealthCheckResult.Unhealthy("Identity threw exception", ex);
        }
    }
}
