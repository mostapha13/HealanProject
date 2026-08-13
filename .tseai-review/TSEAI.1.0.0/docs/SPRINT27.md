# Sprint 27 — Multi-Tool Hybrid Planner

Version: `1.0.0-rc.16`

## Goal
Convert hybrid chat requests into a bounded, auditable dependency graph and execute independent capabilities concurrently without allowing arbitrary tools.

## Completed
- Added `IMultiToolHybridPlanner` and deterministic DAG contracts.
- Hybrid plan is bounded to a fixed capability registry and maximum step/depth/parallelism limits.
- Current DAG: `entity.resolve` → parallel `structured.market.symbol` + `knowledge.retrieve` → `analytics.symbol` after market.
- Hybrid parallel branches no longer mutate shared trace concurrently; traces are merged after completion.
- Required structured market failure is fail-closed; analytics never runs without a valid market snapshot.
- RAG remains evidence authority only; structured market remains numeric fact authority.
- Added hybrid plan audit trace and smoke corpus.

## Security
Planner output cannot add capabilities outside the route registry. No arbitrary SQL, URL, shell or arbitrary MCP execution is introduced.
