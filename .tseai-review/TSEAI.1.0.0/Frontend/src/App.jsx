import React,{useEffect,useRef,useState} from 'react';
import {HubConnectionBuilder,LogLevel} from '@microsoft/signalr';
import AdminOperations from './AdminOperations';
import {formatPersianDate,formatPersianDateTime} from './persianDate';

const getAnon=()=>{let v=localStorage.getItem('tseai-anonymous-id');if(!v){v=crypto.randomUUID().replaceAll('-','');localStorage.setItem('tseai-anonymous-id',v)}return v};
const getConversation=()=>{let v=localStorage.getItem('tseai-filter-conversation-id');if(!v){v=crypto.randomUUID().replaceAll('-','');localStorage.setItem('tseai-filter-conversation-id',v)}return v};
const chatHistoryKey=id=>'tseai-chat-history-v1:'+id;
const loadChatHistory=()=>{try{const rows=JSON.parse(localStorage.getItem(chatHistoryKey(getConversation()))||'[]');return Array.isArray(rows)?rows.slice(-50).map(x=>({...x,restored:true})):[]}catch{return []}};
const compactHistoryMessage=m=>m.role==='assistant'
 ?{role:'assistant',data:{answer:m.data?.answer||''}}
 :{role:m.role,text:String(m.text||'').slice(0,4000)};
const nativeFetch=globalThis.fetch.bind(globalThis);
let accessToken=null;
let accessTokenExpiresAt=0;
let refreshInFlight=null;
const token=()=>accessToken&&Date.now()<accessTokenExpiresAt-30000?accessToken:null;
const apiHeaders=()=>{const h={'Content-Type':'application/json','X-Anonymous-Id':getAnon()};if(token())h.Authorization='Bearer '+token();return h};

async function refreshSession(){
 if(refreshInFlight)return refreshInFlight;
 refreshInFlight=(async()=>{try{const r=await nativeFetch('/identity/api/auth/refresh',{method:'POST',headers:{'Content-Type':'application/json','X-TSEAI-Web-Client':'1'},credentials:'same-origin',body:'{}'});if(!r.ok){accessToken=null;accessTokenExpiresAt=0;return false}const d=await r.json();accessToken=d.accessToken||null;accessTokenExpiresAt=Date.parse(d.expiresAtUtc)||0;return !!token()}catch{accessToken=null;accessTokenExpiresAt=0;return false}finally{refreshInFlight=null}})();
 return refreshInFlight;
}
async function apiFetch(input,init={}){
 const headers=new Headers(init.headers||{});if(token())headers.set('Authorization','Bearer '+token());
 let response=await nativeFetch(input,{...init,headers,credentials:init.credentials||'same-origin'});
 if(response.status!==401||String(input).startsWith('/identity/api/auth/'))return normalizeApiResponse(response);
 if(!await refreshSession())return normalizeApiResponse(response);
 headers.set('Authorization','Bearer '+token());
 response=await nativeFetch(input,{...init,headers,credentials:init.credentials||'same-origin'});
 return normalizeApiResponse(response);
}
function normalizeApiResponse(response){
 const type=response.headers.get('content-type')||'';
 if(response.ok||type.includes('application/json'))return response;
 const message=[502,503,504].includes(response.status)
  ?'سرویس هوش مصنوعی موقتاً در دسترس نیست؛ چند لحظه دیگر دوباره تلاش کنید.'
  :`خطای ارتباط با سرور (کد ${response.status}).`;
 return new Response(JSON.stringify({code:'upstream_non_json_error',message}),{status:response.status,statusText:response.statusText,headers:{'Content-Type':'application/json; charset=utf-8'}});
}
const fetch=apiFetch;
const TYPEWRITER_WORD_INTERVAL_MS=60;
async function responseJson(response){
 const text=await response.text();
 if(!text)return {};
 const type=response.headers.get('content-type')||'';
 if(type.includes('application/json')){try{return JSON.parse(text)}catch{}}
 if(!response.ok){
  if([502,503,504].includes(response.status))throw new Error('سرویس هوش مصنوعی موقتاً در دسترس نیست؛ چند لحظه دیگر دوباره تلاش کنید.');
  throw new Error(`پاسخ نامعتبر از سرور دریافت شد (کد ${response.status}).`);
 }
 throw new Error('قالب پاسخ سرور معتبر نیست.');
}

