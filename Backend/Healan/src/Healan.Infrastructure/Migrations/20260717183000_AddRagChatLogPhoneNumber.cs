using Healan.Infrastructure.Context;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Healan.Infrastructure.Migrations
{
    [DbContext(typeof(ApplicationDbContext))]
    [Migration("20260717183000_AddRagChatLogPhoneNumber")]
    public partial class AddRagChatLogPhoneNumber : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
IF COL_LENGTH(N'dbo.RagChatLogs', N'PhoneNumber') IS NULL
    ALTER TABLE [RagChatLogs] ADD [PhoneNumber] nvarchar(11) NULL;

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_RagChatLogs_PhoneNumber_CreatedAt' AND object_id = OBJECT_ID(N'dbo.RagChatLogs'))
    CREATE INDEX [IX_RagChatLogs_PhoneNumber_CreatedAt] ON [RagChatLogs] ([PhoneNumber], [CreatedAt]);
");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_RagChatLogs_PhoneNumber_CreatedAt' AND object_id = OBJECT_ID(N'dbo.RagChatLogs'))
    DROP INDEX [IX_RagChatLogs_PhoneNumber_CreatedAt] ON [RagChatLogs];
IF COL_LENGTH(N'dbo.RagChatLogs', N'PhoneNumber') IS NOT NULL
    ALTER TABLE [RagChatLogs] DROP COLUMN [PhoneNumber];
");
        }
    }
}
