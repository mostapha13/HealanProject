using TSEAI.Application.Data.Canonical;
using TSEAI.Shared.Application.Market;

namespace TSEAI.Application.Analytics;

public enum AnalyticsAvailability { Available = 1, Unavailable = 2 }
public enum AnalyticsSignal { StrongNegative = -2, Negative = -1, Neutral = 0, Positive = 1, StrongPositive = 2, Unknown = 99 }

public sealed record AnalyticsMetric<T>(AnalyticsAvailability Availability, T? Value, string? UnavailableReason = null) where T : struct
{
    public static AnalyticsMetric<T> Of(T value) => new(AnalyticsAvailability.Available, value);
    public static AnalyticsMetric<T> Missing(string reason) => new(AnalyticsAvailability.Unavailable, default, reason);
}

public sealed record TradingPowerAnalytics(
    AnalyticsMetric<long> IndividualNetVolume,
    AnalyticsMetric<long> LegalNetVolume,
    AnalyticsMetric<decimal> IndividualBuyPerCapita,
    AnalyticsMetric<decimal> IndividualSellPerCapita,
    AnalyticsMetric<decimal> BuyerPower,
    AnalyticsSignal BuyerPowerSignal);

public sealed record OrderBookAnalytics(
    AnalyticsMetric<decimal> BestBidPrice,
    AnalyticsMetric<long> BestBidVolume,
    AnalyticsMetric<decimal> BestAskPrice,
    AnalyticsMetric<long> BestAskVolume,
    AnalyticsMetric<decimal> Spread,
    AnalyticsMetric<decimal> SpreadPercent,
    AnalyticsMetric<long> TotalBidVolume,
    AnalyticsMetric<long> TotalAskVolume,
    AnalyticsMetric<decimal> Imbalance,
    AnalyticsSignal ImbalanceSignal);

public sealed record VolumeAnalytics(
    long TradeVolume,
    AnalyticsMetric<decimal> VolumeVsBaseVolume,
    AnalyticsMetric<decimal> VolumeVsMonthlyAverage);

public sealed record PricePositionAnalytics(
    AnalyticsMetric<decimal> DistanceFromSessionHighPercent,
    AnalyticsMetric<decimal> DistanceFromSessionLowPercent,
    AnalyticsMetric<decimal> LastVsClosingPercent,
    AnalyticsSignal ClosingPressureSignal);

public sealed record MarketBreadthAnalytics(
    long PositiveCount,
    long NegativeCount,
    long UnchangedCount,
    long SuspendedCount,
    long TotalCount,
    AnalyticsMetric<decimal> PositiveRatio,
    AnalyticsMetric<decimal> NegativeRatio,
    AnalyticsSignal BreadthSignal);

public sealed record SymbolMarketAnalytics(
    long InsCode,
    string Symbol,
    DateTime CalculatedAtUtc,
    TradingPowerAnalytics TradingPower,
    OrderBookAnalytics OrderBook,
    VolumeAnalytics Volume,
    PricePositionAnalytics PricePosition);

public interface IMarketAnalyticsEngine
{
    TradingPowerAnalytics AnalyzeTradingPower(ClientTypeSnapshot snapshot);
    OrderBookAnalytics AnalyzeOrderBook(IReadOnlyList<OrderBookLevel> levels, decimal lastPrice);
    VolumeAnalytics AnalyzeVolume(MarketSymbolSnapshot snapshot);
    PricePositionAnalytics AnalyzePricePosition(MarketSymbolSnapshot snapshot);
    MarketBreadthAnalytics AnalyzeMarketBreadth(IReadOnlyList<CanonicalMarketIndex> indexes);
    SymbolMarketAnalytics AnalyzeSymbol(MarketSymbolSnapshot snapshot);
}
