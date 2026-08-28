using TSEAI.Application.Chat;
using TSEAI.Application.Chat.Agentic;
using TSEAI.Application.StructuredQuery;
using TSEAI.Shared.Application.Market;

var engine=new ChatEvidenceEngine();
var marketEntityCleaner=typeof(ChatOrchestrator).GetMethod("CleanMarketEntityInput",System.Reflection.BindingFlags.NonPublic|System.Reflection.BindingFlags.Static);
Must((string?)marketEntityCleaner?.Invoke(null,["فملی تاریخی"])=="فملی","temporal qualifiers must not force a fuzzy full-catalog entity lookup");
var snapshot=new MarketSymbolSnapshot{InsCode=123,SymbolCode="IRO1TEST0001",Symbol="تست",SymbolName="نماد تست",CompanyName="شرکت تست",LastPrice=1200,ClosingPrice=1180,YesterdayPrice=1100,FirstPrice=1110,MinPrice=1090,MaxPrice=1230,PriceChange=100,SourceLastPricePercent=9.09m,SourceClosingPriceChange=80,SourceClosingPricePercent=7.27m,TradeVolume=5000,TradeValue=6000000,TradeCount=42,MarketValue=120000000,PE=7.5m,Eps=160,EffectOnIndex=12.5m,MarketName="بورس",MarketTypeName="نرمال",BoardName="بازار اول - اصلی",IndustryName="فلزات اساسی",StateName="مجاز",SourceLastModified=new DateTime(2026,8,11,11,29,22),SnapshotUpdatedAtUtc=new DateTime(2026,8,11,8,30,0,DateTimeKind.Utc)};
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
    new CanonicalPersonRoleCandidate{ContentId=5,Role="نائب رئیس هیئت مدیره",FullName="عسگر نوربخش"},
    new CanonicalPersonRoleCandidate{ContentId=6,TsePersonCateryId=3,IsMaster=true,Role="معاون عملیات بازار",FullName="مهدی زمانی سبزی"},
    new CanonicalPersonRoleCandidate{ContentId=7,TsePersonCateryId=3,IsMaster=false,Role="مدیر عملیات بازار سهام",FullName="سید ناصر جعفری"}
};
var technologyManager=CanonicalPersonRoleMatcher.Match("چه کسی مدیر فناوری بورس تهران است؟",people);
Must(technologyManager?.FullName=="آرش جدیری‌سلیمی","technology manager must resolve by exact role terms");
Must(CanonicalPersonRoleMatcher.IsPersonRoleQuestion("چه کسی مدیر فناوری بورس تهران است؟"),"generic manager title must route to person lookup");
Must(CanonicalReferenceToolRegistry.Resolve("company","آخرین عرضه اولیه شرکت") == CanonicalReferenceToolNames.CompanyIpo,
    "IPO answers must expose the typed company IPO SQL tool");
Must(CanonicalReferenceToolRegistry.Resolve("organization_board","هیئت‌مدیره بورس تهران") == CanonicalReferenceToolNames.OrganizationPeople,
    "board answers must expose the typed organization SQL tool");
Must(CanonicalReferenceToolNames.Allowed.Contains(CanonicalReferenceToolRegistry.Resolve("content_reference","جدول Content")),
    "every mapped reference operation must be allow-listed");
Must(CanonicalPersonRoleMatcher.IsPersonRoleQuestion("مدیر فناوری بورس تهران کیه؟"),"colloquial role question should also route to person lookup");
Must(CanonicalQuestionOwnership.Detect("چه فردی مدیر عامل بورس تهران است؟")==CanonicalQuestionDomain.Organization,
    "exchange CEO wording must be owned by the organization graph, not issuer company fields");
Must(CanonicalPersonRoleMatcher.IsPersonRoleQuestion("مسئول فناوری و توسعه نرم افزاری بورس تهران چه فردیه؟"),"person wording variants must route to person lookup");
Must(CanonicalPersonRoleMatcher.Match("مسئول فناوری و توسعه نرم افزاری بورس تهران چه فردیه؟",people)?.FullName=="آرش جدیری‌سلیمی","role meaning must resolve independently of manager/responsible wording");
Must(CanonicalPersonRoleMatcher.IsPersonRoleQuestion("مدیر واحد فناوری چه کسی است؟"),"mentioning an organizational unit must not hide a person question");
Must(CanonicalPersonRoleMatcher.Match("مدیر بورس تهران کیست؟",people) is null,"ambiguous generic manager must fail closed");
Must(CanonicalPersonRoleMatcher.Match("رئیس هیئت مدیره بورس تهران کیست؟",people)?.FullName=="بهروز خالق‌ویردی","exact board chair must outrank deputy chair");
Must(!CanonicalPersonRoleMatcher.IsPersonRoleQuestion("نقش واحد برنامه‌ریزی و ریسک در تحقق اهداف کلان سازمان چیست؟"),"organizational-unit questions must remain in document retrieval");
var boardMembers=new[]
{
    new CanonicalBoardMember{Position=0,FullName="بهروز خالق‌ویردی",Role="رئیس هیئت مدیره"},
    new CanonicalBoardMember{Position=1,FullName="عسگر نوربخش",Role="نائب رئیس هیئت مدیره"},
    new CanonicalBoardMember{Position=2,FullName="مجتبی افشاری",Role="عضو هیئت مدیره"},
    new CanonicalBoardMember{Position=3,FullName="حامد شادکام",Role="عضو هیئت مدیره"},
    new CanonicalBoardMember{Position=4,FullName="میلاد فروغی",Role="عضو هیئت مدیره"},
    new CanonicalBoardMember{Position=5,FullName="عباس نعیمی",Role="عضو هیئت مدیره"}
};
Must(CanonicalBoardMemberAnswer.Parse("اعضای هیئت مدیره بورس تهران کیا هستند؟").IsMemberList,"formal board-member question must use structured membership");
Must(CanonicalBoardMemberAnswer.Parse("هیئت مدیره بورس کیا هستن؟").IsMemberList,"colloquial board-member question must use structured membership");
Must(CanonicalBoardMemberAnswer.Parse("چه افرادی در هیأت‌مدیره بورس حضور دارند؟").IsMemberList,"board spelling and person-list variants must use structured membership");
Must(CanonicalBoardMemberAnswer.Parse("کلیه اعضای هیئت مدیره رو بهم بگو").IsMemberList,"contextual board-member list wording must use structured membership");
Must(CanonicalCompanyStateQuestion.Parse("کلیه اعضای هیئت مدیره رو بهم بگو").LookupHint is null,
    "generic exchange board wording must not fabricate an issuer lookup from conversational filler");
