"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { getDocumentProgress } from "../lib/api";
import { ActiveComparisonJob, readComparisonJob, writeComparisonJob } from "../lib/comparison-job";

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
        const values = await Promise.all(ids.map(id => getDocumentProgress(id)));
        failedPolls.current = 0;
        setPercent(Math.round(values.reduce((sum, item) => sum + item.percent, 0) / values.length * .9));
        setStage(values.find(item => item.percent < 100)?.stage ?? "آماده برای مقایسه");
      } catch (error) {
        if(error instanceof Error&&error.message==="DOCUMENT_NOT_FOUND"){writeComparisonJob(null);setJob(null);return}
        failedPolls.current += 1;
        setStage(failedPolls.current >= 3 ? "ارتباط موقتاً برقرار نیست؛ برای ادامه کلیک کنید" : "در انتظار دریافت وضعیت");
      }
    }
    void refresh();
    const timer = window.setInterval(() => void refresh(), 2000);
    window.addEventListener("negareshai-comparison-job", refresh);
    return () => { disposed = true; clearInterval(timer); window.removeEventListener("negareshai-comparison-job", refresh); };
  }, []);

  if (!job) return null;
  return <Link className="active-comparison-card" href={job.returnUrl || "/comparisons?resume=1"}>
    <div><strong>مقایسهٔ در حال اجرا</strong><b className="active-progress-percent">{percent}٪</b></div>
    <span>{stage}</span>
    <i><em style={{ width: `${percent}%` }} /></i>
    <small>مشاهده درخواست و ادامه کار ←</small>
  </Link>;
}
