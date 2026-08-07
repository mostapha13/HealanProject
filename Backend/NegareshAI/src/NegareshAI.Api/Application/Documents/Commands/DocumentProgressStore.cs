using System.Text.Json;
using Microsoft.Extensions.Caching.Distributed;

namespace NegareshAI.Api.Application.Documents.Commands;

public sealed record DocumentProgressResponse(
    Guid DocumentId, int Percent, string Stage, string Status,
    string? FailureReason = null, DateTime? UpdatedAtUtc = null);

public interface IDocumentProgressStore
{
    Task SetAsync(Guid organizationId, Guid documentId, int percent, string stage,
        string status = "processing", string? failureReason = null, CancellationToken ct = default);
    Task<DocumentProgressResponse?> GetAsync(Guid organizationId, Guid documentId,
        CancellationToken ct = default);
}

public sealed class RedisDocumentProgressStore(IDistributedCache cache) : IDocumentProgressStore
{
    private static string Key(Guid organizationId, Guid documentId) =>
        $"negareshai:org:{organizationId:N}:document:{documentId:N}:progress";

    public async Task SetAsync(Guid organizationId, Guid documentId, int percent, string stage,
        string status = "processing", string? failureReason = null, CancellationToken ct = default)
    {
        var value = new DocumentProgressResponse(documentId, Math.Clamp(percent, 0, 100),
            stage, status, failureReason, DateTime.UtcNow);
        await cache.SetStringAsync(Key(organizationId, documentId), JsonSerializer.Serialize(value),
            new DistributedCacheEntryOptions { AbsoluteExpirationRelativeToNow = TimeSpan.FromHours(24) }, ct);
    }

    public async Task<DocumentProgressResponse?> GetAsync(Guid organizationId, Guid documentId,
        CancellationToken ct = default)
    {
        var json = await cache.GetStringAsync(Key(organizationId, documentId), ct);
        return string.IsNullOrWhiteSpace(json) ? null : JsonSerializer.Deserialize<DocumentProgressResponse>(json);
    }
}
