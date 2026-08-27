using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Extensions.Logging;
using TSEAI.Application.Chat;

namespace TSEAI.Infrastructure.Chat;

public sealed class HttpKnowledgeRetriever(HttpClient http,ILogger<HttpKnowledgeRetriever> logger):IKnowledgeRetriever
{
    public async Task<KnowledgeSearchResult> RetrieveAsync(string query,int limit,KnowledgeRetrievalContext context,CancellationToken ct)
    {
        try
        {
            using var response=await http.PostAsJsonAsync("knowledge/retrieve",new { query,limit,source_type=context.SourceType,symbol=context.Symbol,date_from=context.DateFrom,date_to=context.DateTo,latest_first=context.LatestFirst,content_type_id=context.ContentTypeId,route=context.Route,language_id=context.LanguageId,current_only=context.CurrentOnly },ct);
            if(!response.IsSuccessStatusCode)
            {
                logger.LogWarning("Knowledge retrieval returned HTTP {Status}; returning an empty grounded result.",(int)response.StatusCode);
                return new([],query);
            }
            using var doc=JsonDocument.Parse(await response.Content.ReadAsStringAsync(ct));
            return Parse(doc.RootElement,query);
        }
        catch(OperationCanceledException) when(ct.IsCancellationRequested) { throw; }
        catch(Exception ex)
        {
            logger.LogWarning(ex,"Knowledge retrieval is unavailable; returning an empty grounded result.");
            return new([],query);
        }
    }

    public async Task<IReadOnlyList<KnowledgeSearchResult>> RetrieveManyAsync(
        IReadOnlyList<string> queries,int limit,KnowledgeRetrievalContext context,CancellationToken ct)
    {
        if(queries.Count==0) return [];
        if(queries.Count==1) return [await RetrieveAsync(queries[0],limit,context,ct)];
        try
        {
            using var response=await http.PostAsJsonAsync("knowledge/retrieve-batch",new {
                queries,limit,source_type=context.SourceType,symbol=context.Symbol,date_from=context.DateFrom,date_to=context.DateTo,
                latest_first=context.LatestFirst,content_type_id=context.ContentTypeId,route=context.Route,language_id=context.LanguageId,
                current_only=context.CurrentOnly
            },ct);
            if(!response.IsSuccessStatusCode)
            {
                logger.LogWarning("Batch knowledge retrieval returned HTTP {Status}; using bounded individual fallback.",(int)response.StatusCode);
                return await Task.WhenAll(queries.Take(8).Select(query=>RetrieveAsync(query,limit,context,ct)));
            }
            using var doc=JsonDocument.Parse(await response.Content.ReadAsStringAsync(ct));
            if(!doc.RootElement.TryGetProperty("results",out var rows) || rows.ValueKind!=JsonValueKind.Array)
                return await Task.WhenAll(queries.Take(8).Select(query=>RetrieveAsync(query,limit,context,ct)));
            var results=rows.EnumerateArray().Select((row,index)=>Parse(row,index<queries.Count?queries[index]:string.Empty)).ToArray();
            return results.Length==queries.Count
                ? results
                : await Task.WhenAll(queries.Take(8).Select(query=>RetrieveAsync(query,limit,context,ct)));
        }
        catch(OperationCanceledException) when(ct.IsCancellationRequested) { throw; }
        catch(Exception ex)
        {
            logger.LogWarning(ex,"Batch knowledge retrieval is unavailable; using bounded individual fallback.");
            return await Task.WhenAll(queries.Take(8).Select(query=>RetrieveAsync(query,limit,context,ct)));
        }
    }
    private static KnowledgeSearchResult Parse(JsonElement root,string query)
    {
        var hits=new List<KnowledgeHit>();
        var arr=root.TryGetProperty("items",out var i)?i:root.TryGetProperty("hits",out var h)?h:root.TryGetProperty("results",out var r)?r:default;
        if(arr.ValueKind==JsonValueKind.Array)
        foreach(var x in arr.EnumerateArray())
        {
            var payload=x; var source=x.TryGetProperty("source",out var src)?src:default; var metadata=x.TryGetProperty("metadata",out var meta)?meta:default;
            var text=Get(payload,"text")??Get(payload,"body")??""; var score=x.TryGetProperty("score",out var sc)&&sc.TryGetDouble(out var d)?d:0;
            var citation=new KnowledgeCitation(Get(source,"source_type")??Get(payload,"source_type")??"unknown",Get(source,"source_id")??Get(payload,"source_id")??"unknown",Get(payload,"title")??"بدون عنوان",Get(source,"url")??Get(payload,"url"),Get(metadata,"symbol")??Get(payload,"symbol"),Get(source,"published_at")??Get(payload,"published_at"));
            var m=new Dictionary<string,object?>();
            foreach(var name in new[]{"vector_score","bm25_score","phrase_score","entity_score","freshness_score"}) if(x.TryGetProperty(name,out var v)) m[name]=v.ValueKind==JsonValueKind.Number&&v.TryGetDouble(out var n)?n:v.ToString();
            if(metadata.ValueKind==JsonValueKind.Object) foreach(var prop in metadata.EnumerateObject()) if(!m.ContainsKey(prop.Name)) m[prop.Name]=prop.Value.ToString();
            hits.Add(new(text,score,citation,m));
        }
        return new(hits,query);
    }
    private static string? Get(JsonElement e,string name)=>e.ValueKind==JsonValueKind.Object&&e.TryGetProperty(name,out var v)&&v.ValueKind!=JsonValueKind.Null?v.ToString():null;
}
