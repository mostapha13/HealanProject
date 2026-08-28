using TSEAI.Application.Analytics;
using TSEAI.Application.DataQuality;
using TSEAI.Application.Entities;
using TSEAI.Application.StructuredQuery;
using TSEAI.Shared.Application.Market;

namespace TSEAI.Application.Chat;

public enum EvidenceKind { StructuredFact, KnowledgeDocument, DeterministicAnalytics, StructuredQuery, FilterExecution, CanonicalReference }
public enum EvidenceAuthority { CanonicalMarketSnapshot, QdrantGroundedEvidence, DeterministicCalculation, CanonicalQueryResult, FilterEngine, CanonicalReferenceData }

public sealed record ChatEvidenceItem(
    string EvidenceId,
    string CitationLabel,
    EvidenceKind Kind,
    EvidenceAuthority Authority,
    string SourceType,
    string SourceId,
    string Title,
    DateTimeOffset? ObservedAtUtc,
    string? PublishedAt,
    string? Url,
    string? InstrumentId,
    string? Symbol,
    string? QualityStatus,
    IReadOnlyDictionary<string, object?> Claims);

public sealed record EvidenceValidationReport(
    bool IsValid,
    int EvidenceCount,
    int StructuredCount,
    int KnowledgeCount,
    int AnalyticsCount,
    IReadOnlyList<string> Issues);

public interface IChatEvidenceEngine
{
    IReadOnlyList<ChatEvidenceItem> Build(
        ChatIntent intent,
        MarketSymbolSnapshot? market,
        MarketDataQualityReport? quality,
        SymbolMarketAnalytics? analytics,
        IReadOnlyList<KnowledgeHit> knowledge,
        StructuredQueryExecutionResult? structuredQuery = null,
        MarketComparisonResult? comparison = null,
        object? filter = null,
        EntityResolution? entity = null);

    EvidenceValidationReport Validate(
        ChatIntent intent,
        IReadOnlyList<ChatEvidenceItem> evidence,
        bool hasMarket,
        bool hasKnowledge,
        bool hasStructuredQuery,
        bool hasComparison,
        string? answer = null);
}

public sealed class ChatEvidenceEngine : IChatEvidenceEngine
{
    public IReadOnlyList<ChatEvidenceItem> Build(
        ChatIntent intent,
        MarketSymbolSnapshot? market,
        MarketDataQualityReport? quality,
        SymbolMarketAnalytics? analytics,
        IReadOnlyList<KnowledgeHit> knowledge,
        StructuredQueryExecutionResult? structuredQuery = null,
        MarketComparisonResult? comparison = null,
        object? filter = null,
        EntityResolution? entity = null)
    {
        var list = new List<ChatEvidenceItem>();
        var m = 0; var k = 0; var a = 0; var q = 0; var f = 0;

        if (comparison is not null)
        {
            AddMarket(comparison.Primary, quality, entity, ref m, list, "primary");
            AddMarket(comparison.Secondary, null, null, ref m, list, "secondary");
            AddAnalytics(comparison.Primary, comparison.PrimaryAnalytics, ref a, list);
            AddAnalytics(comparison.Secondary, comparison.SecondaryAnalytics, ref a, list);
        }
        else
        {
            if (market is not null) AddMarket(market, quality, entity, ref m, list, null);
            if (market is not null && analytics is not null) AddAnalytics(market, analytics, ref a, list);
        }

        foreach (var hit in knowledge.Take(8))
        {
            var c = hit.Citation;
            if (string.IsNullOrWhiteSpace(c.SourceId) || string.Equals(c.SourceId, "unknown", StringComparison.OrdinalIgnoreCase)) continue;
            k++;
            var claims = new Dictionary<string, object?>
            {
                ["score"] = hit.Score,
                ["excerpt"] = hit.Text.Length <= 500 ? hit.Text : hit.Text[..500] + "…"
            };
            foreach (var key in new[]{"vector_score","bm25_score","phrase_score","entity_score","freshness_score","chunk_index","route","authority","content_hash","content_type_id"})
                if (hit.Metadata.TryGetValue(key, out var v)) claims[key] = v;
            list.Add(new($"knowledge:{c.SourceType}:{c.SourceId}:{k}",$"K{k}",EvidenceKind.KnowledgeDocument,EvidenceAuthority.QdrantGroundedEvidence,
                c.SourceType,c.SourceId,c.Title,null,c.PublishedAt,c.Url,null,c.Symbol,null,claims));
        }

        if (structuredQuery?.Success == true && structuredQuery.Plan is not null)
        {
            q++;
            list.Add(new("structured-query:execution","Q1",EvidenceKind.StructuredQuery,EvidenceAuthority.CanonicalQueryResult,
                "TSEAI.StructuredQuery","current-market-universe","اجرای Query ساختاریافته",null,null,null,null,null,null,
                new Dictionary<string, object?>{{"explanation",structuredQuery.Plan.Explanation},{"scanned",structuredQuery.Scanned},{"quality_rejected",structuredQuery.QualityRejected},{"matched",structuredQuery.Matched},
                    {"observed_at_utc",structuredQuery.ObservedAtUtc},{"used_latest_available_snapshot",structuredQuery.UsedLatestAvailableSnapshot}}));
            foreach (var row in structuredQuery.Results.Take(20))
            {
                q++;
                list.Add(new($"structured-query:{row.SymbolCode ?? row.InsCode.ToString()}:{q}",$"Q{q}",EvidenceKind.StructuredQuery,EvidenceAuthority.CanonicalQueryResult,
                    "SQL_AI","Cashmarket+CanonicalAnalytics",row.SymbolName,null,null,null,row.SymbolCode,row.Symbol,row.QualityStatus,
                    row.Metrics.ToDictionary(x => x.Key, x => (object?)x.Value)));
            }
        }

        if (filter is not null)
        {
            f++;
            list.Add(new("filter:conversation-current","F1",EvidenceKind.FilterExecution,EvidenceAuthority.FilterEngine,
                "TSEAI.FilterEngine","conversation-filter","نتیجه اجرای فیلتر",null,null,null,null,null,null,
                new Dictionary<string, object?>{{"result_type",filter.GetType().Name}}));
        }

        return list;
    }

