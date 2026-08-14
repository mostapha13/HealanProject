using Dapper;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Configuration;
using TSEAI.Application.Data.Canonical;

namespace TSEAI.Infrastructure.Data.Canonical;

public sealed class SqlAiCanonicalDataGateway(IConfiguration configuration) : ICanonicalDataGateway
{
    private const string Schema = "dbo";

    private string? ConnectionString => configuration.GetConnectionString("SqlAi");

    private CanonicalMoneyUnit CashMarketMoneyUnit
    {
        get
        {
            var value = configuration["SqlAi:CashMarketMoneyUnit"];
            return Enum.TryParse<CanonicalMoneyUnit>(value, true, out var unit)
                ? unit
                : CanonicalMoneyUnit.Irr;
        }
    }

    private SqlConnection CreateConnection()
    {
        var raw = ConnectionString;
        if (string.IsNullOrWhiteSpace(raw))
            throw new InvalidOperationException("ConnectionStrings:SqlAi is not configured.");

        var builder = new SqlConnectionStringBuilder(raw);
        return new SqlConnection(builder.ConnectionString);
    }

    public async Task<CanonicalDataStatus> GetStatusAsync(CancellationToken ct)
    {
        var raw = ConnectionString;
        if (string.IsNullOrWhiteSpace(raw))
            return new CanonicalDataStatus(false, "", CanonicalSourceCatalog.All
                .Select(x => new CanonicalSourceTableStatus(x.Code, x.TableName, false, null, null, "SqlAi connection is not configured."))
                .ToArray());

        await using var connection = CreateConnection();
        await connection.OpenAsync(ct);
        var results = new List<CanonicalSourceTableStatus>(CanonicalSourceCatalog.All.Count);

        foreach (var source in CanonicalSourceCatalog.All)
        {
            try
            {
                var exists = await connection.ExecuteScalarAsync<int>(new CommandDefinition(
                    "SELECT CASE WHEN OBJECT_ID(@FullName, 'U') IS NULL THEN 0 ELSE 1 END",
                    new { FullName = $"{Schema}.{source.TableName}" }, cancellationToken: ct));

                if (exists == 0)
                {
                    results.Add(new(source.Code, source.TableName, false, null, null,
                        source.RequiredForPhase1 ? "Required Phase 1 table is missing." : "Optional table is not present."));
                    continue;
                }

                var hasStamp = await connection.ExecuteScalarAsync<int>(new CommandDefinition(
                    """
                    SELECT CASE WHEN EXISTS
                    (
                        SELECT 1 FROM sys.columns
                        WHERE object_id = OBJECT_ID(@FullName) AND name = 'SourceCollectedAt'
                    ) THEN 1 ELSE 0 END
                    """,
                    new { FullName = $"{Schema}.{source.TableName}" }, cancellationToken: ct));

                var safeTable = Quote(source.TableName);
                var rowCount = await connection.ExecuteScalarAsync<long>(new CommandDefinition(
                    $"SELECT COUNT_BIG(1) FROM [{Schema}].{safeTable}", cancellationToken: ct, commandTimeout: 20));
                DateTime? latest = null;
                if (hasStamp == 1)
                    latest = await connection.ExecuteScalarAsync<DateTime?>(new CommandDefinition(
                        $"SELECT MAX(SourceCollectedAt) FROM [{Schema}].{safeTable}", cancellationToken: ct, commandTimeout: 20));

                results.Add(new(source.Code, source.TableName, true, rowCount, latest));
            }
            catch (Exception ex)
            {
                results.Add(new(source.Code, source.TableName, true, null, null, ex.GetType().Name));
            }
        }

        return new CanonicalDataStatus(true, connection.Database, results);
    }

