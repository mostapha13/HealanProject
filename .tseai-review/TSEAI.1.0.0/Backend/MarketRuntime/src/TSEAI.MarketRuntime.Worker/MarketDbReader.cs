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
        var builder = new SqlConnectionStringBuilder(raw);
        return new SqlConnection(builder.ConnectionString);
    }

    public async Task<IReadOnlyList<InstrumentReference>> ReadInstruments(CancellationToken ct)
    {
        var sql = string.IsNullOrWhiteSpace(_options.InstrumentSql) ? DefaultMarketQueries.Instruments : _options.InstrumentSql;
        return await QueryAsync<InstrumentReference>(sql, null, ct);
    }

    public async Task<IReadOnlyList<CurrentMarketRow>> ReadCurrent(DateTime? watermark, CancellationToken ct)
    {
        var sql = string.IsNullOrWhiteSpace(_options.CurrentStateSql) ? DefaultMarketQueries.CurrentState : _options.CurrentStateSql;
        return await QueryAsync<CurrentMarketRow>(sql, new { Watermark = watermark ?? SqlDateTimeMinimum }, ct);
    }

    public async Task<IReadOnlyList<ClientTypeRow>> ReadClientTypes(DateTime? watermark, CancellationToken ct)
    {
        var sql = string.IsNullOrWhiteSpace(_options.ClientTypeSql) ? DefaultMarketQueries.ClientTypes : _options.ClientTypeSql;
        return await QueryAsync<ClientTypeRow>(sql, new { Watermark = watermark ?? SqlDateTimeMinimum }, ct);
    }

    public async Task<IReadOnlyList<OrderBookRow>> ReadOrderBook(DateTime? watermark, CancellationToken ct)
    {
        var sql = string.IsNullOrWhiteSpace(_options.OrderBookSql) ? DefaultMarketQueries.OrderBook : _options.OrderBookSql;
        return await QueryAsync<OrderBookRow>(sql, new { Watermark = watermark ?? SqlDateTimeMinimum }, ct);
    }

    private async Task<IReadOnlyList<T>> QueryAsync<T>(string sql, object? parameters, CancellationToken ct)
    {
        await using var connection = CreateConnection();
        try
        {
            // Opening explicitly keeps connection failures separate from command
            // failures and prevents Dapper from returning a half-open pooled
            // connection after a cancelled/expired reader.
            await connection.OpenAsync(ct);
            var timeout = Math.Clamp(_options.CommandTimeoutSeconds, 5, 300);
            return (await connection.QueryAsync<T>(new CommandDefinition(
                sql, parameters, cancellationToken: ct, commandTimeout: timeout,
                flags: CommandFlags.Buffered))).AsList();
        }
        catch (OperationCanceledException) when (ct.IsCancellationRequested)
        {
            SqlConnection.ClearPool(connection);
            throw;
        }
        catch (Exception exception) when (exception is SqlException or InvalidOperationException or NotSupportedException)
        {
            // A timed-out SqlDataReader may poison its physical pooled
            // connection ("another read operation is pending"). Remove only
            // this pool entry so the next polling cycle starts cleanly.
            SqlConnection.ClearPool(connection);
            throw;
        }
    }
}
