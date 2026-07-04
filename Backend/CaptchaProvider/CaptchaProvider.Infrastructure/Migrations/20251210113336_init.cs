using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CaptchaProvider.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class init : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "CaptchaInfo",
                columns: table => new
                {
                    CaptchaInfoId = table.Column<Guid>(type: "UniqueIdentifier", nullable: false),
                    Code = table.Column<string>(type: "nvarchar(150)", nullable: false),
                    RequestTime = table.Column<DateTime>(type: "SmallDateTime", nullable: false),
                    RequestIp = table.Column<string>(type: "nvarchar(20)", nullable: false),
                    Result = table.Column<string>(type: "nvarchar(50)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CaptchaInfo", x => x.CaptchaInfoId);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CaptchaInfo");
        }
    }
}
