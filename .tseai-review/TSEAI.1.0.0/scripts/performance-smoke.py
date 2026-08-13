#!/usr/bin/env python3
"""Bounded concurrent chat performance gate.

For more than 50 requests, provide multiple comma-separated production test-user
tokens through TSEAI_PERFORMANCE_BEARER_TOKENS so the test does not disable or
silently bypass per-user product quotas.
"""

import argparse
import concurrent.futures
import datetime as dt
import json
import os
import statistics
import time
import urllib.error
import urllib.request
import uuid
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser()
parser.add_argument("--base-url", required=True)
parser.add_argument("--requests", type=int, default=200)
parser.add_argument("--concurrency", type=int, default=20)
parser.add_argument("--max-p95-ms", type=float, default=5000)
parser.add_argument("--out", default="artifacts/performance-live.json")
args = parser.parse_args()

tokens = [value.strip() for value in os.getenv("TSEAI_PERFORMANCE_BEARER_TOKENS", "").split(",") if value.strip()]
if args.requests > 50 and len(tokens) < args.concurrency:
    print(f"At least {args.concurrency} distinct TSEAI_PERFORMANCE_BEARER_TOKENS are required for this load gate.")
    raise SystemExit(3)

run_id = uuid.uuid4().hex


def execute(index: int) -> dict:
    body = json.dumps({"question": "قیمت خودرو چنده؟", "conversationId": f"perf-{run_id}-{index}"}, ensure_ascii=False).encode("utf-8")
    headers = {"Content-Type": "application/json", "X-Correlation-Id": f"perf-{run_id}-{index}"}
    if tokens:
        headers["Authorization"] = f"Bearer {tokens[index % len(tokens)]}"
    else:
        headers["X-Anonymous-Id"] = f"perf-{run_id}-{index}"
    request = urllib.request.Request(args.base_url.rstrip("/") + "/api/chat/ask", data=body, headers=headers, method="POST")
    started = time.perf_counter()
    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            response.read()
            status = response.status
            error = None if status == 200 else f"HTTP {status}"
    except urllib.error.HTTPError as ex:
        status = ex.code
        error = f"HTTP {ex.code}"
    except Exception as ex:
        status = None
        error = str(ex)
    return {"latencyMs": (time.perf_counter() - started) * 1000, "status": status, "error": error}


count = max(1, args.requests)
workers = max(1, min(args.concurrency, count, 50))
with concurrent.futures.ThreadPoolExecutor(max_workers=workers) as executor:
    rows = list(executor.map(execute, range(count)))

latencies = sorted(row["latencyMs"] for row in rows)
p95 = latencies[min(len(latencies) - 1, max(0, int(len(latencies) * 0.95) - 1))]
errors = [row for row in rows if row["error"]]
report = {
    "generatedAtUtc": dt.datetime.now(dt.timezone.utc).isoformat(),
    "version": (ROOT / "VERSION").read_text(encoding="utf-8").strip(),
    "runId": run_id,
    "requests": len(rows),
    "concurrency": workers,
    "errors": len(errors),
    "p50Ms": round(statistics.median(latencies), 2),
    "p95Ms": round(p95, 2),
    "maxP95Ms": args.max_p95_ms,
    "passed": not errors and p95 <= args.max_p95_ms,
    "errorSamples": errors[:20],
}
output = ROOT / args.out
output.parent.mkdir(parents=True, exist_ok=True)
output.write_text(json.dumps(report, indent=2), encoding="utf-8")
print(json.dumps(report, indent=2))
raise SystemExit(0 if report["passed"] else 2)
