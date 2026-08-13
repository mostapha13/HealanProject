using Dapper;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Options;
using TSEAI.Shared.Application.Market;

namespace TSEAI.MarketRuntime.Worker;

public sealed class MarketDbReader(IConfiguration cfg, IOptions<MarketRuntimeOptions> options)
{
    private readonly MarketRuntimeOptions _options = options.Value;
    private static readonly DateTime SqlDateTimeMinimum = new(1753, 1, 1);

    private SqlConnection CreateConnection()
    {
        var raw = cfg.GetConnectionString("MarketDb") ?? throw new InvalidOperationException("MarketDb connection missing");
        var builder = new SqlConnectionStringBuilder(raw) { ApplicationIntent = ApplicationIntent.ReadOnly };
        return new SqlConnection(builder.ConnectionString);
    }

    public async Task<IReadOnlyList<InstrumentReference>> ReadInstruments(CancellationToken ct)
    {
        await using var connection = CreateConnection();
        var sql = string.IsNullOrWhiteSpace(_options.InstrumentSql) ? DefaultMarketQueries.Instruments : _options.InstrumentSql;
        return (await connection.QueryAsync<InstrumentReference>(new CommandDefinition(sql, cancellationToken: ct, commandTimeout: 30))).AsList();
    }

    public async Task<IReadOnlyList<CurrentMarketRow>> ReadCurrent(DateTime? watermark, CancellationToken ct)
    {
        await using var connection = CreateConnection();
        var sql = string.IsNullOrWhiteSpace(_options.CurrentStateSql) ? DefaultMarketQueries.CurrentState : _options.CurrentStateSql;
        return (await connection.QueryAsync<CurrentMarketRow>(new CommandDefinition(sql, new { Watermark = watermark ?? SqlDateTimeMinimum }, cancellationToken: ct, commandTimeout: 30))).AsList();
    }

    public async Task<IReadOnlyList<ClientTypeRow>> ReadClientTypes(DateTime? watermark, CancellationToken ct)
    {
        await using var connection = CreateConnection();
        var sql = string.IsNullOrWhiteSpace(_options.ClientTypeSql) ? DefaultMarketQueries.ClientTypes : _options.ClientTypeSql;
        return (await connection.QueryAsync<ClientTypeRow>(new CommandDefinition(sql, new { Watermark = watermark ?? SqlDateTimeMinimum }, cancellationToken: ct, commandTimeout: 30))).AsList();
    }

    public async Task<IReadOnlyList<OrderBookRow>> ReadOrderBook(DateTime? watermark, CancellationToken ct)
    {
        await using var connection = CreateConnection();
        var sql = string.IsNullOrWhiteSpace(_options.OrderBookSql) ? DefaultMarketQueries.OrderBook : _options.OrderBookSql;
        return (await connection.QueryAsync<OrderBookRow>(new CommandDefinition(sql, new { Watermark = watermark ?? SqlDateTimeMinimum }, cancellationToken: ct, commandTimeout: 30))).AsList();
    }
}
