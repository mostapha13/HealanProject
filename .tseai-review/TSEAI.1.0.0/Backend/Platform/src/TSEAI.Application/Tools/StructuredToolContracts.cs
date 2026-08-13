using TSEAI.Application.Data.Canonical;
using TSEAI.Application.DataQuality;
using TSEAI.Application.Entities;
using TSEAI.Shared.Application.Market;

namespace TSEAI.Application.Tools;

public static class StructuredToolNames
{
    public const string ResolveEntity = "entity.resolve";
    public const string GetSymbolSnapshot = "market.get_symbol_snapshot";
    public const string GetOrderBook = "market.get_order_book";
    public const string GetClientType = "market.get_client_type";
    public const string GetMarketSummary = "market.get_summary";
    public const string GetMarketIndexes = "market.get_indexes";
    public const string GetInstrument = "market.get_instrument";
    public const string GetTradingPower = "market.get_trading_power";
    public const string GetOrderBookAnalysis = "market.get_orderbook_analysis";
    public const string GetVolumeAnalysis = "market.get_volume_analysis";
    public const string GetPricePosition = "market.get_price_position";
    public const string GetMarketBreadth = "market.get_market_breadth";
    public const string GetSymbolAnalytics = "market.get_symbol_analytics";

    public static readonly IReadOnlySet<string> Allowed = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
    {
        ResolveEntity, GetSymbolSnapshot, GetOrderBook, GetClientType, GetMarketSummary, GetMarketIndexes, GetInstrument,
        GetTradingPower, GetOrderBookAnalysis, GetVolumeAnalysis, GetPricePosition, GetMarketBreadth, GetSymbolAnalytics
    };
}

public sealed record StructuredToolDescriptor(string Name, string Category, string Description, bool RequiresEntity, bool QualityGated);
public sealed record StructuredToolCall(string Tool, string? Entity, int? MarketId = null);
public sealed record StructuredToolResult(bool Success, string Tool, object? Data, string? Error, EntityResolution? Entity = null, MarketDataQualityReport? Quality = null);

public interface IStructuredToolGateway
{
    IReadOnlyList<StructuredToolDescriptor> Describe();
    Task<StructuredToolResult> ExecuteAsync(StructuredToolCall call, CancellationToken ct);
}
