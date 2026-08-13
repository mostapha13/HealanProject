using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using TSEAI.Application.Filters.Compatibility;
using TSEAI.Application.Filters.Parsing;
using TSEAI.Application.Filters.Validation;
using TSEAI.Infrastructure.Persistence;
using TSEAI.Domain.Settings;

namespace TSEAI.Alert.Worker;

public sealed class AlertRuleCache(
    IServiceScopeFactory scopes,
    IOptions<AlertEngineOptions> options,
    ILogger<AlertRuleCache> log)
{
    private readonly SemaphoreSlim _gate = new(1, 1);
    private DateTime _expiresAtUtc = DateTime.MinValue;
    private IReadOnlyList<AlertRuleSnapshot> _items = [];
    private int _refreshSeconds = Math.Max(1, options.Value.RuleRefreshSeconds);

    public async Task<IReadOnlyList<AlertRuleSnapshot>> GetAsync(CancellationToken ct)
    {
        if (DateTime.UtcNow < _expiresAtUtc) return _items;
        await _gate.WaitAsync(ct);
        try
        {
            if (DateTime.UtcNow < _expiresAtUtc) return _items;
            _items = await LoadAsync(ct);
            _expiresAtUtc = DateTime.UtcNow.AddSeconds(_refreshSeconds);
            return _items;
        }
        finally { _gate.Release(); }
    }

    public void Invalidate() => _expiresAtUtc = DateTime.MinValue;

    private async Task<IReadOnlyList<AlertRuleSnapshot>> LoadAsync(CancellationToken ct)
    {
        await using var scope = scopes.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var configuredRefresh = await db.SystemSettings.AsNoTracking().Where(x => x.Key == SettingKeys.AlertRuleRefreshSeconds).Select(x => x.Value).SingleOrDefaultAsync(ct);
        if (int.TryParse(configuredRefresh, out var refresh)) _refreshSeconds = Math.Clamp(refresh, 1, 300);

        var rows = await db.AlertRules.AsNoTracking().Include(x => x.SavedFilter)
            .Where(x => x.IsEnabled && !x.IsDeleted && x.SavedFilter != null && !x.SavedFilter.IsDeleted)
            .ToListAsync(ct);

        var pinnedFilterIds = rows.Where(x => !x.FollowLatestVersion && x.PinnedFilterVersion.HasValue)
            .Select(x => x.SavedFilterId).Distinct().ToArray();
        var pinnedVersions = pinnedFilterIds.Length == 0
            ? new List<TSEAI.Domain.Filters.SavedFilterVersion>()
            : await db.SavedFilterVersions.AsNoTracking().Where(x => pinnedFilterIds.Contains(x.SavedFilterId)).ToListAsync(ct);
        var versionMap = pinnedVersions.ToDictionary(x => (x.SavedFilterId, x.Version));

        var parser = new TsetmcFilterParser();
        var validator = new FilterValidator();
        var dependencyAnalyzer = new FilterDependencyAnalyzer();
        var result = new List<AlertRuleSnapshot>(rows.Count);
        foreach (var row in rows)
        {
            var filter = row.SavedFilter!;
            var version = row.FollowLatestVersion ? filter.CurrentVersion : row.PinnedFilterVersion ?? filter.CurrentVersion;
            var code = filter.CurrentTsetmcCode;
            var explanation = filter.CurrentPersianExplanation;
            if (!row.FollowLatestVersion && versionMap.TryGetValue((row.SavedFilterId, version), out var pinned))
            {
                code = pinned.TsetmcCode;
                explanation = pinned.PersianExplanation;
            }

            try
            {
                var ast = parser.Parse(code);
                var validation = validator.Validate(ast);
                if (!validation.IsValid)
                {
                    log.LogWarning("Alert {AlertId} skipped because filter is invalid: {Errors}", row.Id, string.Join("; ", validation.Errors));
                    continue;
                }
                result.Add(new(row.Id, row.OwnerUserId, row.SavedFilterId, version, row.Name, filter.Name,
                    row.CooldownSeconds, code, explanation, ast, dependencyAnalyzer.Analyze(ast)));
            }
            catch (Exception ex)
            {
                log.LogWarning(ex, "Alert {AlertId} skipped because filter parsing failed", row.Id);
            }
        }
        return result;
    }
}
