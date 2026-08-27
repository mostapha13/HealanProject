using System.Text.Json;
using TSEAI.MarketRuntime.Worker;

static void Ensure(bool condition, string message)
{
    if (!condition) throw new InvalidOperationException(message);
}

Ensure(MarketReconciliationPolicy.IsSafe(567, 567, 1, 50, out _),
    "An unchanged full Cashmarket snapshot must be accepted.");
Ensure(MarketReconciliationPolicy.IsSafe(284, 567, 1, 50, out _),
    "A snapshot exactly at the configured coverage boundary must be accepted.");
Ensure(!MarketReconciliationPolicy.IsSafe(283, 567, 1, 50, out var coverageReason)
       && coverageReason.Contains("coverage", StringComparison.OrdinalIgnoreCase),
    "A destructive full snapshot below the coverage boundary must be rejected.");
Ensure(!MarketReconciliationPolicy.IsSafe(0, 0, 1, 50, out var minimumReason)
       && minimumReason.Contains("minimum", StringComparison.OrdinalIgnoreCase),
    "An unexpectedly empty current-state source must be rejected.");
Ensure(MarketReconciliationPolicy.IsSafe(0, 0, 0, 0, out _),
    "Operators must be able to explicitly allow an empty source when that is intentional.");

var options = new MarketRuntimeOptions();
Ensure(options.UseWatermark, "Incremental polling must use a watermark by default.");
Ensure(options.FullReconciliationSeconds > 0, "Replaceable current-state feeds require periodic full reconciliation.");
Ensure(options.MinimumReconciliationCoveragePercent is >= 0 and <= 100,
    "The default reconciliation coverage must be a percentage.");

Ensure(DefaultMarketQueries.CurrentState.Contains("c.SourceCollectedAt > @Watermark", StringComparison.Ordinal),
    "Cashmarket incremental reads must be based on the source collection timestamp.");
Ensure(DefaultMarketQueries.OrderBook.Contains("ob.SourceCollectedAt > @Watermark", StringComparison.Ordinal),
    "OrderBookCurrent incremental reads must be based on the source collection timestamp.");

var state = new MarketFeedSyncState
{
    Feed = "cashmarket",
    Status = "healthy",
    Watermark = new DateTime(2026, 8, 11, 11, 29, 22, DateTimeKind.Unspecified),
    LatestSourceCollectedAt = new DateTime(2026, 8, 11, 11, 29, 22, DateTimeKind.Unspecified),
    LastFullRowCount = 567
};
var restored = JsonSerializer.Deserialize<MarketFeedSyncState>(JsonSerializer.Serialize(state));
Ensure(restored?.Watermark == state.Watermark && restored.LastFullRowCount == 567,
    "Redis sync-state payload must preserve the source watermark and full row count.");

Console.WriteLine("TSEAI MarketRuntime reconciliation smoke tests PASS");
