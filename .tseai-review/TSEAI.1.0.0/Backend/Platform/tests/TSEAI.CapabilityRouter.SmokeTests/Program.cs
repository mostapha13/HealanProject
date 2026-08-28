using TSEAI.Application.Chat;
using TSEAI.Application.Chat.Routing;
using TSEAI.Application.Filters.Chat;
using TSEAI.Application.Filters.ChatAssets;
using TSEAI.Application.StructuredQuery;

static void Assert(bool ok,string message){if(!ok)throw new Exception(message);}
var router=new DeterministicCapabilityRouter(
    new DeterministicChatFilterAssetCommandDetector(),
    new DeterministicChatFilterIntentDetector(),
    new PersianNaturalLanguageStructuredQueryInterpreter(),
    new FakePlanner());

var a=await router.RouteAsync("همین رو با اسم کم P/E ذخیره کن",100,CancellationToken.None);
Assert(a.Route==ChatCapabilityRoute.FilterAssets && !a.PlannerUsed,"asset route must be deterministic");
var f=await router.RouteAsync("فیلتر کن (pl)>(pc)",100,CancellationToken.None);
Assert(f.Route==ChatCapabilityRoute.FilterConversation && !f.PlannerUsed,"filter route failed");
var q=await router.RouteAsync("10 نماد با بیشترین حجم معاملات را بده",100,CancellationToken.None);
Assert(q.Route==ChatCapabilityRoute.StructuredQuery && !q.PlannerUsed && q.StructuredQuery?.Plan is not null,"structured route failed");
var naturalRank=await router.RouteAsync("کدام نمادها بیشترین حجم معامله را دارند؟",100,CancellationToken.None);
Assert(naturalRank.Route==ChatCapabilityRoute.StructuredQuery&&naturalRank.StructuredQuery?.Plan?.SortBy==StructuredQueryMetric.TradeVolume,
    "natural market ranking wording must route to the typed market query");
var singularRank=await router.RouteAsync("بیشترین حجم معامله را چه نمادی داشته؟",100,CancellationToken.None);
Assert(singularRank.Route==ChatCapabilityRoute.StructuredQuery&&singularRank.StructuredQuery?.Plan?.SortBy==StructuredQueryMetric.TradeVolume,
    "singular superlative market wording must route to the typed ranking query");
Assert(singularRank.StructuredQuery?.Plan?.Take==1,"singular superlative market wording must request one result");
var m=await router.RouteAsync("قیمت فولاد چنده؟",100,CancellationToken.None);
Assert(m.Route==ChatCapabilityRoute.MarketSymbol && !m.PlannerUsed && m.Plan?.RequestedFields?.Contains("last_price")==true,"market ontology route failed");
var colloquial=await router.RouteAsync("فملی چند درصد بالا رفته؟",100,CancellationToken.None);
Assert(colloquial.Route==ChatCapabilityRoute.MarketSymbol && colloquial.Plan?.RequestedFields?.Contains("last_price_change_percent")==true,"single-symbol growth must not become a market-wide ranking");
var classification=await router.RouteAsync("فملی در چه صنعت و زیرصنعتی قرار دارد؟",100,CancellationToken.None);
Assert(classification.Route==ChatCapabilityRoute.MarketSymbol && classification.Plan?.RequestedFields?.Contains("industry")==true,"market classification must not route to document search");
var bestBid=await router.RouteAsync("حجم سرخط خرید فملی چقدره؟",100,CancellationToken.None);
Assert(bestBid.Route==ChatCapabilityRoute.MarketSymbol && bestBid.Plan?.RequestedFields?.Contains("best_bid_volume")==true,"order-book best bid must route deterministically");
var fullBook=await router.RouteAsync("اردربوک کامل فملی را بده",100,CancellationToken.None);
Assert(fullBook.Route==ChatCapabilityRoute.MarketSymbol && fullBook.Plan?.RequestedFields?.Contains("orderbook")==true,"full order book must route deterministically");
var bookRank=await router.RouteAsync("پنج نماد با بیشترین حجم بهترین سفارش خرید را بده",100,CancellationToken.None);
Assert(bookRank.Route==ChatCapabilityRoute.StructuredQuery && bookRank.StructuredQuery?.Plan?.SortBy==StructuredQueryMetric.BestBidVolume,"order-book ranking route failed");
var k=await router.RouteAsync("قانون اختیار معامله چیست؟",100,CancellationToken.None);
Assert(k.Route==ChatCapabilityRoute.Knowledge && !k.PlannerUsed,"knowledge route must not depend on the LLM planner");
var bond=await router.RouteAsync("بازارگردان صدار704 کدام صندوق است؟",100,CancellationToken.None);
Assert(bond.Route==ChatCapabilityRoute.Knowledge && !bond.PlannerUsed,"document-backed bond facts must route directly to retrieval");
var persianDigitBond=await router.RouteAsync("دوره عمر و فاصله پرداخت سود صدار۷۰۴ چقدر است؟",100,CancellationToken.None);
Assert(persianDigitBond.Route==ChatCapabilityRoute.Knowledge && !persianDigitBond.PlannerUsed,
    "Persian digits in a document-backed entity must not bypass deterministic knowledge routing");
