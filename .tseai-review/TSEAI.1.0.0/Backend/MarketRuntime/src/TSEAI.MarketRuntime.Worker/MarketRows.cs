namespace TSEAI.MarketRuntime.Worker;

public sealed class CurrentMarketRow
{
    public long InsCode { get; set; }
    public int TradingDate { get; set; }
    public int EventTime { get; set; }
    public string Symbol { get; set; } = "";       // TSETMC lVal18AFC / (l18)
    public string SymbolName { get; set; } = "";   // TSETMC lVal30 / (l30)
    public long TradeCount { get; set; }
    public long TradeVolume { get; set; }
    public decimal TradeValue { get; set; }
    public decimal ClosingPrice { get; set; }
    public decimal LastPrice { get; set; }
    public decimal PriceChange { get; set; }
    public decimal? LastPricePercent { get; set; }
    public decimal? ClosingPriceChange { get; set; }
    public decimal? ClosingPricePercent { get; set; }
    public decimal MinPrice { get; set; }
    public decimal MaxPrice { get; set; }
    public decimal FirstPrice { get; set; }
    public decimal YesterdayPrice { get; set; }
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
    public DateTime? LastModified { get; set; }
}

public sealed class ClientTypeRow
{
    public long InsCode { get; set; }
    public DateTime? LastModified { get; set; }
    public long BuyCountI { get; set; }
    public long BuyCountN { get; set; }
    public long BuyIVolume { get; set; }
    public long BuyNVolume { get; set; }
    public long SellCountI { get; set; }
    public long SellCountN { get; set; }
    public long SellIVolume { get; set; }
    public long SellNVolume { get; set; }
}

public sealed class OrderBookRow
{
    public long InsCode { get; set; }
    public DateTime? LastModified { get; set; }
    public int Level { get; set; }
    public decimal BuyPrice { get; set; }
    public long BuyCount { get; set; }
    public long BuyVolume { get; set; }
    public decimal SellPrice { get; set; }
    public long SellCount { get; set; }
    public long SellVolume { get; set; }
}
