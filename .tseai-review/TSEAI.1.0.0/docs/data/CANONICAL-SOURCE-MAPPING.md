# TSEAI Sprint 13 — Canonical Source Mapping

This document records mappings that are supported by the SQL AI landing samples supplied by the project owner. Unknown legacy semantics are deliberately not guessed.

## Instrument identity

| SQL AI | Canonical |
|---|---|
| `Instrument.InstrumentID` | `InstrumentId` — unique canonical instrument identity |
| `Instrument.InsCode` | `InsCode` — market/source bridge key |
| `Instrument.CIsin` | `Isin` |
| `Instrument.LVal18AFC` | `InstrumentSymbol` |
| `Instrument.LVal30` | `InstrumentName` |
| `Instrument.CSocCSAC` | `IssuerSymbol` |
| `Instrument.LSoc30` | `CompanyName` |
| `Instrument.marketcategory` | `InstrumentCategory` |

`Company.InstrumentId` from the RegionHall source is a GUID-like source identifier in the supplied samples and is **not assumed** to equal `Instrument.InstrumentID`. It is preserved as `SourceInstrumentId` until an authoritative crosswalk is provided.

## Cash market

The current landing contract is numeric. Generated Persian narrative is not source-of-truth.

| SQL AI | Canonical |
|---|---|
| `Tradevolume` | `TradeVolume` |
| `Tradevalue` | `TradeValueIrr` after explicit unit normalization |
| `Tradecount` | `TradeCount` |
| `Highvalue` | `SessionHighPriceIrr` |
| `Lowvalue` | `SessionLowPriceIrr` |
| `Firstprice` | `FirstPriceIrr` |
| `Lastprice` | `LastPriceIrr` |
| `Closingprice` | `ClosingPriceIrr` |
| `YesterdayPrice` | `YesterdayPriceIrr` |
| `Effectonindex` | `EffectOnIndex` |
| `Marketvalue` | `MarketValueIrr` |
| `Buyprice/quantity/count` | best bid |
| `Sellprice/quantity/count` | best ask |

`MinValue` and `MaxValue` are retained as `RawMinValueIrr`/`RawMaxValueIrr`; their exact business meaning is not inferred from naming because supplied samples differ from session low/high.

## Order book

| Landing | Canonical |
|---|---|
| `Level` | `Level` 1..5 |
| `BuyPrice` | `BidPriceIrr` |
| `BuyQuantity` | `BidQuantity` |
| `BuyCount` | `BidOrderCount` |
| `SellPrice` | `AskPriceIrr` |
| `SellQuantity` | `AskQuantity` |
| `SellCount` | `AskOrderCount` |

## Client type

| Landing | Canonical |
|---|---|
| `Buy_CountI` | IndividualBuyCount |
| `Buy_CountN` | LegalBuyCount |
| `Buy_I_Volume` | IndividualBuyVolume |
| `Buy_N_Volume` | LegalBuyVolume |
| `Sell_CountI` | IndividualSellCount |
| `Sell_CountN` | LegalSellCount |
| `Sell_I_Volume` | IndividualSellVolume |
| `Sell_N_Volume` | LegalSellVolume |

Derived analytics such as net individual volume, per-capita volume and buyer power are intentionally deferred to the deterministic analytics sprint rather than stored as source facts.

## Timestamp rule

`SourceCollectedAt` means **collection/landing time**. It must not be silently treated as market date, publication date, effective date or financial period date.
