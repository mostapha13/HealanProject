using TSEAI.Domain.Alerts;

namespace TSEAI.Application.Alerts;

public sealed record AlertRuleListItem(
    Guid Id,
    Guid SavedFilterId,
    string SavedFilterName,
    string Name,
    bool IsEnabled,
    int CooldownSeconds,
    bool FollowLatestVersion,
    int? PinnedFilterVersion,
    int EffectiveFilterVersion,
    DateTime? LastTriggeredAtUtc,
    DateTime UpdatedAtUtc);

public sealed record CreateAlertRuleRequest(
    Guid SavedFilterId,
    string? Name,
    int? CooldownSeconds,
    bool FollowLatestVersion = true,
    int? PinnedFilterVersion = null,
    bool IsEnabled = true);

public sealed record UpdateAlertRuleRequest(
    string? Name,
    bool? IsEnabled,
    int? CooldownSeconds,
    bool? FollowLatestVersion,
    int? PinnedFilterVersion);

public sealed record AlertEventDto(
    Guid Id,
    Guid AlertRuleId,
    string AlertName,
    Guid SavedFilterId,
    string FilterName,
    int FilterVersion,
    long InsCode,
    string? SymbolCode,
    string Symbol,
    string SymbolName,
    string Message,
    decimal LastPrice,
    decimal ClosingPrice,
    long TradeVolume,
    decimal TradeValue,
    int TradingDate,
    DateTime TriggeredAtUtc,
    DateTime? ReadAtUtc);

public interface IAlertRepository
{
    Task<int> CountActiveAsync(string ownerUserId, CancellationToken ct);
    Task<AlertRule?> GetAsync(string ownerUserId, Guid id, bool includeFilter, CancellationToken ct);
    Task<IReadOnlyList<AlertRule>> ListAsync(string ownerUserId, CancellationToken ct);
    Task<bool> SavedFilterOwnedAsync(string ownerUserId, Guid savedFilterId, CancellationToken ct);
    Task<int?> GetSavedFilterLatestVersionAsync(string ownerUserId, Guid savedFilterId, CancellationToken ct);
    Task<bool> SavedFilterVersionExistsAsync(string ownerUserId, Guid savedFilterId, int version, CancellationToken ct);
    Task AddAsync(AlertRule rule, CancellationToken ct);
    Task<IReadOnlyList<AlertEvent>> ListEventsAsync(string ownerUserId, int take, bool unreadOnly, CancellationToken ct);
    Task<AlertEvent?> GetEventAsync(string ownerUserId, Guid id, CancellationToken ct);
    Task SaveChangesAsync(CancellationToken ct);
}
