using TSEAI.Application.Data.Canonical;
using TSEAI.Shared.Application.Market;

namespace TSEAI.Application.Analytics;

public sealed class DeterministicMarketAnalyticsEngine : IMarketAnalyticsEngine
{
    public TradingPowerAnalytics AnalyzeTradingPower(ClientTypeSnapshot c)
    {
        var netI = AnalyticsMetric<long>.Of(c.BuyIVolume - c.SellIVolume);
        var netN = AnalyticsMetric<long>.Of(c.BuyNVolume - c.SellNVolume);
        var buyPc = c.BuyCountI > 0
            ? AnalyticsMetric<decimal>.Of((decimal)c.BuyIVolume / c.BuyCountI)
            : AnalyticsMetric<decimal>.Missing("individual_buy_count_is_zero");
        var sellPc = c.SellCountI > 0
            ? AnalyticsMetric<decimal>.Of((decimal)c.SellIVolume / c.SellCountI)
            : AnalyticsMetric<decimal>.Missing("individual_sell_count_is_zero");
        var power = buyPc.Availability == AnalyticsAvailability.Available && sellPc.Availability == AnalyticsAvailability.Available && sellPc.Value > 0
            ? AnalyticsMetric<decimal>.Of(buyPc.Value!.Value / sellPc.Value!.Value)
            : AnalyticsMetric<decimal>.Missing("per_capita_values_are_not_divisible");
        return new(netI, netN, buyPc, sellPc, power, BuyerPowerSignal(power));
    }

    public OrderBookAnalytics AnalyzeOrderBook(IReadOnlyList<OrderBookLevel> levels, decimal lastPrice)
    {
        var valid = levels.Where(x => x.Level is >= 1 and <= 5).OrderBy(x => x.Level).ToArray();
        var best = valid.FirstOrDefault(x => x.Level == 1);
        var bid = best is not null && best.BuyPrice > 0 ? AnalyticsMetric<decimal>.Of(best.BuyPrice) : AnalyticsMetric<decimal>.Missing("best_bid_not_available");
        var bidVol = best is not null ? AnalyticsMetric<long>.Of(best.BuyVolume) : AnalyticsMetric<long>.Missing("best_bid_not_available");
        var ask = best is not null && best.SellPrice > 0 ? AnalyticsMetric<decimal>.Of(best.SellPrice) : AnalyticsMetric<decimal>.Missing("best_ask_not_available");
        var askVol = best is not null ? AnalyticsMetric<long>.Of(best.SellVolume) : AnalyticsMetric<long>.Missing("best_ask_not_available");
        var spread = bid.Availability == AnalyticsAvailability.Available && ask.Availability == AnalyticsAvailability.Available
            ? AnalyticsMetric<decimal>.Of(ask.Value!.Value - bid.Value!.Value)
            : AnalyticsMetric<decimal>.Missing("best_bid_or_ask_not_available");
        var midpoint = bid.Availability == AnalyticsAvailability.Available && ask.Availability == AnalyticsAvailability.Available
            ? (bid.Value!.Value + ask.Value!.Value) / 2m
            : 0m;
        var spreadPercent = spread.Availability == AnalyticsAvailability.Available && midpoint > 0
            ? AnalyticsMetric<decimal>.Of(spread.Value!.Value * 100m / midpoint)
            : AnalyticsMetric<decimal>.Missing("midpoint_or_spread_not_available");
        var totalBid = valid.Length > 0 ? AnalyticsMetric<long>.Of(valid.Sum(x => x.BuyVolume)) : AnalyticsMetric<long>.Missing("order_book_not_available");
        var totalAsk = valid.Length > 0 ? AnalyticsMetric<long>.Of(valid.Sum(x => x.SellVolume)) : AnalyticsMetric<long>.Missing("order_book_not_available");
        AnalyticsMetric<decimal> imbalance;
        if (totalBid.Availability == AnalyticsAvailability.Available && totalAsk.Availability == AnalyticsAvailability.Available && totalBid.Value + totalAsk.Value > 0)
            imbalance = AnalyticsMetric<decimal>.Of((decimal)(totalBid.Value!.Value - totalAsk.Value!.Value) / (totalBid.Value.Value + totalAsk.Value.Value));
        else
            imbalance = AnalyticsMetric<decimal>.Missing("order_book_total_volume_is_zero");
        return new(bid,bidVol,ask,askVol,spread,spreadPercent,totalBid,totalAsk,imbalance,ImbalanceSignal(imbalance));
    }

    public VolumeAnalytics AnalyzeVolume(MarketSymbolSnapshot s)
    {
        var vsBase = s.BaseVolume is > 0
            ? AnalyticsMetric<decimal>.Of((decimal)s.TradeVolume / s.BaseVolume.Value)
            : AnalyticsMetric<decimal>.Missing("base_volume_not_available");
        // MonthAverageVolume is not present in the Phase-1 canonical/source contract. Never fabricate it.
        var vsMonthly = AnalyticsMetric<decimal>.Missing("monthly_average_volume_source_not_available");
        return new(s.TradeVolume, vsBase, vsMonthly);
    }

