using Healan.Infrastructure.Context;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Healan.Infrastructure.Migrations;

[DbContext(typeof(ApplicationDbContext))]
[Migration("20260723120000_AddPortalSeoAndBlogMeta")]
public partial class AddPortalSeoAndBlogMeta : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<string>(
            name: "MetaTitle",
            table: "BlogPosts",
            type: "nvarchar(300)",
            maxLength: 300,
            nullable: true);

        migrationBuilder.AddColumn<string>(
            name: "MetaDescription",
            table: "BlogPosts",
            type: "nvarchar(1000)",
            maxLength: 1000,
            nullable: true);

        migrationBuilder.AddColumn<string>(
            name: "OgImageUrl",
            table: "BlogPosts",
            type: "nvarchar(1000)",
            maxLength: 1000,
            nullable: true);

        migrationBuilder.CreateTable(
            name: "PortalSeoPages",
            columns: table => new
            {
                PortalSeoPageId = table.Column<long>(type: "bigint", nullable: false)
                    .Annotation("SqlServer:Identity", "1, 1"),
                PageKey = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                Path = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: false),
                Title = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: false),
                Description = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                Keywords = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                OgTitle = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: true),
                OgDescription = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                OgImageUrl = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                OgImageFileId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                CanonicalUrl = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                Robots = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false, defaultValue: "index,follow"),
                JsonLdExtra = table.Column<string>(type: "nvarchar(max)", nullable: true),
                IsActive = table.Column<bool>(type: "bit", nullable: false, defaultValue: true),
                SortOrder = table.Column<int>(type: "int", nullable: false, defaultValue: 0),
                CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "SYSUTCDATETIME()"),
                CreatedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: false, defaultValue: Guid.Empty),
                LastModifiedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                LastModifiedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                IsDeleted = table.Column<bool>(type: "bit", nullable: false, defaultValue: false),
                DeletedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                DeletedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                DepartmentId = table.Column<short>(type: "smallint", nullable: false, defaultValue: (short)0),
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_PortalSeoPages", x => x.PortalSeoPageId);
            });

        migrationBuilder.CreateIndex(
            name: "IX_PortalSeoPages_PageKey",
            table: "PortalSeoPages",
            column: "PageKey",
            unique: true);

        migrationBuilder.CreateIndex(
            name: "IX_PortalSeoPages_Path",
            table: "PortalSeoPages",
            column: "Path");

        migrationBuilder.CreateIndex(
            name: "IX_PortalSeoPages_IsActive_SortOrder",
            table: "PortalSeoPages",
            columns: new[] { "IsActive", "SortOrder" });

        migrationBuilder.Sql(@"
IF NOT EXISTS (SELECT 1 FROM PortalSeoPages WHERE PageKey = N'home')
INSERT INTO PortalSeoPages (PageKey, Path, Title, Description, Keywords, OgTitle, OgDescription, Robots, IsActive, SortOrder, CreatedAt, CreatedBy, IsDeleted, DepartmentId)
VALUES (
  N'home', N'/',
  N'دکتر شهرویی | متخصص قلب و عروق',
  N'مطب تخصصی قلب و عروق دکتر شهرویی — معاینه، اکو، نوار قلب و پیگیری بیماران قلبی.',
  N'متخصص قلب, دکتر شهرویی, اکوکاردیوگرافی, نوبت قلب',
  N'دکتر شهرویی | متخصص قلب و عروق',
  N'مراقبت تخصصی قلب و عروق با پذیرش منظم و پیگیری بیمار.',
  N'index,follow', 1, 1, SYSUTCDATETIME(), '00000000-0000-0000-0000-000000000000', 0, 0
);

IF NOT EXISTS (SELECT 1 FROM PortalSeoPages WHERE PageKey = N'blog')
INSERT INTO PortalSeoPages (PageKey, Path, Title, Description, Keywords, OgTitle, OgDescription, Robots, IsActive, SortOrder, CreatedAt, CreatedBy, IsDeleted, DepartmentId)
VALUES (
  N'blog', N'/blog',
  N'بلاگ تخصصی قلب | دکتر شهرویی',
  N'مقالات و راهنمای سلامت قلب، پیشگیری و مراقبت‌های تخصصی.',
  N'بلاگ قلب, سلامت قلب, مقالات پزشکی',
  N'بلاگ تخصصی قلب | دکتر شهرویی',
  N'مطالب آموزشی درباره سلامت قلب و عروق.',
  N'index,follow', 1, 2, SYSUTCDATETIME(), '00000000-0000-0000-0000-000000000000', 0, 0
);
");
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(name: "PortalSeoPages");
        migrationBuilder.DropColumn(name: "MetaTitle", table: "BlogPosts");
        migrationBuilder.DropColumn(name: "MetaDescription", table: "BlogPosts");
        migrationBuilder.DropColumn(name: "OgImageUrl", table: "BlogPosts");
    }
}
