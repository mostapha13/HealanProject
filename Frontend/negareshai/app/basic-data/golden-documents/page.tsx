"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  deleteGoldenDocument, DocumentGroup, DocumentListItem, GoldenDocument,
  listDocumentGroups, listDocuments, listGoldenDocuments, saveGoldenDocument,
  uploadDocumentBatch,
} from "../../../lib/api";

export default function GoldenDocumentsPage() {
  const [items, setItems] = useState<GoldenDocument[]>([]), [groups, setGroups] = useState<DocumentGroup[]>([]), [docs, setDocs] = useState<DocumentListItem[]>([]);
  const [groupId, setGroupId] = useState(""), [documentId, setDocumentId] = useState("");
  const [file, setFile] = useState<File | null>(null), [priority, setPriority] = useState(1);
  const [message, setMessage] = useState(""), [busy, setBusy] = useState(false);
  async function load() { const [g, d, refs] = await Promise.all([listDocumentGroups(), listDocuments(), listGoldenDocuments()]); setGroups(g.filter(x => x.isActive)); setDocs(d.items); setItems(refs.items); }
  useEffect(() => { void load().catch(() => setMessage("دریافت اسناد مورد تأیید انجام نشد.")); }, []);
  async function submit(event: FormEvent) {
    event.preventDefault(); if (!groupId || (!documentId && !file)) return;
    setBusy(true); setMessage("");
    try {
      let id = documentId;
      if (file) {
        const uploaded = await uploadDocumentBatch({ files: [file], title: file.name, documentType: "comparison-reference", documentGroupIds: [groupId] });
        id = uploaded.id;
      }
      await saveGoldenDocument({ documentGroupId: groupId, documentId: id, priority, isActive: true });
      setDocumentId(""); setFile(null); setPriority(value => value + 1); await load();
      setMessage(file ? "سند ثبت شد. برای قابل استفاده‌شدن به‌عنوان مرجع، پردازش، تأیید و نهایی‌سازی آن را انجام دهید." : "سند مورد تأیید به گروه اضافه شد.");
    } catch { setMessage("ثبت سند انجام نشد. از تکراری نبودن سند و معتبر بودن گروه مطمئن شوید."); }
    finally { setBusy(false); }
  }
  return <main className="app-shell" dir="rtl"><section className="page-content">
    <header className="page-header"><p className="eyebrow">اطلاعات پایه تطبیق اسناد</p><h1>اسناد مورد تأیید گروه‌ها</h1><p>این منابع فقط متعلق به تطبیق اسناد هستند و در بخش قراردادها استفاده نمی‌شوند.</p></header>
    <article className="panel"><form className="form-grid" onSubmit={submit}>
      <label><span>گروه سند</span><select value={groupId} onChange={e => setGroupId(e.target.value)} required><option value="">انتخاب گروه</option>{groups.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}</select></label>
      <label><span>آپلود سند مورد تأیید</span><input type="file" accept=".pdf,.docx,.jpg,.jpeg,.png,.tif,.tiff" onChange={e => { setFile(e.target.files?.[0] ?? null); setDocumentId(""); }} /></label>
      <label><span>یا انتخاب از اسناد سامانه</span><select value={documentId} onChange={e => { setDocumentId(e.target.value); setFile(null); }}><option value="">انتخاب سند</option>{docs.map(x => <option key={x.id} value={x.id}>{x.title}</option>)}</select></label>
      <label><span>اولویت مرجع</span><input type="number" min="1" value={priority} onChange={e => setPriority(Number(e.target.value))} /></label>
      <button className="primary-button" disabled={busy}>{busy ? "در حال ثبت..." : "ثبت سند مورد تأیید"}</button>
    </form><p>سند آپلودشده تا پیش از تکمیل پردازش و نهایی‌سازی، وارد منابع قابل استفاده برای تطبیق نمی‌شود.</p></article>
    <article className="panel"><h2>منابع تأییدشده</h2>{items.map(x => <div className="catalog-row" key={x.id}><span>اولویت {x.priority.toLocaleString("fa-IR")} — {x.documentTitle}</span><b>{x.isActive ? "فعال" : "غیرفعال"}</b><button onClick={() => window.confirm("این سند از منابع گروه حذف شود؟") && void deleteGoldenDocument(x.id).then(load)}>حذف</button></div>)}<p role="status">{message}</p></article>
  </section></main>;
}
