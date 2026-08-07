"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  AccessMenu,
  ContractConversation,
  ContractConversationListItem,
  getOrganizationProfile,
  OrganizationProfile,
  downloadContractDraftFile,
  getContractConversation,
  listContractConversations,
  listMyMenus,
  reviewContractDraft,
  sendContractConversationMessage,
  startContractConversation,
} from "../../lib/api";
import { formatJalaliDate, toPersianDigits } from "../../lib/jalali";

type Change = { Before?: unknown; After?: unknown };

function json(value: string): Record<string, unknown> {
  try { return JSON.parse(value) as Record<string, unknown>; } catch { return {}; }
}
function change(value: unknown): Change | undefined {
  return value && typeof value === "object" ? value as Change : undefined;
}
function money(value: unknown) {
  const amount = Number(value);
  return Number.isFinite(amount) ? `${new Intl.NumberFormat("fa-IR").format(amount)} ریال` : "—";
}
function date(value: unknown) {
  const raw = value == null ? "" : String(value);
  return formatJalaliDate(raw) || toPersianDigits(raw) || "—";
}
function organizationIsReady(value?: OrganizationProfile) {
  return Boolean(value?.name && value.chiefExecutiveName && value.chiefExecutiveFatherName
    && value.chiefExecutiveNationalId && value.nationalIdentifier && value.economicCode
    && value.address && value.phone);
}
function collectAccessForms(items: AccessMenu[]): Set<number> {
  const result = new Set<number>();
  const visit = (item: AccessMenu) => {
    if (item.accessForm?.accessFormId) result.add(item.accessForm.accessFormId);
    (item.children ?? []).forEach(visit);
  };
  items.forEach(visit);
  return result;
}

const EXPERT_REVIEW_ACCESS = 6031;
const MANAGER_FINALIZE_ACCESS = 6032;
const REQUEST_EXAMPLES = [
  "قرارداد پشتیبانی با شرکت فناوری داده‌ای از ۱۴۰۵/۰۱/۰۱ تا ۱۴۰۵/۱۲/۲۹ با مبلغ ۲۵۵ میلیارد ریال ثبت کن.",
  "قرارداد ۱۴۰۳ شرکت فسا را برای سال ۱۴۰۵ با افزایش ۲۵ درصد تمدید کن.",
  "یک قرارداد فروش با شرکت پارس تنظیم کن و ماده محرمانگی هم به آن اضافه کن.",
];

function Understanding({ conversation, organization }: { conversation: ContractConversation; organization?: OrganizationProfile }) {
  const draft = conversation.drafts[0];
  const diff = draft ? json(draft.diffJson) : {};
  const start = change(diff.StartDate)?.After;
  const end = change(diff.EndDate)?.After;
  const amount = change(diff.Amount)?.After;
  const addedClause = change(diff.AddedClause)?.After ?? diff.AddedClause;
  const addedClauses = Array.isArray(diff.AddedClauses)
    ? diff.AddedClauses.map(String).filter(Boolean)
    : addedClause != null && String(addedClause).trim() ? [String(addedClause)] : [];
  const paymentDates = diff.PaymentDates && typeof diff.PaymentDates === "object"
    ? diff.PaymentDates as { First?: unknown; Second?: unknown } : undefined;
  const clauseCount = change(diff.ClauseCount);
  return (
    <section className="contract-understanding">
      <header>
        <div><span>برداشت سامانه از درخواست شما</span><h2>قبل از تأیید، این اطلاعات را بررسی کنید</h2></div>
        <b>{draft ? `نسخه ${toPersianDigits(draft.versionNumber)}` : "در حال تکمیل"}</b>
      </header>
      <div className="understanding-grid">
        <article><span>طرف اول (شرکت ما)</span><strong>{organization?.name || "پروفایل شرکت تکمیل نشده"}</strong></article>
        <article><span>نماینده طرف اول</span><strong>{organization?.chiefExecutiveName || "—"}</strong></article>
        <article><span>طرف دوم قرارداد</span><strong>{conversation.partyName}</strong></article>
        <article><span>نوع قرارداد</span><strong>{conversation.groupName}</strong></article>
        <article><span>موضوع</span><strong>{conversation.subject}</strong></article>
        <article><span>سال قرارداد</span><strong>{toPersianDigits(conversation.contractYear)}</strong></article>
        {start != null && <article><span>تاریخ شروع</span><strong>{date(start)}</strong></article>}
        {end != null && <article><span>تاریخ پایان</span><strong>{date(end)}</strong></article>}
        {amount != null && <article><span>مبلغ نهایی</span><strong>{money(amount)}</strong></article>}
        {paymentDates?.First != null && <article><span>پرداخت اول</span><strong>{date(paymentDates.First)}</strong></article>}
        {paymentDates?.Second != null && <article><span>پرداخت دوم</span><strong>{date(paymentDates.Second)}</strong></article>}
        {clauseCount?.After != null && <article><span>تعداد مواد</span><strong>{toPersianDigits(String(clauseCount.Before ?? 0))} ← {toPersianDigits(String(clauseCount.After))}</strong></article>}
        {addedClauses.map((clause, index) => (
          <article className="understanding-clause" key={`${clause}-${index}`}>
            <span>ماده جدید {addedClauses.length > 1 ? toPersianDigits(index + 1) : ""}</span><strong>{clause}</strong>
          </article>
        ))}
      </div>
    </section>
  );
}

