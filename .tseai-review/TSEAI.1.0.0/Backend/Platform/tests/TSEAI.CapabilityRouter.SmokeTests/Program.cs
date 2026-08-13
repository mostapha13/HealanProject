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
Assert(m.Route==ChatCapabilityRoute.MarketSymbol && m.PlannerUsed,"market fallback route failed");
var k=await router.RouteAsync("قانون اختیار معامله چیست؟",100,CancellationToken.None);
Assert(k.Route==ChatCapabilityRoute.Knowledge && k.PlannerUsed,"knowledge fallback route failed");
var h=await router.RouteAsync("قیمت فولاد و آخرین خبرش رو بگو",100,CancellationToken.None);
Assert(h.Route==ChatCapabilityRoute.Hybrid && h.PlannerUsed,"hybrid fallback route failed");
Assert(h.Capabilities.Any(x=>x.Name=="structured.market.symbol") && h.Capabilities.Any(x=>x.Name=="knowledge.retrieve"),"hybrid capabilities incomplete");
Assert(h.AuditSummary.Contains("route=Hybrid") && h.AuditSummary.Contains("planner=True"),"audit summary missing");
Console.WriteLine("TSEAI Capability Router smoke PASS");

sealed class FakePlanner:IAiChatPlanner
{
    public Task<ChatPlan> PlanAsync(string q,CancellationToken ct)
    {
        if(q.Contains("قیمت فولاد و")) return Task.FromResult(new ChatPlan(ChatIntent.Hybrid,"فولاد",q,.91,null,["fake-hybrid"]));
        if(q.Contains("قیمت فولاد")) return Task.FromResult(new ChatPlan(ChatIntent.MarketSymbol,"فولاد",null,.9,null,["fake-market"]));
        if(q.Contains("قانون")) return Task.FromResult(new ChatPlan(ChatIntent.Knowledge,null,q,.9,null,["fake-knowledge"]));
        return Task.FromResult(new ChatPlan(ChatIntent.Clarification,null,null,.4,"clarify",["fake-clarify"]));
    }
}
