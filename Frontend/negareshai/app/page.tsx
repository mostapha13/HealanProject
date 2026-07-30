"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ComparisonRun, ComparisonRunSummary, ContractBaseDocument, ContractDetail, ContractGeneration, ContractItem, ContractStatusDefinition, ContractTemplate, DashboardResponse, DocumentDetail, DocumentGroup, DocumentListItem, OrganizationParty, RuleSet, RuntimeSetting, archiveContract, archiveDocument, createDocumentGroup, createRuleSet, deleteContractCatalog, downloadComparisonReport, downloadDocumentVersion, generateContract, getComparisonRun, getContract, getDashboard, getDocumentDetail, listArchivedDocuments, listComparisonRuns, listContractCatalog, listContracts, listContractTemplates, listDocumentGroups, listDocuments, listRuleSets, listRuntimeSettings, login, restoreDocument, reviewContractGeneration, reviewFinding, saveContract, saveContractCatalog, startComparison, updateDocument, uploadContractTemplate, uploadDocument, uploadDocumentVersion } from "../lib/api";
import { formatJalaliDate, formatJalaliLongDate, gregorianYmdToJalali, JALALI_MONTH_NAMES, toPersianDigits } from "../lib/jalali";
import PersianCalendar from "./PersianCalendar";

type IconName = "grid"|"file"|"contract"|"compare"|"sparkles"|"chart"|"settings"|"search"|"bell"|"plus"|"upload"|"more"|"arrow"|"clock"|"check"|"shield"|"menu"|"close";

function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  const paths: Record<IconName, React.ReactNode> = {
    grid:<>
<rect x="3" y="3" width="7" height="7" rx="2"/>
<rect x="14" y="3" width="7" height="7" rx="2"/>
<rect x="3" y="14" width="7" height="7" rx="2"/>
<rect x="14" y="14" width="7" height="7" rx="2"/>
</>,
    file:<>
<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
<path d="M14 2v6h6M8 13h8M8 17h6"/>
</>,
    contract:<>
<path d="M6 2h9l5 5v15H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z"/>
<path d="M14 2v6h6M8 13h8M8 17h5"/>
<path d="m15 20 2 2 4-4"/>
</>,
    compare:<>
<path d="M8 3 4 7l4 4M4 7h16M16 21l4-4-4-4M20 17H4"/>
</>,
    sparkles:<>
<path d="m12 3 1.2 3.8L17 8l-3.8 1.2L12 13l-1.2-3.8L7 8l3.8-1.2z"/>
<path d="m5 14 .8 2.2L8 17l-2.2.8L5 20l-.8-2.2L2 17l2.2-.8zM19 13l.7 1.3L21 15l-1.3.7L19 17l-.7-1.3L17 15l1.3-.7z"/>
</>,
    chart:<>
<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>
</>,
    settings:<>
<circle cx="12" cy="12" r="3"/>
<path d="M19 15a2 2 0 0 0 .4 2l-2.8 2.8a2 2 0 0 0-2-.4A2 2 0 0 0 13 21h-4a2 2 0 0 0-1.6-1.6 2 2 0 0 0-2 .4L2.6 17a2 2 0 0 0 .4-2A2 2 0 0 0 1 13V9a2 2 0 0 0 2-1.4 2 2 0 0 0-.4-2L5.4 2.8a2 2 0 0 0 2 .4A2 2 0 0 0 9 1h4a2 2 0 0 0 1.6 2.2 2 2 0 0 0 2-.4l2.8 2.8a2 2 0 0 0-.4 2A2 2 0 0 0 21 9v4a2 2 0 0 0-2 2z"/>
</>,
    search:<>
<circle cx="11" cy="11" r="7"/>
<path d="m20 20-4-4"/>
</>,
    bell:<>
<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/>
</>,
    plus:<path d="M12 5v14M5 12h14"/>,upload:<>
<path d="M12 16V4M7 9l5-5 5 5"/>
<path d="M4 15v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4"/>
</>,
    more:<>
<circle cx="5" cy="12" r="1"/>
<circle cx="12" cy="12" r="1"/>
<circle cx="19" cy="12" r="1"/>
</>,
    arrow:<path d="m9 18 6-6-6-6"/>,clock:<>
<circle cx="12" cy="12" r="9"/>
<path d="M12 7v5l3 2"/>
</>,check:<path d="m5 12 4 4L19 6"/>,
    shield:<>
<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
<path d="m9 12 2 2 4-4"/>
</>,menu:<path d="M4 7h16M4 12h16M4 17h16"/>,close:<path d="m6 6 12 12M18 6 6 18"/>
  };
  return <svg aria-hidden="true" viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
}

const navItems:{id:string;label:string;icon:IconName}[]=[
  {id:"overview",label:"نمای کلی",icon:"grid"},{id:"documents",label:"اسناد",icon:"file"},{id:"contracts",label:"قراردادها",icon:"contract"},{id:"comparison",label:"تطبیق اسناد",icon:"compare"},{id:"assistant",label:"دستیار هوشمند",icon:"sparkles"},{id:"reports",label:"گزارش‌ها",icon:"chart"}
];
function formatDate(value:string){return formatJalaliDate(value)||value}
function fullCurrentDate(){return formatJalaliLongDate()}
function activityTitle(action:string){return ({"document.uploaded":"سند جدید بارگذاری شد","document.registered":"سند جدید ثبت شد","document.updated":"مشخصات سند ویرایش شد","document.version-created":"نسخه جدید سند ایجاد شد","document.viewed":"سند مشاهده شد","document.deleted":"سند بایگانی شد","runtime-setting.upserted":"تنظیمات سامانه به‌روزرسانی شد"} as Record<string,string>)[action]??action}
function legacyContractStatus(value:number){return ({1:"پیش‌نویس",2:"در حال بررسی",3:"نیازمند اصلاح",4:"تأییدشده",5:"امضاشده",6:"فعال",7:"منقضی‌شده",8:"فسخ‌شده",9:"بایگانی‌شده"} as Record<number,string>)[value]??"نامشخص"}

