"use client";

import Link from "next/link";
import {FormEvent,useEffect,useMemo,useState} from "react";
import {
  DocumentDetail,DocumentGroup,DocumentListItem,expertReviewDocumentVersion,getDocumentDetail,
  listDocumentGroups,listDocuments,managerReviewDocumentVersion,saveExtractedDocumentFields,uploadDocumentBatch
} from "../../../lib/api";
import {requireAuthenticatedUser} from "../../../lib/auth";

const states:Record<number,string>={1:"بارگذاری‌شده",2:"استخراج‌شده",3:"بازبینی کارشناس",4:"در انتظار مدیر",5:"نهایی و منتشرشده",6:"ردشده",7:"منسوخ‌شده"};
const imageTypes=new Set(["image/jpeg","image/png","image/tiff"]);

export default function DocumentIngestionPage(){
  const [items,setItems]=useState<DocumentListItem[]>([]),[selected,setSelected]=useState<DocumentDetail|null>(null);
  const [groups,setGroups]=useState<DocumentGroup[]>([]),[groupIds,setGroupIds]=useState<string[]>([]);
  const [files,setFiles]=useState<File[]>([]),[pages,setPages]=useState<number[]>([]),[title,setTitle]=useState("");
  const [fields,setFields]=useState("{}"),[note,setNote]=useState(""),[busy,setBusy]=useState(false),[message,setMessage]=useState("");
  const version=selected?.versions[0];
  const allImages=files.length>0&&files.every(file=>imageTypes.has(file.type));
  const ordered=useMemo(()=>files.map((file,index)=>({file,page:pages[index]??index+1,index}))
    .sort((a,b)=>a.page-b.page),[files,pages]);

  async function load(){const [response,loadedGroups]=await Promise.all([listDocuments(),listDocumentGroups()]);setItems(response.items);setGroups(loadedGroups)}
  useEffect(()=>{void requireAuthenticatedUser().then(load).catch(error=>setMessage(error instanceof Error?error.message:"بارگذاری انجام نشد."))},[]);
  async function select(id:string){setBusy(true);try{const detail=await getDocumentDetail(id);setSelected(detail);setFields(detail.versions[0]?.extractedFieldsJson??"{}")}finally{setBusy(false)}}
  function choose(next:FileList|null){const values=Array.from(next??[]);setFiles(values);setPages(values.map((_,index)=>index+1))}
  async function upload(event:FormEvent){event.preventDefault();if(!files.length)return;setBusy(true);setMessage("");try{
    const result=await uploadDocumentBatch({files,pageNumbers:allImages?pages:undefined,title:title||files[0].name,documentGroupIds:groupIds});
    setSelected(result);setFields(result.versions[0]?.extractedFieldsJson??"{}");setFiles([]);setPages([]);setTitle("");setGroupIds([]);await load();setMessage("استخراج انجام شد؛ این نسخه هنوز وارد RAG نشده است.");
  }catch(error){setMessage(error instanceof Error?error.message:"بارگذاری انجام نشد.")}finally{setBusy(false)}}
  async function saveFields(){if(!selected||!version)return;setBusy(true);try{const result=await saveExtractedDocumentFields(selected.id,version.id,fields);setSelected(result);setMessage("اطلاعات استخراج‌شده برای بازبینی کارشناس ذخیره شد.")}catch(error){setMessage(error instanceof Error?error.message:"ذخیره انجام نشد.")}finally{setBusy(false)}}
  async function decide(stage:"expert"|"manager",approved:boolean){if(!selected||!version)return;setBusy(true);try{const result=stage==="expert"?await expertReviewDocumentVersion(selected.id,version.id,approved,note):await managerReviewDocumentVersion(selected.id,version.id,approved,note);setSelected(result);setNote("");setMessage(approved?(stage==="expert"?"برای تأیید مدیر ارسال شد.":"نسخه نهایی و در RAG منتشر شد."):"نسخه رد شد.")}catch(error){setMessage(error instanceof Error?error.message:"ثبت تصمیم انجام نشد.")}finally{setBusy(false)}}

  return <main className="ingestion-page" dir="rtl">
    <header className="access-header"><div><span>چرخه ورود و تأیید سند</span><h1>استخراج، بازبینی و انتشار RAG</h1><p>هیچ نسخه‌ای پیش از تأیید کارشناس و نهایی‌سازی مدیر وارد دانش معتبر نمی‌شود.</p></div><Link href="/">بازگشت به داشبورد</Link></header>
    <div className="ingestion-grid">
      <section className="access-card"><h2>بارگذاری نسخه جدید</h2><form className="ingestion-form" onSubmit={event=>void upload(event)}>
        <label><span>عنوان سند</span><input value={title} onChange={event=>setTitle(event.target.value)} placeholder="عنوان یا موضوع سند"/></label>
        <label className="file-picker"><span>PDF، DOCX یا چند تصویر</span><input type="file" multiple accept=".pdf,.docx,.jpg,.jpeg,.png,.tif,.tiff" onChange={event=>choose(event.target.files)}/></label>
        <div className="choice-grid">{groups.map(group=><label key={group.id}><input type="checkbox" checked={groupIds.includes(group.id)} onChange={event=>setGroupIds(current=>event.target.checked?[...current,group.id]:current.filter(id=>id!==group.id))}/><span>{group.name}</span></label>)}</div>
        {allImages&&<div className="page-order"><strong>ترتیب صفحات تصاویر</strong>{ordered.map(row=><label key={`${row.file.name}-${row.index}`}><span>{row.file.name}</span><input type="number" min="1" value={pages[row.index]} onChange={event=>setPages(current=>current.map((value,index)=>index===row.index?Number(event.target.value):value))}/></label>)}</div>}
        <button className="primary-button" disabled={busy||!files.length||!groupIds.length}>بارگذاری و استخراج امن</button>
      </form></section>
      <section className="access-card document-review-list"><h2>نسخه‌های در انتظار بررسی</h2>{items.length===0?<p>سندی ثبت نشده است.</p>:items.map(item=><button className={selected?.id===item.id?"active":""} key={item.id} onClick={()=>void select(item.id)}><strong>{item.title}</strong><span>{item.versionCount} نسخه</span></button>)}</section>
      <section className="access-card review-workspace">{!version?<p className="scope-empty">یک سند را برای بازبینی انتخاب کنید.</p>:<>
        <header><div><h2>{selected?.title}</h2><span className={`lifecycle state-${version.lifecycleStatus}`}>{states[version.lifecycleStatus]??"نامشخص"}</span></div><small>{version.isRagPublished?"منتشرشده در RAG":"خارج از RAG"}</small></header>
        <div className="version-files">{version.files.length?version.files.map(file=><article key={file.id}><strong>{file.pageNumber?`صفحه ${file.pageNumber}`:`فایل ${file.sortOrder}`}</strong><span>{file.fileName}</span><small>SHA-256: {file.sha256.slice(0,16)}…</small></article>):<p>نسخه تک‌فایلی قدیمی</p>}</div>
        <label className="review-field"><span>اطلاعات استخراج‌شده (JSON قابل اصلاح)</span><textarea value={fields} onChange={event=>setFields(event.target.value)} rows={9}/></label>
        <details><summary>متن استخراج‌شده</summary><pre>{version.extractedText||"متنی استخراج نشده است."}</pre></details>
        <button onClick={()=>void saveFields()} disabled={busy||[5,7].includes(version.lifecycleStatus)}>ذخیره اصلاحات</button>
        <label className="review-field"><span>یادداشت تصمیم</span><textarea value={note} onChange={event=>setNote(event.target.value)} rows={3}/></label>
        <div className="review-actions">
          {[2,3,6].includes(version.lifecycleStatus)&&<><button className="approve" onClick={()=>void decide("expert",true)}>تأیید کارشناس</button><button className="reject" onClick={()=>void decide("expert",false)}>رد کارشناس</button></>}
          {version.lifecycleStatus===4&&<><button className="approve" onClick={()=>void decide("manager",true)}>نهایی‌سازی مدیر و انتشار RAG</button><button className="reject" onClick={()=>void decide("manager",false)}>رد مدیر</button></>}
        </div>
      </>}</section>
    </div>{message&&<div className="ingestion-message">{message}</div>}
  </main>;
}