var reportValue=await router.RouteAsync("ارزش بازار سایپا در گزارش مراسم چند همت اعلام شده بود؟",100,CancellationToken.None);
Assert(reportValue.Route==ChatCapabilityRoute.Knowledge && !reportValue.PlannerUsed,"historical report metrics must not route to current market tools");
var h=await router.RouteAsync("قیمت فولاد و آخرین خبرش رو بگو",100,CancellationToken.None);
Assert(h.Route==ChatCapabilityRoute.Hybrid && !h.PlannerUsed && h.Plan?.Symbol=="فولاد",
    $"targeted hybrid route failed: route={h.Route};planner={h.PlannerUsed};symbol={h.Plan?.Symbol}");
Assert(h.Capabilities.Any(x=>x.Name=="structured.market.symbol") && h.Capabilities.Any(x=>x.Name=="knowledge.retrieve"),"hybrid capabilities incomplete");
Assert(h.AuditSummary.Contains("route=Hybrid") && h.AuditSummary.Contains("planner=False"),"audit summary missing");
var targetedNews=await router.RouteAsync("آخرین خبر فملی چیست؟",100,CancellationToken.None);
Assert(targetedNews.Route==ChatCapabilityRoute.Knowledge&&!targetedNews.PlannerUsed
       &&targetedNews.Plan?.Symbol=="فملی","symbol-specific latest news must use deterministic filtered retrieval");
var targetedComposite=await router.RouteAsync("آخرین خبر خودرو چیست و حجم معاملاتش چقدر است؟",100,CancellationToken.None);
Assert(targetedComposite.Route==ChatCapabilityRoute.Hybrid&&!targetedComposite.PlannerUsed
       &&targetedComposite.Plan?.Symbol=="خودرو"
       &&targetedComposite.Plan.RequestedFields?.Contains("trade_volume")==true,
    "targeted news plus market metric must execute a deterministic hybrid plan");
var naturalTargetedComposite=await router.RouteAsync("خبر جدیدی از خودرو داری؟ اگر هست خلاصه یک‌خطی و حجم آخرین معامله‌اش را هم بگو",100,CancellationToken.None);
Assert(naturalTargetedComposite.Route==ChatCapabilityRoute.Hybrid&&!naturalTargetedComposite.PlannerUsed
       &&naturalTargetedComposite.Plan?.Symbol=="خودرو"
       &&naturalTargetedComposite.Plan.RequestedFields?.Contains("trade_volume")==true,
    $"natural targeted-news wording must bind the symbol before the market facet: route={naturalTargetedComposite.Route};symbol={naturalTargetedComposite.Plan?.Symbol};fields={string.Join('|',naturalTargetedComposite.Plan?.RequestedFields??[])}");
var explicitComparison=await router.RouteAsync("بین فملی و فولاد کدام ارزش معاملات بیشتری دارد و اختلافشان چقدر است؟",100,CancellationToken.None);
Assert(explicitComparison.Route==ChatCapabilityRoute.MarketComparison&&!explicitComparison.PlannerUsed
       &&explicitComparison.Plan?.Symbol=="فملی"&&explicitComparison.Plan.SecondarySymbol=="فولاد"
       &&explicitComparison.Plan.RequestedFields?.Contains("trade_value")==true,
    "fresh-turn market comparison must bind both arbitrary symbols deterministically");
