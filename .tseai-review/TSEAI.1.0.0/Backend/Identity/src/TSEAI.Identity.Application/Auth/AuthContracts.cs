namespace TSEAI.Identity.Application.Auth;
public sealed record RequestOtpRequest(string Mobile);
public sealed record VerifyOtpRequest(string Mobile, string Code);
public sealed record RefreshRequest(string? RefreshToken);
public sealed record TokenResponse(string AccessToken, string RefreshToken, DateTime ExpiresAtUtc, Guid UserId, string Mobile, string[] Roles, string[] Permissions);
public interface IOtpService
{
    Task RequestAsync(string mobile, CancellationToken ct);
    Task<bool> VerifyAsync(string mobile, string code, CancellationToken ct);
}
public interface ITokenService
{
    Task<TokenResponse> IssueAsync(Guid userId, string mobile, IReadOnlyCollection<string> roles, IReadOnlyCollection<string> permissions, CancellationToken ct);
    Task<TokenResponse?> RotateRefreshTokenAsync(string refreshToken, CancellationToken ct);
    Task RevokeRefreshTokenFamilyAsync(string refreshToken, CancellationToken ct);
}
public interface ISmsSender { Task SendOtpAsync(string mobile, string code, CancellationToken ct); }
