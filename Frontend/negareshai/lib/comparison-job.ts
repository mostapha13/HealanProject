export const COMPARISON_JOB_KEY = "negareshai.active_comparison_job";

export type ActiveComparisonJob = {
  targetDocumentId: string;
  referenceDocumentId?: string;
  documentGroupId?: string;
  sourceMode: "file" | "group" | "both";
  instruction?: string;
  targetTitle?: string;
  referenceTitle?: string;
  documentGroupTitle?: string;
  returnUrl?: string;
  createdAt: string;
  stage: "processing" | "comparing";
};

export function readComparisonJob(): ActiveComparisonJob | null {
  if (typeof window === "undefined") return null;
  try { return JSON.parse(localStorage.getItem(COMPARISON_JOB_KEY) || "null"); }
  catch { return null; }
}

export function writeComparisonJob(job: ActiveComparisonJob | null) {
  if (typeof window === "undefined") return;
  if (job) localStorage.setItem(COMPARISON_JOB_KEY, JSON.stringify(job));
  else localStorage.removeItem(COMPARISON_JOB_KEY);
  window.dispatchEvent(new Event("negareshai-comparison-job"));
}
