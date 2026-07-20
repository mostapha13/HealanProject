using Healan.Infrastructure.Context;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Healan.Infrastructure.Migrations
{
    [DbContext(typeof(ApplicationDbContext))]
    [Migration("20260720233000_AddRagSaveChatLogs")]
    public partial class AddRagSaveChatLogs : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
IF COL_LENGTH(N'dbo.RagSettings', N'SaveChatLogs') IS NULL
    ALTER TABLE [RagSettings] ADD [SaveChatLogs] bit NOT NULL CONSTRAINT [DF_RagSettings_SaveChatLogs] DEFAULT CAST(1 AS bit);
");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
IF COL_LENGTH(N'dbo.RagSettings', N'SaveChatLogs') IS NOT NULL
    ALTER TABLE [RagSettings] DROP COLUMN [SaveChatLogs];
");
        }
    }
}
