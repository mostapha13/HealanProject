using System.Diagnostics;
using System.Globalization;
using System.Text.RegularExpressions;
using TSEAI.Application.Entities;
using TSEAI.Application.Analytics;
using TSEAI.Application.DataQuality;
using TSEAI.Application.Filters.Conversation;
using TSEAI.Application.Filters.Chat;
using TSEAI.Application.Filters.ChatAssets;
using TSEAI.Application.Chat.Agentic;
using TSEAI.Application.Filters.Execution;
using TSEAI.Application.Filters.Temporal;
using TSEAI.Application.Market;
using TSEAI.Application.Temporal;
using TSEAI.Shared.Application.Market;
using TSEAI.Application.Tools;
using TSEAI.Application.StructuredQuery;
using TSEAI.Application.Chat.Routing;
using TSEAI.Application.Chat.Context;

namespace TSEAI.Application.Chat;

public sealed class ChatOrchestrator(
    IChatCapabilityRouter capabilityRouter,
    IConversationContextService conversationContext,
    IConversationTemporalContextResolver conversationTemporal,
    IMultiToolHybridPlanner hybridPlanner,
    IKnowledgeRetriever knowledge,
    ICanonicalReferenceAnswerService canonicalReferenceAnswers,
    IPersianEntityResolver entities,
    IStructuredToolGateway structuredTools,
    IMarketAnalyticsEngine analyticsEngine,
    IStructuredQueryService structuredQueryService,
    ConversationFilterService filters,
    ChatIntegratedFilterService chatFilters,
    IFilterTemporalPolicy filterTemporalPolicy,
    ChatFilterAssetService filterAssets,
    IChatReflector reflector,
    IChatAnswerSynthesizer answerSynthesizer,
    IChatToolPolicy toolPolicy,
    IChatEvidenceEngine evidenceEngine,
    IAnswerValidationGuard answerValidationGuard,
    IPersianFinancialAnswerComposer answerComposer)
{
    public async Task<ChatOrchestrationResult> AskAsync(
        string subject,
        bool authenticated,
        string? anonymousSubject,
        ChatFilterAssetAuthorization assetAuthorization,
        ChatOrchestrationRequest request,
        CancellationToken ct)
    {
        var trace=new List<ChatToolTrace>();
        toolPolicy.Demand("temporal.resolve");
        var temporalTurn=await Timed("temporal.resolve",()=>conversationTemporal.ResolveAsync(subject,request.ConversationId,request.Question,ct),trace,t=>t.AuditSummary);
        var temporalContext=temporalTurn.Primary;

        toolPolicy.Demand("conversation.context");
        var turnContext=await Timed("conversation.context",()=>conversationContext.PrepareAsync(subject,request.ConversationId,request.Question,temporalContext,ct),trace,c=>c.AuditSummary);
        var effectiveQuestion=turnContext.EffectiveQuestion;

        toolPolicy.Demand("structured.reference");
        var canonicalAnswer=await Timed("structured.reference",()=>canonicalReferenceAnswers.TryAnswerAsync(effectiveQuestion,temporalContext,ct),trace,
            x=>x is null?"no-match":$"kind={x.Reference.Kind};complete={x.IsComplete};facts={x.Facts.Count};missing={string.Join('|',x.MissingFacets)}");
        if(canonicalAnswer is not null)
        {
            toolPolicy.Demand(canonicalAnswer.ToolName);
            trace.Add(new ChatToolTrace(canonicalAnswer.ToolName,"ok",0,
                $"kind={canonicalAnswer.Reference.Kind};topic={canonicalAnswer.Reference.Topic};facts={canonicalAnswer.Facts.Count}"));
        }
        var compositeAnalysis=PersianQuestionFacetAnalysis.AnalyzeCanonicalMarket(effectiveQuestion,canonicalAnswer);
        if(canonicalAnswer is not null && canonicalAnswer.IsComplete && !compositeAnalysis.IsComposite)
        {
            toolPolicy.Demand("reflection.review");
            var review=await Timed("reflection.review",()=>reflector.ReviewAsync(
                new ChatReflectionRequest(effectiveQuestion,canonicalAnswer.Answer,ChatIntent.Knowledge,canonicalAnswer.Confidence,
                    canonicalAnswer.Facts.Count,[],CanonicalEvidenceText(canonicalAnswer),ExactCanonical:true),ct),trace);
            if(review.Action=="clarify")
                return new("clarification",review.Clarification??"برای پاسخ دقیق‌تر، سؤال را کمی مشخص‌تر بیان کنید.",request.ConversationId,
                    ChatIntent.Clarification,canonicalAnswer.Confidence,null,null,[],[],trace,review.Clarification,temporalContext);
            if(review.Action=="retrieve_more" && !string.IsNullOrWhiteSpace(review.ImprovedQuery))
                canonicalAnswer=canonicalAnswer with
                {
                    IsComplete=false,
                    MissingFacets=[..canonicalAnswer.MissingFacets,"reflection_requested_evidence"],
                    KnowledgeQueries=[..canonicalAnswer.KnowledgeQueries,review.ImprovedQuery!]
                };
            else
            {
                var savedReference=await conversationContext.RecordReferenceAsync(subject,request.ConversationId,request.Question,effectiveQuestion,
                    canonicalAnswer.Answer,canonicalAnswer,temporalContext,ct);
                var canonicalEvidence=BuildCanonicalEvidence(canonicalAnswer);
                var canonicalEvidenceValidation=evidenceEngine.Validate(ChatIntent.Knowledge,canonicalEvidence,false,false,false,false,canonicalAnswer.Answer);
                var canonicalValidation=answerValidationGuard.Validate(canonicalAnswer.Answer,ChatIntent.Knowledge,canonicalEvidence,canonicalEvidenceValidation);
                trace.Add(new ChatToolTrace("answer.validate",canonicalValidation.IsValid?"ok":"failed",0,$"status={canonicalValidation.Status};issues={string.Join('|',canonicalValidation.Issues)}"));
                if(!canonicalValidation.IsValid)
                    return new("answer_validation_blocked","پاسخ ساختاریافته در بازبینی نهایی تأیید نشد.",request.ConversationId,ChatIntent.Knowledge,0,null,null,[],[],trace,
                        string.Join(",",canonicalValidation.Issues),temporalContext,ConversationContext:savedReference,Evidence:canonicalEvidence,EvidenceValidation:canonicalEvidenceValidation,AnswerValidation:canonicalValidation);
                return new("structured_reference",canonicalAnswer.Answer,request.ConversationId,ChatIntent.Knowledge,canonicalAnswer.Confidence,null,null,[],[],trace,null,
                    temporalContext,ConversationContext:savedReference,Evidence:canonicalEvidence,EvidenceValidation:canonicalEvidenceValidation,AnswerValidation:canonicalValidation);
            }
        }

        toolPolicy.Demand("capability.route");
        CapabilityRouteDecision routeDecision;
        if(compositeAnalysis.IsComposite)
        {
            var compositePlan=new ChatPlan(ChatIntent.MarketSymbol,compositeAnalysis.Symbol,null,0.99,null,
                ["canonical-market-composite","deterministic-composite-route"],compositeAnalysis.MarketFields);
            routeDecision=new(ChatCapabilityRoute.MarketSymbol,ChatIntent.MarketSymbol,0.99,
                ["canonical-market-composite","deterministic-composite-route"],
                [new("entity.resolve","sql-ai-reference"),new("structured.market.symbol","canonical-market-snapshot")],
                compositePlan,PlannerUsed:false);
            trace.Add(new ChatToolTrace("capability.route","ok",0,routeDecision.AuditSummary));
        }
        else if(CanonicalOrganizationEvidencePolicy.ShouldUseDeterministicKnowledgeRoute(canonicalAnswer))
        {
            var canonicalPlan=new ChatPlan(ChatIntent.Knowledge,null,effectiveQuestion,canonicalAnswer!.Confidence,null,
                ["canonical-organization-evidence"]);
            routeDecision=new(ChatCapabilityRoute.Knowledge,ChatIntent.Knowledge,canonicalAnswer.Confidence,
                ["canonical-organization-evidence","deterministic-canonical-route"],
                [new("knowledge.retrieve","qdrant-grounded-evidence")],canonicalPlan,PlannerUsed:false);
            trace.Add(new ChatToolTrace("capability.route","ok",0,routeDecision.AuditSummary));
        }
        else
            routeDecision=await Timed("capability.route",()=>capabilityRouter.RouteWithContextAsync(effectiveQuestion,request.PageSize,turnContext.RouteHint,ct),trace, d=>d.AuditSummary);

        if(routeDecision.Route==ChatCapabilityRoute.FilterAssets)
        {
            var assetCommand=filterAssets.Detect(request.Question);
            if(!authenticated)
                return new("authentication_required","ذخیره فیلتر و هشدار فقط برای کاربران واردشده در دسترس است.",request.ConversationId,ChatIntent.MarketFilter,1,null,null,[],[],trace,"برای استفاده از این قابلیت وارد حساب شوید.",temporalContext);
            toolPolicy.Demand("filter.assets");
            var assetResult=await Timed("filter.assets",()=>filterAssets.ExecuteAsync(subject,request.ConversationId,assetCommand,assetAuthorization,ct),trace);
            ConversationContextState? savedAssetContext=null;
            if(assetResult.Success) savedAssetContext=await conversationContext.RecordAsync(subject,request.ConversationId,request.Question,ChatIntent.MarketFilter,ChatCapabilityRoute.FilterAssets,temporalContext,null,null,ct);
            return new(assetResult.Type,assetResult.Message,request.ConversationId,ChatIntent.MarketFilter,assetResult.Success?1:0,null,assetResult.Data,[],[],trace,assetResult.Success?null:assetResult.Message,temporalContext,ConversationContext:savedAssetContext);
        }

        if(routeDecision.Route==ChatCapabilityRoute.FilterConversation && !routeDecision.PlannerUsed)
        {
            toolPolicy.Demand("filter.chat");
            var temporalDecision=filterTemporalPolicy.Evaluate(temporalContext);
            var r=await Timed("filter.chat",()=>chatFilters.ExecuteAsync(subject,request.ConversationId,request.Question,temporalContext,
                new FilterExecutionOptions(request.Page,request.PageSize,request.SortBy,request.SortDescending),ct,
                authenticated?anonymousSubject:null),trace);
            if(!r.Success)
            {
                var type=r.Operation=="temporal_guard"?"temporal_unavailable":"clarification";
                return new(type,r.Error??"فیلتر قابل اجرا نبود.",request.ConversationId,ChatIntent.MarketFilter,r.Confidence,null,r,[],[],trace,r.Error,temporalContext);
            }
            var savedFilterContext=await conversationContext.RecordAsync(subject,request.ConversationId,request.Question,ChatIntent.MarketFilter,ChatCapabilityRoute.FilterConversation,temporalContext,null,null,ct);
            var filterAnswer=ComposeChatFilter(r,temporalDecision);
            var filterEvidence=evidenceEngine.Build(ChatIntent.MarketFilter,null,null,null,[],null,null,r,null);
            var filterValidation=evidenceEngine.Validate(ChatIntent.MarketFilter,filterEvidence,false,false,false,false,filterAnswer);
            var filterAnswerValidation=answerValidationGuard.Validate(filterAnswer,ChatIntent.MarketFilter,filterEvidence,filterValidation);
            if(!filterAnswerValidation.IsValid) return new("answer_validation_blocked","پاسخ فیلتر توسط Hallucination Guard متوقف شد.",request.ConversationId,ChatIntent.MarketFilter,0,null,r,[],[],trace,string.Join(",",filterAnswerValidation.Issues),temporalContext,Evidence:filterEvidence,EvidenceValidation:filterValidation,AnswerValidation:filterAnswerValidation);
            return new("market_filter",filterAnswer,request.ConversationId,ChatIntent.MarketFilter,r.Confidence,null,r,[],[],trace,null,temporalContext,ConversationContext:savedFilterContext,Evidence:filterEvidence,EvidenceValidation:filterValidation,AnswerValidation:filterAnswerValidation);
        }

        var structuredInterpretation = routeDecision.StructuredQuery;
        if (routeDecision.Route==ChatCapabilityRoute.StructuredQuery && structuredInterpretation?.Success==true && structuredInterpretation.Plan is not null)
        {
            if (RequiresHistoricalOrFutureMarketData(temporalContext,temporalTurn.Comparison)
                && !UsesCurrentSnapshotPreviousPrice(structuredInterpretation.Plan))
            {
                var temporalMessage = BuildTemporalMarketGuard(temporalContext);
                return new("temporal_unavailable", temporalMessage, request.ConversationId, ChatIntent.StructuredQuery, structuredInterpretation.Plan.Confidence, null, null, [], [], trace, null, temporalContext);
            }

            toolPolicy.Demand("structured.query");
            var structuredResult = await Timed("structured.query", () => structuredQueryService.ExecuteAsync(structuredInterpretation.Plan, ct), trace);
            if (structuredResult.Success)
            {
                var structuredAnswer = answerComposer.ComposeStructured(request.Question,structuredResult);
                var savedStructuredContext=await conversationContext.RecordAsync(subject,request.ConversationId,request.Question,ChatIntent.StructuredQuery,ChatCapabilityRoute.StructuredQuery,temporalContext,null,null,ct);
                var structuredEvidence=evidenceEngine.Build(ChatIntent.StructuredQuery,null,null,null,[],structuredResult,null,null,null);
                var structuredValidation=evidenceEngine.Validate(ChatIntent.StructuredQuery,structuredEvidence,false,false,true,false,structuredAnswer);
                var structuredAnswerValidation=answerValidationGuard.Validate(structuredAnswer,ChatIntent.StructuredQuery,structuredEvidence,structuredValidation);
                if(!structuredAnswerValidation.IsValid) return new("answer_validation_blocked","نتیجه Query توسط Hallucination Guard متوقف شد.",request.ConversationId,ChatIntent.StructuredQuery,0,null,null,[],[],trace,string.Join(",",structuredAnswerValidation.Issues),temporalContext,Evidence:structuredEvidence,EvidenceValidation:structuredValidation,AnswerValidation:structuredAnswerValidation);
                return new("structured_query", structuredAnswer, request.ConversationId, ChatIntent.StructuredQuery, structuredInterpretation.Plan.Confidence, null, null, [], [], trace, null, temporalContext, null, null, null, structuredResult,ConversationContext:savedStructuredContext,Evidence:structuredEvidence,EvidenceValidation:structuredValidation,AnswerValidation:structuredAnswerValidation);
            }
        }

        var plan=routeDecision.Plan ?? new ChatPlan(routeDecision.Intent,null,null,routeDecision.Confidence,"لطفاً سؤال را دقیق‌تر بیان کنید.",routeDecision.ReasonCodes);
        HybridExecutionPlan? hybridPlan=null;
        if(routeDecision.Route==ChatCapabilityRoute.Hybrid)
        {
            hybridPlan=hybridPlanner.Build(routeDecision);
            trace.Add(new ChatToolTrace("hybrid.plan","ok",0,hybridPlan.AuditSummary));
        }
        if(plan.Intent==ChatIntent.Clarification)
            return new("clarification",plan.Clarification??"لطفاً سؤال را دقیق‌تر بیان کنید.",request.ConversationId,plan.Intent,plan.Confidence,null,null,[],[],trace,plan.Clarification,temporalContext);

        if ((plan.Intent is ChatIntent.MarketSymbol or ChatIntent.MarketComparison or ChatIntent.MarketFilter or ChatIntent.Hybrid)
            && RequiresHistoricalOrFutureMarketData(temporalContext,temporalTurn.Comparison)
            && !IsCurrentSnapshotPreviousPrice(plan))
        {
            var message=BuildTemporalMarketGuard(temporalContext);
            return new("temporal_unavailable",message,request.ConversationId,plan.Intent,plan.Confidence,null,null,[],[],trace,null,temporalContext);
        }

        if(plan.Intent==ChatIntent.MarketComparison)
        {
            if(turnContext.PrimaryEntity is null || turnContext.SecondaryEntity is null)
                return new("clarification","برای مقایسه، دو نماد مشخص لازم است.",request.ConversationId,ChatIntent.Clarification,plan.Confidence,null,null,[],[],trace,"دو نماد را مشخص کنید.",temporalContext);

            toolPolicy.Demand("structured.market.symbol");
            var sw1=Stopwatch.StartNew(); var sw2=Stopwatch.StartNew();
            var leftTask=structuredTools.ExecuteAsync(new StructuredToolCall(StructuredToolNames.GetSymbolSnapshot,turnContext.PrimaryEntity.BestLookup),ct);
            var rightTask=structuredTools.ExecuteAsync(new StructuredToolCall(StructuredToolNames.GetSymbolSnapshot,turnContext.SecondaryEntity.BestLookup),ct);
            await Task.WhenAll(leftTask,rightTask); sw1.Stop(); sw2.Stop();
            var left=await leftTask; var right=await rightTask;
            trace.Add(new ChatToolTrace("structured.market.symbol.primary",left.Success?"ok":"failed",(int)sw1.ElapsedMilliseconds,left.Error));
            trace.Add(new ChatToolTrace("structured.market.symbol.secondary",right.Success?"ok":"failed",(int)sw2.ElapsedMilliseconds,right.Error));
            if(!left.Success || !right.Success || left.Data is not MarketSymbolSnapshot ls || right.Data is not MarketSymbolSnapshot rs)
            {
                var error=!left.Success?left.Error:right.Error;
                return new("market_comparison_unavailable",$"مقایسه با داده معتبر هر دو نماد ممکن نشد ({error}).",request.ConversationId,ChatIntent.MarketComparison,plan.Confidence,null,null,[],[],trace,null,temporalContext,left.Entity??right.Entity,left.Quality??right.Quality);
            }

            toolPolicy.Demand("analytics.symbol");
            var la=analyticsEngine.AnalyzeSymbol(ls); var ra=analyticsEngine.AnalyzeSymbol(rs);
            trace.Add(new ChatToolTrace("analytics.symbol.comparison","ok",0,$"{ls.Symbol},{rs.Symbol}"));
            var comparison=new MarketComparisonResult(ls,rs,la,ra);
            var comparisonAnswer=answerComposer.ComposeComparison(request.Question,comparison);
            var saved=await conversationContext.RecordAsync(subject,request.ConversationId,request.Question,ChatIntent.MarketComparison,ChatCapabilityRoute.MarketComparison,temporalContext,left.Entity,right.Entity,ct);
            var comparisonEvidence=evidenceEngine.Build(ChatIntent.MarketComparison,ls,left.Quality,la,[],null,comparison,null,left.Entity);
            var comparisonValidation=evidenceEngine.Validate(ChatIntent.MarketComparison,comparisonEvidence,true,false,false,true,comparisonAnswer);
            var comparisonAnswerValidation=answerValidationGuard.Validate(comparisonAnswer,ChatIntent.MarketComparison,comparisonEvidence,comparisonValidation);
            if(!comparisonAnswerValidation.IsValid) return new("answer_validation_blocked","مقایسه توسط Hallucination Guard متوقف شد.",request.ConversationId,ChatIntent.MarketComparison,0,null,null,[],[],trace,string.Join(",",comparisonAnswerValidation.Issues),temporalContext,Evidence:comparisonEvidence,EvidenceValidation:comparisonValidation,AnswerValidation:comparisonAnswerValidation);
            return new("market_comparison",comparisonAnswer,request.ConversationId,ChatIntent.MarketComparison,plan.Confidence,ls,null,[],[],trace,null,temporalContext,left.Entity,left.Quality,la,null,comparison,saved,Evidence:comparisonEvidence,EvidenceValidation:comparisonValidation,AnswerValidation:comparisonAnswerValidation);
        }

        EntityResolution? entityContext=null;
        string? marketLookup=null;
        string? resolvedSymbol=null;

        if(plan.Intent is ChatIntent.MarketSymbol or ChatIntent.Hybrid || (plan.Intent==ChatIntent.Knowledge && !string.IsNullOrWhiteSpace(plan.Symbol)))
        {
            if(string.IsNullOrWhiteSpace(plan.Symbol))
                return new("clarification","نماد موردنظر را مشخص کنید.",request.ConversationId,ChatIntent.Clarification,plan.Confidence,null,null,[],[],trace,"نماد موردنظر را مشخص کنید.",temporalContext);

            toolPolicy.Demand("entity.resolve");
            entityContext=await Timed("entity.resolve",()=>ResolveMarketEntityAsync(plan.Symbol,ct),trace,
                x=>$"status={x.Status};input={x.OriginalText};match={x.Selected?.DisplayName}");

            if(entityContext.Status==EntityResolutionStatus.Ambiguous)
                return new("clarification",entityContext.Clarification??"نماد موردنظر مبهم است.",request.ConversationId,ChatIntent.Clarification,plan.Confidence,null,null,[],[],trace,entityContext.Clarification,temporalContext,entityContext);

            if(entityContext.Status is EntityResolutionStatus.NoMatch or EntityResolutionStatus.Invalid || entityContext.Selected is null)
            {
                var clarification=$"نماد یا شاخص «{plan.Symbol}» در داده‌های مرجع TSEAI پیدا نشد؛ نام یا نماد دقیق‌تری وارد کنید.";
                return new("clarification",clarification,request.ConversationId,ChatIntent.Clarification,plan.Confidence,null,null,[],[],trace,clarification,temporalContext,entityContext);
            }

            if(entityContext.Selected.Kind==EntityKind.MarketIndex && plan.Intent is ChatIntent.MarketSymbol or ChatIntent.Hybrid)
            {
                var message=$"«{entityContext.Selected.DisplayName}» به‌عنوان شاخص بازار شناسایی شد، اما Tool اختصاصی IndexLastLive هنوز به Chat Structured Tools متصل نشده است؛ برای جلوگیری از پاسخ حدسی داده نماد جایگزین نمی‌کنم.";
                return new("capability_unavailable",message,request.ConversationId,plan.Intent,plan.Confidence,null,null,[],[],trace,null,temporalContext,entityContext);
            }

            marketLookup=entityContext.Selected.InsCode?.ToString()
                ?? entityContext.Selected.InstrumentId
                ?? entityContext.Selected.Symbol
                ?? entityContext.Selected.CanonicalId;
            resolvedSymbol=entityContext.Selected.Symbol ?? plan.Symbol;
        }

        MarketSymbolSnapshot? snapshot=null;
        MarketDataQualityReport? qualityReport=null;
        KnowledgeSearchResult? retrieved=null;
        object? filterResult=null;
        SymbolMarketAnalytics? analytics=null;
        var marketQualityRejected=false;
        string? marketUnavailableMessage=null;

        if(plan.Intent==ChatIntent.Hybrid)
        {
            toolPolicy.Demand("structured.market.symbol");
            toolPolicy.Demand("knowledge.retrieve");
            var q=string.IsNullOrWhiteSpace(plan.KnowledgeQuery)?effectiveQuestion:plan.KnowledgeQuery!;
            var marketSw=Stopwatch.StartNew();
            var knowledgeSw=Stopwatch.StartNew();
            var marketTask=structuredTools.ExecuteAsync(new StructuredToolCall(StructuredToolNames.GetSymbolSnapshot, marketLookup ?? plan.Symbol),ct);
            var knowledgeTask=knowledge.RetrieveAsync(q,8,BuildKnowledgeContext(effectiveQuestion,resolvedSymbol,temporalContext),ct);
            await Task.WhenAll(marketTask,knowledgeTask);
            marketSw.Stop(); knowledgeSw.Stop();
            var sr=await marketTask; retrieved=await knowledgeTask;
            trace.Add(new ChatToolTrace("structured.market.symbol",sr.Success?"ok":"failed",(int)marketSw.ElapsedMilliseconds,sr.Error));
            trace.Add(new ChatToolTrace("knowledge.retrieve","ok",(int)knowledgeSw.ElapsedMilliseconds,$"hits={retrieved.Hits.Count}"));
            if(!sr.Success)
            {
                if(sr.Error=="market_data_quality_rejected")
                {
                    snapshot=sr.Data as MarketSymbolSnapshot;
                    qualityReport=sr.Quality;
                    entityContext=sr.Entity??entityContext;
                    marketQualityRejected=true;
                }
                else
                {
                    entityContext=sr.Entity??entityContext;
                    qualityReport=sr.Quality;
                    marketUnavailableMessage=BuildMarketUnavailableMessage(
                        entityContext?.Selected?.DisplayName??plan.Symbol,sr.Error);
                }
            }
            else
            {
                snapshot=sr.Data as MarketSymbolSnapshot; qualityReport=sr.Quality; entityContext=sr.Entity??entityContext;
            }
            if(snapshot is not null&&!marketQualityRejected)
            {
                toolPolicy.Demand("analytics.symbol");
                analytics=await Timed("analytics.symbol",()=>Task.FromResult(analyticsEngine.AnalyzeSymbol(snapshot)),trace);
            }
        }

        if(plan.Intent==ChatIntent.MarketSymbol)
        {
            toolPolicy.Demand("structured.market.symbol");
            var structuredResult=await Timed("structured.market.symbol",()=>structuredTools.ExecuteAsync(
                new StructuredToolCall(StructuredToolNames.GetSymbolSnapshot, marketLookup ?? plan.Symbol),ct),trace);
            if(!structuredResult.Success)
            {
                if(structuredResult.Error=="market_data_quality_rejected")
                {
                    snapshot=structuredResult.Data as MarketSymbolSnapshot;
                    qualityReport=structuredResult.Quality;
                    entityContext=structuredResult.Entity??entityContext;
                    if(!compositeAnalysis.IsComposite)
                        return new("data_quality_unavailable",BuildRejectedMarketMessage(qualityReport,snapshot),request.ConversationId,plan.Intent,plan.Confidence,null,null,[],[],trace,null,temporalContext,entityContext,qualityReport);
                    marketQualityRejected=true;
                }
                else
                {
                    var unavailable=BuildMarketUnavailableMessage(
                        entityContext?.Selected?.DisplayName??plan.Symbol,structuredResult.Error);
                    if(!compositeAnalysis.IsComposite)
                        return new("market_unavailable",unavailable,request.ConversationId,plan.Intent,plan.Confidence,null,null,[],[],trace,null,temporalContext,structuredResult.Entity??entityContext,structuredResult.Quality);
                    entityContext=structuredResult.Entity??entityContext;
                    qualityReport=structuredResult.Quality;
                    marketUnavailableMessage=unavailable;
                }
            }
            else
            {
                snapshot=structuredResult.Data as MarketSymbolSnapshot;
                qualityReport=structuredResult.Quality;
                entityContext=structuredResult.Entity??entityContext;
            }
            if(snapshot is not null&&!marketQualityRejected)
            {
                toolPolicy.Demand("analytics.symbol");
                analytics=await Timed("analytics.symbol",()=>Task.FromResult(analyticsEngine.AnalyzeSymbol(snapshot)),trace);
            }
        }

        if(plan.Intent==ChatIntent.Knowledge)
        {
            var q=string.IsNullOrWhiteSpace(plan.KnowledgeQuery)?effectiveQuestion:plan.KnowledgeQuery!;
            toolPolicy.Demand("knowledge.retrieve");
            var queries=new[] { q }
                .Concat(canonicalAnswer?.KnowledgeQueries??[])
                .Where(x=>!string.IsNullOrWhiteSpace(x))
                .Distinct(StringComparer.Ordinal)
                .Take(8)
                .ToArray();
            if(queries.Length==1)
                retrieved=await Timed("knowledge.retrieve",()=>knowledge.RetrieveAsync(queries[0],8,BuildKnowledgeContext(effectiveQuestion,resolvedSymbol,temporalContext),ct),trace);
            else
            {
                var sw=Stopwatch.StartNew();
                // Composite/person-facet questions must use the scope of the full
                // effective question for every focused query. A bare person name
                // must not silently fall back to current-only retrieval.
                var results=await knowledge.RetrieveManyAsync(queries,8,
                    BuildKnowledgeContext(effectiveQuestion,resolvedSymbol,temporalContext),ct);
                sw.Stop();
                // Preserve the best few hits from every focused person query before
                // global ranking. Otherwise six high-scoring current profiles can
                // crowd out an exact but older representation article for one member.
                var perQuery=results.SelectMany(x=>x.Hits.Take(4));
                var globallyRanked=results.SelectMany(x=>x.Hits).OrderByDescending(x=>x.Score);
                var merged=perQuery.Concat(globallyRanked)
                    .GroupBy(x=>$"{x.Citation.SourceType}:{x.Citation.SourceId}",StringComparer.Ordinal)
                    .Select(x=>x.OrderByDescending(hit=>hit.Score).First())
                    .Take(32)
                    .ToArray();
                retrieved=new(merged,string.Join(" | ",queries));
                trace.Add(new ChatToolTrace("knowledge.retrieve.multi","ok",(int)sw.ElapsedMilliseconds,$"queries={queries.Length};hits={merged.Length}"));
            }
        }

        if(plan.Intent==ChatIntent.MarketFilter)
        {
            toolPolicy.Demand("filter.conversation");
            var r=await Timed("filter.conversation",()=>filters.ProcessAsync(
                subject,request.ConversationId,request.Question,
                new FilterExecutionOptions(request.Page,request.PageSize,request.SortBy,request.SortDescending),ct,
                authenticated?anonymousSubject:null),trace);
            filterResult=r;
            if(!r.Success)
                return new("clarification",r.Error??"شرط فیلتر قابل تشخیص نبود.",request.ConversationId,ChatIntent.Clarification,r.Confidence,null,r,[],[],trace,r.Error,temporalContext,entityContext);
        }

        var hits=retrieved?.Hits??[];
        string answer;
        if(canonicalAnswer is not null&&compositeAnalysis.IsComposite)
        {
            toolPolicy.Demand("answer.compose.composite");
            var marketAnswer=marketQualityRejected
                ? BuildRejectedMarketMessage(qualityReport,snapshot)
                : marketUnavailableMessage??answerComposer.Compose(new AnswerComposeContext(effectiveQuestion,plan.Intent,
                    PersianFinancialAnswerComposer.DetectVerbosity(request.Question),plan.RequestedFields),snapshot,analytics,[]);
            answer=canonicalAnswer.Answer+"\n\n"+marketAnswer;
            trace.Add(new ChatToolTrace("answer.compose.composite","ok",0,
                $"canonical={canonicalAnswer.Reference.Kind};marketFields={string.Join('|',compositeAnalysis.MarketFields)};qualityRejected={marketQualityRejected}"));
        }
        else if(canonicalAnswer is not null)
        {
            var synthesisEvidence=BuildGroundedSynthesisEvidence(canonicalAnswer,hits);
            answer=await ComposeCanonicalAnswerAsync(effectiveQuestion,canonicalAnswer,synthesisEvidence,
                turnContext.Previous.RecentTurns??[],trace,ct);
            if(HasUnsafeRepresentationClaim(answer,canonicalAnswer,synthesisEvidence))
                answer=ComposeCanonicalFallback(canonicalAnswer,synthesisEvidence);
        }
        else
        {
            var answerSnapshot=marketQualityRejected||marketUnavailableMessage is not null?null:snapshot;
            var deterministicAnswer=plan.Reasons.Contains("targeted-news",StringComparer.Ordinal)&&hits.Count==0
                ? $"برای نماد «{resolvedSymbol??plan.Symbol}» خبر قابل اتکایی در اسناد نمایه‌شده پیدا نشد."
                : answerComposer.Compose(new AnswerComposeContext(effectiveQuestion,plan.Intent,PersianFinancialAnswerComposer.DetectVerbosity(request.Question),plan.RequestedFields),answerSnapshot,analytics,hits);
            if((plan.Intent is ChatIntent.Knowledge or ChatIntent.Hybrid)&&hits.Count>0)
            {
                toolPolicy.Demand("answer.synthesize");
                var synthesisEvidence=hits.Take(12)
                    .Select(x=>new GroundedSynthesisEvidence(x.Citation.SourceId,x.Citation.PublishedAt,x.Text)).ToArray();
                var synthesized=await Timed("answer.synthesize",()=>answerSynthesizer.SynthesizeAsync(
                    new GroundedAnswerSynthesisRequest(effectiveQuestion,deterministicAnswer,[],synthesisEvidence,[],turnContext.Previous.RecentTurns??[]),ct),trace);
                answer=synthesized??deterministicAnswer;
            }
            else answer=deterministicAnswer;
            if(marketQualityRejected)
                answer+="\n\n"+BuildRejectedMarketMessage(qualityReport,snapshot);
            else if(marketUnavailableMessage is not null)
                answer+="\n\n"+marketUnavailableMessage;
        }
        if(qualityReport?.Status==DataQualityStatus.Warning)
            answer="⚠️ برخی شاخص‌های کیفیت داده نیازمند توجه هستند؛ اعداد زیر از Snapshot معتبر ولی دارای Warning استخراج شده‌اند.\n\n"+answer;

        // Bounded reflection: at most one review and at most one additional retrieval.
        // Reflection cannot call arbitrary tools and cannot mutate filter/market execution.
        if ((canonicalAnswer is not null || ShouldReflect(plan, hits, trace))
            &&!((marketUnavailableMessage is not null||marketQualityRejected)&&canonicalAnswer is null))
        {
            toolPolicy.Demand("reflection.review");
            var failed=trace.Where(x=>x.Status=="failed").Select(x=>x.Tool).Distinct().ToArray();
            var deterministicCanonical=compositeAnalysis.IsComposite
                ||CanonicalOrganizationEvidencePolicy.ShouldUseDeterministicKnowledgeRoute(canonicalAnswer);
            var review=deterministicCanonical
                ? await Timed("reflection.review",()=>Task.FromResult(ReviewDeterministicCanonicalAnswer(answer,canonicalAnswer!,hits)),trace,
                    result=>$"mode=deterministic-canonical;action={result.Action};reasons={string.Join('|',result.Reasons)}")
                : await Timed("reflection.review",()=>reflector.ReviewAsync(
                    new ChatReflectionRequest(effectiveQuestion,answer,plan.Intent,plan.Confidence,
                        hits.Count+(canonicalAnswer?.Facts.Count??0),failed,ReflectionEvidence(canonicalAnswer,hits)),ct),trace);
            var activeSubject=canonicalAnswer?.Reference.SubjectName??turnContext.Previous.ActiveReference?.SubjectName;
            if(review.Action=="accept" && turnContext.RouteHint.ContextApplied && !CoversSubject(answer,activeSubject))
                review=new ChatReflectionResult("retrieve_more",BuildFocusedFollowUpQuery(effectiveQuestion,activeSubject),null,["active_subject_missing_from_answer"]);

            if (review.Action=="clarify")
                return new("clarification",review.Clarification??"برای پاسخ دقیق‌تر، سؤال را کمی مشخص‌تر بیان کنید.",request.ConversationId,ChatIntent.Clarification,plan.Confidence,snapshot,filterResult,hits,hits.Select(x=>x.Citation).Distinct().Take(8).ToArray(),trace,review.Clarification,temporalContext,entityContext);

            if (review.Action=="retrieve_more" && plan.Intent is ChatIntent.Knowledge or ChatIntent.Hybrid)
            {
                var rq=string.IsNullOrWhiteSpace(review.ImprovedQuery)?(plan.KnowledgeQuery??effectiveQuestion):review.ImprovedQuery!;
                toolPolicy.Demand("knowledge.retrieve");
                retrieved=await Timed("knowledge.retrieve",()=>knowledge.RetrieveAsync(rq,12,BuildKnowledgeContext(effectiveQuestion,resolvedSymbol,temporalContext),ct),trace);
                hits=hits.Concat(retrieved.Hits)
                    .GroupBy(x=>$"{x.Citation.SourceType}:{x.Citation.SourceId}",StringComparer.Ordinal)
                    .Select(x=>x.OrderByDescending(hit=>hit.Score).First()).OrderByDescending(x=>x.Score).Take(32).ToArray();
                if(canonicalAnswer is not null&&compositeAnalysis.IsComposite)
                {
                    var marketAnswer=marketQualityRejected
                        ? BuildRejectedMarketMessage(qualityReport,snapshot)
                        : marketUnavailableMessage??answerComposer.Compose(new AnswerComposeContext(effectiveQuestion,plan.Intent,
                            PersianFinancialAnswerComposer.DetectVerbosity(request.Question),plan.RequestedFields),snapshot,analytics,[]);
                    answer=canonicalAnswer.Answer+"\n\n"+marketAnswer;
                }
                else if(canonicalAnswer is not null)
                {
                    var synthesisEvidence=BuildGroundedSynthesisEvidence(canonicalAnswer,hits);
                    answer=await ComposeCanonicalAnswerAsync(effectiveQuestion,canonicalAnswer,synthesisEvidence,
                        turnContext.Previous.RecentTurns??[],trace,ct);
                    if(HasUnsafeRepresentationClaim(answer,canonicalAnswer,synthesisEvidence))
                        answer=ComposeCanonicalFallback(canonicalAnswer,synthesisEvidence);
                }
                else
                {
                    var answerSnapshot=marketQualityRejected||marketUnavailableMessage is not null?null:snapshot;
                    var deterministicAnswer=plan.Reasons.Contains("targeted-news",StringComparer.Ordinal)&&hits.Count==0
                        ? $"برای نماد «{resolvedSymbol??plan.Symbol}» خبر قابل اتکایی در اسناد نمایه‌شده پیدا نشد."
                        : answerComposer.Compose(new AnswerComposeContext(effectiveQuestion,plan.Intent,PersianFinancialAnswerComposer.DetectVerbosity(request.Question),plan.RequestedFields),answerSnapshot,analytics,hits);
                    if((plan.Intent is ChatIntent.Knowledge or ChatIntent.Hybrid)&&hits.Count>0)
                    {
                        toolPolicy.Demand("answer.synthesize");
                        var synthesisEvidence=hits.Take(12)
                            .Select(x=>new GroundedSynthesisEvidence(x.Citation.SourceId,x.Citation.PublishedAt,x.Text)).ToArray();
                        var synthesized=await Timed("answer.synthesize",()=>answerSynthesizer.SynthesizeAsync(
                            new GroundedAnswerSynthesisRequest(effectiveQuestion,deterministicAnswer,[],synthesisEvidence,[],turnContext.Previous.RecentTurns??[]),ct),trace);
                        answer=synthesized??deterministicAnswer;
                    }
                    else answer=deterministicAnswer;
                    if(marketQualityRejected)
                        answer+="\n\n"+BuildRejectedMarketMessage(qualityReport,snapshot);
                    else if(marketUnavailableMessage is not null)
                        answer+="\n\n"+marketUnavailableMessage;
                }
                if(qualityReport?.Status==DataQualityStatus.Warning)
                    answer="⚠️ برخی شاخص‌های کیفیت داده نیازمند توجه هستند؛ اعداد زیر از Snapshot معتبر ولی دارای Warning استخراج شده‌اند.\n\n"+answer;

                toolPolicy.Demand("reflection.review.final");
                var secondReview=await Timed("reflection.review.final",()=>reflector.ReviewAsync(
                    new ChatReflectionRequest(effectiveQuestion,answer,plan.Intent,plan.Confidence,
                        hits.Count+(canonicalAnswer?.Facts.Count??0),failed,ReflectionEvidence(canonicalAnswer,hits)),ct),trace);
                if(secondReview.Action=="clarify")
                    return new("clarification",secondReview.Clarification??"برای پاسخ دقیق‌تر، سؤال را کمی مشخص‌تر بیان کنید.",request.ConversationId,
                        ChatIntent.Clarification,plan.Confidence,snapshot,filterResult,hits,hits.Select(x=>x.Citation).Distinct().Take(8).ToArray(),trace,
                        secondReview.Clarification,temporalContext,entityContext);
                if(secondReview.Action!="accept" || (turnContext.RouteHint.ContextApplied && !CoversSubject(answer,activeSubject)))
                    answer=canonicalAnswer is not null
                        ? ComposeCanonicalFallback(canonicalAnswer,BuildGroundedSynthesisEvidence(canonicalAnswer,hits))
                        : $"در داده‌های قابل اتکای فعلی، پاسخ مشخصی درباره «{activeSubject??"موضوع موردنظر"}» برای این سؤال پیدا نشد.";
            }
        }

        var citations=hits.Select(x=>x.Citation).Distinct().Take(8).ToArray();
        var evidence=evidenceEngine.Build(plan.Intent,snapshot,qualityReport,analytics,hits,null,null,filterResult,entityContext)
            .Concat(canonicalAnswer is null?[]:BuildCanonicalEvidence(canonicalAnswer)).ToArray();
        var validationIntent=marketUnavailableMessage is not null
            ? ChatIntent.Knowledge
            : marketQualityRejected&&plan.Intent==ChatIntent.Hybrid&&hits.Count==0
                ? ChatIntent.MarketSymbol
                : plan.Intent;
        var evidenceValidation=evidenceEngine.Validate(validationIntent,evidence,snapshot is not null,hits.Count>0,false,false,answer);
        var answerValidation=answerValidationGuard.Validate(answer,validationIntent,evidence,evidenceValidation);
        trace.Add(new ChatToolTrace("answer.validate",answerValidation.IsValid?"ok":"failed",0,$"status={answerValidation.Status};issues={string.Join('|',answerValidation.Issues)}"));
        if(!answerValidation.IsValid)
            return new("answer_validation_blocked","پاسخ بالقوه توسط Answer Validation / Hallucination Guard مسدود شد؛ Evidence برای ادعاهای پاسخ کافی نبود.",request.ConversationId,plan.Intent,0,snapshot,filterResult,hits,citations,trace,string.Join(",",answerValidation.Issues),temporalContext,entityContext,qualityReport,analytics,Evidence:evidence,EvidenceValidation:evidenceValidation,AnswerValidation:answerValidation);
        var savedContext=canonicalAnswer is not null
            ? await conversationContext.RecordReferenceAsync(subject,request.ConversationId,request.Question,effectiveQuestion,answer,canonicalAnswer,temporalContext,ct)
            : await conversationContext.RecordAsync(subject,request.ConversationId,request.Question,plan.Intent,routeDecision.Route,temporalContext,entityContext,null,ct,answer,plan.Intent.ToString().ToLowerInvariant());
        var resultType=compositeAnalysis.IsComposite?"composite_reference_market":plan.Intent.ToString().ToLowerInvariant();
        return new(resultType,answer,request.ConversationId,plan.Intent,plan.Confidence,snapshot,filterResult,hits,citations,trace,null,temporalContext,entityContext,qualityReport,analytics,null,null,savedContext,Evidence:evidence,EvidenceValidation:evidenceValidation,AnswerValidation:answerValidation);
    }

    private async Task<string> ComposeCanonicalAnswerAsync(
        string question,
        CanonicalReferenceAnswer canonical,
        IReadOnlyList<GroundedSynthesisEvidence> evidence,
        IReadOnlyList<ConversationMemoryTurn> recentTurns,
        List<ChatToolTrace> trace,
        CancellationToken ct)
    {
        if(CanonicalOrganizationEvidencePolicy.ShouldUseDeterministicKnowledgeRoute(canonical))
        {
            toolPolicy.Demand("answer.compose.canonical");
            var sw=Stopwatch.StartNew();
            var deterministic=ComposeCanonicalFallback(canonical,evidence);
            sw.Stop();
            trace.Add(new ChatToolTrace("answer.compose.canonical","ok",(int)sw.ElapsedMilliseconds,
                $"kind={canonical.Reference.Kind};evidence={evidence.Count};missing={string.Join('|',canonical.MissingFacets)}"));
            return deterministic;
        }

        toolPolicy.Demand("answer.synthesize");
        var synthesized=await Timed("answer.synthesize",()=>answerSynthesizer.SynthesizeAsync(
            new GroundedAnswerSynthesisRequest(question,canonical.Answer,canonical.Facts,evidence,
                canonical.MissingFacets,recentTurns),ct),trace);
        return ComposeBoardRepresentationSummary(canonical,evidence)
            ??ComposeBoardHistorySummary(canonical,evidence)
            ??synthesized
            ??ComposeCanonicalFallback(canonical,evidence);
    }

    private static string BuildRejectedMarketMessage(MarketDataQualityReport? report, MarketSymbolSnapshot? snapshot)
    {
        if(report?.Status==DataQualityStatus.Stale && snapshot?.SourceLastModified is DateTime sourceTime)
            return $"آخرین داده ثبت‌شده بازار مربوط به {PersianDisplayText.FormatPersianDate(sourceTime,true)} است و برای پاسخ جاری قابل اتکا نیست؛ بنابراین عدد قدیمی نمایش داده نشد.";
        return "داده بازار در کنترل کیفیت معتبر شناخته نشد؛ برای جلوگیری از ارائه عدد نادرست، پاسخی از این Snapshot نمایش داده نشد.";
    }

    private static string BuildMarketUnavailableMessage(string? displayName,string? error)
    {
        var subject=string.IsNullOrWhiteSpace(displayName)?"نماد موردنظر":displayName.Trim();
        return error=="market_snapshot_not_found"
            ? $"برای «{subject}» داده بازار قابل اتکایی در Snapshot فعلی موجود نیست."
            : $"داده بازار «{subject}» موقتاً در دسترس نیست؛ برای جلوگیری از ارائه عدد نادرست، عددی نمایش داده نشد.";
    }

    private async Task<EntityResolution> ResolveMarketEntityAsync(string input,CancellationToken ct)
    {
        var options=new EntityResolveOptions([EntityKind.Instrument,EntityKind.MarketIndex]);
        var cleaned=CleanMarketEntityInput(input);
        if(!string.Equals(cleaned,input,StringComparison.Ordinal) && cleaned.Length>=2)
        {
            var cleanedResult=await entities.ResolveAsync(cleaned,options,ct);
            if(cleanedResult.Status==EntityResolutionStatus.Resolved) return cleanedResult;
        }
        var primary=await entities.ResolveAsync(input,options,ct);
        if(primary.Status==EntityResolutionStatus.Resolved) return primary;

        EntityResolution? ambiguous=null;
        foreach(var phrase in EntitySubphrases(input).Take(4))
        {
            var candidate=await entities.ResolveAsync(phrase,options,ct);
            if(candidate.Status==EntityResolutionStatus.Resolved) return candidate;
            if(candidate.Status==EntityResolutionStatus.Ambiguous && ambiguous is null) ambiguous=candidate;
        }
        return ambiguous??primary;
    }

    private static string CleanMarketEntityInput(string input)
    {
        var value=PersianDisplayText.Normalize(input).Replace('‌',' ');
        string[] metricPhrases=
        [
            "نسبت ارزش معاملات به ارزش بازار","میانگین ارزش هر معامله","میانگین حجم هر معامله","میانگین قیمت معامله",
            "میانگین وزنی قیمت معاملات","به طور میانگین در هر معامله","ارزش بازار","ارزش معاملات","ارزش دادوستد",
            "حجم معاملات","حجم دادوستد","تعداد معاملات","تعداد دادوستد","آخرین قیمت","قیمت لحظه ای","آخرین نرخ",
            "قیمت پایانی","قیمت اولین معامله","قیمت آغازین","قیمت بازگشایی","قیمت روز قبل","قیمت دیروز","قیمت مبنا",
            "بالاترین قیمت","کمترین قیمت","کمترین نرخ معامله","اثر روی شاخص","اثر بر شاخص","روی شاخص اثر",
            "دامنه نوسان","فاصله سقف تا کف","فاصله سقف و کف","بین چه قیمت هایی","بازار و تابلو","وضعیت معاملاتی",
            "تابلوی معاملاتی","صنعت و زیرصنعت","نسبت قیمت به سود","سود هر سهم","بهترین قیمت خرید","بهترین قیمت فروش",
            "بهترین سفارش خرید","بهترین سفارش فروش","حجم بهترین سفارش خرید","حجم بهترین سفارش فروش",
            "تعداد سفارش های بهترین خرید","تعداد سفارش های بهترین فروش","اختلاف قیمت خرید و فروش","فاصله خرید و فروش",
            "نسبت عمق خرید به فروش","نسبت حجم خرید به فروش","عدم تعادل اردربوک","ارزش سفارش های خرید","ارزش سفارش های فروش",
            "مجموع حجم خرید","مجموع حجم فروش","کل حجم خرید","کل حجم فروش","کل تعداد سفارش خرید","کل تعداد سفارش فروش",
            "آخرین بروزرسانی اردربوک","آخرین به روزرسانی اردربوک","دفتر سفارش کامل","اردربوک کامل","عمق بازار کامل",
            "شناسه ابزار در اردربوک","شناسه نماد در منبع","کد اینس در اردربوک","bestlimitcounter اردربوک",
            "روی چه قیمتی معامله میشه","با چه قیمتی باز شد","چند بسته شد"
        ];
        foreach(var phrase in metricPhrases.OrderByDescending(x=>x.Length))
            value=value.Replace(phrase," ",StringComparison.Ordinal);
        var stop=new HashSet<string>(StringComparer.OrdinalIgnoreCase)
        {
            "قیمت","نرخ","پایانی","حجم","ارزش","تعداد","معاملات","معامله","دادوستد","سهم","نماد","شرکت",
            "مبنا","مبنای","اولین","آخرین","بالاترین","کمترین","سقف","کف","فاصله","درصد","تغییر","ریال",
            "بازار","تابلو","صنعت","زیرصنعت","وضعیت","معاملاتی","شاخص","اثر","واحد","ثبت","داده","تاریخ","تاریخی","زمان",
            "میانگین","متوسط","وزنی","نسبت","گردش","بهترین","سفارش","سفارشات","خرید","فروش","cashmarket","orderbook","جدول",
            "اردربوک","اوردر","بوک","دفتر","عمق","تقاضا","عرضه","مظنه","سطح","ردیف","سرخط","اسپرد","میانی","ایمبالانس","عدم","تعادل","صف","یکطرفه","یک","طرفه","کل","مجموع","جمع",
            "instrumentid","inscode","bestlimitcounter","شناسه","ابزار","اینس","کد","کانتر","شمارنده","نسخه",
            "امروز","الان","فعلی","روی","در","از","تا","به","با","برای","و","یا","هر","چه","کدام","کدوم",
            "چند","چندتا","چقدر","چنده","چیست","چیه","است","هست","بوده","بود","شده","شد","میشود","میشه",
            "را","رو","بگو","بده","اعلام","کن","حساب","طور","یکجا","مربوط","مربوطه","تاریخیه","قرار","دارد",
            "دست","جابه","جا","جابجا","گذاشته","رفته","آمده","باز","بسته","می","اند","ده"
            ,"اول","دوم","سوم","چهارم","پنجم","بزرگترین","بزرگ ترین","وجود"
        };
        var tokens=Regex.Matches(value,@"[\p{L}\p{Nd}]+")
            .Select(x=>x.Value).Where(x=>!stop.Contains(x)).ToArray();
        return string.Join(' ',tokens);
    }

    private static IEnumerable<string> EntitySubphrases(string input)
    {
        var normalized=PersianDisplayText.Normalize(input).Replace('‌',' ');
        var tokens=Regex.Matches(normalized,@"[\p{L}\p{Nd}]+")
            .Select(x=>x.Value).Where(x=>x.Length>0).ToArray();
        for(var length=tokens.Length-1;length>=1;length--)
        for(var start=tokens.Length-length;start>=0;start--)
        {
            var phrase=string.Join(' ',tokens.Skip(start).Take(length));
            var compact=Regex.Replace(phrase,@"[^\p{L}\p{Nd}]",string.Empty);
            if(compact.Length>=3) yield return phrase;
        }
    }


    private static KnowledgeRetrievalContext BuildKnowledgeContext(string question,string? symbol,TemporalResolution temporal)
    {
        var documentEvidence=CanonicalQuestionOwnership.RequiresDocumentEvidence(question);
        var latest=question.Contains("آخرین",StringComparison.Ordinal)||question.Contains("جدیدترین",StringComparison.Ordinal)||question.Contains("تازه",StringComparison.Ordinal)
            || documentEvidence&&!temporal.HasTemporalReference;
        int? contentType=(question.Contains("خبر",StringComparison.Ordinal)||question.Contains("اخبار",StringComparison.Ordinal)||question.Contains("اطلاعیه",StringComparison.Ordinal))?1:null;
        string? from=null,to=null;
        if(temporal.HasTemporalReference)
        {
            from=temporal.Start?.GregorianIso; to=(temporal.End??temporal.Start)?.GregorianIso;
        }
        var historicalFacet=question.Contains("سابق",StringComparison.Ordinal)
            || question.Contains("سوابق",StringComparison.Ordinal)
            || question.Contains("قبلی",StringComparison.Ordinal)
            || question.Contains("پیشین",StringComparison.Ordinal)
            || question.Contains("نماینده",StringComparison.Ordinal)
            || question.Contains("از طرف",StringComparison.Ordinal)
            || question.Contains("از سوی",StringComparison.Ordinal);
        var personQuestion=CanonicalPersonRoleMatcher.IsPersonRoleQuestion(question);
        // A plain current-role question can stay on the authoritative projection.
        // History/representation needs both the current projection and dated CMS
        // evidence, so source_type must remain open and current_only must be false.
        // Event/report questions are owned by dbo.Content and its Qdrant
        // projection. Keeping this boundary prevents a generic FAQ or a current
        // organization profile from outranking the explicitly requested report.
        var sourceType=documentEvidence
            ? "cms_content"
            : personQuestion && !historicalFacet?"organization_person":null;
        return new(symbol,from,to,latest?true:null,contentType,null,1,sourceType,historicalFacet?false:null);
    }

    private static bool RequiresHistoricalOrFutureMarketData(TemporalResolution temporal,TemporalResolution? comparison=null)
    {
        if(comparison is not null && RequiresHistoricalOrFutureMarketData(comparison,null)) return true;
        if (!temporal.HasTemporalReference) return false;
        if (temporal.Kind is TemporalIntentKind.DateRange or TemporalIntentKind.RelativeRange) return !temporal.IsReferenceDayOnly;
        return temporal.Start!.GregorianDate != temporal.ReferenceDate.GregorianDate;
    }

    private static bool IsCurrentSnapshotPreviousPrice(ChatPlan plan)
        => plan.Intent==ChatIntent.MarketSymbol
           && plan.RequestedFields?.Contains("yesterday_price",StringComparer.Ordinal)==true;

    private static bool UsesCurrentSnapshotPreviousPrice(StructuredQueryPlan plan)
        => plan.SortBy==StructuredQueryMetric.YesterdayPrice
           || plan.Conditions.Any(x=>x.Metric==StructuredQueryMetric.YesterdayPrice);

    private static string BuildTemporalMarketGuard(TemporalResolution temporal)
    {
        if (temporal.Start is null) return "تاریخ درخواست‌شده قابل استفاده برای داده بازار نیست.";
        if (temporal.IsFuture)
        {
            if (temporal.Start.MarketDayKind == MarketDayKind.FutureWeekendClosed)
                return $"تاریخ درخواست‌شده {temporal.Start.JalaliDate} در آینده و در تعطیلی هفتگی بازار قرار دارد. TSEAI داده آینده را به‌عنوان واقعیت تولید نمی‌کند.";
            return $"تاریخ درخواست‌شده {temporal.Start.JalaliDate} در آینده است. TSEAI داده بازار آینده را به‌عنوان واقعیت تولید نمی‌کند.";
        }

        if (temporal.Kind is TemporalIntentKind.DateRange or TemporalIntentKind.RelativeRange)
            return $"بازه تاریخی {temporal.Start.JalaliDate} تا {temporal.End?.JalaliDate} شناسایی شد، اما MarketDailyHistory هنوز به فاز جاری متصل نیست؛ برای جلوگیری از پاسخ نادرست از Snapshot امروز استفاده نمی‌کنم.";

        if (temporal.Start.MarketDayKind == MarketDayKind.WeekendClosed)
            return $"تاریخ {temporal.Start.JalaliDate} در تعطیلی هفتگی بازار قرار دارد و داده معاملاتی روزانه برای آن نباید از Snapshot امروز جایگزین شود.";

        return $"تاریخ {temporal.Start.JalaliDate} شناسایی شد، اما MarketDailyHistory هنوز به فاز جاری متصل نیست؛ برای جلوگیری از پاسخ نادرست از Snapshot امروز استفاده نمی‌کنم.";
    }

    private static IReadOnlyList<string> CanonicalEvidenceText(CanonicalReferenceAnswer answer)
        => answer.Facts.Select(x=>$"{x.Key}: {x.Value} | source={x.SourceId} | effective={x.EffectiveAt:O}").ToArray();

    private static IReadOnlyList<string> ReflectionEvidence(CanonicalReferenceAnswer? canonical,IReadOnlyList<KnowledgeHit> hits)
        => (canonical is null?Enumerable.Empty<string>():CanonicalEvidenceText(canonical))
            .Concat(hits.Take(12).Select(x=>$"source={x.Citation.SourceId}; published={x.Citation.PublishedAt}; {Trim(x.Text,3500)}"))
            .Take(20)
            .ToArray();

    private static ChatReflectionResult ReviewDeterministicCanonicalAnswer(
        string answer,CanonicalReferenceAnswer canonical,IReadOnlyList<KnowledgeHit> hits)
    {
        var missingSubjects=CanonicalSubjects(canonical)
            .Where(subject=>!ContainsNormalized(answer,subject)).ToArray();
        if(missingSubjects.Length>0)
            return new("clarify",null,"پاسخ نهایی همه اشخاص مرجع را پوشش نداد؛ لطفاً دوباره تلاش کنید.",
                ["canonical_subject_omitted:"+string.Join(',',missingSubjects)]);
        var evidence=BuildGroundedSynthesisEvidence(canonical,hits);
        if(HasUnsafeRepresentationClaim(answer,canonical,evidence))
            return new("clarify",null,"ادعای نمایندگی با شواهد موجود قابل تأیید نبود.",["unsupported_representation_claim"]);
        return new("accept",null,null,["canonical_subjects_covered","representation_claims_evidence_checked"]);
    }

    private static IReadOnlyList<ChatEvidenceItem> BuildCanonicalEvidence(CanonicalReferenceAnswer answer)
        => answer.Facts.Select((fact,index)=>new ChatEvidenceItem(
            $"reference:{fact.SourceId}:{fact.Key}",$"R{index+1}",EvidenceKind.CanonicalReference,EvidenceAuthority.CanonicalReferenceData,
            "SQL_AI",fact.SourceId,answer.Reference.Topic,fact.EffectiveAt,null,null,null,null,null,
            new Dictionary<string,object?>{{fact.Key,fact.Value}})).ToArray();

    private static IReadOnlyList<GroundedSynthesisEvidence> BuildGroundedSynthesisEvidence(
        CanonicalReferenceAnswer canonical,IReadOnlyList<KnowledgeHit> hits)
    {
        var evidence=hits.Select(x=>new GroundedSynthesisEvidence(x.Citation.SourceId,x.Citation.PublishedAt,x.Text)).ToArray();
        var needsHistory=canonical.MissingFacets.Contains("member_history",StringComparer.Ordinal)
            || canonical.MissingFacets.Contains("person_history",StringComparer.Ordinal);
        var needsRepresentation=canonical.MissingFacets.Contains("representing_company",StringComparer.Ordinal);
        if(!needsHistory&&!needsRepresentation) return evidence;

        var subjects=CanonicalSubjects(canonical);
        var validated=new List<GroundedSynthesisEvidence>();
        if(needsHistory)
        {
            foreach(var hit in hits)
            {
                var excerpts=EvidenceExcerpts(hit.Text)
                    .Where(x=>CanonicalOrganizationEvidencePolicy.IsProfessionalHistoryExcerpt(x,subjects))
                    .Take(4).ToArray();
                if(excerpts.Length==0) continue;
                var subjectLabels=subjects.Where(subject=>excerpts.Any(x=>ContainsNormalized(x,subject))).ToArray();
                var label=$"[سابقه حرفه‌ای صریح؛ اشخاص: {string.Join("، ",subjectLabels)}; تاریخ سند: {FormatEvidenceDate(hit.Citation.PublishedAt)}]";
                validated.Add(new(hit.Citation.SourceId,hit.Citation.PublishedAt,label+"\n"+string.Join("\n",excerpts)));
            }
        }
        if(needsRepresentation)
        {
            foreach(var hit in hits)
            {
                var excerpts=EvidenceExcerpts(hit.Text)
                    .Where(HasRepresentationCue)
                    .Where(x=>subjects.Any(subject=>ContainsNormalized(x,subject)))
                    .Take(4).ToArray();
                if(excerpts.Length==0) continue;
                var subjectLabels=subjects.Where(subject=>excerpts.Any(x=>ContainsNormalized(x,subject))).ToArray();
                var date=FormatEvidenceDate(hit.Citation.PublishedAt);
                var label=$"[رابطه صریح نام و نمایندگی؛ اشخاص: {string.Join("، ",subjectLabels)}; تاریخ سند: {date}; این سند به‌تنهایی وضعیت جاری نمایندگی را اثبات نمی‌کند]";
                validated.Add(new(hit.Citation.SourceId,hit.Citation.PublishedAt,label+"\n"+string.Join("\n",excerpts)));
            }
        }
        return validated.GroupBy(x=>x.SourceId+"\n"+x.Text,StringComparer.Ordinal).Select(x=>x.First()).ToArray();
    }

    private static string ComposeCanonicalFallback(CanonicalReferenceAnswer canonical,IReadOnlyList<GroundedSynthesisEvidence> evidence)
    {
        var boardFacetSummary=ComposeBoardRepresentationSummary(canonical,evidence)
            ??ComposeBoardHistorySummary(canonical,evidence);
        if(boardFacetSummary is not null) return boardFacetSummary;
        var missing=canonical.MissingFacets.Select(x=>x switch
        {
            "member_history" or "person_history" => "سوابق",
            "representing_company" => "شرکتِ نمایندگی‌شده",
            _ => "اطلاعات تکمیلی"
        }).Distinct(StringComparer.Ordinal).ToArray();
        if(evidence.Count==0)
            return canonical.Answer+"\n\nبرای "+string.Join(" و ",missing)+"، مدرک قابل اتکای کافی در داده‌های فعلی پیدا نشد؛ بنابراین چیزی حدس نمی‌زنم.";
        if(canonical.MissingFacets.Contains("representing_company",StringComparer.Ordinal) && CanonicalSubjects(canonical).Count==1)
        {
            var first=evidence[0];
            var subject=CanonicalSubjects(canonical)[0];
            if(TryExtractRepresentingCompany(subject,first.Text,out var company))
                return $"طبق سند مورخ {FormatEvidenceDate(first.PublishedAt)}، {subject} به نمایندگی از {company} معرفی شده بود. مدرک جدیدتری برای تأیید وضعیت جاری این نمایندگی پیدا نشد.";
            return $"طبق سند مورخ {FormatEvidenceDate(first.PublishedAt)}، {Trim(StripEvidenceLabel(first.Text),700)}\n\nاین سند تاریخی است و وضعیت جاری نمایندگی را تأیید نمی‌کند.";
        }
        var excerpts=evidence.Take(6).Select(x=>$"- سند مورخ {FormatEvidenceDate(x.PublishedAt)}: {Trim(StripEvidenceLabel(x.Text),650)}");
        var heading=canonical.MissingFacets.Contains("representing_company",StringComparer.Ordinal)
            ? "شواهد صریح و تاریخ‌دار درباره نمایندگی (این شواهد وضعیت جاری را اثبات نمی‌کنند):"
            : "شواهد تکمیلی تاریخی:";
        return canonical.Answer+"\n\n"+heading+"\n"+string.Join("\n",excerpts);
    }

    private static bool HasUnsafeRepresentationClaim(
        string answer,CanonicalReferenceAnswer canonical,IReadOnlyList<GroundedSynthesisEvidence> evidence)
    {
        if(!canonical.MissingFacets.Contains("representing_company",StringComparer.Ordinal)) return false;
        var claims=Regex.Split(answer??string.Empty,@"(?<=[.!؟?])\s+|[\r\n]+")
            .Where(x=>HasAffirmativeRepresentationCue(x)).ToArray();
        if(claims.Length==0) return false;
        var subjects=CanonicalSubjects(canonical);
        var supported=subjects.Where(subject=>evidence.Any(x=>ContainsNormalized(x.Text,subject))).ToHashSet(StringComparer.Ordinal);
        foreach(var claim in claims)
        {
            var mentioned=subjects.Where(subject=>ContainsNormalized(claim,subject)).ToArray();
            if(mentioned.Length==0 && subjects.Count==1) mentioned=[subjects[0]];
            if(mentioned.Length==0 || mentioned.Any(subject=>!supported.Contains(subject))) return true;
            if(evidence.Any(x=>!string.IsNullOrWhiteSpace(x.PublishedAt)) && !HasHistoricalMarker(claim)) return true;
        }
        return false;
    }

    private static IReadOnlyList<string> CanonicalSubjects(CanonicalReferenceAnswer canonical)
        => new[] { canonical.Reference.SubjectName }
            .Concat(canonical.Reference.RelatedSubjects)
            .Concat(canonical.Facts.Where(x=>x.Key.Contains("name",StringComparison.OrdinalIgnoreCase)).Select(x=>x.Value))
            .Where(x=>!string.IsNullOrWhiteSpace(x)).Select(x=>PersianDisplayText.Normalize(x!))
            .Distinct(StringComparer.Ordinal).ToArray();

    private static bool HasRepresentationCue(string text)
        => text.Contains("نماینده",StringComparison.Ordinal) || text.Contains("نمایندگی",StringComparison.Ordinal)
            || text.Contains("از طرف",StringComparison.Ordinal) || text.Contains("از سوی",StringComparison.Ordinal);

    private static IEnumerable<string> EvidenceExcerpts(string? text)
        => Regex.Split(text??string.Empty,@"(?<=[.!؟?])\s+|[\r\n]+")
            .Select(x=>x.Trim()).Where(x=>x.Length>0).Distinct(StringComparer.Ordinal);

    private static bool HasAffirmativeRepresentationCue(string text)
        => text.Contains("به نمایندگی از",StringComparison.Ordinal)
            || Regex.IsMatch(text,@"نماینده\s+(?:شرکت|گروه|صندوق|بانک|کارگزاری|سرمایه|مؤسسه|موسسه)")
            || Regex.IsMatch(text,@"از (?:طرف|سوی)\s+(?:شرکت|گروه|صندوق|بانک|کارگزاری|سرمایه|مؤسسه|موسسه)");

    private static bool HasHistoricalMarker(string text)
        => Regex.IsMatch(text,@"(?:13|14|19|20)\d{2}")
            || new[] { "طبق خبر", "طبق سند", "در خبر", "در سند", "در تاریخ", "تاریخی", "معرفی شده بود", "معرفی شد", "وضعیت جاری را تأیید نمی" }
                .Any(x=>text.Contains(x,StringComparison.Ordinal));

    private static bool ContainsNormalized(string text,string value)
        => CompactForMatch(text).Contains(CompactForMatch(value),StringComparison.Ordinal);

    private static string CompactForMatch(string value)
        => Regex.Replace(PersianDisplayText.Normalize(value??string.Empty),@"[^\p{L}\p{Nd}]",string.Empty);

    private static string FormatEvidenceDate(string? value)
    {
        if(!DateTimeOffset.TryParse(value,CultureInfo.InvariantCulture,DateTimeStyles.AssumeUniversal,out var parsed))
            return "نامشخص";
        var calendar=new PersianCalendar();
        return $"{calendar.GetYear(parsed.DateTime):0000}/{calendar.GetMonth(parsed.DateTime):00}/{calendar.GetDayOfMonth(parsed.DateTime):00}";
    }

    private static string StripEvidenceLabel(string text)
        => Regex.Replace(text??string.Empty,@"^\[[^\r\n]*\]\s*",string.Empty).Trim();

    private static bool TryExtractRepresentingCompany(string subject,string evidence,out string company)
    {
        company=string.Empty;
        var words=Regex.Matches(PersianDisplayText.Normalize(subject),@"[\p{L}\p{Nd}]+")
            .Select(x=>Regex.Escape(x.Value)).ToArray();
        if(words.Length==0) return false;
        var subjectPattern=string.Join(@"[\s‌]*",words);
        var match=Regex.Match(PersianDisplayText.Normalize(StripEvidenceLabel(evidence)),
            $@"{subjectPattern}\s+به\s+نمایندگی\s+از\s+(?<company>.{{2,120}}?)(?:\s*،|\s*,|\s+به\s+عنوان|[.!؟\r\n]|$)",RegexOptions.IgnoreCase);
        if(!match.Success) return false;
        company=Regex.Replace(match.Groups["company"].Value,@"\s+"," ").Trim(' ','،',',','.');
        return company.Length is >=2 and <=120;
    }

    private static string? ComposeBoardRepresentationSummary(
        CanonicalReferenceAnswer canonical,IReadOnlyList<GroundedSynthesisEvidence> evidence)
    {
        if(canonical.Reference.Kind!="organization_board"
           || !canonical.MissingFacets.Contains("representing_company",StringComparer.Ordinal)) return null;

        var nameFacts=canonical.Facts.Where(x=>x.Key.EndsWith(":name",StringComparison.Ordinal))
            .OrderBy(x=>BoardPosition(x.Key)).ToArray();
        if(nameFacts.Length==0) return null;
        var lines=new List<string>();
        for(var index=0;index<nameFacts.Length;index++)
        {
            var nameFact=nameFacts[index];
            var prefix=nameFact.Key[..^":name".Length];
            var role=canonical.Facts.FirstOrDefault(x=>x.Key==prefix+":role")?.Value??"عضو هیئت‌مدیره";
            var relationships=evidence
                .Where(x=>ContainsNormalized(x.Text,nameFact.Value))
                .Select(x=>new { Evidence=x, Company=ExtractCompanyOrNull(nameFact.Value,x.Text) })
                .Where(x=>!string.IsNullOrWhiteSpace(x.Company))
                .OrderByDescending(x=>ParseEvidenceDate(x.Evidence.PublishedAt))
                .ToArray();
            var detail=relationships.Length==0
                ? "مدرک قابل اتکایی برای شرکت نمایندگی پیدا نشد."
                : $"طبق سند مورخ {FormatEvidenceDate(relationships[0].Evidence.PublishedAt)}، به نمایندگی از {relationships[0].Company} معرفی شده بود؛ وضعیت جاری این نمایندگی تأیید نشده است.";
            lines.Add($"{index+1}. {nameFact.Value} — {role}: {detail}");
        }
        var historyNote=canonical.MissingFacets.Contains("member_history",StringComparer.Ordinal)
            ? "\n\nبرای سوابق حرفه‌ای کامل اعضا، داده قابل اتکای کافی در منابع فعلی پیدا نشد؛ بنابراین سابقه‌ای حدس زده نشده است."
            : string.Empty;
        return "اعضای فعلی ثبت‌شده هیئت‌مدیره بورس تهران و شواهد نمایندگی هرکدام:\n\n"
            +string.Join("\n",lines)+historyNote;
    }

    private static string? ComposeBoardHistorySummary(
        CanonicalReferenceAnswer canonical,IReadOnlyList<GroundedSynthesisEvidence> evidence)
    {
        if(canonical.Reference.Kind!="organization_board"
           || !canonical.MissingFacets.Contains("member_history",StringComparer.Ordinal)
           || canonical.MissingFacets.Contains("representing_company",StringComparer.Ordinal)) return null;
        if(evidence.Count==0)
            return canonical.Answer+"\n\nبرای سوابق حرفه‌ای کامل اعضا، داده قابل اتکای کافی در منابع فعلی پیدا نشد؛ بنابراین سابقه‌ای حدس زده نشده است.";
        var excerpts=evidence.Take(6)
            .Select(x=>$"- سند مورخ {FormatEvidenceDate(x.PublishedAt)}: {Trim(StripEvidenceLabel(x.Text),500)}");
        return canonical.Answer+"\n\nسوابق حرفه‌ای صریح و قابل استنادِ پیدا‌شده:\n"+string.Join("\n",excerpts)
            +"\n\nبرای اعضایی که مدرک صریحی پیدا نشد، سابقه‌ای حدس زده نشده است.";
    }

    private static string? ExtractCompanyOrNull(string subject,string evidence)
        => TryExtractRepresentingCompany(subject,evidence,out var company)?company:null;

    private static int BoardPosition(string key)
    {
        var parts=key.Split(':');
        return parts.Length>1 && int.TryParse(parts[1],out var position)?position:int.MaxValue;
    }

    private static DateTimeOffset ParseEvidenceDate(string? value)
        => DateTimeOffset.TryParse(value,CultureInfo.InvariantCulture,DateTimeStyles.AssumeUniversal,out var parsed)
            ? parsed : DateTimeOffset.MinValue;

    private static bool ShouldReflect(ChatPlan plan,IReadOnlyList<KnowledgeHit> hits,IReadOnlyList<ChatToolTrace> trace) => true;

    private static bool CoversSubject(string answer,string? subject)
        => string.IsNullOrWhiteSpace(subject) || PersianDisplayText.Normalize(answer).Replace("‌","").Contains(
            PersianDisplayText.Normalize(subject).Replace("‌",""),StringComparison.Ordinal);

    private static string BuildFocusedFollowUpQuery(string question,string? subject)
        => string.IsNullOrWhiteSpace(subject)?question:$"{subject} {question}";

    private static string Compose(ChatPlan plan,MarketSymbolSnapshot? s,IReadOnlyList<KnowledgeHit> hits,object? filter,SymbolMarketAnalytics? analytics)
    {
        if(plan.Intent==ChatIntent.MarketFilter) return "فیلتر بازار با قواعد قطعی TSEAI پردازش و اجرا شد.";
        var parts=new List<string>();
        if(s is not null)
        {
            parts.Add($"[M1] {s.Symbol} — {s.SymbolName}: آخرین قیمت {s.LastPrice.ToString("N0",CultureInfo.InvariantCulture)}، قیمت پایانی {s.ClosingPrice.ToString("N0",CultureInfo.InvariantCulture)}، تغییر آخرین قیمت {s.LastPricePercent:0.##}%، حجم {s.TradeVolume:N0}.");
            if(analytics is not null)
            {
                var metrics=new List<string>();
                if(analytics.TradingPower.BuyerPower.Availability==AnalyticsAvailability.Available) metrics.Add($"قدرت خریدار حقیقی {analytics.TradingPower.BuyerPower.Value:0.##}");
                if(analytics.OrderBook.Imbalance.Availability==AnalyticsAvailability.Available) metrics.Add($"عدم‌تعادل اردربوک {analytics.OrderBook.Imbalance.Value:0.###}");
                if(analytics.Volume.VolumeVsBaseVolume.Availability==AnalyticsAvailability.Available) metrics.Add($"نسبت حجم به حجم مبنا {analytics.Volume.VolumeVsBaseVolume.Value:0.##}");
                if(metrics.Count>0) parts.Add("[A1] تحلیل قطعی: "+string.Join("، ",metrics)+".");
            }
        }
        if(hits.Count>0)
        {
            var evidence=hits.Take(4).Select((x,i)=>$"[K{i+1}] {Trim(x.Text,420)}");
            parts.Add("اطلاعات بازیابی‌شده از پایگاه دانش:\n"+string.Join("\n",evidence));
        }
        if(parts.Count==0) return "داده قابل اتکایی برای پاسخ پیدا نشد.";
        return string.Join("\n\n",parts);
    }

    private static string ComposeComparison(MarketComparisonResult c)
    {
        static string Signed(decimal v)=>v>=0?$"+{v:0.##}":$"{v:0.##}";
        static string Metric(AnalyticsMetric<decimal> m)=>m.Availability==AnalyticsAvailability.Available && m.Value is not null?m.Value.Value.ToString("0.##",CultureInfo.InvariantCulture):"ناموجود";
        var a=c.Primary; var b=c.Secondary;
        var lines=new List<string>
        {
            $"مقایسه {a.Symbol} با {b.Symbol} بر اساس Snapshot جاری معتبر:",
            $"• آخرین قیمت: {a.Symbol} {a.LastPrice:N0} ({Signed(a.LastPricePercent)}٪) | {b.Symbol} {b.LastPrice:N0} ({Signed(b.LastPricePercent)}٪)",
            $"• قیمت پایانی: {a.Symbol} {a.ClosingPrice:N0} | {b.Symbol} {b.ClosingPrice:N0}",
            $"• حجم معاملات: {a.Symbol} {a.TradeVolume:N0} | {b.Symbol} {b.TradeVolume:N0}",
            $"• P/E: {a.Symbol} {(a.PE?.ToString("0.##",CultureInfo.InvariantCulture)??"ناموجود")} | {b.Symbol} {(b.PE?.ToString("0.##",CultureInfo.InvariantCulture)??"ناموجود")}",
            $"• قدرت خریدار حقیقی: {a.Symbol} {Metric(c.PrimaryAnalytics.TradingPower.BuyerPower)} | {b.Symbol} {Metric(c.SecondaryAnalytics.TradingPower.BuyerPower)}",
            $"• عدم‌تعادل اردربوک: {a.Symbol} {Metric(c.PrimaryAnalytics.OrderBook.Imbalance)} | {b.Symbol} {Metric(c.SecondaryAnalytics.OrderBook.Imbalance)}"
        };
        return string.Join("\n",lines);
    }

    private static string ComposeChatFilter(ConversationFilterResult result,FilterTemporalDecision temporal)
    {
        var matched=result.Matched??0; var scanned=result.Scanned??0;
        var head=$"فیلتر TSETMC با موفقیت اعتبارسنجی و اجرا شد. {matched:N0} نماد از {scanned:N0} نماد واجد شرایط بودند.";
        if(string.IsNullOrWhiteSpace(result.Code)) return head;
        var details=string.IsNullOrWhiteSpace(result.Explanation)?string.Empty:"\n"+result.Explanation;
        return head+details+"\n"+temporal.Message+"\nکد Canonical: "+result.Code;
    }

    private static string ComposeStructuredQuery(StructuredQueryExecutionResult result)
    {
        if (!result.Success || result.Plan is null) return "Query ساختاریافته قابل اجرا نبود.";
        if (result.Results.Count == 0)
            return $"هیچ نمادی با شرایط «{result.Plan.Explanation}» پیدا نشد. {result.Scanned:N0} نماد بررسی شد و {result.QualityRejected:N0} نماد به‌دلیل Quality Gate کنار گذاشته شد.";
        var lines = result.Results.Select((x,i) =>
        {
            var key = result.Plan.SortBy?.ToString();
            decimal? value = key is not null && x.Metrics.TryGetValue(key, out var v) ? v : null;
            return value is null ? $"{i+1}. {x.Symbol} — {x.SymbolName}" : $"{i+1}. {x.Symbol} — {x.SymbolName}: {key}={value:0.####}";
        });
        return $"نتیجه Query ساختاریافته: {result.Plan.Explanation}\n" + string.Join("\n", lines) + $"\n\nتعداد تطابق: {result.Matched:N0} از {result.Scanned:N0}؛ ردشده توسط Quality Gate: {result.QualityRejected:N0}.";
    }

    private static string Trim(string value,int max)=>value.Length<=max?value:value[..max]+"…";

    private static async Task<T> Timed<T>(string tool,Func<Task<T>> action,List<ChatToolTrace> trace,Func<T,string?>? detail=null)
    {
        var sw=Stopwatch.StartNew();
        try { var r=await action(); trace.Add(new(tool,"ok",(int)sw.ElapsedMilliseconds,detail?.Invoke(r))); return r; }
        catch(Exception ex) { trace.Add(new(tool,"failed",(int)sw.ElapsedMilliseconds,ex.GetType().Name)); throw; }
    }
}
