namespace TSEAI.Application.Operations;
public sealed record OperationsOverview(
    long QuestionsToday, long QuestionsThisMonth, long ActiveUsersToday,
    long SavedFilters, long EnabledAlerts, long OpenIncidents,
    IReadOnlyDictionary<string,long> IntentBreakdown,
    IReadOnlyDictionary<string,long> FailureBreakdown);
public sealed record AuditItem(Guid Id, Guid? UserId, string Action, string ResourceType,
    string? ResourceId, string Outcome, string CorrelationId, DateTime CreatedAtUtc, string? MetadataJson);
public sealed record IncidentItem(Guid Id,string Component,string Severity,string Code,string Message,
    string Status,int Occurrences,DateTime FirstSeenUtc,DateTime LastSeenUtc);
public sealed record RuntimeHealth(string Component,string Status,string? Detail,DateTime CheckedAtUtc);
public sealed record AdminSettingUpdate(string Key,string Value);

public sealed record ChatExecutionStepAudit(
    int Sequence,
    string Tool,
    string Status,
    int DurationMs,
    string? Detail);

public sealed record ChatExecutionAudit(
    string QuestionHashSha256,
    string ConversationId,
    string ResultType,
    string Intent,
    double Confidence,
    string? PrimaryEntity,
    string TemporalKind,
    string? TemporalStartJalali,
    int EvidenceCount,
    int CitationCount,
    string? AnswerValidationStatus,
    bool? AnswerValid,
    IReadOnlyList<ChatExecutionStepAudit> Steps)
{
    public const string HttpContextItemKey = "TSEAI.ChatExecutionAudit";
}