var nonMarketComparison=await router.RouteAsync("بین مدیرعامل و رئیس هیئت مدیره چه تفاوتی وجود دارد؟",100,CancellationToken.None);
Assert(nonMarketComparison.Route!=ChatCapabilityRoute.MarketComparison,
    "generic two-subject language must not be mistaken for a market-symbol comparison");
var globalExchangeNews=await router.RouteAsync("آخرین خبر بورس تهران چیست؟",100,CancellationToken.None);
Assert(globalExchangeNews.Route==ChatCapabilityRoute.Knowledge&&!globalExchangeNews.PlannerUsed
       &&globalExchangeNews.Plan?.Symbol is null,
    "global exchange news must remain an unfiltered deterministic knowledge query");
Assert(PersianMarketQuestionSemantics.IsScreeningQuestion("پنج نماد با بیشترین اثر مثبت روی شاخص را بده"),"index-effect ranking must be recognized as screening");
Assert(PersianMarketQuestionSemantics.DetectRequestedFields("پنج نماد با بیشترین اثر مثبت روی شاخص را بده").Contains("effect_on_index"),"index-effect ranking must bind the index metric");
Assert(PersianMarketQuestionSemantics.DetectRequestedFields("پنج سهم با بیشترین افت قیمت را نشان بده").Contains("last_price_change_percent"),"price-decline ranking must bind percentage change");
var correctedTradeValueQuestion=PersianFinancialQueryNormalizer.Normalize("15 نماد با بیشترین ارز معامالات چیا هستند؟");
Assert(correctedTradeValueQuestion.Contains("ارزش معاملات",StringComparison.Ordinal),
    "high-confidence financial typos must normalize before deterministic routing");
Assert(PersianFinancialQueryNormalizer.Normalize("حجم معاملاتش چی؟").Contains("معاملاتش",StringComparison.Ordinal),
    "typo normalization must preserve possessive market follow-ups");
var normalizedInstitution=PersianFinancialQueryNormalizer.Normalize("نهادهای مالی");
var normalizedInflections=PersianFinancialQueryNormalizer.Normalize("وضعیت معاملاتی با چه قیمتی باز شد؟");
Assert(normalizedInstitution.Contains("نهاد",StringComparison.Ordinal)&&!normalizedInstitution.Contains("نماد",StringComparison.Ordinal)
       &&normalizedInflections.Contains("معاملاتی با چه قیمتی",StringComparison.Ordinal),
    $"financial typo normalization must preserve valid entities and Persian inflections: {normalizedInstitution} | {normalizedInflections}");
Assert(PersianFinancialQueryNormalizer.Normalize("مدیر عامل نماد آبادا چه کسی است؟").Contains("مدیر عامل نماد آبادا",StringComparison.Ordinal),
    "typo normalization must never rewrite organization roles or entity nouns");
Assert(PersianFinancialQueryNormalizer.Normalize("کدام ارزش معاملات بیشتری دارد؟").Contains("بیشتری",StringComparison.Ordinal),
    "a valid comparative must never be rewritten into a superlative ranking cue");
var correctedTradeValueRoute=await router.RouteAsync(correctedTradeValueQuestion,100,CancellationToken.None);
Assert(correctedTradeValueRoute.Route==ChatCapabilityRoute.StructuredQuery
       &&correctedTradeValueRoute.StructuredQuery?.Plan?.SortBy==StructuredQueryMetric.TradeValue
       &&correctedTradeValueRoute.StructuredQuery.Plan.Take==15,
    "a leading requested ranking count must survive typo normalization and reach the structured plan");
Assert(PersianUserFacingAnswerPolicy.Sanitize("15 نماد برتر کدام‌اند؟","جدول Instrument دارای 75,238 رکورد است")
       =="برای این سؤال، پاسخ قابل اتکایی از داده‌های فعلی پیدا نشد.",
    "ordinary users must never receive internal table diagnostics");
Assert(PersianUserFacingAnswerPolicy.Sanitize("جدول Instrument چند رکورد دارد؟","جدول Instrument دارای 75,238 رکورد است")
       .Contains("Instrument",StringComparison.Ordinal),
    "explicit technical questions may receive technical metadata");
