using TSEAI.Application.Filters.Compatibility;
using TSEAI.Application.Filters.Execution;
namespace TSEAI.Application.Filters.NaturalLanguage;
public sealed class NaturalLanguageFilterService(IAiFilterPlanner ai,TsetmcCompatibilityService compatibility,FilterExecutionService execution)
{
    public async Task<NaturalLanguageFilterResult> BuildAndExecuteAsync(string question,int maxResults,CancellationToken ct)
    {
        var plan=await ai.InterpretAsync(question,ct); if(!string.Equals(plan.Status,"ok",StringComparison.OrdinalIgnoreCase)||string.IsNullOrWhiteSpace(plan.TsetmcCode))return new(false,null,null,plan.Confidence,null,null,null,plan.Explanation);
        var imported=compatibility.Import(plan.TsetmcCode); if(!imported.Valid)return new(false,null,null,plan.Confidence,null,null,null,"AI filter was rejected by deterministic validator: "+string.Join("; ",imported.Errors));
        var result=await execution.ExecuteAsync(imported.CanonicalTsetmcCode,maxResults,ct); return new(true,imported.CanonicalTsetmcCode,imported.PersianExplanation,plan.Confidence,result.Scanned,result.Matched,result.Results,null);
    }
}
