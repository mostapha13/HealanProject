using System.Text.Json;
using StackExchange.Redis;
using TSEAI.Application.Market;
using TSEAI.Shared.Application.Market;
namespace TSEAI.Infrastructure.Market;
public sealed class RedisMarketSnapshotQuery(IConnectionMultiplexer redis):IMarketSnapshotQuery
{
    private readonly IDatabase _db=redis.GetDatabase();
    public async Task<MarketSymbolSnapshot?> FindAsync(string input,CancellationToken ct)
    {
        string? symbolCode=null; long? ins=null;
        if(long.TryParse(input,out var n))ins=n; else if(input.StartsWith("IR",StringComparison.OrdinalIgnoreCase))symbolCode=input; else {var v=await _db.StringGetAsync($"tseai:instrument:lookup:{Normalize(input)}");if(v.HasValue)symbolCode=v.ToString();}
        if(symbolCode is not null){var refRaw=await _db.StringGetAsync($"tseai:instrument:symbolcode:{symbolCode}");if(refRaw.HasValue){var ir=JsonSerializer.Deserialize<InstrumentReference>(refRaw.ToString());ins=ir?.InsCode;}}
        if(ins is null)return null; var raw=await _db.HashGetAsync("tseai:market:snapshot:v1",ins.Value); return raw.HasValue?JsonSerializer.Deserialize<MarketSymbolSnapshot>(raw.ToString()):null;
    }
    public async Task<IReadOnlyList<MarketSymbolSnapshot>> GetActiveAsync(int limit,CancellationToken ct)
    {
        var day=await _db.StringGetAsync("tseai:market:current-trading-date:v1"); if(!day.HasValue)return[]; var ids=await _db.SetMembersAsync($"tseai:market:active:{day}:v1"); if(ids.Length==0)return[]; var selected=ids.Take(Math.Clamp(limit,1,30000)).Select(x=>(RedisValue)x.ToString()).ToArray(); var raws=await _db.HashGetAsync("tseai:market:snapshot:v1",selected); return raws.Where(x=>x.HasValue).Select(x=>JsonSerializer.Deserialize<MarketSymbolSnapshot>(x.ToString())!).Where(x=>x is not null).ToList();
    }
    private static string Normalize(string s)=>s.Trim().Replace('ي','ی').Replace('ك','ک').Replace("‌","").Replace(" ","").ToLowerInvariant();
}
