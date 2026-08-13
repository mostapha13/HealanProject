using System.Net.Http.Json;
using Microsoft.Extensions.Logging;
using TSEAI.Application.Chat.Agentic;

namespace TSEAI.Infrastructure.Chat;

public sealed class HttpAiChatReflector(HttpClient http, ILogger<HttpAiChatReflector> logger) : IChatReflector
{
    public async Task<ChatReflectionResult> ReviewAsync(ChatReflectionRequest request, CancellationToken ct)
    {
        try
        {
            var payload = new { request.Question, request.Answer, Intent=request.Intent.ToString(), request.Confidence, request.EvidenceCount, request.FailedTools };
            using var response = await http.PostAsJsonAsync("chat/reflect", payload, ct);
            if (!response.IsSuccessStatusCode)
            {
                var detail=await response.Content.ReadAsStringAsync(ct);
                logger.LogWarning("AI reflection returned {Status}; accepting grounded answer. Detail={Detail}",(int)response.StatusCode,detail.Length>1000?detail[..1000]:detail);
                return Accept("reflection_http_failure");
            }
            var dto = await response.Content.ReadFromJsonAsync<ReflectionDto>(cancellationToken: ct);
            if(dto is null) return Accept("reflection_empty_response");
            var action = dto.Action?.ToLowerInvariant() switch
            {
                "accept" => "accept",
                "retrieve_more" => "retrieve_more",
                "clarify" => "clarify",
                _ => "accept"
            };
            return new ChatReflectionResult(action, dto.ImprovedQuery, dto.Clarification, dto.Reasons ?? []);
        }
        catch(OperationCanceledException) when(ct.IsCancellationRequested) { throw; }
        catch(Exception ex)
        {
            logger.LogWarning(ex,"AI reflection failed; accepting the already composed grounded answer.");
            return Accept("reflection_unavailable");
        }
    }

    private sealed record ReflectionDto(string? Action, string? ImprovedQuery, string? Clarification, string[]? Reasons);
    private static ChatReflectionResult Accept(string reason) => new("accept",null,null,[reason]);
}
