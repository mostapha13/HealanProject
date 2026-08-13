#!/usr/bin/env python3
"""Discover and execute every console-based .NET smoke test."""

import argparse
import subprocess
import sys
import xml.etree.ElementTree as et
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TEST_ROOT = ROOT / "Backend" / "Platform" / "tests"

parser = argparse.ArgumentParser()
parser.add_argument("--configuration", default="Release")
parser.add_argument("--no-build", action="store_true")
args = parser.parse_args()

projects: list[Path] = []
for project in sorted(TEST_ROOT.rglob("*.csproj")):
    try:
        output_types = [node.text for node in et.parse(project).getroot().iter("OutputType")]
    except (OSError, et.ParseError) as exc:
        print(f"Invalid project file {project}: {exc}", file=sys.stderr)
        raise SystemExit(2)
    if any((value or "").lower() == "exe" for value in output_types):
        projects.append(project)

if not projects:
    print("No console smoke-test projects discovered.", file=sys.stderr)
    raise SystemExit(2)

failed: list[str] = []
for project in projects:
    relative = project.relative_to(ROOT)
    print(f"\n=== SMOKE {relative} ===", flush=True)
    command = ["dotnet", "run", "--project", str(project), "-c", args.configuration]
    if args.no_build:
        command.append("--no-build")
    result = subprocess.run(command, cwd=ROOT, check=False)
    if result.returncode:
        failed.append(str(relative))

print(f"\nSmoke tests: {len(projects) - len(failed)}/{len(projects)} passed")
if failed:
    print("Failed projects:", *failed, sep="\n- ", file=sys.stderr)
    raise SystemExit(1)
