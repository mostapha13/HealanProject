using Healan.Application.Portal.Dtos;
using Healan.Application.Portal.Services;
using IdentityServer.GrpcClient;
using IdentityServer.GrpcClient.Interfaces;
using MediatR;
using Microsoft.Extensions.Caching.Memory;
using Share.Domain.Enums;
using Share.Domain.Exceptions;
using Share.Domain.Models.UserAccessModels;

namespace Healan.Application.Portal.Commands.PortalOtpVerify;

public class PortalOtpVerifyCommand : IRequest<PortalAuthResultDto>
{
    public string PhoneNumber { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
}

public class PortalOtpVerifyCommandHandler : IRequestHandler<PortalOtpVerifyCommand, PortalAuthResultDto>
{
    private const string SiteUserRole = nameof(UserAccesRoleId.SiteUser);
    private const string DefaultPassword = "aA@123456";

    private readonly IMemoryCache _cache;
    private readonly IIdentityTool _identityTool;
    private readonly IPortalAuthTokenService _tokenService;

    public PortalOtpVerifyCommandHandler(
        IMemoryCache cache,
        IIdentityTool identityTool,
        IPortalAuthTokenService tokenService)
    {
        _cache = cache;
        _identityTool = identityTool;
        _tokenService = tokenService;
    }

    public async Task<PortalAuthResultDto> Handle(PortalOtpVerifyCommand request, CancellationToken cancellationToken)
    {
        var phone = RagQuotaHelper.NormalizePhone(request.PhoneNumber);
        var code = RagQuotaHelper.ToAsciiDigits(request.Code);
        if (phone.Length != 11 || !phone.StartsWith("09", StringComparison.Ordinal))
            throw new BadRequestExceptions("شماره موبایل معتبر نیست");
        if (code.Length < 4)
            throw new BadRequestExceptions("کد تأیید نامعتبر است");

        var cacheKey = $"portal_otp_{phone}";
        if (!_cache.TryGetValue(cacheKey, out string? expected)
            || !string.Equals(RagQuotaHelper.ToAsciiDigits(expected), code, StringComparison.Ordinal))
            throw new BadRequestExceptions("کد تأیید نادرست یا منقضی شده است");

        _cache.Remove(cacheKey);
        _cache.Remove($"portal_otp_cd_{phone}");

        var saved = await _identityTool.SaveUser(new SaveRequest
        {
            UserId = string.Empty,
            PhoneNumber = phone,
            FirstName = string.Empty,
            LastName = string.Empty,
            IsActive = true,
            Password = DefaultPassword,
            DepartmentId = (int)DepartmentId.Public,
            TwoFactorEnabled = false,
        });

        if (saved == null || string.IsNullOrWhiteSpace(saved.UserId) || !Guid.TryParse(saved.UserId, out var userId))
            throw new BadRequestExceptions("امکان ایجاد/یافتن کاربر فراهم نشد. دوباره تلاش کنید.");

        await EnsureSiteUserRoleAsync(userId);

        var token = _tokenService.CreateToken(userId, phone, out var expiresAt);
        return new PortalAuthResultDto
        {
            AccessToken = token,
            UserId = userId,
            PhoneNumber = phone,
            PhoneMasked = RagQuotaHelper.MaskPhone(phone),
            ExpiresAtUtc = expiresAt,
        };
    }

    private async Task EnsureSiteUserRoleAsync(Guid userId)
    {
        var roleInfos = await _identityTool.GetUserRole(new GetByIdRequest { UserId = userId.ToString() });
        var names = roleInfos?.RoleInfos_
            ?.Select(r => r.RoleName)
            .Where(n => !string.IsNullOrWhiteSpace(n))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList() ?? new List<string>();

        if (names.Any(n => string.Equals(n, SiteUserRole, StringComparison.OrdinalIgnoreCase)))
            return;

        names.Add(SiteUserRole);
        var setRequest = new SetUserRoleRequest { UserId = userId.ToString() };
        foreach (var name in names)
            setRequest.RoleNames.Add(name);

        await _identityTool.SetUserRole(setRequest);
    }
}