Must(CanonicalBoardMemberAnswer.Parse("آخرین اعضای هیئت مدیره بورس کیا هستند؟").IsMemberList,"latest board-member wording must use current structured membership");
var compositeBoard=CanonicalBoardMemberAnswer.Parse("سابقه اعضای هیئت مدیره و از طرف کدام شرکت هستند؟");
Must(compositeBoard.IsMemberList && compositeBoard.WantsHistory && compositeBoard.WantsRepresentation && compositeBoard.NeedsKnowledge,"compound board question must request structured roster plus knowledge evidence");
var namesIntent=CanonicalBoardMemberAnswer.Parse("فقط اسم اعضای هیئت مدیره بورس تهران رو بهم بگو");
Must(namesIntent.IsMemberList && namesIntent.NamesOnly,"names-only constraint must be detected");
Must(CanonicalBoardMemberAnswer.Parse("نام اعضای هیئت‌مدیره را ببر").NamesOnly,"natural names-only wording must be detected");
Must(CanonicalBoardMemberAnswer.Parse("فقط اسمشون رو بگو؛ اعضای هیئت‌مدیره بورس تهران").NamesOnly,
    "possessive colloquial names-only wording must be detected");
Must(CanonicalOrganizationEvidencePolicy.IsProfessionalHistoryExcerpt(
        "بهروز خالق‌ویردی دارای سابقه مدیریت در بازار سرمایه و دانش‌آموخته مدیریت مالی است.",["بهروز خالق‌ویردی"]),
    "a biography excerpt naming the current person and an explicit professional-history cue must pass");
Must(!CanonicalOrganizationEvidencePolicy.IsProfessionalHistoryExcerpt(
        "طبق اطلاعیه تغییر ترکیب هیئت‌مدیره، عباس نعیمی به عنوان عضو هیئت‌مدیره معرفی شد.",["عباس نعیمی"]),
    "a historical board appointment is not a professional biography and must not pass as one");
Must(!CanonicalOrganizationEvidencePolicy.IsProfessionalHistoryExcerpt(
        "مطابق آیین‌نامه راهبری شرکتی، هیئت‌مدیره سه کمیته تخصصی تشکیل می‌دهد.",["بهروز خالق‌ویردی"]),
    "generic governance documents must not pass as a current member's professional history");
var incompleteBoardEvidence=new CanonicalReferenceAnswer("اعضای فعلی",new("organization_board","هیئت‌مدیره بورس تهران",null,null,[]),
    [new("board_member:0:name","بهروز خالق‌ویردی","TsePerson:1")],false,["member_history","representing_company"],["سوابق بهروز خالق‌ویردی"]);
Must(CanonicalOrganizationEvidencePolicy.ShouldUseDeterministicKnowledgeRoute(incompleteBoardEvidence),
    "bounded organization facets must bypass the AI planner and use deterministic evidence composition");
Must(!CanonicalOrganizationEvidencePolicy.ShouldUseDeterministicKnowledgeRoute(incompleteBoardEvidence with { MissingFacets=["unknown_facet"] }),
    "unknown canonical facets must not silently bypass the bounded planner");
Must(new ChatToolPolicy().IsAllowed("answer.compose.canonical"),
    "deterministic canonical composition must remain explicitly allow-listed");
