using System.Text.Json;
using Microsoft.Extensions.Configuration;
using StackExchange.Redis;
using TSEAI.Application.DataQuality;
using TSEAI.Shared.Application;

namespace TSEAI.Infrastructure.DataQuality;

public sealed class MarketRuntimeStatusService(
    IConnectionMultiplexer redis,
    IConfiguration configuration,
    IClock clock) : IMarketRuntimeStatusService
{
    private const string SyncStateHash = "tseai:market:sync-state:v1";
    private static readonly TimeSpan TehranOffset = TimeSpan.FromHours(3.5);
    private static readonly string[] RequiredFeeds = ["cashmarket", "orderbookcurrent", "clienttype"];
    private readonly IDatabase _db = redis.GetDatabase();

    public async Task<MarketRuntimeStatusReport> GetAsync(CancellationToken ct)
    {
        ct.ThrowIfCancellationRequested();
        var now = clock.UtcNow;
        var local = now.ToOffset(TehranOffset);
        var live = IsLiveMarketWindow(local);
        var maximumAge = ResolveMaximumAge(local, live);
        var values = await _db.HashGetAsync(SyncStateHash, RequiredFeeds.Select(x => (RedisValue)x).ToArray());
        var feeds = new List<MarketRuntimeFeedStatus>(RequiredFeeds.Length);

        for (var index = 0; index < RequiredFeeds.Length; index++)
            feeds.Add(Evaluate(RequiredFeeds[index], values[index], now, live, maximumAge));

        var overall = feeds.Any(x => x.Status == DataQualityStatus.Invalid) ? DataQualityStatus.Invalid
            : feeds.Any(x => x.Status == DataQualityStatus.Stale) ? DataQualityStatus.Stale
            : feeds.Any(x => x.Status == DataQualityStatus.Unknown) ? DataQualityStatus.Unknown
            : feeds.Any(x => x.Status == DataQualityStatus.Warning) ? DataQualityStatus.Warning
            : DataQualityStatus.Valid;
        var workerHealthy = feeds.All(x => x.WorkerHealthy);

        return new(
            overall,
            workerHealthy,
            CanServe("cashmarket"),
            CanServe("orderbookcurrent"),
            CanServe("clienttype"),
            live,
            now,
            feeds);

        bool CanServe(string feed) =>
            feeds.Single(x => x.Feed == feed) is { WorkerHealthy: true, SourceFresh: true };
    }

    private MarketRuntimeFeedStatus Evaluate(
        string feed,
        RedisValue raw,
        DateTimeOffset now,
        bool live,
        TimeSpan maximumAge)
    {
        var issues = new List<DataQualityIssue>();
        FeedState? state = null;
        if (raw.HasValue)
        {
            try { state = JsonSerializer.Deserialize<FeedState>(raw.ToString()); }
            catch (JsonException exception)
            {
                issues.Add(new("runtime.state_invalid", DataQualitySeverity.Error,
                    "وضعیت همگام‌سازی MarketRuntime قابل خواندن نیست.", feed, exception.GetType().Name, "valid JSON"));
            }
        }

        if (state is null)
        {
            issues.Add(new("runtime.state_missing", DataQualitySeverity.Error,
                "وضعیت همگام‌سازی Feed در Redis موجود نیست.", feed));
            return new(feed, "missing", DataQualityStatus.Invalid, false, false,
                null, null, null, null, null, 0, 0, false, null, maximumAge, null, issues);
        }

        var workerHealthy = true;
        if (string.Equals(state.Status, "failed", StringComparison.OrdinalIgnoreCase))
        {
            workerHealthy = false;
            issues.Add(new("runtime.sync_failed", DataQualitySeverity.Error,
                "آخرین تلاش همگام‌سازی Feed با خطا مواجه شده است.", feed, state.LastError));
        }
        if (state.LastSuccessAtUtc is null)
        {
            workerHealthy = false;
            issues.Add(new("runtime.never_succeeded", DataQualitySeverity.Error,
                "برای Feed هیچ همگام‌سازی موفقی ثبت نشده است.", feed));
        }
        if (state.LastFullRowCount <= 0)
        {
            workerHealthy = false;
            issues.Add(new("runtime.full_snapshot_empty", DataQualitySeverity.Error,
                "آخرین Snapshot کامل Feed خالی است.", feed, state.LastFullRowCount.ToString(), "> 0"));
        }

        if (live && state.LastAttemptAtUtc is null)
        {
            workerHealthy = false;
            issues.Add(new("runtime.poll_time_missing", DataQualitySeverity.Error,
                "زمان آخرین Poll بازار در بازه زنده ثبت نشده است.", feed));
        }
        else if (live && state.LastAttemptAtUtc is DateTime attempt)
        {
            var attemptAge = now - AsUtc(attempt);
            var maximumAttemptAge = TimeSpan.FromMinutes(2);
            if (attemptAge > maximumAttemptAge)
            {
                workerHealthy = false;
                issues.Add(new("runtime.poll_stalled", DataQualitySeverity.Error,
                    "Poll بازار در بازه زنده متوقف یا عقب‌افتاده است.", feed,
                    attemptAge.ToString("c"), maximumAttemptAge.ToString("c")));
            }
        }

        TimeSpan? sourceAge = null;
        var sourceFresh = false;
        var freshnessStatus = DataQualityStatus.Unknown;
        if (state.LatestSourceCollectedAt is DateTime source)
        {
            sourceAge = now - AsSourceUtc(source);
            if (sourceAge < TimeSpan.FromMinutes(-5))
            {
                freshnessStatus = DataQualityStatus.Invalid;
                issues.Add(new("runtime.source_future", DataQualitySeverity.Error,
                    "زمان Source در آینده قرار دارد.", feed, source.ToString("O"), $"<= {now:O}"));
            }
            else if (sourceAge > maximumAge)
            {
                freshnessStatus = DataQualityStatus.Stale;
                issues.Add(new("runtime.source_stale", DataQualitySeverity.Error,
                    "Source از آستانه تازگی مجاز قدیمی‌تر است.", feed,
                    sourceAge.Value.ToString("c"), maximumAge.ToString("c")));
            }
            else
            {
                freshnessStatus = DataQualityStatus.Valid;
                sourceFresh = true;
            }
        }
        else
        {
            issues.Add(new("runtime.source_time_missing", DataQualitySeverity.Error,
                "زمان آخرین داده Source ثبت نشده است.", feed));
        }

        var status = !workerHealthy ? DataQualityStatus.Invalid : freshnessStatus;
        return new(feed, state.Status, status, workerHealthy, sourceFresh,
            ToSourceUtc(state.Watermark), ToSourceUtc(state.LatestSourceCollectedAt), ToUtc(state.LastAttemptAtUtc),
            ToUtc(state.LastSuccessAtUtc), ToUtc(state.LastFailureAtUtc), state.LastReadRowCount,
            state.LastFullRowCount, state.LastAttemptWasFull, sourceAge, maximumAge,
            state.LastError, issues);
    }

    private bool IsLiveMarketWindow(DateTimeOffset local)
    {
        if (local.DayOfWeek is DayOfWeek.Thursday or DayOfWeek.Friday) return false;
        var start = ParseTime(configuration["DataQuality:MarketStartLocal"], new TimeOnly(8, 30));
        var end = ParseTime(configuration["DataQuality:MarketEndLocal"], new TimeOnly(13, 30));
        var time = TimeOnly.FromDateTime(local.DateTime);
        return time >= start && time <= end;
    }

    private TimeSpan ResolveMaximumAge(DateTimeOffset local, bool live)
    {
        if (live) return TimeSpan.FromSeconds(ReadInt("DataQuality:MarketLiveMaxAgeSeconds", 30, 5, 600));
        if (local.DayOfWeek is DayOfWeek.Thursday or DayOfWeek.Friday)
            return TimeSpan.FromHours(ReadInt("DataQuality:WeekendMaxAgeHours", 96, 24, 168));
        return TimeSpan.FromHours(ReadInt("DataQuality:OffHoursMaxAgeHours", 24, 1, 96));
    }

    private int ReadInt(string key, int fallback, int min, int max) =>
        int.TryParse(configuration[key], out var value) ? Math.Clamp(value, min, max) : fallback;

    private static TimeOnly ParseTime(string? value, TimeOnly fallback) =>
        TimeOnly.TryParse(value, out var parsed) ? parsed : fallback;

    private static DateTimeOffset AsUtc(DateTime value) => value.Kind switch
    {
        DateTimeKind.Utc => new(value),
        DateTimeKind.Local => new(value.ToUniversalTime()),
        _ => new(DateTime.SpecifyKind(value, DateTimeKind.Utc))
    };

    private static DateTimeOffset AsSourceUtc(DateTime value)
    {
        if (value.Kind == DateTimeKind.Utc) return new(value);
        if (value.Kind == DateTimeKind.Local) return new(value.ToUniversalTime());
        return new DateTimeOffset(DateTime.SpecifyKind(value, DateTimeKind.Unspecified), TehranOffset).ToUniversalTime();
    }

    private static DateTimeOffset? ToUtc(DateTime? value) => value.HasValue ? AsUtc(value.Value) : null;
    private static DateTimeOffset? ToSourceUtc(DateTime? value) => value.HasValue ? AsSourceUtc(value.Value) : null;

    private sealed class FeedState
    {
        public string Status { get; set; } = "never";
        public DateTime? Watermark { get; set; }
        public DateTime? LatestSourceCollectedAt { get; set; }
        public DateTime? LastAttemptAtUtc { get; set; }
        public DateTime? LastSuccessAtUtc { get; set; }
        public DateTime? LastFailureAtUtc { get; set; }
        public int LastReadRowCount { get; set; }
        public int LastFullRowCount { get; set; }
        public bool LastAttemptWasFull { get; set; }
        public string? LastError { get; set; }
    }
}
