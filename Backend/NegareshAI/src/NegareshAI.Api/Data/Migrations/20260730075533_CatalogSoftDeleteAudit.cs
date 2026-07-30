using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace NegareshAI.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class CatalogSoftDeleteAudit : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "CreatedAtUtc",
                table: "OrganizationParties",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<string>(
                name: "CreatedByUserId",
                table: "OrganizationParties",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "DeletedAtUtc",
                table: "OrganizationParties",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DeletedByUserId",
                table: "OrganizationParties",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsDeleted",
                table: "OrganizationParties",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "UpdatedAtUtc",
                table: "OrganizationParties",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "UpdatedByUserId",
                table: "OrganizationParties",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "CreatedAtUtc",
                table: "ContractStatusDefinitions",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<string>(
                name: "CreatedByUserId",
                table: "ContractStatusDefinitions",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "DeletedAtUtc",
                table: "ContractStatusDefinitions",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DeletedByUserId",
                table: "ContractStatusDefinitions",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsDeleted",
                table: "ContractStatusDefinitions",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "UpdatedAtUtc",
                table: "ContractStatusDefinitions",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "UpdatedByUserId",
                table: "ContractStatusDefinitions",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "CreatedAtUtc",
                table: "ContractBaseDocumentProfiles",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<string>(
                name: "CreatedByUserId",
                table: "ContractBaseDocumentProfiles",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "DeletedAtUtc",
                table: "ContractBaseDocumentProfiles",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DeletedByUserId",
                table: "ContractBaseDocumentProfiles",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsDeleted",
                table: "ContractBaseDocumentProfiles",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "UpdatedAtUtc",
                table: "ContractBaseDocumentProfiles",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "UpdatedByUserId",
                table: "ContractBaseDocumentProfiles",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CreatedAtUtc",
                table: "OrganizationParties");

            migrationBuilder.DropColumn(
                name: "CreatedByUserId",
                table: "OrganizationParties");

            migrationBuilder.DropColumn(
                name: "DeletedAtUtc",
                table: "OrganizationParties");

            migrationBuilder.DropColumn(
                name: "DeletedByUserId",
                table: "OrganizationParties");

            migrationBuilder.DropColumn(
                name: "IsDeleted",
                table: "OrganizationParties");

            migrationBuilder.DropColumn(
                name: "UpdatedAtUtc",
                table: "OrganizationParties");

            migrationBuilder.DropColumn(
                name: "UpdatedByUserId",
                table: "OrganizationParties");

            migrationBuilder.DropColumn(
                name: "CreatedAtUtc",
                table: "ContractStatusDefinitions");

            migrationBuilder.DropColumn(
                name: "CreatedByUserId",
                table: "ContractStatusDefinitions");

            migrationBuilder.DropColumn(
                name: "DeletedAtUtc",
                table: "ContractStatusDefinitions");

            migrationBuilder.DropColumn(
                name: "DeletedByUserId",
                table: "ContractStatusDefinitions");

            migrationBuilder.DropColumn(
                name: "IsDeleted",
                table: "ContractStatusDefinitions");

            migrationBuilder.DropColumn(
                name: "UpdatedAtUtc",
                table: "ContractStatusDefinitions");

            migrationBuilder.DropColumn(
                name: "UpdatedByUserId",
                table: "ContractStatusDefinitions");

            migrationBuilder.DropColumn(
                name: "CreatedAtUtc",
                table: "ContractBaseDocumentProfiles");

            migrationBuilder.DropColumn(
                name: "CreatedByUserId",
                table: "ContractBaseDocumentProfiles");

            migrationBuilder.DropColumn(
                name: "DeletedAtUtc",
                table: "ContractBaseDocumentProfiles");

            migrationBuilder.DropColumn(
                name: "DeletedByUserId",
                table: "ContractBaseDocumentProfiles");

            migrationBuilder.DropColumn(
                name: "IsDeleted",
                table: "ContractBaseDocumentProfiles");

            migrationBuilder.DropColumn(
                name: "UpdatedAtUtc",
                table: "ContractBaseDocumentProfiles");

            migrationBuilder.DropColumn(
                name: "UpdatedByUserId",
                table: "ContractBaseDocumentProfiles");
        }
    }
}
