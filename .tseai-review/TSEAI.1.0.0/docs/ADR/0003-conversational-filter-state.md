# ADR 0003 — Conversational filter state is transient Redis state

## Decision
The active filter used while a user is chatting is stored as transient Redis state keyed by subject + conversation id. The state stores canonical TSETMC code revisions and a cursor for Undo/Redo.

## Why
- Chat editing needs very low latency.
- Multiple API instances must share the same state.
- The active conversation is ephemeral and should not create durable database rows for every intermediate utterance.
- Permanent ownership, naming, favorites and retained version history belong to the Saved Filter domain introduced in Sprint 7.

## Concurrency
A short per-conversation Redis lease prevents simultaneous writes from racing. The AI planner cannot write state directly; the .NET application service applies and validates the operation while holding the lease.

## Security boundary
Keys are partitioned by authenticated UserId or anonymous subject plus a high-entropy ConversationId. TSETMC expressions are reparsed and validated before becoming active.
