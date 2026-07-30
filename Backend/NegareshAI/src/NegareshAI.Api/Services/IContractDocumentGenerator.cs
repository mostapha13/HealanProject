using System.Net.Http.Headers;

namespace NegareshAI.Api.Services;

public interface IContractDocumentGenerator
{
    Task<byte[]> GenerateAsync(byte[] template, IReadOnlyDictionary<string, string> values,
        CancellationToken cancellationToken);
}

public sealed class ContractDocumentGenerator(HttpClient httpClient) : IContractDocumentGenerator
{
    public async Task<byte[]> GenerateAsync(byte[] template,
        IReadOnlyDictionary<string, string> values, CancellationToken cancellationToken)
    {
        using var form = new MultipartFormDataContent();
        using var file = new ByteArrayContent(template);
        file.Headers.ContentType = new MediaTypeHeaderValue(
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
        form.Add(file, "file", "contract-template.docx");
        form.Add(new StringContent(System.Text.Json.JsonSerializer.Serialize(values)), "values");
        using var response = await httpClient.PostAsync("contract/generate", form, cancellationToken);
        response.EnsureSuccessStatusCode();
        return await response.Content.ReadAsByteArrayAsync(cancellationToken);
    }
}
