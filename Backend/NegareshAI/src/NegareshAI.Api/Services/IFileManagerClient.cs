namespace NegareshAI.Api.Services;

public interface IFileManagerClient
{
    Task<string> UploadAsync(Stream content, string fileName, string contentType, string? bearerToken, CancellationToken cancellationToken);
    Task<FileManagerDownload> DownloadAsync(string fileId, string? bearerToken, CancellationToken cancellationToken);
}

public sealed record FileManagerDownload(byte[] Content, string FileName, string ContentType);

public sealed class FileManagerClient(HttpClient httpClient) : IFileManagerClient
{
    public async Task<string> UploadAsync(Stream content, string fileName, string contentType, string? bearerToken, CancellationToken cancellationToken)
    {
        using var form = new MultipartFormDataContent();
        using var streamContent = new StreamContent(content);
        streamContent.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue(contentType);
        form.Add(streamContent, "file", fileName);
        using var request = new HttpRequestMessage(HttpMethod.Post, "File/Upload") { Content = form };
        if (!string.IsNullOrWhiteSpace(bearerToken)) request.Headers.Authorization = new("Bearer", bearerToken);
        using var response = await httpClient.SendAsync(request, cancellationToken);
        response.EnsureSuccessStatusCode();
        var payload = await response.Content.ReadAsStringAsync(cancellationToken);
        return ExtractFileId(payload);
    }

    public async Task<FileManagerDownload> DownloadAsync(
        string fileId,
        string? bearerToken,
        CancellationToken cancellationToken)
    {
        using var request = new HttpRequestMessage(
            HttpMethod.Get, $"File/Download/{ExtractFileId(fileId)}");
        if (!string.IsNullOrWhiteSpace(bearerToken))
            request.Headers.Authorization = new("Bearer", bearerToken);
        using var response = await httpClient.SendAsync(request, cancellationToken);
        response.EnsureSuccessStatusCode();
        var content = await response.Content.ReadAsByteArrayAsync(cancellationToken);
        var fileName = response.Content.Headers.ContentDisposition?.FileNameStar
            ?? response.Content.Headers.ContentDisposition?.FileName?.Trim('"')
            ?? $"document-{fileId}";
        var contentType = response.Content.Headers.ContentType?.MediaType
            ?? "application/octet-stream";
        return new FileManagerDownload(content, fileName, contentType);
    }

    private static string ExtractFileId(string payload)
    {
        var normalized = payload.Trim().Trim('"');
        if (!normalized.StartsWith('{'))
            return normalized;
        using var json = System.Text.Json.JsonDocument.Parse(normalized);
        return json.RootElement.TryGetProperty("fileId", out var fileId)
            ? fileId.GetString() ?? normalized
            : normalized;
    }
}
