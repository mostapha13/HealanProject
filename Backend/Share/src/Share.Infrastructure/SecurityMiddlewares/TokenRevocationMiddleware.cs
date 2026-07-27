using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Share.Application.Common.Interfaces;
using System.Security.Claims;
using System.Text.Json;

namespace Share.Infrastructure.SecurityMiddlewares;

/// <summary>
/// Rejects JWTs that were explicitly revoked or belong to an OIDC session that
/// has been logged out. JWT signature/lifetime validation must run before this
/// middleware.
/// </summary>
public sealed class TokenRevocationMiddleware
{
    public const string TokenKeyPrefix = "auth:revoked:token:";
    public const string SessionKeyPrefix = "auth:revoked:session:";

    private readonly RequestDelegate _next;
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<TokenRevocationMiddleware> _logger;

    public TokenRevocationMiddleware(
        RequestDelegate next,
        IServiceScopeFactory scopeFactory,
        ILogger<TokenRevocationMiddleware> logger)
    {
        _next = next;
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var endpoint = context.GetEndpoint();
        if (endpoint?.Metadata.GetMetadata<IAllowAnonymous>() != null
            || context.User?.Identity?.IsAuthenticated != true)
        {
            await _next(context);
            return;
        }

        var subject = FindClaim(context.User, "sub", ClaimTypes.NameIdentifier);
        var authTime = FindClaim(context.User, "auth_time");
        var tokenId = FindClaim(context.User, "jti");

        try
        {
            using var scope = _scopeFactory.CreateScope();
            var cache = scope.ServiceProvider.GetRequiredService<ICacheManager>();

            var tokenRevoked = !string.IsNullOrWhiteSpace(tokenId)
                && cache.IsExistsData(TokenKeyPrefix + tokenId);
            var sessionRevoked = !string.IsNullOrWhiteSpace(subject)
                && !string.IsNullOrWhiteSpace(authTime)
                && cache.IsExistsData(BuildSessionKey(subject, authTime));

            if (!tokenRevoked && !sessionRevoked)
            {
                await _next(context);
                return;
            }

            _logger.LogWarning(
                "Rejected revoked access token. Subject={Subject} Jti={Jti} SessionRevoked={SessionRevoked}",
                subject, tokenId, sessionRevoked);
            await WriteUnauthorizedAsync(context, "token_revoked");
        }
        catch (Exception ex)
        {
            // Revocation is a security boundary. If its shared store cannot be
            // checked, accepting the token would make logout revocation unreliable.
            _logger.LogError(ex, "Token revocation store is unavailable.");
            context.Response.StatusCode = StatusCodes.Status503ServiceUnavailable;
            context.Response.ContentType = "application/json";
            await context.Response.WriteAsync(JsonSerializer.Serialize(new
            {
                title = "Authentication service unavailable",
                errors = new[] { "امکان بررسی اعتبار نشست کاربری وجود ندارد. دوباره تلاش کنید." }
            }));
        }
    }

    public static string BuildSessionKey(string subject, string authTime) =>
        $"{SessionKeyPrefix}{subject}:{authTime}";

    private static string? FindClaim(ClaimsPrincipal principal, params string[] claimTypes)
    {
        foreach (var claimType in claimTypes)
        {
            var value = principal.FindFirst(claimType)?.Value;
            if (!string.IsNullOrWhiteSpace(value))
                return value;
        }

        return null;
    }

    private static async Task WriteUnauthorizedAsync(HttpContext context, string reason)
    {
        context.Response.StatusCode = StatusCodes.Status401Unauthorized;
        context.Response.ContentType = "application/json";
        context.Response.Headers["X-Auth-Reason"] = reason;
        await context.Response.WriteAsync(JsonSerializer.Serialize(new
        {
            title = "Unauthorized",
            errors = new[] { "نشست کاربری منقضی یا خارج شده است. دوباره وارد شوید." }
        }));
    }
}
