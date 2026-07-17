using Healan.Application.Portal.Services;
using MediatR;
using Microsoft.Extensions.Caching.Memory;
using Share.Domain.Exceptions;

namespace Healan.Application.Portal.Commands.PortalOtpRequest;

public class PortalOtpRequestCommand : IRequest<object>
{
    public string PhoneNumber { get; set; } = string.Empty;
}

public class PortalOtpRequestCommandHandler : IRequestHandler<PortalOtpRequestCommand, object>
{
    private static readonly TimeSpan OtpTtl = TimeSpan.FromMinutes(2);
    private static readonly TimeSpan ResendCooldown = TimeSpan.FromSeconds(90);

    private readonly IMemoryCache _cache;
    private readonly IPortalSmsSender _smsSender;

    public PortalOtpRequestCommandHandler(IMemoryCache cache, IPortalSmsSender smsSender)
    {
        _cache = cache;
        _smsSender = smsSender;
    }

    public async Task<object> Handle(PortalOtpRequestCommand request, CancellationToken cancellationToken)
    {
        var phone = RagQuotaHelper.NormalizePhone(request.PhoneNumber);
        if (phone.Length != 11 || !phone.StartsWith("09", StringComparison.Ordinal))
            throw new BadRequestExceptions("شماره موبایل معتبر نیست (مثال: 09123456789)");

        var otpKey = $"portal_otp_{phone}";
        var metaKey = $"portal_otp_meta_{phone}";
        var cooldownKey = $"portal_otp_cd_{phone}";

        // اگر کد قبلی هنوز معتبر است، همان را نگه دار و SMS جدید نفرست
        if (_cache.TryGetValue(otpKey, out string? existingCode)
            && !string.IsNullOrWhiteSpace(existingCode)
            && _cache.TryGetValue(metaKey, out OtpMeta? meta)
            && meta != null
            && meta.ExpiresAtUtc > DateTime.UtcNow)
        {
            var remaining = (int)Math.Ceiling((meta.ExpiresAtUtc - DateTime.UtcNow).TotalSeconds);
            return new
            {
                sent = true,
                reused = true,
                expiresInSeconds = Math.Max(1, remaining),
                phoneMasked = RagQuotaHelper.MaskPhone(phone),
            };
        }

        if (_cache.TryGetValue(cooldownKey, out _))
            throw new BadRequestExceptions("لطفاً کمی صبر کنید و دوباره تلاش کنید.");

        var code = Random.Shared.Next(100000, 999999).ToString();
        var expiresAt = DateTime.UtcNow.Add(OtpTtl);
        _cache.Set(otpKey, code, OtpTtl);
        _cache.Set(metaKey, new OtpMeta(expiresAt), OtpTtl);
        _cache.Set(cooldownKey, true, ResendCooldown);

        var (ok, error) = await _smsSender.SendAsync(
            phone,
            $"کلینیک قلب دکتر معصومه شهرویی\nکد تأیید ورود به دستیار هوشمند: {code}",
            cancellationToken);

        if (!ok)
            throw new BadRequestExceptions(error ?? "ارسال پیامک ناموفق بود.");

        return new
        {
            sent = true,
            reused = false,
            expiresInSeconds = (int)OtpTtl.TotalSeconds,
            phoneMasked = RagQuotaHelper.MaskPhone(phone),
        };
    }

    private sealed record OtpMeta(DateTime ExpiresAtUtc);
}
