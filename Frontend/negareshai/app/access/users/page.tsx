"use client";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { createIdentityUser, deleteIdentityUser, IdentityRole, IdentityUser, listIdentityRoles, listIdentityUsers, restoreIdentityUser, updateIdentityUser } from "../../../lib/api";
import AccessShell from "../AccessShell";

const empty = { userName:"", password:"", firstName:"", lastName:"", email:"", phone:"", active:true, roleIds:[] as string[] };
export default function UsersPage(){
 const [users,setUsers]=useState<IdentityUser[]>([]),[roles,setRoles]=useState<IdentityRole[]>([]),[edit,setEdit]=useState<IdentityUser|null>(null),[includeDeleted,setIncludeDeleted]=useState(false),[draft,setDraft]=useState(empty),[message,setMessage]=useState(""),[search,setSearch]=useState(""),[busy,setBusy]=useState(false);
 async function load(deleted=includeDeleted){const [u,r]=await Promise.all([listIdentityUsers(deleted),listIdentityRoles()]);setUsers(u);setRoles(r.filter(x=>!x.isDeleted))}
 useEffect(()=>{void load().catch(()=>setMessage("دریافت کاربران انجام نشد."))},[includeDeleted]);
 const visible=useMemo(()=>{const q=search.trim().toLowerCase();return q?users.filter(x=>`${x.firstName} ${x.lastName} ${x.userName} ${x.email||""}`.toLowerCase().includes(q)):users},[users,search]);
 function reset(){setEdit(null);setDraft(empty)}
 function select(u:IdentityUser){setEdit(u);setDraft({userName:u.userName,password:"",firstName:u.firstName,lastName:u.lastName,email:u.email||"",phone:u.phoneNumber||"",active:u.isActive,roleIds:u.roleIds})}
 async function submit(e:FormEvent){e.preventDefault();setBusy(true);setMessage("");try{const input={userName:draft.userName,firstName:draft.firstName,lastName:draft.lastName,email:draft.email||undefined,phoneNumber:draft.phone||undefined,password:draft.password||undefined,isActive:draft.active,roleIds:draft.roleIds};if(edit)await updateIdentityUser(edit.id,input);else await createIdentityUser({...input,password:draft.password});reset();await load();setMessage("اطلاعات کاربر با موفقیت ذخیره شد.")}catch(error){setMessage(error instanceof Error?error.message:"ذخیره کاربر انجام نشد.")}finally{setBusy(false)}}
 return <AccessShell title="کاربران" description="حساب‌های سازمان، وضعیت فعالیت و نقش‌های هر کاربر را از یک محل مدیریت کنید." badge={`${users.filter(x=>x.isActive&&!x.isDeleted).length} کاربر فعال`}>
  <section className="access-dashboard-grid">
   <article className="access-panel access-list-panel">
    <div className="access-panel-head"><div><h2>فهرست کاربران</h2><p>{visible.length} حساب نمایش داده می‌شود</p></div><button className="access-new" onClick={reset}>+ کاربر جدید</button></div>
    <div className="access-toolbar"><label className="access-search"><span>⌕</span><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="جست‌وجوی نام، نام کاربری یا ایمیل..."/></label><label className="access-switch"><input type="checkbox" checked={includeDeleted} onChange={e=>setIncludeDeleted(e.target.checked)}/><span/>نمایش حذف‌شده‌ها</label></div>
    <div className="access-table-head"><span>کاربر</span><span>نقش‌ها</span><span>وضعیت</span><span>عملیات</span></div>
    <div className="access-rows">{visible.map(u=><div className={`access-data-row ${edit?.id===u.id?"selected":""}`} key={u.id}>
      <div className="access-identity"><i>{(u.firstName||u.userName).charAt(0)}</i><span><strong>{u.firstName} {u.lastName}</strong><small>{u.userName}{u.email?` · ${u.email}`:""}</small></span></div>
      <span className="access-role-count">{u.roleIds.length?`${u.roleIds.length} نقش`:"بدون نقش"}</span>
      <b className={`access-status ${u.isDeleted?"deleted":u.isActive?"active":"inactive"}`}>{u.isDeleted?"حذف‌شده":u.isActive?"فعال":"غیرفعال"}</b>
      <div className="access-row-actions">{u.isDeleted?<button onClick={()=>void restoreIdentityUser(u.id).then(()=>load())}>بازیابی</button>:<><button onClick={()=>select(u)}>ویرایش</button>{u.userName.toLowerCase()!=="adminuser"&&<button className="danger" onClick={()=>window.confirm("این کاربر حذف شود؟")&&void deleteIdentityUser(u.id).then(()=>load())}>حذف</button>}</>}</div>
    </div>)}</div>
   </article>
   <article className="access-panel access-editor"><div className="access-panel-head"><div><h2>{edit?"ویرایش کاربر":"ایجاد کاربر"}</h2><p>{edit?`ویرایش حساب ${edit.userName}`:"اطلاعات حساب جدید را تکمیل کنید"}</p></div>{edit&&<button className="access-icon-button" onClick={reset}>×</button>}</div>
    <form onSubmit={e=>void submit(e)}><div className="access-form-grid">
      <label><span>نام</span><input value={draft.firstName} onChange={e=>setDraft({...draft,firstName:e.target.value})} required/></label><label><span>نام خانوادگی</span><input value={draft.lastName} onChange={e=>setDraft({...draft,lastName:e.target.value})} required/></label>
      <label className="full"><span>نام کاربری</span><input dir="ltr" value={draft.userName} onChange={e=>setDraft({...draft,userName:e.target.value})} required/></label><label className="full"><span>{edit?"رمز عبور جدید (اختیاری)":"رمز عبور اولیه"}</span><input dir="ltr" type="password" value={draft.password} onChange={e=>setDraft({...draft,password:e.target.value})} required={!edit}/></label>
      <label className="full"><span>ایمیل</span><input dir="ltr" type="email" value={draft.email} onChange={e=>setDraft({...draft,email:e.target.value})}/></label><label className="full"><span>شماره تماس</span><input dir="ltr" value={draft.phone} onChange={e=>setDraft({...draft,phone:e.target.value})}/></label>
    </div><div className="access-form-section"><strong>نقش‌های کاربر</strong><div className="access-role-options">{roles.map(r=><label className={draft.roleIds.includes(r.id)?"checked":""} key={r.id}><input type="checkbox" checked={draft.roleIds.includes(r.id)} onChange={e=>setDraft({...draft,roleIds:e.target.checked?[...draft.roleIds,r.id]:draft.roleIds.filter(id=>id!==r.id)})}/><span>{r.displayName}<small>{r.name}</small></span></label>)}</div></div>
    <label className="access-active-check"><input type="checkbox" checked={draft.active} onChange={e=>setDraft({...draft,active:e.target.checked})}/><span/>حساب کاربر فعال باشد</label>
    {message&&<p className="access-message">{message}</p>}<footer><button type="button" onClick={reset}>انصراف</button><button className="primary" disabled={busy}>{busy?"در حال ذخیره...":edit?"ذخیره تغییرات":"ایجاد کاربر"}</button></footer></form>
   </article>
  </section>
 </AccessShell>;
}
