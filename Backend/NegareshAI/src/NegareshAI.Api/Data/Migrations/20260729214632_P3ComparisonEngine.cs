using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace NegareshAI.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class P3ComparisonEngine : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ComparisonRuns",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    OrganizationId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    TargetDocumentId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    TargetVersionId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    BasisMode = table.Column<int>(type: "int", nullable: false),
                    DocumentGroupId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    ReferenceDocumentId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    ReferenceVersionId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    UserInstruction = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    RuleSetSnapshotJson = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    SourceSnapshotJson = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ModelId = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    PromptVersion = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Status = table.Column<int>(type: "int", nullable: false),
                    Outcome = table.Column<int>(type: "int", nullable: true),
                    ScorePercent = table.Column<decimal>(type: "decimal(5,2)", precision: 5, scale: 2, nullable: true),
                    FailureReason = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CreatedByUserId = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CompletedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ComparisonRuns", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ComparisonRuns_DocumentGroups_DocumentGroupId",
                        column: x => x.DocumentGroupId,
                        principalTable: "DocumentGroups",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_ComparisonRuns_DocumentVersions_ReferenceVersionId",
                        column: x => x.ReferenceVersionId,
                        principalTable: "DocumentVersions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ComparisonRuns_DocumentVersions_TargetVersionId",
                        column: x => x.TargetVersionId,
                        principalTable: "DocumentVersions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ComparisonRuns_Documents_ReferenceDocumentId",
                        column: x => x.ReferenceDocumentId,
                        principalTable: "Documents",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ComparisonRuns_Documents_TargetDocumentId",
                        column: x => x.TargetDocumentId,
                        principalTable: "Documents",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "ComparisonFindings",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ComparisonRunId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    RuleId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    Type = table.Column<int>(type: "int", nullable: false),
                    Severity = table.Column<int>(type: "int", nullable: false),
                    Title = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Reason = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    TargetEvidence = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    TargetPage = table.Column<int>(type: "int", nullable: true),
                    TargetSection = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ReferenceEvidence = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ReferencePage = table.Column<int>(type: "int", nullable: true),
                    Suggestion = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Confidence = table.Column<decimal>(type: "decimal(5,4)", precision: 5, scale: 4, nullable: false),
                    ReviewDecision = table.Column<int>(type: "int", nullable: false),
                    ReviewerComment = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CorrectedReason = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ReviewedByUserId = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ReviewedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ComparisonFindings", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ComparisonFindings_ComparisonRuns_ComparisonRunId",
                        column: x => x.ComparisonRunId,
                        principalTable: "ComparisonRuns",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ComparisonFindings_Rules_RuleId",
                        column: x => x.RuleId,
                        principalTable: "Rules",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "ComparisonRunRuleSets",
                columns: table => new
                {
                    ComparisonRunId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    RuleSetId = table.Column<Guid>(type: "uniqueidentifier", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ComparisonRunRuleSets", x => new { x.ComparisonRunId, x.RuleSetId });
                    table.ForeignKey(
                        name: "FK_ComparisonRunRuleSets_ComparisonRuns_ComparisonRunId",
                        column: x => x.ComparisonRunId,
                        principalTable: "ComparisonRuns",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ComparisonRunRuleSets_RuleSets_RuleSetId",
                        column: x => x.RuleSetId,
                        principalTable: "RuleSets",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ComparisonFindings_ComparisonRunId",
                table: "ComparisonFindings",
                column: "ComparisonRunId");

            migrationBuilder.CreateIndex(
                name: "IX_ComparisonFindings_RuleId",
                table: "ComparisonFindings",
                column: "RuleId");

            migrationBuilder.CreateIndex(
                name: "IX_ComparisonRunRuleSets_RuleSetId",
                table: "ComparisonRunRuleSets",
                column: "RuleSetId");

            migrationBuilder.CreateIndex(
                name: "IX_ComparisonRuns_DocumentGroupId",
                table: "ComparisonRuns",
                column: "DocumentGroupId");

            migrationBuilder.CreateIndex(
                name: "IX_ComparisonRuns_OrganizationId_CreatedAtUtc",
                table: "ComparisonRuns",
                columns: new[] { "OrganizationId", "CreatedAtUtc" });

            migrationBuilder.CreateIndex(
                name: "IX_ComparisonRuns_ReferenceDocumentId",
                table: "ComparisonRuns",
                column: "ReferenceDocumentId");

            migrationBuilder.CreateIndex(
                name: "IX_ComparisonRuns_ReferenceVersionId",
                table: "ComparisonRuns",
                column: "ReferenceVersionId");

            migrationBuilder.CreateIndex(
                name: "IX_ComparisonRuns_TargetDocumentId",
                table: "ComparisonRuns",
                column: "TargetDocumentId");

            migrationBuilder.CreateIndex(
                name: "IX_ComparisonRuns_TargetVersionId",
                table: "ComparisonRuns",
                column: "TargetVersionId");

            migrationBuilder.Sql("""
                IF NOT EXISTS (
                    SELECT 1 FROM [RuntimeSettings]
                    WHERE [OrganizationId] = '11111111-1111-1111-1111-111111111111'
                      AND [Category] = N'ai'
                      AND [Key] = N'comparison.prompt')
                BEGIN
                    INSERT INTO [RuntimeSettings]
                        ([Id], [OrganizationId], [Category], [Key], [ValueJson],
                         [Version], [IsActive], [UpdatedByUserId], [UpdatedAtUtc])
                    VALUES
                        ('30000000-0000-0000-0000-000000000001',
                         '11111111-1111-1111-1111-111111111111',
                         N'ai', N'comparison.prompt',
                         N'{"template":"Evaluate selected rules and reference sources; return evidence-backed findings only.","language":"fa-IR","requirePageCitation":true,"humanReviewRequired":true}',
                         1, 1, N'system-migration', SYSUTCDATETIME())
                END
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                DELETE FROM [RuntimeSettings]
                WHERE [Id] = '30000000-0000-0000-0000-000000000001'
                """);

            migrationBuilder.DropTable(
                name: "ComparisonFindings");

            migrationBuilder.DropTable(
                name: "ComparisonRunRuleSets");

            migrationBuilder.DropTable(
                name: "ComparisonRuns");
        }
    }
}