    public async Task<CanonicalInstrument?> FindInstrumentAsync(string instrumentIdOrInsCodeOrSymbol, CancellationToken ct)
    {
        var key = NormalizeRequiredKey(instrumentIdOrInsCodeOrSymbol);
        const string sql = """
            SELECT TOP (1)
                InstrumentID, InsCode, CIsin, LVal18AFC, LVal30, CValMne, LVal18, CSocCSAC, LSoc30,
                marketcatery AS marketcategory, MarketCateryId AS MarketCategoryId,
                Industryid, Industrysubid, QNmVlo, ZTitad, BaseVol,
                PSaiSMinOkValMdv, PSaiSMaxOkValMdv, QtitMinSaiOmProd, QtitMaxSaiOmProd,
                DInMar, DEVen, Flow, YVal, YMarNSC, Valid, SourceCollectedAt
            FROM dbo.Instrument
            WHERE InstrumentID = @Key
               OR CONVERT(nvarchar(64), InsCode) = @Key
               OR LVal18AFC = @Key
               OR CSocCSAC = @Key
               OR LVal30 = @Key
            ORDER BY Valid DESC,
                CASE WHEN marketcatery=N'cash' AND InstrumentID LIKE N'%0001' THEN 0 ELSE 1 END,
                CASE
                WHEN InstrumentID = @Key THEN 0
                WHEN LVal18AFC = @Key THEN 1
                WHEN CSocCSAC = @Key THEN 2
                WHEN CONVERT(nvarchar(64), InsCode) = @Key THEN 3
                ELSE 4 END,
                SourceCollectedAt DESC;
            """;

        await using var connection = CreateConnection();
        var row = await connection.QueryFirstOrDefaultAsync<InstrumentLandingRow>(
            new CommandDefinition(sql, new { Key = key }, cancellationToken: ct, commandTimeout: 10));
        return row is null ? null : Map(row);
    }

    public async Task<CanonicalCashMarketSnapshot?> GetCashMarketAsync(string instrumentId, CancellationToken ct)
    {
        var key = NormalizeRequiredKey(instrumentId);
        const string sql = """
            SELECT TOP (1)
                Instrumentid, Instrumentname, Companynamepersian,
                Tradevolume, Tradevalue, Tradecount, Highvalue, Lowvalue, MinValue, MaxValue,
                Firstprice, Lastprice, Lastpricechange, Lastpricechangepercent,
                Closingprice, Closingpricechange, Closingpricechangepercent, YesterdayPrice,
                Effectonindex, Pe, Eps, Marketvalue,
                Sellprice, Sellquantity, Sellcount, Buyprice, Buyquantity, Buycount,
                Marketid, Marketname, Markettypeid, Markettypename, Boardid, Boardname,
                Industryid, Industryname, Industrysubid, Industrysubname,
                Stateid, Statename, SourceCollectedAt
            FROM dbo.Cashmarket
            WHERE Instrumentid = @InstrumentId
            ORDER BY SourceCollectedAt DESC;
            """;

        await using var connection = CreateConnection();
        var row = await connection.QueryFirstOrDefaultAsync<CashMarketLandingRow>(
            new CommandDefinition(sql, new { InstrumentId = key }, cancellationToken: ct, commandTimeout: 10));
        return row is null ? null : Map(row, CashMarketMoneyUnit);
    }

    public async Task<IReadOnlyList<CanonicalOrderBookLevel>> GetOrderBookAsync(string instrumentId, CancellationToken ct)
    {
        var key = NormalizeRequiredKey(instrumentId);
        const string sql = """
            SELECT InstrumentID, InsCode, [Level], BuyPrice, BuyQuantity, BuyCount,
                   SellPrice, SellQuantity, SellCount, BestLimitCounter, OrderBookUpdatedAt, SourceCollectedAt
            FROM dbo.OrderBookCurrent
            WHERE InstrumentID = @InstrumentId
            ORDER BY [Level];
            """;

        await using var connection = CreateConnection();
        var rows = await connection.QueryAsync<OrderBookLandingRow>(
            new CommandDefinition(sql, new { InstrumentId = key }, cancellationToken: ct, commandTimeout: 10));
        return rows.Select(x => Map(x, CashMarketMoneyUnit)).ToArray();
    }

