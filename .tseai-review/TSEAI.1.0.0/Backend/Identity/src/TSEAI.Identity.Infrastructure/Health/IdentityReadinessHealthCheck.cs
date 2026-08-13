using System.Diagnostics;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using StackExchange.Redis;
using TSEAI.Identity.Infrastructure.Persistence;

namespace TSEAI.Identity.Infrastructure.Health;

public sealed class IdentityReadinessHealthCheck(
    IServiceScopeFactory scopeFactory,
    IConnectionMultiplexer redis) : IHealthCheck
{
    public async Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context,
        CancellationToken cancellationToken = default)
    {
        var timings = new Dictionary<string, object>();
        try
        {
            var sw = Stopwatch.StartNew();
            await using (var scope = scopeFactory.CreateAsyncScope())
            {
                var db = scope.ServiceProvider.GetRequiredService<IdentityDbContext>();
                if (!await db.Database.CanConnectAsync(cancellationToken))
                    return HealthCheckResult.Unhealthy("Identity SQL database is unreachable.");
            }
            timings["sqlMs"] = sw.ElapsedMilliseconds;

            sw.Restart();
            await redis.GetDatabase().PingAsync().WaitAsync(cancellationToken);
            timings["redisMs"] = sw.ElapsedMilliseconds;
            return HealthCheckResult.Healthy("Identity dependencies are reachable.", timings);
        }
        catch (Exception exception) when (exception is not OperationCanceledException || !cancellationToken.IsCancellationRequested)
        {
            return HealthCheckResult.Unhealthy("An identity dependency is unreachable.", exception, timings);
        }
    }
}
