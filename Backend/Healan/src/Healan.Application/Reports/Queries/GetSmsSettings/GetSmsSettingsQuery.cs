using Healan.Application.Reports.Dtos;
using Healan.Application.Common.Interfaces;
using Healan.Domain.Sms.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Healan.Application.Reports.Queries.GetSmsSettings;

public class GetSmsSettingsQuery : IRequest<SmsSettingDto> { }

public class GetSmsSettingsQueryHandler : IRequestHandler<GetSmsSettingsQuery, SmsSettingDto>
{
    private readonly IApplicationDbContext _db;

    public GetSmsSettingsQueryHandler(IApplicationDbContext db) => _db = db;

    public async Task<SmsSettingDto> Handle(GetSmsSettingsQuery request, CancellationToken cancellationToken)
    {
        var setting = await _db.SmsSettings.AsNoTracking().FirstOrDefaultAsync(cancellationToken);
        if (setting == null)
        {
            setting = new SmsSetting();
            _db.SmsSettings.Add(setting);
            await _db.SaveChangesAsync(cancellationToken);
        }

        return Map(setting);
    }

    internal static SmsSettingDto Map(SmsSetting setting) => new()
    {
        SmsSettingId = setting.SmsSettingId,
        ApiKeyMasked = MaskApiKey(setting.ApiKey),
        HasApiKey = !string.IsNullOrWhiteSpace(setting.ApiKey),
        TemplateId = setting.TemplateId,
        LineNumber = setting.LineNumber,
        VerifyParameterName = setting.VerifyParameterName,
        SendEnabled = setting.SendEnabled,
        UpdatedAt = setting.UpdatedAt,
    };

    internal static string MaskApiKey(string? apiKey)
    {
        if (string.IsNullOrWhiteSpace(apiKey))
            return string.Empty;

        var key = apiKey.Trim();
        if (key.Length <= 10)
            return $"{key[..Math.Min(2, key.Length)]}****{key[^Math.Min(2, key.Length)..]}";

        return $"{key[..4]}{new string('*', Math.Min(24, key.Length - 8))}{key[^4..]}";
    }
}
