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

var people=new[]
{
    new CanonicalPersonRoleCandidate{ContentId=1,Role="مدیر برنامه ریزی و ریسک",FullName="شاهین رامتین نیا"},
    new CanonicalPersonRoleCandidate{ContentId=2,Role="مدیر فناوری و توسعه نرم افزاری",FullName="آرش جدیری‌سلیمی"},
    new CanonicalPersonRoleCandidate{ContentId=3,Role="مدیرعامل بورس تهران",FullName="محمود گودرزی"},
    new CanonicalPersonRoleCandidate{ContentId=4,Role="رئیس هیئت مدیره",FullName="بهروز خالق‌ویردی"},
    new CanonicalPersonRoleCandidate{ContentId=5,Role="نائب رئیس هیئت مدیره",FullName="عسگر نوربخش"}
};
var technologyManager=CanonicalPersonRoleMatcher.Match("چه کسی مدیر فناوری بورس تهران است؟",people);
Must(technologyManager?.FullName=="آرش جدیری‌سلیمی","technology manager must resolve by exact role terms");
Must(CanonicalPersonRoleMatcher.IsPersonRoleQuestion("چه کسی مدیر فناوری بورس تهران است؟"),"generic manager title must route to person lookup");
Must(CanonicalPersonRoleMatcher.Match("مدیر بورس تهران کیست؟",people) is null,"ambiguous generic manager must fail closed");
Must(CanonicalPersonRoleMatcher.Match("رئیس هیئت مدیره بورس تهران کیست؟",people)?.FullName=="بهروز خالق‌ویردی","exact board chair must outrank deputy chair");
Must(!CanonicalPersonRoleMatcher.IsPersonRoleQuestion("نقش واحد برنامه‌ریزی و ریسک در تحقق اهداف کلان سازمان چیست؟"),"organizational-unit questions must remain in document retrieval");
var polished=PersianDisplayText.Normalize("تدوین استراتژیهای کلان تحت مدیریت واحد برنامهریزی و نظارت هیئتمدیره انجام میشود");
Must(polished.Contains("استراتژی‌های") && polished.Contains("برنامه‌ریزی") && polished.Contains("هیئت‌مدیره") && polished.Contains("می‌شود"),"Persian display spacing");
var composer=new PersianFinancialAnswerComposer();
var filler=string.Join(" ",Enumerable.Range(1,20).Select(i=>$"بخش عمومی شماره {i} درباره تاریخچه سازمان توضیح می‌دهد."));
var parentText=$"{filler} مصطفی مهدوی مدیرعامل جدید سازمان است و سوابق مدیر قبلی نیز نگهداری می‌شود. {filler}";
var parentHit=new KnowledgeHit(parentText,0.95,new KnowledgeCitation("cms_content","91","تغییر مدیریت",null,null,null),new Dictionary<string,object?>{{"retrieval_scope","parent_document"},{"document_chunk_count","3"}});
var summarized=composer.Compose(new AnswerComposeContext("مدیرعامل جدید سازمان کیست؟",ChatIntent.Knowledge,AnswerVerbosity.Standard),null,null,[parentHit]);
Must(summarized.Contains("مصطفی مهدوی") && summarized.Length<parentText.Length,"answer must summarize the full parent document around the question");
var full=composer.Compose(new AnswerComposeContext("کل متن سند مدیرعامل جدید را بده",ChatIntent.Knowledge,AnswerVerbosity.Analytical),null,null,[parentHit]);
Must(full.Contains(parentText,StringComparison.Ordinal),"explicit full-text request must return the complete parent document");
Console.WriteLine("TSEAI evidence/citation smoke PASS");
static void Must(bool ok,string msg){if(!ok)throw new Exception(msg);}
