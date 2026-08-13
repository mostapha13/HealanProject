using System.Data;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using TSEAI.Identity.Application.Auth;
using TSEAI.Identity.Domain.Entities;
using TSEAI.Identity.Infrastructure.Persistence;

namespace TSEAI.Identity.Infrastructure.Auth;

public sealed class JwtTokenService(IdentityDbContext db, IConfiguration cfg) : ITokenService
{
    private const int RefreshTokenHexLength = 96;

    public Task<TokenResponse> IssueAsync(
        Guid userId,
        string mobile,
        IReadOnlyCollection<string> roles,
        IReadOnlyCollection<string> permissions,
        CancellationToken ct) => IssueInFamilyAsync(userId, mobile, roles, permissions, Guid.NewGuid(), ct);

    public async Task<TokenResponse?> RotateRefreshTokenAsync(string refreshToken, CancellationToken ct)
    {
        if (!IsValidRefreshToken(refreshToken)) return null;

        var hash = Sha256(refreshToken);
        var now = DateTime.UtcNow;
        await using var transaction = await db.Database.BeginTransactionAsync(IsolationLevel.Serializable, ct);
        var token = await db.RefreshTokens.SingleOrDefaultAsync(x => x.TokenHash == hash, ct);
        if (token is null || token.ExpiresAtUtc <= now)
        {
            await transaction.RollbackAsync(ct);
            return null;
        }

        if (token.RevokedAtUtc is not null)
        {
            // A consumed token being presented again is a replay signal. Revoke every
            // active descendant in the same family before rejecting the request.
            await RevokeFamilyAsync(token.FamilyId, now, ct);
            await transaction.CommitAsync(ct);
            return null;
        }

        token.RevokedAtUtc = now;
        var user = await db.Users.SingleOrDefaultAsync(x => x.Id == token.UserId && x.IsActive, ct);
        if (user is null || string.IsNullOrWhiteSpace(user.PhoneNumber))
        {
            await db.SaveChangesAsync(ct);
            await transaction.CommitAsync(ct);
            return null;
        }

        var roles = await (
            from ur in db.UserRoles
            join role in db.Roles on ur.RoleId equals role.Id
            where ur.UserId == user.Id
            select role.Name!).ToListAsync(ct);
        var permissions = await (
            from ur in db.UserRoles
            join rp in db.RolePermissions on ur.RoleId equals rp.RoleId
            join permission in db.Permissions on rp.PermissionId equals permission.Id
            where ur.UserId == user.Id
            select permission.Code).Distinct().ToListAsync(ct);

        var response = await IssueInFamilyAsync(user.Id, user.PhoneNumber, roles, permissions, token.FamilyId, ct);
        token.ReplacedByHash = Sha256(response.RefreshToken);
        await db.SaveChangesAsync(ct);
        await transaction.CommitAsync(ct);
        return response;
    }

    public async Task RevokeRefreshTokenFamilyAsync(string refreshToken, CancellationToken ct)
    {
        if (!IsValidRefreshToken(refreshToken)) return;
        var hash = Sha256(refreshToken);
        var familyId = await db.RefreshTokens
            .Where(x => x.TokenHash == hash)
            .Select(x => (Guid?)x.FamilyId)
            .SingleOrDefaultAsync(ct);
        if (familyId is not null) await RevokeFamilyAsync(familyId.Value, DateTime.UtcNow, ct);
    }

    private async Task<TokenResponse> IssueInFamilyAsync(
        Guid userId,
        string mobile,
        IReadOnlyCollection<string> roles,
        IReadOnlyCollection<string> permissions,
        Guid familyId,
        CancellationToken ct)
    {
        var accessMinutes = Math.Clamp(ParsePositive("Security:AccessTokenMinutes", 15), 5, 60);
        var refreshDays = Math.Clamp(ParsePositive("Security:RefreshTokenDays", 30), 1, 90);
        var now = DateTime.UtcNow;
        var expires = now.AddMinutes(accessMinutes);
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(
            cfg["Security:JwtSigningKey"] ?? throw new InvalidOperationException("JWT key missing")));
        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, userId.ToString()),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString("N")),
            new(JwtRegisteredClaimNames.Iat, EpochTime.GetIntDate(now).ToString(), ClaimValueTypes.Integer64),
            new(ClaimTypes.NameIdentifier, userId.ToString()),
            new("mobile", mobile),
        };
        claims.AddRange(roles.Distinct(StringComparer.Ordinal).Select(x => new Claim(ClaimTypes.Role, x)));
        claims.AddRange(permissions.Distinct(StringComparer.Ordinal).Select(x => new Claim("permission", x)));
        var token = new JwtSecurityToken(
            cfg["Security:Issuer"] ?? "tseai-identity",
            cfg["Security:Audience"] ?? "tseai",
            claims,
            notBefore: now,
            expires: expires,
            signingCredentials: new SigningCredentials(key, SecurityAlgorithms.HmacSha256));
        var access = new JwtSecurityTokenHandler().WriteToken(token);
        var rawRefresh = Convert.ToHexString(RandomNumberGenerator.GetBytes(48));
        db.RefreshTokens.Add(new RefreshToken
        {
            UserId = userId,
            FamilyId = familyId,
            TokenHash = Sha256(rawRefresh),
            ExpiresAtUtc = now.AddDays(refreshDays),
        });
        await db.SaveChangesAsync(ct);
        return new TokenResponse(access, rawRefresh, expires, userId, mobile, roles.ToArray(), permissions.ToArray());
    }

    private Task<int> RevokeFamilyAsync(Guid familyId, DateTime revokedAtUtc, CancellationToken ct) =>
        db.RefreshTokens
            .Where(x => x.FamilyId == familyId && x.RevokedAtUtc == null)
            .ExecuteUpdateAsync(update => update.SetProperty(x => x.RevokedAtUtc, revokedAtUtc), ct);

    private int ParsePositive(string key, int fallback) =>
        int.TryParse(cfg[key], out var value) && value > 0 ? value : fallback;

    private static bool IsValidRefreshToken(string? value) =>
        value is { Length: RefreshTokenHexLength } && value.All(Uri.IsHexDigit);

    private static string Sha256(string input) =>
        Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(input)));
}
