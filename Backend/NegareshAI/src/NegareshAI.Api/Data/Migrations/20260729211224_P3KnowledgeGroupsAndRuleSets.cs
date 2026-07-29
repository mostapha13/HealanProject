using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace NegareshAI.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class P3KnowledgeGroupsAndRuleSets : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "DocumentGroups",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    OrganizationId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Description = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    CreatedByUserId = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CreatedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DocumentGroups", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "DocumentGroupMembers",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    DocumentGroupId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    DocumentId = table.Column<Guid>(type: "uniqueidentifier", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DocumentGroupMembers", x => x.Id);
                    table.ForeignKey(
                        name: "FK_DocumentGroupMembers_DocumentGroups_DocumentGroupId",
                        column: x => x.DocumentGroupId,
                        principalTable: "DocumentGroups",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_DocumentGroupMembers_Documents_DocumentId",
                        column: x => x.DocumentId,
                        principalTable: "Documents",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "RuleSets",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    OrganizationId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    DocumentGroupId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    Name = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Version = table.Column<int>(type: "int", nullable: false),
                    EffectiveFromUtc = table.Column<DateTime>(type: "datetime2", nullable: false),
                    EffectiveToUtc = table.Column<DateTime>(type: "datetime2", nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    CreatedByUserId = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CreatedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RuleSets", x => x.Id);
                    table.ForeignKey(
                        name: "FK_RuleSets_DocumentGroups_DocumentGroupId",
                        column: x => x.DocumentGroupId,
                        principalTable: "DocumentGroups",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "Rules",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    RuleSetId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Code = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Title = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Instruction = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Severity = table.Column<int>(type: "int", nullable: false),
                    Order = table.Column<int>(type: "int", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Rules", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Rules_RuleSets_RuleSetId",
                        column: x => x.RuleSetId,
                        principalTable: "RuleSets",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "RuleParameters",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    RuleId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Key = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    ValueJson = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RuleParameters", x => x.Id);
                    table.ForeignKey(
                        name: "FK_RuleParameters_Rules_RuleId",
                        column: x => x.RuleId,
                        principalTable: "Rules",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_DocumentGroupMembers_DocumentGroupId_DocumentId",
                table: "DocumentGroupMembers",
                columns: new[] { "DocumentGroupId", "DocumentId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_DocumentGroupMembers_DocumentId",
                table: "DocumentGroupMembers",
                column: "DocumentId");

            migrationBuilder.CreateIndex(
                name: "IX_DocumentGroups_OrganizationId_Name",
                table: "DocumentGroups",
                columns: new[] { "OrganizationId", "Name" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_RuleParameters_RuleId_Key",
                table: "RuleParameters",
                columns: new[] { "RuleId", "Key" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Rules_RuleSetId_Code",
                table: "Rules",
                columns: new[] { "RuleSetId", "Code" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_RuleSets_DocumentGroupId",
                table: "RuleSets",
                column: "DocumentGroupId");

            migrationBuilder.CreateIndex(
                name: "IX_RuleSets_OrganizationId_Name_Version",
                table: "RuleSets",
                columns: new[] { "OrganizationId", "Name", "Version" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "DocumentGroupMembers");

            migrationBuilder.DropTable(
                name: "RuleParameters");

            migrationBuilder.DropTable(
                name: "Rules");

            migrationBuilder.DropTable(
                name: "RuleSets");

            migrationBuilder.DropTable(
                name: "DocumentGroups");
        }
    }
}
