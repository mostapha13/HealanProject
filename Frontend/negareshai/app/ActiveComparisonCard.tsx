"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { getDocumentDetail } from "../lib/api";
import { ActiveComparisonJob, readComparisonJob, writeComparisonJob } from "../lib/comparison-job";

function metadata(json?: string) {
  try { return JSON.parse(json || "{}") as { progressPercent?: number; processingStage?: string }; }
  catch { return {}; }
}

export default function ActiveComparisonCard() {
  const failedPolls = useRef(0);
  const [job, setJob] = useState<ActiveComparisonJob | null>(null);
  const [percent, setPercent] = useState(0);
  const [stage, setStage] = useState("در حال آماده‌سازی");

  useEffect(() => {
    let disposed = false;
    async function refresh() {
      const current = readComparisonJob();
      if (disposed) return;
      setJob(current);
      if (!current) return;
      if (current.stage === "comparing") {
        setPercent(95); setStage("مقایسه ساختار و سرفصل‌ها"); return;
      }
      try {
        const ids = [current.targetDocumentId, current.referenceDocumentId].filter(Boolean) as string[];
        const documents = await Promise.all(ids.map(id => getDocumentDetail(id)));
        failedPolls.current = 0;
        const values = documents.map(document => metadata(document.versions[0]?.extractionMetadataJson));
        setPercent(Math.round(values.reduce((sum, item) => sum + (item.progressPercent ?? 2), 0) / values.length * .9));
        setStage(values.find(item => (item.progressPercent ?? 0) < 100)?.processingStage ?? "آماده برای مقایسه");
      } catch {
        failedPolls.current += 1;
        if (failedPolls.current >= 3) writeComparisonJob(null);
        else setStage("در انتظار دریافت وضعیت");
      }
    }
    void refresh();
    const timer = window.setInterval(() => void refresh(), 2000);
    window.addEventListener("negareshai-comparison-job", refresh);
    return () => { disposed = true; clearInterval(timer); window.removeEventListener("negareshai-comparison-job", refresh); };
  }, []);

  if (!job) return null;
  return <Link className="active-comparison-card" href="/comparisons?resume=1">
    <div><strong>مقایسهٔ در حال اجرا</strong><b>{percent}٪</b></div>
    <span>{stage}</span>
    <i><em style={{ width: `${percent}%` }} /></i>
    <small>برای مشاهدهٔ جزئیات کلیک کنید</small>
  </Link>;
}
