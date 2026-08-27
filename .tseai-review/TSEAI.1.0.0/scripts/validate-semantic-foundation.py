#!/usr/bin/env python3
"""Fail-closed static gate for the intelligence Sprint-1 foundation."""

from pathlib import Path
import json
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
CATALOG = ROOT / "Backend" / "Platform" / "src" / "TSEAI.Application" / "Data" / "Canonical" / "CanonicalSourceCatalog.cs"
CONTRACTS = ROOT / "Backend" / "Platform" / "src" / "TSEAI.Application" / "Operations" / "OperationsContracts.cs"
API = ROOT / "Backend" / "Platform" / "src" / "TSEAI.Api" / "Program.cs"
MANIFEST = ROOT / "tests" / "table-chat-evaluation-suite.v2.json"
ARTIFACT = ROOT / "artifacts" / "table-chat-suite-preflight.v2.json"

required_sources = {
    "instrument", "cash-market", "order-book", "client-type",
    "company", "company-state", "content", "financial-institution",
}
issues: list[str] = []

for path in (CATALOG, CONTRACTS, API, MANIFEST):
    if not path.is_file():
        issues.append("missing:" + str(path.relative_to(ROOT)))

if not issues:
    catalog_text = CATALOG.read_text(encoding="utf-8")
    for source in sorted(required_sources):
        if f'new("{source}"' not in catalog_text:
            issues.append("catalog_missing_source:" + source)
    if catalog_text.count("Sprint1Audited:true") != len(required_sources):
        issues.append("catalog_audited_count_mismatch")
    if "CanonicalSourceCatalog.Validate()" not in (ROOT / "Backend" / "Platform" / "tests" / "TSEAI.DataQuality.SmokeTests" / "Program.cs").read_text(encoding="utf-8"):
        issues.append("catalog_runtime_validation_missing")

    contracts_text = CONTRACTS.read_text(encoding="utf-8")
    api_text = API.read_text(encoding="utf-8")
    if "ChatExecutionAudit" not in contracts_text or "QuestionHashSha256" not in contracts_text:
        issues.append("structured_chat_audit_contract_missing")
    if "ChatExecutionAudit.HttpContextItemKey" not in api_text or "AuditHash(req.Question)" not in api_text:
        issues.append("chat_audit_capture_missing")
    if "MetadataJson" not in (ROOT / "Backend" / "Platform" / "src" / "TSEAI.Infrastructure" / "Operations" / "SqlOperationsStore.cs").read_text(encoding="utf-8"):
        issues.append("chat_audit_metadata_read_missing")

if not issues:
    command = [
        sys.executable,
        str(ROOT / "scripts" / "evaluate-table-chat-suite.py"),
        "--validate-only",
        "--manifest", str(MANIFEST),
        "--out", str(ARTIFACT.relative_to(ROOT)),
    ]
    completed = subprocess.run(command, cwd=ROOT, check=False)
    if completed.returncode:
        issues.append("table_chat_suite_preflight_failed")

if ARTIFACT.is_file():
    report = json.loads(ARTIFACT.read_text(encoding="utf-8"))
    if int(report.get("caseCount") or 0) < 404:
        issues.append(f"table_chat_case_count:{report.get('caseCount')}")
    if set(report.get("sources") or []) != required_sources:
        issues.append("table_chat_source_coverage_mismatch")

for issue in issues:
    print("FAIL", issue)
if issues:
    raise SystemExit(1)
print("Semantic foundation validation PASS: 8 audited sources, 404 strict cases, persistent privacy-safe chat trace")
