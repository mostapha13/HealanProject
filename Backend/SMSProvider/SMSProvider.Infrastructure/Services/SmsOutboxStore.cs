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

    public async Task<IReadOnlyList<SmsOutboxLog>> ListAsync(
        int take = 100,
        string? phoneNumber = null,
        CancellationToken cancellationToken = default)
    {
        take = Math.Clamp(take, 1, 500);
        var query = _db.SmsOutboxLogs.AsNoTracking().AsQueryable();
        if (!string.IsNullOrWhiteSpace(phoneNumber))
        {
            var phone = phoneNumber.Trim();
            query = query.Where(x => x.PhoneNumber.Contains(phone));
        }

        return await query
            .OrderByDescending(x => x.CreatedAt)
            .Take(take)
            .ToListAsync(cancellationToken);
    }
}