var namesOnly=CanonicalBoardMemberAnswer.Compose(namesIntent,boardMembers);
Must(namesOnly=="بهروز خالق‌ویردی، عسگر نوربخش، مجتبی افشاری، حامد شادکام، میلاد فروغی، عباس نعیمی","names-only answer must contain no narrative or roles");
var boardAnswer=CanonicalBoardMemberAnswer.Compose(CanonicalBoardMemberAnswer.Parse("اعضای هیئت مدیره بورس تهران کیا هستند؟"),boardMembers);
Must(boardAnswer?.Contains("بهروز خالق‌ویردی — رئیس هیئت‌مدیره",StringComparison.Ordinal)==true && boardAnswer.Contains("عباس نعیمی",StringComparison.Ordinal),"normal board answer must include every current member and role");
Must(!CanonicalBoardMemberAnswer.Parse("رئیس هیئت مدیره بورس تهران کیست؟").IsMemberList,"singular board position must remain in the person-role route");
Must(!CanonicalBoardMemberAnswer.Parse("اعضای کمیته حسابرسی هیئت مدیره چه کسانی هستند؟").IsMemberList,"board committees must not be mistaken for the board itself");
var baseVolumeIntent=CanonicalInstrumentQuestion.Parse("حجم مبنای فملی چند است؟");
Must(baseVolumeIntent.IsMatch && baseVolumeIntent.Fields.Contains("base_volume"),"instrument base volume must use canonical Instrument data");
var allowedRangeIntent=CanonicalInstrumentQuestion.Parse("دامنه قیمت مجاز فملی در جدول Instrument چیست؟");
Must(allowedRangeIntent.Fields.Contains("min_allowed_price") && allowedRangeIntent.Fields.Contains("max_allowed_price"),"instrument allowed range must preserve both bounds");
var reverseInstrumentIntent=CanonicalInstrumentQuestion.Parse("InstrumentID IRO1MSMI0001 متعلق به کدام نماد است؟");
Must(reverseInstrumentIntent.Fields.Contains("instrument_id") && reverseInstrumentIntent.Fields.Contains("name"),"reverse identifier lookup must return the instrument identity");
Must(CanonicalInstrumentQuestion.ExtractLookupText("نام کامل نماد فملی چیست؟")=="فملی","instrument entity extraction must not confuse the word symbol with ticker نماد");
Must(CanonicalInstrumentQuestion.ExtractLookupText("InstrumentID IRO1MSMI0001 متعلق به کدام نماد است؟")=="iro1msmi0001","instrument entity extraction must preserve a canonical identifier");
Must(CanonicalInstrumentQuestion.Parse("اسم کامل سهم خودرو رو بگو").Fields.Contains("name"),"colloquial stock name must route to Instrument");
Must(CanonicalInstrumentQuestion.Parse("حداقل حجم هر سفارش فملی چقدره؟").Fields.Contains("min_order_volume"),"per-order minimum must not be confused with traded volume");
Must(CanonicalInstrumentQuestion.Parse("زمان جمع‌آوری داده Instrument فملی چه موقع بوده؟").Fields.Contains("source_observed_at"),"Instrument source timestamp must route to canonical metadata");
Must(CanonicalInstrumentQuestion.Parse("تعداد سهام، ارزش اسمی و حجم مبنای خودرو را خلاصه بگو").Fields.Contains("shares_count"),"compound capitalization question must preserve share count");
Must(CanonicalInstrumentQuestion.Parse("تعداد اوراق بدهی فعال در Instrument چندتاست؟").Category=="debt","debt count wording must route to the debt category");
Must(CanonicalInstrumentQuestion.Parse("چه تعداد قرارداد آتی معتبر ثبت شده؟").Category=="future","future count wording must route to the future category");
Must(CanonicalInstrumentQuestion.Parse("چند ابزار معتبر Instrument به Cashmarket وصل است؟").Aggregate==InstrumentAggregateKind.CashMarketCoverage,"Cashmarket coverage must outrank the cash category");
Must(CanonicalInstrumentQuestion.Parse("چند ابزار معتبر Instrument در OrderBookCurrent رکورد دارند؟").Aggregate==InstrumentAggregateKind.OrderBookCoverage,"OrderBook coverage must use exact InstrumentID joins");
Must(CanonicalQuestionOwnership.Detect("InstrumentID IRO1MSMI0001 متعلق به کدام نماد است؟")==CanonicalQuestionDomain.Instrument,"explicit Instrument identifier must own reverse lookup");
Must(CanonicalQuestionOwnership.Detect("SourceCollectedAt جدول Company چه مفهومی دارد؟")==CanonicalQuestionDomain.Company,"explicit Company table must own shared timestamp fields");
Must(CanonicalQuestionOwnership.Detect("زمان جمع‌آوری ClientType فملی در SQL را بگو")==CanonicalQuestionDomain.ClientType,"explicit ClientType source must outrank shared market fields");
Must(CanonicalQuestionOwnership.Detect("بازارگردان و کارگزار بازارگردان صندوق دلتا را بگو")==CanonicalQuestionDomain.Knowledge,"event-specific fund roles must use document evidence");
Must(CanonicalQuestionOwnership.Detect("ارزش بازار سایپا در گزارش مراسم چند همت اعلام شده بود؟")==CanonicalQuestionDomain.Knowledge,"historical report values must not use current market snapshots");
Must(CanonicalQuestionOwnership.Detect("CEO حفارس کیست؟")==CanonicalQuestionDomain.CompanyState,"natural CEO questions must use the current Companystate authority");
Must(CanonicalQuestionOwnership.Detect("ستون CEO جدول Company برای حفارس چیست؟")==CanonicalQuestionDomain.Company,"an explicitly named Company table must retain source ownership");
Must(CanonicalQuestionOwnership.Detect("قرار است کدام فرایندهای پذیرش ناشران الکترونیکی شود؟")==CanonicalQuestionDomain.Knowledge,"acceptance-process morphology must deterministically use document evidence");
Must(PersianMarketQuestionSemantics.IsOrderBookQuestion("مجموع حجم فروش فملی در پنج ردیف را بگو"),"order-book depth totals must bypass canonical reference parsers");
Must(PersianMarketQuestionSemantics.IsOrderBookQuestion("زمان به‌روزرسانی منبع و زمان جمع‌آوری اردربوک فملی را بگو"),"order-book timestamps must bypass Company metadata routing");
Must(PersianMarketQuestionSemantics.IsOrderBookQuestion("InsCode وبملت در اردربوک چیست؟"),"order-book identifiers must remain in the market route");
Must(PersianMarketQuestionSemantics.DetectRequestedFields("InsCode وبملت در اردربوک چیست؟").SequenceEqual(["ins_code"]),"order-book source wording must not expand an InsCode-only answer to five depth levels");
Must(PersianMarketQuestionSemantics.DetectRequestedFields("InstrumentID فملی در OrderBookCurrent چیه؟").SequenceEqual(["instrument_id"]),"OrderBookCurrent source wording must not expand an InstrumentID-only answer to five depth levels");
Must(PersianMarketQuestionSemantics.IsOrderBookQuestion("پنج نماد با بیشترین حجم بهترین سفارش خرید را بده"),"best-bid rankings must remain in the structured-query route");
Must(PersianMarketQuestionSemantics.IsOrderBookQuestion("پنج نماد با بیشترین درصد اسپرد را نشان بده"),"spread rankings must remain in the structured-query route");
var categoryCountIntent=CanonicalInstrumentQuestion.Parse("چند ابزار ETF معتبر داریم؟");
Must(categoryCountIntent.Aggregate==InstrumentAggregateKind.CategoryInstruments && categoryCountIntent.Category=="etf","instrument category count must be deterministic");
var categoryBreakdownIntent=CanonicalInstrumentQuestion.Parse("تعداد ابزارهای معتبر را به تفکیک دسته‌بندی بگو");
Must(categoryBreakdownIntent.Aggregate==InstrumentAggregateKind.CategoryCounts,"instrument category breakdown must be deterministic");
Must(CanonicalOrganizationHierarchyAnswer.IsSubordinateQuestion("زیر مجموعه معاون اجرایی بورس کیا هستند؟"),"organization hierarchy follow-up must use structured person category");
Must(CanonicalOrganizationHierarchyAnswer.IsParentQuestion("زیر مجموعه چه معاونتیه؟"),"elliptical upward hierarchy question must be detected");
Must(CanonicalOrganizationHierarchyAnswer.IsParentQuestion("ناصر جعفری زیرمجموعه کدوم معاونته؟"),"explicit person upward hierarchy question must be detected");
Must(CanonicalOrganizationHierarchyAnswer.IsParentQuestion("این مدیر به چه کسی گزارش میده؟"),"reporting-line wording must be detected");
Must(!CanonicalOrganizationHierarchyAnswer.IsParentQuestion("زیر مجموعه معاون اجرایی بورس کیا هستند؟"),"downward hierarchy list must not be mistaken for a parent lookup");
var nasser=CanonicalPersonRoleMatcher.MatchPersonName("ناصر جعفری زیرمجموعه کدوم معاونته؟",people);
Must(nasser?.FullName=="سید ناصر جعفری","person lookup must tolerate honorific omission without guessing a symbol");
var parentAnswer=CanonicalOrganizationHierarchyAnswer.ComposeParent("ناصر جعفری زیرمجموعه کدوم معاونته؟",nasser!,people.Single(x=>x.IsMaster));
Must(parentAnswer.Contains("معاونت عملیات بازار",StringComparison.Ordinal) && parentAnswer.Contains("مهدی زمانی سبزی",StringComparison.Ordinal),"upward hierarchy answer must identify both canonical unit and manager");
var hierarchyAnswer=CanonicalOrganizationHierarchyAnswer.Compose("معاون اجرایی",[
    new CanonicalBoardMember{ContentId=1,Position=1,FullName="اسماعیل رازقی",Role="مدیر اداری"},
    new CanonicalBoardMember{ContentId=2,Position=2,FullName="سعید رضایی",Role="مدیر سرمایه‌های انسانی"}
]);
Must(hierarchyAnswer?.Contains("اسماعیل رازقی — مدیر اداری",StringComparison.Ordinal)==true && hierarchyAnswer.Contains("سعید رضایی",StringComparison.Ordinal),"organization hierarchy answer must list structured subordinates");
var hierarchyNames=CanonicalOrganizationHierarchyAnswer.Compose("فقط نام مدیران را بگو","معاون اجرایی",[
    new CanonicalBoardMember{ContentId=1,Position=1,FullName="اسماعیل رازقی",Role="مدیر اداری"},
    new CanonicalBoardMember{ContentId=2,Position=2,FullName="رضا قلیچ‌خانی",Role="مدیر امور مالی"}
]);
Must(hierarchyNames=="اسماعیل رازقی، رضا قلیچ‌خانی"&&!hierarchyNames.Contains("مدیر اداری",StringComparison.Ordinal),
    "names-only organization follow-ups must not add roles or explanatory prose");
