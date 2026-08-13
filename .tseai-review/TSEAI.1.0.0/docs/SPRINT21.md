# Sprint 21 — Conversational Filter Editing

Version: `1.0.0-rc.10`
Baseline: Sprint 20 / `1.0.0-rc.9`

## Goal
Edit the current TSETMC-compatible filter inside Chat without rebuilding it from scratch.

## Delivered
- Deterministic routing for conversational filter edits even when the word «فیلتر» is omitted.
- `Add`, `RemoveCondition`, `RemoveField`, `RemoveLast`, `ReplaceCondition`, `ReplaceAll`, `Clear`, `Undo`, `Redo`, `Show`, `Explain`, and `Execute`.
- Numeric replacement by condition index or field name, including Persian word numbers.
- Field-aware edits for P/E, EPS, trade value/volume/count, market value, price fields, and base volume.
- Direct TSETMC condition replacement such as «شرط دوم را با (pl) > (pc) جایگزین کن».
- Direct DSL with edit language is processed as an edit, not imported as a brand-new filter.
- Conversation revisions remain bounded to 100 transient revisions and redo history is truncated after a new branch.
- Every resulting filter is canonicalized and revalidated before execution.
- Existing Redis lock prevents concurrent edits from racing in the same conversation.

## Safety
- LLM fallback may only propose an allow-listed edit operation; deterministic parser/validator remains authoritative.
- No arbitrary SQL, JavaScript, URL, shell, or MCP execution.
- `[ih]` remains fail-closed until MarketDailyHistory is connected.
