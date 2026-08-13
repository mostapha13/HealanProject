using System.Diagnostics;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.Extensions.Options;
using RabbitMQ.Client;
using StackExchange.Redis;
using TSEAI.Notification.Api.Alerts;

namespace TSEAI.Notification.Api.Health;

public sealed class NotificationReadinessHealthCheck(
    IConnectionMultiplexer redis,
    IOptions<NotificationRabbitOptions> rabbitOptions) : IHealthCheck
{
    public async Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context,
        CancellationToken cancellationToken = default)
    {
        var timings = new Dictionary<string, object>();
        try
        {
            var sw = Stopwatch.StartNew();
            await redis.GetDatabase().PingAsync().WaitAsync(cancellationToken);
            timings["redisMs"] = sw.ElapsedMilliseconds;

            sw.Restart();
            var options = rabbitOptions.Value;
            var factory = new ConnectionFactory
            {
                HostName = options.Host,
                Port = options.Port,
                UserName = options.UserName,
                Password = options.Password,
                VirtualHost = options.VirtualHost,
                AutomaticRecoveryEnabled = false,
                RequestedConnectionTimeout = TimeSpan.FromSeconds(3),
                ClientProvidedName = "tseai-notification-health",
            };
            await using var connection = await factory.CreateConnectionAsync(cancellationToken);
            timings["rabbitMqMs"] = sw.ElapsedMilliseconds;
            return HealthCheckResult.Healthy("Notification dependencies are reachable.", timings);
        }
        catch (Exception exception) when (exception is not OperationCanceledException || !cancellationToken.IsCancellationRequested)
        {
            return HealthCheckResult.Unhealthy("A notification dependency is unreachable.", exception, timings);
        }
    }
}