Must(CanonicalOrganizationHierarchyAnswer.WantsNamesOnly("اسمشون چیه؟"),
    "possessive subordinate names-only wording must be detected");
var companyPhone=CanonicalCompanyQuestion.Parse("شماره تلفن فملی چنده؟");
Must(companyPhone.IsMatch&&companyPhone.Fields.Contains("phone")&&companyPhone.Lookups.Single()=="فملی","Company phone question must retain only the company/symbol lookup");
var companyWeb=CanonicalCompanyQuestion.Parse("وب‌سایت رسمی فولاد مبارکه چیست؟");
Must(companyWeb.Fields.Contains("url")&&companyWeb.Lookups.Single()=="فولاد مبارکه","Company website wording must be deterministic");
Must(CanonicalCompanyQuestion.Parse("مدیرعامل شرکت ملی صنایع مس ایران کیه؟").Fields.Contains("ceo"),"Company CEO question must use canonical nullable CEO field");
Must(CanonicalCompanyQuestion.Parse("جدول Company چند رکورد دارد؟").Aggregate==CompanyAggregateKind.Statistics,"Company statistics must be detected");
Must(CanonicalCompanyQuestion.Parse("کیفیت داده جدول Company چطوره؟").Aggregate==CompanyAggregateKind.DataQuality,"Company quality must be detected");
Must(CanonicalCompanyQuestion.Parse("شرکت‌های تالار خوزستان را بگو").Aggregate==CompanyAggregateKind.HallCompanies,"Company hall membership must be detected");
Must(CanonicalCompanyQuestion.Parse("پنج شرکت با جدیدترین عرضه اولیه را بگو").Aggregate==CompanyAggregateKind.LatestIpo,"latest Company IPO ranking must be detected");
var exactLatestIpoCorpus=CanonicalCompanyQuestion.Parse("سه شرکت با جدیدترین تاریخ عرضه اولیه در Company کدام‌اند؟");
Must(exactLatestIpoCorpus.Aggregate==CompanyAggregateKind.LatestIpo&&exactLatestIpoCorpus.Lookups.Count==0&&exactLatestIpoCorpus.Limit==3,$"aggregate Company IPO wording must not invent an entity lookup: aggregate={exactLatestIpoCorpus.Aggregate};lookups={string.Join('|',exactLatestIpoCorpus.Lookups)};limit={exactLatestIpoCorpus.Limit}");
var latestIpo=CanonicalCompanyQuestion.Parse("آخرین عرضه اولیه بورس چیه؟");
Must(latestIpo.Aggregate==CompanyAggregateKind.LatestIpo&&latestIpo.Lookups.Count==0&&latestIpo.Limit==1,"singular latest IPO wording must not be resolved as an instrument name");
Must(CanonicalCompanyQuestion.Parse("تازه‌ترین IPO بورس تهران چیست؟").Aggregate==CompanyAggregateKind.LatestIpo,"freshest IPO synonym must route to Company");
Must(CanonicalCompanyQuestion.Parse("سه عرضه اولیه اخیر بورس را بگو").Limit==3,"IPO ranking must recognize counts before the word offering");
var earliestIpo=CanonicalCompanyQuestion.Parse("اولین عرضه اولیه بورس چه بود؟");
Must(earliestIpo.Aggregate==CompanyAggregateKind.EarliestIpo&&earliestIpo.Lookups.Count==0&&earliestIpo.Limit==1,"singular earliest IPO wording must remain a structured Company query");
var specificLatestIpo=CanonicalCompanyQuestion.Parse("آخرین تاریخ عرضه اولیه فملی چیه؟");
Must(specificLatestIpo.Aggregate==CompanyAggregateKind.None&&specificLatestIpo.Lookups.Single()=="فملی","latest wording for a named company must remain a company detail lookup");
var companyYear=CanonicalCompanyQuestion.Parse("چند شرکت در سال ۱۴۰۲ عرضه اولیه شدند؟");
Must(companyYear.Aggregate==CompanyAggregateKind.IpoYear&&companyYear.JalaliYear==1402,"Jalali Company IPO year must be detected");
var companyCompare=CanonicalCompanyQuestion.Parse("تاریخ عرضه اولیه فملی را با فولاد مقایسه کن");
Must(companyCompare.Aggregate==CompanyAggregateKind.Comparison&&companyCompare.Lookups.Count==2,"Company IPO comparison must preserve two entities");
Must(!CanonicalCompanyQuestion.Parse("ارزش بازار شرکت فملی چقدر است؟").IsMatch,"Company reference parser must not steal a market-value question");
Must(CanonicalCompanyQuestion.Parse("در بررسی کیفیت داده").Aggregate==CompanyAggregateKind.None,"a generic quality fragment must not be stolen by Company");
Must(CanonicalCompanyQuestion.MatchKey("شرکت فولاد مباركه اصفهان (سهامی عام)")=="فولادمبارکهاصفهان","Company matching must normalize Arabic characters and corporate suffixes");
var stateStatus=CanonicalCompanyStateQuestion.Parse("وضعیت نماد جم چیه؟");
Must(stateStatus.IsMatch&&stateStatus.Fields.Contains("status")&&stateStatus.LookupHint=="جم","Companystate status question must preserve the symbol lookup");
Must(CanonicalCompanyStateQuestion.Parse("چرا جم تعلیق شده؟").Fields.Contains("reason"),"Companystate reason variants must be detected");
Must(CanonicalCompanyStateQuestion.Parse("فقط اسم اعضای هیئت مدیره جم را بگو").Fields.Contains("board_members"),"Companystate board-member field must be detected");
Must(CanonicalCompanyStateQuestion.Parse("پنج نماد مشمول فرایند تعلیق را لیست کن").Aggregate==CompanyStateAggregateKind.StatusList,"Companystate status list must be detected");
var stateYear=CanonicalCompanyStateQuestion.Parse("در سال ۱۴۰۵ آخرین تغییر وضعیت چند نماد ثبت شده؟");
Must(stateYear.Aggregate==CompanyStateAggregateKind.ChangeYear&&stateYear.JalaliYear==1405,"Companystate Jalali change year must be detected");
Must(CanonicalCompanyStateQuestion.Parse("StatusCode در Companystate چه معنایی دارد؟").Aggregate==CompanyStateAggregateKind.Schema,"Companystate schema questions must be detected");
Must(CanonicalCompanyStateQuestion.Parse("جدول Companystate چند رکورد و چند نماد متمایز دارد؟").Aggregate==CompanyStateAggregateKind.Statistics,"Companystate statistics must be detected");
Must(CanonicalCompanyStateQuestion.Parse("توزیع وضعیت نمادهای Companystate چطور است؟").Aggregate==CompanyStateAggregateKind.StatusDistribution,"Companystate distribution must be detected");
Must(CanonicalCompanyStateQuestion.Parse("تعداد شرکت‌های مشمول فرایند تعلیق چقدره؟").Aggregate==CompanyStateAggregateKind.StatusDistribution,"Companystate pending-suspension count must be detected");
Must(CanonicalCompanyStateQuestion.Parse("فقط نمادهایی را بگو که آخرین تغییر وضعیتشان در سال 1401 بوده").Aggregate==CompanyStateAggregateKind.ChangeYear,"Companystate year list must be detected");
Must(CanonicalCompanyStateQuestion.Parse("چند رکورد به عدم ارائه صورت مالی اشاره دارند؟").Aggregate==CompanyStateAggregateKind.ReasonAnalysis,"Companystate reason counts must be detected");
Must(CanonicalCompanyStateQuestion.Parse("چند شرکت در Companystate بدون اعضای هیئت مدیره هستند؟").Aggregate==CompanyStateAggregateKind.DataQuality,"Companystate missing-board count must be detected");
Must(CanonicalCompanyStateQuestion.Parse("آخرین زمان جمع‌آوری کل جدول Companystate را بگو").Aggregate==CompanyStateAggregateKind.Statistics,"Companystate collection timestamp must remain a table statistic");
Must(CanonicalCompanyStateQuestion.Parse("کیفیت داده جدول Companystate را خلاصه کن").Aggregate==CompanyStateAggregateKind.DataQuality,"Companystate quality summary must remain source-owned");
Must(CanonicalCompanyStateQuestion.Parse("در بررسی کیفیت داده").Aggregate==CompanyStateAggregateKind.None,"a generic quality fragment must not be stolen by Companystate");
Must(CanonicalCompanyStateQuestion.Parse("Companystate نماد یا کد سامانه تکراری دارد؟").Aggregate==CompanyStateAggregateKind.DataQuality,"Companystate duplicate audit must remain source-owned");
Must(CanonicalCompanyStateQuestion.Parse("آیا Companystate قیمت و حجم معاملات هم دارد؟").Aggregate==CompanyStateAggregateKind.Schema,"Companystate market-field question must be treated as a schema boundary");
Must(CanonicalCompanyStateQuestion.Parse("Lastdatechange جدول Companystate شمسی است یا میلادی؟").Aggregate==CompanyStateAggregateKind.Schema,"Companystate date schema must be detected");
Must(CanonicalCompanyStateQuestion.Parse("زمان جمع‌آوری وضعیت جم چه موقع بوده؟").IsMatch,"Companystate source timestamp must route to canonical state data");
Must(CanonicalCompanyStateQuestion.Parse("آبادا الان چه وضعیتی دارد؟").IsMatch,"natural state-detail wording must route to Companystate when the symbol exists there");
Must(CanonicalCompanyStateQuestion.Parse("علت وضعیت آبادا چیست؟").IsMatch,"reason plus generic state wording must route to Companystate");
var contentRecord=CanonicalContentQuestion.Parse("تاریخ انتشار و متن رکورد Content 100756 را بگو");
Must(contentRecord.IsMatch&&contentRecord.ContentId==100756&&contentRecord.Fields.Contains("publish_at")&&contentRecord.Fields.Contains("body"),"Content record metadata must preserve id and requested fields");
Must(CanonicalContentQuestion.Parse("جدول Content چند رکورد دارد؟").Aggregate==ContentAggregateKind.Statistics,"Content statistics question must be detected");
Must(CanonicalContentQuestion.Parse("ContentTypeIdهای جدول Content را به تفکیک بگو").Aggregate==ContentAggregateKind.TypeDistribution,"Content type distribution must be detected");
Must(CanonicalContentQuestion.Parse("چند رکورد جدول Content بدنه خالی دارند؟").Aggregate==ContentAggregateKind.DataQuality,"Content body quality question must be detected");
Must(CanonicalContentQuestion.Parse("آیا جدول Content ستون Title دارد؟").Aggregate==ContentAggregateKind.Schema,"Content title schema question must be detected");
Must(CanonicalContentQuestion.Parse("نوع‌های محتوای جدول Content را به تفکیک تعداد بده").Aggregate==ContentAggregateKind.TypeDistribution,"natural plural Content type wording must be detected");
Must(CanonicalContentQuestion.Parse("آیا جدول Content ستون Title یا Subject دارد؟").Aggregate==ContentAggregateKind.Schema,"mixed English Content title schema wording must be detected");
var institutionPhone=CanonicalFinancialInstitutionQuestion.Parse("شماره تماس کارگزاری مفید در اهواز چنده؟");
Must(institutionPhone.IsMatch&&institutionPhone.Fields.Contains("phone")&&institutionPhone.Lookups.Single()=="مفید","financial-institution phone lookup must retain the institution name only");
var institutionBranches=CanonicalFinancialInstitutionQuestion.Parse("کارگزاری آگاه چند شعبه دارد؟");
Must(institutionBranches.Aggregate==FinancialInstitutionAggregateKind.Branches&&institutionBranches.Lookups.Single()=="آگاه","financial-institution branch question must retain the institution name");
Must(CanonicalFinancialInstitutionQuestion.Parse("نهادهای مالی تالار خوزستان را فقط اسم بگو").Aggregate==FinancialInstitutionAggregateKind.HallInstitutions,"hall institution list must be detected");
Must(CanonicalFinancialInstitutionQuestion.Parse("تالار کرمان شمارش چنده؟").Aggregate==FinancialInstitutionAggregateKind.HallInstitutions,"colloquial hall count must route to the typed financial-institution aggregate");
Must(CanonicalFinancialInstitutionQuestion.Parse("کارگزاری‌ها را به تفکیک تالار رتبه‌بندی کن").Aggregate==FinancialInstitutionAggregateKind.HallDistribution,"institution hall distribution must be detected");
Must(CanonicalFinancialInstitutionQuestion.Parse("تعداد هر نوع نهاد مالی را بگو").Aggregate==FinancialInstitutionAggregateKind.TypeDistribution,"institution type distribution must be detected");
Must(CanonicalFinancialInstitutionQuestion.Parse("جدول Nahad_Mali چند رکورد، نام، نوع و تالار دارد؟").Aggregate==FinancialInstitutionAggregateKind.Statistics,"institution statistics must win over a hall-list interpretation");
Must(CanonicalFinancialInstitutionQuestion.Parse("آمار کلی نهادهای مالی ثبت‌شده در SQL را خلاصه بگو").Aggregate==FinancialInstitutionAggregateKind.Statistics,"natural institution statistics wording must be detected");
Must(CanonicalFinancialInstitutionQuestion.Parse("تالار مشهد چند رکورد نهاد مالی دارد؟").Aggregate==FinancialInstitutionAggregateKind.HallInstitutions,"natural hall record count must be detected");
Must(CanonicalFinancialInstitutionQuestion.Parse("فهرست مشاوران سرمایه‌گذاری ثبت‌شده را بده").Aggregate==FinancialInstitutionAggregateKind.TypeInstitutions,"plural investment-advisor wording must be detected");
Must(CanonicalFinancialInstitutionQuestion.Parse("کیفیت داده جدول Nahad_Mali چطور است؟").Aggregate==FinancialInstitutionAggregateKind.DataQuality,"institution data quality must be detected");
Must(CanonicalFinancialInstitutionQuestion.Parse("جدول Nahad_Mali کلید خارجی دارد؟").Aggregate==FinancialInstitutionAggregateKind.Schema,"institution schema question must be detected");
Must(!CanonicalFinancialInstitutionQuestion.Parse("جدول Content کلید اصلی، ایندکس یا Foreign Key دارد؟").IsMatch,"institution parser must not steal another table's schema question");
var institutionComparison=CanonicalFinancialInstitutionQuestion.Parse("تعداد شعب آگاه را با مفید مقایسه کن");
Must(institutionComparison.Aggregate==FinancialInstitutionAggregateKind.Comparison&&institutionComparison.Lookups.Count==2,"institution comparison must retain two institution names");
Must(CanonicalFinancialInstitutionQuestion.MatchKey("کارگزاری مفید (شعبه)")=="مفید","institution matching must remove type and branch wrappers");
var polished=PersianDisplayText.Normalize("تدوین استراتژیهای کلان تحت مدیریت واحد برنامهریزی و نظارت هیئتمدیره انجام میشود");
Must(polished.Contains("استراتژی‌های") && polished.Contains("برنامه‌ریزی") && polished.Contains("هیئت‌مدیره") && polished.Contains("می‌شود"),"Persian display spacing");
var composer=new PersianFinancialAnswerComposer();
var datedPrice=composer.Compose(new AnswerComposeContext("آخرین قیمت تست مربوط به چه تاریخیه؟",ChatIntent.MarketSymbol,AnswerVerbosity.Compact,["last_price","observed_at"]),snapshot,null,[]);
Must(datedPrice.Contains("1,200") && datedPrice.Contains("1405/05/20") && !datedPrice.Contains("2026/08/11") && !datedPrice.Contains("قیمت پایانی"),"focused market answer must return only requested price and Jalali observation date");
var volumeAndValue=composer.Compose(new AnswerComposeContext("حجم و ارزش معاملات تست",ChatIntent.MarketSymbol,AnswerVerbosity.Compact,["trade_volume","trade_value"]),snapshot,null,[]);
Must(volumeAndValue.Contains("5,000 سهم") && volumeAndValue.Contains("6,000,000 ریال") && !volumeAndValue.Contains("آخرین قیمت"),"focused market answer must preserve multiple requested fields");
var ordinalPlan=new StructuredQueryPlan([],StructuredQueryMetric.TradeValue,true,5,null,null,0.99,"رتبه ارزش معاملات",[]);
var ordinalRow=new StructuredQueryRow(123,null,"تست","نماد تست","شرکت تست",20,null,
    new Dictionary<string,decimal?>{{nameof(StructuredQueryMetric.TradeValue),6_000_000m},{nameof(StructuredQueryMetric.PE),7.5m}},"Valid");