export default function App(){
 const[q,setQ]=useState('');
 const[loading,setLoading]=useState(false);
 const[messages,setMessages]=useState(loadChatHistory);
 const[mobile,setMobile]=useState('');
 const[code,setCode]=useState('');
 const[otpSent,setOtpSent]=useState(false);
 const[logged,setLogged]=useState(false);
 const[settingsOpen,setSettingsOpen]=useState(false);
 const[settings,setSettings]=useState({});
 const[current,setCurrent]=useState(null);
 const[savedOpen,setSavedOpen]=useState(false);
 const[savedFilters,setSavedFilters]=useState([]);
 const[selectedSaved,setSelectedSaved]=useState(null);
 const[saveName,setSaveName]=useState('');
 const[importCode,setImportCode]=useState('');
 const[savedBusy,setSavedBusy]=useState(false);
 const[alertsOpen,setAlertsOpen]=useState(false);
 const[alerts,setAlerts]=useState([]);
 const[alertEvents,setAlertEvents]=useState([]);
 const[alertBusy,setAlertBusy]=useState(false);
 const[liveAlert,setLiveAlert]=useState(null);
 const[operationsOpen,setOperationsOpen]=useState(false);
 const end=useRef();

 useEffect(()=>{end.current?.scrollIntoView({behavior:'smooth'})},[messages]);
 useEffect(()=>{try{localStorage.setItem(chatHistoryKey(getConversation()),JSON.stringify(messages.slice(-50).map(compactHistoryMessage)))}catch{}},[messages]);
 useEffect(()=>{loadConversation()},[]);
 useEffect(()=>{localStorage.removeItem('tseai-access-token');localStorage.removeItem('tseai-refresh-token');let active=true;refreshSession().then(ok=>{if(active){setLogged(ok);if(ok)loadConversation()}});return()=>{active=false}},[]);
 useEffect(()=>{if(logged&&savedOpen)loadSavedFilters()},[logged,savedOpen]);
 useEffect(()=>{if(logged&&alertsOpen){loadSavedFilters();loadAlerts()}},[logged,alertsOpen]);
 useEffect(()=>{if(!logged)return;let disposed=false;const connection=new HubConnectionBuilder().withUrl('/notifications/hubs/alerts',{accessTokenFactory:async()=>{if(!token())await refreshSession();return token()||''}}).withAutomaticReconnect().configureLogging(LogLevel.Warning).build();connection.on('alertTriggered',msg=>{if(disposed)return;setLiveAlert(msg);setAlertEvents(items=>[normalizeAlertEvent(msg),...items].slice(0,100));setTimeout(()=>setLiveAlert(x=>x?.eventId===msg.eventId?null:x),7000)});connection.start().catch(()=>{});return()=>{disposed=true;connection.stop().catch(()=>{})}},[logged]);

 async function requestOtp(){const r=await fetch('/identity/api/auth/otp/request',{method:'POST',headers:{'Content-Type':'application/json','X-TSEAI-Web-Client':'1'},body:JSON.stringify({mobile})});if(r.ok)setOtpSent(true);else alert('ارسال کد تایید انجام نشد')}
 async function verifyOtp(){const r=await fetch('/identity/api/auth/otp/verify',{method:'POST',headers:{'Content-Type':'application/json','X-TSEAI-Web-Client':'1'},body:JSON.stringify({mobile,code})});const d=await r.json();if(!r.ok)return alert(d.message||'کد نامعتبر است');accessToken=d.accessToken;accessTokenExpiresAt=Date.parse(d.expiresAtUtc)||0;setLogged(!!token());await loadConversation()}
 async function logout(){try{await nativeFetch('/identity/api/auth/logout',{method:'POST',headers:{'Content-Type':'application/json','X-TSEAI-Web-Client':'1'},credentials:'same-origin',body:'{}'})}finally{accessToken=null;accessTokenExpiresAt=0;setLogged(false);setSettingsOpen(false);setSavedOpen(false);setAlertsOpen(false);setOtpSent(false);setCode('');setSelectedSaved(null)}}
 async function loadSettings(){const r=await fetch('/api/admin/settings',{headers:apiHeaders()});if(!r.ok)return alert('این کاربر دسترسی تنظیمات مدیریتی ندارد.');const d=await r.json();setSettings(d);setSettingsOpen(true)}
 async function saveSetting(key,value,type='int',category='General'){const r=await fetch('/api/admin/settings/'+encodeURIComponent(key),{method:'PUT',headers:apiHeaders(),body:JSON.stringify({value,valueType:type,title:key,description:null,category})});if(!r.ok)return alert('ذخیره انجام نشد');setSettings(x=>({...x,[key]:value}))}
 async function loadConversation(){try{const r=await fetch('/api/filters/conversation/'+encodeURIComponent(getConversation()),{headers:apiHeaders()});if(r.ok)setCurrent(await r.json())}catch{}}
 async function sendCommand(question,showUser=true){if(!question.trim()||loading)return;if(showUser)setMessages(m=>[...m,{role:'user',text:question}]);setLoading(true);try{const r=await fetch('/api/chat/ask',{method:'POST',headers:apiHeaders(),body:JSON.stringify({question,page:1,pageSize:100,conversationId:getConversation()})});const data=await responseJson(r);if(!r.ok)throw new Error(data.message||'خطا در پردازش درخواست');setCurrent(data);setMessages(m=>[...m,{role:'assistant',data}])}catch(err){setMessages(m=>[...m,{role:'error',text:err.message||'خطای پیش‌بینی‌نشده در ارتباط با سرور'}])}finally{setLoading(false)}}
 async function ask(e){e.preventDefault();const question=q.trim();if(!question||loading)return;setQ('');await sendCommand(question,true)}
 async function executeSource(source,options={}){const r=await fetch('/api/filters/execute',{method:'POST',headers:apiHeaders(),body:JSON.stringify({source,page:options.page??1,pageSize:options.pageSize??current?.pageSize??100,sortBy:options.sortBy??current?.sortBy??null,sortDescending:options.sortDescending??current?.sortDescending??true})});const d=await r.json();if(!r.ok)throw new Error(d.message||'اجرای فیلتر انجام نشد');return d}
 async function runCurrent(options={}){if(!current?.filter||loading)return;setLoading(true);try{const d=await executeSource(current.filter,{page:options.page??current.page??1,pageSize:current.pageSize??100,sortBy:options.sortBy??current.sortBy??null,sortDescending:options.sortDescending??current.sortDescending??true});setCurrent(x=>({...x,scanned:d.scanned,matched:d.matched,page:d.page,pageSize:d.pageSize,totalPages:d.totalPages,sortBy:d.sortBy,sortDescending:d.sortDescending,results:d.results}))}catch(err){setMessages(m=>[...m,{role:'error',text:err.message}])}finally{setLoading(false)}}
 function newConversation(){const id=crypto.randomUUID().replaceAll('-','');localStorage.setItem('tseai-filter-conversation-id',id);localStorage.removeItem(chatHistoryKey(id));setMessages([]);setCurrent(null);setSelectedSaved(null)}

 async function loadSavedFilters(){if(!logged)return;setSavedBusy(true);try{const r=await fetch('/api/saved-filters/',{headers:apiHeaders()});const d=await r.json();if(!r.ok)throw new Error(d.message||'دریافت فیلترهای ذخیره‌شده انجام نشد');setSavedFilters(d.items||[])}catch(err){alert(err.message)}finally{setSavedBusy(false)}}
 async function openSaved(){if(!logged)return alert('برای ذخیره فیلتر ابتدا با شماره موبایل وارد شوید.');setSavedOpen(true);await loadSavedFilters()}
 async function createSaved(){if(!current?.filter)return alert('فیلتر فعالی برای ذخیره وجود ندارد.');if(!saveName.trim())return alert('نام فیلتر را وارد کنید.');setSavedBusy(true);try{const r=await fetch('/api/saved-filters/',{method:'POST',headers:apiHeaders(),body:JSON.stringify({name:saveName.trim(),description:null,conversationId:getConversation(),tsetmcCode:null,isFavorite:false})});const d=await r.json();if(!r.ok)throw new Error(d.message||'ذخیره فیلتر انجام نشد');setSaveName('');await loadSavedFilters();setSelectedSaved(d);setSavedOpen(true)}catch(err){alert(err.message)}finally{setSavedBusy(false)}}
 async function importSaved(){if(!importCode.trim())return alert('کد TSETMC را وارد کنید.');if(!saveName.trim())return alert('نام فیلتر را وارد کنید.');setSavedBusy(true);try{const r=await fetch('/api/saved-filters/',{method:'POST',headers:apiHeaders(),body:JSON.stringify({name:saveName.trim(),description:'Import از TSETMC',conversationId:null,tsetmcCode:importCode.trim(),isFavorite:false})});const d=await r.json();if(!r.ok)throw new Error(d.message||'Import فیلتر انجام نشد');setSaveName('');setImportCode('');await loadSavedFilters();setSelectedSaved(d)}catch(err){alert(err.message)}finally{setSavedBusy(false)}}
 async function loadSaved(id){setSavedBusy(true);try{const r=await fetch(`/api/saved-filters/${id}/load`,{method:'POST',headers:apiHeaders(),body:JSON.stringify({conversationId:getConversation()})});const d=await r.json();if(!r.ok)throw new Error(d.message||'بارگذاری فیلتر انجام نشد');const state=await fetch('/api/filters/conversation/'+encodeURIComponent(getConversation()),{headers:apiHeaders()});const stateData=state.ok?await state.json():{filter:d.filter,version:d.version};const executed=d.filter?await executeSource(d.filter,{page:1}):null;setCurrent({...stateData,...(executed||{})});setSavedOpen(false);setMessages(m=>[...m,{role:'assistant',text:'فیلتر ذخیره‌شده در این مکالمه بارگذاری شد.'}])}catch(err){alert(err.message)}finally{setSavedBusy(false)}}
 async function inspectSaved(id){setSavedBusy(true);try{const r=await fetch(`/api/saved-filters/${id}`,{headers:apiHeaders()});const d=await r.json();if(!r.ok)throw new Error(d.message||'دریافت جزئیات انجام نشد');setSelectedSaved(d)}catch(err){alert(err.message)}finally{setSavedBusy(false)}}
 async function toggleFavorite(item){setSavedBusy(true);try{const r=await fetch(`/api/saved-filters/${item.id}`,{method:'PUT',headers:apiHeaders(),body:JSON.stringify({name:null,description:null,isFavorite:!item.isFavorite})});const d=await r.json();if(!r.ok)throw new Error(d.message||'تغییر علاقه‌مندی انجام نشد');await loadSavedFilters();if(selectedSaved?.id===item.id)setSelectedSaved(d)}catch(err){alert(err.message)}finally{setSavedBusy(false)}}
 async function saveNewVersion(id){if(!current?.filter)return alert('فیلتر فعالی وجود ندارد.');setSavedBusy(true);try{const r=await fetch(`/api/saved-filters/${id}/versions`,{method:'POST',headers:apiHeaders(),body:JSON.stringify({conversationId:getConversation(),tsetmcCode:null,changeNote:'ذخیره از مکالمه جاری'})});const d=await r.json();if(!r.ok)throw new Error(d.message||'نسخه جدید ذخیره نشد');setSelectedSaved(d);await loadSavedFilters()}catch(err){alert(err.message)}finally{setSavedBusy(false)}}
 async function restoreVersion(id,version){if(!confirm(`نسخه ${version} به‌عنوان نسخه فعلی بازگردانی شود؟`))return;setSavedBusy(true);try{const r=await fetch(`/api/saved-filters/${id}/restore/${version}`,{method:'POST',headers:apiHeaders(),body:JSON.stringify({note:`بازگردانی نسخه ${version}`})});const d=await r.json();if(!r.ok)throw new Error(d.message||'بازگردانی انجام نشد');setSelectedSaved(d);await loadSavedFilters()}catch(err){alert(err.message)}finally{setSavedBusy(false)}}
 async function duplicateSaved(id){setSavedBusy(true);try{const r=await fetch(`/api/saved-filters/${id}/duplicate`,{method:'POST',headers:apiHeaders(),body:JSON.stringify({name:null})});const d=await r.json();if(!r.ok)throw new Error(d.message||'کپی فیلتر انجام نشد');await loadSavedFilters();setSelectedSaved(d)}catch(err){alert(err.message)}finally{setSavedBusy(false)}}
 async function deleteSaved(id){if(!confirm('این فیلتر حذف شود؟ تاریخچه برای Audit به‌صورت soft-delete حفظ می‌شود.'))return;setSavedBusy(true);try{const r=await fetch(`/api/saved-filters/${id}`,{method:'DELETE',headers:apiHeaders()});if(!r.ok){const d=await r.json();throw new Error(d.message||'حذف انجام نشد')}setSelectedSaved(null);await loadSavedFilters()}catch(err){alert(err.message)}finally{setSavedBusy(false)}}
 async function loadAlerts(){if(!logged)return;setAlertBusy(true);try{const [rulesRes,eventsRes]=await Promise.all([fetch('/api/alerts/',{headers:apiHeaders()}),fetch('/api/alerts/events/recent?take=100',{headers:apiHeaders()})]);const rules=await rulesRes.json();const events=await eventsRes.json();if(!rulesRes.ok)throw new Error(rules.message||'دریافت هشدارها انجام نشد');if(!eventsRes.ok)throw new Error(events.message||'دریافت رویدادهای هشدار انجام نشد');setAlerts(rules.items||[]);setAlertEvents(events.items||[])}catch(err){alert(err.message)}finally{setAlertBusy(false)}}
 async function openAlerts(){if(!logged)return alert('برای ساخت هشدار ابتدا وارد شوید.');setAlertsOpen(true);await Promise.all([loadSavedFilters(),loadAlerts()])}
 async function createAlert(savedFilterId,name,cooldownSeconds,followLatestVersion=true,pinnedFilterVersion=null){if(!savedFilterId)return alert('یک فیلتر ذخیره‌شده انتخاب کنید.');setAlertBusy(true);try{const r=await fetch('/api/alerts/',{method:'POST',headers:apiHeaders(),body:JSON.stringify({savedFilterId,name:name||null,cooldownSeconds:Number(cooldownSeconds)||300,followLatestVersion,pinnedFilterVersion,isEnabled:true})});const d=await r.json();if(!r.ok)throw new Error(d.message||'ساخت هشدار انجام نشد');await loadAlerts()}catch(err){alert(err.message)}finally{setAlertBusy(false)}}
 async function toggleAlert(item){setAlertBusy(true);try{const r=await fetch(`/api/alerts/${item.id}`,{method:'PUT',headers:apiHeaders(),body:JSON.stringify({name:null,isEnabled:!item.isEnabled,cooldownSeconds:null,followLatestVersion:null,pinnedFilterVersion:null})});const d=await r.json();if(!r.ok)throw new Error(d.message||'تغییر هشدار انجام نشد');await loadAlerts()}catch(err){alert(err.message)}finally{setAlertBusy(false)}}
 async function deleteAlert(id){if(!confirm('این هشدار حذف شود؟'))return;setAlertBusy(true);try{const r=await fetch(`/api/alerts/${id}`,{method:'DELETE',headers:apiHeaders()});if(!r.ok){const d=await r.json();throw new Error(d.message||'حذف هشدار انجام نشد')}await loadAlerts()}catch(err){alert(err.message)}finally{setAlertBusy(false)}}
 async function markAlertRead(id){try{const r=await fetch(`/api/alerts/events/${id}/read`,{method:'POST',headers:apiHeaders()});if(r.ok)setAlertEvents(items=>items.map(x=>x.id===id?{...x,readAtUtc:new Date().toISOString()}:x))}catch{}}

 return <main className="app">
  <header><strong>TSEAI</strong><span>دستیار هوشمند بورس تهران</span><div className="auth"><button type="button" className="ghost" onClick={newConversation}>مکالمه جدید</button>{logged&&<button type="button" onClick={openSaved}>فیلترهای من</button>}{logged&&<button type="button" onClick={openAlerts}>هشدارها</button>}{logged?<><button type="button" onClick={()=>setOperationsOpen(true)}>مرکز مدیریت AI</button><button type="button" onClick={loadSettings}>اطلاعات پایه</button><button type="button" onClick={logout}>خروج</button></>:!otpSent?<><input value={mobile} onChange={e=>setMobile(e.target.value)} placeholder="شماره موبایل"/><button type="button" onClick={requestOtp}>دریافت کد</button></>:<><input value={code} onChange={e=>setCode(e.target.value)} placeholder="کد تایید"/><button type="button" onClick={verifyOtp}>ورود</button></>}</div></header>
  {settingsOpen&&<section className="settings"><h3>اطلاعات پایه</h3><Setting label="سقف روزانه مهمان" value={settings['AI.AnonymousDailyQuestionLimit']} save={v=>saveSetting('AI.AnonymousDailyQuestionLimit',v,'int','AI')}/><Setting label="سقف روزانه کاربر" value={settings['AI.AuthenticatedDailyQuestionLimit']} save={v=>saveSetting('AI.AuthenticatedDailyQuestionLimit',v,'int','AI')}/><Setting label="حداکثر فیلتر ذخیره‌شده" value={settings['Filters.MaxSavedFiltersPerUser']} save={v=>saveSetting('Filters.MaxSavedFiltersPerUser',v,'int','Filters')}/><Setting label="حداکثر هشدار هر کاربر" value={settings['Alerts.MaxPerUser']} save={v=>saveSetting('Alerts.MaxPerUser',v,'int','Alerts')}/><Setting label="Cooldown پیش‌فرض هشدار (ثانیه)" value={settings['Alerts.DefaultCooldownSeconds']} save={v=>saveSetting('Alerts.DefaultCooldownSeconds',v,'int','Alerts')}/><Setting label="حداکثر Cooldown هشدار (ثانیه)" value={settings['Alerts.MaxCooldownSeconds']} save={v=>saveSetting('Alerts.MaxCooldownSeconds',v,'int','Alerts')}/><Setting label="فعال بودن Poll بازار" value={settings['Market.IsEnabled']} save={v=>saveSetting('Market.IsEnabled',v,'bool','Market')}/><Setting label="شروع بازار" value={settings['Market.StartTime']} save={v=>saveSetting('Market.StartTime',v,'time','Market')}/><Setting label="پایان بازار" value={settings['Market.EndTime']} save={v=>saveSetting('Market.EndTime',v,'time','Market')}/><Setting label="Polling (ms)" value={settings['Market.PollingIntervalMs']} save={v=>saveSetting('Market.PollingIntervalMs',v,'int','Market')}/><button type="button" onClick={()=>setSettingsOpen(false)}>بستن</button></section>}
  {operationsOpen&&<AdminOperations headers={apiHeaders} onClose={()=>setOperationsOpen(false)}/>}
  {liveAlert&&<div className="live-alert" onClick={()=>{setLiveAlert(null);setAlertsOpen(true)}}><b>هشدار TSEAI</b><span>{liveAlert.message}</span></div>}
  {alertsOpen&&<AlertsPanel busy={alertBusy} rules={alerts} events={alertEvents} filters={savedFilters} create={createAlert} toggle={toggleAlert} remove={deleteAlert} markRead={markAlertRead} close={()=>setAlertsOpen(false)}/>}
  {savedOpen&&<SavedFiltersPanel busy={savedBusy} items={savedFilters} selected={selectedSaved} saveName={saveName} setSaveName={setSaveName} importCode={importCode} setImportCode={setImportCode} current={current} createSaved={createSaved} importSaved={importSaved} inspect={inspectSaved} load={loadSaved} favorite={toggleFavorite} newVersion={saveNewVersion} restore={restoreVersion} duplicate={duplicateSaved} remove={deleteSaved} close={()=>setSavedOpen(false)}/>}
  <section className="workspace">
   <aside className="filter-state"><div className="filter-state-title"><strong>فیلتر فعال</strong>{current?.version>0&&<span>نسخه {current.version}</span>}</div>{current?.filter?<><code>{current.filter}</code><div className="condition-list">{(current.conditions||[]).map(c=><button type="button" key={c.index} title={c.code} onClick={()=>sendCommand(`شرط ${c.index} را حذف کن`)}><b>{c.index}</b><span>{c.explanation}</span></button>)}</div><div className="filter-actions"><button type="button" disabled={!current?.canUndo||loading} onClick={()=>sendCommand('یک مرحله برگرد')}>↶ بازگشت</button><button type="button" disabled={!current?.canRedo||loading} onClick={()=>sendCommand('دوباره اعمال کن')}>↷ اعمال مجدد</button><button type="button" disabled={loading} onClick={()=>sendCommand('کل فیلتر رو پاک کن')}>پاک کردن</button>{logged?<button type="button" className="primary" onClick={openSaved}>ذخیره / نسخه‌بندی</button>:<button type="button" onClick={()=>alert('برای ذخیره فیلتر وارد شوید.')}>ورود برای ذخیره</button>}</div><div className="result-tools"><label>مرتب‌سازی<select value={current?.sortBy||''} onChange={e=>runCurrent({page:1,sortBy:e.target.value||null})}><option value="">بدون مرتب‌سازی</option><option value="tradeValue">ارزش معاملات</option><option value="tradeVolume">حجم معاملات</option><option value="lastPrice">آخرین قیمت</option><option value="closingPrice">قیمت پایانی</option><option value="symbol">نماد</option></select></label><button type="button" onClick={()=>runCurrent({page:1,sortDescending:!(current?.sortDescending??true)})}>{current?.sortDescending===false?'صعودی ↑':'نزولی ↓'}</button></div>{current?.totalPages>1&&<div className="pager"><button type="button" disabled={current.page<=1||loading} onClick={()=>runCurrent({page:current.page-1})}>قبلی</button><span>صفحه {current.page} از {current.totalPages}</span><button type="button" disabled={current.page>=current.totalPages||loading} onClick={()=>runCurrent({page:current.page+1})}>بعدی</button></div>}{typeof current?.matched==='number'&&<div className="current-results"><small>{current.matched} نماد منطبق</small><div className="symbols">{(current.results||[]).slice(0,30).map(x=><span key={`current-${x.insCode}-${x.symbol}`}>{x.symbol}</span>)}</div></div>}</>:<p className="empty">هنوز شرطی ساخته نشده است.</p>}</aside>
   <section className="chat">{messages.length===0&&<div className="hero"><h1>از TSEAI بپرس</h1><p>درباره بازار، شرکت‌ها، مدیران، اخبار و قوانین بازار سرمایه سؤال کنید.</p></div>}{messages.map((m,i)=><RichChatMessage key={i} message={m}/>)}{loading&&<SearchLoader/>}<div ref={end}/></section>
  </section>
  <form onSubmit={ask}><textarea value={q} onChange={e=>setQ(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey&&!e.nativeEvent.isComposing){e.preventDefault();e.currentTarget.form?.requestSubmit()}}} title="Enter برای ارسال؛ Shift+Enter برای رفتن به خط بعد" placeholder="سؤال خود را درباره بورس تهران بنویسید…"/><button disabled={loading}>ارسال</button></form>
 </main>;
}


