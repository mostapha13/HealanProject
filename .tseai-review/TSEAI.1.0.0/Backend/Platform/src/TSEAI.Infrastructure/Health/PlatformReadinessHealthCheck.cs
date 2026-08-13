using System.Diagnostics;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using StackExchange.Redis;
using TSEAI.Infrastructure.Persistence;

namespace TSEAI.Infrastructure.Health;

public sealed class PlatformReadinessHealthCheck(
    IServiceScopeFactory scopeFactory,
    IConnectionMultiplexer redis,
    IHttpClientFactory httpClients) : IHealthCheck
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
                var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
                if (!await db.Database.CanConnectAsync(cancellationToken))
                    return HealthCheckResult.Unhealthy("Application SQL database is unreachable.");
            }
            timings["sqlMs"] = sw.ElapsedMilliseconds;

            sw.Restart();
            await redis.GetDatabase().PingAsync().WaitAsync(cancellationToken);
            timings["redisMs"] = sw.ElapsedMilliseconds;

            sw.Restart();
            using var response = await httpClients.CreateClient("ai-health").GetAsync("health", cancellationToken);
            if (!response.IsSuccessStatusCode)
                return HealthCheckResult.Unhealthy($"AI service returned HTTP {(int)response.StatusCode}.", data: timings);
            timings["aiMs"] = sw.ElapsedMilliseconds;

            return HealthCheckResult.Healthy("Platform dependencies are reachable.", timings);
        }
        catch (Exception exception) when (exception is not OperationCanceledException || !cancellationToken.IsCancellationRequested)
        {
            return HealthCheckResult.Unhealthy("A platform dependency is unreachable.", exception, timings);
        }
    }
}
