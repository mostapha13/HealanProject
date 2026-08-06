using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace NegareshAI.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class M8OrganizationPartyAddress : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Address",
                table: "OrganizationParties",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Address",
                table: "OrganizationParties");
        }
    }
}
