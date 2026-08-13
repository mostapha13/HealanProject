using Microsoft.EntityFrameworkCore;
using TSEAI.Application.Alerts;
using TSEAI.Domain.Alerts;
using TSEAI.Infrastructure.Persistence;

namespace TSEAI.Infrastructure.Alerts;

public sealed class EfAlertRepository(ApplicationDbContext db) : IAlertRepository
{
    public Task<int> CountActiveAsync(string ownerUserId, CancellationToken ct) =>
        db.AlertRules.CountAsync(x => x.OwnerUserId == ownerUserId && !x.IsDeleted, ct);

    public Task<AlertRule?> GetAsync(string ownerUserId, Guid id, bool includeFilter, CancellationToken ct)
    {
        IQueryable<AlertRule> query = db.AlertRules;
        if (includeFilter) query = query.Include(x => x.SavedFilter);
        return query.SingleOrDefaultAsync(x => x.Id == id && x.OwnerUserId == ownerUserId && !x.IsDeleted, ct);
    }

    public async Task<IReadOnlyList<AlertRule>> ListAsync(string ownerUserId, CancellationToken ct) =>
        await db.AlertRules.AsNoTracking().Include(x => x.SavedFilter)
            .Where(x => x.OwnerUserId == ownerUserId && !x.IsDeleted)
            .OrderByDescending(x => x.IsEnabled).ThenByDescending(x => x.UpdatedAtUtc)
            .ToListAsync(ct);

    public Task<bool> SavedFilterOwnedAsync(string ownerUserId, Guid savedFilterId, CancellationToken ct) =>
        db.SavedFilters.AnyAsync(x => x.Id == savedFilterId && x.OwnerUserId == ownerUserId && !x.IsDeleted, ct);

    public async Task<int?> GetSavedFilterLatestVersionAsync(string ownerUserId, Guid savedFilterId, CancellationToken ct) =>
        await db.SavedFilters.Where(x => x.Id == savedFilterId && x.OwnerUserId == ownerUserId && !x.IsDeleted)
            .Select(x => (int?)x.CurrentVersion).SingleOrDefaultAsync(ct);

    public Task<bool> SavedFilterVersionExistsAsync(string ownerUserId, Guid savedFilterId, int version, CancellationToken ct) =>
        db.SavedFilterVersions.AnyAsync(x => x.SavedFilterId == savedFilterId && x.Version == version &&
            x.SavedFilter != null && x.SavedFilter.OwnerUserId == ownerUserId && !x.SavedFilter.IsDeleted, ct);

    public async Task AddAsync(AlertRule rule, CancellationToken ct) => await db.AlertRules.AddAsync(rule, ct);

    public async Task<IReadOnlyList<AlertEvent>> ListEventsAsync(string ownerUserId, int take, bool unreadOnly, CancellationToken ct)
    {
        var query = db.AlertEvents.AsNoTracking().Where(x => x.OwnerUserId == ownerUserId);
        if (unreadOnly) query = query.Where(x => x.ReadAtUtc == null);
        return await query.OrderByDescending(x => x.TriggeredAtUtc).Take(take).ToListAsync(ct);
    }

    public Task<AlertEvent?> GetEventAsync(string ownerUserId, Guid id, CancellationToken ct) =>
        db.AlertEvents.SingleOrDefaultAsync(x => x.Id == id && x.OwnerUserId == ownerUserId, ct);

    public Task SaveChangesAsync(CancellationToken ct) => db.SaveChangesAsync(ct);
}
