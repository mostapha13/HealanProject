"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ComparisonRun,
  ComparisonRunSummary,
  DocumentGroup,
  DocumentListItem,
  downloadComparisonReport,
  getComparisonRun,
  listComparisonRuns,
  listDocumentGroups,
  listDocuments,
  reviewComparison,
  reviewFinding,
  startComparison,
  uploadDocumentBatch,
} from "../../lib/api";
import { formatJalaliDateTime } from "../../lib/jalali";

type Mode = "execute" | "history" | "review" | "reports";
const outcomeLabel: Record<number, string> = {
  1: "منطبق",
  2: "نامنطبق",
  3: "نیازمند بررسی",
};
const approvalLabel: Record<number, string> = {
  1: "در انتظار کارشناس",
  2: "تأیید کارشناس",
  3: "رد کارشناس",
  4: "نهایی و منتشرشده",
};
const findingLabel: Record<number, string> = {
  1: "منطبق",
  2: "مفقود",
  3: "ممنوع",
  4: "متفاوت",
  5: "اضافی",
};

export default function ComparisonWorkspace({ mode }: { mode: Mode }) {
  const [documents, setDocuments] = useState<DocumentListItem[]>([]),
    [groups, setGroups] = useState<DocumentGroup[]>([]),
    [runs, setRuns] = useState<ComparisonRunSummary[]>([]),
    [selected, setSelected] = useState<ComparisonRun | null>(null);
  const [targetDocumentId, setTargetDocumentId] = useState(""),
    [documentGroupId, setDocumentGroupId] = useState(""),
    [targetFile, setTargetFile] = useState<File | null>(null),
    [instruction, setInstruction] = useState(""),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  async function load() {
    const [d, g, r] = await Promise.all([
      listDocuments(),
      listDocumentGroups(),
      listComparisonRuns(),
    ]);
    setDocuments(d.items);
    setGroups(g);
    setRuns(r);
    const first =
      mode === "review"
        ? r.find((x) => x.approvalStatus === 1)
        : mode === "reports"
          ? r.find((x) => x.approvalStatus >= 2)
          : r[0];
    if (first) setSelected(await getComparisonRun(first.id));
  }
  useEffect(() => {
    void load().catch(() => setMessage("دریافت اطلاعات انطباق انجام نشد."));
  }, [mode]);
  const visible = useMemo(
    () =>
      mode === "review"
        ? runs.filter((x) => x.approvalStatus === 1)
        : mode === "reports"
          ? runs.filter((x) => x.approvalStatus >= 2)
          : runs,
    [mode, runs],
  );
  async function open(id: string) {
    setBusy(true);
    try {
      setSelected(await getComparisonRun(id));
    } finally {
      setBusy(false);
    }
  }
  async function execute() {
    if ((!targetDocumentId && !targetFile) || !documentGroupId) {
      setMessage("فایل مورد بررسی و گروه کاری آن را مشخص کنید.");
      return;
    }
    setBusy(true);
    try {
      let selectedDocumentId = targetDocumentId;
      if (targetFile) {
        const uploaded = await uploadDocumentBatch({
          files: [targetFile], title: targetFile.name,
          documentType: "general", documentGroupIds: [documentGroupId],
        });
        selectedDocumentId = uploaded.id;
      }
      const run = await startComparison({
        targetDocumentId: selectedDocumentId,
        documentGroupId,
        basisMode: 1,
        ruleSetIds: [],
        userInstruction: instruction || undefined,
      });
      setSelected(run);
      setTargetFile(null);
      setMessage("مقایسه انجام شد؛ نتیجه و موارد اختلاف در ادامه نمایش داده شده است.");
      await load();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "اجرای انطباق انجام نشد.");
    } finally {
      setBusy(false);
    }
  }
  async function decide(findingId: string, decision: number) {
    const comment = window.prompt("نظر کارشناس") || undefined;
    const persist = window.confirm(
      "این تصمیم به‌عنوان مرجع پایدار گروه در اجراهای بعدی نیز اعمال شود؟",
    );
    let correctedReason: string | undefined;
    if (decision === 4) {
      correctedReason = window.prompt("دلیل اصلاح‌شده") || undefined;
      if (!correctedReason) return;
    }
    setBusy(true);
    try {
      await reviewFinding(findingId, {
        decision,
        comment,
        correctedReason,
        persistForDocumentGroup: persist,
      });
      if (selected) setSelected(await getComparisonRun(selected.id));
      await load();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "ثبت تصمیم انجام نشد.");
    } finally {
      setBusy(false);
    }
  }
  async function approveResult(approved: boolean) {
    if (!selected) return;
    const note =
      window.prompt(approved ? "یادداشت تأیید نتیجه" : "علت رد نتیجه") ||
      undefined;
    setBusy(true);
    try {
      setSelected(await reviewComparison(selected.id, { approved, note }));
      setMessage(
        approved
          ? "نتیجه تأیید شد؛ نسخه اکنون منتظر نهایی‌سازی مدیر است."
          : "نتیجه و نسخه هدف رد شدند.",
      );
      await load();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "ثبت تأیید نتیجه انجام نشد.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="conformity-page" dir="rtl">
      <header className="conformity-header">
        <div>
          <span>مقایسه هوشمند اسناد</span>
          <h1>
            {mode === "execute"
              ? "مقایسه سند جدید"
              : mode === "history"
                ? "تاریخچه اجراها"
                : mode === "review"
                  ? "بازبینی کارشناسی"
                  : "گزارش‌های ممیزی"}
          </h1>
          <p>
            یک سند بدهید؛ سامانه آن را با اسناد مرجع تأییدشده همان گروه کاری مقایسه می‌کند.
          </p>
        </div>
        <Link href="/">بازگشت به داشبورد</Link>
      </header>
      <nav className="conformity-tabs">
        <Link
          className={mode === "execute" ? "active" : ""}
          href="/comparisons"
        >
          اجرای جدید
        </Link>
        <Link
          className={mode === "history" ? "active" : ""}
          href="/comparisons/history"
        >
          تاریخچه
        </Link>
        <Link
          className={mode === "review" ? "active" : ""}
          href="/comparisons/review"
        >
          بازبینی
        </Link>
        <Link
          className={mode === "reports" ? "active" : ""}
          href="/comparisons/reports"
        >
          گزارش‌ها
        </Link>
      </nav>
      {mode === "execute" && (
        <article className="panel conformity-builder">
          <h2>سند را برای مقایسه انتخاب کنید</h2>
          <div className="conformity-form">
            <label className="full comparison-file-picker">
              <span>۱. فایل مورد بررسی</span>
              <input type="file" accept=".pdf,.docx,.jpg,.jpeg,.png,.tif,.tiff"
                onChange={e => { setTargetFile(e.target.files?.[0] ?? null); setTargetDocumentId(""); }} />
              <small>{targetFile ? targetFile.name : "PDF، Word یا تصویر سند را انتخاب کنید."}</small>
            </label>
            <label className="full comparison-existing">
              <span>یا انتخاب از اسناد قبلی سامانه</span>
              <select
                value={targetDocumentId}
                onChange={(e) => { setTargetDocumentId(e.target.value); setTargetFile(null); }}
              >
                <option value="">انتخاب سند قبلی (اختیاری)</option>
                {documents.map((x) => (
                  <option key={x.id} value={x.id}>
                    {x.title}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>۲. گروه کاری سند</span>
              <select
                value={documentGroupId}
                onChange={(e) => setDocumentGroupId(e.target.value)}
              >
                <option value="">انتخاب گروه کاری</option>
                {groups
                  .filter((x) => x.isActive)
                  .map((x) => (
                    <option key={x.id} value={x.id}>
                      {x.name}
                    </option>
                  ))}
              </select>
            </label>
            <label className="full">
              <span>۳. نکته‌ای که باید بیشتر بررسی شود (اختیاری)</span>
              <textarea
                value={instruction}
                onChange={(e) => setInstruction(e.target.value)}
                placeholder="مثلاً تاریخ‌ها، مبالغ یا بند محرمانگی با دقت بیشتری بررسی شود."
              />
            </label>
          </div>
          <button
            disabled={busy}
            className="primary-button"
            onClick={() => void execute()}
          >
            {busy ? "در حال خواندن و مقایسه..." : "مقایسه سند"}
          </button>
          <small>مبنای مقایسه فقط اسناد مرجع تأییدشده‌ای است که قبلاً برای همین گروه کاری ثبت شده‌اند.</small>
        </article>
      )}
      <section className="conformity-layout">
        <aside className="panel conformity-runs">
          <h2>
            {mode === "review"
              ? "صف بازبینی"
              : mode === "reports"
                ? "نتایج قابل گزارش"
                : "اجراها"}
          </h2>
          {visible.length === 0 && (
            <p className="conformity-empty">موردی وجود ندارد.</p>
          )}
          {visible.map((run) => (
            <button
              key={run.id}
              className={selected?.id === run.id ? "active" : ""}
              onClick={() => void open(run.id)}
            >
              <strong>{run.targetDocumentTitle}</strong>
              <span>{formatJalaliDateTime(run.createdAtUtc)}</span>
              <b className={`outcome-${run.outcome || 3}`}>
                {outcomeLabel[run.outcome || 3]}
              </b>
              <em>{run.scorePercent ?? 0}٪</em>
            </button>
          ))}
        </aside>
        <article className="panel conformity-detail">
          {selected ? (
            <>
              <header>
                <div>
                  <h2>{selected.targetDocumentTitle}</h2>
                  <span>{approvalLabel[selected.approvalStatus]}</span>
                </div>
                <div className="report-actions">
                  <button
                    onClick={() =>
                      void downloadComparisonReport(selected.id, "docx")
                    }
                  >
                    DOCX نسخه‌دار
                  </button>
                  <button
                    onClick={() =>
                      void downloadComparisonReport(selected.id, "pdf")
                    }
                  >
                    PDF نسخه‌دار
                  </button>
                </div>
              </header>
              <div className="conformity-score">
                <div>
                  <span>امتیاز وزنی</span>
                  <strong>{selected.scorePercent ?? 0}٪</strong>
                </div>
                <div>
                  <span>آستانه</span>
                  <strong>{selected.passingThreshold}٪</strong>
                </div>
                <div>
                  <span>معیار حیاتی</span>
                  <strong
                    className={
                      selected.hasCriticalFailure
                        ? "danger-text"
                        : "success-text"
                    }
                  >
                    {selected.hasCriticalFailure ? "نقض شده" : "پاس شده"}
                  </strong>
                </div>
                <div>
                  <span>نتیجه</span>
                  <strong>{outcomeLabel[selected.outcome || 3]}</strong>
                </div>
              </div>
              <p className="outcome-explanation">
                {selected.outcomeExplanation}
              </p>
              <details>
                <summary>snapshot معیارها و منابع</summary>
                <pre>
                  {JSON.stringify(
                    {
                      criteria: JSON.parse(selected.criterionSnapshotJson),
                      sources: JSON.parse(selected.sourceSnapshotJson),
                    },
                    null,
                    2,
                  )}
                </pre>
              </details>
              <details>
                <summary>ردپای ابزارها و Reflection</summary>
                <pre>
                  {JSON.stringify(JSON.parse(selected.toolTraceJson), null, 2)}
                </pre>
              </details>
              <div className="conformity-findings">
                {selected.findings.map((f) => (
                  <section
                    key={f.id}
                    className={`finding severity-${f.severity}`}
                  >
                    <header>
                      <div>
                        <h3>{f.title}</h3>
                        {f.isCritical && <b>حیاتی</b>}
                        {f.isApplicable && <b>وزن {f.weight}</b>}
                      </div>
                      <span>
                        {findingLabel[f.type]} · اطمینان{" "}
                        {Math.round(f.confidence * 100)}٪
                      </span>
                    </header>
                    <p>{f.correctedReason || f.reason}</p>
                    {f.targetEvidence && (
                      <blockquote>
                        هدف — صفحه {f.targetPage ?? "؟"}، بخش{" "}
                        {f.targetSection || "نامشخص"}
                        <br />
                        {f.targetEvidence}
                      </blockquote>
                    )}
                    {f.referenceEvidence && (
                      <blockquote className="reference">
                        مرجع — صفحه {f.referencePage ?? "؟"}، بخش{" "}
                        {f.referenceSection || "نامشخص"}
                        <br />
                        {f.referenceEvidence}
                      </blockquote>
                    )}
                    {f.suggestion && (
                      <div className="suggestion">
                        پیشنهاد اصلاح: {f.suggestion}
                      </div>
                    )}
                    <footer>
                      {f.reviewDecision === 1 ? (
                        <>
                          <button
                            disabled={busy}
                            onClick={() => void decide(f.id, 2)}
                          >
                            تأیید یافته
                          </button>
                          <button
                            disabled={busy}
                            onClick={() => void decide(f.id, 3)}
                          >
                            رد یافته
                          </button>
                          <button
                            disabled={busy}
                            onClick={() => void decide(f.id, 4)}
                          >
                            اصلاح دلیل
                          </button>
                        </>
                      ) : (
                        <span>تصمیم ثبت‌شده: {f.reviewDecision}</span>
                      )}
                    </footer>
                  </section>
                ))}
              </div>
              {selected.approvalStatus === 1 && (
                <div className="review-actions">
                  <button
                    disabled={
                      busy ||
                      selected.findings.some((x) => x.reviewDecision === 1)
                    }
                    className="approve"
                    onClick={() => void approveResult(true)}
                  >
                    تأیید نتیجه انطباق
                  </button>
                  <button
                    disabled={
                      busy ||
                      selected.findings.some((x) => x.reviewDecision === 1)
                    }
                    className="reject"
                    onClick={() => void approveResult(false)}
                  >
                    رد نتیجه
                  </button>
                </div>
              )}
              {selected.approvalStatus === 2 && (
                <p className="manager-handoff">
                  تأیید کارشناس ثبت شده است. نهایی‌سازی و انتشار RAG فقط از مسیر
                  مدیر و با مجوز مستقل انجام می‌شود.{" "}
                  <Link href="/documents/ingestion">
                    رفتن به نهایی‌سازی اسناد
                  </Link>
                </p>
              )}
            </>
          ) : (
            <p className="conformity-empty">یک اجرا را انتخاب کنید.</p>
          )}
        </article>
      </section>
      {message && <div className="ingestion-message">{message}</div>}
    </main>
  );
}
