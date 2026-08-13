# ADR 0011 — Natural Language Structured Query

## Status
Accepted — Sprint 19

## Decision
TSEAI converts bounded Persian screening/ranking requests into a typed `StructuredQueryPlan`. The plan is validated and executed against the current market snapshot without allowing the LLM or the user to submit arbitrary SQL, table names, column names, expressions, URLs, or MCP calls.

## Boundary
`Natural language → deterministic interpreter → StructuredQueryPlan → validation → market universe → Data Quality gate → deterministic analytics → filtering/sorting → bounded result`.

The Structured Query capability is intentionally distinct from the TSETMC-compatible Filter DSL. Sprint 19 covers common screening/ranking queries; conversational creation/editing of the full filter AST remains Sprint 20+.

## Fail-closed rules
- Unsupported metrics are not mapped to a substitute metric.
- Missing/unavailable analytics metrics do not become zero.
- Invalid/stale snapshots rejected by the Data Quality engine do not participate in results.
- Historical/future screening is blocked until a trusted history source exists.
- Maximum result size is bounded to 200.
- A weak single-symbol question must not be reclassified as a market-wide screening query.

## Current metrics
TradeVolume, TradeValue, TradeCount, LastPrice, ClosingPrice, LastPricePercent, ClosingPricePercent, PE, EPS, MarketValue, BaseVolume, BuyerPower, OrderBookImbalance and VolumeVsBaseVolume.

`EffectOnIndex` exists in the canonical SQL-AI contract but is not yet present in the live `MarketSymbolSnapshot`; therefore Sprint 19 does not fabricate or infer index-impact ranking.
