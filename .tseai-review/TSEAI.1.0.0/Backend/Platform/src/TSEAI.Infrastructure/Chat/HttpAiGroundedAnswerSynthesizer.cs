using System.Net.Http.Json;
using Microsoft.Extensions.Logging;
using TSEAI.Application.Chat.Agentic;

namespace TSEAI.Infrastructure.Chat;

public sealed class HttpAiGroundedAnswerSynthesizer(
    HttpClient http,
    ILogger<HttpAiGroundedAnswerSynthesizer> logger) : IChatAnswerSynthesizer
{
    public async Task<string?> SynthesizeAsync(GroundedAnswerSynthesisRequest request,CancellationToken ct)
    {
        try
        {
            var payload=new
            {
                question=request.Question,
                structuredAnswer=request.StructuredAnswer,
                structuredFacts=request.StructuredFacts,
                evidence=request.Evidence,
                missingFacets=request.MissingFacets,
                recentTurns=request.RecentTurns.TakeLast(6).Select(x=>new { x.Question,x.Answer,x.SubjectName }).ToArray()
            };
            using var response=await http.PostAsJsonAsync("chat/synthesize",payload,ct);
            if(!response.IsSuccessStatusCode) return null;
            var dto=await response.Content.ReadFromJsonAsync<SynthesisDto>(cancellationToken:ct);
            var answer=dto?.Answer?.Trim();
            return string.IsNullOrWhiteSpace(answer) || answer.Length>12000?null:answer;
        }
        catch(OperationCanceledException) when(ct.IsCancellationRequested) { throw; }
        catch(Exception exception)
        {
            logger.LogWarning(exception,"Grounded answer synthesis failed; deterministic composition will be used.");
            return null;
        }
    }

    private sealed record SynthesisDto(string? Answer);
}
