using Microsoft.EntityFrameworkCore;
using SMSProvider.Application.Entities;
using SMSProvider.Application.Interfaces;
using SMSProvider.Infrastructure.Persistence;

namespace SMSProvider.Infrastructure.Services;

public sealed class SmsOutboxStore : ISmsOutboxStore
{
    private readonly ApplicationDbContext _db;

    public SmsOutboxStore(ApplicationDbContext db) => _db = db;

    public async Task SaveAsync(SmsOutboxLog log, CancellationToken cancellationToken = default)
    {
        _db.SmsOutboxLogs.Add(log);
        await _db.SaveChangesAsync(cancellationToken);
    }

    public async Task<(IReadOnlyList<SmsOutboxLog> Items, int TotalCount)> ListPagedAsync(
        int pageNumber = 1,
        int pageSize = 10,
        string? phoneNumber = null,
        CancellationToken cancellationToken = default)
    {
        pageNumber = pageNumber < 1 ? 1 : pageNumber;
        pageSize = pageSize < 1 ? 10 : Math.Min(pageSize, 20);

        var query = _db.SmsOutboxLogs.AsNoTracking().AsQueryable();
        if (!string.IsNullOrWhiteSpace(phoneNumber))
        {
            var phone = phoneNumber.Trim();
            query = query.Where(x => x.PhoneNumber.Contains(phone));
        }

        query = query.OrderByDescending(x => x.CreatedAt);

        var totalCount = await query.CountAsync(cancellationToken);
        var totalPages = totalCount == 0 ? 0 : (int)Math.Ceiling(totalCount / (double)pageSize);
        if (totalPages > 0 && pageNumber > totalPages)
            pageNumber = totalPages;

        var items = await query
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return (items, totalCount);
    }
}
