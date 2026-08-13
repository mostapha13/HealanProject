namespace TSEAI.Application.StructuredQuery;

public enum StructuredQueryMetric
{
    TradeVolume,
    TradeValue,
    TradeCount,
    LastPrice,
    ClosingPrice,
    LastPricePercent,
    ClosingPricePercent,
    PE,
    EPS,
    MarketValue,
    BaseVolume,
    BuyerPower,
    OrderBookImbalance,
    VolumeVsBaseVolume
}

public enum StructuredQueryOperator { Equal, NotEqual, GreaterThan, GreaterThanOrEqual, LessThan, LessThanOrEqual }

public sealed record StructuredQueryCondition(StructuredQueryMetric Metric, StructuredQueryOperator Operator, decimal Value);

public sealed record StructuredQueryPlan(
    IReadOnlyList<StructuredQueryCondition> Conditions,
    StructuredQueryMetric? SortBy,
    bool SortDescending,
    int Take,
    int? MarketTypeId,
    string? IndustryCode,
    double Confidence,
    string Explanation,
    IReadOnlyList<string> MatchedRules);

public sealed record StructuredQueryInterpretation(bool Success, StructuredQueryPlan? Plan, string? Error, string? Clarification);

public sealed record StructuredQueryRow(
    long InsCode,
    string? SymbolCode,
    string Symbol,
    string SymbolName,
    string? CompanyName,
    int? MarketTypeId,
    string? IndustryCode,
    IReadOnlyDictionary<string, decimal?> Metrics,
    string QualityStatus);

public sealed record StructuredQueryExecutionResult(
    bool Success,
    StructuredQueryPlan? Plan,
    int Scanned,
    int QualityRejected,
    int Matched,
    IReadOnlyList<StructuredQueryRow> Results,
    string? Error);

public interface INaturalLanguageStructuredQueryInterpreter
{
    StructuredQueryInterpretation Interpret(string question, int? requestedTake = null);
}

public interface IStructuredQueryService
{
    Task<StructuredQueryExecutionResult> ExecuteAsync(string question, int? take, CancellationToken ct);
    Task<StructuredQueryExecutionResult> ExecuteAsync(StructuredQueryPlan plan, CancellationToken ct);
}
