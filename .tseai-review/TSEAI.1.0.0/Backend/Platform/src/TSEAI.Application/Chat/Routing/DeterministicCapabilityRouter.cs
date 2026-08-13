using TSEAI.Application.Filters.Chat;
using TSEAI.Application.Filters.ChatAssets;
using TSEAI.Application.StructuredQuery;
using TSEAI.Application.Chat.Context;

namespace TSEAI.Application.Chat.Routing;

public sealed class DeterministicCapabilityRouter(
    IChatFilterAssetCommandDetector assets,
    IChatFilterIntentDetector filters,
    INaturalLanguageStructuredQueryInterpreter structured,
    IAiChatPlanner planner) : IChatCapabilityRouter
{
    public Task<CapabilityRouteDecision> RouteAsync(string question,int requestedPageSize,CancellationToken ct)
        => RouteWithContextAsync(question,requestedPageSize,null,ct);

    public async Task<CapabilityRouteDecision> RouteWithContextAsync(string question,int requestedPageSize,ConversationRouteHint? hint,CancellationToken ct)
    {
        if(hint is { ContextApplied:true })
        {
            if(hint.Kind==ConversationFollowUpKind.Comparison && !string.IsNullOrWhiteSpace(hint.PrimaryEntity) && !string.IsNullOrWhiteSpace(hint.SecondaryEntity))
                return new(ChatCapabilityRoute.MarketComparison,ChatIntent.MarketComparison,0.99,
                    ["conversation-comparison","deterministic-context-route"],
                    [new("structured.market.symbol","canonical-market-snapshot"),new("analytics.symbol","deterministic-calculation")],
                    new ChatPlan(ChatIntent.MarketComparison,hint.PrimaryEntity,null,0.99,null,["conversation-comparison"]));

            if(hint.PreferredIntent==ChatIntent.MarketSymbol && !string.IsNullOrWhiteSpace(hint.PrimaryEntity))
                return FromPlan(ChatCapabilityRoute.MarketSymbol,
                    new ChatPlan(ChatIntent.MarketSymbol,hint.PrimaryEntity,null,0.99,null,["conversation-market-followup"]),
                    [new("entity.resolve","sql-ai-reference"),new("structured.market.symbol","canonical-market-snapshot"),new("analytics.symbol","deterministic-calculation")],
                    ["conversation-market-followup","deterministic-context-route"]);

            if(hint.PreferredIntent==ChatIntent.Knowledge && !string.IsNullOrWhiteSpace(hint.PrimaryEntity))
                return FromPlan(ChatCapabilityRoute.Knowledge,
                    new ChatPlan(ChatIntent.Knowledge,hint.PrimaryEntity,question,0.99,null,["conversation-knowledge-followup"]),
                    [new("entity.resolve","sql-ai-reference",false),new("knowledge.retrieve","qdrant-grounded-evidence")],
                    ["conversation-knowledge-followup","deterministic-context-route"]);

            if(hint.PreferredIntent==ChatIntent.Hybrid && !string.IsNullOrWhiteSpace(hint.PrimaryEntity))
                return FromPlan(ChatCapabilityRoute.Hybrid,
                    new ChatPlan(ChatIntent.Hybrid,hint.PrimaryEntity,question,0.99,null,["conversation-hybrid-followup"]),
                    [new("entity.resolve","sql-ai-reference"),new("structured.market.symbol","canonical-market-snapshot"),new("knowledge.retrieve","qdrant-grounded-evidence"),new("analytics.symbol","deterministic-calculation",false)],
                    ["conversation-hybrid-followup","deterministic-context-route"]);
        }

        var asset=assets.Detect(question);
        if(asset.Operation!=ChatFilterAssetOperation.None)
            return Decision(ChatCapabilityRoute.FilterAssets,ChatIntent.MarketFilter,1,["deterministic-filter-asset-command"],
                [new("filter.assets","persistent-user-assets")]);

        var filter=filters.Detect(question);
        if(filter.IsFilter)
            return Decision(ChatCapabilityRoute.FilterConversation,ChatIntent.MarketFilter,1,[filter.Reason],
                [new("filter.chat","canonical-market-snapshot"),new("temporal.resolve","calendar-authority")]);

        var sq=structured.Interpret(question,requestedPageSize);
        if(sq.Success && sq.Plan is not null)
            return new(ChatCapabilityRoute.StructuredQuery,ChatIntent.StructuredQuery,sq.Plan.Confidence,
                ["deterministic-structured-query",..sq.Plan.MatchedRules],
                [new("structured.query","canonical-market-snapshot"),new("data-quality","quality-gate")],
                StructuredQuery:sq);

        // The AI planner is a bounded fallback for semantic intent/entity hints only.
        // It never chooses arbitrary tools: the returned intent is projected onto this fixed capability registry.
        var plan=await planner.PlanAsync(question,ct);
        return plan.Intent switch
        {
            ChatIntent.MarketSymbol => FromPlan(ChatCapabilityRoute.MarketSymbol,plan,
                [new("entity.resolve","sql-ai-reference"),new("structured.market.symbol","canonical-market-snapshot"),new("analytics.symbol","deterministic-calculation")]),
            ChatIntent.Knowledge => FromPlan(ChatCapabilityRoute.Knowledge,plan,
                [new("knowledge.retrieve","qdrant-grounded-evidence")]),
            ChatIntent.Hybrid => FromPlan(ChatCapabilityRoute.Hybrid,plan,
                [new("entity.resolve","sql-ai-reference"),new("structured.market.symbol","canonical-market-snapshot"),new("knowledge.retrieve","qdrant-grounded-evidence"),new("analytics.symbol","deterministic-calculation",false)]),
            ChatIntent.MarketFilter => FromPlan(ChatCapabilityRoute.FilterConversation,plan,
                [new("filter.conversation","canonical-market-snapshot")]),
            _ => FromPlan(ChatCapabilityRoute.Clarification,plan,[])
        };
    }

    private static CapabilityRouteDecision FromPlan(ChatCapabilityRoute route,ChatPlan plan,IReadOnlyList<CapabilityRequirement> capabilities)
        => new(route,plan.Intent,plan.Confidence,["bounded-ai-planner",..plan.Reasons],capabilities,plan,PlannerUsed:true);

    private static CapabilityRouteDecision FromPlan(ChatCapabilityRoute route,ChatPlan plan,IReadOnlyList<CapabilityRequirement> capabilities,IReadOnlyList<string> reasons)
        => new(route,plan.Intent,plan.Confidence,reasons,capabilities,plan,PlannerUsed:false);

    private static CapabilityRouteDecision Decision(ChatCapabilityRoute route,ChatIntent intent,double confidence,IReadOnlyList<string> reasons,IReadOnlyList<CapabilityRequirement> capabilities)
        => new(route,intent,confidence,reasons,capabilities);
}