function RichChatMessage({message:m}){
 if(m.role==='user'||m.role==='error')return <div className={'msg '+m.role}><p>{m.text}</p></div>;
 const d=m.data||{};
 return <div className="msg assistant rich-answer">
  {d.answer&&<TypewriterText text={String(d.answer)} instant={m.restored===true}/>}
 </div>
}
function TypewriterText({text,instant=false}){
 const[visible,setVisible]=useState(instant?text:'');const[done,setDone]=useState(instant);
 useEffect(()=>{const reduceMotion=globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches;if(instant||reduceMotion){setVisible(text);setDone(true);return}setVisible('');setDone(false);const words=text.match(/\S+\s*/g)||[text];let i=0;const timer=setInterval(()=>{i=Math.min(words.length,i+1);setVisible(words.slice(0,i).join(''));if(i>=words.length){clearInterval(timer);setDone(true)}},TYPEWRITER_WORD_INTERVAL_MS);return()=>clearInterval(timer)},[text,instant]);
 return <div className={'answer-text '+(done?'':'typing')}>{visible.split('\n').map((x,i)=><p key={i}>{x||'\u00a0'}</p>)}</div>
}
function SearchLoader(){
 return <div className="msg assistant search-loader" role="status" aria-live="polite" aria-label="در حال جستجو">
  <span className="search-loader-mark" aria-hidden="true"/>
  <span>در حال جستجو</span>
  <span className="search-loader-dots" aria-hidden="true"><i/><i/><i/></span>
 </div>
}
function titleFor(d){if(d.type==='market_comparison')return 'مقایسه بازار';if(d.structuredQuery)return 'نتیجه جستجوی ساختاریافته';if(d.market)return 'وضعیت نماد';if(d.filter)return 'نتیجه فیلتر';if((d.knowledge||[]).length)return 'پاسخ مستند';return 'TSEAI'}
function MarketCard({market:m,analytics:a}){return <section className="market-card"><div><h3>{m.symbol}</h3><small>{m.symbolName}</small></div><div className="market-grid"><Metric t="آخرین قیمت" v={fmt(m.lastPrice)}/><Metric t="پایانی" v={fmt(m.closingPrice)}/><Metric t="تغییر" v={m.lastPricePercent==null?'—':m.lastPricePercent+'٪'}/><Metric t="حجم" v={fmt(m.tradeVolume)}/><Metric t="ارزش" v={fmt(m.tradeValue)}/><Metric t="P/E" v={m.pe??m.pE??'—'}/></div>{a&&<div className="analytics-row"><Metric t="قدرت خریدار" v={metric(a.tradingPower?.buyerPower)}/><Metric t="عدم تعادل اردربوک" v={metric(a.orderBook?.imbalance)}/><Metric t="حجم/مبنا" v={metric(a.volume?.volumeVsBaseVolume)}/></div>}</section>}
function ComparisonCard({value:c}){return <section className="comparison-card"><MarketCard market={c.primary} analytics={c.primaryAnalytics}/><span className="vs">VS</span><MarketCard market={c.secondary} analytics={c.secondaryAnalytics}/></section>}
function StructuredResultCard({value:v}){return <section className="result-card"><div className="result-summary"><b>{v.matched??0}</b><span>تطابق از {v.scanned??0} نماد</span></div><div className="result-table">{(v.results||[]).slice(0,50).map((x,i)=><div className="result-row" key={x.symbolCode||x.insCode||i}><b>{i+1}</b><strong>{x.symbol}</strong><span>{x.symbolName}</span><small>{x.qualityStatus}</small></div>)}</div></section>}
function FilterResultCard({value:v}){return <section className="filter-result-card">{(v.code||v.filter)&&<code>{v.code||v.filter}</code>}<div><b>{v.matched??0}</b> نماد منطبق · {v.scanned??0} بررسی‌شده</div><div className="symbols">{(v.results||[]).slice(0,30).map((x,i)=><span key={x.insCode||i}>{x.symbol}</span>)}</div></section>}
function KnowledgeCards({items}){return <section className="knowledge-cards">{items.slice(0,6).map((x,i)=><article key={i}><b>{x.citation?.title||'منبع دانش'}</b><p>{String(x.text||'').slice(0,320)}</p>{x.citation?.publishedAt&&<small>{formatPersianDate(x.citation.publishedAt)}</small>}{x.citation?.url&&<a href={x.citation.url} target="_blank" rel="noreferrer">مشاهده منبع</a>}</article>)}</section>}
function EvidenceTray({evidence}){return <details className="evidence-tray"><summary>منابع و شواهد ({evidence.length})</summary>{evidence.map(e=><article key={e.evidenceId}><span className="citation-label">[{e.citationLabel}]</span><div><b>{e.title}</b><small>{e.authority} · {e.sourceType} · {e.sourceId}</small>{e.observedAtUtc&&<small>{formatPersianDateTime(e.observedAtUtc)}</small>}</div></article>)}</details>}
function Metric({t,v}){return <div className="metric"><small>{t}</small><strong>{v??'—'}</strong></div>}
const fmt=v=>v==null?'—':Number(v).toLocaleString('fa-IR');
const metric=x=>x?.availability==='Available'||x?.availability===0?(x.value??'—'):'—';

