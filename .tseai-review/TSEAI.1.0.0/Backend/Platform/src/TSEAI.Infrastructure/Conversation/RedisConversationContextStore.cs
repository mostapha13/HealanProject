using System.Text.Json;
using StackExchange.Redis;
using TSEAI.Application.Chat.Context;

namespace TSEAI.Infrastructure.Conversation;

public sealed class RedisConversationContextStore(IConnectionMultiplexer redis) : IConversationContextStore
{
    private static readonly JsonSerializerOptions JsonOptions=new(JsonSerializerDefaults.Web);
    private static readonly TimeSpan Ttl=TimeSpan.FromDays(30);
    private readonly IDatabase _db=redis.GetDatabase();
    private static string Key(string subject,string conversationId)=>$"tseai:chat-context:v1:{subject}:{conversationId}";

    public async Task<ConversationContextState> GetAsync(string subject,string conversationId,CancellationToken ct)
    {
        var value=await _db.StringGetAsync(Key(subject,conversationId));
        if(!value.HasValue) return ConversationContextState.Empty(conversationId);
        return JsonSerializer.Deserialize<ConversationContextState>(value.ToString(),JsonOptions)??ConversationContextState.Empty(conversationId);
    }

    public async Task SaveAsync(string subject,ConversationContextState state,CancellationToken ct)
        => await _db.StringSetAsync(Key(subject,state.ConversationId),JsonSerializer.Serialize(state,JsonOptions),Ttl);

    public async Task ClearAsync(string subject,string conversationId,CancellationToken ct)
        => await _db.KeyDeleteAsync(Key(subject,conversationId));
}
