using System.Diagnostics;
using System.Globalization;
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
        var canonicalAnswer=await Timed("structured.reference",()=>canonicalReferenceAnswers.TryAnswerAsync(effectiveQuestion,temporalContext,ct),trace);
        if(!string.IsNullOrWhiteSpace(canonicalAnswer))
            return new("structured_reference",canonicalAnswer,request.ConversationId,ChatIntent.Knowledge,1,null,null,[],[],trace,null,temporalContext);

        toolPolicy.Demand("capability.route");
        var routeDecision=await Timed("capability.route",()=>capabilityRouter.RouteWithContextAsync(effectiveQuestion,request.PageSize,turnContext.RouteHint,ct),trace, d=>d.AuditSummary);

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
            if (RequiresHistoricalOrFutureMarketData(temporalContext,temporalTurn.Comparison))
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
            && RequiresHistoricalOrFutureMarketData(temporalContext,temporalTurn.Comparison))
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
            entityContext=await Timed("entity.resolve",()=>entities.ResolveAsync(
                plan.Symbol,
                new EntityResolveOptions([EntityKind.Instrument,EntityKind.MarketIndex]),ct),trace);

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

        if(plan.Intent==ChatIntent.Hybrid)
        {
            toolPolicy.Demand("structured.market.symbol");
            toolPolicy.Demand("knowledge.retrieve");
            var q=string.IsNullOrWhiteSpace(plan.KnowledgeQuery)?effectiveQuestion:plan.KnowledgeQuery!;
            var marketSw=Stopwatch.StartNew();
            var knowledgeSw=Stopwatch.StartNew();
            var marketTask=structuredTools.ExecuteAsync(new StructuredToolCall(StructuredToolNames.GetSymbolSnapshot, plan.Symbol),ct);
            var knowledgeTask=knowledge.RetrieveAsync(q,8,BuildKnowledgeContext(effectiveQuestion,resolvedSymbol,temporalContext),ct);
            await Task.WhenAll(marketTask,knowledgeTask);
            marketSw.Stop(); knowledgeSw.Stop();
            var sr=await marketTask; retrieved=await knowledgeTask;
            trace.Add(new ChatToolTrace("structured.market.symbol",sr.Success?"ok":"failed",(int)marketSw.ElapsedMilliseconds,sr.Error));
            trace.Add(new ChatToolTrace("knowledge.retrieve","ok",(int)knowledgeSw.ElapsedMilliseconds,$"hits={retrieved.Hits.Count}"));
            if(!sr.Success)
            {
                if(sr.Error=="market_data_quality_rejected")
                    return new("data_quality_unavailable","داده جاری بازار در Quality Gate معتبر شناخته نشد؛ اجرای Hybrid متوقف شد.",request.ConversationId,plan.Intent,plan.Confidence,sr.Data as MarketSymbolSnapshot,null,[],[],trace,null,temporalContext,sr.Entity??entityContext,sr.Quality);
                return new("market_unavailable",$"داده Structured برای «{entityContext?.Selected?.DisplayName ?? plan.Symbol}» در دسترس نیست ({sr.Error}).",request.ConversationId,plan.Intent,plan.Confidence,null,null,[],[],trace,null,temporalContext,sr.Entity??entityContext,sr.Quality);
            }
            snapshot=sr.Data as MarketSymbolSnapshot; qualityReport=sr.Quality; entityContext=sr.Entity??entityContext;
            if(snapshot is not null)
            {
                toolPolicy.Demand("analytics.symbol");
                analytics=await Timed("analytics.symbol",()=>Task.FromResult(analyticsEngine.AnalyzeSymbol(snapshot)),trace);
            }
        }

        if(plan.Intent==ChatIntent.MarketSymbol)
        {
            toolPolicy.Demand("structured.market.symbol");
            var structuredResult=await Timed("structured.market.symbol",()=>structuredTools.ExecuteAsync(
                new StructuredToolCall(StructuredToolNames.GetSymbolSnapshot, plan.Symbol),ct),trace);
            if(!structuredResult.Success)
            {
                if(structuredResult.Error=="market_data_quality_rejected")
                {
                    snapshot=structuredResult.Data as MarketSymbolSnapshot;
                    qualityReport=structuredResult.Quality;
                    var reason=qualityReport?.Status==DataQualityStatus.Stale
                        ? "داده جاری بازار از آستانه Freshness عبور کرده است"
                        : "داده جاری بازار در Quality Gate معتبر شناخته نشد";
                    var message=$"{reason}؛ برای جلوگیری از ارائه عدد غیرقابل اتکا، TSEAI پاسخ بازار را متوقف کرد.";
                    return new("data_quality_unavailable",message,request.ConversationId,plan.Intent,plan.Confidence,snapshot,null,[],[],trace,null,temporalContext,structuredResult.Entity??entityContext,qualityReport);
                }
                var unavailable=$"داده Structured برای «{entityContext?.Selected?.DisplayName ?? plan.Symbol}» در دسترس نیست ({structuredResult.Error}).";
                return new("market_unavailable",unavailable,request.ConversationId,plan.Intent,plan.Confidence,null,null,[],[],trace,null,temporalContext,structuredResult.Entity??entityContext,structuredResult.Quality);
            }
            snapshot=structuredResult.Data as MarketSymbolSnapshot;
            qualityReport=structuredResult.Quality;
            entityContext=structuredResult.Entity??entityContext;
            if(snapshot is not null)
            {
                toolPolicy.Demand("analytics.symbol");
                analytics=await Timed("analytics.symbol",()=>Task.FromResult(analyticsEngine.AnalyzeSymbol(snapshot)),trace);
            }
        }

        if(plan.Intent==ChatIntent.Knowledge)
        {
            var q=string.IsNullOrWhiteSpace(plan.KnowledgeQuery)?effectiveQuestion:plan.KnowledgeQuery!;
            toolPolicy.Demand("knowledge.retrieve");
            retrieved=await Timed("knowledge.retrieve",()=>knowledge.RetrieveAsync(q,8,BuildKnowledgeContext(effectiveQuestion,resolvedSymbol,temporalContext),ct),trace);
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
        var answer=answerComposer.Compose(new AnswerComposeContext(request.Question,plan.Intent,PersianFinancialAnswerComposer.DetectVerbosity(request.Question)),snapshot,analytics,hits);
        if(qualityReport?.Status==DataQualityStatus.Warning)
            answer="⚠️ برخی شاخص‌های کیفیت داده نیازمند توجه هستند؛ اعداد زیر از Snapshot معتبر ولی دارای Warning استخراج شده‌اند.\n\n"+answer;

        // Bounded reflection: at most one review and at most one additional retrieval.
        // Reflection cannot call arbitrary tools and cannot mutate filter/market execution.
        if (ShouldReflect(plan, hits, trace))
        {
            toolPolicy.Demand("reflection.review");
            var failed=trace.Where(x=>x.Status=="failed").Select(x=>x.Tool).Distinct().ToArray();
            var review=await Timed("reflection.review",()=>reflector.ReviewAsync(
                new ChatReflectionRequest(request.Question,answer,plan.Intent,plan.Confidence,hits.Count,failed),ct),trace);

            if (review.Action=="clarify")
                return new("clarification",review.Clarification??"برای پاسخ دقیق‌تر، سؤال را کمی مشخص‌تر بیان کنید.",request.ConversationId,ChatIntent.Clarification,plan.Confidence,snapshot,filterResult,hits,hits.Select(x=>x.Citation).Distinct().Take(8).ToArray(),trace,review.Clarification,temporalContext,entityContext);

            if (review.Action=="retrieve_more" && plan.Intent is ChatIntent.Knowledge or ChatIntent.Hybrid)
            {
                var rq=string.IsNullOrWhiteSpace(review.ImprovedQuery)?(plan.KnowledgeQuery??effectiveQuestion):review.ImprovedQuery!;
                toolPolicy.Demand("knowledge.retrieve");
                retrieved=await Timed("knowledge.retrieve",()=>knowledge.RetrieveAsync(rq,12,BuildKnowledgeContext(effectiveQuestion,resolvedSymbol,temporalContext),ct),trace);
                hits=retrieved.Hits;
                answer=answerComposer.Compose(new AnswerComposeContext(request.Question,plan.Intent,PersianFinancialAnswerComposer.DetectVerbosity(request.Question)),snapshot,analytics,hits);
                if(qualityReport?.Status==DataQualityStatus.Warning)
                    answer="⚠️ برخی شاخص‌های کیفیت داده نیازمند توجه هستند؛ اعداد زیر از Snapshot معتبر ولی دارای Warning استخراج شده‌اند.\n\n"+answer;
            }
        }

        var citations=hits.Select(x=>x.Citation).Distinct().Take(8).ToArray();
        var evidence=evidenceEngine.Build(plan.Intent,snapshot,qualityReport,analytics,hits,null,null,filterResult,entityContext);
        var evidenceValidation=evidenceEngine.Validate(plan.Intent,evidence,snapshot is not null,hits.Count>0,false,false,answer);
        var answerValidation=answerValidationGuard.Validate(answer,plan.Intent,evidence,evidenceValidation);
        trace.Add(new ChatToolTrace("answer.validate",answerValidation.IsValid?"ok":"failed",0,$"status={answerValidation.Status};issues={string.Join('|',answerValidation.Issues)}"));
        if(!answerValidation.IsValid)
            return new("answer_validation_blocked","پاسخ بالقوه توسط Answer Validation / Hallucination Guard مسدود شد؛ Evidence برای ادعاهای پاسخ کافی نبود.",request.ConversationId,plan.Intent,0,snapshot,filterResult,hits,citations,trace,string.Join(",",answerValidation.Issues),temporalContext,entityContext,qualityReport,analytics,Evidence:evidence,EvidenceValidation:evidenceValidation,AnswerValidation:answerValidation);
        var savedContext=await conversationContext.RecordAsync(subject,request.ConversationId,request.Question,plan.Intent,routeDecision.Route,temporalContext,entityContext,null,ct);
        return new(plan.Intent.ToString().ToLowerInvariant(),answer,request.ConversationId,plan.Intent,plan.Confidence,snapshot,filterResult,hits,citations,trace,null,temporalContext,entityContext,qualityReport,analytics,null,null,savedContext,Evidence:evidence,EvidenceValidation:evidenceValidation,AnswerValidation:answerValidation);
    }


    private static KnowledgeRetrievalContext BuildKnowledgeContext(string question,string? symbol,TemporalResolution temporal)
    {
        var latest=question.Contains("آخرین",StringComparison.Ordinal)||question.Contains("جدیدترین",StringComparison.Ordinal)||question.Contains("تازه",StringComparison.Ordinal);
        int? contentType=(question.Contains("خبر",StringComparison.Ordinal)||question.Contains("اخبار",StringComparison.Ordinal)||question.Contains("اطلاعیه",StringComparison.Ordinal))?1:null;
        string? from=null,to=null;
        if(temporal.HasTemporalReference)
        {
            from=temporal.Start?.GregorianIso; to=(temporal.End??temporal.Start)?.GregorianIso;
        }
        var personQuestion=CanonicalPersonRoleMatcher.IsPersonRoleQuestion(question);
        return new(symbol,from,to,latest?true:null,contentType,null,1,personQuestion?"organization_person":null);
    }

    private static bool RequiresHistoricalOrFutureMarketData(TemporalResolution temporal,TemporalResolution? comparison=null)
    {
        if(comparison is not null && RequiresHistoricalOrFutureMarketData(comparison,null)) return true;
        if (!temporal.HasTemporalReference) return false;
        if (temporal.Kind is TemporalIntentKind.DateRange or TemporalIntentKind.RelativeRange) return !temporal.IsReferenceDayOnly;
        return temporal.Start!.GregorianDate != temporal.ReferenceDate.GregorianDate;
    }

    private static string BuildTemporalMarketGuard(TemporalResolution temporal)
    {
        if (temporal.Start is null) return "تاریخ درخواست‌شده قابل استفاده برای داده بازار نیست.";
        if (temporal.IsFuture)
        {
            if (temporal.Start.MarketDayKind == MarketDayKind.FutureWeekendClosed)
                return $"تاریخ درخواست‌شده {temporal.Start.JalaliDate} ({temporal.Start.GregorianIso}) در آینده و در تعطیلی هفتگی بازار قرار دارد. TSEAI داده آینده را به‌عنوان واقعیت تولید نمی‌کند.";
            return $"تاریخ درخواست‌شده {temporal.Start.JalaliDate} ({temporal.Start.GregorianIso}) در آینده است. TSEAI داده بازار آینده را به‌عنوان واقعیت تولید نمی‌کند.";
        }

        if (temporal.Kind is TemporalIntentKind.DateRange or TemporalIntentKind.RelativeRange)
            return $"بازه تاریخی {temporal.Start.JalaliDate} تا {temporal.End?.JalaliDate} شناسایی شد، اما MarketDailyHistory هنوز به فاز جاری متصل نیست؛ برای جلوگیری از پاسخ نادرست از Snapshot امروز استفاده نمی‌کنم.";

        if (temporal.Start.MarketDayKind == MarketDayKind.WeekendClosed)
            return $"تاریخ {temporal.Start.JalaliDate} ({temporal.Start.GregorianIso}) در تعطیلی هفتگی بازار قرار دارد و داده معاملاتی روزانه برای آن نباید از Snapshot امروز جایگزین شود.";

        return $"تاریخ {temporal.Start.JalaliDate} ({temporal.Start.GregorianIso}) شناسایی شد، اما MarketDailyHistory هنوز به فاز جاری متصل نیست؛ برای جلوگیری از پاسخ نادرست از Snapshot امروز استفاده نمی‌کنم.";
    }

    private static bool ShouldReflect(ChatPlan plan,IReadOnlyList<KnowledgeHit> hits,IReadOnlyList<ChatToolTrace> trace)
        => plan.Intent==ChatIntent.Hybrid || plan.Confidence<0.70 || trace.Any(x=>x.Status=="failed") ||
           (plan.Intent==ChatIntent.Knowledge && hits.Count==0);

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
