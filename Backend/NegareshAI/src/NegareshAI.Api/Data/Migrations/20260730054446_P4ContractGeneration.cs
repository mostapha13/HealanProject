using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace NegareshAI.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class P4ContractGeneration : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "Name",
                table: "ContractTemplates",
                type: "nvarchar(450)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)");

            migrationBuilder.AddColumn<DateTime>(
                name: "CreatedAtUtc",
                table: "ContractTemplates",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<string>(
                name: "CreatedByUserId",
                table: "ContractTemplates",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Description",
                table: "ContractTemplates",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "LetterheadFileId",
                table: "ContractTemplates",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "LogoFileId",
                table: "ContractTemplates",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "Version",
                table: "ContractTemplates",
                type: "int",
                nullable: false,
                defaultValue: 1);

            migrationBuilder.CreateTable(
                name: "ContractGenerationRuns",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    OrganizationId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ContractId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    BaseDocumentVersionId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ContractTemplateId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UserInstruction = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ChangeSetJson = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    SourceSnapshotJson = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CalculationSnapshotJson = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    DiffJson = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ClarificationQuestionsJson = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    GeneratedDocxFileId = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    GeneratedPdfFileId = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Status = table.Column<int>(type: "int", nullable: false),
                    ModelId = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    PromptVersion = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CreatedByUserId = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ReviewedByUserId = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ReviewComment = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CreatedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ReviewedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ContractGenerationRuns", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ContractGenerationRuns_ContractTemplates_ContractTemplateId",
                        column: x => x.ContractTemplateId,
                        principalTable: "ContractTemplates",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ContractGenerationRuns_Contracts_ContractId",
                        column: x => x.ContractId,
                        principalTable: "Contracts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ContractGenerationRuns_DocumentVersions_BaseDocumentVersionId",
                        column: x => x.BaseDocumentVersionId,
                        principalTable: "DocumentVersions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ContractTemplates_OrganizationId_Name_Version",
                table: "ContractTemplates",
                columns: new[] { "OrganizationId", "Name", "Version" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ContractGenerationRuns_BaseDocumentVersionId",
                table: "ContractGenerationRuns",
                column: "BaseDocumentVersionId");

            migrationBuilder.CreateIndex(
                name: "IX_ContractGenerationRuns_ContractId",
                table: "ContractGenerationRuns",
                column: "ContractId");

            migrationBuilder.CreateIndex(
                name: "IX_ContractGenerationRuns_ContractTemplateId",
                table: "ContractGenerationRuns",
                column: "ContractTemplateId");

            migrationBuilder.CreateIndex(
                name: "IX_ContractGenerationRuns_OrganizationId_CreatedAtUtc",
                table: "ContractGenerationRuns",
                columns: new[] { "OrganizationId", "CreatedAtUtc" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ContractGenerationRuns");

            migrationBuilder.DropIndex(
                name: "IX_ContractTemplates_OrganizationId_Name_Version",
                table: "ContractTemplates");

            migrationBuilder.DropColumn(
                name: "CreatedAtUtc",
                table: "ContractTemplates");

            migrationBuilder.DropColumn(
                name: "CreatedByUserId",
                table: "ContractTemplates");

            migrationBuilder.DropColumn(
                name: "Description",
                table: "ContractTemplates");

            migrationBuilder.DropColumn(
                name: "LetterheadFileId",
                table: "ContractTemplates");

            migrationBuilder.DropColumn(
                name: "LogoFileId",
                table: "ContractTemplates");

            migrationBuilder.DropColumn(
                name: "Version",
                table: "ContractTemplates");

            migrationBuilder.AlterColumn<string>(
                name: "Name",
                table: "ContractTemplates",
                type: "nvarchar(max)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(450)");
        }
    }
}
