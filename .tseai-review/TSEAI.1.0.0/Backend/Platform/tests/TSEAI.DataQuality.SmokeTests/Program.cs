using Microsoft.Extensions.Configuration;
using TSEAI.Application.Data.Canonical;
using TSEAI.Application.DataQuality;
using TSEAI.Infrastructure.DataQuality;
using TSEAI.Shared.Application;
using TSEAI.Shared.Application.Market;

static void Ensure(bool condition, string message)
{
    if (!condition) throw new InvalidOperationException(message);
}

var now = new DateTimeOffset(2026, 8, 11, 7, 0, 0, TimeSpan.Zero); // Tuesday 10:30 Tehran, live market.
var config = new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string,string?>
{
    ["DataQuality:MarketLiveMaxAgeSeconds"] = "30",
    ["DataQuality:MarketStartLocal"] = "08:30",
    ["DataQuality:MarketEndLocal"] = "13:30"
}).Build();

var service = new DataQualityService(new FakeCanonicalGateway(), config, new FixedClock(now));

var valid = Snapshot(now.AddSeconds(-4).UtcDateTime);
var validResult = service.EvaluateMarketSnapshot(valid);
Ensure(validResult.Status == DataQualityStatus.Valid && validResult.CanUseForAnswer, "Fresh valid snapshot should pass.");
Ensure(validResult.Freshness.IsLiveMarketWindow, "Reference time must be in live market window.");

var stale = Snapshot(now.AddMinutes(-5).UtcDateTime);
var staleResult = service.EvaluateMarketSnapshot(stale);
Ensure(staleResult.Status == DataQualityStatus.Stale && !staleResult.CanUseForAnswer, "Stale snapshot must fail closed.");

var staleSource = Snapshot(now.AddSeconds(-2).UtcDateTime);
staleSource.SourceLastModified = new DateTime(2026,8,11,10,20,0,DateTimeKind.Unspecified);
var staleSourceResult = service.EvaluateMarketSnapshot(staleSource);
Ensure(staleSourceResult.Status == DataQualityStatus.Stale && !staleSourceResult.CanUseForAnswer,
    "Fresh cache hydration must not hide a stale Tehran source timestamp.");

var invalid = Snapshot(now.AddSeconds(-2).UtcDateTime);
invalid.MinPrice = 1300;
invalid.MaxPrice = 1200;
var invalidResult = service.EvaluateMarketSnapshot(invalid);
Ensure(invalidResult.Status == DataQualityStatus.Invalid && invalidResult.Issues.Any(x => x.Code == "price.min_gt_max"), "Inconsistent prices must fail.");

var warning = Snapshot(now.AddSeconds(-2).UtcDateTime);
warning.OrderBook[0].BuyPrice = 1100;
warning.OrderBook[0].SellPrice = 1000;
var warningResult = service.EvaluateMarketSnapshot(warning);
Ensure(warningResult.Status == DataQualityStatus.Warning && warningResult.CanUseForAnswer, "Warning-only snapshot should remain usable.");

var sourceResult = await service.EvaluateCanonicalSourcesAsync(default);
Ensure(sourceResult.Sources.Count == CanonicalSourceCatalog.All.Count, "All canonical sources must be assessed.");
Ensure(sourceResult.Sources.Single(x => x.Code == "cash-market").Status == DataQualityStatus.Valid, "Fresh current source must pass.");

Console.WriteLine("TSEAI Data Quality & Freshness smoke tests PASS");

static MarketSymbolSnapshot Snapshot(DateTime updatedAt) => new()
{
    InsCode = 46348559193224090,
    SymbolCode = "IRO1IKCO0001",
    Symbol = "خودرو",
    SymbolName = "ایران خودرو",
    TradeCount = 100,
    TradeVolume = 1_000_000,
    TradeValue = 1_200_000_000,
    ClosingPrice = 1200,
    LastPrice = 1210,
    MinPrice = 1150,
    MaxPrice = 1250,
    FirstPrice = 1180,
    YesterdayPrice = 1170,
    SnapshotUpdatedAtUtc = updatedAt,
    OrderBook = Enumerable.Range(1,5).Select(i => new OrderBookLevel
    {
        Level=i, BuyPrice=1190-i, SellPrice=1210+i, BuyCount=10, SellCount=10, BuyVolume=10000, SellVolume=10000
    }).ToArray()
};

file sealed class FixedClock(DateTimeOffset now) : IClock { public DateTimeOffset UtcNow => now; }

file sealed class FakeCanonicalGateway : ICanonicalDataGateway
{
    public Task<CanonicalDataStatus> GetStatusAsync(CancellationToken ct)
    {
        var nowLocal = new DateTime(2026,8,11,10,29,50,DateTimeKind.Unspecified);
        IReadOnlyList<CanonicalSourceTableStatus> sources = CanonicalSourceCatalog.All.Select(x =>
            new CanonicalSourceTableStatus(x.Code,x.TableName,true,100,nowLocal)).ToArray();
        return Task.FromResult(new CanonicalDataStatus(true,"AI",sources));
    }
    public Task<CanonicalInstrument?> FindInstrumentAsync(string key,CancellationToken ct)=>Task.FromResult<CanonicalInstrument?>(null);
    public Task<CanonicalCashMarketSnapshot?> GetCashMarketAsync(string id,CancellationToken ct)=>Task.FromResult<CanonicalCashMarketSnapshot?>(null);
    public Task<IReadOnlyList<CanonicalOrderBookLevel>> GetOrderBookAsync(string id,CancellationToken ct)=>Task.FromResult<IReadOnlyList<CanonicalOrderBookLevel>>([]);
    public Task<CanonicalClientTypeSnapshot?> GetClientTypeAsync(string id,CancellationToken ct)=>Task.FromResult<CanonicalClientTypeSnapshot?>(null);
    public Task<IReadOnlyList<CanonicalMarketSummaryRow>> GetMarketSummaryAsync(int? id,CancellationToken ct)=>Task.FromResult<IReadOnlyList<CanonicalMarketSummaryRow>>([]);
    public Task<IReadOnlyList<CanonicalMarketIndex>> GetMarketIndexesAsync(int? id,CancellationToken ct)=>Task.FromResult<IReadOnlyList<CanonicalMarketIndex>>([]);
}
