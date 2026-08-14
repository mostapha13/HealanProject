import React,{useEffect,useState} from 'react';
import {formatPersianDateTime} from './persianDate';
export default function AdminOperations({headers,onClose}){
 const[overview,setOverview]=useState(null),[audit,setAudit]=useState([]),[incidents,setIncidents]=useState([]),[health,setHealth]=useState([]),[registry,setRegistry]=useState(null),[alias,setAlias]=useState(''),[canonical,setCanonical]=useState(''),[error,setError]=useState('');
 useEffect(()=>{Promise.all([
  fetch('/api/admin/operations/overview',{headers:headers()}).then(x=>x.ok?x.json():Promise.reject(x)),
  fetch('/api/admin/operations/audit?take=100',{headers:headers()}).then(x=>x.ok?x.json():Promise.reject(x)),
  fetch('/api/admin/operations/incidents?status=Open&take=100',{headers:headers()}).then(x=>x.ok?x.json():Promise.reject(x)),
  fetch('/api/admin/operations/health',{headers:headers()}).then(x=>x.ok?x.json():Promise.reject(x)),
  fetch('/api/admin/semantic-registry/',{headers:headers()}).then(x=>x.ok?x.json():Promise.reject(x))
 ]).then(([o,a,i,h])=>{setOverview(o);setAudit(a);setIncidents(i);setHealth(h)}).catch(()=>setError('دسترسی یا دریافت اطلاعات عملیاتی ناموفق بود.'))},[]);
 async function saveAlias(){if(!alias.trim()||!canonical.trim())return;const r=await fetch('/api/admin/semantic-registry/aliases/'+encodeURIComponent(alias.trim()),{method:'PUT',headers:headers(),body:JSON.stringify({canonical:canonical.trim(),kind:'Instrument'})});if(r.ok){const x=await fetch('/api/admin/semantic-registry/',{headers:headers()});setRegistry(await x.json());setAlias('');setCanonical('')}}
 return <div className="modal-backdrop"><section className="saved-panel operations-panel"><div className="saved-head"><div><h2>مرکز عملیات TSEAI</h2><small>Audit، Incident و Runtime Health</small></div><button onClick={onClose}>بستن</button></div>{error&&<p className="error">{error}</p>}
  {overview&&<div className="ops-kpis"><K title="رخدادهای امروز" value={overview.questionsToday}/><K title="Incident باز" value={overview.openIncidents}/><K title="هشدار فعال" value={overview.enabledAlerts}/><K title="فیلتر ذخیره" value={overview.savedFilters}/></div>}
  <h3>Semantic Registry</h3>{registry&&<><div className="registry-editor"><input value={alias} onChange={e=>setAlias(e.target.value)} placeholder="Alias مثل ایران خودرو"/><input value={canonical} onChange={e=>setCanonical(e.target.value)} placeholder="Canonical مثل خودرو"/><button onClick={saveAlias}>ثبت Alias</button></div><div className="registry-grid"><section><b>Tool Registry</b>{(registry.tools||[]).map(x=><small key={x.name}>{x.name} · {x.category} · {x.qualityGated?'Quality Gate':'Read Only'}</small>)}</section><section><b>Aliases</b>{(registry.aliases||[]).filter(x=>x.canonical!=='__disabled__').map(x=><small key={x.alias}>{x.alias} → {x.canonical} ({x.kind})</small>)}</section><section><b>Content Routing</b>{(registry.contentRoutes||[]).map(x=><small key={x}>{x}</small>)}</section></div></>}
  <h3>سلامت اجزا</h3><div className="ops-health">{health.map(x=><div key={x.component}><b>{x.component}</b><span>{x.status}</span></div>)}</div>
  <div className="alert-layout"><div><h3>Incidentهای باز</h3>{incidents.map(x=><article className="alert-rule" key={x.id}><div><b>{x.component} · {x.code}</b><span>{x.message}</span><small>{x.severity} · {x.occurrences} بار</small></div></article>)}</div><div><h3>Audit اخیر</h3>{audit.map(x=><article className="alert-event" key={x.id}><div><b>{x.action}</b><span>{x.resourceType}{x.resourceId?' · '+x.resourceId:''}</span><small>{x.outcome} · {formatPersianDateTime(x.createdAtUtc)}</small></div></article>)}</div></div>
 </section></div>;
}
function K({title,value}){return <div className="ops-kpi"><small>{title}</small><strong>{value??0}</strong></div>}
