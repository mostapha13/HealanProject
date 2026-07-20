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
    public string PythonApiUrl { get; set; } = "http://python-rag:8000";
    public bool IsEnabled { get; set; } = true;
    public int GuestDailyLimit { get; set; } = 10;
    public int AuthenticatedDailyLimit { get; set; } = 200;
    public string EmbeddingModel { get; set; } = "heydariAI/persian-embeddings";
    public string SummarizeModel { get; set; } = "qwen2.5:3b";
    public string SttModel { get; set; } = "small";
    public bool SaveChatLogs { get; set; } = true;
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
        if (request.GuestDailyLimit < 0 || request.GuestDailyLimit > 1000)
            throw new BadRequestExceptions("سقف سوال مهمان باید بین ۰ تا ۱۰۰۰ باشد");
        if (request.AuthenticatedDailyLimit < 1 || request.AuthenticatedDailyLimit > 5000)
            throw new BadRequestExceptions("سقف سوال کاربر لاگین‌شده باید بین ۱ تا ۵۰۰۰ باشد");
        if (string.IsNullOrWhiteSpace(request.EmbeddingModel) || request.EmbeddingModel.Trim().Length > 200)
            throw new BadRequestExceptions("مدل embedding نامعتبر است");
        if (string.IsNullOrWhiteSpace(request.SummarizeModel) || request.SummarizeModel.Trim().Length > 200)
            throw new BadRequestExceptions("مدل خلاصه‌ساز نامعتبر است");
        if (string.IsNullOrWhiteSpace(request.SttModel) || request.SttModel.Trim().Length > 200)
            throw new BadRequestExceptions("مدل گفتار به متن نامعتبر است");

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
        setting.GuestDailyLimit = request.GuestDailyLimit;
        setting.AuthenticatedDailyLimit = request.AuthenticatedDailyLimit;
        setting.EmbeddingModel = request.EmbeddingModel.Trim();
        setting.SummarizeModel = request.SummarizeModel.Trim();
        setting.SttModel = request.SttModel.Trim();
        setting.SaveChatLogs = request.SaveChatLogs;
        setting.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync(cancellationToken);
        return Queries.RagSettingGet.RagSettingGetQueryHandler.Map(setting);
    }
}
