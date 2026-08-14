using TSEAI.Application.Analytics;
using TSEAI.Application.Chat;
using TSEAI.Application.Data.Canonical;
using TSEAI.Shared.Application.Market;

static void Assert(bool value, string message) { if (!value) throw new Exception(message); }
static bool Near(decimal? a, decimal b, decimal eps = 0.0001m) => a.HasValue && Math.Abs(a.Value-b) <= eps;

var engine = new DeterministicMarketAnalyticsEngine();
var client = new ClientTypeSnapshot { BuyCountI=10, BuyIVolume=2000, SellCountI=10, SellIVolume=500, BuyNVolume=500, SellNVolume=2000 };
var tp = engine.AnalyzeTradingPower(client);
Assert(Near(tp.BuyerPower.Value, 4m), "buyer power");
Assert(tp.IndividualNetVolume.Value == 1500, "individual net");
Assert(tp.LegalNetVolume.Value == -1500, "legal net");
var missing = engine.AnalyzeTradingPower(new ClientTypeSnapshot { BuyIVolume=1, SellIVolume=1 });
Assert(missing.BuyerPower.Availability == AnalyticsAvailability.Unavailable, "zero denominator must be unavailable");

var clientQuestion=CanonicalClientTypeQuestion.Parse("قدرت خریدار حقیقی فملی چنده؟");
Assert(clientQuestion.IsMatch&&clientQuestion.Fields.Contains("buyer_power"),"client type buyer-power semantics");
Assert(CanonicalClientTypeQuestion.ExtractLookupTexts("حجم خرید حقیقی فملی چقدر است؟",false).Single()=="فملی","client type entity extraction");
Assert(CanonicalClientTypeQuestion.ExtractLookupTexts("حقوقی‌ها چند سهم فملی خریده‌اند؟",false).Single()=="فملی","client type colloquial entity extraction");
Assert(CanonicalClientTypeQuestion.ExtractLookupTexts("قیمت پایانی و قدرت خریدار فملی را باهم بگو",false).Single()=="فملی","client type compound entity extraction");
Assert(CanonicalClientTypeQuestion.ExtractLookupTexts("زمان جمع‌آوری ClientType فملی در SQL را بگو",false).Single()=="فملی","client type ingestion timestamp entity extraction");
Assert(CanonicalClientTypeQuestion.ExtractLookupTexts("حجم خرید حقیقی نماد خیالی‌تست چقدر است؟",false).Single()=="خیالی تست","client type unknown compound symbol must remain intact");
var rankingQuestion=CanonicalClientTypeQuestion.Parse("۵ نماد با بیشترین خالص خرید حقیقی را بگو");
Assert(rankingQuestion.Aggregate==ClientTypeAggregateKind.Ranking&&rankingQuestion.RankingField=="individual_net_volume"&&rankingQuestion.Limit==5,"client type ranking semantics");

var book = new[] { new OrderBookLevel { Level=1, BuyPrice=990, SellPrice=1000, BuyVolume=3000, SellVolume=1000, BuyCount=3, SellCount=1 } };
var ob = engine.AnalyzeOrderBook(book, 1000);
Assert(Near(ob.Spread.Value,10m), "spread");
Assert(Near(ob.SpreadPercent.Value,10m/995m*100m), "spread percent must use the quote midpoint");
Assert(Near(ob.Imbalance.Value,0.5m), "imbalance");

var snap = new MarketSymbolSnapshot { InsCode=1, Symbol="TEST", TradeVolume=2_000_000, BaseVolume=1_000_000, LastPrice=900, ClosingPrice=880, MinPrice=800, MaxPrice=1000, ClientType=client, OrderBook=book };
var all = engine.AnalyzeSymbol(snap);
Assert(Near(all.Volume.VolumeVsBaseVolume.Value,2m), "volume/base");
Assert(all.Volume.VolumeVsMonthlyAverage.Availability == AnalyticsAvailability.Unavailable, "monthly average must not be fabricated");
Assert(Near(all.PricePosition.DistanceFromSessionHighPercent.Value,10m), "distance from high");
Assert(Near(all.PricePosition.DistanceFromSessionLowPercent.Value,12.5m), "distance from low");

var breadth = engine.AnalyzeMarketBreadth(new[] { new CanonicalMarketIndex("IDX",1,1,1,1,1,1,DateTime.UtcNow,20,70,5,0,0,5,100,1,"Market",DateTime.UtcNow) });
Assert(Near(breadth.PositiveRatio.Value,0.7m), "positive ratio");
Assert(breadth.BreadthSignal == AnalyticsSignal.StrongPositive, "breadth signal");
Console.WriteLine("TSEAI Market Analytics smoke: PASS");
