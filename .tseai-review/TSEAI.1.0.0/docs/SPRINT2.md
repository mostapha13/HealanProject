# Sprint 2 — Read-only Market Runtime and Live Snapshot
- Instrument metadata is cached separately from trading state.
- Market SQL access is read-only and query text is configuration-driven; no View dependency is introduced.
- Polling is active only inside configurable Tehran market session (`Market.StartTime`, `Market.EndTime`).
- Current market, client type and five-level order book are independent readers and are merged by `insCode`.
- `SymbolCode ↔ insCode` is represented by `InstrumentReference` and Redis lookup keys.
- Live snapshots are shared through Redis, enabling horizontally scaled APIs without repeated market-DB reads.
- IRR values stay exact internally; API exposes human display values in million/billion IRR.
## Required SQL aliases
Configure the four SQL queries to return aliases matching `InstrumentReference`, `CurrentMarketRow`, `ClientTypeRow`, and `OrderBookRow`. This avoids coupling domain code to physical table/column names.
