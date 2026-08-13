# ADR 0007 — Persian Entity & Instrument Resolution

Status: Accepted — Sprint 15

## Decision
User-entered entity text is never trusted as a market identifier. The AI planner may emit an **entity hint**, but all structured market execution must pass through `IPersianEntityResolver` and resolve against the continuously refreshed SQL AI reference data.

The resolver is deterministic and has no LLM/HTTP dependency. It normalizes Persian/Arabic character variants, digits, whitespace, ZWNJ and punctuation, queries bounded candidates through a read-only SQL AI source, scores explicit identifiers/names/aliases, and fails closed on ambiguity.

Supported Phase-1 entity kinds:
- `Instrument`
- `MarketIndex`
- `Company`
- `TsePerson`
- `RegionHall`
- `FinancialInstitution`

For market-symbol Chat intents the allowed kinds are restricted to `Instrument` and `MarketIndex`. An Instrument resolves to `InstrumentID` plus `InsCode`; market runtime lookup uses `InsCode` when available. A resolved MarketIndex is not silently treated as a share: until the dedicated index Chat tool is wired, Chat returns capability-unavailable instead of substituting another data source.

## Matching priority
1. Canonical/Instrument identifier
2. `InsCode`
3. ISIN
4. Exact symbol
5. Exact name/alias
6. Compact normalized equality
7. Prefix/contains candidate matching

Only strong exact identifiers (`InstrumentID`, `InsCode`, ISIN/canonical ID) bypass ambiguity comparison; duplicate/near-peer symbols still clarify. Similar names must clarify when their score separation is below the configured ambiguity delta.

## Security / correctness
- SQL AI connection uses `ApplicationIntent=ReadOnly`.
- User values are SQL parameters; no user-provided SQL identifiers are interpolated.
- Entity resolution does not execute arbitrary SQL, tools or URLs.
- Resolver output exposes bounded metadata only; no private contact data is required for matching.
- `Company.InstrumentId` remains source metadata only because its type/semantics were previously found incompatible with canonical `Instrument.InstrumentID`; no guessed join is introduced.

## Consequences
Entity matching becomes a reusable trust boundary for later Structured Tools, Hybrid Planner, RAG metadata filtering and conversational context. Sprint 29 can retain canonical entity IDs instead of raw user phrases.
