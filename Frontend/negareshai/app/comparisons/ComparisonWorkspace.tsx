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
  listComparisonApprovedReferenceDocumentIds,
  listDocumentGroups,
  listDocuments,
  reviewComparison,
  reviewFinding,
  startComparison,
  uploadDocumentBatch,
} from "../../lib/api";
import { formatJalaliDateTime } from "../../lib/jalali";

type Mode = "execute" | "history" | "review" | "reports";
type ComparisonSourceMode = "file" | "group" | "both";
type ReviewDialog =
  | { kind: "finding"; findingId: string; decision: number }
  | { kind: "result"; approved: boolean };
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
    [approvedReferenceDocumentIds, setApprovedReferenceDocumentIds] = useState<string[]>([]),
    [runs, setRuns] = useState<ComparisonRunSummary[]>([]),
    [selected, setSelected] = useState<ComparisonRun | null>(null);
  const [targetDocumentId, setTargetDocumentId] = useState(""),
    [referenceDocumentId, setReferenceDocumentId] = useState(""),
    [documentGroupId, setDocumentGroupId] = useState(""),
    [sourceMode, setSourceMode] = useState<ComparisonSourceMode>("file"),
    [targetFile, setTargetFile] = useState<File | null>(null),
    [referenceFile, setReferenceFile] = useState<File | null>(null),
    [instruction, setInstruction] = useState(""),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  const [reviewDialog, setReviewDialog] = useState<ReviewDialog | null>(null),
    [reviewNote, setReviewNote] = useState(""),
    [correctedReason, setCorrectedReason] = useState(""),
    [persistDecision, setPersistDecision] = useState(false);
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
    const needsFile = sourceMode === "file" || sourceMode === "both";
    const needsGroup = sourceMode === "group" || sourceMode === "both";
    if (!targetDocumentId && !targetFile) {
      setMessage("سند مورد بررسی را انتخاب یا بارگذاری کنید.");
      return;
    }
    if (needsFile && !referenceDocumentId && !referenceFile) {
      setMessage("سند مرجع را انتخاب یا بارگذاری کنید.");
      return;
    }
    if (needsGroup && !documentGroupId) {
      setMessage("گروه مرجع را انتخاب کنید.");
      return;
    }
    if (needsFile && targetDocumentId && targetDocumentId === referenceDocumentId) {
      setMessage("برای مقایسه باید دو سند متفاوت انتخاب شوند.");
      return;
    }
    setBusy(true);
    try {
      let selectedDocumentId = targetDocumentId;
      let selectedReferenceId = referenceDocumentId;
      if (targetFile) {
        const uploaded = await uploadDocumentBatch({
          files: [targetFile], title: targetFile.name,
          documentType: "general", documentGroupIds: [],
        });
        selectedDocumentId = uploaded.id;
      }
      if (needsFile && referenceFile) {
        const uploaded = await uploadDocumentBatch({
          files: [referenceFile], title: referenceFile.name,
          documentType: "general", documentGroupIds: [],
        });
        selectedReferenceId = uploaded.id;
      }
      const run = await startComparison({
        targetDocumentId: selectedDocumentId,
        referenceDocumentId: needsFile ? selectedReferenceId : undefined,
        documentGroupId: needsGroup ? documentGroupId : undefined,
        basisMode: sourceMode === "file" ? 3 : sourceMode === "group" ? 1 : 4,
        ruleSetIds: [],
        userInstruction: instruction || undefined,
      });
      setSelected(run);
      setTargetFile(null);
      setReferenceFile(null);
      setMessage(sourceMode === "file"
        ? "دو سند خوانده و مقایسه شدند؛ شباهت‌ها و تفاوت‌های مستند در ادامه آمده است."
        : sourceMode === "group"
          ? "سند با منابع تأییدشده گروه مقایسه شد."
          : "سند هم‌زمان با سند مرجع و منابع تأییدشده گروه مقایسه شد.");
      await load();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "اجرای انطباق انجام نشد.");
    } finally {
      setBusy(false);
    }
  }
  function openReviewDialog(next: ReviewDialog) {
    setReviewDialog(next);
    setReviewNote("");
    setCorrectedReason("");
    setPersistDecision(false);
  }
  async function decide(findingId: string, decision: number) {
    if (decision === 4 && !correctedReason.trim()) return;
    setBusy(true);
    try {
      await reviewFinding(findingId, {
        decision,
        comment: reviewNote.trim() || undefined,
        correctedReason: correctedReason.trim() || undefined,
        persistForDocumentGroup: persistDecision,
      });
      setReviewDialog(null);
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
    setBusy(true);
    try {
      setSelected(await reviewComparison(selected.id, {
        approved,
        note: reviewNote.trim() || undefined,
      }));
      setReviewDialog(null);
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
            مثل یک گفت‌وگو، دو سند را بدهید و با زبان ساده بگویید چه تفاوت‌هایی برایتان مهم است.
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
          <h2>دو سند را بدهید و بگویید چه چیزی مقایسه شود</h2>
          <div className="conformity-form">
            <fieldset className="full comparison-source-mode">
              <legend>مبنای مقایسه</legend>
              <label><input type="radio" name="comparison-source" checked={sourceMode === "file"}
                onChange={() => setSourceMode("file")} /><span>با یک سند</span></label>
              <label><input type="radio" name="comparison-source" checked={sourceMode === "group"}
                onChange={() => setSourceMode("group")} /><span>با یک گروه</span></label>
              <label><input type="radio" name="comparison-source" checked={sourceMode === "both"}
                onChange={() => setSourceMode("both")} /><span>با سند و گروه</span></label>
            </fieldset>
            <label className="full comparison-file-picker">
              <span>۱. سند اول</span>
              <input type="file" accept=".pdf,.docx,.jpg,.jpeg,.png,.tif,.tiff"
                onChange={e => { setTargetFile(e.target.files?.[0] ?? null); setTargetDocumentId(""); }} />
              <small>{targetFile ? targetFile.name : "PDF، Word یا تصویر سند اول را انتخاب کنید."}</small>
            </label>
            <label className="full comparison-existing">
              <span>یا سند اول از اسناد قبلی</span>
              <select
                value={targetDocumentId}
                onChange={(e) => { setTargetDocumentId(e.target.value); setTargetFile(null); }}
              >
                <option value="">انتخاب سند قبلی (اختیاری)</option>
                {documents.filter(x => x.id !== referenceDocumentId
                  && (!(sourceMode === "group" || sourceMode === "both")
                    || !approvedReferenceDocumentIds.includes(x.id))).map((x) => (
                  <option key={x.id} value={x.id}>
                    {x.title}
                  </option>
                ))}
              </select>
            </label>
            {(sourceMode === "file" || sourceMode === "both") && <label className="full comparison-file-picker">
              <span>۲. سند دوم</span>
              <input type="file" accept=".pdf,.docx,.jpg,.jpeg,.png,.tif,.tiff"
                onChange={e => { setReferenceFile(e.target.files?.[0] ?? null); setReferenceDocumentId(""); }} />
              <small>{referenceFile ? referenceFile.name : "PDF، Word یا تصویر سند دوم را انتخاب کنید."}</small>
            </label>}
            {(sourceMode === "file" || sourceMode === "both") && <label className="full comparison-existing">
              <span>یا سند دوم از اسناد قبلی</span>
              <select
                value={referenceDocumentId}
                onChange={(e) => { setReferenceDocumentId(e.target.value); setReferenceFile(null); }}
              >
                <option value="">انتخاب سند دوم (اختیاری)</option>
                {documents.filter(x => x.id !== targetDocumentId).map((x) => (
                  <option key={x.id} value={x.id}>{x.title}</option>
                ))}
              </select>
            </label>}
            {(sourceMode === "group" || sourceMode === "both") && <label className="full comparison-existing">
              <span>{sourceMode === "group" ? "۲. گروه مرجع" : "۳. گروه مرجع"}</span>
              <select value={documentGroupId} onChange={(e) => { void (async () => {
                const next = e.target.value;
                setDocumentGroupId(next);
                const ids = next ? await listComparisonApprovedReferenceDocumentIds(next) : [];
                setApprovedReferenceDocumentIds(ids);
                if (ids.includes(targetDocumentId)) {
                  setTargetDocumentId("");
                  setMessage("یکی از منابع تأییدشده گروه نمی‌تواند سند هدف همان مقایسه باشد.");
                }
              })().catch(() => setMessage("دریافت منابع گروه انجام نشد.")); }}>
                <option value="">انتخاب گروه</option>
                {groups.filter(x => x.isActive).map(x => <option key={x.id} value={x.id}>{x.name}</option>)}
              </select>
              <small>همه منابع تأییدشده فعال این گروه مانند فایل‌های مرجع مقایسه می‌شوند.</small>
            </label>}
            <label className="full">
              <span>{sourceMode === "both" ? "۴" : "۳"}. درخواست شما (اختیاری)</span>
              <textarea
                value={instruction}
                onChange={(e) => setInstruction(e.target.value)}
                placeholder="مثلاً تفاوت مبلغ‌ها، تاریخ‌ها، تعهدات و بندهای اضافه یا حذف‌شده را بگو."
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
          <small>سامانه هر دو سند را مستقیم می‌خواند و تفاوت‌ها را با شاهد از هر دو طرف گزارش می‌کند.</small>
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
                            onClick={() => openReviewDialog({ kind: "finding", findingId: f.id, decision: 2 })}
                          >
                            تأیید یافته
                          </button>
                          <button
                            disabled={busy}
                            onClick={() => openReviewDialog({ kind: "finding", findingId: f.id, decision: 3 })}
                          >
                            رد یافته
                          </button>
                          <button
                            disabled={busy}
                            onClick={() => openReviewDialog({ kind: "finding", findingId: f.id, decision: 4 })}
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
                    onClick={() => openReviewDialog({ kind: "result", approved: true })}
                  >
                    تأیید نتیجه انطباق
                  </button>
                  <button
                    disabled={
                      busy ||
                      selected.findings.some((x) => x.reviewDecision === 1)
                    }
                    className="reject"
                    onClick={() => openReviewDialog({ kind: "result", approved: false })}
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
      {reviewDialog && (
        <div className="conformity-modal-backdrop" role="presentation">
          <section className="conformity-modal" role="dialog" aria-modal="true" aria-labelledby="review-dialog-title">
            <header>
              <h2 id="review-dialog-title">
                {reviewDialog.kind === "result"
                  ? reviewDialog.approved ? "تأیید نتیجه انطباق" : "رد نتیجه انطباق"
                  : reviewDialog.decision === 2 ? "تأیید یافته" : reviewDialog.decision === 3 ? "رد یافته" : "اصلاح دلیل یافته"}
              </h2>
              <button type="button" aria-label="بستن پنجره بازبینی" onClick={() => setReviewDialog(null)}>×</button>
            </header>
            <label>
              <span>{reviewDialog.kind === "result" && !reviewDialog.approved ? "علت رد" : "یادداشت کارشناس (اختیاری)"}</span>
              <textarea autoFocus value={reviewNote} onChange={(e) => setReviewNote(e.target.value)} />
            </label>
            {reviewDialog.kind === "finding" && reviewDialog.decision === 4 && (
              <label>
                <span>دلیل اصلاح‌شده</span>
                <textarea required value={correctedReason} onChange={(e) => setCorrectedReason(e.target.value)} />
              </label>
            )}
            {reviewDialog.kind === "finding" && (
              <label className="conformity-modal-check">
                <input type="checkbox" checked={persistDecision} onChange={(e) => setPersistDecision(e.target.checked)} />
                <span>این تصمیم در اجراهای بعدی همین گروه نیز به‌عنوان مرجع اعمال شود.</span>
              </label>
            )}
            <footer>
              <button type="button" onClick={() => setReviewDialog(null)}>انصراف</button>
              <button
                type="button"
                className="primary-button"
                disabled={busy || (reviewDialog.kind === "finding" && reviewDialog.decision === 4 && !correctedReason.trim())}
                onClick={() => reviewDialog.kind === "result"
                  ? void approveResult(reviewDialog.approved)
                  : void decide(reviewDialog.findingId, reviewDialog.decision)}
              >{busy ? "در حال ثبت..." : "ثبت تصمیم"}</button>
            </footer>
          </section>
        </div>
      )}
      {message && <div className="ingestion-message">{message}</div>}
    </main>
  );
}
