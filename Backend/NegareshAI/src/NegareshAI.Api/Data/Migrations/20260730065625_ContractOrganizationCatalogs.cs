using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace NegareshAI.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class ContractOrganizationCatalogs : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "BaseDocumentProfileId",
                table: "Contracts",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "StatusDefinitionId",
                table: "Contracts",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "DirectoryPartyId",
                table: "ContractParties",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "ContractBaseDocumentProfiles",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    OrganizationId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    DocumentId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Description = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ContractBaseDocumentProfiles", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ContractBaseDocumentProfiles_Documents_DocumentId",
                        column: x => x.DocumentId,
                        principalTable: "Documents",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ContractStatusDefinitions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    OrganizationId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Order = table.Column<int>(type: "int", nullable: false),
                    Color = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ContractStatusDefinitions", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "OrganizationParties",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    OrganizationId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    NationalIdentifier = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    RepresentativeName = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ContactInfo = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OrganizationParties", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Contracts_BaseDocumentProfileId",
                table: "Contracts",
                column: "BaseDocumentProfileId");

            migrationBuilder.CreateIndex(
                name: "IX_Contracts_StatusDefinitionId",
                table: "Contracts",
                column: "StatusDefinitionId");

            migrationBuilder.CreateIndex(
                name: "IX_ContractParties_DirectoryPartyId",
                table: "ContractParties",
                column: "DirectoryPartyId");

            migrationBuilder.CreateIndex(
                name: "IX_ContractBaseDocumentProfiles_DocumentId",
                table: "ContractBaseDocumentProfiles",
                column: "DocumentId");

            migrationBuilder.CreateIndex(
                name: "IX_ContractBaseDocumentProfiles_OrganizationId_Name",
                table: "ContractBaseDocumentProfiles",
                columns: new[] { "OrganizationId", "Name" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ContractStatusDefinitions_OrganizationId_Name",
                table: "ContractStatusDefinitions",
                columns: new[] { "OrganizationId", "Name" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_OrganizationParties_OrganizationId_Name",
                table: "OrganizationParties",
                columns: new[] { "OrganizationId", "Name" },
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_ContractParties_OrganizationParties_DirectoryPartyId",
                table: "ContractParties",
                column: "DirectoryPartyId",
                principalTable: "OrganizationParties",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Contracts_ContractBaseDocumentProfiles_BaseDocumentProfileId",
                table: "Contracts",
                column: "BaseDocumentProfileId",
                principalTable: "ContractBaseDocumentProfiles",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Contracts_ContractStatusDefinitions_StatusDefinitionId",
                table: "Contracts",
                column: "StatusDefinitionId",
                principalTable: "ContractStatusDefinitions",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.Sql("""
                INSERT INTO ContractStatusDefinitions (Id, OrganizationId, Name, [Order], Color, IsActive)
                SELECT NEWID(), '11111111-1111-1111-1111-111111111111', v.Name, v.SortOrder, v.Color, 1
                FROM (VALUES
                    (N'پیش‌نویس', 1, '#64748b'),
                    (N'در حال بررسی', 2, '#7c3aed'),
                    (N'نیازمند اصلاح', 3, '#d97706'),
                    (N'تأییدشده', 4, '#059669'),
                    (N'امضاشده', 5, '#0284c7'),
                    (N'فعال', 6, '#16a34a'),
                    (N'منقضی‌شده', 7, '#6b7280'),
                    (N'فسخ‌شده', 8, '#dc2626'),
                    (N'بایگانی‌شده', 9, '#475569')
                ) v(Name, SortOrder, Color)
                WHERE NOT EXISTS (
                    SELECT 1 FROM ContractStatusDefinitions s
                    WHERE s.OrganizationId = '11111111-1111-1111-1111-111111111111'
                      AND s.Name = v.Name);
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ContractParties_OrganizationParties_DirectoryPartyId",
                table: "ContractParties");

            migrationBuilder.DropForeignKey(
                name: "FK_Contracts_ContractBaseDocumentProfiles_BaseDocumentProfileId",
                table: "Contracts");

            migrationBuilder.DropForeignKey(
                name: "FK_Contracts_ContractStatusDefinitions_StatusDefinitionId",
                table: "Contracts");

            migrationBuilder.DropTable(
                name: "ContractBaseDocumentProfiles");

            migrationBuilder.DropTable(
                name: "ContractStatusDefinitions");

            migrationBuilder.DropTable(
                name: "OrganizationParties");

            migrationBuilder.DropIndex(
                name: "IX_Contracts_BaseDocumentProfileId",
                table: "Contracts");

            migrationBuilder.DropIndex(
                name: "IX_Contracts_StatusDefinitionId",
                table: "Contracts");

            migrationBuilder.DropIndex(
                name: "IX_ContractParties_DirectoryPartyId",
                table: "ContractParties");

            migrationBuilder.DropColumn(
                name: "BaseDocumentProfileId",
                table: "Contracts");

            migrationBuilder.DropColumn(
                name: "StatusDefinitionId",
                table: "Contracts");

            migrationBuilder.DropColumn(
                name: "DirectoryPartyId",
                table: "ContractParties");
        }
    }
}
