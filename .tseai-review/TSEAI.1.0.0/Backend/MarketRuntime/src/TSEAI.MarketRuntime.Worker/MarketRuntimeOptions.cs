namespace TSEAI.MarketRuntime.Worker;
public sealed class MarketRuntimeOptions
{
    public bool Enabled { get; set; } = true;
    public int PollIntervalMilliseconds { get; set; } = 1000;
    public int InstrumentRefreshMinutes { get; set; } = 30;
    public int InstrumentRetrySeconds { get; set; } = 60;
    public int CommandTimeoutSeconds { get; set; } = 30;
    public bool UseWatermark { get; set; } = true;
    public int FullReconciliationSeconds { get; set; } = 60;
    public int MinimumCurrentSnapshotRows { get; set; } = 1;
    public int MinimumOrderBookSnapshotRows { get; set; } = 1;
    public int MinimumReconciliationCoveragePercent { get; set; } = 50;
    public string InstrumentSql { get; set; } = DefaultMarketQueries.Instruments;
    public string CurrentStateSql { get; set; } = DefaultMarketQueries.CurrentState;
    public string ClientTypeSql { get; set; } = DefaultMarketQueries.ClientTypes;
    public string OrderBookSql { get; set; } = DefaultMarketQueries.OrderBook;
}
