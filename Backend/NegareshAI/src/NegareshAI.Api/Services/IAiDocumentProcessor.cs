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
        bool publishToRag,
        CancellationToken cancellationToken);

    Task<int> PublishTextAsync(
        Guid organizationId, Guid documentId, Guid versionId,
        string extractedText, string embeddingModel, string accessScope,
        IReadOnlyCollection<string> allowedUserIds,
        IReadOnlyCollection<string> allowedGroupIds,
        CancellationToken cancellationToken);

    Task DeleteVersionAsync(
        Guid organizationId, Guid documentId, Guid versionId,
        string embeddingModel, CancellationToken cancellationToken);
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
        bool publishToRag,
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
            allowedGroupIds,
            publishToRag
        }, cancellationToken);
        response.EnsureSuccessStatusCode();
        return await response.Content.ReadFromJsonAsync<AiProcessingResult>(
                   cancellationToken: cancellationToken)
               ?? throw new InvalidOperationException("AI processor returned an empty response.");
    }

    public async Task<int> PublishTextAsync(
        Guid organizationId, Guid documentId, Guid versionId,
        string extractedText, string embeddingModel, string accessScope,
        IReadOnlyCollection<string> allowedUserIds,
        IReadOnlyCollection<string> allowedGroupIds,
        CancellationToken cancellationToken)
    {
        var chunks = extractedText.Split('\f', StringSplitOptions.RemoveEmptyEntries)
            .Select((text, index) => new { text, page = index + 1, section = "approved-version" })
            .Where(x => !string.IsNullOrWhiteSpace(x.text)).ToArray();
        using var response = await httpClient.PostAsJsonAsync("rag/index", new
        {
            organizationId, documentId, versionId, embeddingModel, accessScope,
            allowedUserIds, allowedGroupIds, chunks
        }, cancellationToken);
        response.EnsureSuccessStatusCode();
        var result = await response.Content.ReadFromJsonAsync<IndexResult>(cancellationToken);
        return result?.Indexed ?? 0;
    }

    public async Task DeleteVersionAsync(
        Guid organizationId, Guid documentId, Guid versionId,
        string embeddingModel, CancellationToken cancellationToken)
    {
        using var response = await httpClient.PostAsJsonAsync("rag/delete-version", new
        { organizationId, documentId, versionId, embeddingModel }, cancellationToken);
        response.EnsureSuccessStatusCode();
    }

    private sealed record IndexResult(int Indexed);
}
