#!/usr/bin/env python3
from __future__ import annotations

import argparse
import datetime as dt
import json
import statistics
import time
import urllib.error
import urllib.request
import uuid
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CORPUS_PATH = ROOT / "tests" / "semantic-equivalence-corpus.v1.json"


def ask(base_url: str, case: dict) -> tuple[dict, float, str | None]:
    body = json.dumps({
        "question": case["question"],
        "conversationId": case.get("conversationId", "semantic-eval-" + case["id"]),
    }, ensure_ascii=False).encode("utf-8")
    headers = {
        "Content-Type": "application/json; charset=utf-8",
        "X-Anonymous-Id": "semantic-eval-" + uuid.uuid4().hex,
        "X-Correlation-Id": "semantic-eval-" + case["id"],
    }
    request = urllib.request.Request(
        base_url.rstrip("/") + "/api/chat/ask",
        data=body,
        headers=headers,
        method="POST",
    )
    started = time.perf_counter()
    try:
        with urllib.request.urlopen(request, timeout=65) as response:
            return json.loads(response.read().decode("utf-8")), (time.perf_counter() - started) * 1000, None
    except urllib.error.HTTPError as error:
        detail = error.read().decode("utf-8", errors="replace")[:1000]
        return {}, (time.perf_counter() - started) * 1000, f"HTTP {error.code}: {detail}"
    except Exception as error:  # evaluator must preserve the case failure and continue
        return {}, (time.perf_counter() - started) * 1000, str(error)


def norm(value: object) -> str:
    return " ".join(str(value or "").replace("ي", "ی").replace("ك", "ک").split()).lower()


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--base-url", required=True)
    parser.add_argument("--corpus", default=str(CORPUS_PATH))
    parser.add_argument("--ids", help="Comma-separated case ids to run")
    parser.add_argument("--out", default="artifacts/semantic-equivalence-live.json")
    args = parser.parse_args()

    corpus = json.loads(Path(args.corpus).read_text(encoding="utf-8"))
    if args.ids:
        selected = {value.strip() for value in args.ids.split(",") if value.strip()}
        corpus["cases"] = [case for case in corpus["cases"] if case["id"] in selected]
    forbidden = corpus.get("globalMustNotContain", [])
    rows = []
    for case in corpus["cases"]:
        output, latency_ms, error = ask(args.base_url, case)
        answer = output.get("answer") or ""
        entity = ((output.get("entity") or {}).get("selected") or {}).get("symbol") or ""
        normalized_answer = norm(answer)
        safe_unavailable = bool(case.get("allowSafeUnavailable")) and (
            norm(output.get("type")) == "data_quality_unavailable"
            or "quality gate" in normalized_answer
            or "قابل اتکا نیست" in normalized_answer
            or "کنار گذاشته شد" in normalized_answer
        )
        expected_types = case.get("expectedTypes") or [case.get("expectedType")]
        checks = {
            "type": norm(output.get("type")) in {norm(value) for value in expected_types} or safe_unavailable,
            "entity": not case.get("expectedEntity") or norm(entity) == norm(case["expectedEntity"]),
            "mustContain": safe_unavailable or all(norm(value) in normalized_answer for value in case.get("mustContain", [])),
            "mustNotContain": all(norm(value) not in norm(answer) for value in forbidden + case.get("mustNotContain", [])),
            "answerLength": len(answer) <= case.get("maxAnswerChars", 10000),
        }
        passed = error is None and all(checks.values())
        rows.append({
            "id": case["id"], "cluster": case["cluster"], "question": case["question"],
            "passed": passed, "checks": checks, "latencyMs": round(latency_ms, 2),
            "type": output.get("type"), "entity": entity, "answer": answer, "error": error,
        })
        print(("PASS" if passed else "FAIL") + f" {case['id']} {case['cluster']} {latency_ms:.0f}ms",flush=True)

    clusters: dict[str, list[dict]] = defaultdict(list)
    for row in rows:
        clusters[row["cluster"]].append(row)
    report = {
        "version": corpus["version"],
        "generatedAtUtc": dt.datetime.now(dt.timezone.utc).isoformat(),
        "total": len(rows),
        "passed": sum(row["passed"] for row in rows),
        "passRate": sum(row["passed"] for row in rows) / max(1, len(rows)),
        "allPassed": all(row["passed"] for row in rows),
        "p50LatencyMs": round(statistics.median(row["latencyMs"] for row in rows), 2),
        "p95LatencyMs": sorted(row["latencyMs"] for row in rows)[min(len(rows) - 1, int(len(rows) * .95))],
        "clusters": {key: {"total": len(value), "passed": sum(row["passed"] for row in value)} for key, value in sorted(clusters.items())},
        "results": rows,
        "failures": [row for row in rows if not row["passed"]],
    }
    output_path = ROOT / args.out
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps({key: value for key, value in report.items() if key not in {"results", "failures"}}, ensure_ascii=False, indent=2))
    return 0 if report["allPassed"] else 2


if __name__ == "__main__":
    raise SystemExit(main())
