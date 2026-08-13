namespace TSEAI.Application.Filters.NaturalLanguage;
public sealed record AiFilterPlan(string Status,string? TsetmcCode,string Explanation,double Confidence,IReadOnlyList<string> MatchedRules);
public interface IAiFilterPlanner { Task<AiFilterPlan> InterpretAsync(string question,CancellationToken ct); }
public sealed record NaturalLanguageFilterResult(bool Success,string? Code,string? Explanation,double Confidence,int? Scanned,int? Matched,object? Results,string? Error);
