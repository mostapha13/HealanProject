# Phase-1 SQL AI Landing Baseline

These are the observed initial copy sizes shared during the Sprint 13 data-design session. They are **diagnostic context only**, not hard-coded acceptance thresholds; jobs may legitimately change the row counts.

| Table | Observed rows |
|---|---:|
| Instrument | 82,264 |
| Cashmarket | 567 |
| OrderBookCurrent | 2,815 |
| ClientType | 1,880 |
| Marketsummary | 8 |
| IndexLastLive | 71 |
| Companystate | 58 |
| ContentType | 26 |
| Content | 61,859 |
| FAQ | 307 |
| Talar | 32 |
| TalarInfo | 31 |
| TsePerson | 97 |
| EDeliveryObject | 3,753 (source observed; landing copy/path is independently managed) |

`Nahad_Mali_Type`, `Nahad_Mali`, `Company` and `EDeliveryCategory` are part of the Phase-1 source catalog; a stable row count was not supplied and is therefore intentionally not guessed.

## Pending source families
The canonical architecture keeps extension points for:
- CompanyOfficer
- CompanyFinancialStatement / metrics
- MarketDailyHistory (`[ih]` prerequisite)
- DerivativeContract
- MarketMaker
