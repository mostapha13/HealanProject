using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace NegareshAI.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class M4FrozenConversationSources : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "AdditionalSourceSnapshotJson",
                table: "ContractConversations",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "[]");

            migrationBuilder.AddColumn<Guid>(
                name: "BaseDocumentVersionId",
                table: "ContractConversations",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_ContractConversations_BaseDocumentVersionId",
                table: "ContractConversations",
                column: "BaseDocumentVersionId");

            migrationBuilder.AddForeignKey(
                name: "FK_ContractConversations_DocumentVersions_BaseDocumentVersionId",
                table: "ContractConversations",
                column: "BaseDocumentVersionId",
                principalTable: "DocumentVersions",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ContractConversations_DocumentVersions_BaseDocumentVersionId",
                table: "ContractConversations");

            migrationBuilder.DropIndex(
                name: "IX_ContractConversations_BaseDocumentVersionId",
                table: "ContractConversations");

            migrationBuilder.DropColumn(
                name: "AdditionalSourceSnapshotJson",
                table: "ContractConversations");

            migrationBuilder.DropColumn(
                name: "BaseDocumentVersionId",
                table: "ContractConversations");
        }
    }
}