export default function Home(){
  const fileInput=useRef<HTMLInputElement>(null);
  const [documents,setDocuments]=useState<DocumentListItem[]>([]);
  const [archivedDocuments,setArchivedDocuments]=useState<DocumentListItem[]>([]);
  const [showArchive,setShowArchive]=useState(false);
  const [dashboard,setDashboard]=useState<DashboardResponse|null>(null);
  const [settings,setSettings]=useState<RuntimeSetting[]>([]);
  const [contracts,setContracts]=useState<ContractItem[]>([]);
  const [contractTemplates,setContractTemplates]=useState<ContractTemplate[]>([]);
  const [contractStatuses,setContractStatuses]=useState<ContractStatusDefinition[]>([]);
  const [contractBaseDocuments,setContractBaseDocuments]=useState<ContractBaseDocument[]>([]);
  const [organizationParties,setOrganizationParties]=useState<OrganizationParty[]>([]);
  const [statusDraft,setStatusDraft]=useState({name:"",order:1,color:"#6658df"});
  const [baseDocumentDraft,setBaseDocumentDraft]=useState({name:"",documentId:"",description:""});
  const [partyDraft,setPartyDraft]=useState({name:"",nationalIdentifier:"",representativeName:"",contactInfo:""});
  const [generation,setGeneration]=useState<ContractGeneration|null>(null);
  const [generationDraft,setGenerationDraft]=useState({contractId:"",contractTemplateId:"",userInstruction:"",sourceDocumentIds:[] as string[]});
  const [templateDraft,setTemplateDraft]=useState({name:"",contractType:"",description:""});
  const [templateFile,setTemplateFile]=useState<File|null>(null);
  const [documentGroups,setDocumentGroups]=useState<DocumentGroup[]>([]);
  const [ruleSets,setRuleSets]=useState<RuleSet[]>([]);
  const [comparisonRuns,setComparisonRuns]=useState<ComparisonRunSummary[]>([]);
  const [selectedRun,setSelectedRun]=useState<ComparisonRun|null>(null);
  const [comparisonDraft,setComparisonDraft]=useState({targetDocumentId:"",basisMode:4,documentGroupId:"",ruleSetIds:[] as string[],referenceDocumentId:"",userInstruction:""});
  const [knowledgeOpen,setKnowledgeOpen]=useState(false);
  const [groupDraft,setGroupDraft]=useState({name:"",description:"",documentIds:[] as string[]});
  const [ruleDraft,setRuleDraft]=useState({name:"",documentGroupId:"",code:"",title:"",instruction:"",severity:3,key:"requiredTerm",value:""});
  const [selectedDocument,setSelectedDocument]=useState<DocumentDetail|null>(null);
  const [contractDraft,setContractDraft]=useState<ContractDetail|null>(null);
  const [contractOpen,setContractOpen]=useState(false);
  const [loginOpen,setLoginOpen]=useState(false);
  const [username,setUsername]=useState("");
  const [password,setPassword]=useState("");
  const [activeSection,setActiveSection]=useState("overview");
  const [loadError,setLoadError]=useState("");
  const [search,setSearch]=useState(""); const [loading,setLoading]=useState(true);
  const [sidebarOpen,setSidebarOpen]=useState(false); const [uploadOpen,setUploadOpen]=useState(false);
  const [file,setFile]=useState<File|null>(null); const [title,setTitle]=useState("");
  const [versionFile,setVersionFile]=useState<File|null>(null); const [changeSummary,setChangeSummary]=useState("");
  const [progress,setProgress]=useState(0); const [notice,setNotice]=useState("");
  const refresh=useCallback(async()=>{setLoading(true);setLoadError("");try{const [result,documentResult,runtimeSettings,contractResult,archived,groups,rules,runs,templates,statuses,baseDocs,parties]=await Promise.all([getDashboard(),listDocuments(),listRuntimeSettings(),listContracts(),listArchivedDocuments(),listDocumentGroups(),listRuleSets(),listComparisonRuns(),listContractTemplates(),listContractCatalog<ContractStatusDefinition>("statuses"),listContractCatalog<ContractBaseDocument>("base-documents"),listContractCatalog<OrganizationParty>("parties")]);setDashboard(result);setDocuments(documentResult.items);setSettings(runtimeSettings);setContracts(contractResult.items);setArchivedDocuments(archived);setDocumentGroups(groups);setRuleSets(rules);setComparisonRuns(runs);setContractTemplates(templates);setContractStatuses(statuses);setContractBaseDocuments(baseDocs);setOrganizationParties(parties)}catch{setDashboard(null);setDocuments([]);setArchivedDocuments([]);setSettings([]);setContracts([]);setDocumentGroups([]);setRuleSets([]);setComparisonRuns([]);setContractTemplates([]);setContractStatuses([]);setContractBaseDocuments([]);setOrganizationParties([]);setLoadError("برای مشاهده اطلاعات سازمان وارد سامانه شوید یا ارتباط API را بررسی کنید.")}finally{setLoading(false)}},[]);
  useEffect(()=>{void refresh()},[refresh]);
  const visibleDocuments=useMemo(()=>{const q=search.trim();return q?documents.filter(x=>x.title.includes(q)||x.documentType.includes(q)):documents},[documents,search]);
  async function submitUpload(){if(!file){setNotice("لطفاً یک فایل PDF یا Word انتخاب کنید.");return}setNotice("در حال انتقال امن فایل...");setProgress(0);try{await uploadDocument({file,title:title||file.name},setProgress);setNotice("سند با موفقیت ثبت شد.");setFile(null);setTitle("");await refresh();window.setTimeout(()=>setUploadOpen(false),700)}catch(error){setNotice(error instanceof Error?error.message:"ثبت سند انجام نشد.")}}
  async function authenticate(){setNotice("");try{await login(username,password);setPassword("");setLoginOpen(false);await refresh()}catch(error){setNotice(error instanceof Error?error.message:"ورود انجام نشد")}}
  async function openDocument(documentId:string,includeArchived=false){try{setSelectedDocument(await getDocumentDetail(documentId,includeArchived));setVersionFile(null);setChangeSummary("")}catch(error){setNotice(error instanceof Error?error.message:"جزئیات سند دریافت نشد")}}
  async function removeDocument(documentId:string){if(!window.confirm("این سند بایگانی شود؟"))return;try{await archiveDocument(documentId);setSelectedDocument(null);await refresh()}catch(error){setNotice(error instanceof Error?error.message:"بایگانی انجام نشد")}}
  async function recoverDocument(documentId:string){try{await restoreDocument(documentId);setSelectedDocument(null);await refresh();setNotice("سند با موفقیت بازیابی شد.")}catch(error){setNotice(error instanceof Error?error.message:"بازیابی انجام نشد")}}
  async function saveDocumentDetails(){if(!selectedDocument)return;try{await updateDocument(selectedDocument.id,{title:selectedDocument.title,documentType:selectedDocument.documentType,confidentialityLevel:selectedDocument.confidentialityLevel});setSelectedDocument(await getDocumentDetail(selectedDocument.id));await refresh();setNotice("مشخصات سند ذخیره شد.")}catch(error){setNotice(error instanceof Error?error.message:"ویرایش سند انجام نشد")}}
  async function submitVersion(){if(!selectedDocument||!versionFile){setNotice("فایل نسخه جدید را انتخاب کنید.");return}try{await uploadDocumentVersion(selectedDocument.id,versionFile,changeSummary);setSelectedDocument(await getDocumentDetail(selectedDocument.id));setVersionFile(null);setChangeSummary("");await refresh();setNotice("نسخه جدید سند ثبت شد.")}catch(error){setNotice(error instanceof Error?error.message:"ثبت نسخه جدید انجام نشد")}}
  function newContract(){const base=contractBaseDocuments.find(x=>x.isActive);const status=contractStatuses.find(x=>x.isActive);setContractDraft({id:"",documentId:base?.documentId??"",baseDocumentProfileId:base?.id,statusDefinitionId:status?.id,statusName:status?.name,subject:"",status:1,currency:"IRR",partyCount:0,parties:[],updatedAtUtc:new Date().toISOString(),createdAtUtc:new Date().toISOString()});setContractOpen(true)}
  async function editContract(id:string){try{const item=await getContract(id);const status=item.statusDefinitionId?undefined:contractStatuses.find(x=>x.order===item.status);setContractDraft(status?{...item,statusDefinitionId:status.id,statusName:status.name}:item);setContractOpen(true)}catch(error){setNotice(error instanceof Error?error.message:"قرارداد دریافت نشد")}}
  async function submitContract(){if(!contractDraft?.documentId||!contractDraft.subject.trim()){setNotice("سند و موضوع قرارداد الزامی است.");return}try{await saveContract({...contractDraft,id:contractDraft.id||undefined});setContractOpen(false);setContractDraft(null);await refresh()}catch(error){setNotice(error instanceof Error?error.message:"ثبت قرارداد انجام نشد")}}
  async function removeContract(id:string){if(!window.confirm("قرارداد بایگانی شود؟"))return;try{await archiveContract(id);await refresh()}catch(error){setNotice(error instanceof Error?error.message:"بایگانی قرارداد انجام نشد")}}
  async function executeComparison(){if(!comparisonDraft.targetDocumentId){setNotice("سند هدف را انتخاب کنید.");return}try{setNotice("در حال اجرای تطابق خصوصی...");const run=await startComparison({...comparisonDraft,documentGroupId:comparisonDraft.documentGroupId||undefined,referenceDocumentId:comparisonDraft.referenceDocumentId||undefined});setSelectedRun(run);setNotice("تطابق تکمیل شد.");await refresh()}catch(error){setNotice(error instanceof Error?error.message:"تطابق انجام نشد")}}
  async function openComparison(id:string){try{setSelectedRun(await getComparisonRun(id))}catch(error){setNotice(error instanceof Error?error.message:"نتیجه دریافت نشد")}}
  async function decideFinding(id:string,decision:number){if(!selectedRun)return;const comment=window.prompt("نظر کارشناس (اختیاری)")??undefined;let correctedReason:string|undefined;if(decision===4){correctedReason=window.prompt("دلیل اصلاح‌شده را وارد کنید")??undefined;if(!correctedReason)return}try{await reviewFinding(id,{decision,comment,correctedReason});setSelectedRun(await getComparisonRun(selectedRun.id));await refresh()}catch(error){setNotice(error instanceof Error?error.message:"ثبت تصمیم انجام نشد")}}
  async function submitGroup(){if(!groupDraft.name.trim()||!groupDraft.documentIds.length){setNotice("نام گروه و حداقل یک سند الزامی است.");return}try{await createDocumentGroup(groupDraft);setGroupDraft({name:"",description:"",documentIds:[]});await refresh();setNotice("گروه اسناد ثبت شد.")}catch(error){setNotice(error instanceof Error?error.message:"ثبت گروه انجام نشد")}}
  async function submitRuleSet(){if(!ruleDraft.name.trim()||!ruleDraft.title.trim()||!ruleDraft.value.trim()){setNotice("نام مجموعه، عنوان قاعده و مقدار معیار الزامی است.");return}try{await createRuleSet({name:ruleDraft.name,documentGroupId:ruleDraft.documentGroupId||undefined,effectiveFromUtc:new Date().toISOString(),rules:[{code:ruleDraft.code||"RULE-1",title:ruleDraft.title,instruction:ruleDraft.instruction||"نیازمند بررسی کارشناس",severity:ruleDraft.severity,order:1,parameters:[{key:ruleDraft.key,valueJson:JSON.stringify({value:ruleDraft.value})}]}]});setRuleDraft({name:"",documentGroupId:"",code:"",title:"",instruction:"",severity:3,key:"requiredTerm",value:""});await refresh();setNotice("مجموعه قواعد ثبت شد.")}catch(error){setNotice(error instanceof Error?error.message:"ثبت قواعد انجام نشد")}}
  async function submitTemplate(){if(!templateFile||!templateDraft.name.trim()){setNotice("نام و فایل DOCX قالب الزامی است.");return}try{await uploadContractTemplate({...templateDraft,file:templateFile});setTemplateFile(null);setTemplateDraft({name:"",contractType:"",description:""});await refresh();setNotice("قالب رسمی سازمان ثبت شد.")}catch(error){setNotice(error instanceof Error?error.message:"ثبت قالب انجام نشد")}}
  async function executeGeneration(){if(!generationDraft.contractId||!generationDraft.contractTemplateId||!generationDraft.userInstruction.trim()){setNotice("قرارداد مبنا، قالب و دستور فارسی الزامی است.");return}try{setNotice("در حال تحلیل دستور و تولید پیش‌نویس خصوصی...");setGeneration(await generateContract(generationDraft));setNotice("پیشنهاد تولید شد؛ diff و محاسبات را بررسی کنید.")}catch(error){setNotice(error instanceof Error?error.message:"تولید قرارداد انجام نشد")}}
  async function decideGeneration(approved:boolean){if(!generation)return;try{setGeneration(await reviewContractGeneration(generation.id,approved,window.prompt("توضیح تصمیم")??undefined));await refresh();setNotice(approved?"نسخه تأییدشده به تاریخچه سند افزوده شد.":"پیشنهاد رد شد.")}catch(error){setNotice(error instanceof Error?error.message:"ثبت تصمیم انجام نشد")}}
  function renderAssistant(){const parse=(value?:string)=>{try{return value?JSON.parse(value):null}catch{return null}};return <div className="generation-workspace">
<article className="panel comparison-builder">
<div className="panel-heading">
<div>
<h2>ایجاد یا تمدید هوشمند قرارداد</h2>
<p>دستور فارسی به ChangeSet قابل ممیزی تبدیل می‌شود</p>
</div>
</div>
<div className="form-grid">
<label className="field">
<span>قرارداد مبنا</span>
<select value={generationDraft.contractId} onChange={e=>setGenerationDraft({...generationDraft,contractId:e.target.value})}>
<option value="">انتخاب قرارداد</option>{contracts.map(item=>
<option key={item.id} value={item.id}>{item.subject}</option>)}</select>
</label>
<label className="field">
<span>قالب رسمی سازمان</span>
<select value={generationDraft.contractTemplateId} onChange={e=>setGenerationDraft({...generationDraft,contractTemplateId:e.target.value})}>
<option value="">انتخاب قالب</option>{contractTemplates.map(item=>
<option key={item.id} value={item.id}>{item.name} · نسخه {toPersianDigits(item.version)}</option>)}</select>
</label>
<label className="field full">
<span>منابع مجاز RAG</span>
<div className="choice-grid">{documents.map(item=>
<label key={item.id}>
<input type="checkbox" checked={generationDraft.sourceDocumentIds.includes(item.id)} onChange={e=>setGenerationDraft({...generationDraft,sourceDocumentIds:e.target.checked?[...generationDraft.sourceDocumentIds,item.id]:generationDraft.sourceDocumentIds.filter(id=>id!==item.id)})}/>
<span>{item.title}</span>
</label>)}</div>
</label>
<label className="field full">
<span>دستور فارسی</span>
<textarea value={generationDraft.userInstruction} onChange={e=>setGenerationDraft({...generationDraft,userInstruction:e.target.value})} placeholder="قرارداد را از ۱۴۰۵/۰۱/۰۱ تا ۱۴۰۵/۱۲/۲۹ با افزایش ۲۵ درصد تمدید کن و بند حل اختلاف از طریق مذاکره را اضافه کن."/>
</label>
</div>
<button className="primary-button comparison-run-button" onClick={()=>void executeGeneration()}>
<Icon name="sparkles" size={17}/>تحلیل و تولید پیش‌نویس</button>
</article>
<article className="panel comparison-builder">
<h2>ثبت قالب و سربرگ سازمانی</h2>
<div className="form-grid">
<label className="field">
<span>نام قالب</span>
<input value={templateDraft.name} onChange={e=>setTemplateDraft({...templateDraft,name:e.target.value})}/>
</label>
<label className="field">
<span>نوع قرارداد</span>
<input value={templateDraft.contractType} onChange={e=>setTemplateDraft({...templateDraft,contractType:e.target.value})}/>
</label>
<label className="field full">
<span>توضیح</span>
<input value={templateDraft.description} onChange={e=>setTemplateDraft({...templateDraft,description:e.target.value})}/>
</label>
<label className="field full">
<span>فایل DOCX دارای placeholder</span>
<input type="file" accept=".docx" onChange={e=>setTemplateFile(e.target.files?.[0]??null)}/>
</label>
</div>
<button className="ghost-button" onClick={()=>void submitTemplate()}>ثبت نسخه قالب</button>
</article>{generation&&<article className="panel generation-result">
<div className="panel-heading">
<div>
<h2>پیشنهاد قابل بررسی</h2>
<p>{formatDate(generation.createdAtUtc)} · {generation.modelId}</p>
</div>
<span className={`contract-status s-${generation.status}`}>وضعیت {toPersianDigits(generation.status)}</span>
</div>{generation.clarificationQuestionsJson?<div className="notice">{(parse(generation.clarificationQuestionsJson)??[]).join(" ")}</div>:<>
<h3>تغییرات</h3>
<pre>{JSON.stringify(parse(generation.diffJson),null,2)}</pre>
<h3>محاسبات قطعی</h3>
<pre>{JSON.stringify(parse(generation.calculationSnapshotJson),null,2)}</pre>
<h3>منابع snapshot شده</h3>
<pre>{JSON.stringify(parse(generation.sourceSnapshotJson),null,2)}</pre>{generation.status===2&&<div className="modal-actions">
<button className="danger-button" onClick={()=>void decideGeneration(false)}>رد پیشنهاد</button>
<button className="primary-button" onClick={()=>void decideGeneration(true)}>تأیید انسانی و ثبت نسخه</button>
</div>}</>}</article>}{notice&&<div className="notice">{notice}</div>}</div>}
  async function addStatus(){if(!statusDraft.name.trim())return;try{await saveContractCatalog("statuses",{...statusDraft,isActive:true});setStatusDraft({name:"",order:contractStatuses.length+1,color:"#6658df"});await refresh()}catch(error){setNotice(error instanceof Error?error.message:"ثبت وضعیت انجام نشد")}}
  async function addBaseDocument(){if(!baseDocumentDraft.name.trim()||!baseDocumentDraft.documentId)return;try{await saveContractCatalog("base-documents",{...baseDocumentDraft,isActive:true});setBaseDocumentDraft({name:"",documentId:"",description:""});await refresh()}catch(error){setNotice(error instanceof Error?error.message:"ثبت سند مبنا انجام نشد")}}
  async function addParty(){if(!partyDraft.name.trim())return;try{await saveContractCatalog("parties",{...partyDraft,isActive:true});setPartyDraft({name:"",nationalIdentifier:"",representativeName:"",contactInfo:""});await refresh()}catch(error){setNotice(error instanceof Error?error.message:"ثبت طرف قرارداد انجام نشد")}}
  async function removeCatalog(kind:"statuses"|"base-documents"|"parties",id:string){if(!window.confirm("این گزینه حذف شود؟"))return;try{await deleteContractCatalog(kind,id);await refresh()}catch(error){setNotice(error instanceof Error?error.message:"حذف انجام نشد")}}
  async function renameCatalog(kind:"statuses"|"base-documents"|"parties",item:ContractStatusDefinition|ContractBaseDocument|OrganizationParty){const name=window.prompt("نام جدید",item.name);if(!name?.trim())return;try{if(kind==="statuses"){const value=item as ContractStatusDefinition;await saveContractCatalog(kind,{name,order:value.order,color:value.color,isActive:value.isActive},value.id)}else if(kind==="base-documents"){const value=item as ContractBaseDocument;await saveContractCatalog(kind,{name,documentId:value.documentId,description:value.description,isActive:value.isActive},value.id)}else{const value=item as OrganizationParty;await saveContractCatalog(kind,{name,nationalIdentifier:value.nationalIdentifier,representativeName:value.representativeName,contactInfo:value.contactInfo,isActive:value.isActive},value.id)}await refresh()}catch(error){setNotice(error instanceof Error?error.message:"ویرایش انجام نشد")}}
  function renderComparison(){
    const outcomeLabel=(value?:number)=>value===1?"منطبق":value===2?"نامنطبق":"نیازمند بررسی";
    const typeLabel=(value:number)=>({1:"منطبق",2:"مفقود",3:"ممنوع",4:"متفاوت",5:"اضافی"} as Record<number,string>)[value]??"نامشخص";
    return <div className="comparison-workspace">
      <article className="panel comparison-builder">
        <div className="panel-heading">
<div>
<h2>اجرای تطابق جدید</h2>
<p>مبنای بررسی و منابع مجاز را انتخاب کنید</p>
</div>
<button className="ghost-button" onClick={()=>setKnowledgeOpen(x=>!x)}>{knowledgeOpen?"بستن مدیریت دانش":"مدیریت گروه و قواعد"}</button>
</div>
        <div className="form-grid">
          <label className="field">
<span>سند هدف</span>
<select value={comparisonDraft.targetDocumentId} onChange={e=>setComparisonDraft({...comparisonDraft,targetDocumentId:e.target.value})}>
<option value="">انتخاب سند پردازش‌شده</option>{documents.map(item=>
<option key={item.id} value={item.id}>{item.title}</option>)}</select>
</label>
          <label className="field">
<span>نوع مبنا</span>
<select value={comparisonDraft.basisMode} onChange={e=>setComparisonDraft({...comparisonDraft,basisMode:Number(e.target.value)})}>
<option value={1}>گروه اسناد</option>
<option value={2}>مجموعه قواعد</option>
<option value={3}>سند مرجع</option>
<option value={4}>ترکیبی</option>
</select>
</label>
          <label className="field">
<span>گروه اسناد</span>
<select value={comparisonDraft.documentGroupId} onChange={e=>setComparisonDraft({...comparisonDraft,documentGroupId:e.target.value})}>
<option value="">بدون گروه</option>{documentGroups.map(item=>
<option key={item.id} value={item.id}>{item.name}</option>)}</select>
</label>
          <label className="field">
<span>سند مرجع</span>
<select value={comparisonDraft.referenceDocumentId} onChange={e=>setComparisonDraft({...comparisonDraft,referenceDocumentId:e.target.value})}>
<option value="">بدون سند مرجع</option>{documents.filter(item=>item.id!==comparisonDraft.targetDocumentId).map(item=>
<option key={item.id} value={item.id}>{item.title}</option>)}</select>
</label>
          <label className="field full">
<span>مجموعه قواعد</span>
<div className="choice-grid">{ruleSets.map(item=>
<label key={item.id}>
<input type="checkbox" checked={comparisonDraft.ruleSetIds.includes(item.id)} onChange={e=>setComparisonDraft({...comparisonDraft,ruleSetIds:e.target.checked?[...comparisonDraft.ruleSetIds,item.id]:comparisonDraft.ruleSetIds.filter(id=>id!==item.id)})}/>
<span>{item.name} · نسخه {new Intl.NumberFormat("fa-IR").format(item.version)}</span>
</label>)}</div>
</label>
          <label className="field full">
<span>دستور تکمیلی کارشناس</span>
<textarea value={comparisonDraft.userInstruction} onChange={e=>setComparisonDraft({...comparisonDraft,userInstruction:e.target.value})} placeholder="مثلاً اختلاف سرمایه، تاریخ گزارش و بند محرمانگی را بررسی کن."/>
</label>
        </div>
        {notice&&<div className="notice">{notice}</div>}
        <button className="primary-button comparison-run-button" onClick={()=>void executeComparison()}>
<Icon name="sparkles" size={17}/>اجرای تطابق خصوصی</button>
      </article>
      {knowledgeOpen&&<section className="knowledge-grid">
        <article className="panel">
<h2>گروه اسناد جدید</h2>
<div className="form-grid">
<label className="field">
<span>نام گروه</span>
<input value={groupDraft.name} onChange={e=>setGroupDraft({...groupDraft,name:e.target.value})}/>
</label>
<label className="field">
<span>توضیح</span>
<input value={groupDraft.description} onChange={e=>setGroupDraft({...groupDraft,description:e.target.value})}/>
</label>
<label className="field full">
<span>اسناد عضو</span>
<div className="choice-grid">{documents.map(item=>
<label key={item.id}>
<input type="checkbox" checked={groupDraft.documentIds.includes(item.id)} onChange={e=>setGroupDraft({...groupDraft,documentIds:e.target.checked?[...groupDraft.documentIds,item.id]:groupDraft.documentIds.filter(id=>id!==item.id)})}/>
<span>{item.title}</span>
</label>)}</div>
</label>
</div>
<button className="primary-button compact" onClick={()=>void submitGroup()}>ثبت گروه</button>
</article>
        <article className="panel">
<h2>مجموعه قاعده جدید</h2>
<div className="form-grid">
<label className="field">
<span>نام مجموعه</span>
<input value={ruleDraft.name} onChange={e=>setRuleDraft({...ruleDraft,name:e.target.value})}/>
</label>
<label className="field">
<span>گروه مرتبط</span>
<select value={ruleDraft.documentGroupId} onChange={e=>setRuleDraft({...ruleDraft,documentGroupId:e.target.value})}>
<option value="">عمومی</option>{documentGroups.map(item=>
<option key={item.id} value={item.id}>{item.name}</option>)}</select>
</label>
<label className="field">
<span>کد قاعده</span>
<input value={ruleDraft.code} onChange={e=>setRuleDraft({...ruleDraft,code:e.target.value})}/>
</label>
<label className="field">
<span>عنوان قاعده</span>
<input value={ruleDraft.title} onChange={e=>setRuleDraft({...ruleDraft,title:e.target.value})}/>
</label>
<label className="field">
<span>نوع معیار</span>
<select value={ruleDraft.key} onChange={e=>setRuleDraft({...ruleDraft,key:e.target.value})}>
<option value="requiredTerm">عبارت الزامی</option>
<option value="forbiddenTerm">عبارت ممنوع</option>
<option value="expectedNumber">عدد مورد انتظار</option>
<option value="regex">الگوی Regex</option>
</select>
</label>
<label className="field">
<span>شدت ۱ تا ۵</span>
<input type="number" min={1} max={5} value={ruleDraft.severity} onChange={e=>setRuleDraft({...ruleDraft,severity:Number(e.target.value)})}/>
</label>
<label className="field full">
<span>مقدار معیار</span>
<input value={ruleDraft.value} onChange={e=>setRuleDraft({...ruleDraft,value:e.target.value})}/>
</label>
<label className="field full">
<span>پیشنهاد اصلاح</span>
<input value={ruleDraft.instruction} onChange={e=>setRuleDraft({...ruleDraft,instruction:e.target.value})}/>
</label>
</div>
<button className="primary-button compact" onClick={()=>void submitRuleSet()}>ثبت RuleSet نسخه‌دار</button>
</article>
      </section>}
      <section className="comparison-results">
        <article className="panel run-history">
<div className="panel-heading">
<div>
<h2>سابقه اجراها</h2>
<p>{new Intl.NumberFormat("fa-IR").format(comparisonRuns.length)} اجرای ثبت‌شده</p>
</div>
</div>{comparisonRuns.length?comparisonRuns.map(run=>
<button key={run.id} className={selectedRun?.id===run.id?"active":""} onClick={()=>void openComparison(run.id)}>
<div>
<strong>{run.targetDocumentTitle}</strong>
<span>{formatDate(run.createdAtUtc)} · {new Intl.NumberFormat("fa-IR").format(run.findingCount)} یافته</span>
</div>
<b className={`outcome-${run.outcome??3}`}>{outcomeLabel(run.outcome)}</b>
<em>{new Intl.NumberFormat("fa-IR").format(run.scorePercent??0)}٪</em>
</button>):<div className="empty-inline">هنوز تطابقی اجرا نشده است.</div>}</article>
        <article className="panel finding-panel">{selectedRun?<>
<div className="finding-summary">
<div>
<span>نتیجه کلی</span>
<strong>{outcomeLabel(selectedRun.outcome)}</strong>
</div>
<div>
<span>امتیاز تطابق</span>
<strong>{new Intl.NumberFormat("fa-IR").format(selectedRun.scorePercent??0)}٪</strong>
</div>
<div>
<span>مدل</span>
<strong>{selectedRun.modelId}</strong>
</div>
<div className="report-actions">
<button onClick={()=>void downloadComparisonReport(selectedRun.id,"docx")}>DOCX</button>
<button onClick={()=>void downloadComparisonReport(selectedRun.id,"pdf")}>PDF</button>
</div>
</div>
<div className="finding-list">{selectedRun.findings.map(finding=>
<article key={finding.id} className={`finding severity-${finding.severity}`}>
<header>
<div>
<b>{typeLabel(finding.type)}</b>
<h3>{finding.title}</h3>
</div>
<span>شدت {new Intl.NumberFormat("fa-IR").format(finding.severity)} · اطمینان {new Intl.NumberFormat("fa-IR").format(finding.confidence*100)}٪</span>
</header>
<p>{finding.correctedReason||finding.reason}</p>{finding.targetEvidence&&<blockquote>صفحه {new Intl.NumberFormat("fa-IR").format(finding.targetPage??1)}: {finding.targetEvidence}</blockquote>}{finding.referenceEvidence&&<blockquote className="reference">مرجع صفحه {new Intl.NumberFormat("fa-IR").format(finding.referencePage??1)}: {finding.referenceEvidence}</blockquote>}{finding.suggestion&&<div className="suggestion">
<Icon name="sparkles" size={15}/>{finding.suggestion}</div>}<footer>{finding.reviewDecision===1?<>
<button onClick={()=>void decideFinding(finding.id,2)}>تأیید یافته</button>
<button onClick={()=>void decideFinding(finding.id,3)}>رد یافته</button>
<button onClick={()=>void decideFinding(finding.id,4)}>اصلاح</button>
</>:<span>تصمیم کارشناس ثبت شده است · وضعیت {new Intl.NumberFormat("fa-IR").format(finding.reviewDecision)}</span>}</footer>
</article>)}</div>
</>:<div className="empty-state">
<Icon name="compare" size={28}/>
<strong>یک اجرای تطابق را انتخاب کنید</strong>
<span>یافته‌ها، شواهد صفحه‌محور و تصمیم‌های کارشناسی اینجا نمایش داده می‌شوند.</span>
</div>}</article>
      </section>
    </div>
  }
  const sectionInfo:Record<string,{title:string;description:string;icon:IconName}>={documents:{title:"مدیریت اسناد",description:"جست‌وجو، نسخه‌بندی و مدیریت امن اسناد سازمان",icon:"file"},contracts:{title:"مدیریت قراردادها",description:"چرخه کامل قراردادها، طرفین، مبالغ و سررسیدها",icon:"contract"},comparison:{title:"تطبیق هوشمند اسناد",description:"اجرای تطبیق بر اساس گروه، قواعد و سند مرجع پویا",icon:"compare"},assistant:{title:"دستیار هوشمند نگارش",description:"تولید و تمدید قرارداد با مدل‌ها و منابع مجاز سازمان",icon:"sparkles"},reports:{title:"گزارش‌های مدیریتی",description:"گزارش‌های قابل ممیزی بر پایه داده‌های جاری",icon:"chart"},settings:{title:"تنظیمات پویای سازمان",description:"مدل‌ها، ویژگی گروه‌ها و رفتار هر بخش در زمان اجرا",icon:"settings"}};
  function renderModule(){
    const info=sectionInfo[activeSection];
    return <section className="module-page">
<div className="module-header">
<div className="module-symbol">
<Icon name={info.icon} size={24}/>
</div>
<div>
<p className="eyebrow">فضای کاری سازمان</p>
<h1>{info.title}</h1>
<p>{info.description}</p>
</div>{activeSection==="documents"&&<button className="primary-button" onClick={()=>setUploadOpen(true)}>
<Icon name="plus" size={18}/>افزودن سند</button>}</div>
      {activeSection==="documents"?<article className="panel module-panel">
<div className="panel-heading">
<div>
<h2>{showArchive?"بایگانی اسناد":"اسناد سازمان"}</h2>
<p>{new Intl.NumberFormat("fa-IR").format(showArchive?archivedDocuments.length:(dashboard?.documentCount??0))} سند</p>
</div>
<button className="ghost-button" onClick={()=>setShowArchive(x=>!x)}>{showArchive?"بازگشت به اسناد فعال":"مشاهده بایگانی"}</button>
</div>
<div className="document-list">{(showArchive?archivedDocuments:visibleDocuments).length?(showArchive?archivedDocuments:visibleDocuments).map((document,index)=>
<button onClick={()=>void openDocument(document.id,showArchive)} className="document-row" key={document.id}>
<span className={`file-type ${index%2?"docx":"pdf"}`}>{index%2?"W":"PDF"}</span>
<span className="doc-main">
<strong>{document.title}</strong>
<small>{document.documentType} · {formatDate(document.updatedAtUtc)}</small>
</span>
<span className={`status status-${document.processingStatus}`}>
<i/>نسخه {new Intl.NumberFormat("fa-IR").format(document.versionCount)}</span>
<span className="version">سطح {new Intl.NumberFormat("fa-IR").format(document.confidentialityLevel)}</span>
<Icon name="more"/>
</button>):<div className="empty-state">
<Icon name="file" size={26}/>
<strong>{showArchive?"بایگانی خالی است":"سندی ثبت نشده است"}</strong>
<span>{loadError||"برای شروع اولین سند را اضافه کنید."}</span>
</div>}</div>
</article>
      :activeSection==="contracts"?<article className="panel module-panel">
<div className="panel-heading">
<div>
<h2>قراردادهای سازمان</h2>
<p>{new Intl.NumberFormat("fa-IR").format(contracts.length)} قرارداد</p>
</div>
<button className="primary-button compact" onClick={newContract}>
<Icon name="plus" size={16}/>قرارداد جدید</button>
</div>
<div className="contract-table">{contracts.length?contracts.map(contract=>
<div className="contract-row" key={contract.id}>
<button onClick={()=>void editContract(contract.id)}>
<strong>{contract.subject}</strong>
<span>{contract.contractNumber||"بدون شماره"} · {contract.currency} {contract.amount?new Intl.NumberFormat("fa-IR").format(contract.amount):"بدون مبلغ"}</span>
</button>
<span className={`contract-status s-${contract.status}`}>{contract.statusName||legacyContractStatus(contract.status)}</span>
<span>{contract.endDate?formatDate(contract.endDate):"بدون سررسید"}</span>
<button className="danger-action" onClick={()=>void removeContract(contract.id)}>بایگانی</button>
</div>):<div className="empty-state">
<Icon name="contract" size={26}/>
<strong>هنوز قراردادی ثبت نشده است</strong>
<span>یک سند را انتخاب و قرارداد آن را ایجاد کنید.</span>
<button className="primary-button compact" onClick={newContract}>
<Icon name="plus" size={16}/>ایجاد قرارداد</button>
</div>}</div>
</article>
      :activeSection==="comparison"?renderComparison()
      :activeSection==="assistant"?renderAssistant()
      :activeSection==="settings"?<div className="settings-grid">{settings.length?settings.map(setting=>
<article className="setting-card" key={setting.id}>
<div>
<span>{setting.category}</span>
<b className={setting.isActive?"on":"off"}>{setting.isActive?"فعال":"غیرفعال"}</b>
</div>
<h3>{setting.key}</h3>
<p>نسخه {new Intl.NumberFormat("fa-IR").format(setting.version)} · ویرایش {formatDate(setting.updatedAtUtc)}</p>
<code>{setting.valueJson}</code>
</article>):<article className="panel empty-module">
<Icon name="settings" size={30}/>
<h2>تنظیم runtime ثبت نشده است</h2>
<p>{loadError||"مدل AI، ویژگی‌های گروه، RuleSet و سایر تنظیمات از API و دیتابیس این بخش خوانده خواهند شد."}</p>
</article>}</div>
      :<article className="panel empty-module">
<Icon name={info.icon} size={32}/>
<h2>ساختار این بخش آماده است</h2>
<p>اطلاعات این ماژول پس از ثبت در دیتابیس همین سازمان نمایش داده می‌شود. هیچ داده یا گزینه عملیاتی داخل UI ثابت نشده است.</p>
<div className="dynamic-note">
<Icon name="shield" size={17}/>Database-driven · Tenant-scoped · Versioned</div>
</article>}</section>
  }

  return <div className="app-shell" dir="rtl">
    <aside className={`sidebar ${sidebarOpen?"is-open":""}`}>
      <div className="brand">
<div className="brand-mark">
<Icon name="sparkles" size={22}/>
</div>
<div>
<strong>نگارش<span>AI</span>
</strong>
<small>هوشمندی اسناد سازمانی</small>
</div>
</div>
      <nav className="navigation" aria-label="منوی اصلی">
<span className="nav-caption">فضای کاری</span>
        {navItems.map(item=>
<button onClick={()=>{setActiveSection(item.id);setSidebarOpen(false)}} className={`nav-item ${activeSection===item.id?"active":""}`} key={item.id}>
<Icon name={item.icon}/>
<span>{item.label}</span>{item.id==="contracts"&&dashboard?.activeContractCount?<b>{new Intl.NumberFormat("fa-IR").format(dashboard.activeContractCount)}</b>:null}</button>)}
        <span className="nav-caption second">مدیریت</span>
<button onClick={()=>{setActiveSection("settings");setSidebarOpen(false)}} className={`nav-item ${activeSection==="settings"?"active":""}`}>
<Icon name="settings"/>
<span>تنظیمات سازمان</span>
</button>
      </nav>
      <div className="storage-card">
<div className="storage-icon">
<Icon name="shield" size={19}/>
</div>
<strong>فضای امن سازمان</strong>
<span>{dashboard?.organizationName??"اطلاعات سازمان پس از ورود دریافت می‌شود"}</span>
<button>مدیریت فضای ذخیره‌سازی</button>
</div>
      <div className="sidebar-user">
<div className="avatar">ک</div>
<div>
<strong>{dashboard?.currentUserId??"کاربر سازمان"}</strong>
<span>{dashboard?.organizationName??"ورود به سامانه"}</span>
</div>
<Icon name="more"/>
</div>
    </aside>
    {sidebarOpen&&<button className="sidebar-overlay" onClick={()=>setSidebarOpen(false)} aria-label="بستن منو"/>}
    <main className="workspace">
      <header className="topbar">
<button className="mobile-menu" onClick={()=>setSidebarOpen(x=>!x)} aria-label="منو">
<Icon name={sidebarOpen?"close":"menu"}/>
</button>
        <div className="global-search">
<Icon name="search" size={19}/>
<input value={search} onChange={e=>setSearch(e.target.value)} placeholder="جست‌وجو در اسناد، قراردادها و گزارش‌ها..."/>
<kbd>⌘ K</kbd>
</div>
        <div className="top-actions">{!dashboard&&<button className="login-button" onClick={()=>setLoginOpen(true)}>ورود</button>}<button className="icon-button" aria-label="اعلان‌ها">
<Icon name="bell"/>
<i/>
</button>
<span className="top-divider"/>
<div className="secure-label">
<Icon name="shield" size={17}/>
<span>محیط امن سازمانی</span>
</div>
</div>
      </header>
      <div className="content">
        {activeSection==="overview"?<>
        <section className="welcome">
<div>
<p className="eyebrow">{fullCurrentDate()}</p>
<h1>فضای هوشمند مدیریت اسناد سازمان</h1>
<p>اسناد و قراردادهای سازمان را در یک فضای امن مدیریت و تحلیل کنید.</p>
</div>
<button className="primary-button" onClick={()=>setUploadOpen(true)}>
<Icon name="plus" size={18}/>افزودن سند جدید</button>
</section>
        <section className="stats-grid">
          <article className="stat-card">
<div className="stat-icon blue">
<Icon name="file"/>
</div>
<div>
<span>کل اسناد</span>
<strong>{new Intl.NumberFormat("fa-IR").format(dashboard?.documentCount??0)}</strong>
<small>بر اساس داده‌های جاری سازمان</small>
</div>
<svg className="sparkline" viewBox="0 0 100 38">
<path d="M2 34 C18 31,20 18,34 24 S55 28,64 14 S82 19,98 4"/>
</svg>
</article>
          <article className="stat-card">
<div className="stat-icon violet">
<Icon name="contract"/>
</div>
<div>
<span>قراردادهای فعال</span>
<strong>{new Intl.NumberFormat("fa-IR").format(dashboard?.activeContractCount??0)}</strong>
<small className="warning">{new Intl.NumberFormat("fa-IR").format(dashboard?.upcomingDeadlines.length??0)} قرارداد <em>نزدیک سررسید</em>
</small>
</div>
</article>
          <article className="stat-card">
<div className="stat-icon amber">
<Icon name="clock"/>
</div>
<div>
<span>در انتظار بررسی</span>
<strong>{new Intl.NumberFormat("fa-IR").format(dashboard?.pendingReviewCount??0)}</strong>
<small>بر اساس وضعیت قراردادها</small>
</div>
</article>
          <article className="stat-card">
<div className="stat-icon green">
<Icon name="check"/>
</div>
<div>
<span>اسناد آماده</span>
<strong>{new Intl.NumberFormat("fa-IR").format(dashboard?.readyDocumentCount??0)}</strong>
<small className="positive">آماده استفاده و تحلیل</small>
</div>
<div className="quality-bars">
<i/>
<i/>
<i/>
<i/>
<i/>
</div>
</article>
        </section>
        <section className="dashboard-grid">
          <article className="panel documents-panel">
<div className="panel-heading">
<div>
<h2>اسناد اخیر</h2>
<p>آخرین اسناد ثبت‌شده در فضای سازمان</p>
</div>
<button className="text-button">مشاهده همه <Icon name="arrow" size={16}/>
</button>
</div>
            <div className="document-list">{loading?<div className="skeleton-list">{[1,2,3,4].map(i=>
<i key={i}/>)}</div>:visibleDocuments.length===0?<div className="empty-state">
<Icon name="file" size={26}/>
<strong>هنوز سندی برای نمایش وجود ندارد</strong>
<span>{loadError||"اولین سند سازمان را بارگذاری کنید."}</span>
</div>:visibleDocuments.slice(0,4).map((document,index)=>
<button className="document-row" key={document.id}>
<span className={`file-type ${index%2?"docx":"pdf"}`}>{index%2?"W":"PDF"}</span>
<span className="doc-main">
<strong>{document.title}</strong>
<small>{document.documentType} · ویرایش {formatDate(document.updatedAtUtc)}</small>
</span>
<span className={`status status-${document.processingStatus}`}>
<i/>{document.processingStatus===3?"آماده":document.processingStatus===2?"در حال پردازش":"ثبت شده"}</span>
<span className="version">نسخه {new Intl.NumberFormat("fa-IR").format(document.versionCount)}</span>
<Icon name="more"/>
</button>)}</div>
          </article>
          <article className="panel ai-panel">
<div className="ai-glow"/>
<div className="ai-title">
<span>
<Icon name="sparkles" size={22}/>
</span>
<div>
<h2>دستیار هوشمند نگارش</h2>
<p>با زبان ساده درخواستتان را بنویسید</p>
</div>
</div>
<div className="ai-prompt">
<p>مثلاً «قرارداد پشتیبانی شرکت آریا را با افزایش ۲۵ درصدی برای سال جدید تمدید کن...»</p>
<button aria-label="ارسال">
<Icon name="arrow" size={18}/>
</button>
</div>
<div className="quick-prompts">
<button>
<Icon name="contract" size={16}/>تمدید قرارداد</button>
<button>
<Icon name="compare" size={16}/>تطبیق دو سند</button>
<button>
<Icon name="sparkles" size={16}/>خلاصه‌سازی</button>
</div>
<div className="privacy-note">
<Icon name="shield" size={15}/>پردازش کاملاً درون‌سازمانی و محرمانه</div>
</article>
          <article className="panel activity-panel">
<div className="panel-heading">
<div>
<h2>فعالیت‌های اخیر</h2>
<p>رویدادهای ثبت‌شده سازمان</p>
</div>
<button className="icon-button">
<Icon name="more"/>
</button>
</div>
<div className="timeline">
            {dashboard?.recentActivities.length?dashboard.recentActivities.slice(0,3).map((activity,index)=>
<div key={`${activity.createdAtUtc}-${index}`}>
<span className={`event-icon ${index===0?"green":index===1?"violet":"blue"}`}>
<Icon name={index===0?"check":index===1?"sparkles":"upload"} size={15}/>
</span>
<p>
<strong>{activityTitle(activity.action)}</strong>
<small>{activity.entityType}{activity.entityId?` — ${activity.entityId.slice(0,8)}`:""}</small>
</p>
<time>{formatDate(activity.createdAtUtc)}</time>
</div>):<div className="empty-inline">هنوز رویدادی ثبت نشده است.</div>}
          </div>
</article>
          <article className="panel deadlines-panel">
<div className="panel-heading">
<div>
<h2>سررسیدهای پیش‌رو</h2>
<p>قراردادهایی که نیاز به توجه دارند</p>
</div>
<button className="text-button">تقویم</button>
</div>
            {dashboard?.upcomingDeadlines.length?dashboard.upcomingDeadlines.slice(0,3).map(deadline=>{const jalali=gregorianYmdToJalali(deadline.endDate);return <div className="deadline" key={deadline.contractId}>
<div className={`date-box ${deadline.daysRemaining<=7?"urgent":""}`}>
<strong>{jalali?toPersianDigits(jalali.jd):"—"}</strong>
<span>{jalali?JALALI_MONTH_NAMES[jalali.jm-1]:""}</span>
</div>
<p>
<strong>{deadline.subject}</strong>
<small>تاریخ پایان {formatDate(deadline.endDate)}</small>
</p>
<span className={`days ${deadline.daysRemaining<=7?"urgent":""}`}>{new Intl.NumberFormat("fa-IR").format(deadline.daysRemaining)} روز</span>
</div>}):<div className="empty-inline">سررسید فعالی ثبت نشده است.</div>}
          </article>
        </section>
        </>:renderModule()}
      </div>
    </main>
    {selectedDocument&&<div className="modal-backdrop" onMouseDown={e=>e.target===e.currentTarget&&setSelectedDocument(null)}>
<section className="upload-modal detail-modal" role="dialog" aria-modal="true">
<button className="modal-close" onClick={()=>setSelectedDocument(null)} aria-label="بستن">
<Icon name="close"/>
</button>
<div className="modal-icon">
<Icon name="file" size={25}/>
</div>
<h2>{selectedDocument.isArchived?"سند بایگانی‌شده":"جزئیات سند"}</h2>
<div className="form-grid">
<label className="field full">
<span>عنوان سند</span>
<input disabled={selectedDocument.isArchived} value={selectedDocument.title} onChange={e=>setSelectedDocument({...selectedDocument,title:e.target.value})}/>
</label>
<label className="field">
<span>نوع سند</span>
<input disabled={selectedDocument.isArchived} value={selectedDocument.documentType} onChange={e=>setSelectedDocument({...selectedDocument,documentType:e.target.value})}/>
</label>
<label className="field">
<span>سطح محرمانگی</span>
<select disabled={selectedDocument.isArchived} value={selectedDocument.confidentialityLevel} onChange={e=>setSelectedDocument({...selectedDocument,confidentialityLevel:Number(e.target.value)})}>{[1,2,3,4].map(level=>
<option key={level} value={level}>{level}</option>)}</select>
</label>
</div>{!selectedDocument.isArchived&&<div className="version-upload">
<label className="field">
<span>فایل نسخه جدید</span>
<input type="file" accept=".pdf,.docx" onChange={e=>setVersionFile(e.target.files?.[0]??null)}/>
</label>
<label className="field">
<span>شرح تغییر</span>
<input value={changeSummary} onChange={e=>setChangeSummary(e.target.value)} placeholder="تغییرات این نسخه"/>
</label>
<button className="primary-button compact" onClick={()=>void submitVersion()}>ثبت نسخه جدید</button>
</div>}<div className="version-history">{selectedDocument.versions.map(version=>
<article key={version.id}>
<div>
<strong>نسخه {new Intl.NumberFormat("fa-IR").format(version.versionNumber)}</strong>
<span>{version.changeSummary||"بدون توضیح تغییر"}</span>
<small>{formatDate(version.createdAtUtc)}</small>
</div>
<button className="ghost-button" onClick={()=>void downloadDocumentVersion(selectedDocument.id,version.id)}>دانلود امن</button>
</article>)}</div>{notice&&<div className="notice">{notice}</div>}<div className="modal-actions">{selectedDocument.isArchived?<button className="primary-button" onClick={()=>void recoverDocument(selectedDocument.id)}>بازیابی سند</button>:<>
<button className="danger-button" onClick={()=>void removeDocument(selectedDocument.id)}>بایگانی سند</button>
<button className="primary-button" onClick={()=>void saveDocumentDetails()}>ذخیره تغییرات</button>
</>}<button className="ghost-button" onClick={()=>setSelectedDocument(null)}>بستن</button>
</div>
</section>
</div>}
    {contractOpen&&contractDraft&&<div className="modal-backdrop">
<section className="upload-modal contract-modal" role="dialog" aria-modal="true">
<button className="modal-close" onClick={()=>setContractOpen(false)} aria-label="بستن">
<Icon name="close"/>
</button>
<div className="modal-icon">
<Icon name="contract" size={25}/>
</div>
<h2>{contractDraft.id?"ویرایش قرارداد":"قرارداد جدید"}</h2>
<p>مشخصات قرارداد و طرف اصلی را ثبت کنید.</p>
<div className="form-grid">
<label className="field full">
<span>سند مبنا</span>
<select value={contractDraft.baseDocumentProfileId??""} onChange={e=>{const base=contractBaseDocuments.find(x=>x.id===e.target.value);setContractDraft({...contractDraft,baseDocumentProfileId:base?.id,documentId:base?.documentId??""})}}>
<option value="">انتخاب سند مبنای سازمان</option>{contractBaseDocuments.filter(x=>x.isActive).map(base=>
<option key={base.id} value={base.id}>{base.name} — {base.documentTitle}</option>)}</select>
</label>
<label className="field full">
<span>موضوع قرارداد</span>
<input value={contractDraft.subject} onChange={e=>setContractDraft({...contractDraft,subject:e.target.value})}/>
</label>
<label className="field">
<span>شماره قرارداد</span>
<input value={contractDraft.contractNumber??""} onChange={e=>setContractDraft({...contractDraft,contractNumber:e.target.value})}/>
</label>
<label className="field">
<span>وضعیت</span>
<select value={contractDraft.statusDefinitionId??""} onChange={e=>{const status=contractStatuses.find(x=>x.id===e.target.value);setContractDraft({...contractDraft,statusDefinitionId:status?.id,statusName:status?.name})}}>
<option value="">انتخاب وضعیت</option>{contractStatuses.filter(x=>x.isActive).map(status=>
<option key={status.id} value={status.id}>{status.name}</option>)}</select>
</label>
<label className="field">
<span>مبلغ</span>
<input type="number" value={contractDraft.amount??""} onChange={e=>setContractDraft({...contractDraft,amount:e.target.value?Number(e.target.value):undefined})}/>
</label>
<label className="field">
<span>ارز</span>
<input value={contractDraft.currency} onChange={e=>setContractDraft({...contractDraft,currency:e.target.value})}/>
</label>
<label className="field">
<span>تاریخ شروع (شمسی)</span>
<PersianCalendar value={contractDraft.startDate} onChange={value=>setContractDraft({...contractDraft,startDate:value||undefined})}/>
</label>
<label className="field">
<span>تاریخ پایان (شمسی)</span>
<PersianCalendar value={contractDraft.endDate} onChange={value=>setContractDraft({...contractDraft,endDate:value||undefined})}/>
</label>
<label className="field full">
<span>طرف‌های قرارداد (انتخاب چندگانه)</span>
<div className="multi-choice">{organizationParties.filter(x=>x.isActive).map(party=>{const selected=contractDraft.parties.some(x=>x.directoryPartyId===party.id);return <label key={party.id}><input type="checkbox" checked={selected} onChange={e=>setContractDraft({...contractDraft,parties:e.target.checked?[...contractDraft.parties,{directoryPartyId:party.id,role:2,name:party.name,nationalIdentifier:party.nationalIdentifier,representativeName:party.representativeName}]:contractDraft.parties.filter(x=>x.directoryPartyId!==party.id)})}/><span>{party.name}{party.nationalIdentifier?` — ${party.nationalIdentifier}`:""}</span></label>})}</div>
</label>
<details className="catalog-manager"><summary>مدیریت وضعیت‌های سازمان</summary><div className="catalog-form"><input placeholder="نام وضعیت، مثل در انتظار بررسی" value={statusDraft.name} onChange={e=>setStatusDraft({...statusDraft,name:e.target.value})}/><input type="number" placeholder="ترتیب" value={statusDraft.order} onChange={e=>setStatusDraft({...statusDraft,order:Number(e.target.value)})}/><button type="button" className="ghost-button" onClick={()=>void addStatus()}>ثبت</button></div>{contractStatuses.map(item=><div className="catalog-row" key={item.id}><span>{item.name}</span><button type="button" onClick={()=>void renameCatalog("statuses",item)}>ویرایش</button><button type="button" onClick={()=>void removeCatalog("statuses",item.id)}>حذف</button></div>)}</details>
<details className="catalog-manager"><summary>مدیریت اسناد مبنای سازمان</summary><div className="catalog-form"><input placeholder="نام نمایشی سند مبنا" value={baseDocumentDraft.name} onChange={e=>setBaseDocumentDraft({...baseDocumentDraft,name:e.target.value})}/><select value={baseDocumentDraft.documentId} onChange={e=>setBaseDocumentDraft({...baseDocumentDraft,documentId:e.target.value})}><option value="">انتخاب از اسناد سازمان</option>{documents.map(item=><option key={item.id} value={item.id}>{item.title}</option>)}</select><button type="button" className="ghost-button" onClick={()=>void addBaseDocument()}>ثبت</button></div>{contractBaseDocuments.map(item=><div className="catalog-row" key={item.id}><span>{item.name} — {item.documentTitle}</span><button type="button" onClick={()=>void renameCatalog("base-documents",item)}>ویرایش</button><button type="button" onClick={()=>void removeCatalog("base-documents",item.id)}>حذف</button></div>)}</details>
<details className="catalog-manager"><summary>مدیریت طرف‌های قرارداد</summary><div className="catalog-form"><input placeholder="نام شخص یا شرکت" value={partyDraft.name} onChange={e=>setPartyDraft({...partyDraft,name:e.target.value})}/><input placeholder="شناسه ملی" value={partyDraft.nationalIdentifier} onChange={e=>setPartyDraft({...partyDraft,nationalIdentifier:e.target.value})}/><button type="button" className="ghost-button" onClick={()=>void addParty()}>ثبت</button></div>{organizationParties.map(item=><div className="catalog-row" key={item.id}><span>{item.name}{item.nationalIdentifier?` — ${item.nationalIdentifier}`:""}</span><button type="button" onClick={()=>void renameCatalog("parties",item)}>ویرایش</button><button type="button" onClick={()=>void removeCatalog("parties",item.id)}>حذف</button></div>)}</details>
</div>{notice&&<div className="notice">{notice}</div>}<div className="modal-actions">
<button className="primary-button" onClick={()=>void submitContract()}>ذخیره قرارداد</button>
</div>
</section>
</div>}
    {loginOpen&&<div className="modal-backdrop" onMouseDown={e=>e.target===e.currentTarget&&setLoginOpen(false)}>
<section className="upload-modal login-modal" role="dialog" aria-modal="true">
<button className="modal-close" onClick={()=>setLoginOpen(false)} aria-label="بستن">
<Icon name="close"/>
</button>
<div className="modal-icon">
<Icon name="shield" size={25}/>
</div>
<h2>ورود امن سازمانی</h2>
<p>با حساب IdentityProvider سازمان وارد شوید.</p>
<label className="field">
<span>نام کاربری</span>
<input autoComplete="username" value={username} onChange={e=>setUsername(e.target.value)}/>
</label>
<label className="field password-field">
<span>رمز عبور</span>
<input type="password" autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)}/>
</label>{notice&&<div className="notice">{notice}</div>}<div className="modal-actions">
<button className="ghost-button" onClick={()=>setLoginOpen(false)}>انصراف</button>
<button className="primary-button" onClick={()=>void authenticate()}>ورود به سامانه</button>
</div>
</section>
</div>}
    {uploadOpen&&<div className="modal-backdrop" onMouseDown={e=>e.target===e.currentTarget&&setUploadOpen(false)}>
<section className="upload-modal" role="dialog" aria-modal="true" aria-labelledby="upload-title">
<button className="modal-close" onClick={()=>setUploadOpen(false)} aria-label="بستن">
<Icon name="close"/>
</button>
<div className="modal-icon">
<Icon name="upload" size={25}/>
</div>
<h2 id="upload-title">افزودن سند جدید</h2>
<p>فایل شما به‌صورت امن در فضای اختصاصی سازمان نگهداری می‌شود.</p>
<label className="field">
<span>عنوان سند</span>
<input value={title} onChange={e=>setTitle(e.target.value)} placeholder="مثلاً قرارداد پشتیبانی سال ۱۴۰۵"/>
</label>
<button className={`drop-zone ${file?"has-file":""}`} onClick={()=>fileInput.current?.click()}>
<input ref={fileInput} type="file" accept=".pdf,.docx" onChange={e=>setFile(e.target.files?.[0]??null)}/>
<span>
<Icon name={file?"check":"upload"} size={24}/>
</span>
<strong>{file?file.name:"فایل را اینجا رها کنید یا انتخاب کنید"}</strong>
<small>{file?`${(file.size/1024/1024).toFixed(2)} مگابایت`:"PDF یا Word، حداکثر ۵۰ مگابایت"}</small>
</button>{progress>0&&<div className="progress">
<i style={{width:`${progress}%`}}/>
<span>{progress}٪</span>
</div>}{notice&&<div className="notice">{notice}</div>}<div className="modal-actions">
<button className="ghost-button" onClick={()=>setUploadOpen(false)}>انصراف</button>
<button className="primary-button" onClick={submitUpload}>
<Icon name="upload" size={17}/>بارگذاری و ثبت سند</button>
</div>
</section>
</div>}
  </div>
}
