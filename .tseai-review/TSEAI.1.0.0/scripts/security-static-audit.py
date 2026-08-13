#!/usr/bin/env python3
"""Conservative source and deployment security audit used by release gates."""

import argparse
import datetime as dt
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser()
parser.add_argument("--out")
args = parser.parse_args()
issues: list[dict[str, str]] = []


def issue(code: str, path: Path, detail: str) -> None:
    issues.append({"code": code, "path": str(path.relative_to(ROOT)), "detail": detail})


for path in ROOT.rglob("*.cs"):
    if any(part in {"bin", "obj"} for part in path.parts):
        continue
    source = path.read_text(encoding="utf-8", errors="ignore")
    checks = [
        (r"FromSqlRaw\s*\(\s*\$|ExecuteSqlRaw(?:Async)?\s*\(\s*\$", "sql.interpolated_raw", "Interpolated raw SQL"),
        (r"Process\.Start\s*\(|System\.Diagnostics\.Process", "process.execution", "Operating-system process execution"),
        (r"AllowAnyOrigin\s*\(", "cors.allow_any_origin", "Unrestricted CORS origin"),
        (r"UseDeveloperExceptionPage\s*\(", "errors.developer_page", "Developer exception page in product source"),
        (r"ValidateIssuer\s*=\s*false|ValidateAudience\s*=\s*false|ValidateIssuerSigningKey\s*=\s*false", "jwt.validation_disabled", "JWT validation disabled"),
    ]
    for pattern, code, detail in checks:
        if re.search(pattern, source):
            issue(code, path, detail)

for path in (ROOT / "AI" / "tseai-ai" / "app").rglob("*.py"):
    source = path.read_text(encoding="utf-8", errors="ignore")
    if re.search(r"\b(?:os\.system|subprocess\.(?:run|Popen|call)|eval|exec)\s*\(", source):
        issue("python.dangerous_execution", path, "Dynamic code or process execution")

frontend_source = (ROOT / "Frontend" / "src" / "App.jsx").read_text(encoding="utf-8")
if re.search(r"localStorage\.(?:getItem|setItem)\([^)]*(?:access|refresh)[^)]*token", frontend_source, re.IGNORECASE):
    issue("browser.token_persistence", ROOT / "Frontend" / "src" / "App.jsx", "Authentication tokens must not be persisted in localStorage")
identity_api = (ROOT / "Backend" / "Identity" / "src" / "TSEAI.Identity.Api" / "Program.cs").read_text(encoding="utf-8")
for required in ("HttpOnly = true", "SameSite = SameSiteMode.Strict", "X-TSEAI-Web-Client"):
    if required not in identity_api:
        issue("browser.refresh_cookie", ROOT / "Backend" / "Identity" / "src" / "TSEAI.Identity.Api" / "Program.cs", f"Missing secure browser refresh control: {required}")

required_files = [ROOT / "Frontend" / "package-lock.json", ROOT / "AI" / "tseai-ai" / "requirements.lock"]
for path in required_files:
    if not path.is_file():
        issue("supply_chain.lock_missing", path, "Required dependency lock file missing")

dockerignore = ROOT / ".dockerignore"
if not dockerignore.is_file():
    issue("container.dockerignore_missing", dockerignore, "Docker build context exclusions are required")
else:
    dockerignore_source = dockerignore.read_text(encoding="utf-8")
    for secret_pattern in (".env", ".env.*"):
        if secret_pattern not in dockerignore_source:
            issue("container.secret_context", dockerignore, f"Docker context does not exclude {secret_pattern}")

dotnet_docker = ROOT / "docker" / "dotnet-service.Dockerfile"
python_docker = ROOT / "docker" / "python-service.Dockerfile"
web_docker = ROOT / "docker" / "web.Dockerfile"
if "USER app" not in dotnet_docker.read_text(encoding="utf-8"):
    issue("container.root_user", dotnet_docker, "Runtime must use the built-in non-root app user")
if not re.search(r"^USER\s+\d+", python_docker.read_text(encoding="utf-8"), re.MULTILINE):
    issue("container.root_user", python_docker, "Python runtime must use a numeric non-root user")
if "npm ci" not in web_docker.read_text(encoding="utf-8"):
    issue("supply_chain.npm_install", web_docker, "Container build must use npm ci")
python_docker_source = python_docker.read_text(encoding="utf-8")
if "--require-hashes" not in python_docker_source or "requirements.lock" not in python_docker_source:
    issue("supply_chain.pip_hashes", python_docker, "Python container must install the hashed lock file")

compose = ROOT / "docker-compose.production.yml"
compose_source = compose.read_text(encoding="utf-8")
if compose_source.count("no-new-privileges:true") < 9:
    issue("container.no_new_privileges", compose, "Every application-facing service must disable privilege escalation")
if compose_source.count("cap_drop:") < 7:
    issue("container.capabilities", compose, "Non-root application services must drop Linux capabilities")
if compose_source.count("logging: *default-logging") < 14:
    issue("container.log_rotation", compose, "Every production service must use bounded log rotation")

report = {
    "generatedAtUtc": dt.datetime.now(dt.timezone.utc).isoformat(),
    "version": (ROOT / "VERSION").read_text(encoding="utf-8").strip(),
    "issues": issues,
    "passed": not issues,
}
rendered = json.dumps(report, indent=2)
print(rendered)
if args.out:
    output = ROOT / args.out
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(rendered, encoding="utf-8")
sys.exit(1 if issues else 0)
