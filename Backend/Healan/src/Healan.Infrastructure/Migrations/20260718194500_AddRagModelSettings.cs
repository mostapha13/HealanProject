using Healan.Infrastructure.Context;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Healan.Infrastructure.Migrations
{
    [DbContext(typeof(ApplicationDbContext))]
    [Migration("20260718194500_AddRagModelSettings")]
    public partial class AddRagModelSettings : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
IF COL_LENGTH(N'dbo.RagSettings', N'EmbeddingModel') IS NULL
    ALTER TABLE [RagSettings] ADD [EmbeddingModel] nvarchar(200) NOT NULL CONSTRAINT [DF_RagSettings_EmbeddingModel] DEFAULT N'heydariAI/persian-embeddings';

IF COL_LENGTH(N'dbo.RagSettings', N'SummarizeModel') IS NULL
    ALTER TABLE [RagSettings] ADD [SummarizeModel] nvarchar(200) NOT NULL CONSTRAINT [DF_RagSettings_SummarizeModel] DEFAULT N'qwen2.5:3b';
");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
IF COL_LENGTH(N'dbo.RagSettings', N'EmbeddingModel') IS NOT NULL
    ALTER TABLE [RagSettings] DROP COLUMN [EmbeddingModel];
IF COL_LENGTH(N'dbo.RagSettings', N'SummarizeModel') IS NOT NULL
    ALTER TABLE [RagSettings] DROP COLUMN [SummarizeModel];
");
        }
    }
}
