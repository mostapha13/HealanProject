using Healan.Infrastructure.Context;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Healan.Infrastructure.Migrations
{
    [DbContext(typeof(ApplicationDbContext))]
    [Migration("20260717150000_AddRagQuotaFields")]
    public partial class AddRagQuotaFields : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
IF COL_LENGTH(N'dbo.RagSettings', N'GuestDailyLimit') IS NULL
    ALTER TABLE [RagSettings] ADD [GuestDailyLimit] int NOT NULL CONSTRAINT [DF_RagSettings_GuestDailyLimit] DEFAULT 10;

IF COL_LENGTH(N'dbo.RagSettings', N'AuthenticatedDailyLimit') IS NULL
    ALTER TABLE [RagSettings] ADD [AuthenticatedDailyLimit] int NOT NULL CONSTRAINT [DF_RagSettings_AuthenticatedDailyLimit] DEFAULT 200;

IF COL_LENGTH(N'dbo.RagChatLogs', N'GuestKey') IS NULL
    ALTER TABLE [RagChatLogs] ADD [GuestKey] nvarchar(64) NULL;

IF COL_LENGTH(N'dbo.RagChatLogs', N'IdentityUserId') IS NULL
    ALTER TABLE [RagChatLogs] ADD [IdentityUserId] uniqueidentifier NULL;

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_RagChatLogs_GuestKey_CreatedAt' AND object_id = OBJECT_ID(N'dbo.RagChatLogs'))
    CREATE INDEX [IX_RagChatLogs_GuestKey_CreatedAt] ON [RagChatLogs] ([GuestKey], [CreatedAt]);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_RagChatLogs_IdentityUserId_CreatedAt' AND object_id = OBJECT_ID(N'dbo.RagChatLogs'))
    CREATE INDEX [IX_RagChatLogs_IdentityUserId_CreatedAt] ON [RagChatLogs] ([IdentityUserId], [CreatedAt]);
");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_RagChatLogs_GuestKey_CreatedAt' AND object_id = OBJECT_ID(N'dbo.RagChatLogs'))
    DROP INDEX [IX_RagChatLogs_GuestKey_CreatedAt] ON [RagChatLogs];
IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_RagChatLogs_IdentityUserId_CreatedAt' AND object_id = OBJECT_ID(N'dbo.RagChatLogs'))
    DROP INDEX [IX_RagChatLogs_IdentityUserId_CreatedAt] ON [RagChatLogs];
IF COL_LENGTH(N'dbo.RagChatLogs', N'GuestKey') IS NOT NULL
    ALTER TABLE [RagChatLogs] DROP COLUMN [GuestKey];
IF COL_LENGTH(N'dbo.RagChatLogs', N'IdentityUserId') IS NOT NULL
    ALTER TABLE [RagChatLogs] DROP COLUMN [IdentityUserId];
IF COL_LENGTH(N'dbo.RagSettings', N'GuestDailyLimit') IS NOT NULL
    ALTER TABLE [RagSettings] DROP COLUMN [GuestDailyLimit];
IF COL_LENGTH(N'dbo.RagSettings', N'AuthenticatedDailyLimit') IS NOT NULL
    ALTER TABLE [RagSettings] DROP COLUMN [AuthenticatedDailyLimit];
");
        }
    }
}
