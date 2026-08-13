# Sprint 15 — Persian Entity & Instrument Resolver

## Goal
Resolve Persian user references to authoritative SQL AI entities before structured market execution. The AI planner is allowed to suggest an entity phrase, but it cannot declare an Instrument identity.

## Implemented

### Canonical entity contract
`TSEAI.Application.Entities` adds:
- `EntityKind`
- `EntityResolutionStatus`
- `EntityMatchKind`
- `EntitySourceCandidate`
- `EntityCandidateMatch`
- `EntityResolution`
- `IEntityCandidateSource`
- `IPersianEntityResolver`

### Persian normalization
`PersianEntityNormalizer` handles:
- `ي/ى -> ی`
- `ك -> ک`
- Persian and Arabic digits -> ASCII digits
- ZWNJ/NBSP normalization
- diacritic removal
- punctuation/separator normalization
- compact comparison form

### SQL AI candidate source
`SqlAiEntityCandidateSource` is read-only and searches bounded candidates from current Phase-1 tables:
- `Instrument` (+ classification against `IndexLastLive`)
- `Company`
- `TsePerson`
- `Talar`
- `Nahad_Mali` / `Nahad_Mali_Type`

Instrument aliases include symbol, instrument name, issuer symbol, company name, ISIN and identifiers. `InstrumentID` remains canonical identity; `InsCode` remains market-runtime bridge.

### Deterministic scorer
Priority: exact ID/InsCode/ISIN > exact symbol > exact name/alias > compact equality > prefix > contains.

Ambiguous candidates fail closed and return clarification choices. Unknown entities return `NoMatch`; the resolver does not ask an LLM to guess.

### Chat integration
For `MarketSymbol` and `Hybrid` intents:
1. Sprint 14 temporal guard runs.
2. AI planner emits an entity hint.
3. `entity.resolve` validates the hint against SQL AI.
4. Ambiguity/no-match returns clarification.
5. Resolved Instrument uses `InsCode` for Redis market lookup.
6. Resolved symbol is passed to Hybrid RAG filtering.
7. Resolved Index currently returns capability-unavailable until the dedicated index Structured Tool Sprint.

### Planner hardening
Deterministic Python hint extraction now preserves multi-word references such as:
- `بانک ملت`
- `ایران خودرو`
- `شاخص کل`

Knowledge-only concepts such as `اختیار معامله چیست؟` are no longer incorrectly forced into a symbol hint.

### API
`POST /api/admin/entity/resolve`

Optional `ExpectedKinds` restricts resolution to allowed entity classes.

## Deliberate limitations
- No fuzzy-edit-distance/phonetic correction is introduced yet; bounded alias/prefix/contains matching is safer for financial data.
- No persistent custom alias table yet; Admin Semantic Registry is planned later.
- Dedicated index retrieval in Chat remains Sprint 17 scope.
- Performance cache/index materialization is planned in Sprint 37; current SQL search is bounded and deterministic.

## Definition of Done
- Entity resolver is deterministic and LLM-independent.
- SQL query values are parameterized and connection is read-only.
- Market Chat cannot execute on an unresolved/ambiguous entity.
- Persian normalization and ambiguity smoke tests are wired into release gates.
- Previous Sprint validators and Python AI tests remain green.
