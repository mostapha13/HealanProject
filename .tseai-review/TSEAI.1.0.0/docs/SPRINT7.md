# Sprint 7 — Saved Filters & Persistent Versioning

## Goal
Turn the transient conversational filter state introduced in Sprint 6 into durable, user-owned filter assets without changing the deterministic TSETMC execution model.

## Delivered capabilities

- Authenticated-user ownership for saved filters.
- Save from the active conversation or directly from a TSETMC-compatible simple expression.
- Name, description and favorite flag.
- Per-user configurable capacity: `Filters.MaxSavedFiltersPerUser` (default `50`).
- Persistent version history in SQL Server.
- Creating a new saved-filter version from the current conversation.
- Restore of an older version by creating a new restore revision; history is never overwritten.
- Duplicate, rename, favorite and soft-delete.
- Load a saved filter back into a conversation as a normal Sprint 6 revision, preserving Undo/Redo behavior.
- Search and favorites-only query support in the API.
- Permission boundary: all saved-filter APIs require authenticated JWT with `Filter.Save`.
- Optimistic SQL row-version concurrency protection.
- Active-name uniqueness per user.
- Idempotent schema bootstrap for upgrades from the earlier `EnsureCreated`-based Sprint databases.
- RTL UI for saved-filter library and version history.

## Persistence model

### SavedFilters
Current materialized state of the asset:

- `OwnerUserId`
- `Name` / `NormalizedName`
- `Description`
- `IsFavorite`
- `CurrentTsetmcCode`
- `CurrentPersianExplanation`
- `DependenciesJson`
- `CurrentVersion`
- timestamps / soft-delete fields
- SQL `rowversion`

### SavedFilterVersions
Immutable version entries:

- `SavedFilterId`
- monotonically increasing `Version`
- canonical TSETMC code
- Persian explanation
- dependency metadata
- source conversation id
- `create | update | restore` change type
- optional note
- creator user id / timestamp

The canonical TSETMC expression is the durable serialization format. ASTs are re-parsed and validated from that canonical expression, preventing stored AST schema coupling as the parser evolves.

## Restore semantics
Restoring version `N` never deletes or rewrites later versions. The selected version becomes a **new latest version** with `ChangeType=restore`. This provides an append-only audit trail.

## Quota semantics
Saved-filter CRUD, version history, load, restore, duplicate and favorite actions do **not** consume the Chat question quota. The existing 5/50 daily quota remains scoped to `/api/chat/ask`.

## Main API

- `GET /api/saved-filters?search=&favoritesOnly=`
- `GET /api/saved-filters/{id}`
- `POST /api/saved-filters`
- `PUT /api/saved-filters/{id}`
- `DELETE /api/saved-filters/{id}`
- `POST /api/saved-filters/{id}/versions`
- `GET /api/saved-filters/{id}/versions`
- `POST /api/saved-filters/{id}/restore/{version}`
- `POST /api/saved-filters/{id}/duplicate`
- `POST /api/saved-filters/{id}/load`

## Security rules

1. Anonymous users may build filters but cannot persist them.
2. User ownership is taken only from JWT `NameIdentifier`, never from request payload.
3. Every repository query scopes by `OwnerUserId`.
4. Cross-user ids return not-found semantics and never leak asset existence.
5. Saved source is canonicalized by the Sprint 3/4 parser-validator before persistence.

## Upgrade note
Earlier sprints used EF `EnsureCreated`. `SavedFilterSchemaInitializer` uses idempotent SQL DDL so an existing Sprint 6 application database can be upgraded without dropping data. Production hardening will consolidate the cumulative schema into formal EF migrations.
