namespace TSEAI.MarketRuntime.Worker;

/// <summary>
/// Read-only adapter for the canonical AI landing schema. Every projection uses
/// the runtime DTO names explicitly so schema changes fail visibly instead of
/// silently producing empty snapshots.
/// </summary>
public static class DefaultMarketQueries
{
    public const string Instruments = """
        WITH book_codes AS
        (
            SELECT InstrumentID, MAX(InsCode) AS InsCode
            FROM dbo.OrderBookCurrent
            GROUP BY InstrumentID
        )
        SELECT
            CONVERT(nvarchar(255), c.InstrumentID) AS InstrumentId,
            CONVERT(nvarchar(255), c.InstrumentID) AS SymbolCode,
            COALESCE(NULLIF(i.LVal18AFC, N''), NULLIF(c.Instrumentname, N''), c.InstrumentID) AS Symbol,
            COALESCE(NULLIF(i.LVal30, N''), NULLIF(c.Companynamepersian,N''), NULLIF(c.Instrumentname, N''), c.InstrumentID) AS SymbolName,
            COALESCE(NULLIF(c.Companynamepersian, N''), NULLIF(i.LSoc30, N'')) AS CompanyName,
            COALESCE(TRY_CONVERT(int, c.Markettypeid), i.MarketCateryId) AS MarketTypeId,
            TRY_CONVERT(bigint, i.ZTitad) AS Investment,
            COALESCE(i.InsCode, ob.InsCode,
                CONVERT(bigint,8000000000000000000 + ABS(CONVERT(bigint,SUBSTRING(HASHBYTES('SHA2_256',CONVERT(varbinary(max),c.Instrumentid)),1,8)) % 1000000000000000000))) AS InsCode
        FROM dbo.Cashmarket c
        LEFT JOIN dbo.Instrument i ON c.Instrumentid = i.InstrumentID
        LEFT JOIN book_codes ob ON ob.InstrumentID = c.Instrumentid
        WHERE (i.InstrumentID IS NULL OR (i.Valid = 1 AND i.InsCode > 0));
        """;

    public const string CurrentState = """
        WITH book_codes AS
        (
            SELECT InstrumentID, MAX(InsCode) AS InsCode
            FROM dbo.OrderBookCurrent
            GROUP BY InstrumentID
        )
        SELECT
            COALESCE(i.InsCode, ob.InsCode,
                CONVERT(bigint,8000000000000000000 + ABS(CONVERT(bigint,SUBSTRING(HASHBYTES('SHA2_256',CONVERT(varbinary(max),c.Instrumentid)),1,8)) % 1000000000000000000))) AS InsCode,
            CONVERT(int, CONVERT(char(8), c.SourceCollectedAt, 112)) AS TradingDate,
            CONVERT(int, REPLACE(CONVERT(char(8), c.SourceCollectedAt, 108), ':', '')) AS EventTime,
            COALESCE(NULLIF(i.LVal18AFC, N''), NULLIF(c.Instrumentname, N''), c.InstrumentID) AS Symbol,
            COALESCE(NULLIF(i.LVal30, N''), NULLIF(c.Companynamepersian,N''), NULLIF(c.Instrumentname, N''), c.InstrumentID) AS SymbolName,
            COALESCE(c.Tradecount, 0) AS TradeCount,
            COALESCE(c.Tradevolume, 0) AS TradeVolume,
            COALESCE(c.Tradevalue, 0) AS TradeValue,
            COALESCE(c.Closingprice, 0) AS ClosingPrice,
            COALESCE(c.Lastprice, 0) AS LastPrice,
            COALESCE(c.Lastpricechange, 0) AS PriceChange,
            c.Lastpricechangepercent AS LastPricePercent,
            c.Closingpricechange AS ClosingPriceChange,
            c.Closingpricechangepercent AS ClosingPricePercent,
            COALESCE(c.Lowvalue, 0) AS MinPrice,
            COALESCE(c.Highvalue, 0) AS MaxPrice,
            COALESCE(c.Firstprice, 0) AS FirstPrice,
            COALESCE(c.YesterdayPrice, 0) AS YesterdayPrice,
            TRY_CONVERT(decimal(38, 10), c.MinValue) AS RawMinValue,
            TRY_CONVERT(decimal(38, 10), c.MaxValue) AS RawMaxValue,
            TRY_CONVERT(decimal(38, 10), c.Effectonindex) AS EffectOnIndex,
            TRY_CONVERT(decimal(38, 10), c.Sellprice) AS BestAskPrice,
            TRY_CONVERT(bigint, c.Sellquantity) AS BestAskQuantity,
            TRY_CONVERT(bigint, c.Sellcount) AS BestAskCount,
            TRY_CONVERT(decimal(38, 10), c.Buyprice) AS BestBidPrice,
            TRY_CONVERT(bigint, c.Buyquantity) AS BestBidQuantity,
            TRY_CONVERT(bigint, c.Buycount) AS BestBidCount,
            c.Marketid AS MarketId,
            c.Marketname AS MarketName,
            c.Markettypeid AS MarketTypeCode,
            c.Markettypename AS MarketTypeName,
            c.Boardid AS BoardId,
            c.Boardname AS BoardName,
            c.Industryname AS IndustryName,
            TRY_CONVERT(bigint, c.Industrysubid) AS IndustrySubId,
            c.Industrysubname AS IndustrySubName,
            c.Securitiesid AS SecuritiesId,
            c.Securitiesname AS SecuritiesName,
            c.Stateid AS StateId,
            c.Statename AS StateName,
            c.Eps,
            c.Pe AS PE,
            i.PSaiSMinOkValMdv AS MinAllowedPrice,
            i.PSaiSMaxOkValMdv AS MaxAllowedPrice,
            TRY_CONVERT(bigint, i.ZTitad) AS SharesCount,
            TRY_CONVERT(decimal(38, 10), c.Marketvalue) AS MarketValue,
            i.BaseVol AS BaseVolume,
            CONVERT(nvarchar(32), i.Industryid) AS IndustryCode,
            CAST(NULL AS decimal(38, 10)) AS OpenPositions,
            CAST(NULL AS decimal(38, 10)) AS NavCancellation,
            c.SourceCollectedAt AS LastModified
        FROM dbo.Cashmarket c
        LEFT JOIN dbo.Instrument i ON i.InstrumentID = c.Instrumentid
        LEFT JOIN book_codes ob ON ob.InstrumentID = c.Instrumentid
        WHERE (i.InstrumentID IS NULL OR i.Valid = 1)
          AND c.SourceCollectedAt > @Watermark;
        """;

