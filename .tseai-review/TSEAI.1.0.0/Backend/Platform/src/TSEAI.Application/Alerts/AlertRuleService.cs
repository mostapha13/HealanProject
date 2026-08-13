using TSEAI.Application.Usage;
using TSEAI.Domain.Alerts;
using TSEAI.Domain.Settings;

namespace TSEAI.Application.Alerts;

public sealed class AlertRuleService(IAlertRepository repository, ISystemSettingService settings)
{
    private const int DefaultMaxAlerts = 20;
    private const int DefaultCooldownSeconds = 300;
    private const int DefaultMaxCooldownSeconds = 86400;

    public async Task<IReadOnlyList<AlertRuleListItem>> ListAsync(string ownerUserId, CancellationToken ct)
    {
        var rows = await repository.ListAsync(ownerUserId, ct);
        return rows.Select(ToListItem).ToArray();
    }

    public async Task<AlertRuleListItem?> GetAsync(string ownerUserId, Guid id, CancellationToken ct)
    {
        var row = await repository.GetAsync(ownerUserId, id, includeFilter: true, ct);
        return row is null ? null : ToListItem(row);
    }

    public async Task<AlertRuleListItem> CreateAsync(string ownerUserId, CreateAlertRuleRequest request, CancellationToken ct)
    {
        await EnsureCapacityAsync(ownerUserId, ct);
        if (!await repository.SavedFilterOwnedAsync(ownerUserId, request.SavedFilterId, ct))
            throw new KeyNotFoundException("فیلتر ذخیره‌شده پیدا نشد.");

        var latest = await repository.GetSavedFilterLatestVersionAsync(ownerUserId, request.SavedFilterId, ct)
                     ?? throw new KeyNotFoundException("نسخه فیلتر ذخیره‌شده پیدا نشد.");
        var followLatest = request.FollowLatestVersion;
        int? pinned = followLatest ? null : request.PinnedFilterVersion ?? latest;
        if (pinned.HasValue && !await repository.SavedFilterVersionExistsAsync(ownerUserId, request.SavedFilterId, pinned.Value, ct))
            throw new ArgumentException("نسخه انتخاب‌شده فیلتر وجود ندارد.");

        var cooldown = await NormalizeCooldownAsync(request.CooldownSeconds, ct);
        var now = DateTime.UtcNow;
        var rule = new AlertRule
        {
            OwnerUserId = ownerUserId,
            SavedFilterId = request.SavedFilterId,
            Name = NormalizeName(request.Name, "هشدار فیلتر"),
            IsEnabled = request.IsEnabled,
            CooldownSeconds = cooldown,
            FollowLatestVersion = followLatest,
            PinnedFilterVersion = pinned,
            CreatedAtUtc = now,
            UpdatedAtUtc = now
        };
        await repository.AddAsync(rule, ct);
        await repository.SaveChangesAsync(ct);
        var loaded = await repository.GetAsync(ownerUserId, rule.Id, includeFilter: true, ct) ?? rule;
        return ToListItem(loaded);
    }

    public async Task<AlertRuleListItem> UpdateAsync(string ownerUserId, Guid id, UpdateAlertRuleRequest request, CancellationToken ct)
    {
        var row = await repository.GetAsync(ownerUserId, id, includeFilter: true, ct)
                  ?? throw new KeyNotFoundException("هشدار پیدا نشد.");
        if (request.Name is not null) row.Name = NormalizeName(request.Name, row.Name);
        if (request.IsEnabled == true && (row.SavedFilter is null || row.SavedFilter.IsDeleted))
            throw new InvalidOperationException("فیلتر ذخیره‌شده این هشدار حذف شده و هشدار قابل فعال‌سازی نیست.");
        if (request.IsEnabled.HasValue) row.IsEnabled = request.IsEnabled.Value;
        if (request.CooldownSeconds.HasValue) row.CooldownSeconds = await NormalizeCooldownAsync(request.CooldownSeconds.Value, ct);

        if (request.FollowLatestVersion.HasValue)
        {
            row.FollowLatestVersion = request.FollowLatestVersion.Value;
            if (row.FollowLatestVersion) row.PinnedFilterVersion = null;
        }
        if (!row.FollowLatestVersion && request.PinnedFilterVersion.HasValue)
        {
            if (!await repository.SavedFilterVersionExistsAsync(ownerUserId, row.SavedFilterId, request.PinnedFilterVersion.Value, ct))
                throw new ArgumentException("نسخه انتخاب‌شده فیلتر وجود ندارد.");
            row.PinnedFilterVersion = request.PinnedFilterVersion.Value;
        }
        if (!row.FollowLatestVersion && row.PinnedFilterVersion is null)
            row.PinnedFilterVersion = await repository.GetSavedFilterLatestVersionAsync(ownerUserId, row.SavedFilterId, ct)
                                      ?? throw new KeyNotFoundException("نسخه فیلتر پیدا نشد.");

        row.UpdatedAtUtc = DateTime.UtcNow;
        await repository.SaveChangesAsync(ct);
        return ToListItem(row);
    }

