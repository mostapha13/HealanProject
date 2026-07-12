using Healan.Application.Portal.Dtos;
using Healan.Application.Common.Interfaces;
using Healan.Domain.Portal.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Healan.Application.Portal.Queries.RagSettingGet;

public class RagSettingGetQuery : IRequest<RagSettingDto> { }

public class RagSettingGetQueryHandler : IRequestHandler<RagSettingGetQuery, RagSettingDto>
{
    private readonly IApplicationDbContext _db;

    public RagSettingGetQueryHandler(IApplicationDbContext db) => _db = db;

    public async Task<RagSettingDto> Handle(RagSettingGetQuery request, CancellationToken cancellationToken)
    {
        var setting = await _db.RagSettings.AsNoTracking().FirstOrDefaultAsync(cancellationToken);
        if (setting == null)
        {
            setting = new RagSetting();
            _db.RagSettings.Add(setting);
            await _db.SaveChangesAsync(cancellationToken);
        }

        return Map(setting);
    }

    internal static RagSettingDto Map(RagSetting setting) => new()
    {
        RagSettingId = setting.RagSettingId,
        SyncIntervalMinutes = setting.SyncIntervalMinutes,
        SimilarityThresholdPercent = setting.SimilarityThresholdPercent,
        PythonApiUrl = setting.PythonApiUrl,
        IsEnabled = setting.IsEnabled,
        LastSyncedAt = setting.LastSyncedAt,
    };
}
