"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  AccessMenu, createIdentityUser, deleteIdentityUser, getDirectUserAccess,
  IdentityRole, IdentityUser, listIdentityRoles, listIdentityUsers,
  listManagementMenus, restoreIdentityUser, saveDirectUserAccess, updateIdentityUser,
} from "../../../lib/api";
import AccessShell from "../AccessShell";

type Mode = "inherit" | "grant" | "deny";
type EditorTab = "profile" | "access";
const modeLabels: Record<Mode,string> = { inherit:"ارث‌بری", grant:"اعطا", deny:"منع" };
const empty = { userName:"", password:"", firstName:"", lastName:"", email:"", phone:"", active:true, roleIds:[] as string[] };

function PermissionBranch({node,modes,onChange,query}:{node:AccessMenu;modes:Record<number,Mode>;onChange:(id:number,m:Mode)=>void;query:string}){
  const title=node.title||node.accessForm?.formTitle||`منو ${node.accessMenuId}`;
  const children=node.children||[];
  const selfMatches=!query||JSON.stringify(node).toLowerCase().includes(query);
  if(!selfMatches)return null;
  const mode=modes[node.accessMenuId]||"inherit";
  return <li>
    <div className="permission-row enhanced">
      <div><i className={`mode-dot ${mode}`}/><span><strong>{title}</strong>{node.accessForm?.url&&<small>{node.accessForm.url}</small>}</span></div>
      <span className="permission-segments">{(["inherit","grant","deny"] as Mode[]).map(item=><label className={mode===item?`selected ${item}`:""} key={item}><input type="radio" name={`menu-${node.accessMenuId}`} checked={mode===item} onChange={()=>onChange(node.accessMenuId,item)}/>{modeLabels[item]}</label>)}</span>
    </div>
    {children.length>0&&<ul>{children.map(child=><PermissionBranch key={child.accessMenuId} node={child} modes={modes} onChange={onChange} query={query}/>)}</ul>}
  </li>;
}

