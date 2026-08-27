using Dapper;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Caching.Memory;
using TSEAI.Application.Entities;

namespace TSEAI.Infrastructure.Entities;

public sealed class SqlAiEntityCandidateSource(IConfiguration configuration,IMemoryCache cache) : IEntityCandidateSource
{
    private static readonly SemaphoreSlim CatalogLock=new(1,1);
    private string? ConnectionString => configuration.GetConnectionString("SqlAi");

    public async Task<IReadOnlyList<EntitySourceCandidate>> SearchAsync(EntitySearchRequest request, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(ConnectionString))
            throw new InvalidOperationException("ConnectionStrings:SqlAi is not configured.");

        var expected = request.ExpectedKinds.Count == 0 ? null : request.ExpectedKinds.ToHashSet();
        var rows = new List<EntitySourceCandidate>();
        await using var connection = CreateConnection();
        await connection.OpenAsync(ct);

        if (expected is null || expected.Contains(EntityKind.Instrument) || expected.Contains(EntityKind.MarketIndex))
            rows.AddRange(await SearchInstrumentsAsync(connection, request, ct));
        if (expected is null || expected.Contains(EntityKind.Company))
            rows.AddRange(await SearchCompaniesAsync(connection, request, ct));
        if (expected is null || expected.Contains(EntityKind.TsePerson))
            rows.AddRange(await SearchPeopleAsync(connection, request, ct));
        if (expected is null || expected.Contains(EntityKind.RegionHall))
            rows.AddRange(await SearchRegionHallsAsync(connection, request, ct));
        if (expected is null || expected.Contains(EntityKind.FinancialInstitution))
            rows.AddRange(await SearchFinancialInstitutionsAsync(connection, request, ct));

