#!/usr/bin/env python3
"""Validate all production evidence and emit one fail-closed acceptance report."""

import argparse
import datetime as dt
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
REPORTS = {
    "static": "artifacts/release-static.json",
    "runtime": "artifacts/runtime-live.json",
    "evaluation": "artifacts/evaluation-live.json",
    "conversationEvaluation": "artifacts/conversation-evaluation-live.json",
    "performance": "artifacts/performance-live.json",
    "security": "artifacts/security-live.json",
    "securityStatic": "artifacts/security-static.json",
    "backupRestore": "artifacts/backup-restore-live.json",
}

parser = argparse.ArgumentParser()
parser.add_argument("--max-age-hours", type=float, default=24.0)
parser.add_argument("--out", default="artifacts/production-acceptance.json")
args = parser.parse_args()
version = (ROOT / "VERSION").read_text(encoding="utf-8").strip()
now = dt.datetime.now(dt.timezone.utc)
max_age = dt.timedelta(hours=max(0.1, args.max_age_hours))
blockers: list[str] = []
reports: dict[str, dict] = {}
evidence: dict[str, dict] = {}


def parse_utc(value: object) -> dt.datetime | None:
    if not isinstance(value, str):
        return None
    try:
        parsed = dt.datetime.fromisoformat(value.replace("Z", "+00:00"))
        return parsed.astimezone(dt.timezone.utc) if parsed.tzinfo else parsed.replace(tzinfo=dt.timezone.utc)
    except ValueError:
        return None


for name, relative in REPORTS.items():
    path = ROOT / relative
    if not path.is_file():
        blockers.append(f"evidence_missing:{name}")
        reports[name] = {}
        continue
    raw = path.read_bytes()
    evidence[name] = {"path": relative, "sha256": hashlib.sha256(raw).hexdigest()}
    try:
        report = json.loads(raw.decode("utf-8"))
        if not isinstance(report, dict):
            raise ValueError("root is not an object")
    except (UnicodeDecodeError, json.JSONDecodeError, ValueError):
        blockers.append(f"evidence_invalid:{name}")
        reports[name] = {}
        continue
    reports[name] = report
    if report.get("version") != version:
        blockers.append(f"evidence_version_mismatch:{name}")
    generated = parse_utc(report.get("generatedAtUtc"))
    if generated is None or not dt.timedelta(0) <= now - generated <= max_age:
        blockers.append(f"evidence_stale_or_undated:{name}")

sbom_path = ROOT / "artifacts/sbom.cdx.json"
if not sbom_path.is_file():
    blockers.append("evidence_missing:sbom")
else:
    sbom_raw = sbom_path.read_bytes()
    evidence["sbom"] = {"path": "artifacts/sbom.cdx.json", "sha256": hashlib.sha256(sbom_raw).hexdigest()}
    try:
        sbom = json.loads(sbom_raw.decode("utf-8"))
        sbom_version = sbom.get("metadata", {}).get("component", {}).get("version")
        if sbom.get("bomFormat") != "CycloneDX" or sbom_version != version:
            blockers.append("sbom_version_or_format_mismatch")
        if len(sbom.get("components", [])) < 40:
            blockers.append("sbom_component_coverage_insufficient")
    except (UnicodeDecodeError, json.JSONDecodeError, AttributeError):
        blockers.append("evidence_invalid:sbom")

for name in ("static", "runtime", "performance", "security", "securityStatic", "backupRestore"):
    if reports[name].get("passed") is not True:
        blockers.append(f"gate_not_passed:{name}")

static_gates = reports["static"].get("gates", {})
for name in ("dotnet", "frontendBuild", "dependencyAudit", "securityStatic"):
    if static_gates.get(name) != "PASS":
        blockers.append(f"static_gate_not_passed:{name}")

evaluation = reports["evaluation"]
if evaluation.get("mode") != "live" or evaluation.get("gatePassed") is not True:
    blockers.append("gate_not_passed:evaluation")
