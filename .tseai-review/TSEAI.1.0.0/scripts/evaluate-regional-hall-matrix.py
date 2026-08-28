#!/usr/bin/env python3
"""Cross-check every regional-hall answer against the live SQL snapshot."""

from __future__ import annotations

import argparse
import datetime as dt
import json
import re
import subprocess
import urllib.request
import uuid
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
CITY_ALIASES = {
    "آذربایجان شرقی (تبریز)": "تبریز",
    "آذربایجان غربی (ارومیه)": "ارومیه",
    "البرز (کرج)": "کرج",
    "چهارمحال و بختیاری": "شهرکرد",
    "خراسان جنوبی (بیرجند)": "بیرجند",
    "خراسان رضوی (مشهد)": "مشهد",
    "خراسان شمالی": "بجنورد",
    "خوزستان (اهواز)": "اهواز",
    "سیستان و بلوچستان (زاهدان)": "زاهدان",
    "فارس (شیراز)": "شیراز",
    "کردستان": "سنندج",
    "کهگیلویه و بویراحمد": "یاسوج",
    "گلستان": "گرگان",
    "گیلان (رشت)": "رشت",
    "لرستان": "خرم آباد",
    "مازندران (ساری)": "ساری",
    "مرکزی": "اراک",
    "هرمزگان (بندرعباس)": "بندرعباس",
}


def sql_rows(container: str, server: str, user: str, password: str, database: str) -> list[dict[str, object]]:
    query = """
SET NOCOUNT ON;
SELECT CONVERT(nvarchar(36),t.Id),REPLACE(t.Talar_Name,N'|',N' '),CONVERT(nvarchar(30),t.Talar_Code),
       (SELECT COUNT_BIG(*) FROM dbo.Company c WHERE c.Talar_Id=t.Id),
       (SELECT COUNT_BIG(*) FROM dbo.Nahad_Mali n WHERE n.Talar_Id=t.Id),
       (SELECT COUNT_BIG(*) FROM (
          SELECT n.Nahad_Mali_Type_Id,n.Title FROM dbo.Nahad_Mali n
          WHERE n.Talar_Id=t.Id GROUP BY n.Nahad_Mali_Type_Id,n.Title
        ) d)
FROM dbo.Talar t ORDER BY t.Talar_Name;
"""
    command = [
        "docker", "exec", container, "/opt/mssql-tools18/bin/sqlcmd", "-C",
        "-S", server, "-U", user, "-P", password, "-d", database,
        "-h", "-1", "-W", "-s", "|", "-Q", query,
    ]
    completed = subprocess.run(command, check=True, capture_output=True, text=True, encoding="utf-8")
    rows: list[dict[str, object]] = []
    for line in completed.stdout.splitlines():
        parts = [part.strip() for part in line.split("|")]
        if len(parts) != 6:
            continue
        rows.append({
            "id": parts[0], "name": parts[1], "code": parts[2],
            "companyCount": int(parts[3]), "institutionRows": int(parts[4]),
            "institutionDistinct": int(parts[5]),
        })
    if not rows:
        raise RuntimeError("SQL returned no regional halls")
    return rows


def ask(base_url: str, question: str, index: int) -> dict[str, object]:
    run_id = uuid.uuid4().hex
    request = urllib.request.Request(
        base_url.rstrip("/") + "/api/chat/ask",
        data=json.dumps({"question": question, "conversationId": f"hall-matrix-{run_id}"}, ensure_ascii=False).encode("utf-8"),
        headers={
            "Content-Type": "application/json; charset=utf-8",
            "X-Anonymous-Id": f"hall-matrix-{run_id}",
            "X-Correlation-Id": f"hall-matrix-{index}-{run_id}",
        },
        method="POST",
    )
    with urllib.request.urlopen(request, timeout=30) as response:
        return json.loads(response.read().decode("utf-8"))


def contains_number(answer: str, value: int, following: str) -> bool:
    formatted = f"{value:,}"
    return re.search(rf"(?<!\d){re.escape(formatted)}\s+{re.escape(following)}", answer) is not None


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--base-url", default="http://localhost:8280")
    parser.add_argument("--container", default="tseai-rc31-sqlserver")
    parser.add_argument("--sql-server", default="host.docker.internal,14330")
    parser.add_argument("--sql-user", required=True)
    parser.add_argument("--sql-password", required=True)
    parser.add_argument("--database", default="AI")
    parser.add_argument("--out", default=str(ROOT / "artifacts" / "regional-hall-matrix-live.json"))
    args = parser.parse_args()

    halls = sql_rows(args.container, args.sql_server, args.sql_user, args.sql_password, args.database)
    assertions: list[dict[str, object]] = []
    index = 0

    def check(hall: dict[str, object], dimension: str, question: str, predicate) -> None:
        nonlocal index
        index += 1
        try:
            response = ask(args.base_url, question, index)
            answer = str(response.get("answer") or "")
            issues = []
            if response.get("type") != "structured_reference":
                issues.append(f"unexpected_type:{response.get('type')}")
            if not predicate(answer):
                issues.append("answer_mismatch")
            assertions.append({
                "hall": hall["name"], "dimension": dimension, "question": question,
                "passed": not issues, "issues": issues, "answer": answer,
            })
        except Exception as error:
            assertions.append({
                "hall": hall["name"], "dimension": dimension, "question": question,
                "passed": False, "issues": [f"{type(error).__name__}:{error}"], "answer": "",
            })

    for hall in halls:
        name = str(hall["name"])
        check(hall, "company_count", f"تعداد شرکت‌های تالار {name} چقدر است؟",
              lambda answer, hall=hall: contains_number(answer, int(hall["companyCount"]), "شرکت"))
        check(hall, "institution_count", f"تعداد نهادهای مالی تالار {name} چقدر است؟",
              lambda answer, hall=hall: contains_number(answer, int(hall["institutionRows"]), "رکورد نهاد مالی")
              and contains_number(answer, int(hall["institutionDistinct"]), "نام متمایز"))
        check(hall, "hall_code", f"کد تالار {name} چیست؟",
              lambda answer, hall=hall: re.search(rf"\bکد\s+{re.escape(str(hall['code']))}\b", answer) is not None)

    by_name = {str(hall["name"]): hall for hall in halls}
    for name, alias in CITY_ALIASES.items():
        hall = by_name[name]
        check(hall, "city_alias", f"کد تالار {alias} چیست؟",
              lambda answer, hall=hall: re.search(rf"\bکد\s+{re.escape(str(hall['code']))}\b", answer) is not None)

    passed = sum(bool(item["passed"]) for item in assertions)
    report = {
        "generatedAtUtc": dt.datetime.now(dt.timezone.utc).isoformat(),
        "hallCount": len(halls), "cityAliasCount": len(CITY_ALIASES),
        "total": len(assertions), "passed": passed, "failed": len(assertions) - passed,
        "gatePassed": passed == len(assertions),
        "failures": [item for item in assertions if not item["passed"]],
        "results": assertions,
    }
    output = Path(args.out)
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps({key: value for key, value in report.items() if key != "results"}, ensure_ascii=False, indent=2))
    return 0 if report["gatePassed"] else 2


if __name__ == "__main__":
    raise SystemExit(main())
