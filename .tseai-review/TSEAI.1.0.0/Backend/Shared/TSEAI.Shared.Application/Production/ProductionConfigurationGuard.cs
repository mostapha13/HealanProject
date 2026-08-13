using Microsoft.Extensions.Configuration;
namespace TSEAI.Shared.Application.Production;
public static class ProductionConfigurationGuard
{
    public static void Validate(IConfiguration cfg, string service)
    {
        if (!string.Equals(cfg["ASPNETCORE_ENVIRONMENT"], "Production", StringComparison.OrdinalIgnoreCase) &&
            !string.Equals(Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT"), "Production", StringComparison.OrdinalIgnoreCase)) return;
        var strict = !string.Equals(cfg["Release:RequireStrictConfiguration"], "false", StringComparison.OrdinalIgnoreCase);
        if (!strict) return;
        Required(cfg,"Security:JwtSigningKey",64);
        Required(cfg,"Security:Issuer",3);
        Required(cfg,"Security:Audience",3);
        var jwt=cfg["Security:JwtSigningKey"]!;
        RejectPlaceholder(jwt,"Security:JwtSigningKey");
        var otp=cfg["Security:OtpHashSecret"] ?? Environment.GetEnvironmentVariable("OTP_HASH_SECRET");
        if (service.Contains("Identity",StringComparison.OrdinalIgnoreCase))
        {
            if(string.IsNullOrWhiteSpace(otp) || otp.Length<48) throw new InvalidOperationException("OTP hash secret must be >=48 chars in Production.");
            RejectPlaceholder(otp,"OTP hash secret");
            if (string.Equals(jwt,otp,StringComparison.Ordinal)) throw new InvalidOperationException("JWT and OTP secrets must be independent.");
            Required(cfg,"ConnectionStrings:IdentityDb",16);
            Required(cfg,"Redis:ConnectionString",8);
            Required(cfg,"Sms:Endpoint",8);
            Required(cfg,"Sms:ApiKey",8);
            RequireHttps(cfg["Sms:Endpoint"]!, "Sms:Endpoint");
            BoundedInt(cfg, "Security:AccessTokenMinutes", 5, 60, 15);
            BoundedInt(cfg, "Security:RefreshTokenDays", 1, 90, 30);
        }
        else if (service.Contains("Platform",StringComparison.OrdinalIgnoreCase))
        {
            Required(cfg,"ConnectionStrings:ApplicationDb",16);
            Required(cfg,"Redis:ConnectionString",8);
            Required(cfg,"AI:BaseUrl",8);
        }
        else if (service.Contains("Notification",StringComparison.OrdinalIgnoreCase))
        {
            Required(cfg,"Redis:ConnectionString",8);
            Required(cfg,"RabbitMq:Host",2);
            Required(cfg,"RabbitMq:Password",16);
        }
    }
    static void Required(IConfiguration c,string key,int n){var v=c[key];if(string.IsNullOrWhiteSpace(v)||v.Length<n)throw new InvalidOperationException($"{key} missing/too short for Production.");RejectPlaceholder(v,key);}
    static void RejectPlaceholder(string v,string key){var x=v.ToUpperInvariant();if(x.Contains("CHANGE_ME")||x.Contains("CHANGETHIS")||x.Contains("PASSWORD123"))throw new InvalidOperationException($"Placeholder secret rejected: {key}");}
    static void BoundedInt(IConfiguration cfg,string key,int minimum,int maximum,int fallback)
    {
        var raw=cfg[key];
        var value=string.IsNullOrWhiteSpace(raw)?fallback:int.TryParse(raw,out var parsed)?parsed:int.MinValue;
        if(value<minimum||value>maximum)throw new InvalidOperationException($"{key} must be between {minimum} and {maximum}.");
    }
    static void RequireHttps(string value,string key)
    {
        if(!Uri.TryCreate(value,UriKind.Absolute,out var uri)||uri.Scheme!=Uri.UriSchemeHttps)
            throw new InvalidOperationException($"{key} must be an absolute HTTPS URL in Production.");
    }
}
