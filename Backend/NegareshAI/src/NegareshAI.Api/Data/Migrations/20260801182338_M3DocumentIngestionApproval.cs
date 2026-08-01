using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace NegareshAI.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class M3DocumentIngestionApproval : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ExpertReviewNote",
                table: "DocumentVersions",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "ExpertReviewedAtUtc",
                table: "DocumentVersions",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ExpertReviewedByUserId",
                table: "DocumentVersions",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ExtractedFieldsJson",
                table: "DocumentVersions",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ExtractionMetadataJson",
                table: "DocumentVersions",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsRagPublished",
                table: "DocumentVersions",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<int>(
                name: "LifecycleStatus",
                table: "DocumentVersions",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "ManagerReviewNote",
                table: "DocumentVersions",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "ManagerReviewedAtUtc",
                table: "DocumentVersions",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ManagerReviewedByUserId",
                table: "DocumentVersions",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "RagPublishedAtUtc",
                table: "DocumentVersions",
                type: "datetime2",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "DocumentVersionFiles",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    DocumentVersionId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    FileId = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    FileName = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ContentType = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    SortOrder = table.Column<int>(type: "int", nullable: false),
                    PageNumber = table.Column<int>(type: "int", nullable: true),
                    Sha256 = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Size = table.Column<long>(type: "bigint", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DocumentVersionFiles", x => x.Id);
                    table.ForeignKey(
                        name: "FK_DocumentVersionFiles_DocumentVersions_DocumentVersionId",
                        column: x => x.DocumentVersionId,
                        principalTable: "DocumentVersions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_DocumentVersions_DocumentId_LifecycleStatus",
                table: "DocumentVersions",
                columns: new[] { "DocumentId", "LifecycleStatus" });

            migrationBuilder.CreateIndex(
                name: "IX_DocumentVersionFiles_DocumentVersionId_PageNumber",
                table: "DocumentVersionFiles",
                columns: new[] { "DocumentVersionId", "PageNumber" },
                unique: true,
                filter: "[PageNumber] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_DocumentVersionFiles_DocumentVersionId_SortOrder",
                table: "DocumentVersionFiles",
                columns: new[] { "DocumentVersionId", "SortOrder" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "DocumentVersionFiles");

            migrationBuilder.DropIndex(
                name: "IX_DocumentVersions_DocumentId_LifecycleStatus",
                table: "DocumentVersions");

            migrationBuilder.DropColumn(
                name: "ExpertReviewNote",
                table: "DocumentVersions");

            migrationBuilder.DropColumn(
                name: "ExpertReviewedAtUtc",
                table: "DocumentVersions");

            migrationBuilder.DropColumn(
                name: "ExpertReviewedByUserId",
                table: "DocumentVersions");

            migrationBuilder.DropColumn(
                name: "ExtractedFieldsJson",
                table: "DocumentVersions");

            migrationBuilder.DropColumn(
                name: "ExtractionMetadataJson",
                table: "DocumentVersions");

            migrationBuilder.DropColumn(
                name: "IsRagPublished",
                table: "DocumentVersions");

            migrationBuilder.DropColumn(
                name: "LifecycleStatus",
                table: "DocumentVersions");

            migrationBuilder.DropColumn(
                name: "ManagerReviewNote",
                table: "DocumentVersions");

            migrationBuilder.DropColumn(
                name: "ManagerReviewedAtUtc",
                table: "DocumentVersions");

            migrationBuilder.DropColumn(
                name: "ManagerReviewedByUserId",
                table: "DocumentVersions");

            migrationBuilder.DropColumn(
                name: "RagPublishedAtUtc",
                table: "DocumentVersions");
        }
    }
}
