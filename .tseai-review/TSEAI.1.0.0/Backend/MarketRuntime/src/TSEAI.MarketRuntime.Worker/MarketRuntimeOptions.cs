namespace TSEAI.MarketRuntime.Worker;
public sealed class MarketRuntimeOptions
{
    public bool Enabled { get; set; } = true;
    public int PollIntervalMilliseconds { get; set; } = 1000;
    public int InstrumentRefreshMinutes { get; set; } = 30;
    public bool UseWatermark { get; set; } = true;
    public string InstrumentSql { get; set; } = DefaultMarketQueries.Instruments;
    public string CurrentStateSql { get; set; } = DefaultMarketQueries.CurrentState;
    public string ClientTypeSql { get; set; } = DefaultMarketQueries.ClientTypes;
    public string OrderBookSql { get; set; } = DefaultMarketQueries.OrderBook;
}
