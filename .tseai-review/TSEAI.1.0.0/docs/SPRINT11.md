# Sprint 11 — Admin & Operations

## Goal
Provide an operational control plane for TSEAI without mixing admin concerns into the AI planner or TSETMC filter boundary.

## Delivered
- Operations overview contract and SQL-backed store
- Append-only audit event model with correlation IDs
- Operational incident model and indexed persistence
- Admin settings update contract (allow-list enforcement belongs at API boundary)
- Runtime health contract for API/Identity/Market/Alert/Knowledge/AI/Redis/RabbitMQ/Qdrant
- Sprint 11 structural validator and operations contract fixtures

## Security invariants
- Admin endpoints must require explicit admin/operations permissions.
- Secrets are never returned by settings APIs.
- Audit metadata must not contain OTP, JWT, refresh tokens, raw secrets or credentials.
- TSETMC compatibility remains isolated to Filter Engine.

## Deferred to Sprint 12
- Production migrations replacing bootstrap schema initializers
- Full metrics exporter / OpenTelemetry backend integration
- Load, failover, backup/restore and disaster-recovery gates
- Runtime Docker/.NET validation on target environment
