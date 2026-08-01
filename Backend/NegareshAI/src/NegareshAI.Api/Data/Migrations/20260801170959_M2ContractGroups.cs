using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace NegareshAI.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class M2ContractGroups : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "PrimaryContractGroupId",
                table: "Contracts",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "ContractGroups",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    OrganizationId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Description = table.Column<string>(type: "nvarchar(max)", nullable: true),
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
                    table.PrimaryKey("PK_ContractGroups", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ContractGroupMemberships",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ContractId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ContractGroupId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    IsPrimary = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ContractGroupMemberships", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ContractGroupMemberships_ContractGroups_ContractGroupId",
                        column: x => x.ContractGroupId,
                        principalTable: "ContractGroups",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ContractGroupMemberships_Contracts_ContractId",
                        column: x => x.ContractId,
                        principalTable: "Contracts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Contracts_PrimaryContractGroupId",
                table: "Contracts",
                column: "PrimaryContractGroupId");

            migrationBuilder.CreateIndex(
                name: "IX_ContractGroupMemberships_ContractGroupId",
                table: "ContractGroupMemberships",
                column: "ContractGroupId");

            migrationBuilder.CreateIndex(
                name: "IX_ContractGroupMemberships_ContractId_ContractGroupId",
                table: "ContractGroupMemberships",
                columns: new[] { "ContractId", "ContractGroupId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ContractGroups_OrganizationId_Name",
                table: "ContractGroups",
                columns: new[] { "OrganizationId", "Name" },
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Contracts_ContractGroups_PrimaryContractGroupId",
                table: "Contracts",
                column: "PrimaryContractGroupId",
                principalTable: "ContractGroups",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Contracts_ContractGroups_PrimaryContractGroupId",
                table: "Contracts");

            migrationBuilder.DropTable(
                name: "ContractGroupMemberships");

            migrationBuilder.DropTable(
                name: "ContractGroups");

            migrationBuilder.DropIndex(
                name: "IX_Contracts_PrimaryContractGroupId",
                table: "Contracts");

            migrationBuilder.DropColumn(
                name: "PrimaryContractGroupId",
                table: "Contracts");
        }
    }
}
