using Healan.Infrastructure.Context;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Healan.Infrastructure.Migrations
{
    [DbContext(typeof(ApplicationDbContext))]
    [Migration("20260720221500_AddRagSttModel")]
    public partial class AddRagSttModel : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
IF COL_LENGTH(N'dbo.RagSettings', N'SttModel') IS NULL
    ALTER TABLE [RagSettings] ADD [SttModel] nvarchar(200) NOT NULL CONSTRAINT [DF_RagSettings_SttModel] DEFAULT N'small';
");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
IF COL_LENGTH(N'dbo.RagSettings', N'SttModel') IS NOT NULL
    ALTER TABLE [RagSettings] DROP COLUMN [SttModel];
");
        }
    }
}
