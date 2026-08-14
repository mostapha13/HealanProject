using Healan.Infrastructure.Context;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Healan.Infrastructure.Migrations
{
    [DbContext(typeof(ApplicationDbContext))]
    [Migration("20260814223000_AddRagSummarizeEnabled")]
    public partial class AddRagSummarizeEnabled : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
IF COL_LENGTH(N'dbo.RagSettings', N'SummarizeEnabled') IS NULL
    ALTER TABLE [RagSettings] ADD [SummarizeEnabled] bit NOT NULL CONSTRAINT [DF_RagSettings_SummarizeEnabled] DEFAULT CAST(1 AS bit);
");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
IF COL_LENGTH(N'dbo.RagSettings', N'SummarizeEnabled') IS NOT NULL
    ALTER TABLE [RagSettings] DROP COLUMN [SummarizeEnabled];
");
        }
    }
}
