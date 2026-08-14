using TSEAI.Application.Chat.Routing;
using TSEAI.Application.Entities;
using TSEAI.Application.Temporal;

namespace TSEAI.Application.Chat.Context;

public sealed record ConversationEntityReference(
    string CanonicalId,
    string DisplayName,
    string? Symbol,
    string? InstrumentId,
    long? InsCode,
    string? Isin,
    EntityKind Kind)
{
    public string BestLookup => Symbol ?? InstrumentId ?? InsCode?.ToString() ?? CanonicalId;
    public static ConversationEntityReference From(EntityCandidateMatch x)
        => new(x.CanonicalId,x.DisplayName,x.Symbol,x.InstrumentId,x.InsCode,x.Isin,x.Kind);
}

public sealed record ConversationTemporalReference(
    string OriginalText,
    string? StartJalali,
    string? EndJalali,
    string? StartGregorian,
    string? EndGregorian,
    string Kind);

public sealed record ConversationReference(
    string Kind,
    string Topic,
    string? SubjectName,
    string? SubjectRole,
    IReadOnlyList<string> RelatedSubjects);

public sealed record ConversationMemoryTurn(
    string Question,
    string EffectiveQuestion,
    string Answer,
    string AnswerType,
    string? SubjectName,
    DateTimeOffset CreatedAtUtc);

public sealed record ConversationContextState(
    string ConversationId,
    ConversationEntityReference? PrimaryEntity,
    ConversationEntityReference? SecondaryEntity,
    ChatIntent? LastIntent,
    ChatCapabilityRoute? LastRoute,
    ConversationTemporalReference? LastTemporal,
    string? LastQuestion,
    long Revision,
    DateTimeOffset UpdatedAtUtc,
    ConversationReference? ActiveReference = null,
    IReadOnlyList<ConversationMemoryTurn>? RecentTurns = null)
{
    public static ConversationContextState Empty(string conversationId)
        => new(conversationId,null,null,null,null,null,null,0,DateTimeOffset.UtcNow,null,[]);
}

public enum ConversationFollowUpKind
{
    None = 0,
    Market = 1,
    Knowledge = 2,
    Hybrid = 3,
    Comparison = 4,
    Correction = 5
}

public sealed record ConversationRouteHint(
    ConversationFollowUpKind Kind,
    ChatIntent? PreferredIntent,
    string? PrimaryEntity,
    string? SecondaryEntity,
    bool ContextApplied,
    IReadOnlyList<string> Reasons);

public sealed record ConversationTurnContext(
    string OriginalQuestion,
    string EffectiveQuestion,
    ConversationContextState Previous,
    ConversationRouteHint RouteHint,
    ConversationEntityReference? PrimaryEntity,
    ConversationEntityReference? SecondaryEntity,
    bool IsCorrection,
    bool IsComparison)
{
    public string AuditSummary => $"applied={RouteHint.ContextApplied};kind={RouteHint.Kind};primary={PrimaryEntity?.BestLookup};secondary={SecondaryEntity?.BestLookup};reasons={string.Join(',',RouteHint.Reasons)}";
}

public interface IConversationContextStore
{
    Task<ConversationContextState> GetAsync(string subject,string conversationId,CancellationToken ct);
    Task SaveAsync(string subject,ConversationContextState state,CancellationToken ct);
    Task ClearAsync(string subject,string conversationId,CancellationToken ct);
}

public interface IConversationContextService
{
    Task<ConversationTurnContext> PrepareAsync(string subject,string conversationId,string question,TemporalResolution temporal,CancellationToken ct);
    Task<ConversationContextState> RecordAsync(
        string subject,
        string conversationId,
        string question,
        ChatIntent intent,
        ChatCapabilityRoute route,
        TemporalResolution temporal,
        EntityResolution? primary,
        EntityResolution? secondary,
        CancellationToken ct,
        string? answer = null,
        string answerType = "chat");
    Task<ConversationContextState> RecordReferenceAsync(
        string subject,
        string conversationId,
        string originalQuestion,
        string effectiveQuestion,
        string answer,
        CanonicalReferenceAnswer reference,
        TemporalResolution temporal,
        CancellationToken ct);
}

public sealed record ConversationRewriteRequest(
    string Question,
    ConversationReference? ActiveReference,
    IReadOnlyList<ConversationMemoryTurn> RecentTurns);

public sealed record ConversationRewriteResult(
    string StandaloneQuestion,
    bool ContextApplied,
    string? Reason);

public interface IConversationQueryRewriter
{
    Task<ConversationRewriteResult?> RewriteAsync(ConversationRewriteRequest request,CancellationToken ct);
}
