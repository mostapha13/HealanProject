using IdentityServer.Domain.Data;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace IdentityServer.Domain.Migrations
{
    [DbContext(typeof(ApplicationDbContext))]
    [Migration("20260721200000_AddAccessMenuTitleAndIsActive")]
    public partial class AddAccessMenuTitleAndIsActive : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Title",
                table: "AccessMenu",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsActive",
                table: "AccessMenu",
                type: "bit",
                nullable: false,
                defaultValue: true);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(name: "Title", table: "AccessMenu");
            migrationBuilder.DropColumn(name: "IsActive", table: "AccessMenu");
        }
    }
}
