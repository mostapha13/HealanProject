using TSEAI.Application.Data.Canonical;
using TSEAI.Application.Analytics;
using TSEAI.Application.DataQuality;
using TSEAI.Application.Entities;
using TSEAI.Application.Market;
using TSEAI.Application.Tools;

namespace TSEAI.Infrastructure.Tools;

public sealed class SecureStructuredToolGateway(
    ICanonicalDataGateway canonical,
    IMarketSnapshotQuery market,
    IPersianEntityResolver entities,
    IDataQualityService quality,
    IMarketAnalyticsEngine analytics) : IStructuredToolGateway
{
    private static readonly IReadOnlyList<StructuredToolDescriptor> Registry = new[]
    {
        new StructuredToolDescriptor(StructuredToolNames.ResolveEntity,"entity","Resolve a Persian entity against authoritative SQL AI reference data.",true,false),
        new StructuredToolDescriptor(StructuredToolNames.GetSymbolSnapshot,"market","Get the current market snapshot for one resolved instrument.",true,true),
        new StructuredToolDescriptor(StructuredToolNames.GetOrderBook,"market","Get canonical order-book levels for one instrument.",true,false),
        new StructuredToolDescriptor(StructuredToolNames.GetClientType,"market","Get canonical حقیقی/حقوقی snapshot for one instrument.",true,false),
        new StructuredToolDescriptor(StructuredToolNames.GetMarketSummary,"market","Get canonical market summary rows.",false,false),
        new StructuredToolDescriptor(StructuredToolNames.GetMarketIndexes,"market","Get canonical current index rows.",false,false),
        new StructuredToolDescriptor(StructuredToolNames.GetInstrument,"market","Get canonical instrument reference data.",true,false),
        new StructuredToolDescriptor(StructuredToolNames.GetTradingPower,"analytics","Calculate deterministic حقیقی/حقوقی trading-power metrics.",true,true),
        new StructuredToolDescriptor(StructuredToolNames.GetOrderBookAnalysis,"analytics","Calculate deterministic order-book spread and imbalance metrics.",true,true),
        new StructuredToolDescriptor(StructuredToolNames.GetVolumeAnalysis,"analytics","Calculate deterministic volume metrics from available source facts.",true,true),
        new StructuredToolDescriptor(StructuredToolNames.GetPricePosition,"analytics","Calculate deterministic session price-position metrics.",true,true),
        new StructuredToolDescriptor(StructuredToolNames.GetMarketBreadth,"analytics","Calculate deterministic market breadth from current index facts.",false,false),
        new StructuredToolDescriptor(StructuredToolNames.GetSymbolAnalytics,"analytics","Calculate the complete deterministic analytics package for one symbol.",true,true),
    };

    public IReadOnlyList<StructuredToolDescriptor> Describe() => Registry;

    public async Task<StructuredToolResult> ExecuteAsync(StructuredToolCall call, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(call.Tool) || !StructuredToolNames.Allowed.Contains(call.Tool))
            return new(false, call.Tool ?? "", null, "structured_tool_not_allowed");

        EntityResolution? entity = null;
        if (RequiresEntity(call.Tool))
        {
            if (string.IsNullOrWhiteSpace(call.Entity) || call.Entity.Length > 256)
                return new(false, call.Tool, null, "entity_required");
            entity = await entities.ResolveAsync(call.Entity, new EntityResolveOptions([EntityKind.Instrument, EntityKind.MarketIndex]), ct);
            if (entity.Status != EntityResolutionStatus.Resolved || entity.Selected is null)
                return new(false, call.Tool, null, entity.Status == EntityResolutionStatus.Ambiguous ? "entity_ambiguous" : "entity_not_found", entity);
        }

        switch (call.Tool.ToLowerInvariant())
        {
            case StructuredToolNames.ResolveEntity:
                return new(true, call.Tool, entity, null, entity);

            case StructuredToolNames.GetSymbolSnapshot:
            {
                if (entity!.Selected!.Kind != EntityKind.Instrument) return new(false, call.Tool, null, "instrument_required", entity);
                var lookup = entity.Selected.InsCode?.ToString() ?? entity.Selected.InstrumentId ?? entity.Selected.Symbol ?? entity.Selected.CanonicalId;
                var snapshot = await market.FindAsync(lookup, ct);
                if (snapshot is null) return new(false, call.Tool, null, "market_snapshot_not_found", entity);
                var report = quality.EvaluateMarketSnapshot(snapshot);
                if (!report.CanUseForAnswer) return new(false, call.Tool, snapshot, "market_data_quality_rejected", entity, report);
                return new(true, call.Tool, snapshot, null, entity, report);
            }

            case StructuredToolNames.GetInstrument:
            {
                if (entity!.Selected!.Kind != EntityKind.Instrument) return new(false, call.Tool, null, "instrument_required", entity);
                var key = entity.Selected.InstrumentId ?? entity.Selected.InsCode?.ToString() ?? entity.Selected.Symbol ?? entity.Selected.CanonicalId;
                var row = await canonical.FindInstrumentAsync(key, ct);
                return row is null ? new(false, call.Tool, null, "instrument_not_found", entity) : new(true, call.Tool, row, null, entity);
            }

            case StructuredToolNames.GetOrderBook:
            {
                if (entity!.Selected!.Kind != EntityKind.Instrument) return new(false, call.Tool, null, "instrument_required", entity);
                var id = entity.Selected.InstrumentId ?? entity.Selected.CanonicalId;
                var rows = await canonical.GetOrderBookAsync(id, ct);
                return new(rows.Count > 0, call.Tool, rows, rows.Count == 0 ? "order_book_not_found" : null, entity);
            }

            case StructuredToolNames.GetClientType:
            {
                if (entity!.Selected!.Kind != EntityKind.Instrument) return new(false, call.Tool, null, "instrument_required", entity);
                var id = entity.Selected.InstrumentId ?? entity.Selected.CanonicalId;
                var row = await canonical.GetClientTypeAsync(id, ct);
                return row is null ? new(false, call.Tool, null, "client_type_not_found", entity) : new(true, call.Tool, row, null, entity);
            }


            case StructuredToolNames.GetTradingPower:
            case StructuredToolNames.GetOrderBookAnalysis:
            case StructuredToolNames.GetVolumeAnalysis:
            case StructuredToolNames.GetPricePosition:
            case StructuredToolNames.GetSymbolAnalytics:
            {
                if (entity!.Selected!.Kind != EntityKind.Instrument) return new(false, call.Tool, null, "instrument_required", entity);
                var lookup = entity.Selected.InsCode?.ToString() ?? entity.Selected.InstrumentId ?? entity.Selected.Symbol ?? entity.Selected.CanonicalId;
                var snapshot = await market.FindAsync(lookup, ct);
                if (snapshot is null) return new(false, call.Tool, null, "market_snapshot_not_found", entity);
                var report = quality.EvaluateMarketSnapshot(snapshot);
                if (!report.CanUseForAnswer) return new(false, call.Tool, snapshot, "market_data_quality_rejected", entity, report);
                object data = call.Tool.ToLowerInvariant() switch
                {
                    StructuredToolNames.GetTradingPower => analytics.AnalyzeTradingPower(snapshot.ClientType),
                    StructuredToolNames.GetOrderBookAnalysis => analytics.AnalyzeOrderBook(snapshot.OrderBook, snapshot.LastPrice),
                    StructuredToolNames.GetVolumeAnalysis => analytics.AnalyzeVolume(snapshot),
                    StructuredToolNames.GetPricePosition => analytics.AnalyzePricePosition(snapshot),
                    _ => analytics.AnalyzeSymbol(snapshot)
                };
                return new(true, call.Tool, data, null, entity, report);
            }

            case StructuredToolNames.GetMarketBreadth:
            {
                var indexes = await canonical.GetMarketIndexesAsync(call.MarketId, ct);
                return indexes.Count == 0
                    ? new(false, call.Tool, null, "market_breadth_not_found")
                    : new(true, call.Tool, analytics.AnalyzeMarketBreadth(indexes), null);
            }

            case StructuredToolNames.GetMarketSummary:
                return new(true, call.Tool, await canonical.GetMarketSummaryAsync(call.MarketId, ct), null);

            case StructuredToolNames.GetMarketIndexes:
                return new(true, call.Tool, await canonical.GetMarketIndexesAsync(call.MarketId, ct), null);

            default:
                return new(false, call.Tool, null, "structured_tool_not_allowed");
        }
    }

    private static bool RequiresEntity(string tool) => tool is StructuredToolNames.ResolveEntity or StructuredToolNames.GetSymbolSnapshot or StructuredToolNames.GetOrderBook or StructuredToolNames.GetClientType or StructuredToolNames.GetInstrument or StructuredToolNames.GetTradingPower or StructuredToolNames.GetOrderBookAnalysis or StructuredToolNames.GetVolumeAnalysis or StructuredToolNames.GetPricePosition or StructuredToolNames.GetSymbolAnalytics;
}
