using System.Text.Json;
using NegareshAI.Api.Application.Common.Tenancy;
using NegareshAI.Api.Data;

namespace NegareshAI.Api.Application.Common.Auditing;

public interface IAuditWriter
{
    void Add(string action, string entityType, string? entityId, object? metadata = null);
}

public sealed class AuditWriter(
    NegareshDbContext db,
    ICurrentTenant tenant) : IAuditWriter
{
    public void Add(string action, string entityType, string? entityId, object? metadata = null)
    {
        db.AuditLogs.Add(new AuditLog
        {
            OrganizationId = tenant.OrganizationId,
            UserId = tenant.UserId,
            Action = action,
            EntityType = entityType,
            EntityId = entityId,
            MetadataJson = metadata is null ? null : JsonSerializer.Serialize(metadata)
        });
    }
}
