# TSEAI Sprint 8 Manifest

Cumulative artifact: Sprints 0–8.

Sprint 8 adds:
- Persistent Saved-Filter Alert Rules and Alert Events.
- Configurable alert limit/cooldown/version pinning.
- Changed-symbol Redis Stream produced by Market Runtime.
- Multi-replica Alert Worker consumer group with pending recovery.
- Deterministic dependency-aware filter evaluation.
- Edge-trigger state/cooldown Lua transaction in Redis.
- SQL Transactional Outbox.
- RabbitMQ durable alert event delivery with publisher confirms.
- SignalR authenticated live notifications with Redis backplane.
- EventId delivery deduplication and persistent recent-event UI.
- Docker wiring, admin settings, alert management UI.

See `docs/SPRINT8.md` and `docs/VALIDATION.md`.
