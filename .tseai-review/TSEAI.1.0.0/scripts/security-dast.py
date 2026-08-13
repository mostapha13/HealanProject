#!/usr/bin/env python3
"""Black-box security checks against a running production gateway."""

import argparse
import datetime as dt
import json
import urllib.error
import urllib.request
import uuid
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CORPUS = json.loads((ROOT / "tests/security-adversarial.v1.json").read_text(encoding="utf-8"))["cases"]

parser = argparse.ArgumentParser()
parser.add_argument("--base-url", required=True)
parser.add_argument("--out", default="artifacts/security-live.json")
args = parser.parse_args()
base = args.base_url.rstrip("/")
results: list[dict] = []


def request(name: str, path: str, expected: set[int], body: dict | None = None, headers: dict | None = None, validate=None):
    payload = None if body is None else json.dumps(body, ensure_ascii=False).encode("utf-8")
    merged = {"Accept": "application/json", **(headers or {})}
    if payload is not None:
        merged["Content-Type"] = "application/json"
    req = urllib.request.Request(base + path, data=payload, headers=merged, method="POST" if payload is not None else "GET")
    status = None
    response_headers = None
    parsed = {}
    error = None
    try:
        with urllib.request.urlopen(req, timeout=20) as response:
            status = response.status
            response_headers = response.headers
            raw = response.read().decode("utf-8", errors="replace")
    except urllib.error.HTTPError as ex:
        status = ex.code
        response_headers = ex.headers
        raw = ex.read().decode("utf-8", errors="replace")
    except Exception as ex:
        raw = ""
        error = str(ex)
    try:
        parsed = json.loads(raw) if raw else {}
    except json.JSONDecodeError:
        parsed = {}
    valid = status in expected and error is None
    if valid and validate is not None:
        valid, detail = validate(parsed, response_headers)
        if not valid:
            error = detail
    results.append({"name": name, "status": status, "passed": valid, "error": error})


def security_headers(_, headers):
    required = {
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "DENY",
        "Referrer-Policy": "no-referrer",
    }
    missing = [f"{key}={value}" for key, value in required.items() if headers is None or headers.get(key) != value]
    return (not missing, "missing security headers: " + ", ".join(missing))


request("security headers", "/api/health", {200}, validate=security_headers)
for path in [
    "/api/admin/performance",
    "/api/admin/settings",
    "/api/admin/operations/overview",
    "/api/admin/semantic-registry",
]:
    request(f"anonymous denied {path}", path, {401, 403})

request(
    "invalid JWT denied",
    "/api/admin/performance",
    {401},
    headers={"Authorization": "Bearer invalid.invalid.invalid"},
)
request(
    "oversized question rejected",
    "/api/chat/ask",
    {400, 413},
    body={"question": "الف" * 4001, "conversationId": "dast-oversized"},
    headers={"X-Anonymous-Id": f"dast-{uuid.uuid4().hex}"},
)

for case in CORPUS:
    expected_block = case["expected"] == "block"

    def validate_adversarial(payload, _, expected_block=expected_block):
        code = str(payload.get("code", ""))
        if expected_block:
            ok = code.startswith("unsafe_") or code in {"unsafe_request", "agentic_security_rejected", "prompt_or_tool_injection_detected"}
            return ok, f"unsafe request was not rejected by the security guard; code={code!r}"
        return True, ""

    request(
        f"adversarial {case['id']}",
        "/api/chat/ask",
        {400} if expected_block else {200},
        body={"question": case["input"], "conversationId": f"dast-{case['id']}"},
        headers={"X-Anonymous-Id": f"dast-{uuid.uuid4().hex}"},
        validate=validate_adversarial,
    )

passed = all(result["passed"] for result in results)
report = {
    "generatedAtUtc": dt.datetime.now(dt.timezone.utc).isoformat(),
    "version": (ROOT / "VERSION").read_text(encoding="utf-8").strip(),
    "baseUrl": base,
    "passed": passed,
    "total": len(results),
    "results": results,
}
output = ROOT / args.out
output.parent.mkdir(parents=True, exist_ok=True)
output.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
print(json.dumps(report, ensure_ascii=False, indent=2))
raise SystemExit(0 if passed else 2)
