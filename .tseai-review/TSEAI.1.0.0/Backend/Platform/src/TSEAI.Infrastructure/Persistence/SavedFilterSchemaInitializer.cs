using Microsoft.EntityFrameworkCore;

namespace TSEAI.Infrastructure.Persistence;

public static class SavedFilterSchemaInitializer
{
    public static async Task EnsureAsync(ApplicationDbContext db, CancellationToken ct = default)
    {
        const string sql = """
IF OBJECT_ID(N'[dbo].[SavedFilters]', N'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[SavedFilters](
        [Id] uniqueidentifier NOT NULL CONSTRAINT [PK_SavedFilters] PRIMARY KEY,
        [OwnerUserId] nvarchar(128) NOT NULL,
        [Name] nvarchar(80) NOT NULL,
        [NormalizedName] nvarchar(80) NOT NULL,
        [Description] nvarchar(500) NULL,
        [IsFavorite] bit NOT NULL CONSTRAINT [DF_SavedFilters_IsFavorite] DEFAULT(0),
        [CurrentTsetmcCode] nvarchar(max) NOT NULL,
        [CurrentPersianExplanation] nvarchar(4000) NOT NULL,
        [DependenciesJson] nvarchar(max) NOT NULL,
        [CurrentVersion] int NOT NULL,
        [IsDeleted] bit NOT NULL CONSTRAINT [DF_SavedFilters_IsDeleted] DEFAULT(0),
        [CreatedAtUtc] datetime2 NOT NULL,
        [UpdatedAtUtc] datetime2 NOT NULL,
        [DeletedAtUtc] datetime2 NULL,
        [RowVersion] rowversion NOT NULL
    );
    CREATE INDEX [IX_SavedFilters_Owner_Updated] ON [dbo].[SavedFilters]([OwnerUserId], [IsDeleted], [UpdatedAtUtc] DESC);
    CREATE INDEX [IX_SavedFilters_Owner_Favorite] ON [dbo].[SavedFilters]([OwnerUserId], [IsDeleted], [IsFavorite]);
    CREATE UNIQUE INDEX [UX_SavedFilters_Owner_Name_Active] ON [dbo].[SavedFilters]([OwnerUserId], [NormalizedName]) WHERE [IsDeleted] = 0;
END;

IF OBJECT_ID(N'[dbo].[SavedFilterVersions]', N'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[SavedFilterVersions](
        [Id] uniqueidentifier NOT NULL CONSTRAINT [PK_SavedFilterVersions] PRIMARY KEY,
        [SavedFilterId] uniqueidentifier NOT NULL,
        [Version] int NOT NULL,
        [TsetmcCode] nvarchar(max) NOT NULL,
        [PersianExplanation] nvarchar(4000) NOT NULL,
        [DependenciesJson] nvarchar(max) NOT NULL,
        [SourceConversationId] nvarchar(100) NULL,
        [ChangeType] nvarchar(32) NOT NULL,
        [ChangeNote] nvarchar(500) NULL,
        [CreatedByUserId] nvarchar(128) NOT NULL,
        [CreatedAtUtc] datetime2 NOT NULL,
        CONSTRAINT [FK_SavedFilterVersions_SavedFilters] FOREIGN KEY([SavedFilterId]) REFERENCES [dbo].[SavedFilters]([Id]) ON DELETE CASCADE,
        CONSTRAINT [UQ_SavedFilterVersions_Filter_Version] UNIQUE([SavedFilterId], [Version])
    );
    CREATE INDEX [IX_SavedFilterVersions_Filter_Created] ON [dbo].[SavedFilterVersions]([SavedFilterId], [CreatedAtUtc] DESC);
END;
""";
        await db.Database.ExecuteSqlRawAsync(sql, ct);
    }
}