Assert(!PersianMarketQuestionSemantics.DetectRequestedFields("حجم مبنای فملی چند است؟").Contains("yesterday_price"),"base volume must not be interpreted as yesterday price");
var descriptiveComposite=await router.RouteAsync("درباره فملی چه میدانی و قیمت پایانی آن چقدر است؟",100,CancellationToken.None);
Assert(descriptiveComposite.Route==ChatCapabilityRoute.Hybrid&&!descriptiveComposite.PlannerUsed
       &&descriptiveComposite.Plan?.Symbol=="فملی"
       &&descriptiveComposite.Plan.RequestedFields?.Contains("closing_price")==true,
    "descriptive entity plus market metric must use a deterministic hybrid plan");
var ipoPlannerTrap=await router.RouteAsync("آخرین عرضه اولیه بورس چیه؟",100,CancellationToken.None);
Assert(ipoPlannerTrap.Route==ChatCapabilityRoute.Knowledge && ipoPlannerTrap.Plan?.Symbol is null
       && ipoPlannerTrap.ReasonCodes.Contains("deterministic-knowledge-evidence-route"),
    "generic IPO concept must not become an instrument entity");
var explicitExchangeTicker=await router.RouteAsync("آخرین قیمت نماد بورس چقدره؟",100,CancellationToken.None);
Assert(explicitExchangeTicker.Route==ChatCapabilityRoute.MarketSymbol,
    "an explicitly marked ticker must remain eligible for market resolution");
var uncertainFallback=await router.RouteAsync("واسه کرمان چند مرکز مالی داریم؟",100,CancellationToken.None);
Assert(uncertainFallback.Route==ChatCapabilityRoute.Clarification
       &&uncertainFallback.ReasonCodes.Contains("low-confidence-knowledge-fallback-rejected"),
    "an uncertain planner fallback must fail closed instead of searching unrelated documents");
var hallFrame=new SemanticQuestionFrame("واسه کرمان چند مرکز مالی داریم؟","تعداد مراکز مالی تالار کرمان چقدر است؟",
    SemanticQuestionDomain.FinancialInstitution,SemanticQuestionOperation.Count,
    [new("regional_hall","کرمان")],["count"],null,SemanticResponseShape.Short,.95,false,null,["test"]);
Assert(SemanticQuestionMaterializer.Materialize(hallFrame)=="تعداد نهادهای مالی تالار کرمان چقدر است؟",
    "semantic hall counts must materialize onto the typed financial-institution grammar");
var hallCompanyRoster=CanonicalCompanyQuestion.Parse("تالار شیراز کیا زیر مجموعشن؟");
Assert(hallCompanyRoster.IsMatch&&hallCompanyRoster.Aggregate==CompanyAggregateKind.HallCompanies
       &&hallCompanyRoster.Limit==20&&hallCompanyRoster.NamesOnly,
    "colloquial hall-company rosters must be owned by the typed Company relation");
var hallCompanyTypo=CanonicalCompanyQuestion.Parse("تالار شیراز کیت زیر مجموعشن");
Assert(hallCompanyTypo.IsMatch&&hallCompanyTypo.Aggregate==CompanyAggregateKind.HallCompanies,
    "the hall-company relation must survive a typo in the interrogative token");
foreach(var wording in new[]{"شرکتای تالار شیراز رو بگو","تالار شیراز چنتا شرکت داره؟","اسم شرکت‌های تالار شیراز چیست؟"})
{
    var parsed=CanonicalCompanyQuestion.Parse(wording);
    Assert(parsed.IsMatch&&parsed.Aggregate==CompanyAggregateKind.HallCompanies,
        $"colloquial company morphology must remain a typed hall roster: {wording}");
}
Assert(CanonicalQuestionOwnership.Detect("شرکت های زیر مجموعه تالار شیراز")==CanonicalQuestionDomain.Company,
    "explicit hall-company rosters must not route to organization hierarchy");
var financialHallRoster=CanonicalFinancialInstitutionQuestion.Parse("نهادهای مالی تالار شیراز کیا هستن؟");
Assert(financialHallRoster.IsMatch&&financialHallRoster.Aggregate==FinancialInstitutionAggregateKind.HallInstitutions
       &&financialHallRoster.NamesOnly,
    "a plural financial-institution hall request must not be mistaken for Company");
