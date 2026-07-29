using System.Net.Http.Json;

namespace NegareshAI.Api.Services;

public interface IAiDocumentProcessor
{
    Task<AiProcessingResult> ProcessAsync(
        Guid organizationId,
        Guid documentId,
        Guid versionId,
        string fileName,
        byte[] content,
        string embeddingModel,
        string accessScope,
        IReadOnlyCollection<string> allowedUserIds,
        IReadOnlyCollection<string> allowedGroupIds,
        CancellationToken cancellationToken);
}

public sealed record AiProcessingResult(
    string Status,
    int PageCount,
    int Characters,
    int ChunkCount,
    int OcrPageCount,
    string? ExtractedText);

public sealed class AiDocumentProcessor(HttpClient httpClient) : IAiDocumentProcessor
{
    public async Task<AiProcessingResult> ProcessAsync(
        Guid organizationId,
        Guid documentId,
        Guid versionId,
        string fileName,
        byte[] content,
        string embeddingModel,
        string accessScope,
        IReadOnlyCollection<string> allowedUserIds,
        IReadOnlyCollection<string> allowedGroupIds,
        CancellationToken cancellationToken)
    {
        using var response = await httpClient.PostAsJsonAsync("pipeline/process", new
        {
            organizationId,
            documentId,
            versionId,
            fileName,
            contentBase64 = Convert.ToBase64String(content),
            embeddingModel,
            accessScope,
            allowedUserIds,
            allowedGroupIds
        }, cancellationToken);
        response.EnsureSuccessStatusCode();
        return await response.Content.ReadFromJsonAsync<AiProcessingResult>(
                   cancellationToken: cancellationToken)
               ?? throw new InvalidOperationException("AI processor returned an empty response.");
    }
}