    public EvidenceValidationReport Validate(ChatIntent intent, IReadOnlyList<ChatEvidenceItem> evidence, bool hasMarket, bool hasKnowledge, bool hasStructuredQuery, bool hasComparison, string? answer = null)
    {
        var issues = new List<string>();
        if (evidence.Select(x => x.EvidenceId).Distinct(StringComparer.Ordinal).Count() != evidence.Count) issues.Add("duplicate_evidence_id");
        if (evidence.Select(x => x.CitationLabel).Distinct(StringComparer.Ordinal).Count() != evidence.Count) issues.Add("duplicate_citation_label");
        if ((hasMarket || hasComparison) && !evidence.Any(x => x.Kind == EvidenceKind.StructuredFact)) issues.Add("structured_evidence_missing");
        if (hasKnowledge && !evidence.Any(x => x.Kind == EvidenceKind.KnowledgeDocument)) issues.Add("knowledge_evidence_missing");
        if (hasStructuredQuery && !evidence.Any(x => x.Kind == EvidenceKind.StructuredQuery)) issues.Add("structured_query_evidence_missing");
        if (evidence.Any(x => string.IsNullOrWhiteSpace(x.SourceId) || string.Equals(x.SourceId,"unknown",StringComparison.OrdinalIgnoreCase))) issues.Add("unknown_source_id");
        if(!string.IsNullOrWhiteSpace(answer))
        {
            var labels=new HashSet<string>(evidence.Select(x=>x.CitationLabel),StringComparer.Ordinal);
            foreach(System.Text.RegularExpressions.Match match in System.Text.RegularExpressions.Regex.Matches(answer,@"\[(?<label>[MKQAFR]\d+)\]"))
                if(!labels.Contains(match.Groups["label"].Value)) issues.Add("citation_label_without_evidence:"+match.Groups["label"].Value);
        }
        return new(issues.Count == 0,evidence.Count,evidence.Count(x=>x.Kind==EvidenceKind.StructuredFact),evidence.Count(x=>x.Kind==EvidenceKind.KnowledgeDocument),evidence.Count(x=>x.Kind==EvidenceKind.DeterministicAnalytics),issues);
    }

