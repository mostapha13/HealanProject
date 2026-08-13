namespace TSEAI.Application.Chat.Routing;

public enum HybridStepKind { EntityResolve, StructuredMarket, KnowledgeRetrieve, Analytics }
public sealed record HybridPlanStep(string Id, HybridStepKind Kind, string Capability, IReadOnlyList<string> DependsOn, bool Required=true);
public sealed record HybridExecutionPlan(IReadOnlyList<HybridPlanStep> Steps, int MaxParallelism, int MaxDepth)
{
    public string AuditSummary => string.Join(";", Steps.Select(s=>$"{s.Id}:{s.Capability}[{string.Join(',',s.DependsOn)}]"));
}
public interface IMultiToolHybridPlanner
{
    HybridExecutionPlan Build(CapabilityRouteDecision route);
}

public sealed class DeterministicMultiToolHybridPlanner : IMultiToolHybridPlanner
{
    private const int MaxSteps=6;
    private const int MaxDepth=3;
    public HybridExecutionPlan Build(CapabilityRouteDecision route)
    {
        if(route.Route!=ChatCapabilityRoute.Hybrid) throw new InvalidOperationException("hybrid_route_required");
        var allowed=route.Capabilities.Select(x=>x.Name).ToHashSet(StringComparer.OrdinalIgnoreCase);
        var steps=new List<HybridPlanStep>();
        void Add(HybridPlanStep s){ if(!allowed.Contains(s.Capability)) throw new InvalidOperationException("capability_not_allowed:"+s.Capability); steps.Add(s); }
        Add(new("entity",HybridStepKind.EntityResolve,"entity.resolve",[]));
        Add(new("market",HybridStepKind.StructuredMarket,"structured.market.symbol",["entity"]));
        Add(new("knowledge",HybridStepKind.KnowledgeRetrieve,"knowledge.retrieve",["entity"]));
        Add(new("analytics",HybridStepKind.Analytics,"analytics.symbol",["market"],false));
        if(steps.Count>MaxSteps) throw new InvalidOperationException("hybrid_step_limit_exceeded");
        return new(steps,2,MaxDepth);
    }
}
