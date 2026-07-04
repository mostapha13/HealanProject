using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Notification.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class init : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "NotificationInfo",
                columns: table => new
                {
                    NotificationInfoId = table.Column<Guid>(type: "UniqueIdentifier", nullable: false),
                    InstrumentId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    OrderId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    AccessSystemId = table.Column<byte>(type: "tinyint", nullable: false, defaultValue: (byte)1),
                    MessageText = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Notif_Date = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Creator = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Instrument_SymbolCode = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Instrument_Symbol = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Instrument_SymbolName = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Instrument_MarketTypeId = table.Column<byte>(type: "tinyint", nullable: true),
                    Instrument_Investment = table.Column<long>(type: "bigint", nullable: true),
                    Instrument_CompanyName = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ExtraInfo = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_NotificationInfo", x => x.NotificationInfoId);
                });

            migrationBuilder.CreateTable(
                name: "NotificationUser",
                columns: table => new
                {
                    NotificationUserId = table.Column<Guid>(type: "UniqueIdentifier", nullable: false),
                    NotificationInfoId = table.Column<Guid>(type: "UniqueIdentifier", nullable: false),
                    UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ReadDateTime = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_NotificationUser", x => x.NotificationUserId);
                    table.ForeignKey(
                        name: "FK_NotificationUser_NotificationInfo_NotificationInfoId",
                        column: x => x.NotificationInfoId,
                        principalTable: "NotificationInfo",
                        principalColumn: "NotificationInfoId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_NotificationUser_NotificationInfoId",
                table: "NotificationUser",
                column: "NotificationInfoId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "NotificationUser");

            migrationBuilder.DropTable(
                name: "NotificationInfo");
        }
    }
}
