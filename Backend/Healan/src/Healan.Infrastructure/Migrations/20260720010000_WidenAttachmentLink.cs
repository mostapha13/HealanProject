using Healan.Infrastructure.Context;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Healan.Infrastructure.Migrations
{
    [DbContext(typeof(ApplicationDbContext))]
    [Migration("20260720010000_WidenAttachmentLink")]
    public partial class WidenAttachmentLink : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Gateway download URLs can exceed the old nvarchar(100) limit and caused
            // prescription attachment inserts to fail (AttachmentId never saved).
            migrationBuilder.Sql(@"
IF COL_LENGTH(N'dbo.Attachments', N'Link') IS NOT NULL
    ALTER TABLE [Attachments] ALTER COLUMN [Link] nvarchar(500) NOT NULL;
");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
IF COL_LENGTH(N'dbo.Attachments', N'Link') IS NOT NULL
    ALTER TABLE [Attachments] ALTER COLUMN [Link] nvarchar(100) NOT NULL;
");
        }
    }
}
