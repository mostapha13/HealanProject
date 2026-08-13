# TSEAI 1.0 Operations Runbook
1. Provision approved `.env.production` secrets; never commit them.
2. Run `scripts/release-gate.sh` on a host with Python, .NET SDK, Node/npm and Docker.
3. Run `scripts/production-e2e.sh` and archive `artifacts/evaluation-live.json`, performance results and production acceptance evidence.
4. Execute backup and restore drill using `scripts/backup.sh` and documented restore procedure.
5. Run `python scripts/ga-readiness.py --require-live`.
6. Only when status is `GA_READY`, create immutable `v1.0.0` tag and final ZIP/SHA-256.
Rollback: stop new deployment, restore previous immutable image/tag and database backup; invalidate caches; verify health + smoke before reopening traffic.
