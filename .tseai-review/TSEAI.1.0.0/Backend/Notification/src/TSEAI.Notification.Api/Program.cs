using TSEAI.Shared.Application.Production;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.RateLimiting;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.IdentityModel.Tokens;
using StackExchange.Redis;
using TSEAI.Notification.Api.Alerts;
using TSEAI.Notification.Api.Health;

var builder = WebApplication.CreateBuilder(args);
ProductionConfigurationGuard.Validate(builder.Configuration, "NotificationApi");
builder.WebHost.ConfigureKestrel(o => o.Limits.MaxRequestBodySize = 256 * 1024);
builder.Services.AddHealthChecks().AddCheck<NotificationReadinessHealthCheck>("notification-dependencies", tags: ["ready"]);
builder.Services.Configure<NotificationRabbitOptions>(builder.Configuration.GetSection("RabbitMq"));
builder.Services.AddSingleton<IConnectionMultiplexer>(_ => ConnectionMultiplexer.Connect(builder.Configuration["Redis:ConnectionString"] ?? "redis:6379"));
builder.Services.AddSignalR().AddStackExchangeRedis(builder.Configuration["Redis:ConnectionString"] ?? "redis:6379");
builder.Services.AddHostedService<RabbitMqAlertConsumer>();
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme).AddJwtBearer(o =>
{
    o.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = builder.Configuration["Security:Issuer"] ?? "tseai-identity",
        ValidAudience = builder.Configuration["Security:Audience"] ?? "tseai",
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(builder.Configuration["Security:JwtSigningKey"] ?? throw new InvalidOperationException("JWT key missing"))),
        NameClaimType = ClaimTypes.NameIdentifier
    };
    o.Events = new JwtBearerEvents
    {
        OnMessageReceived = context =>
        {
            var token = context.Request.Query["access_token"].FirstOrDefault();
            if (!string.IsNullOrWhiteSpace(token) && context.HttpContext.Request.Path.StartsWithSegments("/hubs/alerts"))
                context.Token = token;
            return Task.CompletedTask;
        }
    };
});
builder.Services.AddAuthorization();
builder.Services.Configure<ForwardedHeadersOptions>(o =>
{
    o.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
    o.KnownNetworks.Clear();
    o.KnownProxies.Clear();
});
builder.Services.AddRateLimiter(o =>
{
    o.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    o.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(ctx =>
    {
        var key = ctx.User.FindFirstValue(ClaimTypes.NameIdentifier) ?? ctx.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        var limit = ctx.User.Identity?.IsAuthenticated == true ? 240 : 120;
        return RateLimitPartition.GetFixedWindowLimiter(key, _ => new FixedWindowRateLimiterOptions
        {
            PermitLimit = limit,
            Window = TimeSpan.FromMinutes(1),
            QueueLimit = 0,
            AutoReplenishment = true,
        });
    });
});

var app = builder.Build();
app.UseForwardedHeaders();
if(app.Environment.IsProduction()) app.UseHsts();
app.Use(async (ctx,next)=>
{
    ctx.Response.Headers["X-Content-Type-Options"] = "nosniff";
    ctx.Response.Headers["X-Frame-Options"] = "DENY";
    ctx.Response.Headers["Referrer-Policy"] = "no-referrer";
    ctx.Response.Headers["Content-Security-Policy"] = "default-src 'none'; frame-ancestors 'none'";
    ctx.Response.Headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()";
    await next();
});
app.UseAuthentication();
app.UseRateLimiter();
app.UseAuthorization();
app.MapHealthChecks("/health/live", new HealthCheckOptions { Predicate = _ => false });
app.MapHealthChecks("/health/ready", new HealthCheckOptions { Predicate = check => check.Tags.Contains("ready") });
app.MapHealthChecks("/health");
app.MapHub<AlertHub>("/hubs/alerts");
app.MapGet("/", () => Results.Ok(new { service = "TSEAI.Notification", sprint = 8, status = "rabbitmq-signalr-alert-delivery" }));
app.Run();
