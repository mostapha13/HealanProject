using Healan.Application.Portal.Dtos;
using Healan.Application.Portal.Services;
using IdentityServer.GrpcClient;
using IdentityServer.GrpcClient.Interfaces;
using MediatR;
using Microsoft.Extensions.Caching.Memory;
using Share.Domain.Enums;
using Share.Domain.Exceptions;

namespace Healan.Application.Portal.Commands.PortalOtpVerify;

public class PortalOtpVerifyCommand : IRequest<PortalAuthResultDto>
{
    public string PhoneNumber { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
}

public class PortalOtpVerifyCommandHandler : IRequestHandler<PortalOtpVerifyCommand, PortalAuthResultDto>
{
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

        _cache.Remove($"portal_otp_cd_{phone}");

        UserSummaryReply? saved;
        try
        {
            saved = await _identityTool.SaveUser(new SaveRequest
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
        }
        catch (BadRequestExceptions)
        {
            throw;
        }
        catch (OperationCanceledException)
        {
            throw;
        }
        catch (Exception)
        {
            throw new BadRequestExceptions("ارتباط با سرویس احراز هویت برقرار نشد. کمی بعد دوباره تلاش کنید.");
        }

        if (saved == null || string.IsNullOrWhiteSpace(saved.UserId) || !Guid.TryParse(saved.UserId, out var userId))
            throw new BadRequestExceptions("امکان ایجاد/یافتن کاربر فراهم نشد. دوباره تلاش کنید.");

        // کد را فقط بعد از موفقیت ساخت کاربر باطل کن
        _cache.Remove(cacheKey);

        await PortalAspNetRoleHelper.EnsureAsync(_identityTool, userId, includePatient: false);

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

}
