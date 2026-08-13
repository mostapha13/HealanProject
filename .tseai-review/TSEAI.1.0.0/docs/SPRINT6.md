# Sprint 6 — Conversational Filter Editing

## Goal
Turn the Sprint 5 one-shot Persian filter builder into a stateful conversational filter editor while preserving deterministic TSETMC compatibility.

## Implemented

- Per-user/per-anonymous **conversation filter state** stored in Redis.
- `X-Anonymous-Id + ConversationId` isolation for guests and `UserId + ConversationId` isolation for authenticated users.
- Seamless guest→OTP-login continuation: when an authenticated conversation has no state yet, its existing anonymous state is copied into the user partition so the active filter is not lost.
- Versioned transient revisions with a cursor-based **Undo / Redo** model; transient history is capped at the latest 100 revisions per conversation.
- Conversation operations:
  - `create`
  - `add`
  - `replace_all`
  - `replace_condition`
  - `remove_last`
  - `remove_condition`
  - `remove_field`
  - `clear`
  - `undo`
  - `redo`
  - `show`
- AST-level `AND` condition flatten/combine/edit helpers. No string `eval` and no JavaScript execution.
- Every AI-produced fragment is reparsed and validated by the deterministic Sprint 3/4 parser before it can become active.
- Redis distributed lock per conversation prevents double-submit races from overwriting state.
- State TTL is seven days; permanent persistence is intentionally deferred to Sprint 7 Saved Filters.
- Backend returns numbered conditions with canonical TSETMC code and Persian explanations.
- Filter result paging and deterministic sorting by trade value, trade volume, last price, closing price or symbol.
- Paging/sorting use the direct execution endpoint and do not consume another chat-question quota.
- Frontend active-filter sidebar with:
  - current canonical TSETMC code
  - numbered condition list
  - remove-condition action
  - Undo / Redo
  - clear filter
  - new conversation
- Python deterministic conversation planner plus optional LLM fallback.
- Numeric edits understand IRR/Toman conversion for monetary conditions.

## Example dialogue

1. `ارزش معاملات بیشتر از 20 میلیارد ریال`
   - creates `(tval) > 20000000000`
2. `صف خرید هم اضافه کن`
   - adds `(pd1) == (tmax) && (qd1) > 0`
3. `حدش را 30 میلیارد ریال کن`
   - edits the most relevant/latest numeric condition when deterministic resolution is possible
4. `شرط دوم را حذف کن`
   - removes condition #2 from the canonical AST
5. `یک مرحله برگرد`
   - moves the revision cursor backward

## Safety / correctness invariants

1. AI is never the execution engine.
2. AI cannot directly mutate Redis state.
3. Every resulting filter must pass the TSETMC parser and validator.
4. Unsupported/ambiguous edits fail closed instead of silently dropping conditions.
5. Programming-mode JavaScript remains outside V1 scope.

## Deferred to Sprint 7

- SQL persistence of named/saved filters.
- favorites and ownership metadata.
- permanent saved-filter version history.
- user saved-filter limits.