    public async Task<CanonicalClientTypeSnapshot?> GetClientTypeAsync(string instrumentId, CancellationToken ct)
    {
        var key = NormalizeRequiredKey(instrumentId);
        const string sql = """
            SELECT TOP (1)
                ct.InsCode, ct.Buy_CountI, ct.Buy_CountN, ct.Buy_I_Volume, ct.Buy_N_Volume,
                ct.Sell_CountI, ct.Sell_CountN, ct.Sell_I_Volume, ct.Sell_N_Volume,
                ct.ClientType_counter, ct.creationTime, ct.SourceCollectedAt
            FROM dbo.ClientType ct
            INNER JOIN dbo.Instrument i ON i.InsCode = ct.InsCode
            WHERE i.InstrumentID = @InstrumentId
            ORDER BY ct.creationTime DESC, ct.ClientType_counter DESC, ct.Id DESC;
            """;

        await using var connection = CreateConnection();
        var row = await connection.QueryFirstOrDefaultAsync<ClientTypeLandingRow>(
            new CommandDefinition(sql, new { InstrumentId = key }, cancellationToken: ct, commandTimeout: 10));
        return row is null ? null : Map(row);
    }

    public async Task<IReadOnlyList<CanonicalMarketSummaryRow>> GetMarketSummaryAsync(int? marketId, CancellationToken ct)
    {
        const string sql = """
            SELECT Marketcatery AS Marketcategory, Marketid, Marketname, Marketvalue,
                   Tradecount, Tradevolume, Tradevalue, SourceCollectedAt
            FROM dbo.Marketsummary
            WHERE @MarketId IS NULL OR Marketid = @MarketId
            ORDER BY Marketid, Marketcatery;
            """;

        await using var connection = CreateConnection();
        var rows = await connection.QueryAsync<MarketSummaryLandingRow>(
            new CommandDefinition(sql, new { MarketId = marketId }, cancellationToken: ct, commandTimeout: 10));
        return rows.Select(x => Map(x, CashMarketMoneyUnit)).ToArray();
    }

    public async Task<IReadOnlyList<CanonicalMarketIndex>> GetMarketIndexesAsync(int? marketId, CancellationToken ct)
    {
        const string sql = """
            SELECT Instrumentid, Indexvalue, Highprice, Lowprice, Tradecount, Changepercent, [Datetime],
                   Negativeinstrument, Positiveinstrument, Unchangedinstrument, Notradeinstrument,
                   Reserveinstrument, Suspendinstrument, Totalinstrument, Changeprice,
                   Marketid, Marketname, SourceCollectedAt
            FROM dbo.IndexLastLive
            WHERE @MarketId IS NULL OR Marketid = @MarketId
            ORDER BY Marketid, Instrumentid;
            """;

        await using var connection = CreateConnection();
        var rows = await connection.QueryAsync<IndexLandingRow>(
            new CommandDefinition(sql, new { MarketId = marketId }, cancellationToken: ct, commandTimeout: 10));
        return rows.Select(Map).ToArray();
    }

    private static CanonicalInstrument Map(InstrumentLandingRow x) => new(
        x.InstrumentID ?? "",
        x.InsCode,
        x.CIsin,
        x.LVal18AFC,
        x.LVal30,
        x.CValMne,
        x.LVal18,
        x.CSocCSAC,
        x.LSoc30,
        x.marketcategory,
        ToNullableInt(x.MarketCategoryId),
        ToNullableInt(x.Industryid),
        ToNullableInt(x.Industrysubid),
        x.QNmVlo,
        x.ZTitad,
        x.BaseVol,
        x.PSaiSMinOkValMdv,
        x.PSaiSMaxOkValMdv,
        ToNullableLong(x.QtitMinSaiOmProd),
        ToNullableLong(x.QtitMaxSaiOmProd),
        ToNullableInt(x.DInMar),
        ToNullableInt(x.DEVen),
        ToNullableInt(x.Flow),
        ToNullableInt(x.YVal),
        x.YMarNSC,
        ToNullableInt(x.Valid),
        x.SourceCollectedAt);

