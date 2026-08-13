using TSEAI.Application.StructuredQuery;
using TSEAI.Application.Chat.Context;

namespace TSEAI.Application.Chat.Routing;

public enum ChatCapabilityRoute
{
    FilterAssets,
    FilterConversation,
    StructuredQuery,
    MarketSymbol,
    MarketComparison,
    Knowledge,
    Hybrid,
    Clarification
}

public sealed record CapabilityRequirement(string Name,string Authority,bool Required=true);

public sealed record CapabilityRouteDecision(
    ChatCapabilityRoute Route,
    ChatIntent Intent,
    double Confidence,
    IReadOnlyList<string> ReasonCodes,
    IReadOnlyList<CapabilityRequirement> Capabilities,
    ChatPlan? Plan=null,
    StructuredQueryInterpretation? StructuredQuery=null,
    bool PlannerUsed=false)
{
    public string AuditSummary => $"route={Route};intent={Intent};confidence={Confidence:0.###};planner={PlannerUsed};reasons={string.Join(',',ReasonCodes)}";
}

public interface IChatCapabilityRouter
{
    Task<CapabilityRouteDecision> RouteAsync(string question,int requestedPageSize,CancellationToken ct);
    Task<CapabilityRouteDecision> RouteWithContextAsync(string question,int requestedPageSize,ConversationRouteHint? hint,CancellationToken ct);
}
