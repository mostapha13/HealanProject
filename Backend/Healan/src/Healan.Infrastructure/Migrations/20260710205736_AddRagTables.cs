using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Healan.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddRagTables : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "RagChatLogs",
                columns: table => new
                {
                    RagChatLogId = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Question = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: false),
                    Answer = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    MatchedKnowledgeItemId = table.Column<long>(type: "bigint", nullable: true),
                    SimilarityScore = table.Column<double>(type: "float", nullable: true),
                    SourceType = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    SessionId = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: true),
                    WasAnswered = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RagChatLogs", x => x.RagChatLogId);
                });

            migrationBuilder.CreateTable(
                name: "RagKnowledgeItems",
                columns: table => new
                {
                    RagKnowledgeItemId = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Question = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    QuestionSummary = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: true),
                    Keywords = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    Topic = table.Column<string>(type: "nvarchar(120)", maxLength: 120, nullable: true),
                    Answer = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    SimilarQuestions = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    SearchText = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Priority = table.Column<int>(type: "int", nullable: false),
                    SortOrder = table.Column<int>(type: "int", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false, defaultValue: true),
                    CreatedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    DepartmentId = table.Column<short>(type: "smallint", nullable: false),
                    LastModifiedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    LastModifiedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    DeletedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    DeletedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RagKnowledgeItems", x => x.RagKnowledgeItemId);
                });

            migrationBuilder.CreateTable(
                name: "RagSettings",
                columns: table => new
                {
                    RagSettingId = table.Column<int>(type: "int", nullable: false),
                    SyncIntervalMinutes = table.Column<int>(type: "int", nullable: false, defaultValue: 10),
                    SimilarityThresholdPercent = table.Column<int>(type: "int", nullable: false, defaultValue: 55),
                    PythonApiUrl = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    IsEnabled = table.Column<bool>(type: "bit", nullable: false, defaultValue: true),
                    LastSyncedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RagSettings", x => x.RagSettingId);
                });

            migrationBuilder.CreateIndex(
                name: "IX_RagChatLogs_CreatedAt",
                table: "RagChatLogs",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_RagKnowledgeItems_IsActive",
                table: "RagKnowledgeItems",
                column: "IsActive");

            migrationBuilder.CreateIndex(
                name: "IX_RagKnowledgeItems_Topic_SortOrder",
                table: "RagKnowledgeItems",
                columns: new[] { "Topic", "SortOrder" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(name: "RagChatLogs");
            migrationBuilder.DropTable(name: "RagKnowledgeItems");
            migrationBuilder.DropTable(name: "RagSettings");
        }
    }
}
