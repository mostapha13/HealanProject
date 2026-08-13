using TSEAI.Application.Analytics;
using TSEAI.Application.DataQuality;
using TSEAI.Application.Entities;
using TSEAI.Application.StructuredQuery;
using TSEAI.Shared.Application.Market;

namespace TSEAI.Application.Chat;

public enum EvidenceKind { StructuredFact, KnowledgeDocument, DeterministicAnalytics, StructuredQuery, FilterExecution }
public enum EvidenceAuthority { CanonicalMarketSnapshot, QdrantGroundedEvidence, DeterministicCalculation, CanonicalQueryResult, FilterEngine }

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
                new Dictionary<string, object?>{{"explanation",structuredQuery.Plan.Explanation},{"scanned",structuredQuery.Scanned},{"quality_rejected",structuredQuery.QualityRejected},{"matched",structuredQuery.Matched}}));
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
            foreach(System.Text.RegularExpressions.Match match in System.Text.RegularExpressions.Regex.Matches(answer,@"\[(?<label>[MKQAF]\d+)\]"))
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
            ["trade_volume"] = s.TradeVolume,["trade_value"] = s.TradeValue,["trade_count"] = s.TradeCount,["pe"] = s.PE,["eps"] = s.Eps
        };
        var instrumentId = entity?.Selected?.InstrumentId ?? s.SymbolCode;
        list.Add(new($"market:{s.SymbolCode ?? s.InsCode.ToString()}:{suffix ?? "current"}",$"M{i}",EvidenceKind.StructuredFact,EvidenceAuthority.CanonicalMarketSnapshot,
            "SQL_AI/Redis","Cashmarket:"+(s.SymbolCode ?? s.InsCode.ToString()),$"Snapshot بازار {s.Symbol}",observed,null,null,instrumentId,s.Symbol,quality?.Status.ToString(),claims));
    }

    private static void AddAnalytics(MarketSymbolSnapshot s, SymbolMarketAnalytics analytics, ref int i, List<ChatEvidenceItem> list)
    {
        i++;
        var claims = new Dictionary<string, object?>();
        if (analytics.TradingPower.BuyerPower.Availability == AnalyticsAvailability.Available) claims["buyer_power"] = analytics.TradingPower.BuyerPower.Value;
        if (analytics.OrderBook.Imbalance.Availability == AnalyticsAvailability.Available) claims["orderbook_imbalance"] = analytics.OrderBook.Imbalance.Value;
        if (analytics.Volume.VolumeVsBaseVolume.Availability == AnalyticsAvailability.Available) claims["volume_vs_base"] = analytics.Volume.VolumeVsBaseVolume.Value;
        list.Add(new($"analytics:{s.SymbolCode ?? s.InsCode.ToString()}:v1",$"A{i}",EvidenceKind.DeterministicAnalytics,EvidenceAuthority.DeterministicCalculation,
            "TSEAI.Analytics","DeterministicMarketAnalytics:v1",$"تحلیل قطعی {s.Symbol}",DateTimeOffset.UtcNow,null,null,s.SymbolCode,s.Symbol,null,claims));
    }
}
