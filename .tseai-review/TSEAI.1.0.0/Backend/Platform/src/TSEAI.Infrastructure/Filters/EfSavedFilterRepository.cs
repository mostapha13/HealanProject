using Microsoft.EntityFrameworkCore;
using TSEAI.Application.Filters.Saved;
using TSEAI.Domain.Filters;
using TSEAI.Infrastructure.Persistence;

namespace TSEAI.Infrastructure.Filters;

public sealed class EfSavedFilterRepository(ApplicationDbContext db) : ISavedFilterRepository
{
    public Task<int> CountActiveAsync(string ownerUserId, CancellationToken ct) =>
        db.SavedFilters.CountAsync(x => x.OwnerUserId == ownerUserId && !x.IsDeleted, ct);

    public Task<bool> NameExistsAsync(string ownerUserId, string normalizedName, Guid? exceptId, CancellationToken ct) =>
        db.SavedFilters.AnyAsync(x => x.OwnerUserId == ownerUserId && !x.IsDeleted &&
                                      x.NormalizedName == normalizedName && (!exceptId.HasValue || x.Id != exceptId.Value), ct);

    public async Task<IReadOnlyList<SavedFilter>> ListAsync(string ownerUserId, string? search, bool? favoritesOnly, CancellationToken ct)
    {
        var query = db.SavedFilters.AsNoTracking().Where(x => x.OwnerUserId == ownerUserId && !x.IsDeleted);
        if (favoritesOnly == true) query = query.Where(x => x.IsFavorite);
        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim();
            query = query.Where(x => x.Name.Contains(term) || (x.Description != null && x.Description.Contains(term)));
        }
        return await query.OrderByDescending(x => x.IsFavorite).ThenByDescending(x => x.UpdatedAtUtc).ToListAsync(ct);
    }

    public Task<SavedFilter?> GetAsync(string ownerUserId, Guid id, bool includeVersions, CancellationToken ct)
    {
        IQueryable<SavedFilter> query = db.SavedFilters;
        if (includeVersions) query = query.Include(x => x.Versions);
        return query.SingleOrDefaultAsync(x => x.Id == id && x.OwnerUserId == ownerUserId && !x.IsDeleted, ct);
    }

    public Task<SavedFilterVersion?> GetVersionAsync(string ownerUserId, Guid id, int version, CancellationToken ct) =>
        db.SavedFilterVersions.AsNoTracking()
            .Where(x => x.SavedFilterId == id && x.Version == version && x.SavedFilter != null &&
                        x.SavedFilter.OwnerUserId == ownerUserId && !x.SavedFilter.IsDeleted)
            .SingleOrDefaultAsync(ct);

    public async Task AddAsync(SavedFilter filter, CancellationToken ct) => await db.SavedFilters.AddAsync(filter, ct);

    public Task SaveChangesAsync(CancellationToken ct) => db.SaveChangesAsync(ct);
}