    public const string ClientTypes = """
        WITH latest AS
        (
            SELECT ct.*,
                   ROW_NUMBER() OVER
                   (PARTITION BY ct.InsCode ORDER BY ct.SourceCollectedAt DESC, ct.Id DESC) AS rn
            FROM dbo.ClientType ct
            WHERE ct.InsCode IS NOT NULL
              AND ct.SourceCollectedAt > @Watermark
        )
        SELECT
            InsCode,
            SourceCollectedAt AS LastModified,
            ClientType_counter AS Counter,
            creationTime AS UpdatedAt,
            SourceCollectedAt,
            COALESCE(Buy_CountI, 0) AS BuyCountI,
            COALESCE(Buy_CountN, 0) AS BuyCountN,
            COALESCE(TRY_CONVERT(bigint, Buy_I_Volume), 0) AS BuyIVolume,
            COALESCE(TRY_CONVERT(bigint, Buy_N_Volume), 0) AS BuyNVolume,
            COALESCE(Sell_CountI, 0) AS SellCountI,
            COALESCE(Sell_CountN, 0) AS SellCountN,
            COALESCE(TRY_CONVERT(bigint, Sell_I_Volume), 0) AS SellIVolume,
            COALESCE(TRY_CONVERT(bigint, Sell_N_Volume), 0) AS SellNVolume
        FROM latest
        WHERE rn = 1;
        """;

    public const string OrderBook = """
        SELECT
            ob.InsCode,
            ob.SourceCollectedAt AS LastModified,
            ob.OrderBookUpdatedAt,
            ob.SourceCollectedAt,
            TRY_CONVERT(int, ob.[Level]) AS [Level],
            ob.BestLimitCounter,
            COALESCE(ob.BuyPrice, 0) AS BuyPrice,
            COALESCE(ob.BuyCount, 0) AS BuyCount,
            COALESCE(ob.BuyQuantity, 0) AS BuyVolume,
            COALESCE(ob.SellPrice, 0) AS SellPrice,
            COALESCE(ob.SellCount, 0) AS SellCount,
            COALESCE(ob.SellQuantity, 0) AS SellVolume
        FROM dbo.OrderBookCurrent ob
        WHERE ob.[Level] BETWEEN 1 AND 5
          AND ob.SourceCollectedAt > @Watermark;
        """;
}
