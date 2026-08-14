using TSEAI.Application.Analytics;
using TSEAI.Application.DataQuality;
using TSEAI.Application.Market;
using TSEAI.Shared.Application.Market;

namespace TSEAI.Application.StructuredQuery;

public sealed class StructuredQueryService(
    INaturalLanguageStructuredQueryInterpreter interpreter,
    IMarketSnapshotQuery market,
    IDataQualityService quality,
    IMarketAnalyticsEngine analytics) : IStructuredQueryService
{
    public Task<StructuredQueryExecutionResult> ExecuteAsync(string question, int? take, CancellationToken ct)
    {
        var interpreted = interpreter.Interpret(question, take);
        return interpreted.Success && interpreted.Plan is not null
            ? ExecuteAsync(interpreted.Plan, ct)
            : Task.FromResult(new StructuredQueryExecutionResult(false, null, 0, 0, 0, [], interpreted.Error ?? interpreted.Clarification ?? "structured_query_not_detected"));
    }

    public async Task<StructuredQueryExecutionResult> ExecuteAsync(StructuredQueryPlan plan, CancellationToken ct)
    {
        var validation = Validate(plan);
        if (validation is not null) return new(false, plan, 0, 0, 0, [], validation);

        var universe = await market.GetActiveAsync(30000, ct);
        var scanned = universe.Count;
        var rejected = 0;
        var rows = new List<(StructuredQueryRow Row, decimal? SortValue)>();

        foreach (var s in universe)
        {
            if (plan.MarketTypeId is not null && s.MarketTypeId != plan.MarketTypeId) continue;
            if (!string.IsNullOrWhiteSpace(plan.IndustryCode) && !string.Equals(s.IndustryCode, plan.IndustryCode, StringComparison.OrdinalIgnoreCase)) continue;
            var q = quality.EvaluateMarketSnapshot(s);
            if (!q.CanUseForAnswer) { rejected++; continue; }
            var package = analytics.AnalyzeSymbol(s);
            if (!Matches(plan.Conditions, s, package)) continue;
            var metrics = BuildMetrics(s, package);
            rows.Add((new StructuredQueryRow(s.InsCode, s.SymbolCode, s.Symbol, s.SymbolName, s.CompanyName, s.MarketTypeId, s.IndustryCode, metrics, q.Status.ToString()), plan.SortBy is null ? null : MetricValue(plan.SortBy.Value, s, package)));
        }

        IEnumerable<(StructuredQueryRow Row, decimal? SortValue)> ordered = rows;
        if (plan.SortBy is not null)
            ordered = plan.SortDescending
                ? rows.OrderByDescending(x => x.SortValue.HasValue).ThenByDescending(x => x.SortValue).ThenBy(x => x.Row.Symbol)
                : rows.OrderByDescending(x => x.SortValue.HasValue).ThenBy(x => x.SortValue).ThenBy(x => x.Row.Symbol);
        else ordered = rows.OrderBy(x => x.Row.Symbol);

        var results = ordered.Take(plan.Take).Select(x => x.Row).ToArray();
        return new(true, plan, scanned, rejected, rows.Count, results, null);
    }

    private static string? Validate(StructuredQueryPlan p)
    {
        if (p.Take is < 1 or > 200) return "take_out_of_range";
        if (p.Conditions.Count > 12) return "too_many_conditions";
        if (p.Confidence is < 0 or > 1) return "invalid_confidence";
        if (p.Conditions.Count == 0 && p.SortBy is null) return "empty_structured_query";
        return null;
    }

    private static bool Matches(IReadOnlyList<StructuredQueryCondition> conditions, MarketSymbolSnapshot s, SymbolMarketAnalytics a)
    {
        foreach (var c in conditions)
        {
            var v = MetricValue(c.Metric, s, a);
            if (v is null) return false;
            var ok = c.Operator switch
            {
                StructuredQueryOperator.Equal => v.Value == c.Value,
                StructuredQueryOperator.NotEqual => v.Value != c.Value,
                StructuredQueryOperator.GreaterThan => v.Value > c.Value,
                StructuredQueryOperator.GreaterThanOrEqual => v.Value >= c.Value,
                StructuredQueryOperator.LessThan => v.Value < c.Value,
                StructuredQueryOperator.LessThanOrEqual => v.Value <= c.Value,
                _ => false
            };
            if (!ok) return false;
        }
        return true;
    }

    private static decimal? MetricValue(StructuredQueryMetric m, MarketSymbolSnapshot s, SymbolMarketAnalytics a) => m switch
    {
        StructuredQueryMetric.TradeVolume => s.TradeVolume,
        StructuredQueryMetric.TradeValue => s.TradeValue,
        StructuredQueryMetric.TradeCount => s.TradeCount,
        StructuredQueryMetric.LastPrice => s.LastPrice,
        StructuredQueryMetric.ClosingPrice => s.ClosingPrice,
        StructuredQueryMetric.LastPricePercent => s.LastPricePercent,
        StructuredQueryMetric.ClosingPricePercent => s.ClosingPricePercent,
        StructuredQueryMetric.PE => s.PE,
        StructuredQueryMetric.EPS => s.Eps,
        StructuredQueryMetric.MarketValue => s.MarketValue,
        StructuredQueryMetric.FirstPrice => s.FirstPrice,
        StructuredQueryMetric.YesterdayPrice => s.YesterdayPrice,
        StructuredQueryMetric.HighPrice => s.MaxPrice,
        StructuredQueryMetric.LowPrice => s.MinPrice,
        StructuredQueryMetric.PriceChange => s.PriceChange,
        StructuredQueryMetric.ClosingPriceChange => s.ClosingPriceChange,
        StructuredQueryMetric.EffectOnIndex => s.EffectOnIndex,
        StructuredQueryMetric.IntradayRange => s.MaxPrice-s.MinPrice,
        StructuredQueryMetric.AverageTradePrice => s.TradeVolume<=0?null:s.TradeValue/s.TradeVolume,
        StructuredQueryMetric.AverageTradeValue => s.TradeCount<=0?null:s.TradeValue/s.TradeCount,
        StructuredQueryMetric.AverageTradeVolume => s.TradeCount<=0?null:(decimal)s.TradeVolume/s.TradeCount,
        StructuredQueryMetric.TurnoverRatio => s.MarketValue is null or <=0?null:s.TradeValue/s.MarketValue.Value*100m,
        StructuredQueryMetric.BaseVolume => s.BaseVolume,
        StructuredQueryMetric.BuyerPower => Available(a.TradingPower.BuyerPower),
        StructuredQueryMetric.OrderBookImbalance => Available(a.OrderBook.Imbalance),
        StructuredQueryMetric.BestBidPrice => Available(a.OrderBook.BestBidPrice),
        StructuredQueryMetric.BestBidVolume => Available(a.OrderBook.BestBidVolume),
        StructuredQueryMetric.BestBidCount => BestCount(s,true),
        StructuredQueryMetric.BestAskPrice => Available(a.OrderBook.BestAskPrice),
        StructuredQueryMetric.BestAskVolume => Available(a.OrderBook.BestAskVolume),
        StructuredQueryMetric.BestAskCount => BestCount(s,false),
        StructuredQueryMetric.Spread => Available(a.OrderBook.Spread),
        StructuredQueryMetric.SpreadPercent => Available(a.OrderBook.SpreadPercent),
        StructuredQueryMetric.TotalBidVolume => BookVolume(s,true),
        StructuredQueryMetric.TotalAskVolume => BookVolume(s,false),
        StructuredQueryMetric.TotalBidCount => TotalCount(s,true),
        StructuredQueryMetric.TotalAskCount => TotalCount(s,false),
        StructuredQueryMetric.DepthRatio => DepthRatio(s),
        StructuredQueryMetric.BuyQueueVolume => QueueVolume(s,true),
        StructuredQueryMetric.SellQueueVolume => QueueVolume(s,false),
        StructuredQueryMetric.VolumeVsBaseVolume => Available(a.Volume.VolumeVsBaseVolume),
        _ => null
    };

    private static decimal? Available(AnalyticsMetric<decimal> m) => m.Availability == AnalyticsAvailability.Available ? m.Value : null;
    private static decimal? Available(AnalyticsMetric<long> m) => m.Availability == AnalyticsAvailability.Available ? m.Value : null;
    private static decimal? BestCount(MarketSymbolSnapshot s,bool bid)
    {
        if(s.OrderBookUpdatedAt is null) return null;
        var best=s.OrderBook.FirstOrDefault(x=>x.Level==1);
        if(best is null||(bid?best.BuyPrice:best.SellPrice)<=0) return null;
        return bid?best.BuyCount:best.SellCount;
    }
    private static decimal? TotalCount(MarketSymbolSnapshot s,bool bid)
        => s.OrderBookUpdatedAt is null?null:s.OrderBook.Where(x=>x.Level is >=1 and <=5).Sum(x=>bid?x.BuyCount:x.SellCount);
    private static decimal? BookVolume(MarketSymbolSnapshot s,bool bid)
        => s.OrderBookUpdatedAt is null?null:s.OrderBook.Where(x=>x.Level is >=1 and <=5).Sum(x=>bid?x.BuyVolume:x.SellVolume);
    private static decimal? DepthRatio(MarketSymbolSnapshot s)
    {
        if(s.OrderBookUpdatedAt is null) return null;
        var buy=s.OrderBook.Sum(x=>x.BuyVolume); var sell=s.OrderBook.Sum(x=>x.SellVolume);
        return sell<=0?null:(decimal)buy/sell;
    }
    private static decimal? QueueVolume(MarketSymbolSnapshot s,bool buy)
    {
        if(s.OrderBookUpdatedAt is null) return null;
        var best=s.OrderBook.FirstOrDefault(x=>x.Level==1);
        if(best is null) return null;
        if(buy) return best.BuyPrice>0&&best.SellPrice<=0?best.BuyVolume:null;
        return best.SellPrice>0&&best.BuyPrice<=0?best.SellVolume:null;
    }

    private static IReadOnlyDictionary<string, decimal?> BuildMetrics(MarketSymbolSnapshot s, SymbolMarketAnalytics a) => new Dictionary<string, decimal?>
    {
        [nameof(StructuredQueryMetric.TradeVolume)] = s.TradeVolume,
        [nameof(StructuredQueryMetric.TradeValue)] = s.TradeValue,
        [nameof(StructuredQueryMetric.TradeCount)] = s.TradeCount,
        [nameof(StructuredQueryMetric.LastPrice)] = s.LastPrice,
        [nameof(StructuredQueryMetric.ClosingPrice)] = s.ClosingPrice,
        [nameof(StructuredQueryMetric.LastPricePercent)] = s.LastPricePercent,
        [nameof(StructuredQueryMetric.ClosingPricePercent)] = s.ClosingPricePercent,
        [nameof(StructuredQueryMetric.PE)] = s.PE,
        [nameof(StructuredQueryMetric.EPS)] = s.Eps,
        [nameof(StructuredQueryMetric.MarketValue)] = s.MarketValue,
        [nameof(StructuredQueryMetric.FirstPrice)] = s.FirstPrice,
        [nameof(StructuredQueryMetric.YesterdayPrice)] = s.YesterdayPrice,
        [nameof(StructuredQueryMetric.HighPrice)] = s.MaxPrice,
        [nameof(StructuredQueryMetric.LowPrice)] = s.MinPrice,
        [nameof(StructuredQueryMetric.PriceChange)] = s.PriceChange,
        [nameof(StructuredQueryMetric.ClosingPriceChange)] = s.ClosingPriceChange,
        [nameof(StructuredQueryMetric.EffectOnIndex)] = s.EffectOnIndex,
        [nameof(StructuredQueryMetric.IntradayRange)] = s.MaxPrice-s.MinPrice,
        [nameof(StructuredQueryMetric.AverageTradePrice)] = s.TradeVolume<=0?null:s.TradeValue/s.TradeVolume,
        [nameof(StructuredQueryMetric.AverageTradeValue)] = s.TradeCount<=0?null:s.TradeValue/s.TradeCount,
        [nameof(StructuredQueryMetric.AverageTradeVolume)] = s.TradeCount<=0?null:(decimal)s.TradeVolume/s.TradeCount,
        [nameof(StructuredQueryMetric.TurnoverRatio)] = s.MarketValue is null or <=0?null:s.TradeValue/s.MarketValue.Value*100m,
        [nameof(StructuredQueryMetric.BaseVolume)] = s.BaseVolume,
        [nameof(StructuredQueryMetric.BuyerPower)] = Available(a.TradingPower.BuyerPower),
        [nameof(StructuredQueryMetric.OrderBookImbalance)] = Available(a.OrderBook.Imbalance),
        [nameof(StructuredQueryMetric.BestBidPrice)] = Available(a.OrderBook.BestBidPrice),
        [nameof(StructuredQueryMetric.BestBidVolume)] = Available(a.OrderBook.BestBidVolume),
        [nameof(StructuredQueryMetric.BestBidCount)] = BestCount(s,true),
        [nameof(StructuredQueryMetric.BestAskPrice)] = Available(a.OrderBook.BestAskPrice),
        [nameof(StructuredQueryMetric.BestAskVolume)] = Available(a.OrderBook.BestAskVolume),
        [nameof(StructuredQueryMetric.BestAskCount)] = BestCount(s,false),
        [nameof(StructuredQueryMetric.Spread)] = Available(a.OrderBook.Spread),
        [nameof(StructuredQueryMetric.SpreadPercent)] = Available(a.OrderBook.SpreadPercent),
        [nameof(StructuredQueryMetric.TotalBidVolume)] = BookVolume(s,true),
        [nameof(StructuredQueryMetric.TotalAskVolume)] = BookVolume(s,false),
        [nameof(StructuredQueryMetric.TotalBidCount)] = TotalCount(s,true),
        [nameof(StructuredQueryMetric.TotalAskCount)] = TotalCount(s,false),
        [nameof(StructuredQueryMetric.DepthRatio)] = DepthRatio(s),
        [nameof(StructuredQueryMetric.BuyQueueVolume)] = QueueVolume(s,true),
        [nameof(StructuredQueryMetric.SellQueueVolume)] = QueueVolume(s,false),
        [nameof(StructuredQueryMetric.VolumeVsBaseVolume)] = Available(a.Volume.VolumeVsBaseVolume)
    };
}
