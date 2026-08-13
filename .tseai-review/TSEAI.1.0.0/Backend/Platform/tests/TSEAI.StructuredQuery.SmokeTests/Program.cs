using TSEAI.Application.Analytics;
using TSEAI.Application.Data.Canonical;
using TSEAI.Application.DataQuality;
using TSEAI.Application.Market;
using TSEAI.Application.StructuredQuery;
using TSEAI.Shared.Application.Market;

static void Assert(bool value,string message){if(!value)throw new Exception(message);}

var parser=new PersianNaturalLanguageStructuredQueryInterpreter();
var p1=parser.Interpret("10 نماد با بیشترین حجم معاملات را بده");
Assert(p1.Success && p1.Plan?.SortBy==StructuredQueryMetric.TradeVolume && p1.Plan.Take==10 && p1.Plan.SortDescending,"top volume parse failed");
var p2=parser.Interpret("نمادهایی که P/E کمتر از 6 دارند را بده");
Assert(p2.Success && p2.Plan!.Conditions.Any(x=>x.Metric==StructuredQueryMetric.PE && x.Operator==StructuredQueryOperator.LessThan && x.Value==6),"PE parse failed");
var p3=parser.Interpret("نمادهایی که قدرت خریدار بالای 2 دارند");
Assert(p3.Success && p3.Plan!.Conditions.Any(x=>x.Metric==StructuredQueryMetric.BuyerPower && x.Operator==StructuredQueryOperator.GreaterThan),"buyer power parse failed");
var p4=parser.Interpret("قیمت فولاد چنده؟");
Assert(!p4.Success,"single symbol question must not become structured screening");
var p5=parser.Interpret("نمادهایی با ارزش معاملات بالای ۲۰ میلیارد ریال را نشان بده");
Assert(p5.Success && p5.Plan!.Conditions.Any(x=>x.Metric==StructuredQueryMetric.TradeValue && x.Value==20_000_000_000m),"Persian billion scale parse failed");
var p6=parser.Interpret("نمادهایی با ارزش بازار بالای ۲ همت را نشان بده");
Assert(p6.Success && p6.Plan!.Conditions.Any(x=>x.Metric==StructuredQueryMetric.MarketValue && x.Value==2_000_000_000_000m),"hemmat scale parse failed");

var now=DateTime.UtcNow;
MarketSymbolSnapshot Snap(long id,string symbol,long volume,decimal pe,long buyCount=10,long sellCount=10)=>new()
{
    InsCode=id,Symbol=symbol,SymbolName=symbol,TradeVolume=volume,TradeValue=volume*1000m,TradeCount=100,
    LastPrice=1000,ClosingPrice=990,YesterdayPrice=980,MinPrice=950,MaxPrice=1020,PE=pe,BaseVolume=1000,
    SnapshotUpdatedAtUtc=now,ClientType=new(){BuyCountI=buyCount,SellCountI=sellCount,BuyIVolume=2000,SellIVolume=1000},
    OrderBook=[new(){Level=1,BuyPrice=999,BuyVolume=2000,SellPrice=1001,SellVolume=1000}]
};
var rows=new[]{Snap(1,"الف",5000,5),Snap(2,"ب",10000,7),Snap(3,"ج",8000,4,0,10)};
var service=new StructuredQueryService(parser,new FakeMarket(rows),new FakeQuality(),new DeterministicMarketAnalyticsEngine());
var r=await service.ExecuteAsync("نمادهایی که P/E کمتر از 6 دارند را بده",20,CancellationToken.None);
Assert(r.Success && r.Matched==2 && r.Results.Any(x=>x.Symbol=="الف") && r.Results.Any(x=>x.Symbol=="ج"),"PE execution failed");
var bp=await service.ExecuteAsync("نمادهایی که قدرت خریدار بالای 1.5 دارند",20,CancellationToken.None);
Assert(bp.Success && bp.Results.Any(x=>x.Symbol=="الف") && !bp.Results.Any(x=>x.Symbol=="ج"),"unavailable buyer power must not be fabricated");
Console.WriteLine("TSEAI Structured Query smoke PASS");

sealed class FakeMarket(IReadOnlyList<MarketSymbolSnapshot> rows):IMarketSnapshotQuery
{
    public Task<MarketSymbolSnapshot?> FindAsync(string symbolOrCode,CancellationToken ct)=>Task.FromResult(rows.FirstOrDefault(x=>x.Symbol==symbolOrCode));
    public Task<IReadOnlyList<MarketSymbolSnapshot>> GetActiveAsync(int limit,CancellationToken ct)=>Task.FromResult<IReadOnlyList<MarketSymbolSnapshot>>(rows.Take(limit).ToArray());
}
sealed class FakeQuality:IDataQualityService
{
    public MarketDataQualityReport EvaluateMarketSnapshot(MarketSymbolSnapshot s)=>new(DataQualityStatus.Valid,true,DateTimeOffset.UtcNow,s.InsCode,s.Symbol,new(DataQualityStatus.Valid,DateTimeOffset.UtcNow,TimeSpan.Zero,TimeSpan.FromMinutes(5),true,"test"),[]);
    public Task<CanonicalDataQualityReport> EvaluateCanonicalSourcesAsync(CancellationToken ct)=>Task.FromResult(new CanonicalDataQualityReport(DataQualityStatus.Valid,true,"test",DateTimeOffset.UtcNow,[]));
}
