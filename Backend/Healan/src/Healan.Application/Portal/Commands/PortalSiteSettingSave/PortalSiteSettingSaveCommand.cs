using Healan.Application.Portal.Dtos;
using Healan.Application.Common.Interfaces;
using Healan.Domain.Portal.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Healan.Application.Portal.Commands.PortalSiteSettingSave;

public class PortalSiteSettingSaveCommand : IRequest<PortalMutationResult>
{
    public List<PortalSiteSettingDto> Settings { get; set; } = new();
}

public class PortalSiteSettingSaveCommandHandler : IRequestHandler<PortalSiteSettingSaveCommand, PortalMutationResult>
{
    private readonly IApplicationDbContext _db;

    public PortalSiteSettingSaveCommandHandler(IApplicationDbContext db) => _db = db;

    public async Task<PortalMutationResult> Handle(PortalSiteSettingSaveCommand request, CancellationToken cancellationToken)
    {
        if (request.Settings == null || request.Settings.Count == 0)
            throw new ArgumentException("حداقل یک تنظیمات ارسال کنید");

        var keys = request.Settings
            .Select(s => s.SettingKey?.Trim())
            .Where(k => !string.IsNullOrWhiteSpace(k))
            .Select(k => k!)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        var existing = await _db.PortalSiteSettings
            .Where(x => keys.Contains(x.SettingKey))
            .ToListAsync(cancellationToken);

        foreach (var dto in request.Settings)
        {
            var key = dto.SettingKey?.Trim();
            if (string.IsNullOrWhiteSpace(key))
                continue;

            var setting = existing.FirstOrDefault(x => x.SettingKey.Equals(key, StringComparison.OrdinalIgnoreCase));
            if (setting == null)
            {
                setting = new PortalSiteSetting { SettingKey = key };
                _db.PortalSiteSettings.Add(setting);
                existing.Add(setting);
            }

            setting.SettingValue = dto.SettingValue?.Trim() ?? string.Empty;
            setting.SettingGroup = dto.SettingGroup?.Trim();
            setting.Description = dto.Description?.Trim();
        }

        await _db.SaveChangesAsync(cancellationToken);
        return new PortalMutationResult { Id = existing.Count };
    }
}
