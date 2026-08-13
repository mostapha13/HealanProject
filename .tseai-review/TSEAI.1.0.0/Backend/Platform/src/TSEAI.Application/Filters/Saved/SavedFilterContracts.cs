using TSEAI.Domain.Filters;

namespace TSEAI.Application.Filters.Saved;

public sealed record SavedFilterListItem(
    Guid Id,
    string Name,
    string? Description,
    bool IsFavorite,
    string TsetmcCode,
    string PersianExplanation,
    int CurrentVersion,
    DateTime UpdatedAtUtc);

public sealed record SavedFilterVersionDto(
    int Version,
    string TsetmcCode,
    string PersianExplanation,
    string ChangeType,
    string? ChangeNote,
    string? SourceConversationId,
    DateTime CreatedAtUtc);

public sealed record SavedFilterDetails(
    Guid Id,
    string Name,
    string? Description,
    bool IsFavorite,
    string TsetmcCode,
    string PersianExplanation,
    string DependenciesJson,
    int CurrentVersion,
    DateTime CreatedAtUtc,
    DateTime UpdatedAtUtc,
    IReadOnlyList<SavedFilterVersionDto> Versions);

public sealed record CreateSavedFilterRequest(
    string Name,
    string? Description,
    string? ConversationId,
    string? TsetmcCode,
    bool IsFavorite = false);

public sealed record UpdateSavedFilterRequest(
    string? Name,
    string? Description,
    bool? IsFavorite);

public sealed record CreateSavedFilterVersionRequest(
    string? ConversationId,
    string? TsetmcCode,
    string? ChangeNote);

public sealed record LoadSavedFilterRequest(string ConversationId);

public interface ISavedFilterRepository
{
    Task<int> CountActiveAsync(string ownerUserId, CancellationToken ct);
    Task<bool> NameExistsAsync(string ownerUserId, string normalizedName, Guid? exceptId, CancellationToken ct);
    Task<IReadOnlyList<SavedFilter>> ListAsync(string ownerUserId, string? search, bool? favoritesOnly, CancellationToken ct);
    Task<SavedFilter?> GetAsync(string ownerUserId, Guid id, bool includeVersions, CancellationToken ct);
    Task<SavedFilterVersion?> GetVersionAsync(string ownerUserId, Guid id, int version, CancellationToken ct);
    Task AddAsync(SavedFilter filter, CancellationToken ct);
    Task SaveChangesAsync(CancellationToken ct);
}
