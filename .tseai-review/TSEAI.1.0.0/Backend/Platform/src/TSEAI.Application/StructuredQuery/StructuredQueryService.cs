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
        StructuredQueryMetric.BaseVolume => s.BaseVolume,
        StructuredQueryMetric.BuyerPower => Available(a.TradingPower.BuyerPower),
        StructuredQueryMetric.OrderBookImbalance => Available(a.OrderBook.Imbalance),
        StructuredQueryMetric.VolumeVsBaseVolume => Available(a.Volume.VolumeVsBaseVolume),
        _ => null
    };

    private static decimal? Available(AnalyticsMetric<decimal> m) => m.Availability == AnalyticsAvailability.Available ? m.Value : null;

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
        [nameof(StructuredQueryMetric.BaseVolume)] = s.BaseVolume,
        [nameof(StructuredQueryMetric.BuyerPower)] = Available(a.TradingPower.BuyerPower),
        [nameof(StructuredQueryMetric.OrderBookImbalance)] = Available(a.OrderBook.Imbalance),
        [nameof(StructuredQueryMetric.VolumeVsBaseVolume)] = Available(a.Volume.VolumeVsBaseVolume)
    };
}
