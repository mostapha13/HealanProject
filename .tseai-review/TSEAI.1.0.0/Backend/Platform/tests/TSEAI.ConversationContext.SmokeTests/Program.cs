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

var board=CanonicalReferenceAnswer.Exact("بهروز خالق‌ویردی، عسگر نوربخش","organization_board","هیئت‌مدیره بورس تهران",
    [new("board_member:1:name","بهروز خالق‌ویردی","TsePerson:1"),new("board_member:2:name","عسگر نوربخش","TsePerson:2")],
    relatedSubjects:["بهروز خالق‌ویردی","عسگر نوربخش"]);
await svc.RecordReferenceAsync("u1","c1","اعضای هیئت مدیره بورس تهران کیا هستند؟","اعضای هیئت مدیره بورس تهران کیا هستند؟",board.Answer,board,temporal,CancellationToken.None);
var boardNames=await svc.PrepareAsync("u1","c1","فقط اسم اعضا را بگو",temporal,CancellationToken.None);
Assert(boardNames.RouteHint.ContextApplied && boardNames.RouteHint.PreferredIntent==ChatIntent.Knowledge
    && boardNames.EffectiveQuestion.Contains("هیئت‌مدیره بورس تهران")
    && CanonicalBoardMemberAnswer.Parse(boardNames.EffectiveQuestion).NamesOnly,
    "a roster formatting follow-up must inherit the active board topic and preserve names-only intent");
var boardRoles=await svc.PrepareAsync("u1","c1","نقش هرکدوم چیه؟",temporal,CancellationToken.None);
Assert(boardRoles.RouteHint.ContextApplied && boardRoles.EffectiveQuestion.Contains("اعضای هیئت‌مدیره بورس تهران"),
    "a plural role follow-up must inherit the active roster topic");
var boardHistory=await svc.PrepareAsync("u1","c1","پیشینه‌شون رو بگو",temporal,CancellationToken.None);
Assert(boardHistory.RouteHint.ContextApplied && CanonicalBoardMemberAnswer.Parse(boardHistory.EffectiveQuestion).WantsHistory,
    "a plural history follow-up must preserve both the active roster and requested facet");

var unit=CanonicalReferenceAnswer.Exact("اسماعیل رازقی — مدیر اداری","organization_unit","معاون اجرایی",
    [new("subordinate:1:name","اسماعیل رازقی","TsePerson:3")],"حمیدرضا اسمعیلی گیوی","معاون اجرایی",["اسماعیل رازقی"]);
await svc.RecordReferenceAsync("u1","c1","زیرمجموعه معاون اجرایی کیا هستند؟","زیرمجموعه معاون اجرایی کیا هستند؟",unit.Answer,unit,temporal,CancellationToken.None);
var unitNames=await svc.PrepareAsync("u1","c1","فقط نام مدیران را بگو",temporal,CancellationToken.None);
Assert(unitNames.RouteHint.ContextApplied && unitNames.EffectiveQuestion.Contains("مدیران زیرمجموعه معاون اجرایی")
    && CanonicalOrganizationHierarchyAnswer.IsSubordinateQuestion(unitNames.EffectiveQuestion),
    "a subordinate roster follow-up must inherit its organization unit without relying on a symbol");
var unitPossessiveNames=await svc.PrepareAsync("u1","c1","اسمشون چیه؟",temporal,CancellationToken.None);
Assert(unitPossessiveNames.RouteHint.ContextApplied && CanonicalOrganizationHierarchyAnswer.WantsNamesOnly(unitPossessiveNames.EffectiveQuestion),
    "possessive names-only wording must inherit the active organization roster");

var ipo=CanonicalReferenceAnswer.Exact("آخرین عرضه اولیه ثبت‌شده مربوط به فرآورده‌های دامی ولبنی دالاهو است.","company_aggregate","جدیدترین عرضه‌های اولیه Company",
    [new("company_title","فرآورده‌های دامی ولبنی دالاهو","Company:1")],"فرآورده‌های دامی ولبنی دالاهو",sourceTool:CanonicalReferenceToolNames.CompanyIpo);
await svc.RecordReferenceAsync("u1","c1","آخرین عرضه اولیه بورس چیه؟","آخرین عرضه اولیه بورس چیه؟",ipo.Answer,ipo,temporal,CancellationToken.None);
var ipoSymbol=await svc.PrepareAsync("u1","c1","نمادش چیه؟",temporal,CancellationToken.None);
Assert(ipoSymbol.RouteHint.ContextApplied
    &&ipoSymbol.EffectiveQuestion=="نماد شرکت فرآورده‌های دامی ولبنی دالاهو چیست؟",
    "a company IPO follow-up must inherit the exact company subject");
