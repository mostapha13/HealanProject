using TSEAI.Shared.Application.Production;
using System.Security.Claims;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using System.Threading.RateLimiting;
using TSEAI.Identity.Application.Auth;
using TSEAI.Identity.Domain;
using TSEAI.Identity.Domain.Entities;
using TSEAI.Identity.Infrastructure;
using TSEAI.Identity.Infrastructure.Auth;
using TSEAI.Identity.Infrastructure.Persistence;
using TSEAIIdentityConstants = TSEAI.Identity.Domain.IdentityConstants;

var builder = WebApplication.CreateBuilder(args);
ProductionConfigurationGuard.Validate(builder.Configuration, "IdentityApi");
builder.WebHost.ConfigureKestrel(o => o.Limits.MaxRequestBodySize = 256 * 1024);
builder.Services.AddHealthChecks();
builder.Services.AddIdentityInfrastructure(builder.Configuration);
var signingKey = builder.Configuration["Security:JwtSigningKey"] ?? throw new InvalidOperationException("Security:JwtSigningKey missing");
if (Encoding.UTF8.GetByteCount(signingKey) < 32) throw new InvalidOperationException("Security:JwtSigningKey must be at least 32 bytes.");
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme).AddJwtBearer(o =>
{
    o.TokenValidationParameters = new TokenValidationParameters { ValidateIssuer = true, ValidateAudience = true, ValidateLifetime = true, ValidateIssuerSigningKey = true, ValidIssuer = builder.Configuration["Security:Issuer"] ?? "tseai-identity", ValidAudience = builder.Configuration["Security:Audience"] ?? "tseai", IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(signingKey)), ClockSkew = TimeSpan.FromSeconds(30) };
});
builder.Services.AddAuthorization();
builder.Services.Configure<ForwardedHeadersOptions>(o =>
{
    o.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
    // Identity API is not published directly in docker-compose; traffic is expected from the private gateway.
    o.KnownNetworks.Clear();
    o.KnownProxies.Clear();
});
builder.Services.AddRateLimiter(o =>
{
    o.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    o.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext,string>(ctx => RateLimitPartition.GetFixedWindowLimiter(ctx.Connection.RemoteIpAddress?.ToString() ?? "unknown", _ => new FixedWindowRateLimiterOptions { PermitLimit = 60, Window = TimeSpan.FromMinutes(1), QueueLimit = 0, AutoReplenishment = true }));
    o.AddPolicy("otp", ctx => RateLimitPartition.GetFixedWindowLimiter(ctx.Connection.RemoteIpAddress?.ToString() ?? "unknown", _ => new FixedWindowRateLimiterOptions { PermitLimit = 12, Window = TimeSpan.FromMinutes(1), QueueLimit = 0, AutoReplenishment = true }));
    o.AddPolicy("refresh", ctx => RateLimitPartition.GetFixedWindowLimiter(ctx.Connection.RemoteIpAddress?.ToString() ?? "unknown", _ => new FixedWindowRateLimiterOptions { PermitLimit = 30, Window = TimeSpan.FromMinutes(1), QueueLimit = 0, AutoReplenishment = true }));
});
var app = builder.Build();
using (var scope = app.Services.CreateScope()) await IdentitySeeder.SeedAsync(scope.ServiceProvider);
app.UseForwardedHeaders();
if (app.Environment.IsProduction()) app.UseHsts();
app.Use(async (ctx,next) =>
{
    ctx.Response.Headers["X-Content-Type-Options"] = "nosniff";
    ctx.Response.Headers["X-Frame-Options"] = "DENY";
    ctx.Response.Headers["Referrer-Policy"] = "no-referrer";
    ctx.Response.Headers["Content-Security-Policy"] = "default-src 'none'; frame-ancestors 'none'";
    ctx.Response.Headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()";
    await next();
});
app.UseAuthentication(); app.UseRateLimiter(); app.UseAuthorization();
app.MapHealthChecks("/health/live", new HealthCheckOptions { Predicate = _ => false });
app.MapHealthChecks("/health/ready", new HealthCheckOptions { Predicate = check => check.Tags.Contains("ready") });
app.MapHealthChecks("/health");
app.MapPost("/api/auth/otp/request", async (RequestOtpRequest request, IOtpService otp, CancellationToken ct) =>
{
    try { await otp.RequestAsync(request.Mobile, ct); return Results.Accepted(); }
    catch (ArgumentException ex) { return Results.BadRequest(new { code = "invalid_mobile", message = ex.Message }); }
    catch (InvalidOperationException ex) when (ex.Message == "OTP recently requested.") { return Results.Json(new { code = "otp_rate_limited", message = "لطفاً کمی بعد دوباره درخواست کد کنید." }, statusCode: StatusCodes.Status429TooManyRequests); }
}).RequireRateLimiting("otp");
app.MapPost("/api/auth/otp/verify", async (VerifyOtpRequest request, HttpContext context, IOtpService otp, UserManager<ApplicationUser> users, RoleManager<ApplicationRole> roles, IdentityDbContext db, ITokenService tokens, CancellationToken ct) =>
{
    string mobile;
    try { mobile = PhoneNormalizer.NormalizeIran(request.Mobile); }
    catch (ArgumentException ex) { return Results.BadRequest(new { code = "invalid_mobile", message = ex.Message }); }
    if (!await otp.VerifyAsync(mobile, request.Code, ct)) return Results.BadRequest(new { code = "invalid_otp", message = "کد تایید نامعتبر یا منقضی شده است." });
    var user = await users.Users.SingleOrDefaultAsync(x => x.PhoneNumber == mobile, ct);
    if (user is null)
    {
        user = new ApplicationUser { Id = Guid.NewGuid(), UserName = mobile, PhoneNumber = mobile, PhoneNumberConfirmed = true };
        var created = await users.CreateAsync(user); if (!created.Succeeded) return Results.BadRequest(created.Errors);
        var bootstrapRaw = builder.Configuration["Security:BootstrapAdminMobile"]; var bootstrap = string.IsNullOrWhiteSpace(bootstrapRaw) ? null : PhoneNormalizer.NormalizeIran(bootstrapRaw); await users.AddToRoleAsync(user, string.Equals(bootstrap, mobile, StringComparison.OrdinalIgnoreCase) ? TSEAIIdentityConstants.Roles.SuperAdmin : TSEAIIdentityConstants.Roles.User);
    }
    var configuredAdminRaw=builder.Configuration["Security:BootstrapAdminMobile"]; var configuredAdmin=string.IsNullOrWhiteSpace(configuredAdminRaw)?null:PhoneNormalizer.NormalizeIran(configuredAdminRaw); if(string.Equals(configuredAdmin,mobile,StringComparison.OrdinalIgnoreCase)&&!await users.IsInRoleAsync(user,TSEAIIdentityConstants.Roles.SuperAdmin))await users.AddToRoleAsync(user,TSEAIIdentityConstants.Roles.SuperAdmin);
        user.LastLoginAtUtc = DateTime.UtcNow; await users.UpdateAsync(user);
    var userRoles = await users.GetRolesAsync(user);
    var roleIds = await db.Roles.Where(x => userRoles.Contains(x.Name!)).Select(x => x.Id).ToListAsync(ct);
    var perms = await (from rp in db.RolePermissions join p in db.Permissions on rp.PermissionId equals p.Id where roleIds.Contains(rp.RoleId) select p.Code).Distinct().ToListAsync(ct);
    var issued = await tokens.IssueAsync(user.Id, mobile, userRoles.ToArray(), perms, ct);
    if (!IsWebClient(context)) return Results.Ok(issued);
    SetRefreshCookie(context, issued.RefreshToken, builder.Configuration);
    return Results.Ok(WebTokenResponse(issued));
}).RequireRateLimiting("otp");
app.MapPost("/api/auth/refresh", async (RefreshRequest request, HttpContext context, ITokenService tokens, CancellationToken ct) =>
{
    var refreshToken = request.RefreshToken;
    if (string.IsNullOrWhiteSpace(refreshToken) && IsWebClient(context))
        context.Request.Cookies.TryGetValue("tseai-refresh", out refreshToken);
    var rotated = await tokens.RotateRefreshTokenAsync(refreshToken ?? "", ct);
    if (rotated is null)
    {
        DeleteRefreshCookie(context);
        return Results.Unauthorized();
    }
    if (!IsWebClient(context)) return Results.Ok(rotated);
    SetRefreshCookie(context, rotated.RefreshToken, builder.Configuration);
    return Results.Ok(WebTokenResponse(rotated));
}).RequireRateLimiting("refresh");
app.MapPost("/api/auth/logout", async (RefreshRequest request, HttpContext context, ITokenService tokens, CancellationToken ct) =>
{
    var refreshToken = request.RefreshToken;
    if (string.IsNullOrWhiteSpace(refreshToken) && IsWebClient(context))
        context.Request.Cookies.TryGetValue("tseai-refresh", out refreshToken);
    await tokens.RevokeRefreshTokenFamilyAsync(refreshToken ?? "", ct);
    DeleteRefreshCookie(context);
    return Results.NoContent();
}).RequireRateLimiting("refresh");
app.MapGet("/api/auth/me", (ClaimsPrincipal user) => Results.Ok(new { userId = user.FindFirstValue(ClaimTypes.NameIdentifier), mobile = user.FindFirstValue("mobile"), roles = user.FindAll(ClaimTypes.Role).Select(x => x.Value), permissions = user.FindAll("permission").Select(x => x.Value) })).RequireAuthorization();
app.MapGet("/", () => Results.Ok(new { service = "TSEAI.Identity", sprint = 1, auth = "mobile-otp", roles = new[] { "User", "Admin", "SuperAdmin" } }));
app.Run();