dataset = ROOT / "tests/golden-question-dataset.v1.json"
dataset_bytes = dataset.read_bytes() if dataset.is_file() else b""
try:
    expected_cases = len(json.loads(dataset_bytes.decode("utf-8"))["cases"])
except (UnicodeDecodeError, json.JSONDecodeError, KeyError, TypeError):
    expected_cases = 0
    blockers.append("golden_dataset_invalid")
if expected_cases < 300 or evaluation.get("total") != expected_cases:
    blockers.append("golden_case_count_mismatch")
if evaluation.get("datasetSha256") != hashlib.sha256(dataset_bytes).hexdigest():
    blockers.append("golden_dataset_digest_mismatch")

conversation_evaluation = reports["conversationEvaluation"]
if conversation_evaluation.get("mode") != "live" or conversation_evaluation.get("gatePassed") is not True:
    blockers.append("gate_not_passed:conversationEvaluation")
conversation_suite = ROOT / "tests/conversation-golden-suite.v1.json"
conversation_suite_bytes = conversation_suite.read_bytes() if conversation_suite.is_file() else b""
try:
    expected_conversation_turns = sum(
        len(flow.get("turns", []))
        for flow in json.loads(conversation_suite_bytes.decode("utf-8")).get("flows", [])
    )
except (UnicodeDecodeError, json.JSONDecodeError, AttributeError):
    expected_conversation_turns = 0
    blockers.append("conversation_golden_suite_invalid")
if expected_conversation_turns < 10 or conversation_evaluation.get("total") != expected_conversation_turns:
    blockers.append("conversation_golden_turn_count_mismatch")
if conversation_evaluation.get("suiteSha256") != hashlib.sha256(conversation_suite_bytes).hexdigest():
    blockers.append("conversation_golden_suite_digest_mismatch")

performance = reports["performance"]
if performance.get("requests", 0) < 200 or performance.get("concurrency", 0) < 20:
    blockers.append("load_volume_below_minimum")
if performance.get("errors") != 0:
    blockers.append("load_errors_present")

security = reports["security"]
if security.get("total", 0) < 10 or not isinstance(security.get("results"), list):
    blockers.append("security_dast_coverage_insufficient")

backup = reports["backupRestore"]
backup_rows = backup.get("results") if isinstance(backup.get("results"), list) else []
passed_databases = {row.get("database") for row in backup_rows if row.get("passed") is True}
if passed_databases != {"TSEAI_App", "TSEAI_Identity"}:
    blockers.append("backup_restore_database_coverage_mismatch")

runtime_services = reports["runtime"].get("services")
if not isinstance(runtime_services, list) or len(runtime_services) < 13:
    blockers.append("runtime_service_coverage_insufficient")

blockers = list(dict.fromkeys(blockers))
gates = {
    "dotnet": "PASS" if static_gates.get("dotnet") == "PASS" else "FAIL",
    "frontendBuild": "PASS" if static_gates.get("frontendBuild") == "PASS" else "FAIL",
    "docker": "PASS" if reports["runtime"].get("passed") is True else "FAIL",
    "liveGoldenEvaluation": "PASS" if evaluation.get("gatePassed") is True else "FAIL",
    "liveConversationEvaluation": "PASS" if conversation_evaluation.get("gatePassed") is True else "FAIL",
    "loadTest": "PASS" if performance.get("passed") is True else "FAIL",
    "securityDAST": "PASS" if security.get("passed") is True else "FAIL",
    "backupRestoreDrill": "PASS" if backup.get("passed") is True else "FAIL",
}
result = {
    "generatedAtUtc": now.isoformat(),
    "version": version,
    "status": "PASS" if not blockers else "FAIL",
    "gates": gates,
    "evidence": evidence,
    "blockingReasons": blockers,
}
output = ROOT / args.out
output.parent.mkdir(parents=True, exist_ok=True)
output.write_text(json.dumps(result, indent=2), encoding="utf-8")
print(json.dumps(result, indent=2))
raise SystemExit(0 if not blockers else 2)
