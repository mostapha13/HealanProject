namespace TSEAI.Shared.Application.Alerts;

[Flags]
public enum MarketChangeKind
{
    None = 0,
    Current = 1,
    ClientType = 2,
    OrderBook = 4
}

public sealed record MarketSymbolChange(long InsCode, MarketChangeKind Kind);

public sealed record MarketChangedBatch(
    string BatchId,
    int TradingDate,
    DateTime OccurredAtUtc,
    IReadOnlyList<MarketSymbolChange> Changes);

public sealed record AlertTriggeredMessage(
    Guid EventId,
    Guid AlertRuleId,
    Guid SavedFilterId,
    int FilterVersion,
    string OwnerUserId,
    long InsCode,
    string? SymbolCode,
    string Symbol,
    string SymbolName,
    string AlertName,
    string FilterName,
    string TsetmcCode,
    string PersianExplanation,
    string Message,
    decimal LastPrice,
    decimal ClosingPrice,
    long TradeVolume,
    decimal TradeValue,
    int TradingDate,
    DateTime TriggeredAtUtc);
