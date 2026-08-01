"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { ContractGroup, deleteContractCatalog, listContractCatalog, saveContractCatalog } from "../../../lib/api";

const pageSize = 20;

export default function ContractGroupsPage() {
  const [items, setItems] = useState<ContractGroup[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<ContractGroup | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);

  const load = useCallback(async (targetPage = page) => {
    setLoading(true); setError("");
    try {
      const result = await listContractCatalog<ContractGroup>("groups", targetPage, pageSize);
      setItems(result.items); setPage(result.pageNumber); setTotalPages(Math.max(1, result.totalPages));
    } catch { setError("دریافت گروه‌های قرارداد انجام نشد."); }
    finally { setLoading(false); }
  }, [page]);
  useEffect(() => { void load(1); }, []); // initial load is always page one

  function reset() { setEditing(null); setName(""); setDescription(""); setIsActive(true); }
  async function submit(event: FormEvent) {
    event.preventDefault(); if (!name.trim()) return;
    try {
      await saveContractCatalog("groups", { name, description: description || null, isActive }, editing?.id);
      reset(); await load(editing ? page : 1);
    } catch { setError("ذخیره‌سازی گروه قرارداد انجام نشد؛ نام باید در سازمان یکتا باشد."); }
  }
  async function toggle(item: ContractGroup) {
    await saveContractCatalog("groups", { name: item.name, description: item.description || null, isActive: !item.isActive }, item.id);
    await load();
  }
  async function remove(id: string) {
    if (!window.confirm("گروه قرارداد حذف نرم شود؟")) return;
    await deleteContractCatalog("groups", id); await load(items.length === 1 && page > 1 ? page - 1 : page);
  }

  return <main className="app-shell" dir="rtl"><section className="page-content">
    <header className="page-header"><div><p className="eyebrow">اطلاعات پایه</p><h1>گروه‌های قرارداد</h1><p>گروه اصلی و گروه‌های فرعی قرارداد، قالب و سطح دسترسی را تعیین می‌کنند.</p></div></header>
    <article className="panel"><h2>{editing ? "ویرایش گروه قرارداد" : "ثبت گروه قرارداد"}</h2>
      <form className="form-grid" onSubmit={submit}><label className="field"><span>نام گروه *</span><input value={name} onChange={e => setName(e.target.value)} required /></label>
      <label className="field"><span>توضیحات</span><input value={description} onChange={e => setDescription(e.target.value)} /></label>
      <label className="field"><span><input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} /> فعال</span></label>
      <div><button className="primary-button" type="submit">{editing ? "ذخیره تغییرات" : "ثبت گروه"}</button>{editing && <button className="ghost-button" type="button" onClick={reset}>انصراف</button>}</div></form>
    </article>
    <article className="panel"><h2>فهرست گروه‌ها</h2>{error && <p className="error-text">{error}</p>}{loading ? <p>در حال دریافت اطلاعات…</p> : <>
      {items.map(item => <div className="catalog-row" key={item.id}><span>{item.name}{item.description ? ` — ${item.description}` : ""}</span><b>{item.isActive ? "فعال" : "غیرفعال"}</b>
        <button onClick={() => void toggle(item)}>{item.isActive ? "غیرفعال‌سازی" : "فعال‌سازی"}</button>
        <button onClick={() => { setEditing(item); setName(item.name); setDescription(item.description || ""); setIsActive(item.isActive); }}>ویرایش</button>
        <button onClick={() => void remove(item.id)}>حذف</button></div>)}
      {!items.length && <p>هنوز گروهی ثبت نشده است.</p>}
      <nav className="pagination" aria-label="صفحه‌بندی"><button disabled={page <= 1} onClick={() => void load(page - 1)}>قبلی</button><span>صفحه {page} از {totalPages}</span><button disabled={page >= totalPages} onClick={() => void load(page + 1)}>بعدی</button></nav>
    </>}</article>
  </section></main>;
}