        return rows;
    }

    private SqlConnection CreateConnection()
    {
        var builder = new SqlConnectionStringBuilder(ConnectionString!);
        return new SqlConnection(builder.ConnectionString);
    }

    private async Task<IReadOnlyList<EntitySourceCandidate>> SearchInstrumentsAsync(SqlConnection connection, EntitySearchRequest request, CancellationToken ct)
    {
        // Once the catalog is warm, resolve entirely in memory. Re-running an
        // exact-miss SQL query for every colloquial variation (for example
        // «فملی مال») needlessly scans/blocks the source database before the
        // same cached catalog is consulted.
        if(cache.TryGetValue(InstrumentCatalogCacheKey(),out IReadOnlyList<CachedInstrument>? cached)&&cached is not null)
            return RankInstrumentCatalog(cached,request);

        var looksNumeric=long.TryParse(request.CompactText,out _);
        var looksLikeIsin=request.OriginalText.StartsWith("IR",StringComparison.OrdinalIgnoreCase);
        var looksLikeCanonicalId=request.OriginalText.Length>24 || request.OriginalText.Contains('-',StringComparison.Ordinal);
        var predicate=looksNumeric
            ? "(i.InsCode=TRY_CONVERT(bigint,@Compact) OR i.InstrumentID=@Original)"
            : looksLikeIsin
                ? "i.CIsin=@Original"
                : looksLikeCanonicalId
                    ? "i.InstrumentID=@Original"
                    : "(i.LVal18AFC=@Original OR i.LVal30=@Original)";
        var sql=$$"""
            SELECT TOP (@Limit)
                CASE WHEN EXISTS (SELECT 1 FROM dbo.IndexLastLive ix WHERE ix.Instrumentid = i.InstrumentID) THEN 2 ELSE 1 END AS Kind,
                CONVERT(nvarchar(128), i.InstrumentID) AS CanonicalId,
                COALESCE(NULLIF(i.LVal30,N''), NULLIF(i.LVal18AFC,N''), CONVERT(nvarchar(128),i.InstrumentID)) AS DisplayName,
                i.LVal18AFC AS Symbol,
                CONVERT(nvarchar(128), i.InstrumentID) AS InstrumentId,
                TRY_CONVERT(bigint, i.InsCode) AS InsCode,
                i.CIsin AS Isin,
                i.LVal30 AS Alias1,
                i.CSocCSAC AS Alias2,
                i.LSoc30 AS Alias3,
                i.marketcatery AS Meta1,
                CONVERT(nvarchar(64), i.MarketCateryId) AS Meta2,
                CONVERT(nvarchar(64), i.Industryid) AS Meta3,
                CONVERT(nvarchar(16), i.Valid) AS Meta4
            FROM dbo.Instrument i
            WHERE {{predicate}}
            ORDER BY i.Valid DESC,
                CASE WHEN i.marketcatery=N'cash' AND i.InstrumentID LIKE N'%0001' THEN 0 ELSE 1 END,
                i.SourceCollectedAt DESC,i.DInMar DESC,i.InsCode DESC;
            """;

        // Keep the indexed exact path separate from normalized contains matching. When both
        // branches share one OR predicate SQL Server scans the full instrument catalog even
        // for an exact symbol/id lookup.
        var rows = (await connection.QueryAsync<CandidateRow>(new CommandDefinition(
            sql, Params(request, allowFuzzy: false), cancellationToken: ct, commandTimeout: 15))).AsList();
        if (rows.Count == 0 && request.CompactText.Length >= 2)
            return await SearchCachedInstrumentsAsync(connection,request,ct);
        return rows.Select(x => x.ToCandidate(new Dictionary<string, string?>
        {
            ["marketCategory"] = x.Meta1,
            ["marketCategoryId"] = x.Meta2,
            ["industryId"] = x.Meta3,
            ["valid"] = x.Meta4
        })).ToArray();
    }

    private async Task<IReadOnlyList<EntitySourceCandidate>> SearchCachedInstrumentsAsync(SqlConnection connection,EntitySearchRequest request,CancellationToken ct)
    {
        var catalog=await InstrumentCatalogAsync(connection,ct);
        return RankInstrumentCatalog(catalog,request);
    }

    private static IReadOnlyList<EntitySourceCandidate> RankInstrumentCatalog(IReadOnlyList<CachedInstrument> catalog,EntitySearchRequest request)
    {
        var queryForms=PersianEntityNormalizer.LookupForms(request.OriginalText);
        var queryCompacts=queryForms.Select(PersianEntityNormalizer.Compact).Where(x=>x.Length>=2).Distinct().ToArray();
        var queryTokens=queryForms.LastOrDefault()?.Split(' ',StringSplitOptions.RemoveEmptyEntries).Where(x=>x.Length>=2).ToHashSet(StringComparer.Ordinal)??[];
        var preferPrimaryInstrument=InstrumentQuerySemantics.PrefersPrimaryInstrument(queryForms);
        return catalog.Select(x=>(Row:x,Rank:x.Rank(queryCompacts,queryTokens,preferPrimaryInstrument)))
            .Where(x=>x.Rank>0)
            .OrderByDescending(x=>x.Rank)
            .ThenBy(x=>x.Row.Candidate.DisplayName,StringComparer.Ordinal)
            .Take(Math.Clamp(request.Limit,1,120))
            .Select(x=>x.Row.Candidate)
            .ToArray();
    }

    private async Task<IReadOnlyList<CachedInstrument>> InstrumentCatalogAsync(SqlConnection connection,CancellationToken ct)
    {
        var cacheKey=InstrumentCatalogCacheKey();
        if(cache.TryGetValue(cacheKey,out IReadOnlyList<CachedInstrument>? hit)&&hit is not null) return hit;
        await CatalogLock.WaitAsync(ct);
        try
        {
            if(cache.TryGetValue(cacheKey,out hit)&&hit is not null) return hit;
            const string sql="""
                SELECT
                    CASE WHEN EXISTS (SELECT 1 FROM dbo.IndexLastLive ix WHERE ix.Instrumentid=i.InstrumentID) THEN 2 ELSE 1 END AS Kind,
                    CONVERT(nvarchar(128),i.InstrumentID) AS CanonicalId,
                    COALESCE(NULLIF(i.LVal30,N''),NULLIF(i.LVal18AFC,N''),CONVERT(nvarchar(128),i.InstrumentID)) AS DisplayName,
                    i.LVal18AFC AS Symbol,
                    CONVERT(nvarchar(128),i.InstrumentID) AS InstrumentId,
                    TRY_CONVERT(bigint,i.InsCode) AS InsCode,
                    i.CIsin AS Isin,
                    i.LVal30 AS Alias1,
                    i.CSocCSAC AS Alias2,
                    i.LSoc30 AS Alias3,
                    i.marketcatery AS Meta1,
                    CONVERT(nvarchar(64),i.MarketCateryId) AS Meta2,
                    CONVERT(nvarchar(64),i.Industryid) AS Meta3,
                    CONVERT(nvarchar(16),i.Valid) AS Meta4
                FROM dbo.Instrument i
                UNION ALL
                SELECT
                    1 AS Kind,
                    CONVERT(nvarchar(128),c.Instrumentid) AS CanonicalId,
                    COALESCE(NULLIF(c.Companynamepersian,N''),NULLIF(c.Instrumentname,N''),CONVERT(nvarchar(128),c.Instrumentid)) AS DisplayName,
                    c.Instrumentname AS Symbol,
                    CONVERT(nvarchar(128),c.Instrumentid) AS InstrumentId,
                    CAST(NULL AS bigint) AS InsCode,
                    CONVERT(nvarchar(128),c.Instrumentid) AS Isin,
                    c.Companynamepersian AS Alias1,
                    c.Instrumentname AS Alias2,
                    CAST(NULL AS nvarchar(255)) AS Alias3,
                    c.Marketname AS Meta1,
                    c.Markettypeid AS Meta2,
                    CONVERT(nvarchar(64),c.Industryid) AS Meta3,
                    N'1' AS Meta4
                FROM dbo.Cashmarket c
                WHERE NOT EXISTS(SELECT 1 FROM dbo.Instrument i WHERE i.InstrumentID=c.Instrumentid);
                """;
            var rows=(await connection.QueryAsync<CandidateRow>(new CommandDefinition(sql,cancellationToken:ct,commandTimeout:30))).AsList();
            hit=rows.Select(x=>new CachedInstrument(x.ToCandidate(new Dictionary<string,string?>
            {
                ["marketCategory"]=x.Meta1,
                ["marketCategoryId"]=x.Meta2,
                ["industryId"]=x.Meta3,
                ["valid"]=x.Meta4
            }))).ToArray();
            cache.Set(cacheKey,hit,new MemoryCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow=TimeSpan.FromMinutes(30),
                SlidingExpiration=TimeSpan.FromMinutes(10)
            });
            return hit;
        }
        finally { CatalogLock.Release(); }
    }

    private string InstrumentCatalogCacheKey()
        =>$"sql-ai:instrument-catalog:{ConnectionString!.GetHashCode(StringComparison.Ordinal)}";

    private static async Task<IReadOnlyList<EntitySourceCandidate>> SearchCompaniesAsync(SqlConnection connection, EntitySearchRequest request, CancellationToken ct)
    {
        var title = CompactSql("c.Title");
        var sql = $"""
            SELECT TOP (@Limit)
                3 AS Kind,
                CONVERT(nvarchar(128),c.Id) AS CanonicalId,
                COALESCE(NULLIF(c.Title,N''),CONVERT(nvarchar(128),c.Id)) AS DisplayName,
                NULL AS Symbol,
                NULL AS InstrumentId,
                NULL AS InsCode,
                NULL AS Isin,
                c.Title AS Alias1,
                NULL AS Alias2,
                NULL AS Alias3,
                CONVERT(nvarchar(128),c.InstrumentId) AS Meta1,
                c.Url AS Meta2,
                c.Ceo AS Meta3
            FROM dbo.Company c
            WHERE CONVERT(nvarchar(128),c.Id)=@Original
               OR (@AllowFuzzy=1 AND {title} LIKE @Like)
            ORDER BY CASE WHEN CONVERT(nvarchar(128),c.Id)=@Original THEN 0 WHEN {title}=@Compact THEN 1 ELSE 2 END;
            """;
        return await QueryAsync(connection, sql, request, row => row.ToCandidate(new Dictionary<string, string?>
        {
            ["sourceInstrumentId"] = row.Meta1,
            ["url"] = row.Meta2,
            ["currentCeoRaw"] = row.Meta3
        }), ct);
    }

    private static async Task<IReadOnlyList<EntitySourceCandidate>> SearchPeopleAsync(SqlConnection connection, EntitySearchRequest request, CancellationToken ct)
    {
        var fullName = CompactSql("p.Fullname");
        var sql = $"""
            SELECT TOP (@Limit)
                4 AS Kind,
                CONCAT(CONVERT(nvarchar(64),p.ContentId),N':',COALESCE(CONVERT(nvarchar(16),p.[Row]),N'0'),N':',COALESCE(CONVERT(nvarchar(16),p.TsePersonCategoryId),N'0')) AS CanonicalId,
                p.Fullname AS DisplayName,
                NULL AS Symbol,
                NULL AS InstrumentId,
                NULL AS InsCode,
                NULL AS Isin,
                p.Fullname AS Alias1,
                NULL AS Alias2,
                NULL AS Alias3,
                p.Role AS Meta1,
                NULL AS Meta2,
                CONVERT(nvarchar(64),p.ContentId) AS Meta3
            FROM dbo.TsePerson p
            WHERE (@AllowFuzzy=1 AND {fullName} LIKE @Like)
            ORDER BY CASE WHEN {fullName}=@Compact THEN 0 ELSE 1 END, p.IsManager DESC, p.IsMaster DESC, p.[Row], p.Fullname;
            """;
        return await QueryAsync(connection, sql, request, row => row.ToCandidate(new Dictionary<string, string?>
        {
            ["role"] = row.Meta1,
            ["contentId"] = row.Meta3
        }), ct);
    }

    private static async Task<IReadOnlyList<EntitySourceCandidate>> SearchRegionHallsAsync(SqlConnection connection, EntitySearchRequest request, CancellationToken ct)
    {
        var name = CompactSql("t.Talar_Name");
        var code = CompactSql("CONVERT(nvarchar(128),t.Talar_Code)");
        var sql = $"""
            SELECT TOP (@Limit)
                5 AS Kind,
                CONVERT(nvarchar(128),t.Id) AS CanonicalId,
                COALESCE(NULLIF(t.Talar_Name,N''),CONVERT(nvarchar(128),t.Id)) AS DisplayName,
                NULL AS Symbol,
                NULL AS InstrumentId,
                NULL AS InsCode,
                NULL AS Isin,
                t.Talar_Name AS Alias1,
                CONVERT(nvarchar(128),t.Talar_Code) AS Alias2,
                NULL AS Alias3,
                CONVERT(nvarchar(128),t.Talar_Code) AS Meta1,
                NULL AS Meta2,
                NULL AS Meta3
            FROM dbo.Talar t
            WHERE CONVERT(nvarchar(128),t.Id)=@Original
               OR CONVERT(nvarchar(128),t.Talar_Code)=@Original
               OR (@AllowFuzzy=1 AND ({name} LIKE @Like OR {code} LIKE @Like))
            ORDER BY CASE WHEN CONVERT(nvarchar(128),t.Id)=@Original OR CONVERT(nvarchar(128),t.Talar_Code)=@Original THEN 0 WHEN {name}=@Compact OR {code}=@Compact THEN 1 ELSE 2 END;
            """;
        return await QueryAsync(connection, sql, request, row => row.ToCandidate(new Dictionary<string, string?>
        {
            ["talarCode"] = row.Meta1
        }), ct);
    }

    private static async Task<IReadOnlyList<EntitySourceCandidate>> SearchFinancialInstitutionsAsync(SqlConnection connection, EntitySearchRequest request, CancellationToken ct)
    {
        var title = CompactSql("n.Title");
        var sql = $"""
            SELECT TOP (@Limit)
                6 AS Kind,
                CONVERT(nvarchar(128),n.Id) AS CanonicalId,
                COALESCE(NULLIF(n.Title,N''),CONVERT(nvarchar(128),n.Id)) AS DisplayName,
                NULL AS Symbol,
                NULL AS InstrumentId,
                NULL AS InsCode,
                NULL AS Isin,
                n.Title AS Alias1,
                nt.Title AS Alias2,
                NULL AS Alias3,
                CONVERT(nvarchar(128),n.Nahad_Mali_Type_Id) AS Meta1,
                nt.Title AS Meta2,
                CONVERT(nvarchar(128),n.Talar_Id) AS Meta3
            FROM dbo.Nahad_Mali n
            LEFT JOIN dbo.Nahad_Mali_Type nt ON nt.Id=n.Nahad_Mali_Type_Id
            WHERE CONVERT(nvarchar(128),n.Id)=@Original
               OR (@AllowFuzzy=1 AND {title} LIKE @Like)
            ORDER BY CASE WHEN CONVERT(nvarchar(128),n.Id)=@Original THEN 0 WHEN {title}=@Compact THEN 1 ELSE 2 END, n.Title;
            """;
        return await QueryAsync(connection, sql, request, row => row.ToCandidate(new Dictionary<string, string?>
        {
            ["institutionTypeId"] = row.Meta1,
            ["institutionType"] = row.Meta2,
            ["talarId"] = row.Meta3
        }), ct);
    }

    private static async Task<IReadOnlyList<EntitySourceCandidate>> QueryAsync(
        SqlConnection connection, string sql, EntitySearchRequest request,
        Func<CandidateRow, EntitySourceCandidate> map, CancellationToken ct)
    {
        var rows = await connection.QueryAsync<CandidateRow>(new CommandDefinition(sql, Params(request), cancellationToken: ct, commandTimeout: 15));
        return rows.Select(map).ToArray();
    }

    private static object Params(EntitySearchRequest request) => Params(request, request.CompactText.Length >= 2);

    private static object Params(EntitySearchRequest request, bool allowFuzzy)
    {
        var tokens=PersianEntityNormalizer.LookupForms(request.OriginalText).LastOrDefault()?.Split(' ',StringSplitOptions.RemoveEmptyEntries)
            .Where(x=>x.Length>=2).Distinct(StringComparer.Ordinal).Take(4).ToArray()??[];
        string? Token(int index)=>index<tokens.Length?$"%{PersianEntityNormalizer.Compact(tokens[index])}%":null;
        return new
        {
            Original=request.OriginalText,
            Compact=request.CompactText,
            Like=$"%{request.CompactText}%",
            AllowFuzzy=allowFuzzy?1:0,
            HasTokens=tokens.Length>=2?1:0,
            TokenLike1=Token(0),
            TokenLike2=Token(1),
            TokenLike3=Token(2),
            TokenLike4=Token(3),
            Limit=Math.Clamp(request.Limit,1,120)
        };
    }

    private static string CompactSql(string expression) =>
        $"REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(LOWER(ISNULL(CONVERT(nvarchar(4000),{expression}),N'')),N'ي',N'ی'),N'ى',N'ی'),N'ك',N'ک'),NCHAR(8204),N''),NCHAR(160),N''),N' ',N''),N'-',N''),N'_',N''),N'.',N''),N'/',N'')";

    private sealed class CandidateRow
    {
        public int Kind { get; set; }
        public string? CanonicalId { get; set; }
        public string? DisplayName { get; set; }
        public string? Symbol { get; set; }
        public string? InstrumentId { get; set; }
        public long? InsCode { get; set; }
        public string? Isin { get; set; }
        public string? Alias1 { get; set; }
        public string? Alias2 { get; set; }
        public string? Alias3 { get; set; }
        public string? Meta1 { get; set; }
        public string? Meta2 { get; set; }
        public string? Meta3 { get; set; }
        public string? Meta4 { get; set; }

        public EntitySourceCandidate ToCandidate(IReadOnlyDictionary<string, string?> metadata)
        {
            var aliases = new[] { Alias1, Alias2, Alias3 }
                .Where(x => !string.IsNullOrWhiteSpace(x))
                .Select(x => x!.Trim())
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToArray();
            return new((EntityKind)Kind, CanonicalId ?? string.Empty, DisplayName ?? CanonicalId ?? string.Empty,
                Symbol, InstrumentId, InsCode, Isin, aliases, metadata);
        }
    }

    private sealed class CachedInstrument
    {
        public CachedInstrument(EntitySourceCandidate candidate)
        {
            Candidate=candidate;
            var values=new[]{candidate.CanonicalId,candidate.InstrumentId,candidate.InsCode?.ToString(),candidate.Isin,candidate.Symbol,candidate.DisplayName}
                .Concat(candidate.Aliases)
                .Where(x=>!string.IsNullOrWhiteSpace(x))
                .Select(PersianEntityNormalizer.Normalize)
                .Distinct(StringComparer.Ordinal)
                .ToArray();
            Compacts=values.Select(PersianEntityNormalizer.Compact).Where(x=>x.Length>=2).Distinct(StringComparer.Ordinal).ToArray();
            TokenSets=values.Select(x=>x.Split(' ',StringSplitOptions.RemoveEmptyEntries).Where(t=>t.Length>=2).ToHashSet(StringComparer.Ordinal)).ToArray();
        }

        public EntitySourceCandidate Candidate { get; }
        private string[] Compacts { get; }
        private HashSet<string>[] TokenSets { get; }

        public int Rank(IReadOnlyList<string> queryCompacts,IReadOnlySet<string> queryTokens,bool preferPrimaryInstrument)
        {
            var best=0;
            foreach(var query in queryCompacts)
            foreach(var value in Compacts)
            {
                if(value==query) best=Math.Max(best,10000+value.Length);
                else if(query.Length>=3&&value.StartsWith(query,StringComparison.Ordinal)) best=Math.Max(best,8000+query.Length);
                else if(query.Length>=3&&value.Contains(query,StringComparison.Ordinal)) best=Math.Max(best,7000+query.Length);
                else if(value.Length>=3&&query.Contains(value,StringComparison.Ordinal)) best=Math.Max(best,6500+value.Length);
            }
            if(queryTokens.Count>=2&&TokenSets.Any(tokens=>queryTokens.All(tokens.Contains)))
                best=Math.Max(best,6000+queryTokens.Count*100);
            if(queryTokens.Count>=2)
            {
                foreach(var tokens in TokenSets)
                {
                    var shared=queryTokens.Count(tokens.Contains);
                    if(shared<2) continue;
                    var candidateCoverage=shared/(double)Math.Max(tokens.Count,1);
                    best=Math.Max(best,4200+shared*200+(int)Math.Round(candidateCoverage*400));
                }
            }
            if(best>0&&preferPrimaryInstrument)
            {
                if(Candidate.Metadata.TryGetValue("valid",out var valid)&&valid=="1") best+=1000;
                if(Candidate.Metadata.TryGetValue("marketCategory",out var category)&&string.Equals(category,"cash",StringComparison.OrdinalIgnoreCase)) best+=500;
                if(Candidate.InstrumentId?.EndsWith("0001",StringComparison.OrdinalIgnoreCase)==true) best+=2500;
                if(!string.IsNullOrWhiteSpace(Candidate.Symbol)&&!Candidate.Symbol.Any(char.IsDigit)&&!Candidate.Symbol.EndsWith("ح",StringComparison.Ordinal)) best+=500;
            }
            return best;
        }
    }
}