var ordinalAnswer=composer.ComposeStructured("پنج نماد اول از نظر ارزش معاملات را بگو و برای اولی P/E را اضافه کن",
    new StructuredQueryExecutionResult(true,ordinalPlan,1,0,1,[ordinalRow],null));
Must(ordinalAnswer.Contains("ارزش معاملات 6,000,000 ریال")&&ordinalAnswer.Contains("برای رتبه اول، تست: P/E 7.50"),
    "ordinal result projection must be bound to the first structured row");
var highLow=composer.Compose(new AnswerComposeContext("سقف و کف قیمت تست",ChatIntent.MarketSymbol,AnswerVerbosity.Compact,["high_price","low_price"]),snapshot,null,[]);
Must(highLow.Contains("1,230 ریال") && highLow.Contains("1,090 ریال") && !highLow.Contains("آخرین قیمت"),"high/low answer must use Cashmarket session range");
var classification=composer.Compose(new AnswerComposeContext("بازار، تابلو و صنعت تست چیست؟",ChatIntent.MarketSymbol,AnswerVerbosity.Compact,["market","board","industry","state"]),snapshot,null,[]);
Must(classification.Contains("بورس") && classification.Contains("بازار اول - اصلی") && classification.Contains("فلزات اساسی") && classification.Contains("مجاز"),"market classification answer must preserve Cashmarket dimensions");
var derived=composer.Compose(new AnswerComposeContext("میانگین قیمت و نسبت گردش تست",ChatIntent.MarketSymbol,AnswerVerbosity.Compact,["average_trade_price","turnover_ratio"]),snapshot,null,[]);
Must(derived.Contains("1,200.00 ریال") && derived.Contains("5.0000٪"),"derived Cashmarket metrics must be deterministic");
var filler=string.Join(" ",Enumerable.Range(1,20).Select(i=>$"بخش عمومی شماره {i} درباره تاریخچه سازمان توضیح می‌دهد."));
var parentText=$"{filler} مصطفی مهدوی مدیرعامل جدید سازمان است و سوابق مدیر قبلی نیز نگهداری می‌شود. {filler}";
var parentHit=new KnowledgeHit(parentText,0.95,new KnowledgeCitation("cms_content","91","تغییر مدیریت",null,null,null),new Dictionary<string,object?>{{"retrieval_scope","parent_document"},{"document_chunk_count","3"}});
var summarized=composer.Compose(new AnswerComposeContext("مدیرعامل جدید سازمان کیست؟",ChatIntent.Knowledge,AnswerVerbosity.Standard),null,null,[parentHit]);
Must(summarized.Contains("مصطفی مهدوی") && summarized.Length<parentText.Length,"answer must summarize the full parent document around the question");
var full=composer.Compose(new AnswerComposeContext("کل متن سند مدیرعامل جدید را بده",ChatIntent.Knowledge,AnswerVerbosity.Analytical),null,null,[parentHit]);
Must(full.Contains(parentText,StringComparison.Ordinal),"explicit full-text request must return the complete parent document");
var ipoWithSymbol=CanonicalCompanyQuestion.Parse("آخرین عرضه اولیه چه شرکتی بود و نمادش چیست؟");
Must(ipoWithSymbol.Aggregate==CompanyAggregateKind.LatestIpo&&ipoWithSymbol.Lookups.Count==0
     &&ipoWithSymbol.Fields.Contains("symbol"),"latest IPO plus ticker must remain one canonical Company query");