    public PricePositionAnalytics AnalyzePricePosition(MarketSymbolSnapshot s)
    {
        var fromHigh = s.MaxPrice > 0
            ? AnalyticsMetric<decimal>.Of((s.MaxPrice - s.LastPrice) * 100m / s.MaxPrice)
            : AnalyticsMetric<decimal>.Missing("session_high_not_available");
        var fromLow = s.MinPrice > 0
            ? AnalyticsMetric<decimal>.Of((s.LastPrice - s.MinPrice) * 100m / s.MinPrice)
            : AnalyticsMetric<decimal>.Missing("session_low_not_available");
        var lastVsClose = s.ClosingPrice > 0
            ? AnalyticsMetric<decimal>.Of((s.LastPrice - s.ClosingPrice) * 100m / s.ClosingPrice)
            : AnalyticsMetric<decimal>.Missing("closing_price_not_available");
        return new(fromHigh, fromLow, lastVsClose, ClosingPressure(lastVsClose));
    }

    public MarketBreadthAnalytics AnalyzeMarketBreadth(IReadOnlyList<CanonicalMarketIndex> indexes)
    {
        // Index rows may overlap. Prefer the broadest row (largest TotalInstrumentCount) rather than summing overlapping universes.
        var row = indexes.Where(x => x.TotalInstrumentCount > 0).OrderByDescending(x => x.TotalInstrumentCount).FirstOrDefault();
        if (row is null)
        {
            var missing = AnalyticsMetric<decimal>.Missing("market_breadth_source_not_available");
            return new(0,0,0,0,0,missing,missing,AnalyticsSignal.Unknown);
        }
        var pos = AnalyticsMetric<decimal>.Of((decimal)row.PositiveInstrumentCount / row.TotalInstrumentCount);
        var neg = AnalyticsMetric<decimal>.Of((decimal)row.NegativeInstrumentCount / row.TotalInstrumentCount);
        var delta = pos.Value!.Value - neg.Value!.Value;
        var signal = delta >= 0.30m ? AnalyticsSignal.StrongPositive : delta >= 0.10m ? AnalyticsSignal.Positive : delta <= -0.30m ? AnalyticsSignal.StrongNegative : delta <= -0.10m ? AnalyticsSignal.Negative : AnalyticsSignal.Neutral;
        return new(row.PositiveInstrumentCount,row.NegativeInstrumentCount,row.UnchangedInstrumentCount,row.SuspendedInstrumentCount,row.TotalInstrumentCount,pos,neg,signal);
    }

    public SymbolMarketAnalytics AnalyzeSymbol(MarketSymbolSnapshot s)
        => new(s.InsCode,s.Symbol,DateTime.UtcNow,AnalyzeTradingPower(s.ClientType),AnalyzeOrderBook(s.OrderBook,s.LastPrice),AnalyzeVolume(s),AnalyzePricePosition(s));

    private static AnalyticsSignal BuyerPowerSignal(AnalyticsMetric<decimal> m)
    {
        if (m.Availability != AnalyticsAvailability.Available || m.Value is null) return AnalyticsSignal.Unknown;
        var v=m.Value.Value;
        return v >= 2m ? AnalyticsSignal.StrongPositive : v > 1.10m ? AnalyticsSignal.Positive : v <= 0.5m ? AnalyticsSignal.StrongNegative : v < 0.90m ? AnalyticsSignal.Negative : AnalyticsSignal.Neutral;
    }
    private static AnalyticsSignal ImbalanceSignal(AnalyticsMetric<decimal> m)
    {
        if (m.Availability != AnalyticsAvailability.Available || m.Value is null) return AnalyticsSignal.Unknown;
        var v=m.Value.Value;
        return v >= 0.50m ? AnalyticsSignal.StrongPositive : v >= 0.20m ? AnalyticsSignal.Positive : v <= -0.50m ? AnalyticsSignal.StrongNegative : v <= -0.20m ? AnalyticsSignal.Negative : AnalyticsSignal.Neutral;
    }
    private static AnalyticsSignal ClosingPressure(AnalyticsMetric<decimal> m)
    {
        if (m.Availability != AnalyticsAvailability.Available || m.Value is null) return AnalyticsSignal.Unknown;
        var v=m.Value.Value;
        return v >= 1m ? AnalyticsSignal.StrongPositive : v > 0.20m ? AnalyticsSignal.Positive : v <= -1m ? AnalyticsSignal.StrongNegative : v < -0.20m ? AnalyticsSignal.Negative : AnalyticsSignal.Neutral;
    }
}
