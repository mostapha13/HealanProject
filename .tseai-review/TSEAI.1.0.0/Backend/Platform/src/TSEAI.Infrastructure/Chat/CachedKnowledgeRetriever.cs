using System.Security.Cryptography; using System.Text; using System.Text.Json;
using Microsoft.Extensions.Caching.Distributed; using TSEAI.Application.Chat; using TSEAI.Application.Performance;
namespace TSEAI.Infrastructure.Chat;
public sealed class CachedKnowledgeRetriever(HttpKnowledgeRetriever inner,IDistributedCache cache,IPerformanceTelemetry telemetry):IKnowledgeRetriever
{
    public async Task<KnowledgeSearchResult> RetrieveAsync(string query,int limit,KnowledgeRetrievalContext context,CancellationToken ct)
    {
        limit=Math.Clamp(limit,1,20); var raw=JsonSerializer.Serialize(new{q=query.Trim(),limit,context.Symbol,context.DateFrom,context.DateTo,context.LatestFirst,context.ContentTypeId,context.Route,context.LanguageId,context.SourceType,context.CurrentOnly});
        var key="tseai:knowledge:cache:v1:"+Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(raw))).ToLowerInvariant();
        var cached=await cache.GetStringAsync(key,ct); if(cached is not null){telemetry.CacheHit();return JsonSerializer.Deserialize<KnowledgeSearchResult>(cached)!;}
        telemetry.CacheMiss(); var result=await inner.RetrieveAsync(query,limit,context,ct);
        await cache.SetStringAsync(key,JsonSerializer.Serialize(result),new DistributedCacheEntryOptions{AbsoluteExpirationRelativeToNow=TimeSpan.FromSeconds(context.LatestFirst==true?8:20)},ct); return result;
    }
}