var compoundCompanyState=CanonicalCompanyStateQuestion.Parse("مدیرعامل خودرو کیست و دلیل وضعیت فعلی نمادش چیست؟");
Must(compoundCompanyState.IsMatch&&compoundCompanyState.ExplicitStateContext&&compoundCompanyState.LookupHint=="خودرو"
     &&compoundCompanyState.Fields.Contains("ceo")&&compoundCompanyState.Fields.Contains("reason"),
    "compound current-company question must keep only its actual symbol as lookup");
Must(CanonicalQuestionOwnership.Detect("مدیرعامل خودرو کیست و دلیل وضعیت نمادش چیست؟")==CanonicalQuestionDomain.CompanyState,
    "natural Persian issuer CEO questions must use Companystate, not the exchange organization chart");
var canonicalCompany=new CanonicalReferenceAnswer("مدیرعامل ثبت‌شده سعید زرندی است.",
    new("company_state","وضعیت فولاد","فولاد مبارکه",null,[]),
    [new("ceo","سعید زرندی","Companystate:1"),new("symbol","فولاد","Companystate:1")],true,[],[]);
var composite=PersianQuestionFacetAnalysis.AnalyzeCanonicalMarket(
    "مدیرعامل فولاد مبارکه کیست و آخرین قیمت نماد فولاد چقدر است؟",canonicalCompany);
