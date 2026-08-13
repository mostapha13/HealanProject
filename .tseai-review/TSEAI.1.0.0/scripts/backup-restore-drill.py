#!/usr/bin/env python3
"""Back up and restore TSEAI databases into isolated drill databases."""

import argparse
import datetime as dt
import json
import os
import re
import subprocess
import sys
import uuid
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATABASES = ("TSEAI_App", "TSEAI_Identity")
SAFE_NAME = re.compile(r"^[A-Za-z0-9_]+$")

parser = argparse.ArgumentParser()
parser.add_argument("--container", default="tseai-sqlserver")
parser.add_argument("--env-file", default=".env.production")
parser.add_argument("--out", default="artifacts/backup-restore-live.json")
parser.add_argument("--retain-backups", action="store_true")
args = parser.parse_args()
password = os.getenv("MSSQL_SA_PASSWORD")
if not password:
    env_path = ROOT / args.env_file
    if env_path.is_file():
        for raw_line in env_path.read_text(encoding="utf-8-sig").splitlines():
            line = raw_line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, value = line.split("=", 1)
            if key.strip() == "MSSQL_SA_PASSWORD":
                password = value.strip().strip('"').strip("'")
                break
if not password:
    print("MSSQL_SA_PASSWORD is required in the environment or selected env file.", file=sys.stderr)
    raise SystemExit(3)

run_id = dt.datetime.now(dt.timezone.utc).strftime("%Y%m%dT%H%M%SZ") + "_" + uuid.uuid4().hex[:8]
results: list[dict] = []


def sql(query: str, *, capture: bool = False) -> str:
    command = [
        "docker", "exec", "-e", f"SQLCMDPASSWORD={password}", args.container,
        "/opt/mssql-tools18/bin/sqlcmd", "-C", "-S", "localhost", "-U", "sa",
        "-b", "-V", "16", "-h", "-1", "-W", "-s", "|", "-Q", query,
    ]
    completed = subprocess.run(command, check=True, text=True, capture_output=capture)
    return completed.stdout if capture else ""


def literal(value: str) -> str:
    return "N'" + value.replace("'", "''") + "'"


for database in DATABASES:
    if not SAFE_NAME.fullmatch(database):
        raise SystemExit(f"Unsafe database name: {database}")
    target = f"{database}_RestoreDrill_{run_id}"
    backup_path = f"/var/opt/mssql/backup/{database}_{run_id}.bak"
    restored = False
    try:
        sql(f"BACKUP DATABASE [{database}] TO DISK={literal(backup_path)} WITH COPY_ONLY, COMPRESSION, CHECKSUM, INIT;")
        sql(f"RESTORE VERIFYONLY FROM DISK={literal(backup_path)} WITH CHECKSUM;")
        raw_files = sql(
            f"SET NOCOUNT ON; SELECT name,type_desc FROM sys.master_files WHERE database_id=DB_ID({literal(database)}) ORDER BY file_id;",
            capture=True,
        )
        files = []
        for line in raw_files.splitlines():
            if "|" not in line:
                continue
            logical, kind = (part.strip() for part in line.split("|", 1))
            if logical and kind in {"ROWS", "LOG"}:
                files.append((logical, kind))
        if not files or not any(kind == "LOG" for _, kind in files) or not any(kind == "ROWS" for _, kind in files):
            raise RuntimeError(f"Could not discover logical files for {database}")
        moves = []
        data_index = 0
        for logical, kind in files:
            if kind == "LOG":
                destination = f"/var/opt/mssql/data/{target}_log.ldf"
            else:
                suffix = ".mdf" if data_index == 0 else f"_{data_index}.ndf"
                destination = f"/var/opt/mssql/data/{target}{suffix}"
                data_index += 1
            moves.append(f"MOVE {literal(logical)} TO {literal(destination)}")
        sql(f"RESTORE DATABASE [{target}] FROM DISK={literal(backup_path)} WITH CHECKSUM, RECOVERY, REPLACE, {', '.join(moves)};")
        restored = True
        sql(f"DBCC CHECKDB ([{target}]) WITH NO_INFOMSGS, ALL_ERRORMSGS;")
        online = sql(f"SET NOCOUNT ON; SELECT state_desc FROM sys.databases WHERE name={literal(target)};", capture=True).strip()
        if "ONLINE" not in online:
            raise RuntimeError(f"Restored database is not ONLINE: {online}")
        results.append({"database": database, "target": target, "backup": backup_path, "passed": True})
    except Exception as exc:
        results.append({"database": database, "target": target, "backup": backup_path, "passed": False, "error": str(exc)})
    finally:
        if restored:
            try:
                sql(f"ALTER DATABASE [{target}] SET SINGLE_USER WITH ROLLBACK IMMEDIATE; DROP DATABASE [{target}];")
            except Exception as exc:
                results.append({"database": database, "cleanup": target, "passed": False, "error": str(exc)})
        if not args.retain_backups:
            subprocess.run(["docker", "exec", args.container, "rm", "-f", "--", backup_path], check=False)

passed = len(results) == len(DATABASES) and all(result.get("passed") for result in results)
report = {
    "generatedAtUtc": dt.datetime.now(dt.timezone.utc).isoformat(),
    "version": (ROOT / "VERSION").read_text(encoding="utf-8").strip(),
    "runId": run_id,
    "passed": passed,
    "results": results,
}
output = ROOT / args.out
output.parent.mkdir(parents=True, exist_ok=True)
output.write_text(json.dumps(report, indent=2), encoding="utf-8")
print(json.dumps(report, indent=2))
raise SystemExit(0 if passed else 2)
