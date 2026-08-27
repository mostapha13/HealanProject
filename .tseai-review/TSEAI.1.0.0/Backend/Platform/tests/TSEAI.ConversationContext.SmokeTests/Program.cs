using TSEAI.Application.Chat;
using TSEAI.Application.Chat.Context;
using TSEAI.Application.Chat.Routing;
using TSEAI.Application.Entities;
using TSEAI.Application.Temporal;

static void Assert(bool ok,string message){if(!ok)throw new Exception(message);}
var store=new MemoryStore();
store.State=new ConversationContextState("c1",Ref("خودرو","ایران خودرو","1"),null,ChatIntent.MarketSymbol,ChatCapabilityRoute.MarketSymbol,null,"وضعیت خودرو",1,DateTimeOffset.UtcNow);
var svc=new ConversationContextService(store,new FakeResolver(),new FakeRewriter());
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

var chairman=CanonicalReferenceAnswer.Exact("بهروز خالق‌ویردی، رئیس هیئت‌مدیره بورس تهران است.","organization_person","رئیس هیئت‌مدیره بورس تهران",
    [new("person_name","بهروز خالق‌ویردی","TsePerson:91531")],"بهروز خالق‌ویردی","رئیس هیئت‌مدیره");
await svc.RecordReferenceAsync("u1","c1","رئیس هیئت مدیره کیه؟","رئیس هیئت مدیره بورس تهران کیه؟",chairman.Answer,chairman,temporal,CancellationToken.None);
Assert(store.State.PrimaryEntity is null && store.State.SecondaryEntity is null,"an organization answer must clear stale market entities");
var representation=await svc.PrepareAsync("u1","c1","نماینده کدوم شرکت هست؟",temporal,CancellationToken.None);
Assert(representation.RouteHint.ContextApplied && representation.EffectiveQuestion.Contains("بهروز خالق‌ویردی"),"organization follow-up must inherit active person");
var hierarchy=await svc.PrepareAsync("u1","c1","زیر مجموعه او کیا هستند؟",temporal,CancellationToken.None);
Assert(hierarchy.EffectiveQuestion.Contains("بهروز خالق‌ویردی") && hierarchy.PrimaryEntity is null && store.State.RecentTurns?.Count==1,"organization hierarchy follow-up must retain the person without inheriting a symbol");
var parent=await svc.PrepareAsync("u1","c1","زیر مجموعه چه معاونتیه؟",temporal,CancellationToken.None);
Assert(parent.EffectiveQuestion.Contains("بهروز خالق‌ویردی") && parent.PrimaryEntity is null,"upward organization follow-up must inherit only the active person");

var ipo=CanonicalReferenceAnswer.Exact("آخرین عرضه اولیه ثبت‌شده مربوط به فرآورده‌های دامی ولبنی دالاهو است.","company_aggregate","جدیدترین عرضه‌های اولیه Company",
    [new("company_title","فرآورده‌های دامی ولبنی دالاهو","Company:1")],"فرآورده‌های دامی ولبنی دالاهو",sourceTool:CanonicalReferenceToolNames.CompanyIpo);
await svc.RecordReferenceAsync("u1","c1","آخرین عرضه اولیه بورس چیه؟","آخرین عرضه اولیه بورس چیه؟",ipo.Answer,ipo,temporal,CancellationToken.None);
var ipoSymbol=await svc.PrepareAsync("u1","c1","نمادش چیه؟",temporal,CancellationToken.None);
Assert(ipoSymbol.RouteHint.ContextApplied
    &&ipoSymbol.EffectiveQuestion=="نماد شرکت فرآورده‌های دامی ولبنی دالاهو چیست؟",
    "a company IPO follow-up must inherit the exact company subject");

var resolvedMarket=await new FakeResolver().ResolveAsync("خساپا",new EntityResolveOptions([EntityKind.Instrument]),CancellationToken.None);
await svc.RecordAsync("u1","c1","قیمت نماد خساپا",ChatIntent.MarketSymbol,ChatCapabilityRoute.MarketSymbol,temporal,resolvedMarket,null,CancellationToken.None,"خساپا ۵۸۰ ریال است.");
Assert(store.State.ActiveReference is null && store.State.PrimaryEntity?.Symbol=="خساپا","a new market subject must clear stale organization references");

var staleMarketStore=new MemoryStore
{
    State=new ConversationContextState("c2",Ref("فملی","ملی صنایع مس ایران","2"),null,ChatIntent.MarketSymbol,ChatCapabilityRoute.MarketSymbol,null,"قیمت فملی",1,DateTimeOffset.UtcNow)
};
var isolated=new ConversationContextService(staleMarketStore,new FakeResolver(),new FakeRewriter());
var explicitOrganization=await isolated.PrepareAsync("u1","c2","ناصر جعفری زیرمجموعه کدوم معاونته؟",temporal,CancellationToken.None);
Assert(explicitOrganization.PrimaryEntity is null && !explicitOrganization.EffectiveQuestion.Contains("فملی"),"an explicit organization question must never inherit an unrelated old symbol");

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
sealed class FakeRewriter:IConversationQueryRewriter
{
    public Task<ConversationRewriteResult?> RewriteAsync(ConversationRewriteRequest request,CancellationToken ct)
    {
        var subject=request.ActiveReference?.SubjectName;
        ConversationRewriteResult? result=string.IsNullOrWhiteSpace(subject)?null:new($"{request.Question} درباره {subject}",true,"fake-context");
        return Task.FromResult(result);
    }
}
sealed class ContextRouterPlanner
{
    public DeterministicCapabilityRouter Router {get;}=new(new TSEAI.Application.Filters.ChatAssets.DeterministicChatFilterAssetCommandDetector(),new TSEAI.Application.Filters.Chat.DeterministicChatFilterIntentDetector(),new TSEAI.Application.StructuredQuery.PersianNaturalLanguageStructuredQueryInterpreter(),new FakePlanner());
}
sealed class FakePlanner:IAiChatPlanner{public Task<ChatPlan> PlanAsync(string q,CancellationToken ct)=>Task.FromResult(new ChatPlan(ChatIntent.Clarification,null,null,.1,"clarify",["fake"]));}