function SavedFiltersPanel({busy,items,selected,saveName,setSaveName,importCode,setImportCode,current,createSaved,importSaved,inspect,load,favorite,newVersion,restore,duplicate,remove,close}){
 return <div className="modal-backdrop"><section className="saved-panel"><div className="saved-head"><div><h2>فیلترهای من</h2><small>{items.length} فیلتر ذخیره‌شده</small></div><button type="button" onClick={close}>بستن</button></div>
  <div className="save-current"><input value={saveName} onChange={e=>setSaveName(e.target.value)} placeholder="نام فیلتر جدید / Import"/><button type="button" className="primary" disabled={!current?.filter||busy} onClick={createSaved}>ذخیره فیلتر فعال</button></div><div className="import-filter"><textarea value={importCode} onChange={e=>setImportCode(e.target.value)} placeholder="یا کد Simple Filter از TSETMC را Paste کنید؛ مثال: (pl)>(pc) && (tvol)>1000000"/><button type="button" disabled={!importCode.trim()||busy} onClick={importSaved}>Import و ذخیره</button></div>
  <div className="saved-layout"><div className="saved-list">{busy&&<p>در حال دریافت…</p>}{!busy&&items.length===0&&<p className="empty">هنوز فیلتر ذخیره‌شده‌ای ندارید.</p>}{items.map(x=><article className={selected?.id===x.id?'saved-card active':'saved-card'} key={x.id}><button type="button" className="saved-main" onClick={()=>inspect(x.id)}><strong>{x.name}</strong><small>نسخه {x.currentVersion}</small><span>{x.persianExplanation}</span></button><button type="button" className="star" title="علاقه‌مندی" onClick={()=>favorite(x)}>{x.isFavorite?'★':'☆'}</button><button type="button" onClick={()=>load(x.id)}>بارگذاری</button></article>)}</div>
   <div className="saved-details">{selected?<><div className="details-title"><div><h3>{selected.name}</h3><code>{selected.tsetmcCode}</code><p>{selected.persianExplanation}</p></div><span>نسخه فعلی {selected.currentVersion}</span></div><div className="saved-actions"><button type="button" className="primary" onClick={()=>load(selected.id)}>بارگذاری در مکالمه</button><button type="button" disabled={!current?.filter||busy} onClick={()=>newVersion(selected.id)}>ذخیره فیلتر فعال به‌عنوان نسخه جدید</button><button type="button" onClick={()=>navigator.clipboard?.writeText(selected.tsetmcCode)}>کپی کد TSETMC</button><button type="button" onClick={()=>duplicate(selected.id)}>ایجاد کپی</button><button type="button" className="danger" onClick={()=>remove(selected.id)}>حذف</button></div><h4>تاریخچه نسخه‌ها</h4><div className="versions">{(selected.versions||[]).map(v=><div className={v.version===selected.currentVersion?'version current':'version'} key={v.version}><div><b>نسخه {v.version}</b><small>{v.changeType} · {formatPersianDateTime(v.createdAtUtc)}</small><code>{v.tsetmcCode}</code>{v.changeNote&&<span>{v.changeNote}</span>}</div>{v.version!==selected.currentVersion&&<button type="button" onClick={()=>restore(selected.id,v.version)}>بازگردانی</button>}</div>)}</div></>:<p className="empty">برای مشاهده تاریخچه، یک فیلتر را انتخاب کنید.</p>}</div>
  </div>
 </section></div>
}


