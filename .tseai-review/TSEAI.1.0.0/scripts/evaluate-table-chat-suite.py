#!/usr/bin/env python3
"""Strict, source-aware evaluation for the eight Sprint-1 audited SQL tables."""

from __future__ import annotations

import argparse
import datetime as dt
import hashlib
import json
import re
import statistics
import time
import urllib.error
import urllib.request
import uuid
from collections import Counter, defaultdict
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_MANIFEST = ROOT / "tests" / "table-chat-evaluation-suite.v2.json"


def normalize(value: object) -> str:
    text = str(value or "").replace("ي", "ی").replace("ك", "ک").replace("ۀ", "ه")
    text = text.replace("\u200c", " ")
    # Treat common Persian suffix spacing variants as equivalent:
    # «فرآیندهای»، «فرآیند‌های» and «فرآیند های».
    text = re.sub(r"(?<=\w)\s+(?=(?:هایی|های|ها)(?:\s|$))", "", text)
    return " ".join(text.split()).strip().lower()


def digest(paths: list[Path]) -> str:
    value = hashlib.sha256()
    for path in sorted(paths, key=lambda item: str(item).lower()):
        value.update(str(path.relative_to(ROOT)).replace("\\", "/").encode("utf-8"))
        value.update(b"\0")
        value.update(path.read_bytes())
        value.update(b"\0")
    return value.hexdigest()


def load_suite(manifest_path: Path, selected_sources: set[str] | None) -> tuple[dict, list[dict], list[Path], list[str]]:
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    cases: list[dict] = []
    source_paths: list[Path] = [manifest_path]
    issues: list[str] = []
    seen_ids: set[tuple[str, str]] = set()
    declared_sources: set[str] = set()

    for entry in manifest.get("corpora", []):
        source_code = str(entry.get("sourceCode") or "").strip()
        if selected_sources and source_code not in selected_sources:
            continue
        if not source_code or source_code in declared_sources:
            issues.append(f"manifest:duplicate_or_empty_source:{source_code}")
            continue
        declared_sources.add(source_code)
        corpus_path = manifest_path.parent / str(entry.get("file") or "")
        if not corpus_path.is_file():
            issues.append(f"{source_code}:corpus_missing:{corpus_path.name}")
            continue
        source_paths.append(corpus_path)
        corpus = json.loads(corpus_path.read_text(encoding="utf-8"))
        rows = corpus.get("cases") or []
        clusters = {str(case.get("cluster") or "").strip() for case in rows if case.get("cluster")}
        if len(rows) < int(entry.get("minimumCases", 1)):
            issues.append(f"{source_code}:too_few_cases:{len(rows)}")
        if len(clusters) < int(entry.get("minimumClusters", 1)):
            issues.append(f"{source_code}:too_few_clusters:{len(clusters)}")
        global_forbidden = list(corpus.get("globalMustNotContain") or [])
        for case in rows:
            case_id = str(case.get("id") or "").strip()
            expected_type = case.get("expectedType") or entry.get("defaultExpectedType")
            for field in ("id", "cluster", "question", "expectedType"):
                if not (expected_type if field == "expectedType" else case.get(field)):
                    issues.append(f"{source_code}:{case_id or '<missing-id>'}:missing_{field}")
            scoped_id = (source_code, case_id)
            if scoped_id in seen_ids:
                issues.append(f"duplicate_case_id:{source_code}:{case_id}")
            seen_ids.add(scoped_id)
            if not isinstance(case.get("mustContain", []), list):
                issues.append(f"{source_code}:{case_id}:mustContain_not_list")
            if not isinstance(case.get("mustNotContain", []), list):
                issues.append(f"{source_code}:{case_id}:mustNotContain_not_list")
            cases.append({
                **case,
                "id": f"{source_code}:{case_id}",
                "caseId": case_id,
                "expectedType": expected_type,
                "sourceCode": source_code,
                "table": entry.get("table"),
                "authority": entry.get("authority"),
                "corpusVersion": corpus.get("version"),
                "corpusForbidden": global_forbidden,
            })

    if not selected_sources and len(cases) < int(manifest.get("minimumTotalCases", 1)):
        issues.append(f"suite:too_few_cases:{len(cases)}")
    unknown = (selected_sources or set()) - declared_sources
    for source in sorted(unknown):
        issues.append(f"manifest:unknown_selected_source:{source}")
    return manifest, cases, source_paths, issues


