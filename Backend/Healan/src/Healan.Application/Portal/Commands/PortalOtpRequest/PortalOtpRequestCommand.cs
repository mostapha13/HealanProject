using Healan.Application.Portal.Dtos;
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

        var cooldownKey = $"portal_otp_cd_{phone}";
        if (_cache.TryGetValue(cooldownKey, out _))
            throw new BadRequestExceptions("کد قبلی هنوز معتبر است. لطفاً کمی صبر کنید.");

        var code = Random.Shared.Next(100000, 999999).ToString();
        _cache.Set($"portal_otp_{phone}", code, TimeSpan.FromMinutes(2));
        _cache.Set(cooldownKey, true, TimeSpan.FromSeconds(90));

        var (ok, error) = await _smsSender.SendAsync(
            phone,
            $"کلینیک قلب دکتر معصومه شهرویی\nکد تأیید ورود به دستیار هوشمند: {code}",
            cancellationToken);

        if (!ok)
            throw new BadRequestExceptions(error ?? "ارسال پیامک ناموفق بود.");

        return new { sent = true, expiresInSeconds = 120, phoneMasked = RagQuotaHelper.MaskPhone(phone) };
    }
}