export default function ContractGenerationPage() {
  const [history, setHistory] = useState<ContractConversationListItem[]>([]);
  const [current, setCurrent] = useState<ContractConversation>();
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const [editing, setEditing] = useState(false);
  const [organization, setOrganization] = useState<OrganizationProfile>();
  const [reviewNote, setReviewNote] = useState("");
  const [accessForms, setAccessForms] = useState<Set<number>>();

  const latest = current?.drafts[0];
  const questions = useMemo(
    () => current?.clarifications.filter(x => !x.isAnswered) ?? [], [current]);

  async function refresh() { setHistory(await listContractConversations()); }
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setMessage(params.get("message") ?? "");
    void refresh().catch(e => setNotice(e instanceof Error ? e.message : "دریافت سوابق انجام نشد."));
    void getOrganizationProfile().then(setOrganization).catch(() =>
      setNotice("پیش از ساخت قرارداد، اطلاعات شرکت ما را در داده‌های پایه تکمیل کنید."));
    void listMyMenus().then(items => setAccessForms(collectAccessForms(items)))
      .catch(() => setAccessForms(new Set()));
  }, []);

  async function run(action: () => Promise<ContractConversation>) {
    setBusy(true); setNotice("");
    try {
      const result = await action();
      setCurrent(result); setMessage(""); setReviewNote(""); setEditing(false);
      await refresh();
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "عملیات انجام نشد؛ دوباره تلاش کنید.");
    } finally { setBusy(false); }
  }
  function start(e: FormEvent) {
    e.preventDefault();
    if (!organizationIsReady(organization)) {
      setNotice("ابتدا اطلاعات شرکت ما را در داده‌های پایه کامل کنید؛ این اطلاعات طرف اول قرارداد است.");
      return;
    }
    if (message.trim()) void run(() => startContractConversation({ message: message.trim() }));
  }
  function answer(e: FormEvent) {
    e.preventDefault();
    if (current && message.trim()) void run(() => sendContractConversationMessage(current.id, message.trim()));
  }
  async function correct(e: FormEvent) {
    e.preventDefault();
    if (!current || !latest || !message.trim()) return;
    setBusy(true); setNotice("");
    try {
      if (latest.approvalStatus >= 1 && latest.approvalStatus <= 3) {
        await reviewContractDraft(current.id, latest.id, "requester", false, message.trim());
      }
      const result = await sendContractConversationMessage(current.id, message.trim());
      setCurrent(result); setMessage(""); setEditing(false); await refresh();
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "اعمال اصلاحات انجام نشد.");
    } finally { setBusy(false); }
  }
  function approve() {
    if (current && latest) void run(() => reviewContractDraft(current.id, latest.id, "requester", true));
  }
  function review(stage: "expert" | "manager", approved: boolean) {
    if (!current || !latest) return;
    if (!approved && !reviewNote.trim()) {
      setNotice("برای رد پیش‌نویس، دلیل یا اصلاح موردنیاز را بنویسید.");
      return;
    }
    if (stage === "manager" && approved
      && !window.confirm("قرارداد نهایی و در مخزن اسناد ثبت شود؟")) return;
    void run(() => reviewContractDraft(current.id, latest.id, stage, approved,
      reviewNote.trim() || undefined));
  }
  async function download(format: "docx" | "pdf") {
    if (!current || !latest) return;
    setBusy(true); setNotice("");
    try {
      const blob = await downloadContractDraftFile(current.id, latest.id, format);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `contract-v${latest.versionNumber}.${format}`;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (e) { setNotice(e instanceof Error ? e.message : "دریافت فایل انجام نشد."); }
    finally { setBusy(false); }
  }
  async function open(id: string) {
    setBusy(true); setNotice("");
    try { setCurrent(await getContractConversation(id)); setShowHistory(false); }
    catch (e) { setNotice(e instanceof Error ? e.message : "قرارداد دریافت نشد."); }
    finally { setBusy(false); }
  }
  function newRequest() { setCurrent(undefined); setMessage(""); setReviewNote(""); setEditing(false); setNotice(""); }

  const step = !current ? 1 : questions.length ? 2 : latest ? 3 : 2;
  return (
    <main className="contract-studio" dir="rtl">
      <header className="contract-studio-header">
        <div className="contract-brand"><span aria-hidden="true">ن</span><div><small>نگارش هوشمند</small><h1>میز کار قرارداد</h1></div></div>
        <nav><button onClick={() => setShowHistory(x => !x)}>سوابق قراردادها</button><Link href="/historical-contract-import">ورود قرارداد سابق</Link><Link href="/">بازگشت به سامانه</Link></nav>
      </header>

      <div className="contract-flowbar">
        <div><span className={step >= 1 ? "active" : ""}>۱</span><b>درخواست</b></div>
        <i />
        <div><span className={step >= 2 ? "active" : ""}>۲</span><b>تکمیل خودکار</b></div>
        <i />
        <div><span className={step >= 3 ? "active" : ""}>۳</span><b>بازبینی و دریافت</b></div>
      </div>

      {showHistory && <aside className="contract-history panel">
        <header><h2>قراردادهای اخیر</h2><button onClick={newRequest}>+ درخواست جدید</button></header>
        {history.length === 0 ? <p>هنوز قراردادی ایجاد نشده است.</p> : history.map(item =>
          <button key={item.id} onClick={() => void open(item.id)}><strong>{item.title}</strong><span>{item.partyName} · {toPersianDigits(item.draftCount)} نسخه</span></button>)}
      </aside>}

      {!current ? (
        <div className="contract-start-layout">
          <section className="contract-request panel">
            <div className="contract-request-heading"><span>یک جمله کافی است</span><h2>قراردادتان را توضیح دهید</h2><p>نام شرکت، موضوع، تاریخ و مبلغ را بنویسید. مشخصات طرف قرارداد و بندهای جدید را هم می‌توانید در همان متن بگویید.</p></div>
            <form onSubmit={start}>
              <label htmlFor="contract-request-message">درخواست شما</label>
              <textarea id="contract-request-message" autoFocus required value={message} onChange={e => setMessage(e.target.value)}
                placeholder="مثلاً: قرارداد پشتیبانی با شرکت فناوری داده‌ای از تاریخ ۱۴۰۵/۰۱/۰۱ تا ۱۴۰۵/۱۲/۲۹ با مبلغ ۲۵۵ میلیارد ریال تنظیم کن..." />
              <div className="contract-request-footer"><small>اگر اطلاعاتی کم باشد، دستیار فقط همان مورد را از شما می‌پرسد.</small><button className="primary-button" disabled={busy || !message.trim()}>{busy ? "در حال آماده‌سازی..." : "ساخت پیش‌نویس قرارداد"}<span>←</span></button></div>
            </form>
            <div className="contract-examples"><span>نمونه درخواست</span>{REQUEST_EXAMPLES.map(example => <button type="button" key={example} onClick={() => setMessage(example)}>{example}</button>)}</div>
          </section>
          <aside className="contract-start-aside">
            <section className={`contract-readiness ${organizationIsReady(organization) ? "ready" : "missing"}`}>
              <div><b>{organizationIsReady(organization) ? "✓" : "!"}</b><span><strong>{organizationIsReady(organization) ? "آماده ساخت قرارداد" : "یک مرحله تا شروع"}</strong><small>{organizationIsReady(organization) ? "اطلاعات شرکت شما کامل است" : "اطلاعات شرکت خودتان را کامل کنید"}</small></span></div>
              {organizationIsReady(organization)
                ? <p><strong>{organization?.name}</strong><span>نماینده: {organization?.chiefExecutiveName}</span></p>
                : <Link href="/basic-data/organization-profile">تکمیل اطلاعات شرکت</Link>}
            </section>
            <section className="contract-guide-card"><h3>چه چیزهایی بنویسم؟</h3><ul><li><b>۱</b><span>نوع قرارداد و نام شرکت مقابل</span></li><li><b>۲</b><span>تاریخ شروع و پایان</span></li><li><b>۳</b><span>مبلغ یا درصد افزایش</span></li><li><b>۴</b><span>بندها و شرایط دلخواه</span></li></ul></section>
            {history.length > 0 && <section className="contract-recent-card"><header><h3>آخرین درخواست‌ها</h3><button onClick={() => setShowHistory(true)}>مشاهده همه</button></header>{history.slice(0, 3).map(item => <button key={item.id} onClick={() => void open(item.id)}><span><strong>{item.partyName}</strong><small>{item.groupName}</small></span><b>←</b></button>)}</section>}
          </aside>
        </div>
      ) : (
        <section className="contract-workspace">
          <header className="contract-current"><div><button onClick={newRequest}>درخواست جدید</button><h2>{current.title}</h2></div><span>{current.partyName} · {current.groupName}</span></header>
          <Understanding conversation={current} organization={organization} />

          {questions.length > 0 && <section className="contract-questions panel">
            <span>برای ادامه فقط این موارد را پاسخ دهید</span>
            {questions.map((q, index) => <p key={q.id}><b>{toPersianDigits(index + 1)}</b>{q.question}</p>)}
            <form onSubmit={answer}><textarea autoFocus required value={message} onChange={e => setMessage(e.target.value)} placeholder="پاسخ را همین‌جا بنویسید..." /><button className="primary-button" disabled={busy}>{busy ? "در حال بررسی..." : "ثبت پاسخ و ادامه"}</button></form>
          </section>}

          {latest && questions.length === 0 && <section className="contract-review panel">
            <header><div><span>آماده بررسی</span><h2>آیا برداشت سامانه درست است؟</h2></div><b>پیش‌نویس نسخه {toPersianDigits(latest.versionNumber)}</b></header>
            <p>قبل از تأیید می‌توانید PDF را ببینید. اگر موردی درست نیست، اصلاح را با یک جمله بنویسید.</p>
            <div className="contract-file-actions"><button onClick={() => void download("pdf")} disabled={busy}>دریافت PDF</button><button onClick={() => void download("docx")} disabled={busy}>دریافت Word</button></div>
            {latest.approvalStatus === 1 && !editing && <div className="contract-decision"><button className="approve" onClick={approve} disabled={busy}>اطلاعات درست است؛ تأیید</button><button className="edit" onClick={() => setEditing(true)}>نیاز به اصلاح دارد</button></div>}
            {editing && <form className="contract-correction" onSubmit={correct}><label>چه چیزی اصلاح شود؟</label><textarea autoFocus required value={message} onChange={e => setMessage(e.target.value)} placeholder="مثلاً نام کارفرما داده‌پردازان و مدیرعامل مصطفی مهدوی است؛ ماده جدید قبل از ماده تعداد نسخ قرار گیرد."/><div><button type="button" onClick={() => setEditing(false)}>انصراف</button><button className="primary-button" disabled={busy}>{busy ? "در حال اعمال..." : "اعمال اصلاح و ساخت نسخه جدید"}</button></div></form>}
            {latest.approvalStatus > 1 && latest.approvalStatus < 4 && <div className="contract-organization-review">
              <ol className="contract-approval-flow">
                <li className="done"><b>✓</b><span>تأیید درخواست‌کننده</span></li>
                <li className={latest.approvalStatus === 2 ? "current" : "done"}><b>{latest.approvalStatus === 2 ? "۲" : "✓"}</b><span>بررسی کارشناس</span></li>
                <li className={latest.approvalStatus === 3 ? "current" : ""}><b>۳</b><span>نهایی‌سازی مدیر</span></li>
              </ol>
              {latest.approvalStatus === 2 && accessForms?.has(EXPERT_REVIEW_ACCESS) && <div className="contract-review-action">
                <h3>بررسی کارشناس قرارداد</h3>
                <p>فایل و خلاصه تغییرات را بررسی کنید؛ سپس نتیجه را ثبت کنید.</p>
                <textarea value={reviewNote} onChange={e => setReviewNote(e.target.value)} placeholder="یادداشت بررسی (برای تأیید اختیاری و برای رد الزامی است)" />
                <div className="contract-decision"><button className="approve" disabled={busy} onClick={() => review("expert", true)}>تأیید کارشناس و ارسال برای مدیر</button><button className="reject" disabled={busy} onClick={() => review("expert", false)}>رد و درخواست اصلاح</button></div>
              </div>}
              {latest.approvalStatus === 3 && accessForms?.has(MANAGER_FINALIZE_ACCESS) && <div className="contract-review-action">
                <h3>تصمیم نهایی مدیر قراردادها</h3>
                <p>با تأیید مدیر، نسخه نهایی در مخزن اسناد ثبت و منتشر می‌شود.</p>
                <textarea value={reviewNote} onChange={e => setReviewNote(e.target.value)} placeholder="یادداشت مدیر (برای تأیید اختیاری و برای رد الزامی است)" />
                <div className="contract-decision"><button className="approve" disabled={busy} onClick={() => review("manager", true)}>نهایی‌سازی و ثبت قرارداد</button><button className="reject" disabled={busy} onClick={() => review("manager", false)}>رد و درخواست اصلاح</button></div>
              </div>}
              {accessForms && ((latest.approvalStatus === 2 && !accessForms.has(EXPERT_REVIEW_ACCESS)) || (latest.approvalStatus === 3 && !accessForms.has(MANAGER_FINALIZE_ACCESS))) && <p className="contract-review-waiting">{latest.approvalStatus === 2 ? "این پیش‌نویس در انتظار کاربری با دسترسی «بررسی کارشناس قرارداد» است." : "این پیش‌نویس در انتظار کاربری با دسترسی «نهایی‌سازی قرارداد» است."}</p>}
              {!accessForms && <p className="contract-review-waiting">در حال بررسی دسترسی مرحله جاری...</p>}
            </div>}
            {latest.approvalStatus === 5 && <div className="contract-rejected"><p>پیش‌نویس رد شده است. اصلاحات خواسته‌شده را بنویسید تا نسخه جدید ساخته شود.</p>{!editing && <button className="edit" onClick={() => setEditing(true)}>اعلام اصلاحات و ساخت نسخه جدید</button>}</div>}
            {latest.approvalStatus === 4 && <div className="contract-rejected"><p className="contract-success">قرارداد نهایی شده و برای دریافت آماده است.</p>{!editing && <button className="edit" onClick={() => setEditing(true)}>اصلاح نسخه نهایی و ساخت نسخه جدید</button>}</div>}
          </section>}

          <details className="contract-conversation panel"><summary>مشاهده متن درخواست‌ها و پاسخ‌های سامانه</summary>{current.messages.map(item => <article key={item.id} className={`role-${item.role}`}><b>{item.role === 1 ? "شما" : item.role === 2 ? "دستیار" : "سامانه"}</b><p>{item.content}</p></article>)}</details>
        </section>
      )}
      {notice && <div className="contract-notice">{notice}</div>}
    </main>
  );
}
