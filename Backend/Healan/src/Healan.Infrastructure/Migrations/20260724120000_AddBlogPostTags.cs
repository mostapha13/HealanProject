using Healan.Infrastructure.Context;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Healan.Infrastructure.Migrations;

[DbContext(typeof(ApplicationDbContext))]
[Migration("20260724120000_AddBlogPostTags")]
public partial class AddBlogPostTags : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql(@"
IF COL_LENGTH(N'dbo.BlogPosts', N'Tags') IS NULL
    ALTER TABLE [BlogPosts] ADD [Tags] nvarchar(500) NULL;
");
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql(@"
IF COL_LENGTH(N'dbo.BlogPosts', N'Tags') IS NOT NULL
    ALTER TABLE [BlogPosts] DROP COLUMN [Tags];
");
    }
}
