# Sprint 29 — Temporal Conversation Context

Status: COMPLETE  
Version: `1.0.0-rc.18`

Sprint 29 makes Persian temporal resolution conversation-aware without weakening the market-data trust boundary.

## Delivered
- Conversation temporal resolution now loads `LastTemporal` before parsing contextual expressions.
- Contextual phrases such as `یک روز قبلش`, `سه روز بعدش`, `همون روز`, `همان بازه`, `هفته بعدش` and `ماه قبلش` are resolved against the previous explicit/resolved temporal anchor.
- Non-contextual expressions such as `دیروز`, `فردا` and `امروز` continue to resolve against the real Tehran clock, not the conversation anchor.
- Contextual results are rebased to the real clock after relative calculation so historical/future guards cannot be bypassed by changing the resolver reference date.
- Missing temporal anchors fail closed with `context.anchor_missing`; TSEAI never silently interprets `قبلش/بعدش` relative to today.
- Explicit temporal comparison such as `امروز رو با دیروز مقایسه کن` yields two resolved temporal references. Market execution still fails closed while `MarketDailyHistory` is unavailable.
- Temporal interpretation is audit-visible through the `temporal.resolve` trace detail.

## Trust boundary
Conversation context stores temporal referents only. It does not cache market facts, prices, volumes, analytics, or historical observations.

## Deferred
Authoritative historical execution and date-vs-date market comparison remain blocked until `MarketDailyHistory` is connected.
