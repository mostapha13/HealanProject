import React,{useEffect,useState} from 'react';
import {formatPersianDateTime} from './persianDate';

const qualityLabels={1:'معتبر',2:'نیازمند توجه',3:'قدیمی',4:'نامعتبر',5:'نامشخص'};
const qualityClasses={1:'valid',2:'warning',3:'stale',4:'invalid',5:'unknown'};
const feedLabels={cashmarket:'معاملات جاری',orderbookcurrent:'دفتر سفارش‌ها',clienttype:'حقیقی و حقوقی'};
const healthLabels={Healthy:'سالم',Degraded:'کاهش کیفیت',Unhealthy:'ناسالم',ExternalCheckRequired:'نیازمند بررسی مستقل'};
const faNumber=new Intl.NumberFormat('fa-IR');

export default function AdminOperations({headers,onClose}){
 const[overview,setOverview]=useState(null),[audit,setAudit]=useState([]),[incidents,setIncidents]=useState([]),[health,setHealth]=useState([]),[runtime,setRuntime]=useState(null),[registry,setRegistry]=useState(null),[alias,setAlias]=useState(''),[canonical,setCanonical]=useState(''),[error,setError]=useState(''),[loading,setLoading]=useState(true),[updatedAt,setUpdatedAt]=useState(null);
 async function getJson(url){const response=await fetch(url,{headers:headers()});if(!response.ok)throw new Error(String(response.status));return response.json()}
 async function load(){
  setLoading(true);setError('');
  try{
   const[o,a,i,h,r,s]=await Promise.all([
    getJson('/api/admin/operations/overview'),
    getJson('/api/admin/operations/audit?take=100'),
    getJson('/api/admin/operations/incidents?status=Open&take=100'),
    getJson('/api/admin/operations/health'),
    getJson('/api/admin/data-quality/market-runtime'),
    getJson('/api/admin/semantic-registry/')
   ]);
   setOverview(o);setAudit(a);setIncidents(i);setHealth(h);setRuntime(r);setRegistry(s);setUpdatedAt(new Date());
  }catch(ex){setError(ex.message==='401'||ex.message==='403'?'این کاربر مجوز مشاهده مرکز عملیات را ندارد.':'دریافت اطلاعات عملیاتی ناموفق بود؛ دوباره تلاش کنید.')}
  finally{setLoading(false)}
 }
 useEffect(()=>{load()},[]);
 async function saveAlias(){if(!alias.trim()||!canonical.trim())return;const r=await fetch('/api/admin/semantic-registry/aliases/'+encodeURIComponent(alias.trim()),{method:'PUT',headers:headers(),body:JSON.stringify({canonical:canonical.trim(),kind:'Instrument'})});if(r.ok){setRegistry(await getJson('/api/admin/semantic-registry/'));setAlias('');setCanonical('')}else setError('ثبت Alias ناموفق بود.')}
 const overallClass=qualityClass(runtime?.status);
 return <div className="modal-backdrop"><section className="saved-panel operations-panel">
  <div className="saved-head"><div><h2>مرکز عملیات TSEAI</h2><small>سلامت سرویس، تازگی داده و رخدادهای قابل ممیزی{updatedAt?' · بروزرسانی '+formatPersianDateTime(updatedAt):''}</small></div><div className="ops-head-actions"><button className="ghost" onClick={load} disabled={loading}>{loading?'در حال بروزرسانی…':'بروزرسانی'}</button><button onClick={onClose}>بستن</button></div></div>
  {error&&<p className="error">{error}</p>}
  {overview&&<div className="ops-kpis"><K title="رخدادهای امروز" value={overview.questionsToday}/><K title="Incident باز" value={overview.openIncidents}/><K title="هشدار فعال" value={overview.enabledAlerts}/><K title="فیلتر ذخیره" value={overview.savedFilters}/></div>}

  <div className="ops-section-title"><div><h3>تازگی داده بازار</h3><small>سلامت Worker مستقل از تازگی Source ارزیابی می‌شود.</small></div>{runtime&&<span className={`status-pill ${overallClass}`}>{qualityLabel(runtime.status)}</span>}</div>
  {runtime?<>
   <div className={`runtime-summary ${overallClass}`}><div><b>{runtime.workerHealthy?'Worker بازار فعال و سالم است':'Worker بازار نیازمند رسیدگی است'}</b><span>{runtime.workerHealthy&&!runtime.feeds.every(x=>x.sourceFresh)?'پردازش بدون خطاست، اما داده‌ی SQL قدیمی است و پاسخ جاری مسدود می‌ماند.':runtime.workerHealthy?'داده‌های قابل ارائه در محدوده تازگی مجاز قرار دارند.':'آخرین اجرای یک یا چند Feed موفق نبوده است.'}</span></div><small>{runtime.isLiveMarketWindow?'بازه زنده بازار':'خارج از بازه زنده بازار'} · ارزیابی {formatPersianDateTime(runtime.evaluatedAtUtc)}</small></div>
   <div className="runtime-feeds">{runtime.feeds.map(feed=><FeedCard key={feed.feed} feed={feed}/>)}</div>
  </>:loading?<div className="ops-skeleton">در حال دریافت وضعیت Feedها…</div>:null}

  <h3>سلامت اجزا</h3><div className="ops-health">{health.map(x=><div key={x.component} className={healthClass(x.status)}><b>{x.component}</b><span>{healthLabels[x.status]||x.status}</span>{x.detail&&<small>{x.detail}</small>}</div>)}</div>

  <h3>Semantic Registry</h3>{registry&&<><div className="registry-editor"><input value={alias} onChange={e=>setAlias(e.target.value)} placeholder="Alias مثل ایران خودرو"/><input value={canonical} onChange={e=>setCanonical(e.target.value)} placeholder="Canonical مثل خودرو"/><button onClick={saveAlias}>ثبت Alias</button></div><div className="registry-grid"><section><b>Tool Registry</b>{(registry.tools||[]).map(x=><small key={x.name}>{x.name} · {x.category} · {x.qualityGated?'Quality Gate':'Read Only'}</small>)}</section><section><b>Aliases</b>{(registry.aliases||[]).filter(x=>x.canonical!=='__disabled__').map(x=><small key={x.alias}>{x.alias} → {x.canonical} ({x.kind})</small>)}</section><section><b>Content Routing</b>{(registry.contentRoutes||[]).map(x=><small key={x}>{x}</small>)}</section></div></>}
  <div className="alert-layout"><div><h3>Incidentهای باز</h3>{incidents.length?incidents.map(x=><article className="alert-rule" key={x.id}><div><b>{x.component} · {x.code}</b><span>{x.message}</span><small>{x.severity} · {faNumber.format(x.occurrences)} بار</small></div></article>):<p className="empty">Incident بازی ثبت نشده است.</p>}</div><div><h3>Audit اخیر</h3>{audit.length?audit.map(x=><article className="alert-event" key={x.id}><div><b>{x.action}</b><span>{x.resourceType}{x.resourceId?' · '+x.resourceId:''}</span><small>{x.outcome} · {formatPersianDateTime(x.createdAtUtc)}</small></div></article>):<p className="empty">رکوردی برای نمایش وجود ندارد.</p>}</div></div>
 </section></div>;
}

