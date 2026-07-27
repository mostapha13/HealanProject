using IdentityServer4.Validation;
using Microsoft.AspNetCore.Mvc;
using Share.Application.Common.Interfaces;
using Share.Infrastructure.SecurityMiddlewares;

namespace IdentityServer.Controllers;

/// <summary>Server-side access-token revocation for browser and mobile logout.</summary>
public sealed class SessionController : ApiControllerBase
{
    private static readonly TimeSpan MaximumRevocationLifetime = TimeSpan.FromDays(1);

    private readonly ITokenValidator _tokenValidator;
    private readonly ICacheManager _cache;
    private readonly ILogger<SessionController> _logger;

    public SessionController(
        ITokenValidator tokenValidator,
        ICacheManager cache,
        ILogger<SessionController> logger)
    {
        _tokenValidator = tokenValidator;
        _cache = cache;
        _logger = logger;
    }

    [HttpPost("revoke")]
    public async Task<IActionResult> Revoke()
    {
        var authorization = Request.Headers.Authorization.ToString();
        if (!authorization.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
            return Unauthorized();

        var rawToken = authorization["Bearer ".Length..].Trim();
        var validation = await _tokenValidator.ValidateAccessTokenAsync(rawToken);
        if (validation.IsError)
            return Unauthorized();

        var subject = validation.Claims.FirstOrDefault(x => x.Type == "sub")?.Value;
        var authTime = validation.Claims.FirstOrDefault(x => x.Type == "auth_time")?.Value;
        var tokenId = validation.Claims.FirstOrDefault(x => x.Type == "jti")?.Value;
        var expiresAt = ParseUnixTime(validation.Claims.FirstOrDefault(x => x.Type == "exp")?.Value);
        var lifetime = CalculateLifetime(expiresAt);

        if (string.IsNullOrWhiteSpace(subject))
            return Unauthorized();

        if (!string.IsNullOrWhiteSpace(tokenId))
            _cache.AddString(TokenRevocationMiddleware.TokenKeyPrefix + tokenId, "1", lifetime);

        if (!string.IsNullOrWhiteSpace(authTime))
            _cache.AddString(TokenRevocationMiddleware.BuildSessionKey(subject, authTime), "1", lifetime);

        _logger.LogInformation(
            "Access token revoked on logout. Subject={Subject} Jti={Jti} HasAuthTime={HasAuthTime}",
            subject, tokenId, !string.IsNullOrWhiteSpace(authTime));

        return Ok(new { revoked = true });
    }

    private static DateTimeOffset? ParseUnixTime(string value) =>
        long.TryParse(value, out var seconds)
            ? DateTimeOffset.FromUnixTimeSeconds(seconds)
            : null;

    private static TimeSpan CalculateLifetime(DateTimeOffset? expiresAt)
    {
        if (expiresAt is null)
            return MaximumRevocationLifetime;

        var remaining = expiresAt.Value - DateTimeOffset.UtcNow + TimeSpan.FromMinutes(1);
        if (remaining <= TimeSpan.Zero)
            return TimeSpan.FromMinutes(1);
        return remaining <= MaximumRevocationLifetime ? remaining : MaximumRevocationLifetime;
    }
}
