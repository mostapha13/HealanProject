"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  ComplianceCriterion, createDocumentGroup, deleteDocumentGroup,
  DocumentGroup, getDocumentGroupCriteria, listCriteria, listDocumentGroups,
  saveDocumentGroupCriteria, updateDocumentGroup,
} from "../../../lib/api";

type CriterionDraft = { id: string; selected: boolean; weight: number; critical: boolean };

export default function DocumentGroupsPage() {
  const [items, setItems] = useState<DocumentGroup[]>([]);
  const [criteria, setCriteria] = useState<ComplianceCriterion[]>([]);
  const [criterionDrafts, setCriterionDrafts] = useState<CriterionDraft[]>([]);
  const [name, setName] = useState(""), [description, setDescription] = useState("");
  const [passingThreshold, setPassingThreshold] = useState(80);
  const [active, setActive] = useState(true);
  const [edit, setEdit] = useState<DocumentGroup | null>(null);
  const [message, setMessage] = useState(""), [busy, setBusy] = useState(false);

  async function load() {
    const [groups, catalog] = await Promise.all([listDocumentGroups(), listCriteria(1, 100)]);
    setItems(groups); setCriteria(catalog.items.filter(x => x.isActive));
    if (!edit) setCriterionDrafts(catalog.items.filter(x => x.isActive).map(x => ({
      id: x.id, selected: false, weight: x.defaultWeight, critical: x.isCriticalByDefault,
    })));
  }
  useEffect(() => { void load().catch(() => setMessage("دریافت اطلاعات گروه‌ها انجام نشد.")); }, []);

  function reset(catalog = criteria) {
    setEdit(null); setName(""); setDescription(""); setPassingThreshold(80); setActive(true);
    setCriterionDrafts(catalog.map(x => ({ id: x.id, selected: false, weight: x.defaultWeight, critical: x.isCriticalByDefault })));
  }

  async function selectGroup(group: DocumentGroup) {
    setBusy(true); setMessage("");
    try {
      const assigned = await getDocumentGroupCriteria(group.id);
      setEdit(group); setName(group.name); setDescription(group.description || "");
      setPassingThreshold(group.passingThreshold); setActive(group.isActive);
      setCriterionDrafts(criteria.map(item => {
        const value = assigned.find(x => x.complianceCriterionId === item.id);
        return { id: item.id, selected: Boolean(value), weight: value?.weight ?? item.defaultWeight, critical: value?.isCritical ?? item.isCriticalByDefault };
      }));
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch { setMessage("دریافت موارد مهم این گروه انجام نشد."); }
    finally { setBusy(false); }
  }

  function updateDraft(id: string, patch: Partial<CriterionDraft>) {
    setCriterionDrafts(values => values.map(x => x.id === id ? { ...x, ...patch } : x));
  }

  async function submit(event: FormEvent) {
    event.preventDefault(); setBusy(true); setMessage("");
    try {
      const group = edit
        ? await updateDocumentGroup(edit.id, { name, description, isActive: active, documentIds: edit.documentIds, passingThreshold })
        : await createDocumentGroup({ name, description, documentIds: [], passingThreshold });
      const selected = criterionDrafts.filter(x => x.selected);
      await saveDocumentGroupCriteria(group.id, selected.map((x, index) => ({
        complianceCriterionId: x.id, weight: x.weight, isCritical: x.critical, order: index + 1,
      })));
      reset(); await load(); setMessage("گروه سند و موارد مهم آن ذخیره شد.");
    } catch { setMessage("ذخیره انجام نشد؛ نام، آستانه و وزن موارد مهم را بررسی کنید."); }
    finally { setBusy(false); }
  }

  return <main className="app-shell" dir="rtl"><section className="page-content">
    <header className="page-header"><p className="eyebrow">اطلاعات پایه تطبیق اسناد</p><h1>گروه‌های اسناد</h1><p>گروه را مستقل از قراردادها تعریف کنید. انتخاب موارد مهم برای هر گروه اختیاری است.</p></header>
    <article className="panel"><form className="form-grid" onSubmit={submit}>
      <label><span>نام گروه</span><input value={name} onChange={e => setName(e.target.value)} required placeholder="مثلاً امیدنامه‌های فولادی" /></label>
      <label><span>توضیحات</span><input value={description} onChange={e => setDescription(e.target.value)} placeholder="دامنه و نوع اسناد این گروه" /></label>
      <label><span>آستانه تأیید (درصد)</span><input type="number" min="1" max="100" step="0.01" value={passingThreshold} onChange={e => setPassingThreshold(Number(e.target.value))} required /></label>
      <label><input type="checkbox" checked={active} onChange={e => setActive(e.target.checked)} /> گروه فعال باشد</label>
      <fieldset className="full"><legend>فیلدها و موارد مهم گروه (اختیاری)</legend>
        <p>اگر موردی انتخاب نشود، سند فقط با اسناد مورد تأیید همین گروه مقایسه می‌شود.</p>
        <div className="multi-choice">{criteria.map(item => { const draft = criterionDrafts.find(x => x.id === item.id); if (!draft) return null; return <div key={item.id} className="catalog-row">
          <label><input type="checkbox" checked={draft.selected} onChange={e => updateDraft(item.id, { selected: e.target.checked })} /> {item.title}</label>
          {draft.selected && <><label>وزن <input type="number" min="0.1" step="0.1" value={draft.weight} onChange={e => updateDraft(item.id, { weight: Number(e.target.value) })} /></label><label><input type="checkbox" checked={draft.critical} onChange={e => updateDraft(item.id, { critical: e.target.checked })} /> حیاتی</label></>}
        </div> })}</div>
      </fieldset>
      <button className="primary-button" disabled={busy}>{busy ? "در حال ذخیره..." : edit ? "ذخیره تغییرات" : "ایجاد گروه"}</button>
      {edit && <button type="button" onClick={() => reset()}>انصراف</button>}
    </form></article>
    <article className="panel"><h2>گروه‌های تعریف‌شده</h2>{items.map(group => <div className="catalog-row" key={group.id}><span>{group.name}<small>آستانه: {group.passingThreshold.toLocaleString("fa-IR")}٪</small></span><b>{group.isActive ? "فعال" : "غیرفعال"}</b><button onClick={() => void selectGroup(group)}>ویرایش و تعیین موارد مهم</button><button onClick={() => window.confirm("این گروه حذف شود؟") && void deleteDocumentGroup(group.id).then(load)}>حذف</button></div>)}<p role="status">{message}</p></article>
  </section></main>;
}
