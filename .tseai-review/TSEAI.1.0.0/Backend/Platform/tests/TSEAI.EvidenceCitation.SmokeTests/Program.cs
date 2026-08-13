using TSEAI.Application.Chat;
using TSEAI.Application.StructuredQuery;
using TSEAI.Shared.Application.Market;

var engine=new ChatEvidenceEngine();
var snapshot=new MarketSymbolSnapshot{InsCode=123,SymbolCode="IRO1TEST0001",Symbol="تست",SymbolName="نماد تست",LastPrice=1200,ClosingPrice=1180,YesterdayPrice=1100,TradeVolume=5000,TradeValue=6000000,TradeCount=42,SnapshotUpdatedAtUtc=new DateTime(2026,8,11,8,30,0,DateTimeKind.Utc)};
var hit=new KnowledgeHit("متن خبر معتبر",0.91,new KnowledgeCitation("Content","42","خبر تست","https://example.test/news/42","تست","2026-08-11"),new Dictionary<string,object?>{{"bm25_score",0.7}});
var evidence=engine.Build(ChatIntent.Hybrid,snapshot,null,null,[hit]);
Must(evidence.Any(x=>x.CitationLabel=="M1" && x.Authority==EvidenceAuthority.CanonicalMarketSnapshot),"market evidence");
Must(evidence.Any(x=>x.CitationLabel=="K1" && x.SourceId=="42"),"knowledge evidence");
var ok=engine.Validate(ChatIntent.Hybrid,evidence,true,true,false,false,"[M1] قیمت و [K1] خبر");
Must(ok.IsValid,"valid labels");
var bad=engine.Validate(ChatIntent.Hybrid,evidence,true,true,false,false,"[M9] fake");
Must(!bad.IsValid && bad.Issues.Any(x=>x.Contains("citation_label_without_evidence")),"unknown citation must fail");

var plan=new StructuredQueryPlan([],StructuredQueryMetric.TradeVolume,true,10,null,null,0.9,"بیشترین حجم",[]);
var result=new StructuredQueryExecutionResult(true,plan,500,2,0,[],null);
var q=engine.Build(ChatIntent.StructuredQuery,null,null,null,[],result);
Must(q.Any(x=>x.CitationLabel=="Q1" && x.Claims.ContainsKey("scanned")),"zero-row query execution evidence");
var qv=engine.Validate(ChatIntent.StructuredQuery,q,false,false,true,false,"منبع [Q1]");
Must(qv.IsValid,"query evidence valid");
Console.WriteLine("TSEAI evidence/citation smoke PASS");
static void Must(bool ok,string msg){if(!ok)throw new Exception(msg);}
