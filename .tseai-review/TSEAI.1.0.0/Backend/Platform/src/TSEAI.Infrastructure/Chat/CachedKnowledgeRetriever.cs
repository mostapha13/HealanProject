using System.Security.Cryptography; using System.Text; using System.Text.Json;
using Microsoft.Extensions.Caching.Distributed; using TSEAI.Application.Chat; using TSEAI.Application.Performance;
namespace TSEAI.Infrastructure.Chat;
public sealed class CachedKnowledgeRetriever(HttpKnowledgeRetriever inner,IDistributedCache cache,IPerformanceTelemetry telemetry):IKnowledgeRetriever
{
    public async Task<KnowledgeSearchResult> RetrieveAsync(string query,int limit,KnowledgeRetrievalContext context,CancellationToken ct)
    {
        limit=Math.Clamp(limit,1,20); var key=CacheKey(query,limit,context);
        var cached=await cache.GetStringAsync(key,ct); if(cached is not null){telemetry.CacheHit();return JsonSerializer.Deserialize<KnowledgeSearchResult>(cached)!;}
        telemetry.CacheMiss(); var result=await inner.RetrieveAsync(query,limit,context,ct);
        await SaveAsync(key,result,context,ct); return result;
    }

    public async Task<IReadOnlyList<KnowledgeSearchResult>> RetrieveManyAsync(
        IReadOnlyList<string> queries,int limit,KnowledgeRetrievalContext context,CancellationToken ct)
    {
        limit=Math.Clamp(limit,1,20);
        var bounded=queries.Where(x=>!string.IsNullOrWhiteSpace(x)).Distinct(StringComparer.Ordinal).Take(8).ToArray();
        if(bounded.Length==0) return [];
        var output=new KnowledgeSearchResult?[bounded.Length];
        var misses=new List<(int Index,string Query,string Key)>();
        for(var index=0;index<bounded.Length;index++)
        {
            var key=CacheKey(bounded[index],limit,context);
            var cached=await cache.GetStringAsync(key,ct);
            if(cached is null) { telemetry.CacheMiss(); misses.Add((index,bounded[index],key)); }
            else { telemetry.CacheHit(); output[index]=JsonSerializer.Deserialize<KnowledgeSearchResult>(cached)!; }
        }
        if(misses.Count>0)
        {
            var retrieved=await inner.RetrieveManyAsync(misses.Select(x=>x.Query).ToArray(),limit,context,ct);
            for(var index=0;index<misses.Count;index++)
            {
                var result=index<retrieved.Count?retrieved[index]:new KnowledgeSearchResult([],misses[index].Query);
                output[misses[index].Index]=result;
                await SaveAsync(misses[index].Key,result,context,ct);
            }
        }
        return output.Select((result,index)=>result??new KnowledgeSearchResult([],bounded[index])).ToArray();
    }

    private static string CacheKey(string query,int limit,KnowledgeRetrievalContext context)
    {
        var raw=JsonSerializer.Serialize(new{q=query.Trim(),limit,context.Symbol,context.DateFrom,context.DateTo,context.LatestFirst,context.ContentTypeId,context.Route,context.LanguageId,context.SourceType,context.CurrentOnly});
        return "tseai:knowledge:cache:v1:"+Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(raw))).ToLowerInvariant();
    }

    private Task SaveAsync(string key,KnowledgeSearchResult result,KnowledgeRetrievalContext context,CancellationToken ct)
        => cache.SetStringAsync(key,JsonSerializer.Serialize(result),new DistributedCacheEntryOptions
        {
            AbsoluteExpirationRelativeToNow=TimeSpan.FromSeconds(context.LatestFirst==true?8:context.CurrentOnly==false?60:20)
        },ct);
}
