using Healan.Application.Portal.Dtos;
using Healan.Application.Common.Interfaces;
using Healan.Domain.Portal.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Share.Domain.Exceptions;

namespace Healan.Application.Portal.Commands.RagSettingSave;

public class RagSettingSaveCommand : IRequest<RagSettingDto>
{
    public int SyncIntervalMinutes { get; set; } = 10;
    public int SimilarityThresholdPercent { get; set; } = 55;
    public string PythonApiUrl { get; set; } = "http://localhost:8000";
    public bool IsEnabled { get; set; } = true;
}

public class RagSettingSaveCommandHandler : IRequestHandler<RagSettingSaveCommand, RagSettingDto>
{
    private readonly IApplicationDbContext _db;

    public RagSettingSaveCommandHandler(IApplicationDbContext db) => _db = db;

    public async Task<RagSettingDto> Handle(RagSettingSaveCommand request, CancellationToken cancellationToken)
    {
        if (request.SyncIntervalMinutes < 1 || request.SyncIntervalMinutes > 1440)
            throw new BadRequestExceptions("فاصله همگام‌سازی باید بین ۱ تا ۱۴۴۰ دقیقه باشد");
        if (request.SimilarityThresholdPercent < 1 || request.SimilarityThresholdPercent > 100)
            throw new BadRequestExceptions("آستانه شباهت باید بین ۱ تا ۱۰۰ باشد");
        if (string.IsNullOrWhiteSpace(request.PythonApiUrl))
            throw new BadRequestExceptions("آدرس سرویس Python الزامی است");

        var setting = await _db.RagSettings.FirstOrDefaultAsync(cancellationToken);
        if (setting == null)
        {
            setting = new RagSetting();
            _db.RagSettings.Add(setting);
        }

        setting.SyncIntervalMinutes = request.SyncIntervalMinutes;
        setting.SimilarityThresholdPercent = request.SimilarityThresholdPercent;
        setting.PythonApiUrl = request.PythonApiUrl.Trim().TrimEnd('/');
        setting.IsEnabled = request.IsEnabled;
        setting.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync(cancellationToken);
        return Queries.RagSettingGet.RagSettingGetQueryHandler.Map(setting);
    }
}
