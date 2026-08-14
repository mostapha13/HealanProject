#!/usr/bin/env python3
import argparse
import json
import statistics
import sys
import time
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path


def ask(base_url: str, question: str, timeout: float) -> tuple[dict, float]:
    payload = json.dumps({"question": question}, ensure_ascii=False).encode("utf-8")
    request = urllib.request.Request(
        base_url.rstrip("/") + "/api/chat/ask",
        data=payload,
        headers={"Content-Type": "application/json; charset=utf-8"},
        method="POST",
    )
    started = time.perf_counter()
    with urllib.request.urlopen(request, timeout=timeout) as response:
        body = json.loads(response.read().decode("utf-8"))
    return body, (time.perf_counter() - started) * 1000


def evaluate(case: dict, response: dict) -> tuple[bool, list[str]]:
    answer = str(response.get("answer") or "")
    response_type = str(response.get("type") or "")
    issues: list[str] = []
    if case.get("expectedType") and response_type != case["expectedType"]:
        issues.append(f"type:{response_type}")
    for value in case.get("mustContain", []):
        if value not in answer:
            issues.append(f"missing:{value}")
    for alternatives in case.get("mustContainAny", []):
        if not any(value in answer for value in alternatives):
            issues.append("missing_any:" + "|".join(alternatives))
    for value in case.get("mustNotContain", []):
        if value in answer:
            issues.append(f"forbidden:{value}")
    if len(answer) > case.get("maxAnswerChars", 2000):
        issues.append(f"too_long:{len(answer)}")
    if not answer.strip():
        issues.append("empty_answer")
    if "Unexpected token '<'" in answer or answer.lstrip().startswith("<html"):
        issues.append("transport_or_html_error")
    return not issues, issues


def main() -> int:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    parser = argparse.ArgumentParser()
    parser.add_argument("--corpus", required=True)
    parser.add_argument("--base-url", default="http://localhost:8280")
    parser.add_argument("--out", required=True)
    parser.add_argument("--timeout", type=float, default=60)
    parser.add_argument("--interval-ms", type=int, default=100)
    args = parser.parse_args()

    corpus_path = Path(args.corpus)
    corpus = json.loads(corpus_path.read_text(encoding="utf-8"))
    results = []
    latencies = []
    for index, case in enumerate(corpus["cases"], 1):
        try:
            response, latency = ask(args.base_url, case["question"], args.timeout)
            passed, issues = evaluate(case, response)
            latencies.append(latency)
            result = {**case, "passed": passed, "issues": issues, "answer": response.get("answer"),
                      "actualType": response.get("type"), "latencyMs": round(latency, 2)}
        except (OSError, ValueError, urllib.error.URLError) as exc:
            result = {**case, "passed": False, "issues": [f"request:{type(exc).__name__}:{exc}"],
                      "answer": None, "actualType": None, "latencyMs": None}
        results.append(result)
        print(json.dumps({"progress": f"{index}/{len(corpus['cases'])}", "id": case["id"],
                          "passed": result["passed"], "issues": result["issues"]}, ensure_ascii=False), flush=True)
        if args.interval_ms > 0:
            time.sleep(args.interval_ms / 1000)

    passed = sum(1 for result in results if result["passed"])
    clusters: dict[str, dict[str, int]] = {}
    for result in results:
        item = clusters.setdefault(result["cluster"], {"total": 0, "passed": 0})
        item["total"] += 1
        item["passed"] += int(result["passed"])
    ordered = sorted(latencies)
    p95 = ordered[min(len(ordered) - 1, max(0, int(len(ordered) * .95) - 1))] if ordered else None
    report = {
        "version": corpus["version"],
        "generatedAtUtc": datetime.now(timezone.utc).isoformat(),
        "total": len(results),
        "passed": passed,
        "passRate": passed / len(results) if results else 0,
        "allPassed": passed == len(results),
        "p50LatencyMs": round(statistics.median(latencies), 2) if latencies else None,
        "p95LatencyMs": round(p95, 2) if p95 is not None else None,
        "clusters": clusters,
        "results": results,
    }
    output = Path(args.out)
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps({"total": len(results), "passed": passed, "out": str(output)}, ensure_ascii=False))
    return 0 if report["allPassed"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
