using System.Net.Http.Json;
using Microsoft.Extensions.Logging;
using TSEAI.Application.Chat.Context;

namespace TSEAI.Infrastructure.Chat;

public sealed class HttpAiConversationQueryRewriter(
    HttpClient http,
    ILogger<HttpAiConversationQueryRewriter> logger) : IConversationQueryRewriter
{
    public async Task<ConversationRewriteResult?> RewriteAsync(ConversationRewriteRequest request,CancellationToken ct)
    {
        try
        {
            var payload=new
            {
                question=request.Question,
                activeReference=request.ActiveReference,
                recentTurns=request.RecentTurns.Select(x=>new
                {
                    question=x.Question,
                    answer=x.Answer,
                    subjectName=x.SubjectName
                }).ToArray()
            };
            using var response=await http.PostAsJsonAsync("chat/rewrite",payload,ct);
            if(!response.IsSuccessStatusCode) return null;
            var dto=await response.Content.ReadFromJsonAsync<RewriteDto>(cancellationToken:ct);
            if(dto is null || string.IsNullOrWhiteSpace(dto.StandaloneQuestion)) return null;
            return new(dto.StandaloneQuestion.Trim(),dto.ContextApplied,dto.Reason);
        }
        catch(OperationCanceledException) when(ct.IsCancellationRequested) { throw; }
        catch(Exception exception)
        {
            logger.LogWarning(exception,"Conversation query rewrite failed; deterministic context handling will continue.");
            return null;
        }
    }

    private sealed record RewriteDto(string StandaloneQuestion,bool ContextApplied,string? Reason);
}
