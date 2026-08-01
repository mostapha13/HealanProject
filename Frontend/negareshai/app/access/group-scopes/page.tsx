"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ContractGroup, IdentityRole, IdentityUser, listContractCatalog, listDataScopes, listDocumentGroups,
  listIdentityRoles, listIdentityUsers, saveDataScopes
} from "../../../lib/api";
import { requireAuthenticatedUser } from "../../../lib/auth";

type Choice = "inherit" | "grant" | "deny";

export default function GroupScopesPage() {
  const [subjectType, setSubjectType] = useState(2);
  const [resourceType, setResourceType] = useState(2);
  const [subjectId, setSubjectId] = useState("");
  const [users, setUsers] = useState<IdentityUser[]>([]);
  const [roles, setRoles] = useState<IdentityRole[]>([]);
  const [groups, setGroups] = useState<Array<{id:string; name:string}>>([]);
  const [choices, setChoices] = useState<Record<string, Choice>>({});
  const [busy, setBusy] = useState(true);
  const [message, setMessage] = useState("");

  const subjects = useMemo(() => subjectType === 1
    ? users.map(x => ({id:x.id, title:`${x.firstName} ${x.lastName} (${x.userName})`}))
    : roles.map(x => ({id:x.name, title:x.displayName || x.name})), [subjectType, users, roles]);

  useEffect(() => {
    void (async () => {
      await requireAuthenticatedUser();
      const [loadedUsers, loadedRoles, loadedGroups] = await Promise.all([
        listIdentityUsers(), listIdentityRoles(), listDocumentGroups()
      ]);
      setUsers(loadedUsers); setRoles(loadedRoles); setGroups(loadedGroups);
      setBusy(false);
    })().catch(error => {
      setMessage(error instanceof Error ? error.message : "بارگذاری اطلاعات انجام نشد.");
      setBusy(false);
    });
  }, []);

  useEffect(() => {
    void (async () => {
      const loaded = resourceType === 1
        ? (await listContractCatalog<ContractGroup>("groups")).items
        : await listDocumentGroups();
      setGroups(loaded);
    })().catch(() => setMessage("دریافت گروه‌ها انجام نشد."));
  }, [resourceType]);

  useEffect(() => {
    setChoices({});
    if (!subjectId) return;
    void listDataScopes({resourceType, subjectType, subjectId}).then(result => {
      const next: Record<string, Choice> = {};
      result.items.forEach(row => next[row.resourceId] = row.isDenied ? "deny" : "grant");
      setChoices(next);
    }).catch(error => setMessage(error instanceof Error ? error.message : "دریافت دسترسی انجام نشد."));
  }, [subjectId, subjectType, resourceType]);

  async function save() {
    if (!subjectId) return;
    setBusy(true); setMessage("");
    try {
      await saveDataScopes({
        resourceType, subjectType, subjectId,
        grantedResourceIds:Object.keys(choices).filter(id => choices[id] === "grant"),
        deniedResourceIds:Object.keys(choices).filter(id => choices[id] === "deny")
      });
      setMessage("محدوده دسترسی گروه‌های اسناد ذخیره شد.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "ثبت دسترسی انجام نشد.");
    } finally { setBusy(false); }
  }

  return <main className="access-page">
    <header className="access-header">
      <div><span>مدیریت کاربران و دسترسی‌ها</span><h1>محدوده دسترسی گروه‌ها</h1>
        <p>تعیین دسترسی داده‌ای مستقل از مجوز عملیات، برای هر نقش یا کاربر</p></div>
      <Link href="/">بازگشت به داشبورد</Link>
    </header>
    <nav className="access-tabs">
      <Link href="/access/users">کاربران</Link><Link href="/access/roles">نقش‌ها</Link>
      <Link href="/access/role-permissions">دسترسی نقش</Link>
      <Link href="/access/user-permissions">دسترسی مستقیم کاربر</Link>
      <Link className="active" href="/access/group-scopes">دسترسی گروه‌ها</Link>
    </nav>
    <section className="access-card">
      <div className="scope-toolbar">
        <label><span>نوع گروه</span><select value={resourceType} onChange={e => {setResourceType(Number(e.target.value));setChoices({});}}>
          <option value={1}>گروه قرارداد</option><option value={2}>گروه سند</option>
        </select></label>
        <label><span>نوع تخصیص</span><select value={subjectType} onChange={e => {setSubjectType(Number(e.target.value));setSubjectId("");}}>
          <option value={2}>نقش</option><option value={1}>کاربر</option>
        </select></label>
        <label><span>{subjectType === 2 ? "انتخاب نقش" : "انتخاب کاربر"}</span>
          <select value={subjectId} onChange={e => setSubjectId(e.target.value)}>
            <option value="">انتخاب کنید</option>{subjects.map(x => <option key={x.id} value={x.id}>{x.title}</option>)}
          </select></label>
      </div>
      <div className="scope-note">مجوز عملیات و محدوده گروه هر دو باید برقرار باشند. منع مستقیم کاربر بر اجازه نقش اولویت دارد.</div>
      {busy && !groups.length ? <p className="scope-empty">در حال بارگذاری…</p> :
        !subjectId ? <p className="scope-empty">برای مشاهده دسترسی‌ها یک نقش یا کاربر انتخاب کنید.</p> :
        <div className="scope-list">{groups.map(group => <article key={group.id}>
          <strong>{group.name}</strong>
          <div>{(["inherit","grant","deny"] as Choice[]).map(value =>
            <label key={value} className={choices[group.id] === value || (!choices[group.id] && value === "inherit") ? "selected" : ""}>
              <input type="radio" name={group.id} checked={(choices[group.id] ?? "inherit") === value}
                onChange={() => setChoices(current => ({...current,[group.id]:value}))}/>
              {value === "inherit" ? "بدون تخصیص" : value === "grant" ? "اجازه" : "منع"}
            </label>)}</div>
        </article>)}</div>}
      <footer><span>{message}</span><button disabled={!subjectId || busy} onClick={save}>ذخیره دسترسی‌ها</button></footer>
    </section>
  </main>;
}