    private static CanonicalCashMarketSnapshot Map(CashMarketLandingRow x, CanonicalMoneyUnit unit) => new(
        x.Instrumentid ?? "", x.Instrumentname, x.Companynamepersian,
        ToLong(x.Tradevolume), CanonicalMoneyNormalizer.ToIrr(x.Tradevalue, unit) ?? 0m, ToLong(x.Tradecount),
        CanonicalMoneyNormalizer.ToIrr(x.Highvalue, unit), CanonicalMoneyNormalizer.ToIrr(x.Lowvalue, unit),
        CanonicalMoneyNormalizer.ToIrr(x.MinValue, unit), CanonicalMoneyNormalizer.ToIrr(x.MaxValue, unit),
        CanonicalMoneyNormalizer.ToIrr(x.Firstprice, unit), CanonicalMoneyNormalizer.ToIrr(x.Lastprice, unit),
        CanonicalMoneyNormalizer.ToIrr(x.Lastpricechange, unit), x.Lastpricechangepercent,
        CanonicalMoneyNormalizer.ToIrr(x.Closingprice, unit), CanonicalMoneyNormalizer.ToIrr(x.Closingpricechange, unit),
        x.Closingpricechangepercent, CanonicalMoneyNormalizer.ToIrr(x.YesterdayPrice, unit),
        x.Effectonindex, x.Pe, x.Eps, CanonicalMoneyNormalizer.ToIrr(x.Marketvalue, unit),
        CanonicalMoneyNormalizer.ToIrr(x.Sellprice, unit), ToNullableLong(x.Sellquantity), ToNullableLong(x.Sellcount),
        CanonicalMoneyNormalizer.ToIrr(x.Buyprice, unit), ToNullableLong(x.Buyquantity), ToNullableLong(x.Buycount),
        ToNullableInt(x.Marketid), x.Marketname, x.Markettypeid, x.Markettypename,
        ToNullableInt(x.Boardid), x.Boardname, ToNullableInt(x.Industryid), x.Industryname,
        ToNullableInt(x.Industrysubid), x.Industrysubname, x.Stateid, x.Statename, x.SourceCollectedAt);

    private static CanonicalOrderBookLevel Map(OrderBookLandingRow x, CanonicalMoneyUnit unit) => new(
        x.InstrumentID ?? "", x.InsCode, ToInt(x.Level),
        CanonicalMoneyNormalizer.ToIrr(x.BuyPrice, unit), ToLong(x.BuyQuantity), ToLong(x.BuyCount),
        CanonicalMoneyNormalizer.ToIrr(x.SellPrice, unit), ToLong(x.SellQuantity), ToLong(x.SellCount),
        ToNullableLong(x.BestLimitCounter), x.OrderBookUpdatedAt, x.SourceCollectedAt);

    private static CanonicalClientTypeSnapshot Map(ClientTypeLandingRow x) => new(
        x.InsCode, ToLong(x.Buy_CountI), ToLong(x.Buy_CountN), ToLong(x.Buy_I_Volume), ToLong(x.Buy_N_Volume),
        ToLong(x.Sell_CountI), ToLong(x.Sell_CountN), ToLong(x.Sell_I_Volume), ToLong(x.Sell_N_Volume),
        ToNullableLong(x.ClientType_counter), x.creationTime, x.SourceCollectedAt);

    private static CanonicalMarketSummaryRow Map(MarketSummaryLandingRow x, CanonicalMoneyUnit unit) => new(
        x.Marketcategory ?? "", ToInt(x.Marketid), x.Marketname,
        CanonicalMoneyNormalizer.ToIrr(x.Marketvalue, unit), ToLong(x.Tradecount), ToLong(x.Tradevolume),
        CanonicalMoneyNormalizer.ToIrr(x.Tradevalue, unit), x.SourceCollectedAt);

