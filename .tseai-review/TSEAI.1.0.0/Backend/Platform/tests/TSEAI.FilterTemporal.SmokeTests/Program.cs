using TSEAI.Application.Filters.Temporal;
using TSEAI.Application.Temporal;
static void Assert(bool v,string m){if(!v)throw new Exception(m);}
static CanonicalDatePoint P(DateOnly d, DateOnly r, MarketDayKind k)=>new(d,d.ToString("yyyy-MM-dd"),"1405/05/20",d.DayOfWeek,d>r,k,false);
var policy=new DeterministicFilterTemporalPolicy();
var reference=new DateOnly(2026,8,11);
var rp=P(reference,reference,MarketDayKind.TradingDayCandidate);
TemporalResolution T(DateOnly s,DateOnly e,TemporalIntentKind kind,MarketDayKind sk,MarketDayKind ek,string matched)=>new(TemporalResolutionStatus.Resolved,kind,matched,matched,matched,"Asia/Tehran",rp,P(s,reference,sk),P(e,reference,ek),null,1,"smoke",null);
var today=T(reference,reference,TemporalIntentKind.RelativeDate,MarketDayKind.TradingDayCandidate,MarketDayKind.TradingDayCandidate,"امروز");
Assert(policy.Evaluate(today).CanExecute,"today must execute current snapshot");
Assert(policy.RemoveTemporalExpression("امروز فیلتر کن (pl)>(pc)",today).Contains("(pl)>(pc)"),"temporal text stripped without DSL loss");
var yesterday=T(reference.AddDays(-1),reference.AddDays(-1),TemporalIntentKind.RelativeDate,MarketDayKind.TradingDayCandidate,MarketDayKind.TradingDayCandidate,"دیروز");
Assert(!policy.Evaluate(yesterday).CanExecute && policy.Evaluate(yesterday).Mode==FilterTemporalExecutionMode.HistoricalUnavailable,"history must fail closed");
var future=T(reference.AddDays(1),reference.AddDays(1),TemporalIntentKind.RelativeDate,MarketDayKind.FutureTradingDayCandidate,MarketDayKind.FutureTradingDayCandidate,"فردا");
Assert(!policy.Evaluate(future).CanExecute,"future must fail closed");
var range=T(reference.AddDays(-5),reference,TemporalIntentKind.DateRange,MarketDayKind.TradingDayCandidate,MarketDayKind.TradingDayCandidate,"از 15 تا 20 مرداد");
Assert(!policy.Evaluate(range).CanExecute,"historical range must fail closed");
Console.WriteLine("Sprint 22 filter-temporal smoke PASS");
