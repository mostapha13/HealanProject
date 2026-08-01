using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace NegareshAI.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class M2MasterDataReferenceModel : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "ContractGroupId",
                table: "ContractTemplates",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "ContractYear",
                table: "ContractTemplates",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "DeletedAtUtc",
                table: "ContractTemplates",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DeletedByUserId",
                table: "ContractTemplates",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<DateOnly>(
                name: "EffectiveFrom",
                table: "ContractTemplates",
                type: "date",
                nullable: true);

            migrationBuilder.AddColumn<DateOnly>(
                name: "EffectiveTo",
                table: "ContractTemplates",
                type: "date",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsDeleted",
                table: "ContractTemplates",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "UpdatedAtUtc",
                table: "ContractTemplates",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "UpdatedByUserId",
                table: "ContractTemplates",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "ComplianceCriteria",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    OrganizationId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Code = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Title = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Description = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    DefaultWeight = table.Column<decimal>(type: "decimal(9,2)", precision: 9, scale: 2, nullable: false),
                    IsCriticalByDefault = table.Column<bool>(type: "bit", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false),
                    CreatedByUserId = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedByUserId = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    UpdatedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: true),
                    DeletedByUserId = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    DeletedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ComplianceCriteria", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ContractYears",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    OrganizationId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Year = table.Column<int>(type: "int", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false),
                    CreatedByUserId = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedByUserId = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    UpdatedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: true),
                    DeletedByUserId = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    DeletedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ContractYears", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "GoldenDocuments",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    OrganizationId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    DocumentGroupId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    DocumentId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Priority = table.Column<int>(type: "int", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false),
                    CreatedByUserId = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false),
                    DeletedByUserId = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    DeletedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_GoldenDocuments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_GoldenDocuments_DocumentGroups_DocumentGroupId",
                        column: x => x.DocumentGroupId,
                        principalTable: "DocumentGroups",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_GoldenDocuments_Documents_DocumentId",
                        column: x => x.DocumentId,
                        principalTable: "Documents",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "DocumentGroupCriteria",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    DocumentGroupId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ComplianceCriterionId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Weight = table.Column<decimal>(type: "decimal(9,2)", precision: 9, scale: 2, nullable: false),
                    IsCritical = table.Column<bool>(type: "bit", nullable: false),
                    Order = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DocumentGroupCriteria", x => x.Id);
                    table.ForeignKey(
                        name: "FK_DocumentGroupCriteria_ComplianceCriteria_ComplianceCriterionId",
                        column: x => x.ComplianceCriterionId,
                        principalTable: "ComplianceCriteria",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_DocumentGroupCriteria_DocumentGroups_DocumentGroupId",
                        column: x => x.DocumentGroupId,
                        principalTable: "DocumentGroups",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ContractTemplates_ContractGroupId",
                table: "ContractTemplates",
                column: "ContractGroupId");

            migrationBuilder.CreateIndex(
                name: "IX_ComplianceCriteria_OrganizationId_Code",
                table: "ComplianceCriteria",
                columns: new[] { "OrganizationId", "Code" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ContractYears_OrganizationId_Year",
                table: "ContractYears",
                columns: new[] { "OrganizationId", "Year" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_DocumentGroupCriteria_ComplianceCriterionId",
                table: "DocumentGroupCriteria",
                column: "ComplianceCriterionId");

            migrationBuilder.CreateIndex(
                name: "IX_DocumentGroupCriteria_DocumentGroupId_ComplianceCriterionId",
                table: "DocumentGroupCriteria",
                columns: new[] { "DocumentGroupId", "ComplianceCriterionId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_GoldenDocuments_DocumentGroupId_DocumentId",
                table: "GoldenDocuments",
                columns: new[] { "DocumentGroupId", "DocumentId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_GoldenDocuments_DocumentId",
                table: "GoldenDocuments",
                column: "DocumentId");

            migrationBuilder.AddForeignKey(
                name: "FK_ContractTemplates_ContractGroups_ContractGroupId",
                table: "ContractTemplates",
                column: "ContractGroupId",
                principalTable: "ContractGroups",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ContractTemplates_ContractGroups_ContractGroupId",
                table: "ContractTemplates");

            migrationBuilder.DropTable(
                name: "ContractYears");

            migrationBuilder.DropTable(
                name: "DocumentGroupCriteria");

            migrationBuilder.DropTable(
                name: "GoldenDocuments");

            migrationBuilder.DropTable(
                name: "ComplianceCriteria");

            migrationBuilder.DropIndex(
                name: "IX_ContractTemplates_ContractGroupId",
                table: "ContractTemplates");

            migrationBuilder.DropColumn(
                name: "ContractGroupId",
                table: "ContractTemplates");

            migrationBuilder.DropColumn(
                name: "ContractYear",
                table: "ContractTemplates");

            migrationBuilder.DropColumn(
                name: "DeletedAtUtc",
                table: "ContractTemplates");

            migrationBuilder.DropColumn(
                name: "DeletedByUserId",
                table: "ContractTemplates");

            migrationBuilder.DropColumn(
                name: "EffectiveFrom",
                table: "ContractTemplates");

            migrationBuilder.DropColumn(
                name: "EffectiveTo",
                table: "ContractTemplates");

            migrationBuilder.DropColumn(
                name: "IsDeleted",
                table: "ContractTemplates");

            migrationBuilder.DropColumn(
                name: "UpdatedAtUtc",
                table: "ContractTemplates");

            migrationBuilder.DropColumn(
                name: "UpdatedByUserId",
                table: "ContractTemplates");
        }
    }
}
