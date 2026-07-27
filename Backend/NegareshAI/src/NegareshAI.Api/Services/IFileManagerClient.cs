namespace NegareshAI.Api.Services;

public interface IFileManagerClient
{
    Task<string> UploadAsync(Stream content, string fileName, string contentType, string? bearerToken, CancellationToken cancellationToken);
}

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
        return await response.Content.ReadAsStringAsync(cancellationToken);
    }
}
