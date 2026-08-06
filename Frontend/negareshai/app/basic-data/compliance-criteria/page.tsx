"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { ComplianceCriterion, deleteCriterion, listCriteria, saveCriterion } from "../../../lib/api";

export default function ComplianceCriteriaPage() {
  const [items, setItems] = useState<ComplianceCriterion[]>([]);
  const [code, setCode] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [weight, setWeight] = useState(1);
  const [critical, setCritical] = useState(false);
  const [active, setActive] = useState(true);
  const [edit, setEdit] = useState<ComplianceCriterion | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const activeCount = useMemo(() => items.filter(item => item.isActive).length, [items]);
  const criticalCount = useMemo(() => items.filter(item => item.isCriticalByDefault).length, [items]);

  async function load() {
    try { setItems((await listCriteria()).items); }
    catch { setMessage("دریافت معیارها انجام نشد. دوباره تلاش کنید."); }
  }

  useEffect(() => { void load(); }, []);

  function reset() {
    setEdit(null); setCode(""); setTitle(""); setDescription("");
    setWeight(1); setCritical(false); setActive(true); setMessage("");
  }

  function select(item: ComplianceCriterion) {
    setEdit(item); setCode(item.code); setTitle(item.title);
    setDescription(item.description || ""); setWeight(item.defaultWeight);
    setCritical(item.isCriticalByDefault); setActive(item.isActive); setMessage("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function submit(event: FormEvent) {
    event.preventDefault(); setBusy(true); setMessage("");
    const wasEditing = Boolean(edit);
    try {
      await saveCriterion({ code: code.trim(), title: title.trim(), description: description.trim() || undefined, defaultWeight: weight, isCriticalByDefault: critical, isActive: active }, edit?.id);
      reset(); await load(); setMessage(wasEditing ? "تغییرات معیار ذخیره شد." : "معیار جدید با موفقیت ثبت شد.");
    } catch { setMessage("ذخیره معیار انجام نشد. اطلاعات را بررسی کنید."); }
    finally { setBusy(false); }
  }

  async function remove(item: ComplianceCriterion) {
    if (!window.confirm(`معیار «${item.title}» حذف شود؟`)) return;
    try { await deleteCriterion(item.id); await load(); setMessage("معیار حذف شد."); }
    catch { setMessage("حذف معیار انجام نشد."); }
  }

  return (
    <main className="basic-detail-page" dir="rtl">
      <header className="basic-detail-header">
        <div>
          <span><Link href="/basic-data">داده‌های پایه</Link> / تطبیق اسناد</span>
          <h1>فیلدها و موارد مهم اسناد</h1>
          <p>موارد قابل بررسی را مستقل از قراردادها تعریف کنید؛ اتصال هر مورد به گروه سند اختیاری است.</p>
        </div>
        <Link href="/basic-data" className="basic-outline-button">همه داده‌های پایه</Link>
      </header>

      <section className="criteria-summary">
        <article><span>کل معیارها</span><strong>{items.length.toLocaleString("fa-IR")}</strong></article>
        <article><span>معیار فعال</span><strong>{activeCount.toLocaleString("fa-IR")}</strong></article>
        <article><span>معیار حیاتی</span><strong>{criticalCount.toLocaleString("fa-IR")}</strong></article>
      </section>

      {message && <div className="basic-feedback" role="status">{message}</div>}

      <div className="criteria-workspace">
        <aside className="criteria-editor">
          <header><span>{edit ? "حالت ویرایش" : "معیار جدید"}</span><h2>{edit ? edit.title : "تعریف معیار انطباق"}</h2><p>عنوان واضح و کد کوتاه انتخاب کنید تا در گزارش‌ها قابل تشخیص باشد.</p></header>
          <form onSubmit={submit}>
            <label><span>کد معیار <b>*</b></span><small>یک شناسه کوتاه و ثابت؛ مانند LEGAL-01</small><input dir="ltr" placeholder="LEGAL-01" value={code} onChange={event => setCode(event.target.value)} required /></label>
            <label><span>عنوان معیار <b>*</b></span><input placeholder="مثلاً وجود بند محرمانگی" value={title} onChange={event => setTitle(event.target.value)} required /></label>
            <label><span>توضیح برای کارشناس</span><textarea placeholder="این معیار دقیقاً چه چیزی را در سند بررسی می‌کند؟" value={description} onChange={event => setDescription(event.target.value)} /></label>
            <label><span>وزن پیش‌فرض</span><small>عدد بزرگ‌تر یعنی اثر بیشتر در امتیاز نهایی.</small><input type="number" min="0" step="0.1" value={weight} onChange={event => setWeight(Number(event.target.value))} /></label>
            <div className="criteria-switches">
              <label><input type="checkbox" checked={critical} onChange={event => setCritical(event.target.checked)} /><span><b>معیار حیاتی</b><small>ردشدن این معیار به‌صورت ویژه هشدار داده می‌شود.</small></span></label>
              <label><input type="checkbox" checked={active} onChange={event => setActive(event.target.checked)} /><span><b>فعال</b><small>در انتخاب معیارهای گروه سند نمایش داده شود.</small></span></label>
            </div>
            <div className="criteria-form-actions"><button className="basic-primary-button" disabled={busy}>{busy ? "در حال ذخیره..." : edit ? "ذخیره تغییرات" : "ثبت معیار"}</button>{edit && <button type="button" onClick={reset}>انصراف</button>}</div>
          </form>
        </aside>

        <section className="criteria-list-panel">
          <header><div><h2>فهرست معیارها</h2><p>معیارهای تعریف‌شده سازمان برای تطبیق اسناد</p></div><span>{items.length.toLocaleString("fa-IR")} مورد</span></header>
          {items.length === 0 ? <div className="basic-empty"><b>هنوز معیاری ثبت نشده است</b><p>اولین معیار را از فرم کنار صفحه تعریف کنید.</p></div> : <div className="criteria-list">
            {items.map(item => <article key={item.id}>
              <div className="criterion-code">{item.code}</div>
              <div className="criterion-info"><div><h3>{item.title}</h3>{item.isCriticalByDefault && <span className="criterion-critical">حیاتی</span>}<span className={item.isActive ? "criterion-active" : "criterion-inactive"}>{item.isActive ? "فعال" : "غیرفعال"}</span></div><p>{item.description || "برای این معیار توضیحی ثبت نشده است."}</p><small>وزن پیش‌فرض: <b>{item.defaultWeight.toLocaleString("fa-IR")}</b></small></div>
              <div className="criterion-actions"><button onClick={() => select(item)}>ویرایش</button><button className="danger" onClick={() => void remove(item)}>حذف</button></div>
            </article>)}
          </div>}
        </section>
      </div>
    </main>
  );
}
