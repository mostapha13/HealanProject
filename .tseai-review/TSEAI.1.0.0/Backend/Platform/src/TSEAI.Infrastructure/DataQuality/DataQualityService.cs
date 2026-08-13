using Microsoft.Extensions.Configuration;
using TSEAI.Application.Data.Canonical;
using TSEAI.Application.DataQuality;
using TSEAI.Shared.Application;
using TSEAI.Shared.Application.Market;

namespace TSEAI.Infrastructure.DataQuality;

public sealed class DataQualityService(
    ICanonicalDataGateway canonical,
    IConfiguration configuration,
    IClock clock) : IDataQualityService
{
    private static readonly TimeSpan TehranOffset = TimeSpan.FromHours(3.5);

    public MarketDataQualityReport EvaluateMarketSnapshot(MarketSymbolSnapshot snapshot)
    {
        var now = clock.UtcNow;
        var local = ToTehran(now);
        var liveWindow = IsLiveMarketWindow(local);
        var maxAge = ResolveSnapshotMaxAge(local, liveWindow);
        // Cache hydration time is not market-data freshness. Prefer the source
        // collection timestamp and only fall back for legacy/test snapshots.
        var observed = snapshot.SourceLastModified.HasValue
            ? AsSourceCollectedUtc(snapshot.SourceLastModified.Value)
            : AsUtc(snapshot.SnapshotUpdatedAtUtc);
        TimeSpan? age = observed is null ? null : now - observed.Value;

        var freshnessStatus = observed is null
            ? DataQualityStatus.Unknown
            : age < TimeSpan.FromMinutes(-5)
                ? DataQualityStatus.Invalid
                : age > maxAge
                    ? DataQualityStatus.Stale
                    : DataQualityStatus.Valid;

        var issues = new List<DataQualityIssue>();
        if (observed is null)
            issues.Add(new("freshness.missing_snapshot_time", DataQualitySeverity.Error, "زمان تولید Snapshot موجود نیست.", nameof(snapshot.SnapshotUpdatedAtUtc)));
        else if (age < TimeSpan.FromMinutes(-5))
            issues.Add(new("freshness.future_snapshot", DataQualitySeverity.Error, "زمان Snapshot به شکل غیرمجاز در آینده است.", nameof(snapshot.SnapshotUpdatedAtUtc), observed.Value.ToString("O"), now.ToString("O")));
        else if (age > maxAge)
            issues.Add(new("freshness.stale", DataQualitySeverity.Error, "Snapshot از آستانه تازگی مجاز قدیمی‌تر است.", nameof(snapshot.SnapshotUpdatedAtUtc), FormatAge(age), FormatAge(maxAge)));

        ValidateMarketFacts(snapshot, issues, now);

        var status = Aggregate(freshnessStatus, issues);
        var canUse = status is DataQualityStatus.Valid or DataQualityStatus.Warning;
        return new(
            status,
            canUse,
            now,
            snapshot.InsCode,
            snapshot.Symbol,
            new(freshnessStatus, observed, age, maxAge, liveWindow, liveWindow ? "market-live" : "market-off-hours"),
            issues);
    }

    public async Task<CanonicalDataQualityReport> EvaluateCanonicalSourcesAsync(CancellationToken ct)
    {
        var now = clock.UtcNow;
        var status = await canonical.GetStatusAsync(ct);
        var rows = new List<CanonicalSourceQuality>(status.Sources.Count);

        foreach (var source in status.Sources)
        {
            var descriptor = CanonicalSourceCatalog.All.First(x => x.Code == source.Code);
            var issues = new List<DataQualityIssue>();
            TimeSpan? age = null;
            var sourceStatus = DataQualityStatus.Valid;

            if (!source.Exists)
            {
                sourceStatus = descriptor.RequiredForPhase1 ? DataQualityStatus.Invalid : DataQualityStatus.Warning;
                issues.Add(new("source.missing", descriptor.RequiredForPhase1 ? DataQualitySeverity.Error : DataQualitySeverity.Warning,
                    descriptor.RequiredForPhase1 ? "جدول الزامی فاز اول موجود نیست." : "جدول اختیاری موجود نیست."));
            }
            else if (source.Error is not null)
            {
                sourceStatus = DataQualityStatus.Invalid;
                issues.Add(new("source.read_error", DataQualitySeverity.Error, "خواندن وضعیت Source با خطا مواجه شد.", Observed: source.Error));
            }
            else
            {
                if (source.RowCount is <= 0)
                {
                    sourceStatus = descriptor.RequiredForPhase1 ? DataQualityStatus.Invalid : DataQualityStatus.Warning;
                    issues.Add(new("source.empty", descriptor.RequiredForPhase1 ? DataQualitySeverity.Error : DataQualitySeverity.Warning, "Source هیچ رکوردی ندارد."));
                }

                if (source.LatestSourceCollectedAt is null)
                {
                    // SourceCollectedAt is a collection timestamp, not a business/effective date.
                    if (descriptor.Mode != CanonicalSourceMode.Reference)
                    {
                        sourceStatus = Max(sourceStatus, DataQualityStatus.Warning);
                        issues.Add(new("source.collection_time_missing", DataQualitySeverity.Warning, "SourceCollectedAt موجود نیست؛ Freshness این Source قابل اثبات نیست."));
                    }
                }
                else
                {
                    var collected = AsSourceCollectedUtc(source.LatestSourceCollectedAt.Value);
                    if (collected is not null)
                    {
                        age = now - collected.Value;
                        var threshold = ResolveCanonicalMaxAge(descriptor.Mode);
                        if (age < TimeSpan.FromMinutes(-5))
                        {
                            sourceStatus = DataQualityStatus.Invalid;
                            issues.Add(new("source.collection_time_future", DataQualitySeverity.Error, "SourceCollectedAt در آینده است.", "SourceCollectedAt", collected.Value.ToString("O"), now.ToString("O")));
                        }
                        else if (age > threshold)
                        {
                            sourceStatus = descriptor.Mode == CanonicalSourceMode.CurrentSnapshot ? DataQualityStatus.Stale : Max(sourceStatus, DataQualityStatus.Warning);
                            issues.Add(new("source.stale", descriptor.Mode == CanonicalSourceMode.CurrentSnapshot ? DataQualitySeverity.Error : DataQualitySeverity.Warning,
                                "زمان آخرین جمع‌آوری Source از آستانه سیاست Freshness عبور کرده است.", "SourceCollectedAt", FormatAge(age), FormatAge(threshold)));
                        }
                    }
                }
            }

            rows.Add(new(source.Code, source.TableName, sourceStatus, source.RowCount, source.LatestSourceCollectedAt, age, issues));
        }

        var overall = rows.Any(x => x.Status == DataQualityStatus.Invalid) ? DataQualityStatus.Invalid
            : rows.Any(x => x.Status == DataQualityStatus.Stale) ? DataQualityStatus.Stale
            : rows.Any(x => x.Status == DataQualityStatus.Warning) ? DataQualityStatus.Warning
            : DataQualityStatus.Valid;

        return new(overall, status.Configured, status.Database, now, rows);
    }

    private void ValidateMarketFacts(MarketSymbolSnapshot s, List<DataQualityIssue> issues, DateTimeOffset now)
    {
        if (s.InsCode <= 0) Error("identity.invalid_inscode", nameof(s.InsCode), s.InsCode, "> 0");
        if (string.IsNullOrWhiteSpace(s.Symbol)) Error("identity.missing_symbol", nameof(s.Symbol), s.Symbol, "non-empty");

        NonNegative(nameof(s.TradeCount), s.TradeCount);
        NonNegative(nameof(s.TradeVolume), s.TradeVolume);
        NonNegative(nameof(s.TradeValue), s.TradeValue);
        NonNegative(nameof(s.ClosingPrice), s.ClosingPrice);
        NonNegative(nameof(s.LastPrice), s.LastPrice);
        NonNegative(nameof(s.MinPrice), s.MinPrice);
        NonNegative(nameof(s.MaxPrice), s.MaxPrice);
        NonNegative(nameof(s.FirstPrice), s.FirstPrice);
        NonNegative(nameof(s.YesterdayPrice), s.YesterdayPrice);

        if (s.MinPrice > 0 && s.MaxPrice > 0 && s.MinPrice > s.MaxPrice)
            Error("price.min_gt_max", "MinPrice/MaxPrice", $"{s.MinPrice}/{s.MaxPrice}", "MinPrice <= MaxPrice");

        if (s.LastPrice > 0 && s.MinPrice > 0 && s.MaxPrice > 0 && (s.LastPrice < s.MinPrice || s.LastPrice > s.MaxPrice))
            Warn("price.last_outside_session_range", nameof(s.LastPrice), s.LastPrice, $"[{s.MinPrice}, {s.MaxPrice}]");

        if (s.ClosingPrice > 0 && s.MinPrice > 0 && s.MaxPrice > 0 && (s.ClosingPrice < s.MinPrice || s.ClosingPrice > s.MaxPrice))
            Warn("price.close_outside_session_range", nameof(s.ClosingPrice), s.ClosingPrice, $"[{s.MinPrice}, {s.MaxPrice}]");

        if (s.MinAllowedPrice is < 0) Error("price.negative_min_allowed", nameof(s.MinAllowedPrice), s.MinAllowedPrice, ">= 0");
        if (s.MaxAllowedPrice is < 0) Error("price.negative_max_allowed", nameof(s.MaxAllowedPrice), s.MaxAllowedPrice, ">= 0");
        if (s.MinAllowedPrice is > 0 && s.MaxAllowedPrice is > 0 && s.MinAllowedPrice > s.MaxAllowedPrice)
            Error("price.allowed_min_gt_max", "MinAllowedPrice/MaxAllowedPrice", $"{s.MinAllowedPrice}/{s.MaxAllowedPrice}", "MinAllowedPrice <= MaxAllowedPrice");

        ValidateClientType(s.ClientType, issues);
        ValidateOrderBook(s.OrderBook, issues);

        if (s.SourceLastModified.HasValue)
        {
            var sourceUtc = AsSourceCollectedUtc(s.SourceLastModified.Value);
            if (sourceUtc.HasValue && sourceUtc > now.AddMinutes(5))
                Warn("source.last_modified_future", nameof(s.SourceLastModified), sourceUtc.Value, $"<= {now.AddMinutes(5):O}");
        }

        void NonNegative(string field, decimal value) { if (value < 0) Error("numeric.negative", field, value, ">= 0"); }
        void Error(string code, string field, object? observed, object? expected) =>
            issues.Add(new(code, DataQualitySeverity.Error, $"مقدار {field} نامعتبر است.", field, observed?.ToString(), expected?.ToString()));
        void Warn(string code, string field, object? observed, object? expected) =>
            issues.Add(new(code, DataQualitySeverity.Warning, $"مقدار {field} نیازمند توجه است.", field, observed?.ToString(), expected?.ToString()));
    }

    private static void ValidateClientType(ClientTypeSnapshot c, List<DataQualityIssue> issues)
    {
        var values = new Dictionary<string, long>
        {
            [nameof(c.BuyCountI)] = c.BuyCountI,
            [nameof(c.BuyCountN)] = c.BuyCountN,
            [nameof(c.BuyIVolume)] = c.BuyIVolume,
            [nameof(c.BuyNVolume)] = c.BuyNVolume,
            [nameof(c.SellCountI)] = c.SellCountI,
            [nameof(c.SellCountN)] = c.SellCountN,
            [nameof(c.SellIVolume)] = c.SellIVolume,
            [nameof(c.SellNVolume)] = c.SellNVolume
        };
        foreach (var (field, value) in values.Where(x => x.Value < 0))
            issues.Add(new("client_type.negative", DataQualitySeverity.Error, "مقدار حقیقی/حقوقی منفی و نامعتبر است.", field, value.ToString(), ">= 0"));
    }

    private static void ValidateOrderBook(IReadOnlyList<OrderBookLevel>? levels, List<DataQualityIssue> issues)
    {
        if (levels is null || levels.Count == 0)
        {
            issues.Add(new("orderbook.missing", DataQualitySeverity.Warning, "OrderBook در Snapshot موجود نیست."));
            return;
        }

        var duplicateLevels = levels.GroupBy(x => x.Level).Where(g => g.Count() > 1).Select(g => g.Key).ToArray();
        if (duplicateLevels.Length > 0)
            issues.Add(new("orderbook.duplicate_level", DataQualitySeverity.Error, "سطح تکراری در OrderBook وجود دارد.", nameof(OrderBookLevel.Level), string.Join(',', duplicateLevels), "unique levels 1..5"));

        foreach (var l in levels)
        {
            if (l.Level is < 1 or > 5)
                issues.Add(new("orderbook.invalid_level", DataQualitySeverity.Error, "Level اردربوک خارج از بازه 1 تا 5 است.", nameof(l.Level), l.Level.ToString(), "1..5"));
            if (l.BuyPrice < 0 || l.SellPrice < 0 || l.BuyCount < 0 || l.SellCount < 0 || l.BuyVolume < 0 || l.SellVolume < 0)
                issues.Add(new("orderbook.negative_value", DataQualitySeverity.Error, "OrderBook دارای مقدار منفی است.", $"Level[{l.Level}]"));
            if (l.BuyVolume > 0 && l.BuyCount == 0)
                issues.Add(new("orderbook.buy_volume_without_count", DataQualitySeverity.Warning, "حجم خرید بدون تعداد سفارش ثبت شده است.", $"Level[{l.Level}]"));
            if (l.SellVolume > 0 && l.SellCount == 0)
                issues.Add(new("orderbook.sell_volume_without_count", DataQualitySeverity.Warning, "حجم فروش بدون تعداد سفارش ثبت شده است.", $"Level[{l.Level}]"));
        }

        var best = levels.FirstOrDefault(x => x.Level == 1);
        if (best is not null && best.BuyPrice > 0 && best.SellPrice > 0 && best.BuyPrice > best.SellPrice)
            issues.Add(new("orderbook.crossed", DataQualitySeverity.Warning, "Best Bid از Best Ask بالاتر است؛ Snapshot ممکن است لحظه‌ای یا ناسازگار باشد.", "Level[1]", $"{best.BuyPrice}>{best.SellPrice}", "BestBid <= BestAsk"));
    }

    private TimeSpan ResolveSnapshotMaxAge(DateTimeOffset tehranNow, bool live)
    {
        if (live) return TimeSpan.FromSeconds(ReadInt("DataQuality:MarketLiveMaxAgeSeconds", 30, 5, 600));
        if (tehranNow.DayOfWeek is DayOfWeek.Thursday or DayOfWeek.Friday)
            return TimeSpan.FromHours(ReadInt("DataQuality:WeekendMaxAgeHours", 96, 24, 168));
        return TimeSpan.FromHours(ReadInt("DataQuality:OffHoursMaxAgeHours", 24, 1, 96));
    }

    private TimeSpan ResolveCanonicalMaxAge(CanonicalSourceMode mode) => mode switch
    {
        CanonicalSourceMode.CurrentSnapshot => TimeSpan.FromHours(ReadInt("DataQuality:CanonicalCurrentSnapshotMaxAgeHours", 24, 1, 168)),
        CanonicalSourceMode.AppendOrVersioned => TimeSpan.FromDays(ReadInt("DataQuality:CanonicalVersionedMaxAgeDays", 14, 1, 365)),
        CanonicalSourceMode.Reference => TimeSpan.FromDays(ReadInt("DataQuality:CanonicalReferenceMaxAgeDays", 30, 1, 3650)),
        _ => TimeSpan.FromDays(30)
    };

    private bool IsLiveMarketWindow(DateTimeOffset local)
    {
        if (local.DayOfWeek is DayOfWeek.Thursday or DayOfWeek.Friday) return false;
        var start = ParseTime(configuration["DataQuality:MarketStartLocal"], new TimeOnly(8, 30));
        var end = ParseTime(configuration["DataQuality:MarketEndLocal"], new TimeOnly(13, 30));
        var time = TimeOnly.FromDateTime(local.DateTime);
        return time >= start && time <= end;
    }

    private int ReadInt(string key, int fallback, int min, int max)
        => int.TryParse(configuration[key], out var value) ? Math.Clamp(value, min, max) : fallback;

    private static TimeOnly ParseTime(string? value, TimeOnly fallback)
        => TimeOnly.TryParse(value, out var parsed) ? parsed : fallback;

    private static DateTimeOffset ToTehran(DateTimeOffset utc) => utc.ToOffset(TehranOffset);

    private static DateTimeOffset? AsUtc(DateTime value)
    {
        if (value == default) return null;
        var utc = value.Kind switch
        {
            DateTimeKind.Utc => value,
            DateTimeKind.Local => value.ToUniversalTime(),
            _ => DateTime.SpecifyKind(value, DateTimeKind.Utc)
        };
        return new DateTimeOffset(utc);
    }

    // SourceCollectedAt currently comes from SQL GETDATE() in the Iran-hosted source jobs.
    // It is a collection timestamp, not an event/business date. Unspecified values are therefore
    // interpreted as Tehran wall-clock time instead of silently treating them as UTC.
    private static DateTimeOffset? AsSourceCollectedUtc(DateTime value)
    {
        if (value == default) return null;
        if (value.Kind == DateTimeKind.Utc) return new DateTimeOffset(value);
        if (value.Kind == DateTimeKind.Local) return new DateTimeOffset(value.ToUniversalTime());
        return new DateTimeOffset(DateTime.SpecifyKind(value, DateTimeKind.Unspecified), TehranOffset).ToUniversalTime();
    }

    private static DataQualityStatus Aggregate(DataQualityStatus freshness, IReadOnlyList<DataQualityIssue> issues)
    {
        if (issues.Any(x => x.Severity == DataQualitySeverity.Error && x.Code != "freshness.stale")) return DataQualityStatus.Invalid;
        if (freshness == DataQualityStatus.Stale) return DataQualityStatus.Stale;
        if (freshness == DataQualityStatus.Unknown) return DataQualityStatus.Unknown;
        if (issues.Any(x => x.Severity == DataQualitySeverity.Warning)) return DataQualityStatus.Warning;
        return DataQualityStatus.Valid;
    }

    private static DataQualityStatus Max(DataQualityStatus a, DataQualityStatus b)
    {
        static int Rank(DataQualityStatus x) => x switch
        {
            DataQualityStatus.Valid => 0,
            DataQualityStatus.Warning => 1,
            DataQualityStatus.Unknown => 2,
            DataQualityStatus.Stale => 3,
            DataQualityStatus.Invalid => 4,
            _ => 4
        };
        return Rank(a) >= Rank(b) ? a : b;
    }

    private static string FormatAge(TimeSpan? value) => value is null ? "unknown" : value.Value.ToString("c");
}
