#!/usr/bin/env python3
"""Generate a deterministic CycloneDX SBOM from committed dependency locks."""

import argparse
import datetime as dt
import hashlib
import json
import re
import urllib.parse
import uuid
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser()
parser.add_argument("--out", default="artifacts/sbom.cdx.json")
args = parser.parse_args()
components: dict[str, dict] = {}
lock_hashes: list[dict] = []


def add(kind: str, name: str, version: str, source: str) -> None:
    if not name or not version:
        return
    namespace = {"npm": "npm", "nuget": "nuget", "pypi": "pypi"}[kind]
    encoded = urllib.parse.quote(name, safe="/")
    purl = f"pkg:{namespace}/{encoded}@{urllib.parse.quote(version, safe='')}"
    components[purl] = {
        "type": "library",
        "bom-ref": purl,
        "name": name,
        "version": version,
        "purl": purl,
        "properties": [{"name": "tseai:lock-source", "value": source}],
    }


def digest(path: Path) -> None:
    relative = path.relative_to(ROOT).as_posix()
    lock_hashes.append({
        "name": f"tseai:lock-sha256:{relative}",
        "value": hashlib.sha256(path.read_bytes()).hexdigest(),
    })


npm_lock = ROOT / "Frontend/package-lock.json"
npm = json.loads(npm_lock.read_text(encoding="utf-8"))
for package_path, data in npm.get("packages", {}).items():
    if not package_path.startswith("node_modules/") or not isinstance(data, dict):
        continue
    name = package_path.rsplit("node_modules/", 1)[-1]
    add("npm", name, str(data.get("version", "")), "Frontend/package-lock.json")
digest(npm_lock)

for lock in ROOT.rglob("packages.lock.json"):
    if any(part in {"bin", "obj", ".enterprise-test-venv"} for part in lock.parts):
        continue
    data = json.loads(lock.read_text(encoding="utf-8"))
    for framework in data.get("dependencies", {}).values():
        if not isinstance(framework, dict):
            continue
        for name, dependency in framework.items():
            if isinstance(dependency, dict):
                add("nuget", name, str(dependency.get("resolved", "")), lock.relative_to(ROOT).as_posix())
    digest(lock)

python_lock = ROOT / "AI/tseai-ai/requirements.lock"
for line in python_lock.read_text(encoding="utf-8").splitlines():
    match = re.match(r"^([A-Za-z0-9_.-]+)==([^\s\\]+)", line)
    if match:
        add("pypi", match.group(1), match.group(2), "AI/tseai-ai/requirements.lock")
digest(python_lock)

version = (ROOT / "VERSION").read_text(encoding="utf-8").strip()
document = {
    "bomFormat": "CycloneDX",
    "specVersion": "1.5",
    "serialNumber": f"urn:uuid:{uuid.uuid4()}",
    "version": 1,
    "metadata": {
        "timestamp": dt.datetime.now(dt.timezone.utc).isoformat(),
        "component": {
            "type": "application",
            "bom-ref": f"pkg:generic/tseai@{version}",
            "name": "TSEAI",
            "version": version,
            "purl": f"pkg:generic/tseai@{version}",
        },
        "properties": sorted(lock_hashes, key=lambda item: item["name"]),
    },
    "components": [components[key] for key in sorted(components)],
}
output = ROOT / args.out
output.parent.mkdir(parents=True, exist_ok=True)
rendered = json.dumps(document, indent=2)
output.write_text(rendered, encoding="utf-8")
print(json.dumps({
    "version": version,
    "components": len(components),
    "lockFiles": len(lock_hashes),
    "output": str(output.relative_to(ROOT)),
    "sha256": hashlib.sha256(rendered.encode("utf-8")).hexdigest(),
}, indent=2))
