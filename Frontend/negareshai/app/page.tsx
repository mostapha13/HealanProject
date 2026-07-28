"use client";
import { useState } from "react";
import { uploadDocument } from "../lib/api";

export default function Home() {
  const [file, setFile] = useState<File | null>(null); const [title, setTitle] = useState(""); const [progress, setProgress] = useState(0); const [status, setStatus] = useState("");
  async function submit() { if (!file) return setStatus("ابتدا فایل PDF یا Word را انتخاب کنید"); setStatus("در حال آپلود..."); setProgress(0); try { await uploadDocument({ file, title }, setProgress); setStatus("سند با موفقیت ثبت شد"); } catch (e) { setStatus(e instanceof Error ? e.message : "آپلود انجام نشد"); } }
  return <main dir="rtl" style={{ maxWidth: 900, margin: "60px auto", padding: 24 }}><h1>Negaresh<span style={{ color: "#18a999" }}>AI</span></h1><p>مدیریت هوشمند اسناد و قراردادها</p><section className="card"><h2>افزودن سند</h2><input className="input" placeholder="عنوان سند (اختیاری)" value={title} onChange={e => setTitle(e.target.value)} /><label className="upload"><input type="file" accept=".pdf,.docx" onChange={e => setFile(e.target.files?.[0] ?? null)} />{file ? file.name : "انتخاب فایل PDF یا Word"}</label>{progress > 0 && <progress value={progress} max={100} style={{ width: "100%" }} />}</section><button className="btn" onClick={submit}>آپلود و ثبت سند</button>{status && <p role="status">{status}</p>}</main>;
}
