#!/usr/bin/env python3
"""Fail-closed GA readiness gate.

This gate validates evidence produced by a live production acceptance run.  Merely
changing a status field to PASS is insufficient: version, dataset digest, required
sub-gates and evidence freshness must all agree.
"""

import argparse
import datetime as dt
import hashlib
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
REQUIRED_STATIC = [
    "VERSION",
    "README.md",
    "Frontend/package-lock.json",
    "AI/tseai-ai/requirements.lock",
    "docs/PRODUCTION-ACCEPTANCE-CHECKLIST.md",
    "scripts/release-gate.sh",
    "scripts/RELEASE-GATE.cmd",
    "scripts/production-e2e.sh",
    "scripts/production-e2e.cmd",
    "scripts/generate-sbom.py",
]
REQUIRED_LIVE_GATES = [
    "dotnet",
    "frontendBuild",
    "docker",
    "liveGoldenEvaluation",
    "loadTest",
    "securityDAST",
    "backupRestoreDrill",
]


def load_json(path: Path, blockers: list[str], code: str) -> dict:
    if not path.is_file():
        blockers.append(f"{code}_missing")
        return {}
    try:
        value = json.loads(path.read_text(encoding="utf-8"))
        if not isinstance(value, dict):
            raise ValueError("root must be an object")
        return value
    except (OSError, ValueError, json.JSONDecodeError):
        blockers.append(f"{code}_invalid")
        return {}


def parse_utc(value: object) -> dt.datetime | None:
    if not isinstance(value, str) or not value.strip():
        return None
    try:
        parsed = dt.datetime.fromisoformat(value.replace("Z", "+00:00"))
        return parsed.astimezone(dt.timezone.utc) if parsed.tzinfo else parsed.replace(tzinfo=dt.timezone.utc)
    except ValueError:
        return None


def fresh(report: dict, max_age: dt.timedelta) -> bool:
    generated = parse_utc(report.get("generatedAtUtc"))
    if generated is None:
        return False
    age = dt.datetime.now(dt.timezone.utc) - generated
    return dt.timedelta(0) <= age <= max_age


parser = argparse.ArgumentParser()
parser.add_argument("--require-live", action="store_true")
parser.add_argument("--max-age-hours", type=float, default=24.0)
args = parser.parse_args()

blockers: list[str] = []
version = (ROOT / "VERSION").read_text(encoding="utf-8").strip() if (ROOT / "VERSION").is_file() else ""
missing_static = [path for path in REQUIRED_STATIC if not (ROOT / path).is_file()]
blockers.extend(f"static_missing:{path}" for path in missing_static)

prod = load_json(ROOT / "artifacts/production-acceptance.json", blockers, "production_acceptance")
evaluation = load_json(ROOT / "artifacts/evaluation-live.json", blockers, "live_ai_evaluation")

if prod.get("status") != "PASS":
    blockers.append("production_e2e_not_passed")
if prod.get("version") != version:
    blockers.append("production_version_mismatch")

gates = prod.get("gates") if isinstance(prod.get("gates"), dict) else {}
for gate in REQUIRED_LIVE_GATES:
    if gates.get(gate) != "PASS":
        blockers.append(f"production_gate_not_passed:{gate}")

dataset_path = ROOT / "tests/golden-question-dataset.v1.json"
dataset_bytes = dataset_path.read_bytes() if dataset_path.is_file() else b""
dataset_sha = hashlib.sha256(dataset_bytes).hexdigest()
try:
    expected_total = len(json.loads(dataset_bytes.decode("utf-8")).get("cases", []))
except (UnicodeDecodeError, json.JSONDecodeError, AttributeError):
    expected_total = 0
    blockers.append("golden_dataset_invalid")

if evaluation.get("mode") != "live" or evaluation.get("gatePassed") is not True:
    blockers.append("live_ai_evaluation_not_passed")
if evaluation.get("version") != version:
    blockers.append("evaluation_version_mismatch")
if evaluation.get("datasetSha256") != dataset_sha:
    blockers.append("evaluation_dataset_mismatch")
if evaluation.get("total") != expected_total or expected_total < 300:
    blockers.append("evaluation_case_count_mismatch")

max_age = dt.timedelta(hours=max(0.1, args.max_age_hours))
if not fresh(prod, max_age):
    blockers.append("production_evidence_stale_or_undated")
if not fresh(evaluation, max_age):
    blockers.append("evaluation_evidence_stale_or_undated")

blockers = list(dict.fromkeys(blockers))
status = "GA_READY" if not blockers else "GA_BLOCKED"
report = {
    "status": status,
    "version": version,
    "generatedAtUtc": dt.datetime.now(dt.timezone.utc).isoformat(),
    "staticReady": not missing_static,
    "productionAcceptance": prod.get("status", "NOT_RUN"),
    "evaluationGate": evaluation.get("gatePassed") is True,
    "expectedGoldenCases": expected_total,
    "blockingReasons": blockers,
}
(ROOT / "artifacts").mkdir(exist_ok=True)
(ROOT / "artifacts/ga-readiness.json").write_text(json.dumps(report, indent=2), encoding="utf-8")
print(json.dumps(report, indent=2))
sys.exit(0 if status == "GA_READY" or not args.require_live else 4)
