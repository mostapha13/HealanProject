using System.Text.Json;
using TSEAI.Application.Filters.Compatibility;
using TSEAI.Application.Filters.Conversation;
using TSEAI.Application.Usage;
using TSEAI.Domain.Filters;
using TSEAI.Domain.Settings;

namespace TSEAI.Application.Filters.Saved;

public sealed class SavedFilterService(
    ISavedFilterRepository repository,
    ISystemSettingService settings,
    IConversationFilterStateStore conversationState,
    IConversationFilterLock conversationLock,
    TsetmcCompatibilityService compatibility)
{
    private const int DefaultMaxSavedFilters = 50;

    public async Task<IReadOnlyList<SavedFilterListItem>> ListAsync(
        string ownerUserId,
        string? search,
        bool? favoritesOnly,
        CancellationToken ct)
    {
        var rows = await repository.ListAsync(ownerUserId, search, favoritesOnly, ct);
        return rows.Select(ToListItem).ToArray();
    }

    public async Task<SavedFilterDetails?> GetAsync(string ownerUserId, Guid id, CancellationToken ct)
    {
        var row = await repository.GetAsync(ownerUserId, id, includeVersions: true, ct);
        return row is null ? null : ToDetails(row);
    }

    public async Task<SavedFilterDetails> CreateAsync(string ownerUserId, CreateSavedFilterRequest request, CancellationToken ct)
    {
        var name = ValidateName(request.Name);
        await EnsureCapacityAsync(ownerUserId, ct);
        var normalized = NormalizeName(name);
        if (await repository.NameExistsAsync(ownerUserId, normalized, null, ct))
            throw new InvalidOperationException("فیلتر ذخیره‌شده‌ای با این نام از قبل وجود دارد.");

        var source = await ResolveSourceAsync(ownerUserId, request.ConversationId, request.TsetmcCode, ct);
        var imported = ImportRequired(source);
        var now = DateTime.UtcNow;
        var dependencies = JsonSerializer.Serialize(imported.Dependencies);
        var row = new SavedFilter
        {
            OwnerUserId = ownerUserId,
            Name = name,
            NormalizedName = normalized,
            Description = NormalizeOptional(request.Description, 500),
            IsFavorite = request.IsFavorite,
            CurrentTsetmcCode = imported.CanonicalTsetmcCode,
            CurrentPersianExplanation = imported.PersianExplanation,
            DependenciesJson = dependencies,
            CurrentVersion = 1,
            CreatedAtUtc = now,
            UpdatedAtUtc = now
        };
        row.Versions.Add(NewVersion(row.Id, 1, imported.CanonicalTsetmcCode, imported.PersianExplanation,
            dependencies, request.ConversationId, "create", request.Description, ownerUserId, now));
        await repository.AddAsync(row, ct);
        await repository.SaveChangesAsync(ct);
        return ToDetails(row);
    }

    public async Task<SavedFilterDetails> UpdateMetadataAsync(
        string ownerUserId,
        Guid id,
        UpdateSavedFilterRequest request,
        CancellationToken ct)
    {
        var row = await RequireAsync(ownerUserId, id, includeVersions: true, ct);
        if (request.Name is not null)
        {
            var name = ValidateName(request.Name);
            var normalized = NormalizeName(name);
            if (!string.Equals(normalized, row.NormalizedName, StringComparison.Ordinal) &&
                await repository.NameExistsAsync(ownerUserId, normalized, id, ct))
                throw new InvalidOperationException("فیلتر ذخیره‌شده‌ای با این نام از قبل وجود دارد.");
            row.Name = name;
            row.NormalizedName = normalized;
        }
        if (request.Description is not null) row.Description = NormalizeOptional(request.Description, 500);
        if (request.IsFavorite.HasValue) row.IsFavorite = request.IsFavorite.Value;
        row.UpdatedAtUtc = DateTime.UtcNow;
        await repository.SaveChangesAsync(ct);
        return ToDetails(row);
    }

    public async Task<SavedFilterDetails> CreateVersionAsync(
        string ownerUserId,
        Guid id,
        CreateSavedFilterVersionRequest request,
        CancellationToken ct)
    {
        var row = await RequireAsync(ownerUserId, id, includeVersions: true, ct);
        var source = await ResolveSourceAsync(ownerUserId, request.ConversationId, request.TsetmcCode, ct);
        var imported = ImportRequired(source);
        if (string.Equals(imported.CanonicalTsetmcCode, row.CurrentTsetmcCode, StringComparison.Ordinal))
            return ToDetails(row);

        var now = DateTime.UtcNow;
        var dependencies = JsonSerializer.Serialize(imported.Dependencies);
        var nextVersion = row.Versions.Count == 0 ? row.CurrentVersion + 1 : row.Versions.Max(x => x.Version) + 1;
        row.CurrentTsetmcCode = imported.CanonicalTsetmcCode;
        row.CurrentPersianExplanation = imported.PersianExplanation;
        row.DependenciesJson = dependencies;
        row.CurrentVersion = nextVersion;
        row.UpdatedAtUtc = now;
        row.Versions.Add(NewVersion(row.Id, nextVersion, imported.CanonicalTsetmcCode, imported.PersianExplanation,
            dependencies, request.ConversationId, "update", request.ChangeNote, ownerUserId, now));
        await repository.SaveChangesAsync(ct);
        return ToDetails(row);
    }

    public async Task<SavedFilterDetails> RestoreVersionAsync(
        string ownerUserId,
        Guid id,
        int targetVersion,
        string? note,
        CancellationToken ct)
    {
        var row = await RequireAsync(ownerUserId, id, includeVersions: true, ct);
        var target = row.Versions.SingleOrDefault(x => x.Version == targetVersion)
                     ?? throw new KeyNotFoundException("نسخه موردنظر پیدا نشد.");
        if (string.Equals(target.TsetmcCode, row.CurrentTsetmcCode, StringComparison.Ordinal)) return ToDetails(row);

        var now = DateTime.UtcNow;
        var nextVersion = row.Versions.Max(x => x.Version) + 1;
        row.CurrentTsetmcCode = target.TsetmcCode;
        row.CurrentPersianExplanation = target.PersianExplanation;
        row.DependenciesJson = target.DependenciesJson;
        row.CurrentVersion = nextVersion;
        row.UpdatedAtUtc = now;
        row.Versions.Add(NewVersion(row.Id, nextVersion, target.TsetmcCode, target.PersianExplanation,
            target.DependenciesJson, null, "restore", note ?? $"Restore version {targetVersion}", ownerUserId, now));
        await repository.SaveChangesAsync(ct);
        return ToDetails(row);
    }

    public async Task<SavedFilterDetails> DuplicateAsync(string ownerUserId, Guid id, string? name, CancellationToken ct)
    {
        var source = await RequireAsync(ownerUserId, id, includeVersions: false, ct);
        var proposed = string.IsNullOrWhiteSpace(name) ? source.Name + " - کپی" : name;
        proposed = await UniqueNameAsync(ownerUserId, proposed, ct);
        return await CreateAsync(ownerUserId,
            new CreateSavedFilterRequest(proposed, source.Description, null, source.CurrentTsetmcCode, source.IsFavorite), ct);
    }

    public async Task DeleteAsync(string ownerUserId, Guid id, CancellationToken ct)
    {
        var row = await RequireAsync(ownerUserId, id, includeVersions: false, ct);
        row.IsDeleted = true;
        row.DeletedAtUtc = DateTime.UtcNow;
        row.UpdatedAtUtc = row.DeletedAtUtc.Value;
        await repository.SaveChangesAsync(ct);
    }

    public async Task<ConversationFilterState> LoadIntoConversationAsync(
        string ownerUserId,
        Guid id,
        string conversationId,
        CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(conversationId)) throw new ArgumentException("Conversation id is required.");
        var row = await RequireAsync(ownerUserId, id, includeVersions: false, ct);
        await using var lease = await conversationLock.TryAcquireAsync(ownerUserId, conversationId, ct);
        if (lease is null) throw new InvalidOperationException("این مکالمه در حال پردازش است؛ دوباره تلاش کنید.");

        var state = await conversationState.GetAsync(ownerUserId, conversationId, ct);
        var revisions = state.Revisions.Take(state.Cursor + 1).ToList();
        var version = revisions.Count == 0 ? 1 : revisions.Max(x => x.Version) + 1;
        revisions.Add(new ConversationFilterRevision(version, row.CurrentTsetmcCode, "load_saved", $"Load saved filter: {row.Name}", DateTimeOffset.UtcNow));
        if (revisions.Count > 100) revisions.RemoveRange(0, revisions.Count - 100);
        var next = new ConversationFilterState(conversationId, revisions, revisions.Count - 1);
        await conversationState.SaveAsync(ownerUserId, next, ct);
        return next;
    }

    private async Task EnsureCapacityAsync(string ownerUserId, CancellationToken ct)
    {
        var limit = await settings.GetIntAsync(SettingKeys.MaxSavedFiltersPerUser, DefaultMaxSavedFilters, ct);
        if (limit < 0) limit = 0;
        var count = await repository.CountActiveAsync(ownerUserId, ct);
        if (count >= limit) throw new SavedFilterLimitReachedException(limit);
    }

    private async Task<SavedFilter> RequireAsync(string ownerUserId, Guid id, bool includeVersions, CancellationToken ct) =>
        await repository.GetAsync(ownerUserId, id, includeVersions, ct)
        ?? throw new KeyNotFoundException("فیلتر ذخیره‌شده پیدا نشد.");

    private async Task<string> ResolveSourceAsync(string ownerUserId, string? conversationId, string? code, CancellationToken ct)
    {
        if (!string.IsNullOrWhiteSpace(code)) return code.Trim();
        if (string.IsNullOrWhiteSpace(conversationId))
            throw new InvalidOperationException("کد فیلتر یا شناسه مکالمه باید ارسال شود.");
        var state = await conversationState.GetAsync(ownerUserId, conversationId.Trim(), ct);
        if (string.IsNullOrWhiteSpace(state.CurrentCode)) throw new InvalidOperationException("در این مکالمه فیلتر فعالی وجود ندارد.");
        return state.CurrentCode;
    }

    private FilterImportResult ImportRequired(string source)
    {
        var imported = compatibility.Import(source);
        if (!imported.Valid) throw new InvalidOperationException("فیلتر معتبر نیست: " + string.Join("; ", imported.Errors));
        return imported;
    }

    private async Task<string> UniqueNameAsync(string ownerUserId, string proposed, CancellationToken ct)
    {
        var baseName = ValidateName(proposed);
        var candidate = baseName;
        for (var i = 2; i <= 999; i++)
        {
            if (!await repository.NameExistsAsync(ownerUserId, NormalizeName(candidate), null, ct)) return candidate;
            candidate = $"{baseName} ({i})";
        }
        throw new InvalidOperationException("امکان تولید نام یکتا برای کپی فیلتر وجود ندارد.");
    }

    private static SavedFilterVersion NewVersion(Guid filterId, int version, string code, string explanation,
        string dependenciesJson, string? conversationId, string changeType, string? note, string userId, DateTime now) =>
        new()
        {
            SavedFilterId = filterId,
            Version = version,
            TsetmcCode = code,
            PersianExplanation = explanation,
            DependenciesJson = dependenciesJson,
            SourceConversationId = NormalizeOptional(conversationId, 100),
            ChangeType = changeType,
            ChangeNote = NormalizeOptional(note, 500),
            CreatedByUserId = userId,
            CreatedAtUtc = now
        };

    private static string ValidateName(string value)
    {
        var name = string.Join(' ', (value ?? string.Empty).Split(' ', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries));
        if (name.Length < 2 || name.Length > 80) throw new ArgumentException("نام فیلتر باید بین ۲ تا ۸۰ کاراکتر باشد.");
        return name;
    }

    private static string NormalizeName(string value) => ValidateName(value).ToUpperInvariant();

    private static string? NormalizeOptional(string? value, int max)
    {
        if (string.IsNullOrWhiteSpace(value)) return null;
        var trimmed = value.Trim();
        return trimmed.Length <= max ? trimmed : trimmed[..max];
    }

    private static SavedFilterListItem ToListItem(SavedFilter x) =>
        new(x.Id, x.Name, x.Description, x.IsFavorite, x.CurrentTsetmcCode, x.CurrentPersianExplanation, x.CurrentVersion, x.UpdatedAtUtc);

    private static SavedFilterDetails ToDetails(SavedFilter x) =>
        new(x.Id, x.Name, x.Description, x.IsFavorite, x.CurrentTsetmcCode, x.CurrentPersianExplanation,
            x.DependenciesJson, x.CurrentVersion, x.CreatedAtUtc, x.UpdatedAtUtc,
            x.Versions.OrderByDescending(v => v.Version)
                .Select(v => new SavedFilterVersionDto(v.Version, v.TsetmcCode, v.PersianExplanation, v.ChangeType,
                    v.ChangeNote, v.SourceConversationId, v.CreatedAtUtc)).ToArray());
}

public sealed class SavedFilterLimitReachedException(int limit)
    : InvalidOperationException($"حداکثر تعداد فیلترهای ذخیره‌شده ({limit}) تکمیل شده است.")
{
    public int Limit { get; } = limit;
}