def ask(base_url: str, case: dict, run_id: str, timeout: float, rate_limit_retries: int) -> tuple[dict, float, str | None, int | None]:
    conversation_id = case.get("conversationId") or f"table-eval-{run_id}-{case['id']}"
    body = json.dumps({"question": case["question"], "conversationId": conversation_id}, ensure_ascii=False).encode("utf-8")
    request = urllib.request.Request(
        base_url.rstrip("/") + "/api/chat/ask",
        data=body,
        headers={
            "Content-Type": "application/json; charset=utf-8",
            "X-Anonymous-Id": f"table-eval-{run_id}-{case['id']}",
            "X-Correlation-Id": f"table-eval-{run_id}-{case['id']}",
        },
        method="POST",
    )
    started = time.perf_counter()
    for attempt in range(max(0, rate_limit_retries) + 1):
        try:
            with urllib.request.urlopen(request, timeout=timeout) as response:
                output = json.loads(response.read().decode("utf-8"))
                return output, (time.perf_counter() - started) * 1000, None, response.status
        except urllib.error.HTTPError as error:
            detail = error.read().decode("utf-8", errors="replace")[:1200]
            if error.code == 429 and attempt < rate_limit_retries:
                raw_retry = error.headers.get("Retry-After", "1")
                try:
                    retry_after = max(1.0, min(120.0, float(raw_retry)))
                except ValueError:
                    retry_after = 1.0
                time.sleep(retry_after + 0.1)
                continue
            return {}, (time.perf_counter() - started) * 1000, f"HTTP {error.code}: {detail}", error.code
        except Exception as error:  # keep the failed case and continue the suite
            return {}, (time.perf_counter() - started) * 1000, f"{type(error).__name__}: {error}", None
    return {}, (time.perf_counter() - started) * 1000, "rate_limit_retry_exhausted", 429


def resolved_entity(output: dict) -> str:
    selected = (output.get("entity") or {}).get("selected") or {}
    market = output.get("market") or {}
    context = (output.get("conversationContext") or {}).get("primaryEntity") or {}
    return str(
        selected.get("symbol") or selected.get("displayName")
        or market.get("symbol") or market.get("symbolName")
        or context.get("symbol") or context.get("displayName") or ""
    )


def evaluate_case(case: dict, output: dict, manifest: dict, error: str | None) -> tuple[bool, dict[str, bool], list[str]]:
    answer = str(output.get("answer") or "")
    actual_type = str(output.get("type") or "")
    expected_types = case.get("expectedTypes") or [case.get("expectedType")]
    trace = [row for row in (output.get("trace") or []) if isinstance(row, dict)]
    tools = {str(row.get("tool") or "") for row in trace}
    forbidden = [
        *manifest.get("forbiddenAnswerFragments", []),
        *case.get("corpusForbidden", []),
        *case.get("mustNotContain", []),
    ]
    answer_normalized = normalize(answer)
    entity = resolved_entity(output)
    checks: dict[str, bool] = {
        "transport": error is None,
        "nonEmptyAnswer": bool(answer.strip()),
        "type": any(normalize(actual_type) == normalize(value) for value in expected_types if value),
        "entity": not case.get("expectedEntity") or normalize(entity) == normalize(case["expectedEntity"]),
        "mustContain": all(normalize(value) in answer_normalized for value in case.get("mustContain", [])),
        "mustContainAny": all(
            any(normalize(value) in answer_normalized for value in alternatives)
            for alternatives in case.get("mustContainAny", [])
        ),
        "mustNotContain": all(normalize(value) not in answer_normalized for value in forbidden),
        "answerLength": len(answer) <= int(case.get("maxAnswerChars", 2000)),
        "trace": not manifest.get("requireTrace") or bool(trace),
        "expectedTools": all(value in tools for value in case.get("expectedTools", [])),
        "jalaliDisplay": all(not re.search(pattern, answer) for pattern in manifest.get("forbiddenAnswerRegex", [])),
    }
    if case.get("authority") == "structured" and actual_type not in {"clarification", "unsupported"}:
        checks["authority"] = any(
            tool.startswith("structured.") or tool.startswith("analytics.") or tool.startswith("filter.")
            for tool in tools
        )
    elif case.get("authority") == "hybrid" and actual_type not in {"clarification", "unsupported"}:
        checks["authority"] = any(
            tool.startswith("structured.") or tool.startswith("knowledge.")
            for tool in tools
        )
    issues = [name for name, passed in checks.items() if not passed]
    if error:
        issues.append(error)
    return not issues, checks, issues


