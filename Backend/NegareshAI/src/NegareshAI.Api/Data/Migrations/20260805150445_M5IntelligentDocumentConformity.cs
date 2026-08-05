using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace NegareshAI.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class M5IntelligentDocumentConformity : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "PassingThreshold",
                table: "DocumentGroups",
                type: "decimal(5,2)",
                precision: 5,
                scale: 2,
                nullable: false,
                defaultValue: 80m);

            migrationBuilder.AddColumn<int>(
                name: "ApprovalStatus",
                table: "ComparisonRuns",
                type: "int",
                nullable: false,
                defaultValue: 1);

            migrationBuilder.AddColumn<string>(
                name: "CriterionSnapshotJson",
                table: "ComparisonRuns",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "[]");

            migrationBuilder.AddColumn<string>(
                name: "ExpertReviewNote",
                table: "ComparisonRuns",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "ExpertReviewedAtUtc",
                table: "ComparisonRuns",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ExpertReviewedByUserId",
                table: "ComparisonRuns",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "HasCriticalFailure",
                table: "ComparisonRuns",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "OutcomeExplanation",
                table: "ComparisonRuns",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "PassingThreshold",
                table: "ComparisonRuns",
                type: "decimal(5,2)",
                precision: 5,
                scale: 2,
                nullable: false,
                defaultValue: 80m);

            migrationBuilder.AddColumn<string>(
                name: "ToolTraceJson",
                table: "ComparisonRuns",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "{}");

            migrationBuilder.AddColumn<Guid>(
                name: "ComplianceCriterionId",
                table: "ComparisonFindings",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsApplicable",
                table: "ComparisonFindings",
                type: "bit",
                nullable: false,
                defaultValue: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsCritical",
                table: "ComparisonFindings",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsPassed",
                table: "ComparisonFindings",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<Guid>(
                name: "ReferenceDocumentId",
                table: "ComparisonFindings",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ReferenceSection",
                table: "ComparisonFindings",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "ReferenceVersionId",
                table: "ComparisonFindings",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "Weight",
                table: "ComparisonFindings",
                type: "decimal(9,2)",
                precision: 9,
                scale: 2,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.CreateTable(
                name: "ComparisonConflictDecisions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    OrganizationId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ComparisonRunId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ComparisonFindingId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    DocumentGroupId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    Scope = table.Column<int>(type: "int", nullable: false),
                    DecisionKey = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Decision = table.Column<int>(type: "int", nullable: false),
                    Reason = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    DecidedByUserId = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    DecidedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ComparisonConflictDecisions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ComparisonConflictDecisions_ComparisonFindings_ComparisonFindingId",
                        column: x => x.ComparisonFindingId,
                        principalTable: "ComparisonFindings",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ComparisonConflictDecisions_ComparisonRuns_ComparisonRunId",
                        column: x => x.ComparisonRunId,
                        principalTable: "ComparisonRuns",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ComparisonConflictDecisions_DocumentGroups_DocumentGroupId",
                        column: x => x.DocumentGroupId,
                        principalTable: "DocumentGroups",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "ComparisonReportArtifacts",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ComparisonRunId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Version = table.Column<int>(type: "int", nullable: false),
                    Format = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Content = table.Column<byte[]>(type: "varbinary(max)", nullable: false),
                    Sha256 = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    SnapshotJson = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    GeneratedByUserId = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    GeneratedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ComparisonReportArtifacts", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ComparisonReportArtifacts_ComparisonRuns_ComparisonRunId",
                        column: x => x.ComparisonRunId,
                        principalTable: "ComparisonRuns",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ComparisonFindings_ComplianceCriterionId",
                table: "ComparisonFindings",
                column: "ComplianceCriterionId");

            migrationBuilder.CreateIndex(
                name: "IX_ComparisonConflictDecisions_ComparisonFindingId",
                table: "ComparisonConflictDecisions",
                column: "ComparisonFindingId");

            migrationBuilder.CreateIndex(
                name: "IX_ComparisonConflictDecisions_ComparisonRunId",
                table: "ComparisonConflictDecisions",
                column: "ComparisonRunId");

            migrationBuilder.CreateIndex(
                name: "IX_ComparisonConflictDecisions_DocumentGroupId",
                table: "ComparisonConflictDecisions",
                column: "DocumentGroupId");

            migrationBuilder.CreateIndex(
                name: "IX_ComparisonConflictDecisions_OrganizationId_DocumentGroupId_DecisionKey_Scope",
                table: "ComparisonConflictDecisions",
                columns: new[] { "OrganizationId", "DocumentGroupId", "DecisionKey", "Scope" });

            migrationBuilder.CreateIndex(
                name: "IX_ComparisonReportArtifacts_ComparisonRunId_Format_Version",
                table: "ComparisonReportArtifacts",
                columns: new[] { "ComparisonRunId", "Format", "Version" },
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_ComparisonFindings_ComplianceCriteria_ComplianceCriterionId",
                table: "ComparisonFindings",
                column: "ComplianceCriterionId",
                principalTable: "ComplianceCriteria",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ComparisonFindings_ComplianceCriteria_ComplianceCriterionId",
                table: "ComparisonFindings");

            migrationBuilder.DropTable(
                name: "ComparisonConflictDecisions");

            migrationBuilder.DropTable(
                name: "ComparisonReportArtifacts");

            migrationBuilder.DropIndex(
                name: "IX_ComparisonFindings_ComplianceCriterionId",
                table: "ComparisonFindings");

            migrationBuilder.DropColumn(
                name: "PassingThreshold",
                table: "DocumentGroups");

            migrationBuilder.DropColumn(
                name: "ApprovalStatus",
                table: "ComparisonRuns");

            migrationBuilder.DropColumn(
                name: "CriterionSnapshotJson",
                table: "ComparisonRuns");

            migrationBuilder.DropColumn(
                name: "ExpertReviewNote",
                table: "ComparisonRuns");

            migrationBuilder.DropColumn(
                name: "ExpertReviewedAtUtc",
                table: "ComparisonRuns");

            migrationBuilder.DropColumn(
                name: "ExpertReviewedByUserId",
                table: "ComparisonRuns");

            migrationBuilder.DropColumn(
                name: "HasCriticalFailure",
                table: "ComparisonRuns");

            migrationBuilder.DropColumn(
                name: "OutcomeExplanation",
                table: "ComparisonRuns");

            migrationBuilder.DropColumn(
                name: "PassingThreshold",
                table: "ComparisonRuns");

            migrationBuilder.DropColumn(
                name: "ToolTraceJson",
                table: "ComparisonRuns");

            migrationBuilder.DropColumn(
                name: "ComplianceCriterionId",
                table: "ComparisonFindings");

            migrationBuilder.DropColumn(
                name: "IsApplicable",
                table: "ComparisonFindings");

            migrationBuilder.DropColumn(
                name: "IsCritical",
                table: "ComparisonFindings");

            migrationBuilder.DropColumn(
                name: "IsPassed",
                table: "ComparisonFindings");

            migrationBuilder.DropColumn(
                name: "ReferenceDocumentId",
                table: "ComparisonFindings");

            migrationBuilder.DropColumn(
                name: "ReferenceSection",
                table: "ComparisonFindings");

            migrationBuilder.DropColumn(
                name: "ReferenceVersionId",
                table: "ComparisonFindings");

            migrationBuilder.DropColumn(
                name: "Weight",
                table: "ComparisonFindings");
        }
    }
}
