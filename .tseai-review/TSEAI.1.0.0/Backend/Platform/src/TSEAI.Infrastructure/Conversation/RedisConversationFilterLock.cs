using StackExchange.Redis;
using TSEAI.Application.Filters.Conversation;

namespace TSEAI.Infrastructure.Conversation;

public sealed class RedisConversationFilterLock(IConnectionMultiplexer redis) : IConversationFilterLock
{
    private readonly IDatabase _db = redis.GetDatabase();
    private static readonly TimeSpan LeaseTime = TimeSpan.FromSeconds(45);

    public async Task<IAsyncDisposable?> TryAcquireAsync(string subject, string conversationId, CancellationToken ct)
    {
        ct.ThrowIfCancellationRequested();
        var key = $"tseai:conversation-filter-lock:{Sanitize(subject)}:{Sanitize(conversationId)}";
        var token = Guid.NewGuid().ToString("N");
        var acquired = await _db.StringSetAsync(key, token, LeaseTime, When.NotExists);
        return acquired ? new Lease(_db, key, token) : null;
    }

    private static string Sanitize(string value) => value.Replace(":", "_", StringComparison.Ordinal).Trim();

    private sealed class Lease(IDatabase db, RedisKey key, RedisValue token) : IAsyncDisposable
    {
        private const string ReleaseScript = "if redis.call('get', KEYS[1]) == ARGV[1] then return redis.call('del', KEYS[1]) else return 0 end";
        public async ValueTask DisposeAsync() => await db.ScriptEvaluateAsync(ReleaseScript, new RedisKey[] { key }, new RedisValue[] { token });
    }
}