function FeedCard({feed}){
 const cls=qualityClass(feed.status),serve=feed.workerHealthy&&feed.sourceFresh;
 return <article className={`runtime-feed ${cls}`}>
  <div className="runtime-feed-head"><div><b>{feedLabels[feed.feed]||feed.feed}</b><small>{feed.feed}</small></div><span className={`status-pill ${cls}`}>{qualityLabel(feed.status)}</span></div>
  <dl><div><dt>Worker</dt><dd>{feed.workerHealthy?'سالم':'ناسالم'}</dd></div><div><dt>Source</dt><dd>{feed.sourceFresh?'تازه':'قدیمی/نامعتبر'}</dd></div><div><dt>قابل ارائه</dt><dd className={serve?'serve-yes':'serve-no'}>{serve?'بله':'خیر'}</dd></div><div><dt>رکورد Full</dt><dd>{faNumber.format(feed.lastFullRowCount??0)}</dd></div><div><dt>آخرین رکورد Source</dt><dd>{dateValue(feed.latestSourceCollectedAt)}</dd></div><div><dt>Watermark</dt><dd>{dateValue(feed.watermark)}</dd></div><div><dt>آخرین Sync موفق</dt><dd>{dateValue(feed.lastSuccessAtUtc)}</dd></div><div><dt>سن Source</dt><dd>{formatDuration(feed.sourceAge)}</dd></div></dl>
  {feed.issues?.length>0&&<p className="runtime-issue">{feed.issues[0].message}</p>}
 </article>
}

function K({title,value}){return <div className="ops-kpi"><small>{title}</small><strong>{faNumber.format(value??0)}</strong></div>}
function qualityLabel(status){return qualityLabels[status]||qualityLabels[Number(status)]||String(status??'نامشخص')}
function qualityClass(status){return qualityClasses[status]||qualityClasses[Number(status)]||'unknown'}
function healthClass(status){return String(status||'').toLowerCase().replaceAll(' ','-')}
function dateValue(value){return value?formatPersianDateTime(value):'ثبت نشده'}
function formatDuration(value){
 const match=String(value??'').match(/^(?:(\d+)\.)?(\d{2}):(\d{2})/);if(!match)return 'نامشخص';
 const days=Number(match[1]||0),hours=Number(match[2]),minutes=Number(match[3]);
 return [days?`${faNumber.format(days)} روز`:null,hours?`${faNumber.format(hours)} ساعت`:null,!days&&minutes?`${faNumber.format(minutes)} دقیقه`:null].filter(Boolean).join(' و ')||'کمتر از یک دقیقه';
}
