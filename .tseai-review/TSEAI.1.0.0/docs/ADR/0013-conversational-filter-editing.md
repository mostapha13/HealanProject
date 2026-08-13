# ADR 0013 — Conversational Filter Editing

## Decision
Conversation filter state is authoritative per subject + conversation id. User edits are translated to a bounded operation contract and applied to the validated AST.

## Rules
1. Chat edit intent is recognized before generic planning.
2. Raw DSL accompanied by edit language is treated as an edit, not a create/import.
3. Each mutation creates an immutable transient revision. Undo/redo moves the cursor; a new mutation after undo truncates the redo branch.
4. All edits are re-exported to canonical TSETMC code and validated before execution.
5. Ambiguous edits fail closed rather than modifying an arbitrary condition.
6. LLM is optional fallback only; it cannot bypass operation allowlists or AST validation.
