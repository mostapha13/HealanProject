#!/usr/bin/env python3
"""Capture fail-closed Docker Compose runtime readiness evidence."""

import argparse
import datetime as dt
import json
import subprocess
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
RUNNING_SERVICES = {
    "gateway", "web", "tseai-api", "identity-api", "market-runtime",
    "alert-engine", "notification-api", "knowledge-worker", "ai-engine",
    "sqlserver", "redis", "rabbitmq", "qdrant", "local-llm", "local-embedding",
}
HEALTHY_SERVICES = {
    "gateway", "web", "tseai-api", "identity-api", "notification-api", "ai-engine",
    "sqlserver", "redis", "rabbitmq", "qdrant", "local-llm", "local-embedding",
}

parser = argparse.ArgumentParser()
parser.add_argument("--base-url", required=True)
parser.add_argument("--env-file", default=".env.production")
parser.add_argument("--out", default="artifacts/runtime-live.json")
args = parser.parse_args()

command = [
    "docker", "compose", "-f", "docker-compose.production.yml",
    "--env-file", args.env_file, "ps", "--all", "--format", "json",
]
completed = subprocess.run(command, cwd=ROOT, check=True, capture_output=True, text=True)
raw = completed.stdout.strip()
try:
    parsed = json.loads(raw) if raw else []
    rows = parsed if isinstance(parsed, list) else [parsed]
except json.JSONDecodeError:
    rows = [json.loads(line) for line in raw.splitlines() if line.strip()]

by_service = {str(row.get("Service", "")): row for row in rows if isinstance(row, dict)}
issues: list[str] = []
for service in sorted(RUNNING_SERVICES):
    row = by_service.get(service)
    if row is None:
        issues.append(f"service_missing:{service}")
        continue
    if str(row.get("State", "")).lower() != "running":
        issues.append(f"service_not_running:{service}:{row.get('State', '')}")
for service in sorted(HEALTHY_SERVICES):
    health = str(by_service.get(service, {}).get("Health", "")).lower()
    if health != "healthy":
        issues.append(f"service_not_healthy:{service}:{health or 'unknown'}")

endpoints = ["/api/health", "/identity/health/ready", "/notifications/health/ready"]
endpoint_results = []
for path in endpoints:
    status = None
    error = None
    try:
        with urllib.request.urlopen(args.base_url.rstrip("/") + path, timeout=10) as response:
            status = response.status
            response.read()
    except urllib.error.HTTPError as ex:
        status = ex.code
        error = f"HTTP {ex.code}"
    except Exception as ex:
        error = str(ex)
    passed = status == 200
    if not passed:
        issues.append(f"endpoint_not_ready:{path}:{error or status}")
    endpoint_results.append({"path": path, "status": status, "passed": passed, "error": error})

report = {
    "generatedAtUtc": dt.datetime.now(dt.timezone.utc).isoformat(),
    "version": (ROOT / "VERSION").read_text(encoding="utf-8").strip(),
    "passed": not issues,
    "issues": issues,
    "endpoints": endpoint_results,
    "services": [
        {"service": name, "state": row.get("State"), "health": row.get("Health")}
        for name, row in sorted(by_service.items())
    ],
}
output = ROOT / args.out
output.parent.mkdir(parents=True, exist_ok=True)
output.write_text(json.dumps(report, indent=2), encoding="utf-8")
print(json.dumps(report, indent=2))
raise SystemExit(0 if report["passed"] else 2)
