using TSEAI.Application.Chat;
using TSEAI.Application.Chat.Context;
using TSEAI.Application.Chat.Routing;
using TSEAI.Application.Entities;
using TSEAI.Application.Temporal;

static void Assert(bool ok,string message){if(!ok)throw new Exception(message);}
var store=new MemoryStore();
store.State=new ConversationContextState("c1",Ref("خودرو","ایران خودرو","1"),null,ChatIntent.MarketSymbol,ChatCapabilityRoute.MarketSymbol,null,"وضعیت خودرو",1,DateTimeOffset.UtcNow);
var svc=new ConversationContextService(store,new FakeResolver());
var temporal=NoTemporal();

var market=await svc.PrepareAsync("u1","c1","حقیقی حقوقیش؟",temporal,CancellationToken.None);
Assert(market.RouteHint.PreferredIntent==ChatIntent.MarketSymbol && market.EffectiveQuestion.Contains("خودرو"),"market follow-up must inherit primary entity");

var news=await svc.PrepareAsync("u1","c1","آخرین خبرش؟",temporal,CancellationToken.None);
Assert(news.RouteHint.PreferredIntent==ChatIntent.Knowledge && news.EffectiveQuestion.Contains("خودرو"),"knowledge follow-up must inherit entity");

var hybrid=await svc.PrepareAsync("u1","c1","چرا افت کرده؟",temporal,CancellationToken.None);
Assert(hybrid.RouteHint.PreferredIntent==ChatIntent.Hybrid,"why follow-up must route hybrid");

var compare=await svc.PrepareAsync("u1","c1","حالا با خساپا مقایسه کن",temporal,CancellationToken.None);
Assert(compare.IsComparison && compare.PrimaryEntity?.Symbol=="خودرو" && compare.SecondaryEntity?.Symbol=="خساپا","comparison context failed");

var correction=await svc.PrepareAsync("u1","c1","نه منظورم خساپا بود",temporal,CancellationToken.None);
Assert(correction.IsCorrection && correction.PrimaryEntity?.Symbol=="خساپا","correction must replace primary entity");

var router=new ContextRouterPlanner();
var d=await router.Router.RouteWithContextAsync(compare.EffectiveQuestion,100,compare.RouteHint,CancellationToken.None);
Assert(d.Route==ChatCapabilityRoute.MarketComparison && d.Intent==ChatIntent.MarketComparison && !d.PlannerUsed,"comparison route must be deterministic");
Console.WriteLine("TSEAI Conversation Context smoke PASS");

static ConversationEntityReference Ref(string symbol,string name,string id)=>new(id,name,symbol,id,null,null,EntityKind.Instrument);
static TemporalResolution NoTemporal(){var d=new DateOnly(2026,8,11);var p=new CanonicalDatePoint(d,"2026-08-11","1405/05/20",DayOfWeek.Tuesday,false,MarketDayKind.TradingDayCandidate,false);return new(TemporalResolutionStatus.NotFound,TemporalIntentKind.None,"","",null,"Asia/Tehran",p,null,null,null,0,null,null);}

sealed class MemoryStore:IConversationContextStore
{
    public ConversationContextState State=ConversationContextState.Empty("c1");
    public Task<ConversationContextState> GetAsync(string s,string c,CancellationToken ct)=>Task.FromResult(State);
    public Task SaveAsync(string s,ConversationContextState state,CancellationToken ct){State=state;return Task.CompletedTask;}
    public Task ClearAsync(string s,string c,CancellationToken ct){State=ConversationContextState.Empty(c);return Task.CompletedTask;}
}
sealed class FakeResolver:IPersianEntityResolver
{
    public Task<EntityResolution> ResolveAsync(string text,EntityResolveOptions? o,CancellationToken ct)
    {
        var sym=text.Contains("خساپا")?"خساپا":"خودرو";var name=sym=="خساپا"?"سایپا":"ایران خودرو";
        var x=new EntityCandidateMatch(EntityKind.Instrument,sym,name,sym,sym,null,null,.99,EntityMatchKind.ExactSymbol,sym,new Dictionary<string,string?>());
        return Task.FromResult(new EntityResolution(EntityResolutionStatus.Resolved,text,text,x,[x],null));
    }
}
sealed class ContextRouterPlanner
{
    public DeterministicCapabilityRouter Router {get;}=new(new TSEAI.Application.Filters.ChatAssets.DeterministicChatFilterAssetCommandDetector(),new TSEAI.Application.Filters.Chat.DeterministicChatFilterIntentDetector(),new TSEAI.Application.StructuredQuery.PersianNaturalLanguageStructuredQueryInterpreter(),new FakePlanner());
}
sealed class FakePlanner:IAiChatPlanner{public Task<ChatPlan> PlanAsync(string q,CancellationToken ct)=>Task.FromResult(new ChatPlan(ChatIntent.Clarification,null,null,.1,"clarify",["fake"]));}
