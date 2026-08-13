using Microsoft.EntityFrameworkCore;

namespace TSEAI.Infrastructure.Persistence;

public static class AlertSchemaInitializer
{
    public static async Task EnsureAsync(ApplicationDbContext db, CancellationToken ct = default)
    {
        const string sql = """
IF OBJECT_ID(N'[dbo].[AlertRules]', N'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[AlertRules](
        [Id] uniqueidentifier NOT NULL CONSTRAINT [PK_AlertRules] PRIMARY KEY,
        [OwnerUserId] nvarchar(128) NOT NULL,
        [SavedFilterId] uniqueidentifier NOT NULL,
        [Name] nvarchar(100) NOT NULL,
        [IsEnabled] bit NOT NULL CONSTRAINT [DF_AlertRules_IsEnabled] DEFAULT(1),
        [CooldownSeconds] int NOT NULL CONSTRAINT [DF_AlertRules_Cooldown] DEFAULT(300),
        [FollowLatestVersion] bit NOT NULL CONSTRAINT [DF_AlertRules_FollowLatest] DEFAULT(1),
        [PinnedFilterVersion] int NULL,
        [CreatedAtUtc] datetime2 NOT NULL,
        [UpdatedAtUtc] datetime2 NOT NULL,
        [LastTriggeredAtUtc] datetime2 NULL,
        [IsDeleted] bit NOT NULL CONSTRAINT [DF_AlertRules_IsDeleted] DEFAULT(0),
        [DeletedAtUtc] datetime2 NULL,
        [RowVersion] rowversion NOT NULL,
        CONSTRAINT [FK_AlertRules_SavedFilters] FOREIGN KEY([SavedFilterId]) REFERENCES [dbo].[SavedFilters]([Id])
    );
    CREATE INDEX [IX_AlertRules_Owner_Enabled] ON [dbo].[AlertRules]([OwnerUserId], [IsDeleted], [IsEnabled]);
    CREATE INDEX [IX_AlertRules_Filter] ON [dbo].[AlertRules]([SavedFilterId], [IsDeleted]);
END;

IF OBJECT_ID(N'[dbo].[AlertEvents]', N'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[AlertEvents](
        [Id] uniqueidentifier NOT NULL CONSTRAINT [PK_AlertEvents] PRIMARY KEY,
        [AlertRuleId] uniqueidentifier NOT NULL,
        [OwnerUserId] nvarchar(128) NOT NULL,
        [SavedFilterId] uniqueidentifier NOT NULL,
        [FilterVersion] int NOT NULL,
        [InsCode] bigint NOT NULL,
        [SymbolCode] nvarchar(64) NULL,
        [Symbol] nvarchar(80) NOT NULL,
        [SymbolName] nvarchar(256) NOT NULL,
        [AlertName] nvarchar(100) NOT NULL,
        [FilterName] nvarchar(80) NOT NULL,
        [TsetmcCode] nvarchar(max) NOT NULL,
        [PersianExplanation] nvarchar(4000) NOT NULL,
        [Message] nvarchar(2000) NOT NULL,
        [LastPrice] decimal(38,10) NOT NULL,
        [ClosingPrice] decimal(38,10) NOT NULL,
        [TradeVolume] bigint NOT NULL,
        [TradeValue] decimal(38,10) NOT NULL,
        [TradingDate] int NOT NULL,
        [TriggeredAtUtc] datetime2 NOT NULL,
        [ReadAtUtc] datetime2 NULL,
        CONSTRAINT [FK_AlertEvents_AlertRules] FOREIGN KEY([AlertRuleId]) REFERENCES [dbo].[AlertRules]([Id])
    );
    CREATE INDEX [IX_AlertEvents_Owner_Triggered] ON [dbo].[AlertEvents]([OwnerUserId], [TriggeredAtUtc] DESC);
    CREATE INDEX [IX_AlertEvents_Owner_Read] ON [dbo].[AlertEvents]([OwnerUserId], [ReadAtUtc], [TriggeredAtUtc] DESC);
    CREATE INDEX [IX_AlertEvents_Rule_Symbol] ON [dbo].[AlertEvents]([AlertRuleId], [InsCode], [TriggeredAtUtc] DESC);
END;

IF OBJECT_ID(N'[dbo].[AlertOutbox]', N'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[AlertOutbox](
        [Id] uniqueidentifier NOT NULL CONSTRAINT [PK_AlertOutbox] PRIMARY KEY,
        [AlertEventId] uniqueidentifier NOT NULL,
        [EventType] nvarchar(100) NOT NULL,
        [PayloadJson] nvarchar(max) NOT NULL,
        [CreatedAtUtc] datetime2 NOT NULL,
        [PublishedAtUtc] datetime2 NULL,
        [AttemptCount] int NOT NULL CONSTRAINT [DF_AlertOutbox_Attempts] DEFAULT(0),
        [LastAttemptAtUtc] datetime2 NULL,
        [LastError] nvarchar(2000) NULL,
        CONSTRAINT [UQ_AlertOutbox_Event] UNIQUE([AlertEventId])
    );
    CREATE INDEX [IX_AlertOutbox_Pending] ON [dbo].[AlertOutbox]([PublishedAtUtc], [CreatedAtUtc]);
END;
""";
        await db.Database.ExecuteSqlRawAsync(sql, ct);
    }
}
