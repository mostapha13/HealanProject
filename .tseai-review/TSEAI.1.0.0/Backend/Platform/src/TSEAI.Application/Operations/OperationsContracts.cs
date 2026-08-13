namespace TSEAI.Application.Operations;
public sealed record OperationsOverview(
    long QuestionsToday, long QuestionsThisMonth, long ActiveUsersToday,
    long SavedFilters, long EnabledAlerts, long OpenIncidents,
    IReadOnlyDictionary<string,long> IntentBreakdown,
    IReadOnlyDictionary<string,long> FailureBreakdown);
public sealed record AuditItem(Guid Id, Guid? UserId, string Action, string ResourceType,
    string? ResourceId, string Outcome, string CorrelationId, DateTime CreatedAtUtc);
public sealed record IncidentItem(Guid Id,string Component,string Severity,string Code,string Message,
    string Status,int Occurrences,DateTime FirstSeenUtc,DateTime LastSeenUtc);
public sealed record RuntimeHealth(string Component,string Status,string? Detail,DateTime CheckedAtUtc);
public sealed record AdminSettingUpdate(string Key,string Value);
