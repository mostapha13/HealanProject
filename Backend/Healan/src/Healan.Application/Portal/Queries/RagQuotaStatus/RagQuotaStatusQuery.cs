using Healan.Application.Common.Interfaces;
using Healan.Application.Portal.Dtos;
using Healan.Application.Portal.Services;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Healan.Application.Portal.Queries.RagQuotaStatus;

public class RagQuotaStatusQuery : IRequest<RagQuotaStatusDto>
{
    public string? GuestKey { get; set; }
    public string? AccessToken { get; set; }
}

public class RagQuotaStatusQueryHandler : IRequestHandler<RagQuotaStatusQuery, RagQuotaStatusDto>
{
    private readonly IApplicationDbContext _db;
    private readonly IPortalAuthTokenService _tokenService;

    public RagQuotaStatusQueryHandler(IApplicationDbContext db, IPortalAuthTokenService tokenService)
    {
        _db = db;
        _tokenService = tokenService;
    }

    public async Task<RagQuotaStatusDto> Handle(RagQuotaStatusQuery request, CancellationToken cancellationToken)
    {
        var setting = await _db.RagSettings.AsNoTracking().FirstOrDefaultAsync(cancellationToken);
        Guid? userId = null;
        string? phone = null;
        if (_tokenService.TryValidate(request.AccessToken, out var uid, out var ph))
        {
            userId = uid;
            phone = ph;
        }

        var used = await RagQuotaHelper.CountTodayAsync(_db, userId, request.GuestKey, cancellationToken);
        var (limit, usedCount, remaining, requiresLogin) = RagQuotaHelper.Evaluate(setting, userId.HasValue, used);

        return new RagQuotaStatusDto
        {
            IsAuthenticated = userId.HasValue,
            UsedCount = usedCount,
            DailyLimit = limit,
            RemainingCount = remaining,
            RequiresLogin = requiresLogin,
            PhoneMasked = string.IsNullOrWhiteSpace(phone) ? null : RagQuotaHelper.MaskPhone(phone),
        };
    }
}