Must(composite.IsComposite&&composite.Symbol=="فولاد"&&composite.MarketFields.SequenceEqual(["last_price"]),
    "canonical CEO plus market price must execute both bounded facets");
Must(!PersianQuestionFacetAnalysis.AnalyzeCanonicalMarket("مدیرعامل فولاد مبارکه کیست؟",canonicalCompany).IsComposite,
    "a canonical-only question must not invoke market tools");
Must(PersianQuestionFacetAnalysis.TryExtractTargetedNewsEntity("آخرین خبر فملی چیست و حجم معاملاتش چقدر است؟")=="فملی",
    "symbol-specific news extraction must preserve an arbitrary ticker");
Must(PersianQuestionFacetAnalysis.TryExtractTargetedNewsEntity("جدیدترین خبر نماد خودرو را بگو")=="خودرو",
    "targeted-news extraction must not be hard-coded to one example symbol");
Must(PersianQuestionFacetAnalysis.TryExtractTargetedNewsEntity("خبر جدیدی از خودرو داری؟ اگر هست خلاصه یک خطی بده")=="خودرو",
    "natural from-entity news wording must preserve the target symbol");
Must(PersianQuestionFacetAnalysis.TryExtractTargetedNewsEntity("نام شرکت فملی چیست و آخرین خبرش را بگو")=="فملی",
    "a possessive news facet must inherit the entity from the preceding clause");
