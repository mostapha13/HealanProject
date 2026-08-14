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
var p7=parser.Interpret("۵ نماد با بیشترین اثر روی شاخص را بده");
Assert(p7.Success && p7.Plan?.SortBy==StructuredQueryMetric.EffectOnIndex && p7.Plan.Take==5,"effect-on-index ranking parse failed");
var p8=parser.Interpret("نمادهای دارای بیشترین نسبت ارزش معاملات به ارزش بازار");
Assert(p8.Success && p8.Plan?.SortBy==StructuredQueryMetric.TurnoverRatio,"turnover ratio ranking parse failed");
var p9=parser.Interpret("پنج نماد با بیشترین اثر مثبت روی شاخص را فهرست کن");
Assert(p9.Success && p9.Plan?.SortBy==StructuredQueryMetric.EffectOnIndex && p9.Plan.Take==5 && p9.Plan.SortDescending,"worded take/effect ranking parse failed");
var p10=parser.Interpret("پنج نماد با بیشترین افت قیمت را بگو");
Assert(p10.Success && p10.Plan?.SortBy==StructuredQueryMetric.LastPricePercent && !p10.Plan.SortDescending,"loss ranking must sort ascending");
var p11=parser.Interpret("پنج نماد با بیشترین حجم بهترین سفارش خرید را بده");
Assert(p11.Success && p11.Plan?.SortBy==StructuredQueryMetric.BestBidVolume && p11.Plan.Take==5,"best bid volume ranking parse failed");
var p12=parser.Interpret("پنج نماد با بیشترین عدم تعادل منفی اردربوک را بده");
Assert(p12.Success && p12.Plan?.SortBy==StructuredQueryMetric.OrderBookImbalance && !p12.Plan.SortDescending,"negative order-book imbalance must sort ascending");
var p13=parser.Interpret("نمادهایی که عمق خرید بیشتر از 100 میلیون دارند");
Assert(p13.Success && p13.Plan!.Conditions.Any(x=>x.Metric==StructuredQueryMetric.TotalBidVolume && x.Value==100_000_000m),"bid depth condition parse failed");

var now=DateTime.UtcNow;
MarketSymbolSnapshot Snap(long id,string symbol,long volume,decimal pe,long buyCount=10,long sellCount=10)=>new()
{
    InsCode=id,Symbol=symbol,SymbolName=symbol,TradeVolume=volume,TradeValue=volume*1000m,TradeCount=100,
    LastPrice=1000,ClosingPrice=990,YesterdayPrice=980,MinPrice=950,MaxPrice=1020,PE=pe,BaseVolume=1000,
    MarketValue=volume*100_000m,EffectOnIndex=id*10,
    SnapshotUpdatedAtUtc=now,ClientType=new(){BuyCountI=buyCount,SellCountI=sellCount,BuyIVolume=2000,SellIVolume=1000},
    OrderBookUpdatedAt=now,OrderBookSourceCollectedAt=now,
    OrderBook=[new(){Level=1,BuyPrice=999,BuyVolume=2000*id,BuyCount=10*id,SellPrice=1001,SellVolume=1000,SellCount=5}]
};
var rows=new[]{Snap(1,"الف",5000,5),Snap(2,"ب",10000,7),Snap(3,"ج",8000,4,0,10)};
var service=new StructuredQueryService(parser,new FakeMarket(rows),new FakeQuality(),new DeterministicMarketAnalyticsEngine());
var r=await service.ExecuteAsync("نمادهایی که P/E کمتر از 6 دارند را بده",20,CancellationToken.None);
Assert(r.Success && r.Matched==2 && r.Results.Any(x=>x.Symbol=="الف") && r.Results.Any(x=>x.Symbol=="ج"),"PE execution failed");
var bp=await service.ExecuteAsync("نمادهایی که قدرت خریدار بالای 1.5 دارند",20,CancellationToken.None);
Assert(bp.Success && bp.Results.Any(x=>x.Symbol=="الف") && !bp.Results.Any(x=>x.Symbol=="ج"),"unavailable buyer power must not be fabricated");
var effect=await service.ExecuteAsync("۲ نماد با بیشترین اثر روی شاخص را بده",2,CancellationToken.None);
Assert(effect.Success && effect.Results.Select(x=>x.Symbol).SequenceEqual(["ج","ب"]),"effect-on-index execution failed");
var bidDepth=await service.ExecuteAsync("۲ نماد با بیشترین عمق خرید را بده",2,CancellationToken.None);
Assert(bidDepth.Success && bidDepth.Results.Select(x=>x.Symbol).SequenceEqual(["ج","ب"]),"order-book depth execution failed");
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
