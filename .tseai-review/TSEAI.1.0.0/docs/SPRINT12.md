# Sprint 12 — Production Hardening & Release

## Mandatory gates
1. Static validators S7-S12 and agentic safety validator pass.
2. Python AI tests pass.
3. `dotnet restore`, `dotnet build -c Release` and `dotnet test -c Release` pass.
4. Frontend install/build passes from lock file.
5. `docker compose ... config` and production image builds pass.
6. Production stack health/readiness smoke tests pass.
7. Auth, quota, saved-filter, alert, RAG, Chat, Reflection/Tool Policy/MCP negative tests pass.
8. Backup and restore drill succeeds before GA.

A build that has not passed gates 3-8 is a Release Candidate, not Production Verified.

## Hardening delivered
- fail-fast production configuration validator
- JWT minimum-strength and explicit issuer/audience validation
- global API rate limiting and request-size limits
- security headers and production HSTS
- bounded AI reflection + tool/MCP allow-list preserved
- production Docker overlay and non-public infrastructure ports
- operational health/readiness endpoints
- versioned database migration ledger/lock for release bootstrap
- backup/restore scripts and deployment runbook
- strict release validation scripts for Windows and Linux
- release acceptance/security test matrix