export default function UsersPage(){
  const [users,setUsers]=useState<IdentityUser[]>([]),[roles,setRoles]=useState<IdentityRole[]>([]),[menus,setMenus]=useState<AccessMenu[]>([]);
  const [edit,setEdit]=useState<IdentityUser|null>(null),[editorOpen,setEditorOpen]=useState(false),[tab,setTab]=useState<EditorTab>("profile");
  const [includeDeleted,setIncludeDeleted]=useState(false),[draft,setDraft]=useState(empty),[message,setMessage]=useState(""),[search,setSearch]=useState(""),[permissionSearch,setPermissionSearch]=useState("");
  const [modes,setModes]=useState<Record<number,Mode>>({}),[busy,setBusy]=useState(false),[accessBusy,setAccessBusy]=useState(false);

  async function load(deleted=includeDeleted){const [u,r,m]=await Promise.all([listIdentityUsers(deleted),listIdentityRoles(),listManagementMenus()]);setUsers(u);setRoles(r.filter(x=>!x.isDeleted));setMenus(m)}
  useEffect(()=>{void load().catch(()=>setMessage("دریافت اطلاعات کاربران انجام نشد."))},[includeDeleted]);
  const visible=useMemo(()=>{const q=search.trim().toLowerCase();return q?users.filter(x=>`${x.firstName} ${x.lastName} ${x.userName} ${x.email||""}`.toLowerCase().includes(q)):users},[users,search]);
  const stats=useMemo(()=>({active:users.filter(x=>x.isActive&&!x.isDeleted).length,inactive:users.filter(x=>!x.isActive&&!x.isDeleted).length,withoutRole:users.filter(x=>!x.isDeleted&&!x.roleIds.length).length}),[users]);
  const counts=useMemo(()=>Object.values(modes).reduce((a,m)=>({...a,[m]:a[m]+1}),{inherit:0,grant:0,deny:0} as Record<Mode,number>),[modes]);

  function close(){setEditorOpen(false);setEdit(null);setDraft(empty);setTab("profile");setMessage("");setModes({})}
  function create(){setEdit(null);setDraft(empty);setTab("profile");setEditorOpen(true);setMessage("")}
  async function select(u:IdentityUser,nextTab:EditorTab="profile"){
    setEdit(u);setDraft({userName:u.userName,password:"",firstName:u.firstName,lastName:u.lastName,email:u.email||"",phone:u.phoneNumber||"",active:u.isActive,roleIds:u.roleIds});setTab(nextTab);setEditorOpen(true);setMessage("");
    if(nextTab==="access")await loadAccess(u.id);
  }
  async function loadAccess(userId:string){setAccessBusy(true);try{const x=await getDirectUserAccess(userId);const next:Record<number,Mode>={};x.grants.forEach(id=>next[id]="grant");x.denies.forEach(id=>next[id]="deny");setModes(next)}catch{setMessage("دریافت دسترسی مستقیم کاربر انجام نشد.")}finally{setAccessBusy(false)}}
  async function changeTab(next:EditorTab){setTab(next);setMessage("");if(next==="access"&&edit)await loadAccess(edit.id)}
  async function submit(e:FormEvent){e.preventDefault();setBusy(true);setMessage("");try{const input={userName:draft.userName,firstName:draft.firstName,lastName:draft.lastName,email:draft.email||undefined,phoneNumber:draft.phone||undefined,password:draft.password||undefined,isActive:draft.active,roleIds:draft.roleIds};if(edit)await updateIdentityUser(edit.id,input);else await createIdentityUser({...input,password:draft.password});await load();setMessage("اطلاعات کاربر با موفقیت ذخیره شد.");if(!edit)setTimeout(close,600)}catch(error){setMessage(error instanceof Error?error.message:"ذخیره کاربر انجام نشد.")}finally{setBusy(false)}}
  async function saveAccess(){if(!edit)return;setAccessBusy(true);setMessage("");const entries=Object.entries(modes);try{await saveDirectUserAccess(edit.id,entries.filter(([,m])=>m==="grant").map(([id])=>Number(id)),entries.filter(([,m])=>m==="deny").map(([id])=>Number(id)));setMessage("دسترسی مستقیم کاربر با موفقیت ذخیره شد.")}catch(error){setMessage(error instanceof Error?error.message:"ذخیره دسترسی انجام نشد.")}finally{setAccessBusy(false)}}

  return <AccessShell title="مدیریت کاربران" description="حساب‌ها، نقش‌ها و استثناهای دسترسی هر کاربر را در یک فضای یکپارچه مدیریت کنید." badge={`${stats.active} کاربر فعال`}>
    <section className="access-metrics">
      <article><i className="metric-purple">●</i><div><strong>{users.filter(x=>!x.isDeleted).length}</strong><span>کل کاربران</span></div></article>
      <article><i className="metric-green">✓</i><div><strong>{stats.active}</strong><span>کاربر فعال</span></div></article>
      <article><i className="metric-amber">○</i><div><strong>{stats.inactive}</strong><span>کاربر غیرفعال</span></div></article>
      <article><i className="metric-red">!</i><div><strong>{stats.withoutRole}</strong><span>بدون نقش</span></div></article>
    </section>
    <article className="access-panel access-list-panel users-workspace">
      <div className="access-panel-head"><div><h2>کاربران سازمان</h2><p>هویت، نقش و دسترسی مستقیم هر کاربر را مدیریت کنید.</p></div><button className="access-new" onClick={create}><span>＋</span> افزودن کاربر</button></div>
      <div className="access-toolbar"><label className="access-search"><span>⌕</span><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="جست‌وجو با نام، نام کاربری یا ایمیل..."/></label><label className="access-switch"><input type="checkbox" checked={includeDeleted} onChange={e=>setIncludeDeleted(e.target.checked)}/><span/>نمایش حذف‌شده‌ها</label></div>
      <div className="access-table-head user-table"><span>کاربر</span><span>نقش‌ها</span><span>وضعیت</span><span>مدیریت</span></div>
      <div className="access-rows">{visible.map(u=><div className="access-data-row user-table" key={u.id}>
        <button className="user-main-cell" onClick={()=>void select(u)}><i>{(u.firstName||u.userName).charAt(0)}</i><span><strong>{u.firstName} {u.lastName}</strong><small>@{u.userName}{u.email?` · ${u.email}`:""}</small></span></button>
        <div className="user-role-chips">{u.roleIds.length?<><span>{roles.find(r=>r.id===u.roleIds[0])?.displayName||"نقش سازمانی"}</span>{u.roleIds.length>1&&<b>+{u.roleIds.length-1}</b>}</>:<em>بدون نقش</em>}</div>
        <b className={`access-status ${u.isDeleted?"deleted":u.isActive?"active":"inactive"}`}>{u.isDeleted?"حذف‌شده":u.isActive?"فعال":"غیرفعال"}</b>
        <div className="access-row-actions">{u.isDeleted?<button onClick={()=>void restoreIdentityUser(u.id).then(()=>load())}>بازیابی</button>:<><button onClick={()=>void select(u,"profile")}>مشخصات</button><button className="permission-action" onClick={()=>void select(u,"access")}>دسترسی‌ها</button>{u.userName.toLowerCase()!=="adminuser"&&<button className="danger icon-only" title="حذف کاربر" onClick={()=>window.confirm("این کاربر حذف شود؟")&&void deleteIdentityUser(u.id).then(()=>load())}>×</button>}</>}</div>
      </div>)}</div>
      {!visible.length&&<div className="users-empty"><i>⌕</i><strong>کاربری پیدا نشد</strong><span>عبارت جست‌وجو یا فیلتر نمایش را تغییر دهید.</span></div>}
    </article>

    {editorOpen&&<div className={`user-drawer-backdrop ${!edit?"modal-mode":""}`} onMouseDown={e=>{if(e.target===e.currentTarget)close()}}><aside className={`user-drawer ${!edit?"create-user-modal":""}`} aria-label="مدیریت کاربر">
      <header className="user-drawer-header"><div className="drawer-user-avatar">{(draft.firstName||draft.userName||"+").charAt(0)}</div><div><small>{edit?"مدیریت حساب کاربری":"حساب کاربری جدید"}</small><h2>{edit?`${edit.firstName} ${edit.lastName}`:"افزودن کاربر"}</h2><p>{edit?`@${edit.userName}`:"مشخصات و نقش‌های کاربر را ثبت کنید"}</p></div><button onClick={close}>×</button></header>
      {edit&&<nav className="user-editor-tabs"><button className={tab==="profile"?"active":""} onClick={()=>void changeTab("profile")}><span>01</span> مشخصات و نقش‌ها</button><button className={tab==="access"?"active":""} onClick={()=>void changeTab("access")}><span>02</span> دسترسی مستقیم {counts.grant+counts.deny>0&&<b>{counts.grant+counts.deny}</b>}</button></nav>}
      <div className="user-drawer-body">{tab==="profile"?<form onSubmit={e=>void submit(e)}>
        <div className="drawer-section-title"><div><strong>اطلاعات پایه</strong><span>مشخصات هویتی و اطلاعات تماس</span></div></div>
        <div className="access-form-grid"><label><span>نام</span><input value={draft.firstName} onChange={e=>setDraft({...draft,firstName:e.target.value})} required/></label><label><span>نام خانوادگی</span><input value={draft.lastName} onChange={e=>setDraft({...draft,lastName:e.target.value})} required/></label><label className="full"><span>نام کاربری</span><input dir="ltr" value={draft.userName} onChange={e=>setDraft({...draft,userName:e.target.value})} required/></label><label className="full"><span>{edit?"رمز عبور جدید (اختیاری)":"رمز عبور اولیه"}</span><input dir="ltr" type="password" value={draft.password} onChange={e=>setDraft({...draft,password:e.target.value})} required={!edit}/></label><label><span>ایمیل</span><input dir="ltr" type="email" value={draft.email} onChange={e=>setDraft({...draft,email:e.target.value})}/></label><label><span>شماره تماس</span><input dir="ltr" value={draft.phone} onChange={e=>setDraft({...draft,phone:e.target.value})}/></label></div>
        <div className="drawer-section-title roles-title"><div><strong>نقش‌های سازمانی</strong><span>مجوزهای پایه از نقش‌های انتخاب‌شده به ارث می‌رسند.</span></div><b>{draft.roleIds.length} نقش</b></div>
        <div className="access-role-options drawer-roles">{roles.map(r=><label className={draft.roleIds.includes(r.id)?"checked":""} key={r.id}><input type="checkbox" checked={draft.roleIds.includes(r.id)} onChange={e=>setDraft({...draft,roleIds:e.target.checked?[...draft.roleIds,r.id]:draft.roleIds.filter(id=>id!==r.id)})}/><i>{draft.roleIds.includes(r.id)?"✓":""}</i><span>{r.displayName}<small>{r.name}</small></span></label>)}</div>
        <label className="access-active-check drawer-active"><input type="checkbox" checked={draft.active} onChange={e=>setDraft({...draft,active:e.target.checked})}/><span/><div><strong>حساب فعال باشد</strong><small>کاربر امکان ورود به سامانه را داشته باشد.</small></div></label>
        {message&&<p className="access-message">{message}</p>}<footer className="drawer-footer"><button type="button" onClick={close}>انصراف</button><button className="primary" disabled={busy}>{busy?"در حال ذخیره...":edit?"ذخیره تغییرات":"ایجاد کاربر"}</button></footer>
      </form>:<div className="direct-access-editor">
        <div className="direct-access-note"><i>i</i><div><strong>استثناهای دسترسی این کاربر</strong><span>«منع» بر همه نقش‌ها اولویت دارد. برای استفاده از دسترسی نقش، گزینه «ارث‌بری» را نگه دارید.</span></div></div>
        <div className="direct-access-toolbar"><label className="access-search standalone"><span>⌕</span><input value={permissionSearch} onChange={e=>setPermissionSearch(e.target.value)} placeholder="جست‌وجو در دسترسی‌ها..."/></label><div className="permission-summary"><span className="grant">{counts.grant} اعطا</span><span className="deny">{counts.deny} منع</span></div></div>
        {accessBusy?<div className="drawer-loading">در حال دریافت دسترسی‌ها...</div>:<ul className="permission-tree enhanced direct drawer-tree">{menus.map(x=><PermissionBranch key={x.accessMenuId} node={x} modes={modes} onChange={(id,m)=>setModes(current=>({...current,[id]:m}))} query={permissionSearch.trim().toLowerCase()}/>)}</ul>}
        {message&&<p className="access-message">{message}</p>}<footer className="drawer-footer"><span>تغییرات پس از ذخیره برای کاربر اعمال می‌شود.</span><button className="primary" disabled={accessBusy} onClick={()=>void saveAccess()}>{accessBusy?"در حال ذخیره...":"ذخیره دسترسی‌ها"}</button></footer>
      </div>}</div>
    </aside></div>}
  </AccessShell>;
}
