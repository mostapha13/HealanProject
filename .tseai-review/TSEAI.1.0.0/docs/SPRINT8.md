# Sprint 8 — Incremental Alert Engine

## Goal
Turn a persisted Saved Filter into a reliable live-market alert without rescanning the whole market for every rule on every tick.

## User capabilities
- Create an alert from any owned Saved Filter.
- Give the alert a name and configurable cooldown.
- Follow the Saved Filter's latest version or pin the alert to a specific filter version.
- Enable/disable and soft-delete alert rules.
- Receive live notifications while signed in.
- Review persisted recent alert events after reconnect/offline periods and mark them read.
- Alert management does **not** consume the 5/50 daily Chat question quota.

## Evaluation semantics
The runtime is edge-triggered:

1. First observation establishes a baseline and never fires.
2. `false -> false`: no event.
3. `true -> true`: no event.
4. `true -> false`: reset state; no event.
5. `false -> true`: eligible trigger, subject to cooldown.

State keys include `AlertRuleId + FilterVersion + TradingDate + InsCode`. A new filter version therefore establishes a new baseline rather than inheriting stale state from the previous version.

## Incremental market flow
`MarketRuntime` merges Current/ClientType/OrderBook changes into the Redis market snapshot and publishes one consolidated change batch to Redis Stream `tseai:market:changes:v1`.

`TSEAI.Alert.Worker` consumes the stream with a consumer group. Each replica gets a unique consumer name. Own pending entries are retried first; abandoned pending entries are reclaimed after a configurable idle threshold; new entries are then consumed.

Only changed `InsCode` values are evaluated. Dependency analysis further suppresses unnecessary work:
- Current-market change: rule may be reevaluated.
- ClientType-only change: only filters using `(ct).*` are reevaluated.
- OrderBook-only change: only filters using `pd/qd/zd/po/qo/zo` are reevaluated.

The actual predicate remains the deterministic Sprint 3/4 `FilterEvaluator`; no LLM participates in live alert evaluation.

## Reliability / delivery
Trigger persistence and publication are separated with a Transactional Outbox:

`Redis transition -> SQL AlertEvent + AlertOutbox (one transaction) -> RabbitMQ -> Notification API -> SignalR`

- If SQL persistence fails after the Redis transition, the transition/cooldown reservation is rolled back.
- RabbitMQ publisher confirms are enabled and unroutable mandatory publishes fail so the outbox can retry.
- A Redis lease makes the outbox publisher safe for multiple Alert Worker replicas in the reference deployment.
- Notification delivery uses manual RabbitMQ ACK.
- SignalR delivery is deduplicated by `EventId`; a failed send releases its temporary dedup reservation before NACK/requeue so a retry is not silently lost.
- Event history remains in SQL even if the user is offline; the UI loads recent events after reconnect.

## Persistence
New tables:
- `AlertRules`
- `AlertEvents`
- `AlertOutbox`

Sprint 8 includes an idempotent schema bootstrap so an existing Sprint 7 database can be upgraded without dropping Saved Filters.

## Settings
Admin-editable system settings:
- `Alerts.MaxPerUser` (default 20)
- `Alerts.DefaultCooldownSeconds` (default 300)
- `Alerts.MaxCooldownSeconds` (default 86400)
- `Alerts.RuleRefreshSeconds` (default 5)

Container/runtime controls:
- `ALERT_STREAM_READ_COUNT`
- `ALERT_PENDING_CLAIM_IDLE_MS`
- `ALERT_STATE_TTL_SECONDS`
- `ALERT_RULE_REFRESH_SECONDS`
- `ALERT_OUTBOX_POLL_MS`
- `ALERT_OUTBOX_BATCH_SIZE`
- `ALERT_OUTBOX_LEASE_SECONDS`

## Security
- Alert CRUD requires JWT permission `Alert.Create`.
- Rule and event API queries are always scoped by JWT `UserId`.
- A user can attach alerts only to Saved Filters and versions they own.
- Notification Hub requires JWT authentication; query-string access tokens are accepted only on `/hubs/alerts` for WebSocket/SignalR negotiation.

## Docker services introduced/expanded
- `alert-engine`: Redis Stream consumer + deterministic evaluator + SQL outbox publisher.
- `notification-api`: RabbitMQ consumer + authenticated SignalR Hub + Redis SignalR backplane.

All Sprint 8 components remain Docker-first and use service-name DNS inside the Compose network.

## Deferred
- Email/SMS/mobile push channels.
- Alert schedules beyond the Market Runtime trading-session policy.
- History `[ih]`-based alerts.
- Poison-message dead-letter stream and full production observability dashboards (Sprint 12 hardening).
