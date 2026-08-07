"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { deleteContractCatalog, listContractCatalog, OrganizationParty, saveContractCatalog } from "../../../lib/api";

const pageSize = 20;

export default function ContractPartiesPage() {
  const [items, setItems] = useState<OrganizationParty[]>([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [name, setName] = useState("");
  const [nationalIdentifier, setNationalIdentifier] = useState("");
  const [representativeName, setRepresentativeName] = useState("");
  const [contactInfo, setContactInfo] = useState("");
  const [active, setActive] = useState(true);
  const [edit, setEdit] = useState<OrganizationParty | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const activeCount = useMemo(() => items.filter(item => item.isActive).length, [items]);

  async function load(targetPage = page) {
    try {
      const result = await listContractCatalog<OrganizationParty>("parties", targetPage, pageSize);
      setItems(result.items); setPage(result.pageNumber); setPages(Math.max(1, result.totalPages));
    } catch { setMessage("دریافت طرف‌های قرارداد انجام نشد. دوباره تلاش کنید."); }
  }

  useEffect(() => { void load(1); }, []);

  function reset(clearMessage = true) {
    setEdit(null); setName(""); setNationalIdentifier(""); setRepresentativeName("");
    setContactInfo(""); setActive(true); if (clearMessage) setMessage("");
  }

  function select(item: OrganizationParty) {
    setEdit(item); setName(item.name); setNationalIdentifier(item.nationalIdentifier || "");
    setRepresentativeName(item.representativeName || ""); setContactInfo(item.contactInfo || "");
    setActive(item.isActive); setMessage(""); window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function submit(event: FormEvent) {
    event.preventDefault(); if (!name.trim()) return;
    setBusy(true); setMessage(""); const wasEditing = Boolean(edit);
    try {
      await saveContractCatalog("parties", { name: name.trim(), nationalIdentifier: nationalIdentifier.trim() || null, representativeName: representativeName.trim() || null, contactInfo: contactInfo.trim() || null, isActive: active }, edit?.id);
      reset(false); await load(wasEditing ? page : 1);
      setMessage(wasEditing ? "اطلاعات طرف قرارداد به‌روزرسانی شد." : "طرف قرارداد جدید ثبت شد.");
    } catch { setMessage("ذخیره اطلاعات انجام نشد. ورودی‌ها را بررسی کنید."); }
    finally { setBusy(false); }
  }

  async function toggle(item: OrganizationParty) {
    try {
      await saveContractCatalog("parties", { name: item.name, nationalIdentifier: item.nationalIdentifier || null, representativeName: item.representativeName || null, contactInfo: item.contactInfo || null, isActive: !item.isActive }, item.id);
      await load(); setMessage(item.isActive ? "طرف قرارداد غیرفعال شد." : "طرف قرارداد فعال شد.");
    } catch { setMessage("تغییر وضعیت انجام نشد."); }
  }

  async function remove(item: OrganizationParty) {
    if (!window.confirm(`طرف قرارداد «${item.name}» حذف شود؟`)) return;
    try { await deleteContractCatalog("parties", item.id); await load(); setMessage("طرف قرارداد حذف شد."); }
    catch { setMessage("حذف طرف قرارداد انجام نشد."); }
  }

  return (
    <main className="basic-detail-page" dir="rtl">
      <header className="basic-detail-header">
        <div><span><Link href="/basic-data">داده‌های پایه</Link> / مدیریت قرارداد</span><h1>طرف‌های قرارداد</h1><p>اشخاص و شرکت‌هایی را ثبت کنید که دستیار می‌تواند به‌عنوان طرف دوم قرارداد تشخیص دهد و اطلاعات آن‌ها را در سند قرار دهد.</p></div>
        <Link href="/basic-data" className="basic-outline-button">همه داده‌های پایه</Link>
      </header>

      <section className="criteria-summary party-summary">
        <article><span>موارد این صفحه</span><strong>{items.length.toLocaleString("fa-IR")}</strong></article>
        <article><span>طرف فعال</span><strong>{activeCount.toLocaleString("fa-IR")}</strong></article>
        <article><span>صفحه فعلی</span><strong>{page.toLocaleString("fa-IR")} از {pages.toLocaleString("fa-IR")}</strong></article>
      </section>

      {message && <div className="basic-feedback" role="status">{message}</div>}

      <div className="criteria-workspace party-workspace">
        <aside className="criteria-editor party-editor">
          <header><span>{edit ? "حالت ویرایش" : "طرف جدید"}</span><h2>{edit ? edit.name : "ثبت طرف قرارداد"}</h2><p>اطلاعاتی را وارد کنید که باید در متن قرارداد و معرفی طرف دوم استفاده شود.</p></header>
          <form onSubmit={submit}>
            <label><span>نام شخص یا شرکت <b>*</b></span><small>نام رسمی و کامل طرف دوم قرارداد</small><input placeholder="مثلاً شرکت فناوری داده‌ای" value={name} onChange={event => setName(event.target.value)} required /></label>
            <label><span>شناسه ملی</span><small>برای شرکت، شناسه ملی و برای شخص، کد ملی</small><input dir="ltr" placeholder="شناسه یا کد ملی" value={nationalIdentifier} onChange={event => setNationalIdentifier(event.target.value)} /></label>
            <label><span>نام نماینده</span><small>نام فرد مجاز برای امضای قرارداد</small><input placeholder="نام و نام خانوادگی نماینده" value={representativeName} onChange={event => setRepresentativeName(event.target.value)} /></label>
            <label><span>اطلاعات تماس و نشانی</span><textarea placeholder="شماره تماس، نشانی و سایر اطلاعات لازم" value={contactInfo} onChange={event => setContactInfo(event.target.value)} /></label>
            <div className="criteria-switches"><label><input type="checkbox" checked={active} onChange={event => setActive(event.target.checked)} /><span><b>قابل استفاده در قراردادها</b><small>دستیار می‌تواند این طرف را در درخواست‌های جدید پیدا کند.</small></span></label></div>
            <div className="criteria-form-actions"><button className="basic-primary-button" disabled={busy}>{busy ? "در حال ذخیره..." : edit ? "ذخیره تغییرات" : "ثبت طرف قرارداد"}</button>{edit && <button type="button" onClick={() => reset()}>انصراف</button>}</div>
          </form>
        </aside>

        <section className="criteria-list-panel party-list-panel">
          <header><div><h2>طرف‌های ثبت‌شده</h2><p>اشخاص و شرکت‌های قابل استفاده در قرارداد</p></div><span>{items.length.toLocaleString("fa-IR")} مورد</span></header>
          {items.length === 0 ? <div className="basic-empty"><b>طرف قراردادی ثبت نشده است</b><p>اولین شخص یا شرکت را از فرم کنار صفحه ثبت کنید.</p></div> : <div className="party-list">
            {items.map(item => <article key={item.id}>
              <div className="party-avatar" aria-hidden="true">{item.name.trim().slice(0, 1)}</div>
              <div className="party-info"><div><h3>{item.name}</h3><span className={item.isActive ? "criterion-active" : "criterion-inactive"}>{item.isActive ? "فعال" : "غیرفعال"}</span></div><dl><div><dt>شناسه ملی</dt><dd>{item.nationalIdentifier || "ثبت نشده"}</dd></div><div><dt>نماینده</dt><dd>{item.representativeName || "ثبت نشده"}</dd></div></dl><p>{item.contactInfo || "اطلاعات تماس ثبت نشده است."}</p></div>
              <div className="party-actions"><button onClick={() => select(item)}>ویرایش</button><button onClick={() => void toggle(item)}>{item.isActive ? "غیرفعال‌سازی" : "فعال‌سازی"}</button><button className="danger" onClick={() => void remove(item)}>حذف</button></div>
            </article>)}
          </div>}
          <nav className="basic-pagination" aria-label="صفحه‌بندی"><button disabled={page === 1} onClick={() => void load(page - 1)}>صفحه قبل</button><span>{page.toLocaleString("fa-IR")} از {pages.toLocaleString("fa-IR")}</span><button disabled={page === pages} onClick={() => void load(page + 1)}>صفحه بعد</button></nav>
        </section>
      </div>
    </main>
  );
}
