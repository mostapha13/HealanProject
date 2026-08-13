using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Distributed;
using TSEAI.Application.Usage;
using TSEAI.Infrastructure.Persistence;
namespace TSEAI.Infrastructure.Settings;
public sealed class SystemSettingService(ApplicationDbContext db, IDistributedCache cache) : ISystemSettingService
{
    public async Task<int> GetIntAsync(string key, int fallback, CancellationToken ct)
    {
        var value = await cache.GetStringAsync("setting:" + key, ct);
        if (value is null) { value = await db.SystemSettings.Where(x => x.Key == key).Select(x => x.Value).SingleOrDefaultAsync(ct); if (value is not null) await cache.SetStringAsync("setting:"+key,value,new DistributedCacheEntryOptions{AbsoluteExpirationRelativeToNow=TimeSpan.FromMinutes(5)},ct); }
        return int.TryParse(value, out var i) ? i : fallback;
    }
    public async Task<IReadOnlyDictionary<string,string>> GetAllAsync(CancellationToken ct) => await db.SystemSettings.AsNoTracking().ToDictionaryAsync(x => x.Key, x => x.Value, ct);
    public async Task SetAsync(string key, string value, string valueType, string? title, string? description, string category, CancellationToken ct)
    {
        var row = await db.SystemSettings.SingleOrDefaultAsync(x=>x.Key==key,ct);
        if (row is null) db.SystemSettings.Add(new() { Key=key, Value=value, ValueType=valueType, Title=title, Description=description, Category=category });
        else { row.Value=value; row.ValueType=valueType; row.Title=title; row.Description=description; row.Category=category; row.UpdatedAtUtc=DateTime.UtcNow; }
        await db.SaveChangesAsync(ct); await cache.SetStringAsync("setting:"+key,value,new DistributedCacheEntryOptions{AbsoluteExpirationRelativeToNow=TimeSpan.FromDays(1)},ct);
    }
}