function normalizeAlertEvent(x){return {id:x.eventId,alertRuleId:x.alertRuleId,alertName:x.alertName,savedFilterId:x.savedFilterId,filterName:x.filterName,filterVersion:x.filterVersion,insCode:x.insCode,symbolCode:x.symbolCode,symbol:x.symbol,symbolName:x.symbolName,message:x.message,lastPrice:x.lastPrice,closingPrice:x.closingPrice,tradeVolume:x.tradeVolume,tradeValue:x.tradeValue,tradingDate:x.tradingDate,triggeredAtUtc:x.triggeredAtUtc,readAtUtc:null}}

function AlertsPanel({busy,rules,events,filters,create,toggle,remove,markRead,close}){
 const[filterId,setFilterId]=useState(filters[0]?.id||'');const[name,setName]=useState('');const[cooldown,setCooldown]=useState('300');const[followLatest,setFollowLatest]=useState(true);const[pinnedVersion,setPinnedVersion]=useState('');
 const selectedFilter=filters.find(x=>x.id===filterId);
 useEffect(()=>{if(!filterId&&filters[0])setFilterId(filters[0].id)},[filters,filterId]);
 useEffect(()=>{if(selectedFilter&&!followLatest)setPinnedVersion(String(selectedFilter.currentVersion||1))},[selectedFilter,followLatest]);
 return <div className="modal-backdrop"><section className="saved-panel alert-panel"><div className="saved-head"><div><h2>هشدارهای بازار</h2><small>فقط انتقال false → true اعلان ایجاد می‌کند؛ مشاهده اولیه شرط اعلان نمی‌دهد.</small></div><button type="button" onClick={close}>بستن</button></div>
  <div className="alert-create"><select value={filterId} onChange={e=>setFilterId(e.target.value)}><option value="">انتخاب فیلتر ذخیره‌شده</option>{filters.map(f=><option key={f.id} value={f.id}>{f.name} · v{f.currentVersion}</option>)}</select><input value={name} onChange={e=>setName(e.target.value)} placeholder="نام هشدار (اختیاری)"/><input value={cooldown} onChange={e=>setCooldown(e.target.value)} inputMode="numeric" placeholder="Cooldown ثانیه"/><label className="alert-version-mode"><input type="checkbox" checked={followLatest} onChange={e=>setFollowLatest(e.target.checked)}/><span>دنبال‌کردن آخرین نسخه فیلتر</span></label>{!followLatest&&<input value={pinnedVersion} min="1" max={selectedFilter?.currentVersion||1} type="number" onChange={e=>setPinnedVersion(e.target.value)} placeholder="نسخه ثابت"/>}<button type="button" className="primary" disabled={busy||!filterId||(!followLatest&&!pinnedVersion)} onClick={()=>create(filterId,name,cooldown,followLatest,followLatest?null:Number(pinnedVersion))}>ساخت هشدار</button></div>
  <div className="alert-layout"><div><h3>قوانین فعال</h3><div className="alert-rules">{rules.length===0&&<p className="empty">هنوز هشداری ندارید.</p>}{rules.map(a=><article key={a.id} className={a.isEnabled?'alert-rule enabled':'alert-rule'}><div><b>{a.name}</b><span>{a.savedFilterName} · نسخه {a.effectiveFilterVersion}</span><small>Cooldown: {a.cooldownSeconds} ثانیه {a.followLatestVersion?'· دنبال‌کردن آخرین نسخه':'· نسخه ثابت'}</small></div><button type="button" className={a.isEnabled?'ghost':'primary'} onClick={()=>toggle(a)}>{a.isEnabled?'توقف':'فعال'}</button><button type="button" className="danger" onClick={()=>remove(a.id)}>حذف</button></article>)}</div></div>
   <div><h3>آخرین رویدادها</h3><div className="alert-events">{events.length===0&&<p className="empty">هنوز هشداری Trigger نشده است.</p>}{events.map(e=><article key={e.id} className={e.readAtUtc?'alert-event read':'alert-event'} onClick={()=>!e.readAtUtc&&markRead(e.id)}><div><b>{e.symbol} · {e.alertName}</b><span>{e.message}</span><small>{formatPersianDateTime(e.triggeredAtUtc)} · نسخه فیلتر {e.filterVersion}</small></div>{!e.readAtUtc&&<i>جدید</i>}</article>)}</div></div>
  </div>
 </section></div>
}

function Setting({label,value,save}){const[v,setV]=useState(value??'');useEffect(()=>setV(value??''),[value]);return <label className="setting"><span>{label}</span><input value={v} onChange={e=>setV(e.target.value)}/><button type="button" onClick={()=>save(v)}>ذخیره</button></label>}
