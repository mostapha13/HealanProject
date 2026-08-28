using System.Net.Http.Json;
using System.Text.RegularExpressions;
using Microsoft.Extensions.Logging;
using TSEAI.Application.Chat.Agentic;

namespace TSEAI.Infrastructure.Chat;

public sealed class HttpAiChatReflector(HttpClient http, ILogger<HttpAiChatReflector> logger) : IChatReflector
{
    public async Task<ChatReflectionResult> ReviewAsync(ChatReflectionRequest request, CancellationToken ct)
    {
        // Exact canonical SQL answers have already been constrained to typed,
        // parameterized tools and carry fact-level evidence. Running a generative
        // reflection pass cannot add authority here and serializes every exact
        // lookup behind the local LLM. Keep the reflection gate, but resolve this
        // provable case deterministically; AnswerValidationGuard still performs
        // the final claim/evidence validation in the orchestrator.
        if(request.ExactCanonical
           && request.Confidence>=0.99
           && request.EvidenceCount>0
           && request.FailedTools.Count==0
           && request.Evidence is { Count:>0 }
           && MatchesResponseShape(request.Answer,request.ResponseShape)
           && !string.IsNullOrWhiteSpace(request.Answer))
            return Accept("deterministic_exact_evidence");

        // The synthesis service has a deterministic extractive path for exact
        // field lines and source sentences. Re-running a generative reviewer
        // over a short answer that is literally present in the ranked evidence
        // adds latency and can distort a correct quotation. This check is much
        // narrower than confidence alone: every normalized answer character
        // must occur contiguously in one supplied evidence item.
        if(request.Confidence>=0.99
           && request.FailedTools.Count==0
           && IsCompactExtractiveAnswer(request.Answer,request.Evidence))
            return Accept("deterministic_extractive_evidence");

        try
        {
            var payload = new { request.Question, request.Answer, Intent=request.Intent.ToString(), request.Confidence, request.EvidenceCount, request.FailedTools, Evidence=request.Evidence??[], request.ExactCanonical, request.SemanticDomain, request.SemanticOperation, request.ResponseShape };
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

    private static bool IsCompactExtractiveAnswer(string answer,IReadOnlyList<string>? evidence)
    {
        if(string.IsNullOrWhiteSpace(answer)||answer.Length>900||evidence is not { Count:>0 }) return false;
        var compactAnswer=Compact(answer);
        return compactAnswer.Length>=12&&evidence.Any(item=>Compact(item).Contains(compactAnswer,StringComparison.Ordinal));
    }

    private static string Compact(string value)
    {
        var normalized=(value??string.Empty)
            .Replace('ي','ی').Replace('ى','ی').Replace('ك','ک').Replace("‌",string.Empty,StringComparison.Ordinal)
            .Replace('۰','0').Replace('۱','1').Replace('۲','2').Replace('۳','3').Replace('۴','4')
            .Replace('۵','5').Replace('۶','6').Replace('۷','7').Replace('۸','8').Replace('۹','9')
            .Replace('٠','0').Replace('١','1').Replace('٢','2').Replace('٣','3').Replace('٤','4')
            .Replace('٥','5').Replace('٦','6').Replace('٧','7').Replace('٨','8').Replace('٩','9');
        return Regex.Replace(normalized,@"[^\p{L}\p{Nd}]",string.Empty);
    }

    private static bool MatchesResponseShape(string answer,string? responseShape)
    {
        if(string.IsNullOrWhiteSpace(answer)) return false;
        return responseShape?.ToLowerInvariant() switch
        {
            "namesonly" or "names_only" => answer.Length<=700
                && !Regex.IsMatch(answer,@"(?:رئیس|نایب\s*رئیس|عضو\s+هیئت|نماینده|مدیرعامل|مدیر\s+عامل)"),
            "short" => answer.Length<=900,
            _ => true
        };
    }
}
