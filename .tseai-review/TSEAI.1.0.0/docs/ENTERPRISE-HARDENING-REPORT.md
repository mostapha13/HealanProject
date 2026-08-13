# Enterprise Hardening Report — 1.0.0-rc.31

## Implemented

- Repaired the full .NET build and critical temporal/filter defects; warnings are release-blocking.
- Added automatic discovery/execution for every console smoke project.
- Added npm/NuGet locks, hashed Python lock, vulnerability gates and CycloneDX SBOM.
- Removed the vulnerable FastAPI/Starlette dependency chain and moved the bounded AI JSON API to patched Starlette with explicit methods and trusted hosts.
- Replaced browser token persistence with in-memory access tokens and HttpOnly/SameSite refresh cookies.
- Added transactional refresh-token rotation, token families, replay-family revocation, logout and schema migration.
- Added dependency-aware readiness for Platform, Identity and Notification.
- Added safe error responses, correlation IDs, chat audit telemetry, incident aggregation and real operations counters.
- Hardened Docker context, non-root/read-only containers, capabilities, privilege escalation, health probes and bounded log rotation.
- Added live Golden, load, DAST, runtime, backup/restore and fail-closed final acceptance evidence.
- Adapted canonical and knowledge ingestion to the assessed local `AI` schema without modifying source data.
- Added digest-pinned local Qwen3.5 inference and Qwen3 multilingual embeddings sized for the assessed 6 GB GPU.
- Raised production capacity acceptance to 20 distinct concurrent users and added AFTA assessment evidence planning.
- Checksum-verified both local models, loaded them together on CUDA and verified Persian chat plus 1,024-dimensional embeddings.
- Isolated inference on an internal Compose network and added bounded two-slot application backpressure with fail-closed LLM fallback.

## Production decisions still required

1. Rotate the provisioned `tseai` SQL login away from the temporary weak password before production use.
2. Approval and maintenance window for the proposed read-model indexes; no index has been applied to the authoritative database.
3. TLS certificate and approved local secret-management mechanism for the target installation.
4. AFTA evaluator, exact assessment profile, audit retention period and formal evidence owner.
5. Availability/p95/p99, RPO/RTO targets and a witnessed production acceptance window.

These decisions affect infrastructure and certification evidence; they cannot be safely inferred from source code.