var ipoProvince=await svc.PrepareAsync("u1","c1","این شرکت متعلق به کدام استان است؟",temporal,CancellationToken.None);
Assert(ipoProvince.RouteHint.ContextApplied
    &&ipoProvince.EffectiveQuestion=="تالار منطقه‌ای شرکت فرآورده‌های دامی ولبنی دالاهو در کدام استان ثبت شده است؟",
    "a company IPO province follow-up must bind the active company before canonical lookup");

var hallCompanies=CanonicalReferenceAnswer.Exact("17 شرکت به تالار فارس (شیراز) منتسب‌اند.","company_hall","شرکت‌های تالار فارس (شیراز)",
    [new("company_count","17","Talar:1"),new("company:1:title","پالایش نفت شیراز","Company:1")],
    "فارس (شیراز)",relatedSubjects:["پالایش نفت شیراز"]);
await svc.RecordReferenceAsync("u1","c1","تالار شیراز کیا زیر مجموعشن؟","تالار شیراز کیا زیر مجموعشن؟",hallCompanies.Answer,hallCompanies,temporal,CancellationToken.None);
Assert(store.State.ActiveReference?.Kind=="company_hall"&&store.State.ActiveReference.SubjectName=="فارس (شیراز)"
       &&store.State.PrimaryEntity is null,
    "a hall-company answer must retain the hall as active context and clear an unrelated market symbol");
var hallNames=await svc.PrepareAsync("u1","c1","اسمشون چیه؟",temporal,CancellationToken.None);
Assert(hallNames.RouteHint.ContextApplied
       &&hallNames.EffectiveQuestion=="فهرست شرکت‌های منتسب به تالار فارس (شیراز) را فقط نام‌ها بگو.",
    "a names-only follow-up must bind the active regional hall");
var possessiveHallNames=await svc.PrepareAsync("u1","c1","اسم شرکتاش؟",temporal,CancellationToken.None);
Assert(possessiveHallNames.RouteHint.ContextApplied
       &&possessiveHallNames.EffectiveQuestion=="فهرست شرکت‌های منتسب به تالار فارس (شیراز) را فقط نام‌ها بگو.",
    "a possessive colloquial company-list follow-up must not fall into symbol resolution");
var hallCount=await svc.PrepareAsync("u1","c1","چند شرکت هستن؟",temporal,CancellationToken.None);
Assert(hallCount.RouteHint.ContextApplied
       &&hallCount.EffectiveQuestion=="تعداد شرکت‌های منتسب به تالار فارس (شیراز) چقدر است؟",
    "a count follow-up must bind the active regional hall");
var explicitHallRoster=await svc.PrepareAsync("u1","c1","شرکت های زیر مجموعه تالار شیراز",temporal,CancellationToken.None);
Assert(!explicitHallRoster.RouteHint.ContextApplied
       &&explicitHallRoster.EffectiveQuestion=="شرکت های زیر مجموعه تالار شیراز"
       &&!explicitHallRoster.EffectiveQuestion.Contains("بورس تهران"),
    "an explicit hall-company question must override the prior hall and never become organization hierarchy");
var explicitFinancialHall=await svc.PrepareAsync("u1","c1","نهادهای مالی تالار شیراز کیا هستن؟",temporal,CancellationToken.None);
Assert(!explicitFinancialHall.RouteHint.ContextApplied&&explicitFinancialHall.EffectiveQuestion=="نهادهای مالی تالار شیراز کیا هستن؟",
    "an explicit financial-institution question must override active Company hall context");
var anaphoricFinancialHall=await svc.PrepareAsync("u1","c1","کارگزاری‌هاش رو بگو",temporal,CancellationToken.None);
Assert(anaphoricFinancialHall.RouteHint.ContextApplied
       &&anaphoricFinancialHall.EffectiveQuestion=="فهرست کارگزاری‌های تالار فارس (شیراز) را فقط نام‌ها بگو."
       &&anaphoricFinancialHall.RouteHint.Reasons.Contains("financial-hall-cross-domain-followup"),
    "an anaphoric financial-institution request must reuse the active Company hall");

var financialHall=CanonicalReferenceAnswer.Exact("نام‌های کارگزاری ثبت‌شده در تالار فارس (شیراز)","financial_institution_hall","کارگزاری‌های تالار فارس (شیراز)",
    [new("institution_record_count","47","Talar:1"),new("institution_distinct_count","36","Talar:1")],
    "فارس (شیراز)","کارگزاری",["آگاه"]);
