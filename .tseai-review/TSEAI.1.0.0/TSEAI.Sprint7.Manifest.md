# TSEAI Sprint 7 Manifest

Delivery: Sprint 7 — Saved Filters & Persistent Versioning

Cumulative content: Sprint 0 through Sprint 7.

Key Sprint 7 additions:
- SQL-backed user-owned saved filters
- persistent immutable version history
- restore-as-new-version semantics
- rename / favorite / duplicate / soft-delete
- load saved filter into Sprint 6 conversation state
- configurable `Filters.MaxSavedFiltersPerUser`
- ownership + `Filter.Save` authorization boundary
- optimistic row-version concurrency control
- upgrade-safe idempotent schema bootstrap
- saved-filter/version-management RTL UI

Validation details: `docs/VALIDATION.md`
