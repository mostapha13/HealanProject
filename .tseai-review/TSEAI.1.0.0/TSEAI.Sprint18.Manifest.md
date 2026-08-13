# TSEAI Sprint 18 Manifest
Version: 1.0.0-rc.7
Baseline: Sprint 17 / 1.0.0-rc.6
Capability: Deterministic Market Analytics Engine

Key invariants:
- Numeric analytics are deterministic C# calculations, not LLM arithmetic.
- Analytics consume only quality-approved current market facts.
- Division-by-zero and unavailable inputs return explicit Unavailable metrics.
- MonthAverageVolume is not fabricated because it is absent from the current Phase-1 canonical contract.
- Structured analytics tools remain allow-listed behind SecureStructuredToolGateway.
