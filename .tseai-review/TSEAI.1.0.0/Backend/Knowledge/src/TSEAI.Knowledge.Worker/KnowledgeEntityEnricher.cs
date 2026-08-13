using System.Text.RegularExpressions;
using Microsoft.Data.SqlClient;

namespace TSEAI.Knowledge.Worker;

/// <summary>
/// Conservative deterministic enrichment: only exact symbol tokens from the authoritative Instrument landing table are accepted.
/// Company names are attached only when reached through an exact resolved symbol; arbitrary free-text company guessing is prohibited.
/// </summary>
public sealed partial class KnowledgeEntityEnricher(KnowledgeOptions options, ILogger<KnowledgeEntityEnricher> logger)
{
    private readonly SemaphoreSlim _refreshLock=new(1,1);
    private Dictionary<string,(string Symbol,string? Company)> _symbols=new(StringComparer.OrdinalIgnoreCase);
    private DateTimeOffset _loadedAt=DateTimeOffset.MinValue;

    public async Task EnrichAsync(IReadOnlyList<KnowledgeDocument> documents,CancellationToken ct)
    {
        await EnsureLoadedAsync(ct);
        if(_symbols.Count==0) return;
        foreach(var doc in documents)
        {
            var tokens=TokenRegex().Matches(Normalize($"{doc.Title} {doc.Body}"))
                .Select(x=>x.Value).Where(x=>x.Length>=2).Distinct(StringComparer.OrdinalIgnoreCase);
            var matches=new List<(string Symbol,string? Company)>();
            foreach(var token in tokens)
                if(_symbols.TryGetValue(token,out var hit)) matches.Add(hit);
            if(matches.Count==0) continue;
            var unique=matches.GroupBy(x=>x.Symbol,StringComparer.OrdinalIgnoreCase).Select(x=>x.First()).Take(20).ToArray();
            doc.Metadata["symbols"]=unique.Select(x=>x.Symbol).ToArray();
            var companies=unique.Select(x=>x.Company).Where(x=>!string.IsNullOrWhiteSpace(x)).Distinct(StringComparer.OrdinalIgnoreCase).Take(20).ToArray();
            if(companies.Length>0) doc.Metadata["companies"]=companies;
        }
    }

    private async Task EnsureLoadedAsync(CancellationToken ct)
    {
        if(DateTimeOffset.UtcNow-_loadedAt<TimeSpan.FromMinutes(30)) return;
        await _refreshLock.WaitAsync(ct);
        try
        {
            if(DateTimeOffset.UtcNow-_loadedAt<TimeSpan.FromMinutes(30)) return;
            var map=new Dictionary<string,(string,string?)>(StringComparer.OrdinalIgnoreCase);
            if(string.IsNullOrWhiteSpace(options.ConnectionString)) return;
            var csb=new SqlConnectionStringBuilder(options.ConnectionString){ApplicationIntent=ApplicationIntent.ReadOnly};
            await using var connection=new SqlConnection(csb.ConnectionString); await connection.OpenAsync(ct);
            await using(var exists=new SqlCommand("SELECT CASE WHEN OBJECT_ID('dbo.Instrument','U') IS NULL THEN 0 ELSE 1 END",connection))
                if(Convert.ToInt32(await exists.ExecuteScalarAsync(ct))==0){ _loadedAt=DateTimeOffset.UtcNow; return; }
            await using var command=new SqlCommand("SELECT LVal18AFC, LSoc30 FROM dbo.Instrument WHERE LVal18AFC IS NOT NULL",connection){CommandTimeout=30};
            await using var reader=await command.ExecuteReaderAsync(ct);
            while(await reader.ReadAsync(ct))
            {
                var symbol=reader.IsDBNull(0)?null:Convert.ToString(reader.GetValue(0));
                if(string.IsNullOrWhiteSpace(symbol)) continue;
                var normalized=Normalize(symbol);
                if(normalized.Length<2 || normalized.Contains(' ')) continue;
                var company=reader.IsDBNull(1)?null:Convert.ToString(reader.GetValue(1));
                map.TryAdd(normalized,(symbol.Trim(),string.IsNullOrWhiteSpace(company)?null:company.Trim()));
            }
            _symbols=map; _loadedAt=DateTimeOffset.UtcNow;
            logger.LogInformation("Knowledge entity lexicon loaded {Count} exact symbol aliases.",map.Count);
        }
        catch(Exception ex){ logger.LogWarning(ex,"Knowledge entity lexicon refresh failed; ingestion continues without inferred entity metadata."); _loadedAt=DateTimeOffset.UtcNow; }
        finally { _refreshLock.Release(); }
    }

    private static string Normalize(string value)=>value.Replace('ي','ی').Replace('ى','ی').Replace('ك','ک').Replace('\u200c',' ').Trim();
    [GeneratedRegex(@"[\p{L}\p{N}_-]+",RegexOptions.Compiled)] private static partial Regex TokenRegex();
}
