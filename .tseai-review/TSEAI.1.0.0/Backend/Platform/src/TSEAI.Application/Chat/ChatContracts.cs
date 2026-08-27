using TSEAI.Application.Temporal;
using TSEAI.Application.Analytics;
using TSEAI.Application.Entities;
using TSEAI.Application.DataQuality;
using TSEAI.Application.StructuredQuery;
using TSEAI.Application.Chat.Context;
using TSEAI.Shared.Application.Market;

namespace TSEAI.Application.Chat;

public enum ChatIntent { Knowledge, MarketSymbol, MarketComparison, MarketFilter, StructuredQuery, Hybrid, Clarification }

public sealed record ChatPlan(
    ChatIntent Intent,
    string? Symbol,
    string? KnowledgeQuery,
    double Confidence,
    string? Clarification,
    IReadOnlyList<string> Reasons,
    IReadOnlyList<string>? RequestedFields = null,
    string? SecondarySymbol = null);

public interface IAiChatPlanner
{
    Task<ChatPlan> PlanAsync(string question, CancellationToken ct);
}

public sealed record KnowledgeCitation(string SourceType,string SourceId,string Title,string? Url,string? Symbol,string? PublishedAt);
public sealed record KnowledgeHit(string Text,double Score,KnowledgeCitation Citation,IReadOnlyDictionary<string,object?> Metadata);
public sealed record KnowledgeSearchResult(IReadOnlyList<KnowledgeHit> Hits,string Query);
public sealed record KnowledgeRetrievalContext(string? Symbol=null,string? DateFrom=null,string? DateTo=null,bool? LatestFirst=null,int? ContentTypeId=null,string? Route=null,int? LanguageId=1,string? SourceType=null,bool? CurrentOnly=null);

public interface IKnowledgeRetriever
{
    Task<KnowledgeSearchResult> RetrieveAsync(string query,int limit,KnowledgeRetrievalContext context,CancellationToken ct);
    Task<IReadOnlyList<KnowledgeSearchResult>> RetrieveManyAsync(
        IReadOnlyList<string> queries,int limit,KnowledgeRetrievalContext context,CancellationToken ct);
}

public sealed record ChatOrchestrationRequest(
    string Question,
    string ConversationId,
    int Page,
    int PageSize,
    string? SortBy,
    bool SortDescending);

public sealed record ChatToolTrace(string Tool,string Status,int DurationMs,string? Detail);

public sealed record MarketComparisonResult(
    MarketSymbolSnapshot Primary,
    MarketSymbolSnapshot Secondary,
    SymbolMarketAnalytics PrimaryAnalytics,
    SymbolMarketAnalytics SecondaryAnalytics);

public sealed record ChatOrchestrationResult(
    string Type,
    string Answer,
    string ConversationId,
    ChatIntent Intent,
    double Confidence,
    MarketSymbolSnapshot? Market,
    object? Filter,
    IReadOnlyList<KnowledgeHit> Knowledge,
    IReadOnlyList<KnowledgeCitation> Citations,
    IReadOnlyList<ChatToolTrace> Trace,
    string? Clarification,
    TemporalResolution Temporal,
    EntityResolution? Entity = null,
    MarketDataQualityReport? DataQuality = null,
    SymbolMarketAnalytics? Analytics = null,
    StructuredQueryExecutionResult? StructuredQuery = null,
    MarketComparisonResult? Comparison = null,
    ConversationContextState? ConversationContext = null,
    ConversationTemporalTurn? TemporalConversation = null,
    IReadOnlyList<ChatEvidenceItem>? Evidence = null,
    EvidenceValidationReport? EvidenceValidation = null,
    AnswerValidationReport? AnswerValidation = null);
