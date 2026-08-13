# Sprint 4 — TSETMC Import / Export / Compatibility
- Any supported TSETMC simple filter can be imported into AST, validated, explained in Persian and normalized.
- AST can be exported back to canonical TSETMC-compatible JavaScript expression syntax.
- Dependency analysis reports whether a filter requires client type or order book data.
- Built-in conformance suite parses, exports, reparses and evaluates reference filters against deterministic snapshots to catch semantic round-trip regressions.
- `/api/filters/conformance` exposes the current internal compatibility report.
Note: exact result equality with the live TSETMC website additionally requires the same market snapshot timestamp/data feed; syntax/semantics and data synchronization are separate concerns.
