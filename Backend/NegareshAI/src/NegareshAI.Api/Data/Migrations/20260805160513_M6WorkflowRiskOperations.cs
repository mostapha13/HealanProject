using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace NegareshAI.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class M6WorkflowRiskOperations : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "DelegatedAtUtc",
                table: "ContractWorkflowStages",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DelegatedByUserId",
                table: "ContractWorkflowStages",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DelegatedFromUserId",
                table: "ContractWorkflowStages",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Title",
                table: "ContractWorkflowStages",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<Guid>(
                name: "ContractGroupId",
                table: "ContractWorkflows",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DefinitionSnapshotJson",
                table: "ContractWorkflows",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "[]");

            migrationBuilder.AddColumn<Guid>(
                name: "WorkflowDefinitionId",
                table: "ContractWorkflows",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "WorkflowDefinitionVersion",
                table: "ContractWorkflows",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "ChecklistDefinitionId",
                table: "ContractRiskAssessments",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "ChecklistDefinitionVersion",
                table: "ContractRiskAssessments",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DefinitionSnapshotJson",
                table: "ContractRiskAssessments",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "[]");

            migrationBuilder.AddColumn<int>(
                name: "Version",
                table: "ContractRiskAssessments",
                type: "int",
                nullable: false,
                defaultValue: 1);

            migrationBuilder.AddColumn<string>(
                name: "AssignedUserId",
                table: "ContractOperations",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "CompletedAtUtc",
                table: "ContractOperations",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CompletedByUserId",
                table: "ContractOperations",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.Sql("""
                UPDATE s SET Title = CASE s.Type
                    WHEN 1 THEN N'بررسی حقوقی'
                    WHEN 2 THEN N'بررسی فنی'
                    WHEN 3 THEN N'بررسی مالی'
                    WHEN 4 THEN N'تأیید مدیریتی'
                    WHEN 5 THEN N'بررسی کارشناسی'
                    ELSE N'مرحله بررسی' END
                FROM ContractWorkflowStages s
                WHERE s.Title = N'';

                UPDATE w SET ContractGroupId = membership.ContractGroupId
                FROM ContractWorkflows w
                OUTER APPLY (
                    SELECT TOP (1) m.ContractGroupId
                    FROM ContractGroupMemberships m
                    WHERE m.ContractId = w.ContractId
                    ORDER BY m.IsPrimary DESC, m.Id
                ) membership
                WHERE w.ContractGroupId IS NULL;

                WITH ranked AS (
                    SELECT Id, ROW_NUMBER() OVER (
                        PARTITION BY OrganizationId, ContractId
                        ORDER BY CreatedAtUtc, Id) AS VersionNumber
                    FROM ContractRiskAssessments
                )
                UPDATE assessment SET Version = ranked.VersionNumber
                FROM ContractRiskAssessments assessment
                INNER JOIN ranked ON ranked.Id = assessment.Id;
                """);

            migrationBuilder.CreateTable(
                name: "ContractOperationReminders",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    OrganizationId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ContractOperationId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    DedupeKey = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Kind = table.Column<int>(type: "int", nullable: false),
                    Status = table.Column<int>(type: "int", nullable: false),
                    ScheduledFor = table.Column<DateOnly>(type: "date", nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ContractOperationReminders", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ContractOperationReminders_ContractOperations_ContractOperationId",
                        column: x => x.ContractOperationId,
                        principalTable: "ContractOperations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ContractRiskChecklistDefinitions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    DefinitionKey = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    OrganizationId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ContractGroupId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Version = table.Column<int>(type: "int", nullable: false),
                    ItemsJson = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false),
                    CreatedByUserId = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false),
                    DeletedByUserId = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    DeletedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ContractRiskChecklistDefinitions", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ContractWorkflowActions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    OrganizationId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ContractWorkflowId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ContractWorkflowStageId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Type = table.Column<int>(type: "int", nullable: false),
                    Comment = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    FromUserId = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ToUserId = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    PerformedByUserId = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    PerformedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ContractWorkflowActions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ContractWorkflowActions_ContractWorkflowStages_ContractWorkflowStageId",
                        column: x => x.ContractWorkflowStageId,
                        principalTable: "ContractWorkflowStages",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ContractWorkflowActions_ContractWorkflows_ContractWorkflowId",
                        column: x => x.ContractWorkflowId,
                        principalTable: "ContractWorkflows",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ContractWorkflowDefinitions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    DefinitionKey = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    OrganizationId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ContractGroupId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Version = table.Column<int>(type: "int", nullable: false),
                    StagesJson = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false),
                    CreatedByUserId = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false),
                    DeletedByUserId = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    DeletedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ContractWorkflowDefinitions", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ContractRiskAssessments_OrganizationId_ContractId_Version",
                table: "ContractRiskAssessments",
                columns: new[] { "OrganizationId", "ContractId", "Version" });

            migrationBuilder.CreateIndex(
                name: "IX_ContractOperationReminders_ContractOperationId",
                table: "ContractOperationReminders",
                column: "ContractOperationId");

            migrationBuilder.CreateIndex(
                name: "IX_ContractOperationReminders_OrganizationId_DedupeKey",
                table: "ContractOperationReminders",
                columns: new[] { "OrganizationId", "DedupeKey" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ContractRiskChecklistDefinitions_OrganizationId_ContractGroupId_IsActive_IsDeleted",
                table: "ContractRiskChecklistDefinitions",
                columns: new[] { "OrganizationId", "ContractGroupId", "IsActive", "IsDeleted" });

            migrationBuilder.CreateIndex(
                name: "IX_ContractRiskChecklistDefinitions_OrganizationId_DefinitionKey_Version",
                table: "ContractRiskChecklistDefinitions",
                columns: new[] { "OrganizationId", "DefinitionKey", "Version" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ContractWorkflowActions_ContractWorkflowId",
                table: "ContractWorkflowActions",
                column: "ContractWorkflowId");

            migrationBuilder.CreateIndex(
                name: "IX_ContractWorkflowActions_ContractWorkflowStageId",
                table: "ContractWorkflowActions",
                column: "ContractWorkflowStageId");

            migrationBuilder.CreateIndex(
                name: "IX_ContractWorkflowActions_OrganizationId_ContractWorkflowId_PerformedAtUtc",
                table: "ContractWorkflowActions",
                columns: new[] { "OrganizationId", "ContractWorkflowId", "PerformedAtUtc" });

            migrationBuilder.CreateIndex(
                name: "IX_ContractWorkflowDefinitions_OrganizationId_ContractGroupId_IsActive_IsDeleted",
                table: "ContractWorkflowDefinitions",
                columns: new[] { "OrganizationId", "ContractGroupId", "IsActive", "IsDeleted" });

            migrationBuilder.CreateIndex(
                name: "IX_ContractWorkflowDefinitions_OrganizationId_DefinitionKey_Version",
                table: "ContractWorkflowDefinitions",
                columns: new[] { "OrganizationId", "DefinitionKey", "Version" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ContractOperationReminders");

            migrationBuilder.DropTable(
                name: "ContractRiskChecklistDefinitions");

            migrationBuilder.DropTable(
                name: "ContractWorkflowActions");

            migrationBuilder.DropTable(
                name: "ContractWorkflowDefinitions");

            migrationBuilder.DropIndex(
                name: "IX_ContractRiskAssessments_OrganizationId_ContractId_Version",
                table: "ContractRiskAssessments");

            migrationBuilder.DropColumn(
                name: "DelegatedAtUtc",
                table: "ContractWorkflowStages");

            migrationBuilder.DropColumn(
                name: "DelegatedByUserId",
                table: "ContractWorkflowStages");

            migrationBuilder.DropColumn(
                name: "DelegatedFromUserId",
                table: "ContractWorkflowStages");

            migrationBuilder.DropColumn(
                name: "Title",
                table: "ContractWorkflowStages");

            migrationBuilder.DropColumn(
                name: "ContractGroupId",
                table: "ContractWorkflows");

            migrationBuilder.DropColumn(
                name: "DefinitionSnapshotJson",
                table: "ContractWorkflows");

            migrationBuilder.DropColumn(
                name: "WorkflowDefinitionId",
                table: "ContractWorkflows");

            migrationBuilder.DropColumn(
                name: "WorkflowDefinitionVersion",
                table: "ContractWorkflows");

            migrationBuilder.DropColumn(
                name: "ChecklistDefinitionId",
                table: "ContractRiskAssessments");

            migrationBuilder.DropColumn(
                name: "ChecklistDefinitionVersion",
                table: "ContractRiskAssessments");

            migrationBuilder.DropColumn(
                name: "DefinitionSnapshotJson",
                table: "ContractRiskAssessments");

            migrationBuilder.DropColumn(
                name: "Version",
                table: "ContractRiskAssessments");

            migrationBuilder.DropColumn(
                name: "AssignedUserId",
                table: "ContractOperations");

            migrationBuilder.DropColumn(
                name: "CompletedAtUtc",
                table: "ContractOperations");

            migrationBuilder.DropColumn(
                name: "CompletedByUserId",
                table: "ContractOperations");
        }
    }
}
