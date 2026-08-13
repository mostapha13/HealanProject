using Dapper;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Configuration;
using TSEAI.Application.Entities;

namespace TSEAI.Infrastructure.Entities;

public sealed class SqlAiEntityCandidateSource(IConfiguration configuration) : IEntityCandidateSource
{
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
        var builder = new SqlConnectionStringBuilder(ConnectionString!) { ApplicationIntent = ApplicationIntent.ReadOnly };
        return new SqlConnection(builder.ConnectionString);
    }

    private static async Task<IReadOnlyList<EntitySourceCandidate>> SearchInstrumentsAsync(SqlConnection connection, EntitySearchRequest request, CancellationToken ct)
    {
        var symbol = CompactSql("i.LVal18AFC");
        var instrumentName = CompactSql("i.LVal30");
        var issuerSymbol = CompactSql("i.CSocCSAC");
        var companyName = CompactSql("i.LSoc30");
        var isin = CompactSql("i.CIsin");
        var sql = $"""
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
                CONVERT(nvarchar(64), i.Industryid) AS Meta3
            FROM dbo.Instrument i
            WHERE i.InstrumentID=@Original
               OR i.InsCode=TRY_CONVERT(bigint,@Compact)
               OR i.CIsin=@Original
               OR i.LVal18AFC=@Original
               OR (@AllowFuzzy=1 AND (
                    {symbol} LIKE @Like OR {instrumentName} LIKE @Like OR {issuerSymbol} LIKE @Like OR
                    {companyName} LIKE @Like OR {isin} LIKE @Like))
            ORDER BY CASE
                WHEN i.InstrumentID=@Original THEN 0
                WHEN i.InsCode=TRY_CONVERT(bigint,@Compact) THEN 1
                WHEN i.CIsin=@Original THEN 2
                WHEN i.LVal18AFC=@Original THEN 3
                WHEN {symbol}=@Compact OR {instrumentName}=@Compact OR {issuerSymbol}=@Compact OR {companyName}=@Compact OR {isin}=@Compact THEN 4
                ELSE 5 END,
                i.SourceCollectedAt DESC;
            """;

        // Keep the indexed exact path separate from normalized contains matching. When both
        // branches share one OR predicate SQL Server scans the full instrument catalog even
        // for an exact symbol/id lookup.
        var rows = (await connection.QueryAsync<CandidateRow>(new CommandDefinition(
            sql, Params(request, allowFuzzy: false), cancellationToken: ct, commandTimeout: 15))).AsList();
        if (rows.Count == 0 && request.CompactText.Length >= 2)
            rows = (await connection.QueryAsync<CandidateRow>(new CommandDefinition(
                sql, Params(request, allowFuzzy: true), cancellationToken: ct, commandTimeout: 15))).AsList();
        return rows.Select(x => x.ToCandidate(new Dictionary<string, string?>
        {
            ["marketCategory"] = x.Meta1,
            ["marketCategoryId"] = x.Meta2,
            ["industryId"] = x.Meta3
        })).ToArray();
    }

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

    private static object Params(EntitySearchRequest request, bool allowFuzzy) => new
    {
        Original = request.OriginalText,
        Compact = request.CompactText,
        Like = $"%{request.CompactText}%",
        AllowFuzzy = allowFuzzy ? 1 : 0,
        Limit = Math.Clamp(request.Limit, 1, 120)
    };

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
}
