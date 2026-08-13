using System.Net.Http.Json;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using TSEAI.Identity.Application.Auth;
namespace TSEAI.Identity.Infrastructure.Auth;
public sealed class ConfigurableSmsSender(HttpClient http,IConfiguration cfg,ILogger<ConfigurableSmsSender> log):ISmsSender
{
    public async Task SendOtpAsync(string mobile,string code,CancellationToken ct)
    {
        var endpoint=cfg["Sms:Endpoint"];
        if(!string.IsNullOrWhiteSpace(endpoint))
        {
            using var req=new HttpRequestMessage(HttpMethod.Post,endpoint){Content=JsonContent.Create(new{mobile,code})};
            var apiKey=cfg["Sms:ApiKey"];if(!string.IsNullOrWhiteSpace(apiKey))req.Headers.TryAddWithoutValidation("X-Api-Key",apiKey);
            using var res=await http.SendAsync(req,ct);res.EnsureSuccessStatusCode();return;
        }
        if(bool.TryParse(cfg["Sms:AllowConsoleFallback"],out var allow)&&allow){log.LogWarning("DEV OTP for {Mobile}: {Code}",mobile,code);return;}
        throw new InvalidOperationException("SMS provider is not configured.");
    }
}
