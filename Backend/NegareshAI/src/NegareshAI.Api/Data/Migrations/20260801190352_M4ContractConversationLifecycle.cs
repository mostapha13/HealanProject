using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace NegareshAI.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class M4ContractConversationLifecycle : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ContractConversations",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    OrganizationId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Title = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    OrganizationPartyId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    PrimaryContractGroupId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    RequestedContractYear = table.Column<int>(type: "int", nullable: false),
                    Subject = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    BaseContractId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    Status = table.Column<int>(type: "int", nullable: false),
                    CreatedByUserId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false),
                    DeletedByUserId = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    DeletedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ContractConversations", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ContractConversations_ContractGroups_PrimaryContractGroupId",
                        column: x => x.PrimaryContractGroupId,
                        principalTable: "ContractGroups",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ContractConversations_Contracts_BaseContractId",
                        column: x => x.BaseContractId,
                        principalTable: "Contracts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ContractConversations_OrganizationParties_OrganizationPartyId",
                        column: x => x.OrganizationPartyId,
                        principalTable: "OrganizationParties",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "ContractClarifications",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ConversationId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Key = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Question = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Answer = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    IsAnswered = table.Column<bool>(type: "bit", nullable: false),
                    AskedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false),
                    AnsweredAtUtc = table.Column<DateTime>(type: "datetime2", nullable: true),
                    AnsweredByUserId = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ContractClarifications", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ContractClarifications_ContractConversations_ConversationId",
                        column: x => x.ConversationId,
                        principalTable: "ContractConversations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ContractConversationMessages",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ConversationId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Sequence = table.Column<int>(type: "int", nullable: false),
                    Role = table.Column<int>(type: "int", nullable: false),
                    Content = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    SourceSnapshotJson = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CreatedByUserId = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CreatedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ContractConversationMessages", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ContractConversationMessages_ContractConversations_ConversationId",
                        column: x => x.ConversationId,
                        principalTable: "ContractConversations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ContractDraftVersions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ConversationId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    VersionNumber = table.Column<int>(type: "int", nullable: false),
                    BaseContractId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    BaseDocumentVersionId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    ContractTemplateId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    InstructionSnapshot = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ChangeSetJson = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    SourceSnapshotJson = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CalculationSnapshotJson = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    DiffJson = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    GeneratedDocxFileId = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    GeneratedPdfFileId = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ApprovalStatus = table.Column<int>(type: "int", nullable: false),
                    CreatedByUserId = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false),
                    RequesterReviewedByUserId = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    RequesterReviewedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: true),
                    RequesterReviewNote = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ExpertReviewedByUserId = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ExpertReviewedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ExpertReviewNote = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ManagerReviewedByUserId = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ManagerReviewedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ManagerReviewNote = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    FinalDocumentVersionId = table.Column<Guid>(type: "uniqueidentifier", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ContractDraftVersions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ContractDraftVersions_ContractConversations_ConversationId",
                        column: x => x.ConversationId,
                        principalTable: "ContractConversations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ContractDraftVersions_ContractTemplates_ContractTemplateId",
                        column: x => x.ContractTemplateId,
                        principalTable: "ContractTemplates",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ContractDraftVersions_Contracts_BaseContractId",
                        column: x => x.BaseContractId,
                        principalTable: "Contracts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ContractDraftVersions_DocumentVersions_BaseDocumentVersionId",
                        column: x => x.BaseDocumentVersionId,
                        principalTable: "DocumentVersions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ContractDraftVersions_DocumentVersions_FinalDocumentVersionId",
                        column: x => x.FinalDocumentVersionId,
                        principalTable: "DocumentVersions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ContractClarifications_ConversationId_Key_IsAnswered",
                table: "ContractClarifications",
                columns: new[] { "ConversationId", "Key", "IsAnswered" });

            migrationBuilder.CreateIndex(
                name: "IX_ContractConversationMessages_ConversationId_Sequence",
                table: "ContractConversationMessages",
                columns: new[] { "ConversationId", "Sequence" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ContractConversations_BaseContractId",
                table: "ContractConversations",
                column: "BaseContractId");

            migrationBuilder.CreateIndex(
                name: "IX_ContractConversations_OrganizationId_CreatedByUserId_UpdatedAtUtc",
                table: "ContractConversations",
                columns: new[] { "OrganizationId", "CreatedByUserId", "UpdatedAtUtc" });

            migrationBuilder.CreateIndex(
                name: "IX_ContractConversations_OrganizationPartyId",
                table: "ContractConversations",
                column: "OrganizationPartyId");

            migrationBuilder.CreateIndex(
                name: "IX_ContractConversations_PrimaryContractGroupId",
                table: "ContractConversations",
                column: "PrimaryContractGroupId");

            migrationBuilder.CreateIndex(
                name: "IX_ContractDraftVersions_BaseContractId",
                table: "ContractDraftVersions",
                column: "BaseContractId");

            migrationBuilder.CreateIndex(
                name: "IX_ContractDraftVersions_BaseDocumentVersionId",
                table: "ContractDraftVersions",
                column: "BaseDocumentVersionId");

            migrationBuilder.CreateIndex(
                name: "IX_ContractDraftVersions_ContractTemplateId",
                table: "ContractDraftVersions",
                column: "ContractTemplateId");

            migrationBuilder.CreateIndex(
                name: "IX_ContractDraftVersions_ConversationId_VersionNumber",
                table: "ContractDraftVersions",
                columns: new[] { "ConversationId", "VersionNumber" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ContractDraftVersions_FinalDocumentVersionId",
                table: "ContractDraftVersions",
                column: "FinalDocumentVersionId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ContractClarifications");

            migrationBuilder.DropTable(
                name: "ContractConversationMessages");

            migrationBuilder.DropTable(
                name: "ContractDraftVersions");

            migrationBuilder.DropTable(
                name: "ContractConversations");
        }
    }
}
