[CmdletBinding(SupportsShouldProcess)]
param(
    [ValidateNotNullOrEmpty()]
    [string]$Server = 'localhost,14330',
    [ValidatePattern('^[A-Za-z0-9_]+$')]
    [string]$Database = 'Ai'
)

$ErrorActionPreference = 'Stop'
$connectionString = "Server=$Server;Database=$Database;Integrated Security=True;TrustServerCertificate=True;Connection Timeout=10"
$connection = New-Object System.Data.SqlClient.SqlConnection $connectionString

try {
    $connection.Open()
    $command = $connection.CreateCommand()
    $command.CommandTimeout = 120
    $command.CommandText = @"
IF OBJECT_ID(N'dbo.Content', N'U') IS NULL
    THROW 51000, 'dbo.Content was not found in the selected database.', 1;

IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE object_id = OBJECT_ID(N'dbo.Content')
      AND name = N'IX_Content_Id'
)
    CREATE NONCLUSTERED INDEX IX_Content_Id ON dbo.Content(Id);

IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE object_id = OBJECT_ID(N'dbo.Content')
      AND name = N'IX_Content_LatestPublished'
)
    CREATE NONCLUSTERED INDEX IX_Content_LatestPublished
        ON dbo.Content(IsDeleted, ContentStatusId, PublishAt DESC, Id DESC)
        INCLUDE(ContentTypeId, LanguageId, DepartmentId);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID(N'dbo.Content') AND name=N'IX_Content_ContentTypeId')
    CREATE NONCLUSTERED INDEX IX_Content_ContentTypeId ON dbo.Content(ContentTypeId);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID(N'dbo.Content') AND name=N'IX_Content_LanguageId')
    CREATE NONCLUSTERED INDEX IX_Content_LanguageId ON dbo.Content(LanguageId);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID(N'dbo.Content') AND name=N'IX_Content_ContentStatusId')
    CREATE NONCLUSTERED INDEX IX_Content_ContentStatusId ON dbo.Content(ContentStatusId);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID(N'dbo.Content') AND name=N'IX_Content_DepartmentId')
    CREATE NONCLUSTERED INDEX IX_Content_DepartmentId ON dbo.Content(DepartmentId);

IF OBJECT_ID(N'dbo.Instrument', N'U') IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID(N'dbo.Instrument') AND name=N'IX_Instrument_InstrumentID_Valid_Source')
    CREATE NONCLUSTERED INDEX IX_Instrument_InstrumentID_Valid_Source
        ON dbo.Instrument(InstrumentID, Valid DESC, SourceCollectedAt DESC)
        INCLUDE(InsCode, LVal18AFC, LVal30);

IF OBJECT_ID(N'dbo.Instrument', N'U') IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID(N'dbo.Instrument') AND name=N'IX_Instrument_InsCode_Valid_Source')
    CREATE NONCLUSTERED INDEX IX_Instrument_InsCode_Valid_Source
        ON dbo.Instrument(InsCode, Valid DESC, SourceCollectedAt DESC)
        INCLUDE(InstrumentID, LVal18AFC, LVal30);

IF OBJECT_ID(N'dbo.Instrument', N'U') IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID(N'dbo.Instrument') AND name=N'IX_Instrument_LVal18AFC_Valid_Source')
    CREATE NONCLUSTERED INDEX IX_Instrument_LVal18AFC_Valid_Source
        ON dbo.Instrument(LVal18AFC, Valid DESC, SourceCollectedAt DESC)
        INCLUDE(InstrumentID, InsCode, LVal30, CIsin);

IF OBJECT_ID(N'dbo.Instrument', N'U') IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID(N'dbo.Instrument') AND name=N'IX_Instrument_LVal30_Valid_Source')
    CREATE NONCLUSTERED INDEX IX_Instrument_LVal30_Valid_Source
        ON dbo.Instrument(LVal30, Valid DESC, SourceCollectedAt DESC)
        INCLUDE(InstrumentID, InsCode, LVal18AFC, CIsin);

IF OBJECT_ID(N'dbo.Instrument', N'U') IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID(N'dbo.Instrument') AND name=N'IX_Instrument_CIsin_Valid_Source')
    CREATE NONCLUSTERED INDEX IX_Instrument_CIsin_Valid_Source
        ON dbo.Instrument(CIsin, Valid DESC, SourceCollectedAt DESC)
        INCLUDE(InstrumentID, InsCode, LVal18AFC, LVal30);

IF OBJECT_ID(N'dbo.ClientType', N'U') IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID(N'dbo.ClientType') AND name=N'IX_ClientType_InsCode_Source')
    CREATE NONCLUSTERED INDEX IX_ClientType_InsCode_Source
        ON dbo.ClientType(InsCode, SourceCollectedAt DESC, Id DESC);

IF OBJECT_ID(N'dbo.Cashmarket', N'U') IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID(N'dbo.Cashmarket') AND name=N'IX_Cashmarket_InstrumentId_Source')
    CREATE NONCLUSTERED INDEX IX_Cashmarket_InstrumentId_Source
        ON dbo.Cashmarket(Instrumentid, SourceCollectedAt DESC);

IF OBJECT_ID(N'dbo.OrderBookCurrent', N'U') IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID(N'dbo.OrderBookCurrent') AND name=N'IX_OrderBookCurrent_InsCode_Level_Source')
    CREATE NONCLUSTERED INDEX IX_OrderBookCurrent_InsCode_Level_Source
        ON dbo.OrderBookCurrent(InsCode, Level, SourceCollectedAt DESC);
"@

    $applied = $false
    if ($PSCmdlet.ShouldProcess("$Server/$Database/dbo.Content", 'Ensure read-path indexes')) {
        [void]$command.ExecuteNonQuery()
        $applied = $true
    }

    [pscustomobject]@{
        Server = $Server
        Database = $Database
        Indexes = @(
            'IX_Content_Id',
            'IX_Content_LatestPublished',
            'IX_Content_ContentTypeId',
            'IX_Content_LanguageId',
            'IX_Content_ContentStatusId',
            'IX_Content_DepartmentId',
            'IX_Instrument_InstrumentID_Valid_Source',
            'IX_Instrument_InsCode_Valid_Source',
            'IX_Instrument_LVal18AFC_Valid_Source',
            'IX_Instrument_LVal30_Valid_Source',
            'IX_Instrument_CIsin_Valid_Source',
            'IX_ClientType_InsCode_Source',
            'IX_Cashmarket_InstrumentId_Source',
            'IX_OrderBookCurrent_InsCode_Level_Source'
        )
        Applied = $applied
    } | ConvertTo-Json
}
finally {
    if ($connection.State -ne [System.Data.ConnectionState]::Closed) {
        $connection.Close()
    }
    $connection.Dispose()
}
