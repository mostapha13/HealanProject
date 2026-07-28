namespace NegareshAI.Api.Contracts;

public sealed record DashboardResponse(
    string OrganizationName,
    string CurrentUserId,
    int DocumentCount,
    int ActiveContractCount,
    int PendingReviewCount,
    int ReadyDocumentCount,
    IReadOnlyList<DocumentListItemResponse> RecentDocuments,
    IReadOnlyList<DashboardActivityResponse> RecentActivities,
    IReadOnlyList<DashboardDeadlineResponse> UpcomingDeadlines);

public sealed record DashboardActivityResponse(
    string Action,
    string EntityType,
    string? EntityId,
    DateTime CreatedAtUtc);

public sealed record DashboardDeadlineResponse(
    Guid ContractId,
    string Subject,
    DateOnly EndDate,
    int DaysRemaining);

public sealed record RuntimeSettingResponse(
    Guid Id,
    string Category,
    string Key,
    string ValueJson,
    int Version,
    bool IsActive,
    DateTime UpdatedAtUtc);

public sealed record UpsertRuntimeSettingRequest(
    string ValueJson,
    bool IsActive = true);
