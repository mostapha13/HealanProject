# Sprint 26 — Intent & Capability Router

Version: `1.0.0-rc.15`

## Goal
Centralize chat routing into one auditable, policy-based capability decision before execution.

## Completed
- Added `IChatCapabilityRouter` and `DeterministicCapabilityRouter`.
- Deterministic priority: saved-filter/alert commands → conversational/TSETMC filter → NL structured query.
- Bounded AI planner is only a fallback for semantic intent/entity hints.
- Planner output is projected onto a fixed capability registry; it cannot invent tools or SQL.
- Route decisions include route, intent, confidence, reason codes, required authorities, and `PlannerUsed`.
- `capability.route` is allow-listed and written to Chat tool trace with an audit summary.
- ChatOrchestrator now consumes the centralized route decision instead of independently invoking planner/detectors.

## Routing authority
- Structured numeric facts: canonical SQL/Redis + Quality Gate.
- Knowledge: grounded Qdrant evidence.
- Hybrid: both authorities, never RAG as numeric authority.
- Filter assets: persistent user-owned repositories with existing permission enforcement.

## Security
The router selects only known capabilities. Arbitrary SQL, arbitrary URLs, shell and arbitrary MCP remain prohibited.
