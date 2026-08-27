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
var globalExchangeNews=await router.RouteAsync("آخرین خبر بورس تهران چیست؟",100,CancellationToken.None);
Assert(globalExchangeNews.Route==ChatCapabilityRoute.Knowledge&&!globalExchangeNews.PlannerUsed
       &&globalExchangeNews.Plan?.Symbol is null,
    "global exchange news must remain an unfiltered deterministic knowledge query");
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
Console.WriteLine("TSEAI Capability Router smoke PASS");

sealed class FakePlanner:IAiChatPlanner
{
    public Task<ChatPlan> PlanAsync(string q,CancellationToken ct)
    {
        if(q.Contains("قیمت فولاد و")) return Task.FromResult(new ChatPlan(ChatIntent.Hybrid,"فولاد",q,.91,null,["fake-hybrid"]));
        if(q.Contains("قیمت فولاد")) return Task.FromResult(new ChatPlan(ChatIntent.MarketSymbol,"فولاد",null,.9,null,["fake-market"]));
        if(q.Contains("عرضه اولیه")) return Task.FromResult(new ChatPlan(ChatIntent.MarketSymbol,"اولیه",null,.9,null,["fake-bad-entity"]));
        if(q.Contains("قانون")) return Task.FromResult(new ChatPlan(ChatIntent.Knowledge,null,q,.9,null,["fake-knowledge"]));
        return Task.FromResult(new ChatPlan(ChatIntent.Clarification,null,null,.4,"clarify",["fake-clarify"]));
    }
}
