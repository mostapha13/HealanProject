using System.Net.Http.Json;
using Microsoft.Extensions.Logging;
using TSEAI.Application.Chat;

namespace TSEAI.Infrastructure.Chat;

public sealed class HttpAiChatPlanner(HttpClient http,ILogger<HttpAiChatPlanner> logger):IAiChatPlanner
{
    public async Task<ChatPlan> PlanAsync(string question,CancellationToken ct)
    {
        try
        {
            using var response=await http.PostAsJsonAsync("chat/plan",new { question },ct);
            if(!response.IsSuccessStatusCode)
            {
                logger.LogWarning("AI chat planner returned HTTP {Status}.",(int)response.StatusCode);
                return Unavailable();
            }
            var dto=await response.Content.ReadFromJsonAsync<PlanDto>(cancellationToken:ct);
            if(dto is null) return Unavailable();
            if(!Enum.TryParse<ChatIntent>(dto.Intent,true,out var intent)) intent=ChatIntent.Clarification;
            return new(intent,dto.Symbol,dto.KnowledgeQuery,Math.Clamp(dto.Confidence,0,1),dto.Clarification,dto.Reasons??[]);
        }
        catch(OperationCanceledException) when(ct.IsCancellationRequested) { throw; }
        catch(Exception ex)
        {
            logger.LogWarning(ex,"AI chat planner is unavailable.");
            return Unavailable();
        }
    }
    private static ChatPlan Unavailable()=>new(ChatIntent.Clarification,null,null,0,"سرویس هوش مصنوعی موقتاً در دسترس نیست؛ چند لحظه دیگر دوباره تلاش کنید.",["ai-planner-unavailable"]);
    private sealed record PlanDto(string Intent,string? Symbol,string? KnowledgeQuery,double Confidence,string? Clarification,string[]? Reasons);
}