    private static void AddMarket(MarketSymbolSnapshot s, MarketDataQualityReport? quality, EntityResolution? entity, ref int i, List<ChatEvidenceItem> list, string? suffix)
    {
        i++;
        var observed = quality?.Freshness.ObservedAtUtc ?? new DateTimeOffset(DateTime.SpecifyKind(s.SnapshotUpdatedAtUtc, DateTimeKind.Utc));
        var claims = new Dictionary<string, object?>
        {
            ["last_price"] = s.LastPrice,["closing_price"] = s.ClosingPrice,["last_price_percent"] = s.LastPricePercent,
            ["last_price_change"] = s.PriceChange,["closing_price_change"] = s.ClosingPriceChange,["closing_price_percent"] = s.ClosingPricePercent,
            ["first_price"] = s.FirstPrice,["yesterday_price"] = s.YesterdayPrice,["high_price"] = s.MaxPrice,["low_price"] = s.MinPrice,
            ["trade_volume"] = s.TradeVolume,["trade_value"] = s.TradeValue,["trade_count"] = s.TradeCount,["pe"] = s.PE,["eps"] = s.Eps,
            ["market_value"] = s.MarketValue,["effect_on_index"] = s.EffectOnIndex,["raw_min_value"] = s.RawMinValue,["raw_max_value"] = s.RawMaxValue,
            ["best_bid_price"] = s.BestBidPrice,["best_bid_quantity"] = s.BestBidQuantity,["best_bid_count"] = s.BestBidCount,
            ["best_ask_price"] = s.BestAskPrice,["best_ask_quantity"] = s.BestAskQuantity,["best_ask_count"] = s.BestAskCount,
            ["market_name"] = s.MarketName,["market_type_name"] = s.MarketTypeName,["board_name"] = s.BoardName,
            ["industry_name"] = s.IndustryName,["industry_sub_name"] = s.IndustrySubName,["state_name"] = s.StateName,
            ["average_trade_price"] = s.TradeVolume<=0?null:s.TradeValue/s.TradeVolume,
            ["average_trade_value"] = s.TradeCount<=0?null:s.TradeValue/s.TradeCount,
            ["average_trade_volume"] = s.TradeCount<=0?null:(decimal)s.TradeVolume/s.TradeCount,
            ["turnover_ratio_percent"] = s.MarketValue is null or <=0?null:s.TradeValue/s.MarketValue.Value*100m,
            ["orderbook_updated_at"] = s.OrderBookUpdatedAt,
            ["orderbook_source_collected_at"] = s.OrderBookSourceCollectedAt
        };
        foreach(var level in s.OrderBook.Where(x=>x.Level is >=1 and <=5))
        {
            claims[$"orderbook_l{level.Level}_best_limit_counter"] = level.BestLimitCounter;
            claims[$"orderbook_l{level.Level}_bid_price"] = level.BuyPrice;
            claims[$"orderbook_l{level.Level}_bid_volume"] = level.BuyVolume;
            claims[$"orderbook_l{level.Level}_bid_count"] = level.BuyCount;
            claims[$"orderbook_l{level.Level}_ask_price"] = level.SellPrice;
            claims[$"orderbook_l{level.Level}_ask_volume"] = level.SellVolume;
            claims[$"orderbook_l{level.Level}_ask_count"] = level.SellCount;
        }
        var instrumentId = entity?.Selected?.InstrumentId ?? s.SymbolCode;
        list.Add(new($"market:{s.SymbolCode ?? s.InsCode.ToString()}:{suffix ?? "current"}",$"M{i}",EvidenceKind.StructuredFact,EvidenceAuthority.CanonicalMarketSnapshot,
            "SQL_AI/Redis","Cashmarket+OrderBookCurrent:"+(s.SymbolCode ?? s.InsCode.ToString()),$"Snapshot بازار و اردربوک {s.Symbol}",observed,null,null,instrumentId,s.Symbol,quality?.Status.ToString(),claims));
    }

    private static void AddAnalytics(MarketSymbolSnapshot s, SymbolMarketAnalytics analytics, ref int i, List<ChatEvidenceItem> list)
    {
        i++;
        var claims = new Dictionary<string, object?>();
        if (analytics.TradingPower.BuyerPower.Availability == AnalyticsAvailability.Available) claims["buyer_power"] = analytics.TradingPower.BuyerPower.Value;
        if (analytics.OrderBook.Imbalance.Availability == AnalyticsAvailability.Available) claims["orderbook_imbalance"] = analytics.OrderBook.Imbalance.Value;
        if (analytics.OrderBook.BestBidPrice.Availability == AnalyticsAvailability.Available) claims["best_bid_price"] = analytics.OrderBook.BestBidPrice.Value;
        if (analytics.OrderBook.BestBidVolume.Availability == AnalyticsAvailability.Available) claims["best_bid_volume"] = analytics.OrderBook.BestBidVolume.Value;
        if (analytics.OrderBook.BestAskPrice.Availability == AnalyticsAvailability.Available) claims["best_ask_price"] = analytics.OrderBook.BestAskPrice.Value;
        if (analytics.OrderBook.BestAskVolume.Availability == AnalyticsAvailability.Available) claims["best_ask_volume"] = analytics.OrderBook.BestAskVolume.Value;
        if (analytics.OrderBook.Spread.Availability == AnalyticsAvailability.Available) claims["spread"] = analytics.OrderBook.Spread.Value;
        if (analytics.OrderBook.SpreadPercent.Availability == AnalyticsAvailability.Available) claims["spread_percent"] = analytics.OrderBook.SpreadPercent.Value;
        if (analytics.OrderBook.TotalBidVolume.Availability == AnalyticsAvailability.Available) claims["total_bid_volume"] = analytics.OrderBook.TotalBidVolume.Value;
        if (analytics.OrderBook.TotalAskVolume.Availability == AnalyticsAvailability.Available) claims["total_ask_volume"] = analytics.OrderBook.TotalAskVolume.Value;
        if (analytics.Volume.VolumeVsBaseVolume.Availability == AnalyticsAvailability.Available) claims["volume_vs_base"] = analytics.Volume.VolumeVsBaseVolume.Value;
        list.Add(new($"analytics:{s.SymbolCode ?? s.InsCode.ToString()}:v1",$"A{i}",EvidenceKind.DeterministicAnalytics,EvidenceAuthority.DeterministicCalculation,
            "TSEAI.Analytics","DeterministicMarketAnalytics:v1",$"تحلیل قطعی {s.Symbol}",DateTimeOffset.UtcNow,null,null,s.SymbolCode,s.Symbol,null,claims));
    }
}
