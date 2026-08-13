using TSEAI.Application.Filters.Ast;
using TSEAI.Application.Filters.Execution;
namespace TSEAI.Application.Filters.Compatibility;
public sealed record FilterImportResult(bool Valid,string Original,string CanonicalTsetmcCode,string PersianExplanation,FilterDependencies Dependencies,FilterExpression Ast,IReadOnlyList<string> Errors);
public sealed class TsetmcCompatibilityService(FilterExecutionService filters)
{
    private readonly TsetmcFilterExporter _exporter=new();private readonly FilterExplainer _explainer=new();private readonly FilterDependencyAnalyzer _deps=new();
    public FilterImportResult Import(string source)
    {
        try{var p=filters.Parse(source);if(!p.Validation.IsValid)return new(false,source,"","",new(true,false,false,false,false,[]),p.Ast,p.Validation.Errors);return new(true,source,_exporter.Export(p.Ast),_explainer.Explain(p.Ast),_deps.Analyze(p.Ast),p.Ast,[]);}catch(Exception ex){return new(false,source,"","",new(true,false,false,false,false,[]),new LiteralExpression(false),[ex.Message]);}
    }
}
