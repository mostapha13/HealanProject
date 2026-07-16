using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using SMSProvider.Application.Configs;
using SMSProvider.Application.Entities;
using SMSProvider.Application.Interfaces;
using SMSProvider.Infrastructure.Persistence;

namespace SMSProvider.Infrastructure.Services;

public sealed class SmsRuntimeSettingsStore : ISmsRuntimeSettings
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly SmsIrOptions _fallback;
    private readonly ILogger<SmsRuntimeSettingsStore> _logger;
    private readonly SemaphoreSlim _gate = new(1, 1);
    private SmsRuntimeSnapshot? _cache;

    public SmsRuntimeSettingsStore(
        IServiceScopeFactory scopeFactory,
        IOptions<SmsIrOptions> fallback,
        ILogger<SmsRuntimeSettingsStore> logger)
    {
        _scopeFactory = scopeFactory;
        _fallback = fallback.Value;
        _logger = logger;
    }

    public async Task<SmsRuntimeSnapshot> GetAsync(CancellationToken cancellationToken = default)
    {
        if (_cache != null)
            return Clone(_cache);

        await _gate.WaitAsync(cancellationToken);
        try
        {
            if (_cache != null)
                return Clone(_cache);

            using var scope = _scopeFactory.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var row = await db.SmsProviderSettings.AsNoTracking().FirstOrDefaultAsync(cancellationToken);
            if (row == null)
            {
                _cache = SmsRuntimeSnapshot.FromOptions(_fallback);
                return Clone(_cache);
            }

            _cache = FromEntity(row, _fallback);
            return Clone(_cache);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed loading SmsProviderSettings — using appsettings fallback");
            _cache = SmsRuntimeSnapshot.FromOptions(_fallback);
            return Clone(_cache);
        }
        finally
        {
            _gate.Release();
        }
    }

    public async Task SaveAsync(SmsRuntimeSnapshot snapshot, CancellationToken cancellationToken = default)
    {
        await _gate.WaitAsync(cancellationToken);
        try
        {
            using var scope = _scopeFactory.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var row = await db.SmsProviderSettings.FirstOrDefaultAsync(cancellationToken);
            if (row == null)
            {
                row = new SmsProviderSetting { Id = 1 };
                db.SmsProviderSettings.Add(row);
            }

            row.ApiKey = snapshot.ApiKey?.Trim() ?? string.Empty;
            row.TemplateId = snapshot.TemplateId > 0 ? snapshot.TemplateId : 640023;
            row.LineNumber = snapshot.LineNumber;
            row.VerifyParameterName = string.IsNullOrWhiteSpace(snapshot.VerifyParameterName)
                ? "Code"
                : snapshot.VerifyParameterName.Trim();
            row.SendEnabled = snapshot.SendEnabled;
            row.UpdatedAt = DateTime.UtcNow;

            await db.SaveChangesAsync(cancellationToken);
            _cache = Clone(snapshot);
            _cache.PreferVerifyForOtp = _fallback.PreferVerifyForOtp;
            _cache.LogOnlyWhenUnconfigured = _fallback.LogOnlyWhenUnconfigured;
        }
        finally
        {
            _gate.Release();
        }
    }

    private static SmsRuntimeSnapshot FromEntity(SmsProviderSetting row, SmsIrOptions fallback) => new()
    {
        ApiKey = row.ApiKey ?? string.Empty,
        TemplateId = row.TemplateId > 0 ? row.TemplateId : 640023,
        LineNumber = row.LineNumber,
        VerifyParameterName = string.IsNullOrWhiteSpace(row.VerifyParameterName) ? "Code" : row.VerifyParameterName,
        PreferVerifyForOtp = fallback.PreferVerifyForOtp,
        SendEnabled = row.SendEnabled,
        LogOnlyWhenUnconfigured = fallback.LogOnlyWhenUnconfigured,
    };

    private static SmsRuntimeSnapshot Clone(SmsRuntimeSnapshot s) => new()
    {
        ApiKey = s.ApiKey,
        TemplateId = s.TemplateId,
        LineNumber = s.LineNumber,
        VerifyParameterName = s.VerifyParameterName,
        PreferVerifyForOtp = s.PreferVerifyForOtp,
        SendEnabled = s.SendEnabled,
        LogOnlyWhenUnconfigured = s.LogOnlyWhenUnconfigured,
    };
}
