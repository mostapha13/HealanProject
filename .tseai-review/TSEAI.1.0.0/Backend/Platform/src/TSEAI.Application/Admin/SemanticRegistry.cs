using TSEAI.Application.Tools;
using TSEAI.Application.Usage;
using TSEAI.Application.Data.Canonical;

namespace TSEAI.Application.Admin;

public sealed record SemanticAliasItem(string Alias,string Canonical,string Kind);
public sealed record SemanticPolicyItem(string Key,string Value,string Category);
public sealed record SemanticRegistrySnapshot(
    IReadOnlyList<StructuredToolDescriptor> Tools,
    IReadOnlyList<SemanticAliasItem> Aliases,
    IReadOnlyList<SemanticPolicyItem> Policies,
    IReadOnlyList<string> ContentRoutes,
    IReadOnlyList<CanonicalSourceDescriptor> DataSources,
    IReadOnlyList<CanonicalCatalogValidationIssue> CatalogIssues,
    DateTimeOffset GeneratedAtUtc);

public interface ISemanticRegistryService
{
    Task<SemanticRegistrySnapshot> GetAsync(CancellationToken ct);
    Task SetAliasAsync(string alias,string canonical,string kind,CancellationToken ct);
    Task RemoveAliasAsync(string alias,CancellationToken ct);
    Task SetPolicyAsync(string key,string value,string category,CancellationToken ct);
}

public sealed class SemanticRegistryService(IStructuredToolGateway tools, ISystemSettingService settings) : ISemanticRegistryService
{
    public async Task<SemanticRegistrySnapshot> GetAsync(CancellationToken ct)
    {
        var all=await settings.GetAllAsync(ct);
        var aliases=all.Where(x=>x.Key.StartsWith("SemanticAlias:",StringComparison.Ordinal))
            .Select(x=>new SemanticAliasItem(x.Key[14..],Parse(x.Value,0),Parse(x.Value,1,"Instrument")))
            .OrderBy(x=>x.Alias,StringComparer.Ordinal).ToArray();
        var policies=all.Where(x=>x.Key.StartsWith("SemanticPolicy:",StringComparison.Ordinal))
            .Select(x=>new SemanticPolicyItem(x.Key[15..],x.Value,"Semantic"))
            .OrderBy(x=>x.Key,StringComparer.Ordinal).ToArray();
        var routes=new[]{"1:rag-news","2:rag-content","3:ignore-banner","4:rag-video-text","5:hybrid-download-metadata","6-21:hybrid-structured-first","22:conditional-image-metadata","23:rag-bulletin","24:rag-brandbook","25:hybrid-managers","26:hybrid-company-state"};
        return new(tools.Describe(),aliases,policies,routes,
            CanonicalSourceCatalog.All,CanonicalSourceCatalog.Validate(),DateTimeOffset.UtcNow);
    }
    public Task SetAliasAsync(string alias,string canonical,string kind,CancellationToken ct)
    {
        ValidateToken(alias,96,"alias"); ValidateToken(canonical,192,"canonical"); ValidateToken(kind,48,"kind");
        return settings.SetAsync("SemanticAlias:"+alias.Trim(),canonical.Trim()+"|"+kind.Trim(),"string",alias.Trim(),"Semantic alias","Semantic",ct);
    }
    public Task RemoveAliasAsync(string alias,CancellationToken ct)
    {
        // ISystemSettingService has no delete surface by design; tombstone keeps auditability and prevents silent destructive changes.
        ValidateToken(alias,96,"alias");
        return settings.SetAsync("SemanticAlias:"+alias.Trim(),"__disabled__|Disabled","string",alias.Trim(),"Disabled semantic alias","Semantic",ct);
    }
    public Task SetPolicyAsync(string key,string value,string category,CancellationToken ct)
    {
        ValidateToken(key,96,"policy"); if(value.Length>512) throw new ArgumentException("policy_value_too_long");
        return settings.SetAsync("SemanticPolicy:"+key.Trim(),value.Trim(),"string",key.Trim(),"Semantic policy",string.IsNullOrWhiteSpace(category)?"Semantic":category,ct);
    }
    private static string Parse(string value,int index,string fallback="") { var p=value.Split('|',2); return p.Length>index?p[index]:fallback; }
    private static void ValidateToken(string v,int max,string name){if(string.IsNullOrWhiteSpace(v)||v.Length>max)throw new ArgumentException("invalid_"+name);}
}