static bool IsWebClient(HttpContext? httpContext) =>
    httpContext?.Request.Headers["X-TSEAI-Web-Client"].FirstOrDefault() == "1";

static object WebTokenResponse(TokenResponse token) => new
{
    token.AccessToken,
    token.ExpiresAtUtc,
    token.UserId,
    token.Mobile,
    token.Roles,
    token.Permissions,
};

static void SetRefreshCookie(HttpContext context, string token, IConfiguration configuration)
{
    var days = int.TryParse(configuration["Security:RefreshTokenDays"], out var parsed) ? Math.Clamp(parsed, 1, 90) : 30;
    var secure = context.Request.IsHttps || context.RequestServices.GetRequiredService<IHostEnvironment>().IsProduction();
    context.Response.Cookies.Append("tseai-refresh", token, new CookieOptions
    {
        HttpOnly = true,
        Secure = secure,
        SameSite = SameSiteMode.Strict,
        Path = "/identity/api/auth",
        MaxAge = TimeSpan.FromDays(days),
        IsEssential = true,
    });
}

static void DeleteRefreshCookie(HttpContext context)
{
    var secure = context.Request.IsHttps || context.RequestServices.GetRequiredService<IHostEnvironment>().IsProduction();
    context.Response.Cookies.Delete("tseai-refresh", new CookieOptions
    {
        HttpOnly = true,
        Secure = secure,
        SameSite = SameSiteMode.Strict,
        Path = "/identity/api/auth",
        IsEssential = true,
    });
}
