# ADR 0010 — Deterministic Market Analytics

## Decision
All numerical market analytics used as facts in TSEAI answers are calculated by deterministic application code after entity resolution and data-quality approval. LLMs may explain these metrics but do not calculate or invent them.

## Rationale
Financial answers require reproducibility, consistent zero/null handling and testable formulas. This boundary also allows the future Filter Engine to consume the same canonical metrics.

## Data-gap rule
A metric whose required source fact does not exist in the current canonical contract is returned as Unavailable. In particular, MonthAverageVolume is not currently canonical and is not approximated from BaseVolume.
