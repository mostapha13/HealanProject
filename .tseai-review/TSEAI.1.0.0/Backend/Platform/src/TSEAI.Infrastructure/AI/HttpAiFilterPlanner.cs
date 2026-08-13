using System.Net.Http.Json;
using System.Text.Json.Serialization;
using TSEAI.Application.Filters.NaturalLanguage;
namespace TSEAI.Infrastructure.AI;
public sealed class HttpAiFilterPlanner(HttpClient http):IAiFilterPlanner
{
    public async Task<AiFilterPlan> InterpretAsync(string question,CancellationToken ct)
    {
        using var response=await http.PostAsJsonAsync("filter/interpret",new{question},ct); response.EnsureSuccessStatusCode(); var dto=await response.Content.ReadFromJsonAsync<Response>(cancellationToken:ct)??throw new InvalidOperationException("Empty AI response"); return new(dto.Status,dto.TsetmcCode,dto.Explanation,dto.Confidence,dto.MatchedRules??[]);
    }
    private sealed class Response
    {
        public string Status{get;set;}=""; [JsonPropertyName("tsetmc_code")] public string? TsetmcCode{get;set;} public string Explanation{get;set;}=""; public double Confidence{get;set;} [JsonPropertyName("matched_rules")] public List<string>? MatchedRules{get;set;}
    }
}