await svc.RecordReferenceAsync("u1","c1","کارگزاری‌های تالار شیراز کیا هستند؟","کارگزاری‌های تالار شیراز کیا هستند؟",financialHall.Answer,financialHall,temporal,CancellationToken.None);
var financialCount=await svc.PrepareAsync("u1","c1","چندتاشون هست؟",temporal,CancellationToken.None);
Assert(financialCount.RouteHint.ContextApplied&&financialCount.EffectiveQuestion.Contains("تعداد کارگزاری‌های تالار فارس (شیراز)"),
    "financial-hall count follow-ups must preserve both hall and institution type");
var financialAddresses=await svc.PrepareAsync("u1","c1","آدرسشون رو بگو",temporal,CancellationToken.None);
Assert(financialAddresses.RouteHint.ContextApplied&&financialAddresses.EffectiveQuestion.Contains("کارگزاری‌های تالار فارس (شیراز)")
       &&financialAddresses.EffectiveQuestion.Contains("همراه آدرس"),
    "financial-hall address follow-ups must preserve both hall and institution type");
var anaphoricCompanies=await svc.PrepareAsync("u1","c1","شرکتاش رو بگو",temporal,CancellationToken.None);
Assert(anaphoricCompanies.RouteHint.ContextApplied
       &&anaphoricCompanies.EffectiveQuestion=="فهرست شرکت‌های منتسب به تالار فارس (شیراز) را فقط نام‌ها بگو."
       &&anaphoricCompanies.RouteHint.Reasons.Contains("company-hall-cross-domain-followup"),
    "an anaphoric company request must reuse the active financial-institution hall");

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
var standaloneRewriter=new FakeRewriter();
var standaloneService=new ConversationContextService(staleMarketStore,new FakeResolver(),standaloneRewriter);
var standaloneCompound=await standaloneService.PrepareAsync("u1","c2","نام شرکت فملی چیست و آخرین خبرش را بگو",temporal,CancellationToken.None);
Assert(!standaloneCompound.RouteHint.ContextApplied&&standaloneRewriter.Calls==0,
    "an explicit standalone compound question must not wait for semantic conversation rewriting");

var hallStore=new MemoryStore();
var hallService=new ConversationContextService(hallStore,new FakeResolver(),new FakeRewriter());
var zanjanHall=CanonicalReferenceAnswer.Exact("تالار منطقه‌ای زنجان با کد 10 ثبت شده است.","hall","تالار منطقه‌ای زنجان",
    [new("hall_name","زنجان","Talar:1"),new("hall_code","10","Talar:1")],subjectName:"زنجان");
await hallService.RecordReferenceAsync("u1","hall-c","تالار زنجان","تالار زنجان",zanjanHall.Answer,zanjanHall,temporal,CancellationToken.None);
var hallAddress=await hallService.PrepareAsync("u1","hall-c","آدرسش",temporal,CancellationToken.None);
Assert(hallAddress.RouteHint.ContextApplied&&hallAddress.EffectiveQuestion=="آدرس فیزیکی تالار زنجان کجاست؟"
       &&hallAddress.RouteHint.Reasons.Contains("regional-hall-detail-followup"),
    "a short physical-address follow-up must retain the active regional hall");

var hallCatalog=CanonicalReferenceAnswer.Exact("در داده‌های فعلی آدرس فیزیکی هیچ‌یک از تالارها ثبت نشده است.",
    "hall_address_catalog","پوشش آدرس فیزیکی تالارهای منطقه‌ای",
    [new("physical_address_count","0","Talar")],subjectName:"تالارهای منطقه‌ای");
await hallService.RecordReferenceAsync("u1","hall-c","آدرس کدوم تالارها رو داری؟","آدرس کدوم تالارها رو داری؟",hallCatalog.Answer,hallCatalog,temporal,CancellationToken.None);
var physicalPlaces=await hallService.PrepareAsync("u1","hall-c","مکان های فیزیکی",temporal,CancellationToken.None);
Assert(physicalPlaces.RouteHint.ContextApplied&&physicalPlaces.EffectiveQuestion.Contains("آدرس فیزیکی کدام تالارهای منطقه‌ای",StringComparison.Ordinal),
    "a physical-place clarification must remain bound to hall-address coverage");
var complaintRepair=await hallService.PrepareAsync("u1","hall-c","چرا اینقد خنگی؟",temporal,CancellationToken.None);
Assert(complaintRepair.RouteHint.ContextApplied&&complaintRepair.EffectiveQuestion.Contains("آدرس فیزیکی کدام تالارهای منطقه‌ای",StringComparison.Ordinal),
    "a complaint after a hall-address answer must repair the last topic instead of entering entity resolution");

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
    public int Calls { get; private set; }
    public Task<ConversationRewriteResult?> RewriteAsync(ConversationRewriteRequest request,CancellationToken ct)
    {
        Calls++;
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
