# Market SQL Mapping Contract

The external market database is **read-only**. TSEAI does not require new views. Physical table/column names are isolated behind configurable SQL and aliased to runtime contracts. The SQL login itself must have read-only permissions; `ApplicationIntent=ReadOnly` is also applied by the runtime as a defensive connection hint.

## Current-state contract

Example for the current-state sample supplied for TSEAI (replace `[YourCurrentMarketTable]` only):

```sql
SELECT
    insCode AS InsCode,
    dEven AS TradingDate,
    hEven AS EventTime,
    lVal18AFC AS Symbol,          -- exact TSETMC (l18) text
    lVal30 AS SymbolName,         -- exact TSETMC (l30) text
    zTotTran AS TradeCount,
    qTotTran5J AS TradeVolume,
    qTotCap AS TradeValue,
    pClosing AS ClosingPrice,
    pDrCotVal AS LastPrice,
    priceChange AS PriceChange,
    priceMin AS MinPrice,
    priceMax AS MaxPrice,
    priceFirst AS FirstPrice,
    priceYesterday AS YesterdayPrice,
    LastModiefiedDate AS LastModified
FROM [YourCurrentMarketTable]
WHERE LastModiefiedDate > @Watermark;
```

If the physical source already exposes TSETMC-calculated percent/change fields, additionally alias them as:

```sql
... AS LastPricePercent,
... AS ClosingPriceChange,
... AS ClosingPricePercent
```

If those optional columns are absent, TSEAI calculates the percentage/change deterministically from current/yesterday prices. For strict TSETMC conformance, direct source values are preferred when available because source-side rounding may differ.

`Symbol` / `SymbolName` above are deliberately retained in the snapshot as `TsetmcSymbol` / `TsetmcName` for Filter Engine `(l18)` / `(l30)` semantics. Outside Filter Engine, TSEAI uses the canonical `Instrument` fields joined through the assumed `SymbolCode ↔ InsCode` mapping.

## Other feeds

ClientType and OrderBook queries follow the same principle and must alias to `ClientTypeRow` and `OrderBookRow`, including `InsCode` and preferably `LastModified`. They are polled independently because order-book/client-type changes do not need to coincide with a new trade.

If a source table cannot provide a reliable watermark, set `MARKET_USE_WATERMARK=false`. The runtime then executes the configured read query without incremental assumptions. Profile first; add an index only if necessary. A new database View is not a prerequisite.
