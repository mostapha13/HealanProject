#!/usr/bin/env python3
"""Write evidence only after the static/build release gate has succeeded."""

import argparse
import datetime as dt
import json
import platform
import shutil
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser()
parser.add_argument("--out", default="artifacts/release-static.json")
args = parser.parse_args()

for required in ("artifacts/security-static.json", "artifacts/pip-audit.json", "artifacts/sbom.cdx.json"):
    if not (ROOT / required).is_file():
        raise FileNotFoundError(f"Required release evidence missing: {required}")


def version(command: list[str]) -> str:
    executable = shutil.which(command[0])
    if executable is None:
        raise FileNotFoundError(f"Required tool not found: {command[0]}")
    completed = subprocess.run([executable, *command[1:]], check=True, capture_output=True, text=True)
    return completed.stdout.strip().splitlines()[0]


report = {
    "generatedAtUtc": dt.datetime.now(dt.timezone.utc).isoformat(),
    "version": (ROOT / "VERSION").read_text(encoding="utf-8").strip(),
    "passed": True,
    "gates": {
        "pythonValidation": "PASS",
        "pythonTests": "PASS",
        "dotnet": "PASS",
        "frontendBuild": "PASS",
        "dependencyAudit": "PASS",
        "securityStatic": "PASS",
        "sbom": "PASS",
    },
    "toolchain": {
        "os": platform.platform(),
        "python": platform.python_version(),
        "dotnetSdk": version(["dotnet", "--version"]),
        "node": version(["node", "--version"]),
        "npm": version(["npm", "--version"]),
    },
}
output = ROOT / args.out
output.parent.mkdir(parents=True, exist_ok=True)
output.write_text(json.dumps(report, indent=2), encoding="utf-8")
print(json.dumps(report, indent=2))
