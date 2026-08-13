# Sprint 18 — Deterministic Market Analytics Engine

Sprint 18 moves market arithmetic out of the LLM and into deterministic, testable application code.

Implemented analytics:
- حقیقی/حقوقی: individual/legal net volume, individual buy/sell per-capita, buyer power.
- Order book: best bid/ask, spread, spread percent, total bid/ask volume, normalized imbalance.
- Volume: trade volume and volume/base-volume ratio.
- Price position: distance from session high/low and last-vs-closing percentage.
- Market breadth: positive/negative ratios and deterministic breadth signal using the broadest non-empty index universe rather than summing overlapping index universes.
- Composite symbol analytics returned by Chat and Structured Tool Gateway.

Safety rules:
- No arbitrary SQL, URL, MCP, or LLM-calculated numeric metrics.
- Quality-rejected snapshots cannot be analyzed for user answers.
- Missing denominators return Unavailable instead of zero or infinity.
- `VolumeVsMonthlyAverage` is explicitly unavailable until a canonical source for month average volume is added.
