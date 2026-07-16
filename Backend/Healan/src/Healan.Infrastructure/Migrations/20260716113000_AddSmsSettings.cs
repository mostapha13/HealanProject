using System;
using Healan.Infrastructure.Context;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Healan.Infrastructure.Migrations
{
    [DbContext(typeof(ApplicationDbContext))]
    [Migration("20260716113000_AddSmsSettings")]
    public partial class AddSmsSettings : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "SmsSettings",
                columns: table => new
                {
                    SmsSettingId = table.Column<int>(type: "int", nullable: false),
                    ApiKey = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    TemplateId = table.Column<int>(type: "int", nullable: false, defaultValue: 640023),
                    LineNumber = table.Column<long>(type: "bigint", nullable: false, defaultValue: 0L),
                    VerifyParameterName = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    SendEnabled = table.Column<bool>(type: "bit", nullable: false, defaultValue: true),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SmsSettings", x => x.SmsSettingId);
                });

            migrationBuilder.InsertData(
                table: "SmsSettings",
                columns: new[] { "SmsSettingId", "ApiKey", "TemplateId", "LineNumber", "VerifyParameterName", "SendEnabled", "UpdatedAt" },
                values: new object[]
                {
                    1,
                    "w6kRP51S1acR5qRGvC4ojJfzIArb6Aaq0cKOn05zv7L36pLt",
                    640023,
                    0L,
                    "Code",
                    true,
                    new DateTime(2026, 7, 16, 0, 0, 0, DateTimeKind.Utc)
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(name: "SmsSettings");
        }
    }
}
