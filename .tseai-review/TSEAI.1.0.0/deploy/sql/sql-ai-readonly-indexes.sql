/*
  TSEAI SQL-AI read-model performance indexes for the observed local AI schema.
  Review and execute using a DBA account during a maintenance window.
  The TSEAI runtime login must remain read-only and must not execute this script.
*/
USE [AI];
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID(N'dbo.Instrument') AND name=N'IX_Instrument_InstrumentID')
    CREATE INDEX IX_Instrument_InstrumentID ON dbo.Instrument(InstrumentID)
    INCLUDE (InsCode,CIsin,LVal18AFC,LVal30,CSocCSAC,LSoc30,marketcatery,MarketCateryId,Industryid,Industrysubid,BaseVol,Valid,SourceCollectedAt);
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID(N'dbo.Instrument') AND name=N'IX_Instrument_InsCode')
    CREATE INDEX IX_Instrument_InsCode ON dbo.Instrument(InsCode) INCLUDE (InstrumentID,LVal18AFC,LVal30,SourceCollectedAt);
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID(N'dbo.Instrument') AND name=N'IX_Instrument_Symbol')
    CREATE INDEX IX_Instrument_Symbol ON dbo.Instrument(LVal18AFC) INCLUDE (InstrumentID,InsCode,LVal30,CIsin,SourceCollectedAt);
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID(N'dbo.Instrument') AND name=N'IX_Instrument_Name')
    CREATE INDEX IX_Instrument_Name ON dbo.Instrument(LVal30) INCLUDE (InstrumentID,InsCode,LVal18AFC,CIsin,SourceCollectedAt);
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID(N'dbo.Instrument') AND name=N'IX_Instrument_IssuerSymbol')
    CREATE INDEX IX_Instrument_IssuerSymbol ON dbo.Instrument(CSocCSAC) INCLUDE (InstrumentID,InsCode,LVal18AFC,LVal30,SourceCollectedAt);
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID(N'dbo.Instrument') AND name=N'IX_Instrument_CompanyName')
    CREATE INDEX IX_Instrument_CompanyName ON dbo.Instrument(LSoc30) INCLUDE (InstrumentID,InsCode,LVal18AFC,LVal30,SourceCollectedAt);
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID(N'dbo.Instrument') AND name=N'IX_Instrument_Isin')
    CREATE INDEX IX_Instrument_Isin ON dbo.Instrument(CIsin) INCLUDE (InstrumentID,InsCode,LVal18AFC,LVal30,SourceCollectedAt);
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID(N'dbo.Cashmarket') AND name=N'IX_Cashmarket_Instrument')
    CREATE INDEX IX_Cashmarket_Instrument ON dbo.Cashmarket(Instrumentid,SourceCollectedAt DESC);
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID(N'dbo.OrderBookCurrent') AND name=N'IX_OrderBookCurrent_InstrumentLevel')
    CREATE INDEX IX_OrderBookCurrent_InstrumentLevel ON dbo.OrderBookCurrent(InstrumentID,[Level]) INCLUDE (SourceCollectedAt,OrderBookUpdatedAt);
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID(N'dbo.ClientType') AND name=N'IX_ClientType_InsCodeSourceTime')
    CREATE INDEX IX_ClientType_InsCodeSourceTime ON dbo.ClientType(InsCode,SourceCollectedAt DESC,Id DESC)
        INCLUDE (creationTime,ClientType_counter,Buy_CountI,Buy_CountN,Buy_I_Volume,Buy_N_Volume,Sell_CountI,Sell_CountN,Sell_I_Volume,Sell_N_Volume);
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID(N'dbo.Content') AND name=N'IX_Content_Watermark')
    CREATE INDEX IX_Content_Watermark ON dbo.Content(SourceCollectedAt,Id) INCLUDE (CreatedAt,LastModifiedAt,DeletedAt,IsDeleted,ContentTypeId,LanguageId,ContentStatusId);
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID(N'dbo.TseFaq') AND name=N'IX_TseFaq_CreatedDate')
    CREATE INDEX IX_TseFaq_CreatedDate ON dbo.TseFaq(CreatedDate,Id) INCLUDE (ResourceCode,FaqId);
GO
