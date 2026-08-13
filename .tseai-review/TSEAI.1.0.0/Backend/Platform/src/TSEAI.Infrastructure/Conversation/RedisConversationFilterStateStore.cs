using System.Text.Json;
using StackExchange.Redis;
using TSEAI.Application.Filters.Conversation;

namespace TSEAI.Infrastructure.Conversation;

public sealed class RedisConversationFilterStateStore(IConnectionMultiplexer redis) : IConversationFilterStateStore
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);
    private static readonly TimeSpan Ttl = TimeSpan.FromDays(7);
    private readonly IDatabase _db = redis.GetDatabase();

    public async Task<ConversationFilterState> GetAsync(string subject, string conversationId, CancellationToken ct)
    {
        ct.ThrowIfCancellationRequested();
        var value = await _db.StringGetAsync(Key(subject, conversationId));
        if (!value.HasValue) return ConversationFilterState.Empty(conversationId);
        return JsonSerializer.Deserialize<ConversationFilterState>(value.ToString(), JsonOptions)
               ?? ConversationFilterState.Empty(conversationId);
    }

    public async Task SaveAsync(string subject, ConversationFilterState state, CancellationToken ct)
    {
        ct.ThrowIfCancellationRequested();
        var payload = JsonSerializer.Serialize(state, JsonOptions);
        await _db.StringSetAsync(Key(subject, state.ConversationId), payload, Ttl);
    }

    private static string Key(string subject, string conversationId) =>
        $"tseai:conversation-filter:{Sanitize(subject)}:{Sanitize(conversationId)}";

    private static string Sanitize(string value) => value.Replace(":", "_", StringComparison.Ordinal).Trim();
}
