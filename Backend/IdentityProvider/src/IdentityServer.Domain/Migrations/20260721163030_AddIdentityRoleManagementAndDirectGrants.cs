using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace IdentityServer.Domain.Migrations
{
    /// <inheritdoc />
    public partial class AddIdentityRoleManagementAndDirectGrants : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "CreatedBy",
                table: "AspNetRoles",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "CreatedUtc",
                table: "AspNetRoles",
                type: "datetime2",
                nullable: false,
                defaultValueSql: "SYSUTCDATETIME()");

            migrationBuilder.AddColumn<Guid>(
                name: "DeletedBy",
                table: "AspNetRoles",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "DeletedUtc",
                table: "AspNetRoles",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsDeleted",
                table: "AspNetRoles",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsSystem",
                table: "AspNetRoles",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<Guid>(
                name: "ModifiedBy",
                table: "AspNetRoles",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "ModifiedUtc",
                table: "AspNetRoles",
                type: "datetime2",
                nullable: true);

            migrationBuilder.Sql(
                """
                UPDATE [AspNetRoles]
                SET [IsSystem] = 1,
                    [IsDeleted] = 0,
                    [DeletedBy] = NULL,
                    [DeletedUtc] = NULL
                WHERE [NormalizedName] = N'ADMIN';
                """);

            migrationBuilder.CreateTable(
                name: "AccessUserGrant",
                columns: table => new
                {
                    AccessUserGrantId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    AccessMenuId = table.Column<int>(type: "Int", nullable: false),
                    AccessSystemId = table.Column<int>(type: "Int", nullable: false),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false),
                    CreatedUtc = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "SYSUTCDATETIME()"),
                    CreatedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    ModifiedUtc = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ModifiedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    DeletedUtc = table.Column<DateTime>(type: "datetime2", nullable: true),
                    DeletedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AccessUserGrant", x => x.AccessUserGrantId);
                    table.ForeignKey(
                        name: "FK_AccessUserGrant_AccessMenu_AccessMenuId",
                        column: x => x.AccessMenuId,
                        principalTable: "AccessMenu",
                        principalColumn: "AccessMenuId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_AccessUserGrant_AccessSystem_AccessSystemId",
                        column: x => x.AccessSystemId,
                        principalTable: "AccessSystem",
                        principalColumn: "AccessSystemId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_AccessUserGrant_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AccessUserGrant_AccessMenuId",
                table: "AccessUserGrant",
                column: "AccessMenuId");

            migrationBuilder.CreateIndex(
                name: "IX_AccessUserGrant_AccessSystemId",
                table: "AccessUserGrant",
                column: "AccessSystemId");

            migrationBuilder.CreateIndex(
                name: "IX_AccessUserGrant_UserId_AccessSystemId_AccessMenuId",
                table: "AccessUserGrant",
                columns: new[] { "UserId", "AccessSystemId", "AccessMenuId" },
                unique: true);

        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AccessUserGrant");

            migrationBuilder.DropColumn(
                name: "CreatedBy",
                table: "AspNetRoles");

            migrationBuilder.DropColumn(
                name: "CreatedUtc",
                table: "AspNetRoles");

            migrationBuilder.DropColumn(
                name: "DeletedBy",
                table: "AspNetRoles");

            migrationBuilder.DropColumn(
                name: "DeletedUtc",
                table: "AspNetRoles");

            migrationBuilder.DropColumn(
                name: "IsDeleted",
                table: "AspNetRoles");

            migrationBuilder.DropColumn(
                name: "IsSystem",
                table: "AspNetRoles");

            migrationBuilder.DropColumn(
                name: "ModifiedBy",
                table: "AspNetRoles");

            migrationBuilder.DropColumn(
                name: "ModifiedUtc",
                table: "AspNetRoles");
        }
    }
}
