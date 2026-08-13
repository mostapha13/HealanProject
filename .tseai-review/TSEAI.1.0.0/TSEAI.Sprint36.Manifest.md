# Sprint 36 — AI Evaluation & Release Gate
- Golden evaluation runner supports offline preflight and live `/api/chat/ask` execution.
- Release thresholds are machine-readable and intentionally strict.
- Metrics: route/capability/entity/temporal accuracy, groundedness, citation validity, hallucination and unsafe-tool rates, latency percentiles.
- Live metrics are a hard GA prerequisite; offline preflight is not a substitute for live execution.
