using System.Net.Http.Headers;
using System.Net.Http.Json;

namespace NegareshAI.Api.Services;

public interface IContractDocumentGenerator
{
    Task<byte[]> GenerateAsync(byte[] template, IReadOnlyDictionary<string, string> values,
        CancellationToken cancellationToken);
    Task<byte[]> GeneratePdfAsync(ContractPdfRequest request, CancellationToken cancellationToken);
}

public sealed record ContractPdfCitation(
    string DocumentTitle, Guid DocumentId, Guid VersionId, int Page, string? Section, string Evidence);
public sealed record ContractPdfRequest(
    Guid ConversationId, int DraftVersion, string Subject, string PartyName,
    string StartDate, string EndDate, string Amount, string Currency,
    string? NewClause, string ApprovedClauses, string DiffJson,
    IReadOnlyList<ContractPdfCitation> Citations, DateTime CreatedAtUtc);

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

    public async Task<byte[]> GeneratePdfAsync(
        ContractPdfRequest request, CancellationToken cancellationToken)
    {
        using var response = await httpClient.PostAsJsonAsync(
            "contract/pdf", request, cancellationToken);
        response.EnsureSuccessStatusCode();
        return await response.Content.ReadAsByteArrayAsync(cancellationToken);
    }
}
