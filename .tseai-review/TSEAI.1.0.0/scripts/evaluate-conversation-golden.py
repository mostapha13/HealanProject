#!/usr/bin/env python3
"""Run strict, multi-turn golden conversations against the public chat API."""

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
from collections import Counter
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_SUITE = ROOT / "tests" / "conversation-golden-suite.v1.json"


def reject_duplicate_keys(pairs: list[tuple[str, Any]]) -> dict[str, Any]:
    value: dict[str, Any] = {}
    for key, item in pairs:
        if key in value:
            raise ValueError(f"duplicate JSON key: {key}")
        value[key] = item
    return value


def normalize(value: object) -> str:
    text = str(value or "").replace("ي", "ی").replace("ك", "ک").replace("ۀ", "ه")
    text = text.replace("\u200c", " ")
    return " ".join(text.split()).strip().lower()


def manifest_digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def gregorian_to_jalali(year: int, month: int, day: int) -> str:
    gregorian_month_days = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
    year -= 1600
    month -= 1
    day -= 1
    gregorian_day = 365 * year + (year + 3) // 4 - (year + 99) // 100 + (year + 399) // 400
    for index in range(month):
        gregorian_day += gregorian_month_days[index]
    if month > 1 and (year % 4 == 0 and year % 100 != 0 or year % 400 == 0):
        gregorian_day += 1
    gregorian_day += day
    jalali_day = gregorian_day - 79
    cycles = jalali_day // 12053
    jalali_day %= 12053
    jalali_year = 979 + 33 * cycles + 4 * (jalali_day // 1461)
    jalali_day %= 1461
    if jalali_day >= 366:
        jalali_year += (jalali_day - 1) // 365
        jalali_day = (jalali_day - 1) % 365
    if jalali_day < 186:
        jalali_month = 1 + jalali_day // 31
        jalali_date = 1 + jalali_day % 31
    else:
        jalali_month = 7 + (jalali_day - 186) // 30
        jalali_date = 1 + (jalali_day - 186) % 30
    return f"{jalali_year:04d}/{jalali_month:02d}/{jalali_date:02d}"


def evidence_claims(output: dict[str, Any]) -> list[tuple[str, str]]:
    claims: list[tuple[str, str]] = []
    for item in output.get("evidence") or []:
        if not isinstance(item, dict) or not isinstance(item.get("claims"), dict):
            continue
        for key, value in item["claims"].items():
            if value is not None and str(value).strip():
                claims.append((str(key), str(value)))
    return claims


def claims_for_patterns(claims: list[tuple[str, str]], patterns: list[str]) -> list[list[str]]:
    return [[value for key, value in claims if re.search(pattern, key)] for pattern in patterns]


def validate_suite(suite: dict[str, Any]) -> list[str]:
    issues: list[str] = []
    flows = suite.get("flows")
    if not isinstance(flows, list) or not flows:
        return ["suite:flows_missing"]
    seen_flows: set[str] = set()
    seen_turns: set[str] = set()
    total_turns = 0
    for flow in flows:
        flow_id = str(flow.get("id") or "").strip()
        if not flow_id or flow_id in seen_flows:
            issues.append(f"suite:duplicate_or_empty_flow:{flow_id}")
        seen_flows.add(flow_id)
        turns = flow.get("turns")
        if not isinstance(turns, list) or not turns:
            issues.append(f"{flow_id}:turns_missing")
            continue
        if len(turns) < int(flow.get("minimumTurns", 1)):
            issues.append(f"{flow_id}:too_few_turns:{len(turns)}")
        for turn in turns:
            total_turns += 1
            turn_id = str(turn.get("id") or "").strip()
            scoped_id = f"{flow_id}:{turn_id}"
            if not turn_id or scoped_id in seen_turns:
                issues.append(f"suite:duplicate_or_empty_turn:{scoped_id}")
            seen_turns.add(scoped_id)
            if not str(turn.get("question") or "").strip():
                issues.append(f"{scoped_id}:question_missing")
            if not turn.get("expectedTypes"):
                issues.append(f"{scoped_id}:expected_types_missing")
            for field in (
                "expectedTypes", "mustContain", "mustContainAny", "mustNotContain",
                "answerRegex", "answerNotRegex", "expectedTools", "answerValidationStatuses",
                "answerContainsEvidenceClaimPatterns", "answerContainsJalaliEvidenceDateClaimPatterns",
                "forbiddenTools",
            ):
                if field in turn and not isinstance(turn[field], list):
                    issues.append(f"{scoped_id}:{field}_not_list")
            if any(not isinstance(group, list) or not group for group in turn.get("mustContainAny", [])):
                issues.append(f"{scoped_id}:mustContainAny_invalid_group")
            for pattern in [
                *suite.get("globalAnswerNotRegex", []),
                *turn.get("answerRegex", []),
                *turn.get("answerNotRegex", []),
                *turn.get("answerContainsEvidenceClaimPatterns", []),
                *turn.get("answerContainsJalaliEvidenceDateClaimPatterns", []),
                *([turn["normalizedEqualsEvidenceClaimPattern"]] if turn.get("normalizedEqualsEvidenceClaimPattern") else []),
            ]:
                try:
                    re.compile(pattern)
                except (re.error, TypeError):
                    issues.append(f"{scoped_id}:invalid_regex:{pattern}")
            details = turn.get("traceDetailContains", {})
            if not isinstance(details, dict) or any(not isinstance(value, list) for value in details.values()):
                issues.append(f"{scoped_id}:trace_detail_contains_invalid")
    minimum = int(suite.get("minimumTotalTurns", 1))
    if total_turns < minimum:
        issues.append(f"suite:too_few_turns:{total_turns}")
    return issues


def request_turn(
    base_url: str,
    anonymous_id: str,
    conversation_id: str,
    correlation_id: str,
    question: str,
    timeout: float,
    retries: int,
) -> tuple[dict[str, Any], float, str | None, int | None]:
    body = json.dumps(
        {"question": question, "conversationId": conversation_id},
        ensure_ascii=False,
    ).encode("utf-8")
    request = urllib.request.Request(
        base_url.rstrip("/") + "/api/chat/ask",
        data=body,
        headers={
            "Content-Type": "application/json; charset=utf-8",
            "X-Anonymous-Id": anonymous_id,
            "X-Correlation-Id": correlation_id,
        },
        method="POST",
    )
    started = time.perf_counter()
    for attempt in range(max(0, retries) + 1):
        try:
            with urllib.request.urlopen(request, timeout=timeout) as response:
                payload = json.loads(response.read().decode("utf-8"))
                return payload, (time.perf_counter() - started) * 1000, None, response.status
        except urllib.error.HTTPError as error:
            detail = error.read().decode("utf-8", errors="replace")[:1200]
            if error.code == 429 and attempt < retries:
                try:
                    retry_after = max(1.0, min(120.0, float(error.headers.get("Retry-After", "1"))))
                except ValueError:
                    retry_after = 1.0
                time.sleep(retry_after + 0.1)
                continue
            return {}, (time.perf_counter() - started) * 1000, f"HTTP {error.code}: {detail}", error.code
        except Exception as error:  # preserve the failed turn and continue the report
            return {}, (time.perf_counter() - started) * 1000, f"{type(error).__name__}: {error}", None
    return {}, (time.perf_counter() - started) * 1000, "rate_limit_retry_exhausted", 429


def evaluate_turn(
    suite: dict[str, Any],
    turn: dict[str, Any],
    output: dict[str, Any],
    error: str | None,
    expected_revision: int,
    latency_ms: float,
) -> tuple[bool, dict[str, bool], list[str]]:
    answer = str(output.get("answer") or "")
    normalized_answer = normalize(answer)
    actual_type = normalize(output.get("type"))
    trace = [item for item in (output.get("trace") or []) if isinstance(item, dict)]
    tools = {str(item.get("tool") or "") for item in trace}
    trace_by_tool = {
        tool: " | ".join(str(item.get("detail") or "") for item in trace if item.get("tool") == tool)
        for tool in tools
    }
    validation = output.get("answerValidation") or {}
    raw_validation_status = validation.get("status")
    validation_status = {0: "Grounded", 1: "Warning", 2: "Blocked"}.get(
        raw_validation_status,
        str(raw_validation_status or ""),
    )
    context = output.get("conversationContext") or {}
    claims = evidence_claims(output)
    evidence_pattern_values = claims_for_patterns(claims, turn.get("answerContainsEvidenceClaimPatterns", []))
    exact_claim_values = claims_for_patterns(
        claims,
        [turn["normalizedEqualsEvidenceClaimPattern"]] if turn.get("normalizedEqualsEvidenceClaimPattern") else [],
    )
    jalali_pattern_values = claims_for_patterns(claims, turn.get("answerContainsJalaliEvidenceDateClaimPatterns", []))
    jalali_claim_dates: list[list[str]] = []
    for values in jalali_pattern_values:
        converted: list[str] = []
        for value in values:
            match = re.match(r"^(\d{4})-(\d{2})-(\d{2})", value)
            if match:
                converted.append(gregorian_to_jalali(*(int(part) for part in match.groups())))
        jalali_claim_dates.append(converted)
    forbidden = [*suite.get("globalMustNotContain", []), *turn.get("mustNotContain", [])]
    forbidden_regex = [*suite.get("globalAnswerNotRegex", []), *turn.get("answerNotRegex", [])]
    expected_statuses = turn.get("answerValidationStatuses")

    checks: dict[str, bool] = {
        "transport": error is None,
        "httpPayload": isinstance(output, dict) and bool(output),
        "nonEmptyAnswer": bool(answer.strip()),
        "type": actual_type in {normalize(value) for value in turn.get("expectedTypes", [])},
        "mustContain": all(normalize(value) in normalized_answer for value in turn.get("mustContain", [])),
        "mustContainAny": all(
            any(normalize(value) in normalized_answer for value in alternatives)
            for alternatives in turn.get("mustContainAny", [])
        ),
        "mustNotContain": all(normalize(value) not in normalized_answer for value in forbidden),
        "answerRegex": all(re.search(pattern, answer) is not None for pattern in turn.get("answerRegex", [])),
        "answerNotRegex": all(re.search(pattern, answer) is None for pattern in forbidden_regex),
        "answerLength": len(answer) <= int(turn.get("maxAnswerChars", suite.get("maxAnswerChars", 2000))),
        "normalizedEquals": not turn.get("normalizedEquals") or normalized_answer == normalize(turn["normalizedEquals"]),
        "evidenceClaimCount": len(claims) >= int(turn.get("minimumEvidenceClaims", 0)),
        "evidenceClaimsInAnswer": all(
            values and all(normalize(value) in normalized_answer for value in values)
            for values in evidence_pattern_values
        ),
        "normalizedEqualsEvidenceClaims": not exact_claim_values or (
            bool(exact_claim_values[0])
            and normalized_answer == normalize("، ".join(exact_claim_values[0]))
        ),
        "jalaliEvidenceDatesInAnswer": all(
            values and all(value in answer for value in values)
            for values in jalali_claim_dates
        ),
        "expectedTools": all(tool in tools for tool in turn.get("expectedTools", [])),
        "forbiddenTools": all(tool not in tools for tool in turn.get("forbiddenTools", [])),
        "traceDetail": all(
            all(normalize(fragment) in normalize(trace_by_tool.get(tool, "")) for fragment in fragments)
            for tool, fragments in turn.get("traceDetailContains", {}).items()
        ),
        "answerValidation": not expected_statuses or normalize(validation_status) in {normalize(value) for value in expected_statuses},
        "conversationRevision": not turn.get("requireConversationRevision")
        or int(context.get("revision") or 0) >= expected_revision,
        "latency": latency_ms <= float(turn.get("maxLatencyMs", suite.get("maxTurnLatencyMs", 120000))),
    }
    issues = [name for name, passed in checks.items() if not passed]
    if error:
        issues.append(error)
    return not issues, checks, list(dict.fromkeys(issues))


def percentile(values: list[float], ratio: float) -> float | None:
    if not values:
        return None
    ordered = sorted(values)
    return round(ordered[min(len(ordered) - 1, max(0, int(len(ordered) * ratio) - 1))], 2)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--suite", default=str(DEFAULT_SUITE))
    parser.add_argument("--base-url", default="http://localhost:8280")
    parser.add_argument("--out", default="artifacts/conversation-evaluation-live.json")
    parser.add_argument("--validate-only", action="store_true")
    parser.add_argument("--flow", action="append", help="Run only the selected flow id")
    parser.add_argument("--timeout", type=float, default=120)
    parser.add_argument("--interval-ms", type=int, default=100)
    parser.add_argument("--rate-limit-retries", type=int, default=2)
    args = parser.parse_args()

    suite_path = Path(args.suite).resolve()
    try:
        suite = json.loads(suite_path.read_text(encoding="utf-8"), object_pairs_hook=reject_duplicate_keys)
    except (OSError, UnicodeDecodeError, json.JSONDecodeError, ValueError) as error:
        output_path = ROOT / args.out
        output_path.parent.mkdir(parents=True, exist_ok=True)
        report = {
            "mode": "structural-preflight" if args.validate_only else "live",
            "generatedAtUtc": dt.datetime.now(dt.timezone.utc).isoformat(),
            "version": (ROOT / "VERSION").read_text(encoding="utf-8").strip(),
            "passed": False,
            "gatePassed": False,
            "issues": [f"suite:invalid_json:{error}"],
        }
        output_path.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
        print(json.dumps(report, ensure_ascii=False, indent=2))
        return 2
    structural_issues = validate_suite(suite)
    selected_flows = set(args.flow or [])
    flows = [flow for flow in suite.get("flows", []) if not selected_flows or flow.get("id") in selected_flows]
    missing_flows = selected_flows - {str(flow.get("id")) for flow in flows}
    structural_issues.extend(f"suite:unknown_flow:{flow}" for flow in sorted(missing_flows))
    total_turns = sum(len(flow.get("turns") or []) for flow in flows)
    version = (ROOT / "VERSION").read_text(encoding="utf-8").strip()
    provenance = {
        "version": version,
        "suiteVersion": suite.get("version"),
        "suiteSha256": manifest_digest(suite_path),
        "flowCount": len(flows),
        "total": total_turns,
    }
    output_path = ROOT / args.out
    output_path.parent.mkdir(parents=True, exist_ok=True)

    if args.validate_only:
        report = {
            "mode": "structural-preflight",
            "generatedAtUtc": dt.datetime.now(dt.timezone.utc).isoformat(),
            **provenance,
            "passed": not structural_issues,
            "issues": structural_issues,
        }
        output_path.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
        print(json.dumps(report, ensure_ascii=False, indent=2))
        return 0 if report["passed"] else 2

    rows: list[dict[str, Any]] = []
    latencies: list[float] = []
    run_id = uuid.uuid4().hex[:12]
    progress = 0
    for flow in flows:
        flow_id = str(flow["id"])
        anonymous_id = f"conversation-eval-{run_id}-{flow_id}"
        conversation_id = f"conversation-eval-{run_id}-{flow_id}"
        for revision, turn in enumerate(flow["turns"], 1):
            progress += 1
            correlation_id = f"conversation-eval-{run_id}-{flow_id}-{turn['id']}"
            output, latency_ms, error, http_status = request_turn(
                args.base_url,
                anonymous_id,
                conversation_id,
                correlation_id,
                str(turn["question"]),
                args.timeout,
                args.rate_limit_retries,
            )
            passed, checks, issues = evaluate_turn(suite, turn, output, error, revision, latency_ms)
            latencies.append(latency_ms)
            row = {
                "id": f"{flow_id}:{turn['id']}",
                "flowId": flow_id,
                "turn": revision,
                "question": turn["question"],
                "passed": passed,
                "checks": checks,
                "issues": issues,
                "actualType": output.get("type"),
                "answer": output.get("answer"),
                "trace": output.get("trace"),
                "conversationRevision": (output.get("conversationContext") or {}).get("revision"),
                "httpStatus": http_status,
                "latencyMs": round(latency_ms, 2),
            }
            rows.append(row)
            print(json.dumps({
                "progress": f"{progress}/{total_turns}",
                "id": row["id"],
                "passed": passed,
                "issues": issues,
            }, ensure_ascii=False), flush=True)
            if args.interval_ms > 0:
                time.sleep(args.interval_ms / 1000)

    passed_count = sum(bool(row["passed"]) for row in rows)
    pass_rate = passed_count / max(1, len(rows))
    minimum_pass_rate = float(suite.get("minimumPassRate", 1.0))
    p95_latency_ms = percentile(latencies, 0.95)
    max_p95_latency_ms = float(suite.get("maxP95LatencyMs", 120000))
    gate_passed = (
        not structural_issues
        and len(rows) == total_turns
        and pass_rate >= minimum_pass_rate
        and p95_latency_ms is not None
        and p95_latency_ms <= max_p95_latency_ms
    )
    report = {
        "mode": "live",
        "generatedAtUtc": dt.datetime.now(dt.timezone.utc).isoformat(),
        "runId": run_id,
        **provenance,
        "passed": passed_count,
        "failed": len(rows) - passed_count,
        "passRate": pass_rate,
        "minimumPassRate": minimum_pass_rate,
        "p50LatencyMs": round(statistics.median(latencies), 2) if latencies else None,
        "p95LatencyMs": p95_latency_ms,
        "maxP95LatencyMs": max_p95_latency_ms,
        "gatePassed": gate_passed,
        "structuralIssues": structural_issues,
        "failureReasons": dict(Counter(issue for row in rows for issue in row["issues"])),
        "failures": [row for row in rows if not row["passed"]],
        "results": rows,
    }
    output_path.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps({key: value for key, value in report.items() if key not in {"results", "failures"}}, ensure_ascii=False, indent=2))
    return 0 if gate_passed else 2


if __name__ == "__main__":
    raise SystemExit(main())
