using System.Net.Http.Json;
using Healan.Application.Common.Interfaces;
using Healan.Application.Reports.Dtos;
using Healan.Application.Reports.Queries.GetSmsSettings;
using Healan.Domain.Sms.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Share.Domain.Exceptions;

namespace Healan.Application.Reports.Commands.SaveSmsSettings;

public class SaveSmsSettingsCommand : IRequest<SmsSettingDto>
{
    /// <summary>اگر خالی/ماسک باشد، ApiKey قبلی حفظ می‌شود</summary>
    public string? ApiKey { get; set; }
    public int TemplateId { get; set; } = 640023;
    public long LineNumber { get; set; }
    public string VerifyParameterName { get; set; } = "Code";
    public bool SendEnabled { get; set; } = true;
}

public class SaveSmsSettingsCommandHandler : IRequestHandler<SaveSmsSettingsCommand, SmsSettingDto>
{
    private readonly IApplicationDbContext _db;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IConfiguration _configuration;
    private readonly ILogger<SaveSmsSettingsCommandHandler> _logger;

    public SaveSmsSettingsCommandHandler(
        IApplicationDbContext db,
        IHttpClientFactory httpClientFactory,
        IConfiguration configuration,
        ILogger<SaveSmsSettingsCommandHandler> logger)
    {
        _db = db;
        _httpClientFactory = httpClientFactory;
        _configuration = configuration;
        _logger = logger;
    }

    public async Task<SmsSettingDto> Handle(SaveSmsSettingsCommand request, CancellationToken cancellationToken)
    {
        if (request.TemplateId < 0)
            throw new BadRequestExceptions("TemplateId نامعتبر است");
        if (request.LineNumber < 0)
            throw new BadRequestExceptions("LineNumber نامعتبر است");

        var setting = await _db.SmsSettings.FirstOrDefaultAsync(cancellationToken);
        if (setting == null)
        {
            setting = new SmsSetting();
            _db.SmsSettings.Add(setting);
        }

        if (!string.IsNullOrWhiteSpace(request.ApiKey) && !LooksMasked(request.ApiKey))
            setting.ApiKey = request.ApiKey.Trim();

        setting.TemplateId = request.TemplateId > 0 ? request.TemplateId : 640023;
        setting.LineNumber = request.LineNumber;
        setting.VerifyParameterName = string.IsNullOrWhiteSpace(request.VerifyParameterName)
            ? "Code"
            : request.VerifyParameterName.Trim();
        setting.SendEnabled = request.SendEnabled;
        setting.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync(cancellationToken);

        await PushToSmsProviderAsync(setting, cancellationToken);

        return GetSmsSettingsQueryHandler.Map(setting);
    }

    private static bool LooksMasked(string value) =>
        value.Contains('*', StringComparison.Ordinal);

    private async Task PushToSmsProviderAsync(SmsSetting setting, CancellationToken cancellationToken)
    {
        var baseUrl = _configuration["SMSProviderBaseUrl"]?.Trim();
        if (string.IsNullOrWhiteSpace(baseUrl))
        {
            _logger.LogWarning("SMSProviderBaseUrl not set — skipped push of SMS settings");
            return;
        }

        if (!baseUrl.EndsWith('/'))
            baseUrl += "/";

        try
        {
            var client = _httpClientFactory.CreateClient("SMSProvider");
            client.BaseAddress ??= new Uri(baseUrl);

            using var response = await client.PutAsJsonAsync(
                "Settings",
                new
                {
                    apiKey = setting.ApiKey,
                    templateId = setting.TemplateId,
                    lineNumber = setting.LineNumber,
                    verifyParameterName = setting.VerifyParameterName,
                    sendEnabled = setting.SendEnabled,
                },
                cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                var body = await response.Content.ReadAsStringAsync(cancellationToken);
                _logger.LogWarning(
                    "Push SMS settings to SMSProvider failed: {Status} {Body}",
                    (int)response.StatusCode,
                    body);
            }
        }
        catch (Exception ex)
        {
            // تنظیمات در Healan ذخیره شده؛ push ناموفق نباید Save را fail کند
            _logger.LogWarning(ex, "Push SMS settings to SMSProvider failed");
        }
    }
}
