using System.Net.Http.Json;
using System.Text.Json.Serialization;

namespace TSEAI.Knowledge.Worker;

public sealed class KnowledgeIndexerClient(HttpClient http)
{
    public async Task IndexAsync(IReadOnlyList<KnowledgeDocument> documents, CancellationToken ct)
    {
        if (documents.Count == 0) return;
        var payload = new { documents = documents.Select(d => new
        {
            document_id=d.DocumentId, source_type=d.SourceType, source_id=d.SourceId, title=d.Title, body=d.Body,
            url=d.Url, symbol=d.Symbol, category=d.Category,
            published_at=d.PublishedAt?.ToString("O"), metadata=d.Metadata
        })};
        using var response = await http.PostAsJsonAsync("knowledge/index", payload, ct);
        if (!response.IsSuccessStatusCode)
        {
            var detail = await response.Content.ReadAsStringAsync(ct);
            if (detail.Length > 4000) detail=detail[..4000];
            throw new HttpRequestException($"Knowledge index rejected batch ({(int)response.StatusCode} {response.ReasonPhrase}): {detail}",null,response.StatusCode);
        }
    }
}
