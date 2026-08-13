# Validation — Sprint 7

Validation performed on the cumulative Sprint 7 package:

- Python AI source compilation: PASS.
- Existing Python filter/conversation planner tests: PASS — 20 tests.
- Sprint 7 cumulative required-file / `.csproj` / ProjectReference validation: PASS.
- Sprint 7 saved-filter security and persistence invariant validation: PASS.
- JSON fixtures/configuration parsing: PASS.
- `docker-compose.yml` YAML parsing: PASS.
- Frontend `App.jsx` JSX/JavaScript TypeScript-transpile syntax check: PASS.
- Saved-filter API contract fixture: PASS.
- Ownership checks are derived from JWT `NameIdentifier`; request bodies do not accept an owner id.
- All saved-filter repository paths scope data by `OwnerUserId`.
- Saved-filter API group requires `Filter.Save` permission.
- SQL persistence includes optimistic `rowversion`, active-name uniqueness, version uniqueness and owner indexes.
- Restore is append-only (restore creates a new latest version rather than moving/deleting history).
- Soft-delete keeps historical data available for future audit/operations work.
- Saved-filter actions are outside `/api/chat/ask` and therefore do not consume the 5/50 daily Chat quota.

Environment limitations:

- The artifact environment does not expose the `dotnet` CLI, so a real `dotnet build` cannot be executed here.
- Docker CLI/daemon is not exposed, so `docker compose build/up` cannot be executed here.
- A full npm dependency install is not used in this environment; JSX was syntax-checked with the available TypeScript transpiler.

Required first integration checks on the target Docker host:

1. `docker compose build`
2. `docker compose up -d`
3. verify `/identity/health`, `/api/health`, `/ai/health`
4. login by OTP and create one conversational filter
5. save it with `POST /api/saved-filters`
6. create two revisions and verify current version increases monotonically
7. restore version 1 and verify a **new** version is appended
8. load the saved filter into another conversation and verify Undo returns to that conversation's prior state
9. verify a second user cannot retrieve/update the first user's saved-filter id
10. lower `Filters.MaxSavedFiltersPerUser` in Admin settings and verify the configured cap is enforced

## Sprint 8 validation

Validated in this delivery:
- Sprint 7 saved-filter invariant suite: PASS.
- Sprint 8 alert invariant suite (`scripts/validate-sprint8.py`): PASS.
- Cumulative structure, `.csproj` XML and ProjectReference validation: PASS.
- AI deterministic/conversational planner tests: 20/20 PASS.
- Frontend `App.jsx` transpile/syntax check with TypeScript parser: PASS.
- JSON and Docker Compose YAML parsing: PASS.
- ZIP integrity is checked after packaging.

Sprint 8 static/reliability invariants specifically verify:
- JWT ownership scoping on alert CRUD/events.
- Saved-filter ownership/version checks.
- Redis Stream changed-symbol production.
- unique per-instance stream consumer identity and abandoned pending recovery.
- edge-trigger state is version/day/symbol scoped.
- dependency-aware ClientType/OrderBook evaluation.
- SQL AlertEvent + AlertOutbox transaction.
- rollback of Redis edge/cooldown reservation on SQL failure.
- RabbitMQ publisher confirms + mandatory publishing.
- multi-replica Outbox publisher lease.
- manual RabbitMQ ACK/NACK and retry-safe SignalR dedup reservation.
- authenticated SignalR Hub + Redis backplane.
- alert management not connected to daily Chat quota.

### Environment limitation
The execution container used to assemble this artifact does not contain `dotnet` or Docker, and outbound DNS is unavailable for installing an SDK dynamically. Therefore an actual `dotnet restore/build` and `docker compose build/up` could not be performed here. Run those two commands in the target Docker/.NET environment before promoting to production.

# Validation — Sprint 9

Validated in the delivery environment:
- Python compile: PASS
- Python tests: 23/23 PASS
- cumulative structure validator: PASS
- Sprint 7 validator: PASS
- Sprint 8 validator: PASS
- Sprint 9 validator: PASS
- docker-compose YAML parse: PASS
- `.csproj` ProjectReference existence: PASS

Environment limitations:
- `.NET SDK` is not installed in this delivery environment, so `dotnet restore/build/test` was not executed here.
- Docker CLI/Engine is not installed in this delivery environment, so image build and end-to-end Compose startup remain destination validation gates.


# Validation — Sprint 10

Validated in the delivery environment:
- Python compile: PASS
- Python tests: 27/27 PASS
- Sprint 7 validator: PASS
- Sprint 8 validator: PASS
- Sprint 9 validator: PASS (made forward-compatible with later sprint markers)
- Sprint 10 validator: PASS
- Chat execution remains .NET-owned; AI returns only an allow-listed plan.
- Unknown/underspecified market requests fail closed to clarification rather than fabricating a symbol/tool call.

Environment limitations:
- `.NET SDK` is not installed in this delivery environment, so real `dotnet restore/build/test` remains a destination gate.
- Docker CLI/Engine is not installed here, so Compose build/up remains a destination gate.


# Validation — Sprint 14

Validated in the packaging environment:
- Sprint 7-13 cumulative validators: PASS.
- Sprint 14 temporal validator: PASS.
- Python AI tests: 32/32 PASS.
- JSON/XML/YAML parse: PASS.
- C# changed-file structural delimiter/project-reference sanity: PASS.
- Release Gate contains Linux and Windows temporal runtime smoke execution.

Runtime limitation:
- .NET SDK is unavailable in the packaging environment; `PersianTemporalResolver` runtime smoke tests are therefore a mandatory target-host gate.
- Docker E2E remains a target-host gate.


# Validation — Sprint 15
- Entity resolution static validator: PASS in packaging environment.
- Python AI planner/regression tests: PASS.
- Entity resolver zero-external-package .NET smoke project is wired into target-host release gates.
- Live SQL AI resolution and .NET build remain target-host gates.
