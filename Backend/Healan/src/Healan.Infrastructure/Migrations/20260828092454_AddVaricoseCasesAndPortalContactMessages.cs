using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Healan.Infrastructure.Migrations;

public partial class AddVaricoseCasesAndPortalContactMessages : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(
            name: "PortalContactMessages",
            columns: table => new
            {
                PortalContactMessageId = table.Column<long>(type: "bigint", nullable: false)
                    .Annotation("SqlServer:Identity", "1, 1"),
                FirstName = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                LastName = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                Mobile = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                Message = table.Column<string>(type: "nvarchar(3000)", maxLength: 3000, nullable: false),
                IsRead = table.Column<bool>(type: "bit", nullable: false),
                AdminNote = table.Column<string>(type: "nvarchar(1500)", maxLength: 1500, nullable: true),
                ReadAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                CreatedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                DepartmentId = table.Column<short>(type: "smallint", nullable: false),
                LastModifiedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                LastModifiedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                DeletedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                DeletedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                IsDeleted = table.Column<bool>(type: "bit", nullable: false)
            },
            constraints: table => table.PrimaryKey("PK_PortalContactMessages", x => x.PortalContactMessageId));

        migrationBuilder.CreateTable(
            name: "VaricoseCases",
            columns: table => new
            {
                VaricoseCaseId = table.Column<long>(type: "bigint", nullable: false)
                    .Annotation("SqlServer:Identity", "1, 1"),
                Title = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                Description = table.Column<string>(type: "nvarchar(1500)", maxLength: 1500, nullable: true),
                BeforeImageFileId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                BeforeImageUrl = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: false),
                AfterImageFileId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                AfterImageUrl = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: false),
                TreatmentLabel = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                SortOrder = table.Column<int>(type: "int", nullable: false),
                HasPublicationConsent = table.Column<bool>(type: "bit", nullable: false),
                IsPublished = table.Column<bool>(type: "bit", nullable: false),
                CreatedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                DepartmentId = table.Column<short>(type: "smallint", nullable: false),
                LastModifiedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                LastModifiedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                DeletedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                DeletedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                IsDeleted = table.Column<bool>(type: "bit", nullable: false)
            },
            constraints: table => table.PrimaryKey("PK_VaricoseCases", x => x.VaricoseCaseId));

        migrationBuilder.CreateIndex(
            name: "IX_PortalContactMessages_IsRead_CreatedAt",
            table: "PortalContactMessages",
            columns: new[] { "IsRead", "CreatedAt" });
        migrationBuilder.CreateIndex(
            name: "IX_PortalContactMessages_Mobile_CreatedAt",
            table: "PortalContactMessages",
            columns: new[] { "Mobile", "CreatedAt" });
        migrationBuilder.CreateIndex(
            name: "IX_VaricoseCases_IsPublished_SortOrder",
            table: "VaricoseCases",
            columns: new[] { "IsPublished", "SortOrder" });
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(name: "PortalContactMessages");
        migrationBuilder.DropTable(name: "VaricoseCases");
    }
}
