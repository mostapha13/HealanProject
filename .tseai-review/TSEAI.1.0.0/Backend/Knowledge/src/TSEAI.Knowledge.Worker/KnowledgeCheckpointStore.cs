using System.Text.Json;
using StackExchange.Redis;

namespace TSEAI.Knowledge.Worker;

public interface IKnowledgeCheckpointStore
{
    Task<IngestionCheckpoint?> LoadAsync(string sourceName);
    Task SaveAsync(string sourceName, IngestionCheckpoint checkpoint);
}

public sealed class RedisKnowledgeCheckpointStore(KnowledgeOptions options, IConnectionMultiplexer redis) : IKnowledgeCheckpointStore
{
    private readonly IDatabase _database = redis.GetDatabase();

    public async Task<IngestionCheckpoint?> LoadAsync(string sourceName)
    {
        var value = await _database.HashGetAsync(Key(sourceName), "payload");
        return value.HasValue ? JsonSerializer.Deserialize<IngestionCheckpoint>(value.ToString()) : null;
    }

    public async Task SaveAsync(string sourceName, IngestionCheckpoint checkpoint)
    {
        var key = Key(sourceName);
        var value = JsonSerializer.Serialize(checkpoint);
        const string script = "local ow=redis.call('HGET',KEYS[1],'watermark'); local oi=redis.call('HGET',KEYS[1],'source_id'); if not ow or ARGV[1]>ow or (ARGV[1]==ow and ARGV[2]>=oi) then redis.call('HSET',KEYS[1],'watermark',ARGV[1],'source_id',ARGV[2],'payload',ARGV[3]); return 1 end; return 0";
        var watermark = checkpoint.Watermark.ToUniversalTime().ToString("O");
        await _database.ScriptEvaluateAsync(script, [key], [watermark, checkpoint.LastSourceId, value]);
    }

    private RedisKey Key(string sourceName)
    {
        var safe = new string(sourceName.ToLowerInvariant().Select(ch => char.IsLetterOrDigit(ch) || ch is '-' or '_' ? ch : '_').ToArray());
        return $"{options.CheckpointKeyPrefix}:{safe}";
    }
}