var brokerHallRoster=CanonicalFinancialInstitutionQuestion.Parse("کارگزاری های تالار شیراز رو بگو");
Assert(brokerHallRoster.IsMatch&&brokerHallRoster.Aggregate==FinancialInstitutionAggregateKind.HallInstitutions
       &&brokerHallRoster.TypeHint=="کارگزاری"&&brokerHallRoster.Lookups.Count==0,
    "plural type suffixes must not become a bogus institution lookup");
var marketFrame=new SemanticQuestionFrame("فملی چند دست به دست شده؟","حجم نماد فملی چقدر است؟",
    SemanticQuestionDomain.Market,SemanticQuestionOperation.Lookup,[new("symbol","فملی")],["trade_volume"],null,
    SemanticResponseShape.Short,.95,false,null,["test"]);
Assert(SemanticQuestionMaterializer.Materialize(marketFrame)=="حجم معاملات نماد فملی چقدر است؟",
    "semantic market metrics must materialize onto the typed market grammar");
var companyMarketFrame=new SemanticQuestionFrame("ارزش کل شرکت ملی صنایع مس ایران در بورس الان چنده؟","ارزش کل شرکت ملی صنایع مس ایران چقدر است؟",
    SemanticQuestionDomain.Market,SemanticQuestionOperation.Lookup,[new("company","شرکت ملی صنایع مس ایران")],["market_value"],"الان",
    SemanticResponseShape.Short,.95,false,null,["test"]);
Assert(SemanticQuestionMaterializer.Materialize(companyMarketFrame)=="ارزش بازار نماد شرکت ملی صنایع مس ایران چقدر است؟",
    "a company-name market entity must reach the canonical symbol resolver");
var roleFrame=new SemanticQuestionFrame("گرداننده فناوری بورس اسمش چیه؟","نام گرداننده فناوری بورس چیست؟",
    SemanticQuestionDomain.Organization,SemanticQuestionOperation.Lookup,[new("role","گرداننده فناوری بورس")],["person_name"],null,
    SemanticResponseShape.Short,.95,false,null,["test"]);
var roleQuestion=SemanticQuestionMaterializer.Materialize(roleFrame);
Assert(roleQuestion.Contains("فناوری")&&roleQuestion.Contains("مسئول")&&roleQuestion.Contains("چه کسی"),
    "semantic role lookups must materialize as an explicit person-role question without inventing a title");
Assert(CanonicalPersonRoleMatcher.IsPersonRoleQuestion(roleQuestion)
       &&CanonicalPersonRoleMatcher.Match(roleQuestion,[new CanonicalPersonRoleCandidate
           { ContentId=1,Role="مدیر فناوری و توسعه سیستم‌ها",FullName="فرد آزمون" }]) is not null,
    "materialized role wording must reach and resolve through the authoritative organization matcher");
Console.WriteLine("TSEAI Capability Router smoke PASS");

sealed class FakePlanner:IAiChatPlanner
{
    public Task<ChatPlan> PlanAsync(string q,CancellationToken ct)
    {
        if(q.Contains("قیمت فولاد و")) return Task.FromResult(new ChatPlan(ChatIntent.Hybrid,"فولاد",q,.91,null,["fake-hybrid"]));
        if(q.Contains("قیمت فولاد")) return Task.FromResult(new ChatPlan(ChatIntent.MarketSymbol,"فولاد",null,.9,null,["fake-market"]));
        if(q.Contains("عرضه اولیه")) return Task.FromResult(new ChatPlan(ChatIntent.MarketSymbol,"اولیه",null,.9,null,["fake-bad-entity"]));
        if(q.Contains("قانون")) return Task.FromResult(new ChatPlan(ChatIntent.Knowledge,null,q,.9,null,["fake-knowledge"]));
        if(q.Contains("مرکز مالی")) return Task.FromResult(new ChatPlan(ChatIntent.Knowledge,null,q,.58,null,["knowledge-safe-default"]));
        return Task.FromResult(new ChatPlan(ChatIntent.Clarification,null,null,.4,"clarify",["fake-clarify"]));
    }
}