    private static CanonicalMarketIndex Map(IndexLandingRow x) => new(
        x.Instrumentid ?? "", x.Indexvalue, x.Highprice, x.Lowprice, ToLong(x.Tradecount), x.Changepercent, x.Changeprice,
        x.Datetime, ToLong(x.Negativeinstrument), ToLong(x.Positiveinstrument), ToLong(x.Unchangedinstrument),
        ToLong(x.Notradeinstrument), ToLong(x.Reserveinstrument), ToLong(x.Suspendinstrument), ToLong(x.Totalinstrument),
        ToInt(x.Marketid), x.Marketname, x.SourceCollectedAt);

    private static string NormalizeRequiredKey(string value)
    {
        value = (value ?? "").Trim();
        if (value.Length == 0 || value.Length > 128) throw new ArgumentException("Invalid canonical lookup key.", nameof(value));
        return value;
    }

    private static string Quote(string identifier)
    {
        if (identifier.Length == 0 || identifier.Any(c => !(char.IsLetterOrDigit(c) || c == '_')))
            throw new InvalidOperationException("Unsafe static source identifier.");
        return $"[{identifier}]";
    }

    private static long ToLong(decimal? value) => value is null ? 0 : decimal.ToInt64(decimal.Truncate(value.Value));
    private static long? ToNullableLong(decimal? value) => value is null ? null : decimal.ToInt64(decimal.Truncate(value.Value));
    private static int ToInt(decimal? value) => value is null ? 0 : decimal.ToInt32(decimal.Truncate(value.Value));
    private static int? ToNullableInt(decimal? value) => value is null ? null : decimal.ToInt32(decimal.Truncate(value.Value));

    private sealed class InstrumentLandingRow
    {
        public string? InstrumentID { get; set; }
        public long InsCode { get; set; }
        public string? CIsin { get; set; }
        public string? LVal18AFC { get; set; }
        public string? LVal30 { get; set; }
        public string? CValMne { get; set; }
        public string? LVal18 { get; set; }
        public string? CSocCSAC { get; set; }
        public string? LSoc30 { get; set; }
        public string? marketcategory { get; set; }
        public decimal? MarketCategoryId { get; set; }
        public decimal? Industryid { get; set; }
        public decimal? Industrysubid { get; set; }
        public decimal? QNmVlo { get; set; }
        public decimal? ZTitad { get; set; }
        public decimal? BaseVol { get; set; }
        public decimal? PSaiSMinOkValMdv { get; set; }
        public decimal? PSaiSMaxOkValMdv { get; set; }
        public decimal? QtitMinSaiOmProd { get; set; }
        public decimal? QtitMaxSaiOmProd { get; set; }
        public decimal? DInMar { get; set; }
        public decimal? DEVen { get; set; }
        public decimal? Flow { get; set; }
        public decimal? YVal { get; set; }
        public string? YMarNSC { get; set; }
        public decimal? Valid { get; set; }
        public DateTime? SourceCollectedAt { get; set; }
    }

