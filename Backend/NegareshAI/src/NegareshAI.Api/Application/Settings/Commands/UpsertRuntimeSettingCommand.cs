using System.Text.Json;
using MediatR;
using Microsoft.EntityFrameworkCore;
using NegareshAI.Api.Application.Common.Auditing;
using NegareshAI.Api.Application.Common.Tenancy;
using NegareshAI.Api.Contracts;
using NegareshAI.Api.Data;

namespace NegareshAI.Api.Application.Settings.Commands;

public sealed record UpsertRuntimeSettingCommand(
    string Category,
    string Key,
    string ValueJson,
    bool IsActive) : IRequest<RuntimeSettingResponse>;

public sealed class UpsertRuntimeSettingCommandHandler(
    NegareshDbContext db,
    ICurrentTenant tenant,
    IAuditWriter auditWriter)
    : IRequestHandler<UpsertRuntimeSettingCommand, RuntimeSettingResponse>
{
    public async Task<RuntimeSettingResponse> Handle(
        UpsertRuntimeSettingCommand request,
        CancellationToken cancellationToken)
    {
        using var _ = JsonDocument.Parse(request.ValueJson);
        var category = request.Category.Trim();
        var key = request.Key.Trim();
        var setting = await db.RuntimeSettings.SingleOrDefaultAsync(
            item => item.OrganizationId == tenant.OrganizationId
                && item.Category == category
                && item.Key == key,
            cancellationToken);

        if (setting is null)
        {
            setting = new RuntimeSetting
            {
                OrganizationId = tenant.OrganizationId,
                Category = category,
                Key = key,
                ValueJson = request.ValueJson,
                IsActive = request.IsActive,
                UpdatedByUserId = tenant.UserId
            };
            db.RuntimeSettings.Add(setting);
        }
        else
        {
            setting.ValueJson = request.ValueJson;
            setting.IsActive = request.IsActive;
            setting.Version++;
            setting.UpdatedByUserId = tenant.UserId;
            setting.UpdatedAtUtc = DateTime.UtcNow;
        }

        auditWriter.Add("runtime-setting.upserted", nameof(RuntimeSetting),
            setting.Id.ToString(), new { category, key, setting.Version });
        await db.SaveChangesAsync(cancellationToken);
        return new RuntimeSettingResponse(
            setting.Id, setting.Category, setting.Key, setting.ValueJson,
            setting.Version, setting.IsActive, setting.UpdatedAtUtc);
    }
}
