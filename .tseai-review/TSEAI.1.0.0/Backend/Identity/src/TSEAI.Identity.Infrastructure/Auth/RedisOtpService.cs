using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Configuration;
using StackExchange.Redis;
using TSEAI.Identity.Application.Auth;
namespace TSEAI.Identity.Infrastructure.Auth;
public sealed class RedisOtpService(IConnectionMultiplexer redis,ISmsSender sms,IConfiguration cfg):IOtpService
{
    private readonly IDatabase _db=redis.GetDatabase();
    public async Task RequestAsync(string mobile,CancellationToken ct)
    {
        mobile=PhoneNormalizer.NormalizeIran(mobile);var cooldownKey=$"otp:cooldown:{mobile}";
        if(!await _db.StringSetAsync(cooldownKey,"1",TimeSpan.FromSeconds(60),When.NotExists))throw new InvalidOperationException("OTP recently requested.");
        var code=RandomNumberGenerator.GetInt32(100000,1000000).ToString();var secret=Secret();
        await _db.StringSetAsync($"otp:code:{mobile}",Hash(code,secret),TimeSpan.FromMinutes(2));await _db.KeyDeleteAsync($"otp:attempts:{mobile}");
        try{await sms.SendOtpAsync(mobile,code,ct);}catch{await _db.KeyDeleteAsync(cooldownKey);await _db.KeyDeleteAsync($"otp:code:{mobile}");throw;}
    }
    public async Task<bool> VerifyAsync(string mobile,string code,CancellationToken ct)
    {
        mobile=PhoneNormalizer.NormalizeIran(mobile);var attemptsKey=$"otp:attempts:{mobile}";var attempts=await _db.StringIncrementAsync(attemptsKey);if(attempts==1)await _db.KeyExpireAsync(attemptsKey,TimeSpan.FromMinutes(2));if(attempts>5)return false;
        var expected=await _db.StringGetAsync($"otp:code:{mobile}");if(!expected.HasValue)return false;var actual=Hash(code,Secret());
        var ok=CryptographicOperations.FixedTimeEquals(Convert.FromHexString(expected.ToString()),Convert.FromHexString(actual));if(ok){await _db.KeyDeleteAsync($"otp:code:{mobile}");await _db.KeyDeleteAsync(attemptsKey);}return ok;
    }
    private string Secret()=>cfg["Security:OtpHashSecret"]??cfg["Security:JwtSigningKey"]??throw new InvalidOperationException("OTP secret not configured.");
    private static string Hash(string code,string secret){using var h=new HMACSHA256(Encoding.UTF8.GetBytes(secret));return Convert.ToHexString(h.ComputeHash(Encoding.UTF8.GetBytes(code)));}
}