    private sealed class CashMarketLandingRow
    {
        public string? Instrumentid { get; set; }
        public string? Instrumentname { get; set; }
        public string? Companynamepersian { get; set; }
        public decimal? Tradevolume { get; set; }
        public decimal? Tradevalue { get; set; }
        public decimal? Tradecount { get; set; }
        public decimal? Highvalue { get; set; }
        public decimal? Lowvalue { get; set; }
        public decimal? MinValue { get; set; }
        public decimal? MaxValue { get; set; }
        public decimal? Firstprice { get; set; }
        public decimal? Lastprice { get; set; }
        public decimal? Lastpricechange { get; set; }
        public decimal? Lastpricechangepercent { get; set; }
        public decimal? Closingprice { get; set; }
        public decimal? Closingpricechange { get; set; }
        public decimal? Closingpricechangepercent { get; set; }
        public decimal? YesterdayPrice { get; set; }
        public decimal? Effectonindex { get; set; }
        public decimal? Pe { get; set; }
        public decimal? Eps { get; set; }
        public decimal? Marketvalue { get; set; }
        public decimal? Sellprice { get; set; }
        public decimal? Sellquantity { get; set; }
        public decimal? Sellcount { get; set; }
        public decimal? Buyprice { get; set; }
        public decimal? Buyquantity { get; set; }
        public decimal? Buycount { get; set; }
        public decimal? Marketid { get; set; }
        public string? Marketname { get; set; }
        public string? Markettypeid { get; set; }
        public string? Markettypename { get; set; }
        public decimal? Boardid { get; set; }
        public string? Boardname { get; set; }
        public decimal? Industryid { get; set; }
        public string? Industryname { get; set; }
        public decimal? Industrysubid { get; set; }
        public string? Industrysubname { get; set; }
        public string? Stateid { get; set; }
        public string? Statename { get; set; }
        public DateTime? SourceCollectedAt { get; set; }
    }

    private sealed class OrderBookLandingRow
    {
        public string? InstrumentID { get; set; }
        public long InsCode { get; set; }
        public decimal? Level { get; set; }
        public decimal? BuyPrice { get; set; }
        public decimal? BuyQuantity { get; set; }
        public decimal? BuyCount { get; set; }
        public decimal? SellPrice { get; set; }
        public decimal? SellQuantity { get; set; }
        public decimal? SellCount { get; set; }
        public decimal? BestLimitCounter { get; set; }
        public DateTime? OrderBookUpdatedAt { get; set; }
        public DateTime? SourceCollectedAt { get; set; }
    }

    private sealed class ClientTypeLandingRow
    {
        public long InsCode { get; set; }
        public decimal? Buy_CountI { get; set; }
        public decimal? Buy_CountN { get; set; }
        public decimal? Buy_I_Volume { get; set; }
        public decimal? Buy_N_Volume { get; set; }
        public decimal? Sell_CountI { get; set; }
        public decimal? Sell_CountN { get; set; }
        public decimal? Sell_I_Volume { get; set; }
        public decimal? Sell_N_Volume { get; set; }
        public decimal? ClientType_counter { get; set; }
        public DateTime? creationTime { get; set; }
        public DateTime? SourceCollectedAt { get; set; }
    }

    private sealed class MarketSummaryLandingRow
    {
        public string? Marketcategory { get; set; }
        public decimal? Marketid { get; set; }
        public string? Marketname { get; set; }
        public decimal? Marketvalue { get; set; }
        public decimal? Tradecount { get; set; }
        public decimal? Tradevolume { get; set; }
        public decimal? Tradevalue { get; set; }
        public DateTime? SourceCollectedAt { get; set; }
    }

    private sealed class IndexLandingRow
    {
        public string? Instrumentid { get; set; }
        public decimal? Indexvalue { get; set; }
        public decimal? Highprice { get; set; }
        public decimal? Lowprice { get; set; }
        public decimal? Tradecount { get; set; }
        public decimal? Changepercent { get; set; }
        public DateTime? Datetime { get; set; }
        public decimal? Negativeinstrument { get; set; }
        public decimal? Positiveinstrument { get; set; }
        public decimal? Unchangedinstrument { get; set; }
        public decimal? Notradeinstrument { get; set; }
        public decimal? Reserveinstrument { get; set; }
        public decimal? Suspendinstrument { get; set; }
        public decimal? Totalinstrument { get; set; }
        public decimal? Changeprice { get; set; }
        public decimal? Marketid { get; set; }
        public string? Marketname { get; set; }
        public DateTime? SourceCollectedAt { get; set; }
    }
}
