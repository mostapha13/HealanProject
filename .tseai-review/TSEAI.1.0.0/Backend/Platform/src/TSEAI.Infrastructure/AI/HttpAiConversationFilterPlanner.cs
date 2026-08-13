using System.Net.Http.Json;
using System.Text.Json.Serialization;
using TSEAI.Application.Filters.Conversation;

namespace TSEAI.Infrastructure.AI;

public sealed class HttpAiConversationFilterPlanner(HttpClient http) : IAiConversationFilterPlanner
{
    public async Task<AiConversationFilterPlan> InterpretAsync(
        string question,
        string? currentCode,
        IReadOnlyList<string> currentConditions,
        CancellationToken ct)
    {
        using var response = await http.PostAsJsonAsync("filter/conversation/interpret", new
        {
            question,
            current_code = currentCode,
            current_conditions = currentConditions
        }, ct);
        response.EnsureSuccessStatusCode();
        var dto = await response.Content.ReadFromJsonAsync<Response>(cancellationToken: ct)
                  ?? throw new InvalidOperationException("Empty AI conversation planner response.");
        return new(dto.Status, dto.Operation, dto.TsetmcCode, dto.ConditionIndex, dto.FieldCode,
            dto.Explanation, dto.Confidence, dto.MatchedRules ?? []);
    }

    private sealed class Response
    {
        public string Status { get; set; } = "";
        public string Operation { get; set; } = "";
        [JsonPropertyName("tsetmc_code")] public string? TsetmcCode { get; set; }
        [JsonPropertyName("condition_index")] public int? ConditionIndex { get; set; }
        [JsonPropertyName("field_code")] public string? FieldCode { get; set; }
        public string Explanation { get; set; } = "";
        public double Confidence { get; set; }
        [JsonPropertyName("matched_rules")] public List<string>? MatchedRules { get; set; }
    }
}