def percentile(values: list[float], ratio: float) -> float | None:
    if not values:
        return None
    ordered = sorted(values)
    return round(ordered[min(len(ordered) - 1, max(0, int(len(ordered) * ratio) - 1))], 2)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--manifest", default=str(DEFAULT_MANIFEST))
    parser.add_argument("--base-url", default="http://localhost:8280")
    parser.add_argument("--out", default="artifacts/table-chat-evaluation-suite.v2.json")
    parser.add_argument("--validate-only", action="store_true")
    parser.add_argument("--source", action="append", help="Run one or more semantic source codes")
    parser.add_argument("--ids", help="Comma-separated case ids")
    parser.add_argument("--timeout", type=float, default=70)
    parser.add_argument("--interval-ms", type=int, default=100)
    parser.add_argument("--rate-limit-retries", type=int, default=2)
    args = parser.parse_args()

    manifest_path = Path(args.manifest).resolve()
    selected_sources = set(args.source or []) or None
    manifest, cases, source_paths, structural_issues = load_suite(manifest_path, selected_sources)
    if args.ids:
        selected_ids = {value.strip() for value in args.ids.split(",") if value.strip()}
        cases = [case for case in cases if case["id"] in selected_ids or case["caseId"] in selected_ids]
        matched_ids = {value for case in cases for value in (case["id"],case["caseId"])}
        missing_ids = selected_ids - matched_ids
        structural_issues.extend(f"unknown_case_id:{value}" for value in sorted(missing_ids))

    provenance = {
        "manifestVersion": manifest.get("version"),
        "datasetSha256": digest(source_paths),
        "caseCount": len(cases),
        "sources": sorted({case["sourceCode"] for case in cases}),
    }
    if args.validate_only:
        report = {
            "mode": "structural-preflight",
            "generatedAtUtc": dt.datetime.now(dt.timezone.utc).isoformat(),
            **provenance,
            "passed": not structural_issues,
            "issues": structural_issues,
            "coverage": {
                source: {
                    "cases": sum(case["sourceCode"] == source for case in cases),
                    "clusters": len({case["cluster"] for case in cases if case["sourceCode"] == source}),
                }
                for source in provenance["sources"]
            },
        }
        output_path = ROOT / args.out
        output_path.parent.mkdir(parents=True, exist_ok=True)
        output_path.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
        print(json.dumps(report, ensure_ascii=False, indent=2))
        return 0 if report["passed"] else 2

    rows: list[dict[str, Any]] = []
    latencies: list[float] = []
    run_id = uuid.uuid4().hex[:12]
    for index, case in enumerate(cases, 1):
        output, latency_ms, error, http_status = ask(args.base_url, case, run_id, args.timeout, args.rate_limit_retries)
        passed, checks, issues = evaluate_case(case, output, manifest, error)
        latencies.append(latency_ms)
        row = {
            "id": case["id"],
            "caseId": case["caseId"],
            "sourceCode": case["sourceCode"],
            "table": case["table"],
            "cluster": case["cluster"],
            "question": case["question"],
            "passed": passed,
            "checks": checks,
            "issues": issues,
            "actualType": output.get("type"),
            "actualEntity": resolved_entity(output),
            "answer": output.get("answer"),
            "trace": output.get("trace"),
            "httpStatus": http_status,
            "latencyMs": round(latency_ms, 2),
        }
        rows.append(row)
        print(json.dumps({"progress": f"{index}/{len(cases)}", "id": case["id"], "passed": passed, "issues": issues}, ensure_ascii=False), flush=True)
        if args.interval_ms > 0:
            time.sleep(args.interval_ms / 1000)

    grouped: dict[str, list[dict]] = defaultdict(list)
    clusters: dict[str, list[dict]] = defaultdict(list)
    for row in rows:
        grouped[row["sourceCode"]].append(row)
        clusters[f"{row['sourceCode']}:{row['cluster']}"] .append(row)
    passed_count = sum(bool(row["passed"]) for row in rows)
    pass_rate = passed_count / max(1, len(rows))
    gate_passed = not structural_issues and pass_rate >= float(manifest.get("minimumPassRate", 1.0))
    report = {
        "mode": "live",
        "generatedAtUtc": dt.datetime.now(dt.timezone.utc).isoformat(),
        "runId": run_id,
        **provenance,
        "total": len(rows),
        "passed": passed_count,
        "failed": len(rows) - passed_count,
        "passRate": pass_rate,
        "p50LatencyMs": round(statistics.median(latencies), 2) if latencies else None,
        "p95LatencyMs": percentile(latencies, .95),
        "gatePassed": gate_passed,
        "structuralIssues": structural_issues,
        "failureReasons": dict(Counter(issue for row in rows for issue in row["issues"])),
        "sources": {
            key: {"total": len(value), "passed": sum(bool(row["passed"]) for row in value)}
            for key, value in sorted(grouped.items())
        },
        "clusters": {
            key: {"total": len(value), "passed": sum(bool(row["passed"]) for row in value)}
            for key, value in sorted(clusters.items())
        },
        "failures": [row for row in rows if not row["passed"]],
        "results": rows,
    }
    output_path = ROOT / args.out
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps({key: value for key, value in report.items() if key not in {"results", "failures", "clusters"}}, ensure_ascii=False, indent=2))
    return 0 if gate_passed else 2


if __name__ == "__main__":
    raise SystemExit(main())
