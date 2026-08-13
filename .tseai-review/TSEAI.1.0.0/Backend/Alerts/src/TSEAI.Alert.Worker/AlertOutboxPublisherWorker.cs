using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using StackExchange.Redis;
using TSEAI.Infrastructure.Persistence;

namespace TSEAI.Alert.Worker;

public sealed class AlertOutboxPublisherWorker(
    IServiceScopeFactory scopes,
    RabbitMqAlertPublisher publisher,
    IConnectionMultiplexer redis,
    IOptions<AlertEngineOptions> options,
    ILogger<AlertOutboxPublisherWorker> log) : BackgroundService
{
    private const string LeaseKey = "tseai:alert:outbox:publisher-lease:v1";
    private const string ReleaseLeaseScript = "if redis.call('GET', KEYS[1]) == ARGV[1] then return redis.call('DEL', KEYS[1]) else return 0 end";
    private readonly AlertEngineOptions _options = options.Value;
    private readonly IDatabase _redis = redis.GetDatabase();

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                var count = await TryPublishBatchUnderLeaseAsync(stoppingToken);
                if (count == 0) await Task.Delay(Math.Max(100, _options.OutboxPollMilliseconds), stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested) { }
            catch (Exception ex)
            {
                log.LogError(ex, "Alert outbox publisher failed");
                await Task.Delay(1500, stoppingToken);
            }
        }
    }

    private async Task<int> TryPublishBatchUnderLeaseAsync(CancellationToken ct)
    {
        var token = Guid.NewGuid().ToString("N");
        var acquired = await _redis.StringSetAsync(
            LeaseKey,
            token,
            TimeSpan.FromSeconds(Math.Max(15, _options.OutboxLeaseSeconds)),
            When.NotExists);
        if (!acquired) return 0;

        try { return await PublishBatchAsync(ct); }
        finally
        {
            try { await _redis.ScriptEvaluateAsync(ReleaseLeaseScript, [(RedisKey)LeaseKey], [(RedisValue)token]); }
            catch (Exception ex) { log.LogWarning(ex, "Alert outbox publisher lease release failed"); }
        }
    }

    private async Task<int> PublishBatchAsync(CancellationToken ct)
    {
        await using var scope = scopes.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var rows = await db.AlertOutbox
            .Where(x => x.PublishedAtUtc == null && x.AttemptCount < 100)
            .OrderBy(x => x.CreatedAtUtc)
            .Take(Math.Clamp(_options.OutboxBatchSize, 1, 200))
            .ToListAsync(ct);
        foreach (var row in rows)
        {
            try
            {
                await publisher.PublishAsync(row.AlertEventId, row.PayloadJson, ct);
                row.PublishedAtUtc = DateTime.UtcNow;
                row.LastAttemptAtUtc = DateTime.UtcNow;
                row.AttemptCount++;
                row.LastError = null;
            }
            catch (Exception ex)
            {
                row.LastAttemptAtUtc = DateTime.UtcNow;
                row.AttemptCount++;
                row.LastError = ex.Message.Length <= 2000 ? ex.Message : ex.Message[..2000];
                log.LogWarning(ex, "Publishing alert event {EventId} failed (attempt {Attempt})", row.AlertEventId, row.AttemptCount);
            }
            await db.SaveChangesAsync(ct);
        }
        return rows.Count;
    }
}
