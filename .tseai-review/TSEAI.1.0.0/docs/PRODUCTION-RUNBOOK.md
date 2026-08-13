# TSEAI 1.0 Production Runbook

## Preconditions

- Keep `.env.production` outside source control and generate independent high-entropy SQL, Redis, RabbitMQ, JWT and OTP secrets.
- Configure an HTTPS SMS endpoint and production API key. Console OTP fallback must remain disabled.
- Use read-only credentials for Market and SQL AI sources.
- Terminate TLS at the trusted ingress/load balancer and forward only validated host/proto headers.
- Keep the AI engine, databases, Redis, RabbitMQ and Qdrant on private networks.
- Provide 20 dedicated production-test user tokens through `TSEAI_PERFORMANCE_BEARER_TOKENS` for the 20-user load gate.

## Static/build gate

Linux: `./scripts/release-gate.sh`  
Windows: `scripts\RELEASE-GATE.cmd`

This performs validators, tests, locked restores, warnings-as-errors build, frontend audit/build, static security analysis and CycloneDX SBOM generation.

The build agent must provide `pip-audit` 2.10.1 or newer as a trusted CI tool (`python -m pip install pip-audit==2.10.1` in the agent image).

## Full production acceptance

Linux: `./scripts/production-e2e.sh`  
Windows: `scripts\production-e2e.cmd`

The workflow builds and starts Compose, waits for readiness, captures runtime state, runs the 320-case live evaluation, load gate, DAST, backup/restore drill, final evidence validation and GA readiness. Evidence older than 24 hours or from another version is rejected.

## Health and observation

- Gateway/platform readiness: `/api/health`
- Platform: `/health/live`, `/health/ready`
- Identity through gateway: `/identity/health/live`, `/identity/health/ready`
- Notification through gateway: `/notifications/health/live`, `/notifications/health/ready`
- Inspect `docker compose ps` and structured logs using `X-Correlation-Id`.
- Production log rotation is bounded to five 10 MB files per service in Compose.

## Backup and recovery

Run `python scripts/backup-restore-drill.py --env-file .env.production`. The drill backs up both application databases with checksum, verifies each backup, restores to isolated generated names, runs `DBCC CHECKDB`, checks ONLINE state, and removes only the generated targets. Store encrypted off-host backups and Qdrant snapshots according to the approved retention policy.

## Rollback

Do not downgrade schemas blindly. Roll back immutable application images only when migration ledgers confirm compatibility. For incompatible schema changes, restore a verified backup according to the approved RPO/RTO procedure.

## Pinned infrastructure

Production Compose pins SQL Server 2022 CU23, Redis 7.4.10 Alpine, RabbitMQ 4.3.4 management Alpine and Qdrant 1.19.0. Upgrade only through the full acceptance workflow.