Must(PersianQuestionFacetAnalysis.TryExtractTargetedNewsEntity("امروز چندمه و آخرین خبر بورس تهران چیست؟") is null,
    "global exchange news must not be misread as ticker-specific news");
Must(PersianQuestionFacetAnalysis.SplitIndependentClauses("امروز چندمه و آخرین خبر بورس تهران چیست؟").Count==2,
    "independent clock and news clauses must be decomposed before routing");
Must(PersianQuestionFacetAnalysis.TryExtractDescriptiveEntity("درباره فملی چه میدانی و قیمت پایانی آن چقدر است؟")=="فملی",
    "descriptive compound questions must retain their arbitrary entity");
var comparisonEntities=PersianQuestionFacetAnalysis.TryExtractMarketComparisonEntities(
    "بین فملی و فولاد کدام ارزش معاملات بیشتری دارد و اختلافشان چقدر است؟");
Must(comparisonEntities is { Primary:"فملی",Secondary:"فولاد" },
    "fresh-turn comparison must bind both entities without prior conversation state");
var latestIpoCeo=CanonicalCompanyQuestion.Parse("آخرین عرضه اولیه چه زمانی بوده و مدیرعامل آن شرکت کیست؟");
Must(latestIpoCeo.Aggregate==CompanyAggregateKind.LatestIpo&&latestIpoCeo.Lookups.Count==0
     &&latestIpoCeo.Fields.Contains("ceo"),"IPO pronouns must retain the aggregate and requested CEO facet");
var latestIpoBoundFacets=CanonicalCompanyQuestion.Parse("آخرین شرکتی که عرضه اولیه شده متعلق به کدام تالار است و مدیرعاملش کیست؟");
Must(latestIpoBoundFacets.Aggregate==CompanyAggregateKind.LatestIpo&&latestIpoBoundFacets.Lookups.Count==0
     &&latestIpoBoundFacets.Fields.Contains("hall")&&latestIpoBoundFacets.Fields.Contains("ceo"),
    $"relative-clause IPO wording must bind hall and CEO to the ranked company: aggregate={latestIpoBoundFacets.Aggregate};lookups={string.Join('|',latestIpoBoundFacets.Lookups)};fields={string.Join('|',latestIpoBoundFacets.Fields)}");
var absentIssuerComposite=CanonicalCompanyStateQuestion.Parse("مدیرعامل فملی کیست و نسبت P/E آن چقدر است؟");
Must(absentIssuerComposite.LookupHint=="فملی"&&absentIssuerComposite.Fields.Contains("ceo"),
    "market metric words and pronouns must not contaminate issuer lookup extraction");
var stateBoundFacets=CanonicalCompanyStateQuestion.Parse("وضعیت خساپا را بگو، سپس دلیلش و مدیرعامل شرکت را هم اضافه کن");
Must(stateBoundFacets.LookupHint=="خساپا"&&stateBoundFacets.Fields.Contains("status")
     &&stateBoundFacets.Fields.Contains("reason")&&stateBoundFacets.Fields.Contains("ceo"),
    "same-subject state facets must not contaminate the issuer lookup");
var clientTypeRanking=CanonicalClientTypeQuestion.Parse("اگر فقط حقیقی‌ها را در نظر بگیریم کدام نماد بیشترین خرید را داشته است؟");
Must(clientTypeRanking.Aggregate==ClientTypeAggregateKind.Ranking&&clientTypeRanking.RankingField=="individual_buy_volume",
    "participant-first ranking wording must bind to individual buy volume");
Must(new ChatToolPolicy().IsAllowed("answer.compose.composite"),
    "deterministic composite composition must remain explicitly allow-listed");
Must(new ChatToolPolicy().IsAllowed("structured.reference.facets"),
    "bounded clause-level canonical lookup must remain explicitly allow-listed");
Must(CanonicalReferenceToolRegistry.Resolve("client_type_aggregate","رتبه‌بندی حقیقی")==CanonicalReferenceToolNames.ClientType,
    "ClientType aggregates must retain their typed SQL audit tool");
Console.WriteLine("TSEAI evidence/citation smoke PASS");
static void Must(bool ok,string msg){if(!ok)throw new Exception(msg);}