    public async Task DeleteAsync(string ownerUserId, Guid id, CancellationToken ct)
    {
        var row = await repository.GetAsync(ownerUserId, id, includeFilter: false, ct)
                  ?? throw new KeyNotFoundException("هشدار پیدا نشد.");
        row.IsDeleted = true;
        row.IsEnabled = false;
        row.DeletedAtUtc = DateTime.UtcNow;
        row.UpdatedAtUtc = DateTime.UtcNow;
        await repository.SaveChangesAsync(ct);
    }

    public async Task<IReadOnlyList<AlertEventDto>> ListEventsAsync(string ownerUserId, int take, bool unreadOnly, CancellationToken ct)
    {
        take = Math.Clamp(take, 1, 200);
        var rows = await repository.ListEventsAsync(ownerUserId, take, unreadOnly, ct);
        return rows.Select(ToEvent).ToArray();
    }

    public async Task<AlertEventDto> MarkReadAsync(string ownerUserId, Guid eventId, CancellationToken ct)
    {
        var row = await repository.GetEventAsync(ownerUserId, eventId, ct)
                  ?? throw new KeyNotFoundException("رویداد هشدار پیدا نشد.");
        row.ReadAtUtc ??= DateTime.UtcNow;
        await repository.SaveChangesAsync(ct);
        return ToEvent(row);
    }

    private async Task EnsureCapacityAsync(string ownerUserId, CancellationToken ct)
    {
        var limit = await settings.GetIntAsync(SettingKeys.MaxAlertsPerUser, DefaultMaxAlerts, ct);
        if (limit < 0) limit = 0;
        var count = await repository.CountActiveAsync(ownerUserId, ct);
        if (count >= limit) throw new AlertLimitReachedException(limit);
    }

    private async Task<int> NormalizeCooldownAsync(int? requested, CancellationToken ct)
    {
        var fallback = await settings.GetIntAsync(SettingKeys.AlertDefaultCooldownSeconds, DefaultCooldownSeconds, ct);
        var max = await settings.GetIntAsync(SettingKeys.AlertMaxCooldownSeconds, DefaultMaxCooldownSeconds, ct);
        var value = requested ?? fallback;
        if (value < 0) throw new ArgumentException("Cooldown نمی‌تواند منفی باشد.");
        return Math.Min(value, Math.Max(0, max));
    }

    private static string NormalizeName(string? value, string fallback)
    {
        var name = string.Join(' ', (value ?? fallback).Split(' ', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries));
        if (name.Length is < 2 or > 100) throw new ArgumentException("نام هشدار باید بین ۲ تا ۱۰۰ کاراکتر باشد.");
        return name;
    }

    private static AlertRuleListItem ToListItem(AlertRule x)
    {
        var effectiveVersion = x.FollowLatestVersion ? x.SavedFilter?.CurrentVersion ?? 0 : x.PinnedFilterVersion ?? 0;
        return new(x.Id, x.SavedFilterId, x.SavedFilter?.Name ?? "", x.Name, x.IsEnabled, x.CooldownSeconds,
            x.FollowLatestVersion, x.PinnedFilterVersion, effectiveVersion, x.LastTriggeredAtUtc, x.UpdatedAtUtc);
    }

    private static AlertEventDto ToEvent(AlertEvent x) =>
        new(x.Id, x.AlertRuleId, x.AlertName, x.SavedFilterId, x.FilterName, x.FilterVersion, x.InsCode,
            x.SymbolCode, x.Symbol, x.SymbolName, x.Message, x.LastPrice, x.ClosingPrice, x.TradeVolume,
            x.TradeValue, x.TradingDate, x.TriggeredAtUtc, x.ReadAtUtc);
}

public sealed class AlertLimitReachedException(int limit)
    : InvalidOperationException($"حداکثر تعداد هشدارهای ذخیره‌شده ({limit}) تکمیل شده است.")
{
    public int Limit { get; } = limit;
}
