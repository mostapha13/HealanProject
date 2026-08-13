namespace TSEAI.Shared.Application.Market;

public sealed class MarketSymbolSnapshot
{
    public long InsCode { get; set; }
    public int TradingDate { get; set; }
    public int EventTime { get; set; }

    // Internal/canonical instrument identity used by TSEAI outside the filter adapter.
    public string? SymbolCode { get; set; }
    public string Symbol { get; set; } = "";
    public string SymbolName { get; set; } = "";
    public string? CompanyName { get; set; }
    public int? MarketTypeId { get; set; }
    public long? Investment { get; set; }

    // Exact market-watch text fields used only for TSETMC filter compatibility: (l18)/(l30).
    public string TsetmcSymbol { get; set; } = "";
    public string TsetmcName { get; set; } = "";

    public long TradeCount { get; set; }
    public long TradeVolume { get; set; }
    public decimal TradeValue { get; set; }
    public decimal ClosingPrice { get; set; }
    public decimal LastPrice { get; set; }
    public decimal PriceChange { get; set; }
    public decimal MinPrice { get; set; }
    public decimal MaxPrice { get; set; }
    public decimal FirstPrice { get; set; }
    public decimal YesterdayPrice { get; set; }

    // If the source supplies TSETMC-calculated percentage/change columns, keep them verbatim.
    // Otherwise V1 falls back to deterministic calculation from prices.
    public decimal? SourceLastPricePercent { get; set; }
    public decimal? SourceClosingPriceChange { get; set; }
    public decimal? SourceClosingPricePercent { get; set; }

    public decimal? Eps { get; set; }
    public decimal? PE { get; set; }
    public decimal? MinAllowedPrice { get; set; }
    public decimal? MaxAllowedPrice { get; set; }
    public long? SharesCount { get; set; }
    public decimal? MarketValue { get; set; }
    public long? BaseVolume { get; set; }
    public string? IndustryCode { get; set; }
    public decimal? OpenPositions { get; set; }
    public decimal? NavCancellation { get; set; }
    public ClientTypeSnapshot ClientType { get; set; } = new();
    public OrderBookLevel[] OrderBook { get; set; } = Enumerable.Range(1, 5).Select(i => new OrderBookLevel { Level = i }).ToArray();
    public DateTime? SourceLastModified { get; set; }
    public DateTime SnapshotUpdatedAtUtc { get; set; } = DateTime.UtcNow;

    public decimal LastPricePercent => SourceLastPricePercent ?? (YesterdayPrice == 0 ? 0 : (LastPrice - YesterdayPrice) * 100m / YesterdayPrice);
    public decimal ClosingPriceChange => SourceClosingPriceChange ?? (ClosingPrice - YesterdayPrice);
    public decimal ClosingPricePercent => SourceClosingPricePercent ?? (YesterdayPrice == 0 ? 0 : (ClosingPrice - YesterdayPrice) * 100m / YesterdayPrice);
}

public sealed class ClientTypeSnapshot
{
    public long BuyCountI { get; set; }
    public long BuyCountN { get; set; }
    public long BuyIVolume { get; set; }
    public long BuyNVolume { get; set; }
    public long SellCountI { get; set; }
    public long SellCountN { get; set; }
    public long SellIVolume { get; set; }
    public long SellNVolume { get; set; }
}

public sealed class OrderBookLevel
{
    public int Level { get; set; }
    public decimal BuyPrice { get; set; }
    public long BuyCount { get; set; }
    public long BuyVolume { get; set; }
    public decimal SellPrice { get; set; }
    public long SellCount { get; set; }
    public long SellVolume { get; set; }
}

public sealed class InstrumentReference
{
    public required string InstrumentId { get; set; }
    public required string SymbolCode { get; set; }
    public required string Symbol { get; set; }
    public string? SymbolName { get; set; }
    public string? CompanyName { get; set; }
    public int? MarketTypeId { get; set; }
    public long? Investment { get; set; }
    public long InsCode { get; set; }
}
