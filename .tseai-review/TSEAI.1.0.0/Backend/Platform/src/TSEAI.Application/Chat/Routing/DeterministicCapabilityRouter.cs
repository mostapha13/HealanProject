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

        var ownership=CanonicalQuestionOwnership.Detect(question);
        var requestedFields=PersianMarketQuestionSemantics.DetectRequestedFields(question);
        var descriptiveEntity=PersianQuestionFacetAnalysis.TryExtractDescriptiveEntity(question);
        if(!string.IsNullOrWhiteSpace(descriptiveEntity))
        {
            var route=requestedFields.Count>0?ChatCapabilityRoute.Hybrid:ChatCapabilityRoute.Knowledge;
            var intent=requestedFields.Count>0?ChatIntent.Hybrid:ChatIntent.Knowledge;
            var reasons=new[] { "descriptive-entity",requestedFields.Count>0?"deterministic-composite-route":"deterministic-knowledge-route" };
            var descriptivePlan=new ChatPlan(intent,descriptiveEntity,question,0.99,null,reasons,requestedFields);
            var capabilities=requestedFields.Count>0
                ? new CapabilityRequirement[] { new("entity.resolve","sql-ai-reference"),new("structured.market.symbol","canonical-market-snapshot"),
                    new("knowledge.retrieve","qdrant-symbol-grounded-evidence"),new("analytics.symbol","deterministic-calculation",false) }
                : [new("entity.resolve","sql-ai-reference",false),new("knowledge.retrieve","qdrant-symbol-grounded-evidence")];
            return FromPlan(route,descriptivePlan,capabilities,reasons);
        }
        var targetedNewsEntity=PersianQuestionFacetAnalysis.TryExtractTargetedNewsEntity(question);
        if(!string.IsNullOrWhiteSpace(targetedNewsEntity))
        {
            var targetedMarketFields=requestedFields.ToList();
            if(targetedMarketFields.Count==0
               &&question.Contains("قیمت",StringComparison.Ordinal)
               &&question.Contains(" و ",StringComparison.Ordinal))
                targetedMarketFields.Add("last_price");
            if(targetedMarketFields.Count>0)
                return FromPlan(ChatCapabilityRoute.Hybrid,
                    new ChatPlan(ChatIntent.Hybrid,targetedNewsEntity,question,0.99,null,
                        ["targeted-news","deterministic-composite-route"],targetedMarketFields),
                    [new("entity.resolve","sql-ai-reference"),new("structured.market.symbol","canonical-market-snapshot"),
                     new("knowledge.retrieve","qdrant-symbol-grounded-evidence"),new("analytics.symbol","deterministic-calculation",false)],
                    ["targeted-news","deterministic-composite-route"]);

            return FromPlan(ChatCapabilityRoute.Knowledge,
                new ChatPlan(ChatIntent.Knowledge,targetedNewsEntity,question,0.99,null,
                    ["targeted-news","deterministic-knowledge-route"]),
                [new("entity.resolve","sql-ai-reference",false),new("knowledge.retrieve","qdrant-symbol-grounded-evidence")],
                ["targeted-news","deterministic-knowledge-route"]);
        }
        if(ownership!=CanonicalQuestionDomain.Knowledge && requestedFields.Count>0&&!PersianMarketQuestionSemantics.IsScreeningQuestion(question)&&!PersianMarketQuestionSemantics.HasKnowledgeFacet(question))
            return FromPlan(ChatCapabilityRoute.MarketSymbol,
                new ChatPlan(ChatIntent.MarketSymbol,question,null,0.99,null,["deterministic-market-ontology"],requestedFields),
                [new("entity.resolve","sql-ai-reference"),new("structured.market.symbol","canonical-market-snapshot"),new("analytics.symbol","deterministic-calculation")],
                ["deterministic-market-ontology"]);

        var sq=structured.Interpret(question,requestedPageSize);
        if(sq.Success && sq.Plan is not null)
            return new(ChatCapabilityRoute.StructuredQuery,ChatIntent.StructuredQuery,sq.Plan.Confidence,
                ["deterministic-structured-query",..sq.Plan.MatchedRules],
                [new("structured.query","canonical-market-snapshot"),new("data-quality","quality-gate")],
                StructuredQuery:sq);

        var filter=filters.Detect(question);
        if(filter.IsFilter)
            return Decision(ChatCapabilityRoute.FilterConversation,ChatIntent.MarketFilter,1,[filter.Reason],
                [new("filter.chat","canonical-market-snapshot"),new("temporal.resolve","calendar-authority")]);

        if(ownership==CanonicalQuestionDomain.Knowledge ||
           (requestedFields.Count==0 && PersianMarketQuestionSemantics.HasKnowledgeFacet(question) && !HasMixedMarketKnowledgeCue(question)))
        {
            var knowledgePlan=new ChatPlan(ChatIntent.Knowledge,null,question,0.99,null,["deterministic-knowledge-evidence-route"]);
            return FromPlan(ChatCapabilityRoute.Knowledge,knowledgePlan,
                [new("knowledge.retrieve","qdrant-grounded-evidence")],
                ["deterministic-knowledge-evidence-route"]);
        }

        // The AI planner is a bounded fallback for semantic intent/entity hints only.
        // It never chooses arbitrary tools: the returned intent is projected onto this fixed capability registry.
        var plan=await planner.PlanAsync(question,ct);
        if(PlannerEntityHintGuard.IsUnsafe(question,plan))
        {
            var safePlan=new ChatPlan(ChatIntent.Knowledge,null,question,
                Math.Min(plan.Confidence,0.85),null,[..plan.Reasons,"unsafe-generic-entity-hint-rejected"]);
            return FromPlan(ChatCapabilityRoute.Knowledge,safePlan,
                [new("knowledge.retrieve","qdrant-grounded-evidence")],
                ["unsafe-generic-entity-hint-rejected","bounded-ai-planner"]);
        }
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

    private static bool HasMixedMarketKnowledgeCue(string question)
    {
        var q=PersianDisplayText.Normalize(question).Replace('‌',' ').ToLowerInvariant();
        var hasMarketFact=new[]{"قیمت","حجم معاملات","ارزش معاملات","ارزش بازار","p/e","پی بر ای","eps","سود هر سهم"}
            .Any(x=>q.Contains(x,StringComparison.Ordinal));
        return hasMarketFact&&PersianMarketQuestionSemantics.HasKnowledgeFacet(question);
    }
}
