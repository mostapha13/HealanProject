using TSEAI.Shared.Application.Market;

namespace TSEAI.Application.DataQuality;

public enum DataQualityStatus
{
    Valid = 1,
    Warning = 2,
    Stale = 3,
    Invalid = 4,
    Unknown = 5
}

public enum DataQualitySeverity
{
    Info = 1,
    Warning = 2,
    Error = 3
}

public sealed record DataQualityIssue(
    string Code,
    DataQualitySeverity Severity,
    string Message,
    string? Field = null,
    string? Observed = null,
    string? Expected = null);

public sealed record DataFreshnessAssessment(
    DataQualityStatus Status,
    DateTimeOffset? ObservedAtUtc,
    TimeSpan? Age,
    TimeSpan MaximumAge,
    bool IsLiveMarketWindow,
    string PolicyCode);

public sealed record MarketDataQualityReport(
    DataQualityStatus Status,
    bool CanUseForAnswer,
    DateTimeOffset EvaluatedAtUtc,
    long InsCode,
    string Symbol,
    DataFreshnessAssessment Freshness,
    IReadOnlyList<DataQualityIssue> Issues)
{
    public bool HasWarnings => Issues.Any(x => x.Severity == DataQualitySeverity.Warning);
    public bool HasErrors => Issues.Any(x => x.Severity == DataQualitySeverity.Error);
}

public sealed record CanonicalSourceQuality(
    string Code,
    string TableName,
    DataQualityStatus Status,
    long? RowCount,
    DateTime? LatestSourceCollectedAt,
    TimeSpan? Age,
    IReadOnlyList<DataQualityIssue> Issues);

public sealed record CanonicalDataQualityReport(
    DataQualityStatus Status,
    bool Configured,
    string Database,
    DateTimeOffset EvaluatedAtUtc,
    IReadOnlyList<CanonicalSourceQuality> Sources);

public sealed record MarketRuntimeFeedStatus(
    string Feed,
    string SyncStatus,
    DataQualityStatus Status,
    bool WorkerHealthy,
    bool SourceFresh,
    DateTime? Watermark,
    DateTime? LatestSourceCollectedAt,
    DateTime? LastAttemptAtUtc,
    DateTime? LastSuccessAtUtc,
    DateTime? LastFailureAtUtc,
    int LastReadRowCount,
    int LastFullRowCount,
    bool LastAttemptWasFull,
    TimeSpan? SourceAge,
    TimeSpan MaximumSourceAge,
    string? LastError,
    IReadOnlyList<DataQualityIssue> Issues);

public sealed record MarketRuntimeStatusReport(
    DataQualityStatus Status,
    bool WorkerHealthy,
    bool CanServeCashMarket,
    bool CanServeOrderBook,
    bool CanServeClientType,
    bool IsLiveMarketWindow,
    DateTimeOffset EvaluatedAtUtc,
    IReadOnlyList<MarketRuntimeFeedStatus> Feeds);

public interface IDataQualityService
{
    MarketDataQualityReport EvaluateMarketSnapshot(MarketSymbolSnapshot snapshot);
    Task<CanonicalDataQualityReport> EvaluateCanonicalSourcesAsync(CancellationToken ct);
}

public interface IMarketRuntimeStatusService
{
    Task<MarketRuntimeStatusReport> GetAsync(CancellationToken ct);
}
