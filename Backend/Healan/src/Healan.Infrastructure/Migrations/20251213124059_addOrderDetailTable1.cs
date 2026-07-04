using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Healan.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class addOrderDetailTable1 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Description",
                table: "Payments",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AlterColumn<byte>(
                name: "ImageTypeId",
                table: "ImagingRequests",
                type: "tinyint",
                maxLength: 200,
                nullable: false,
                oldClrType: typeof(int),
                oldType: "int",
                oldMaxLength: 200);

            migrationBuilder.CreateTable(
                name: "OrderDetail",
                columns: table => new
                {
                    OrderId = table.Column<Guid>(type: "UniqueIdentifier", nullable: false),
                    FundId = table.Column<Guid>(type: "UniqueIdentifier", nullable: false),
                    InstrumentParameterId = table.Column<Guid>(type: "UniqueIdentifier", nullable: true),
                    BringCash = table.Column<decimal>(type: "decimal(18,0)", nullable: false, defaultValue: 0m),
                    BringShare = table.Column<decimal>(type: "decimal(18,0)", nullable: false, defaultValue: 0m),
                    StartDate = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "getdate()"),
                    EndDate = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "getdate()"),
                    IsDeny = table.Column<bool>(type: "Bit", nullable: false, defaultValue: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OrderDetail", x => x.OrderId);
                });

            migrationBuilder.CreateTable(
                name: "OrderType",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Name = table.Column<string>(type: "Nvarchar(100)", maxLength: 100, nullable: false),
                    StartForm = table.Column<string>(type: "Nvarchar(100)", maxLength: 100, nullable: false),
                    SearchForm = table.Column<string>(type: "Nvarchar(100)", maxLength: 100, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OrderType", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "OrderCashInfo",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    OrderId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    OrderTypeId = table.Column<Guid>(type: "uniqueidentifier", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OrderCashInfo", x => x.Id);
                    table.ForeignKey(
                        name: "FK_OrderCashInfo_OrderType_OrderTypeId",
                        column: x => x.OrderTypeId,
                        principalTable: "OrderType",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_OrderCashInfo_OrderTypeId",
                table: "OrderCashInfo",
                column: "OrderTypeId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "OrderCashInfo");

            migrationBuilder.DropTable(
                name: "OrderDetail");

            migrationBuilder.DropTable(
                name: "OrderType");

            migrationBuilder.DropColumn(
                name: "Description",
                table: "Payments");

            migrationBuilder.AlterColumn<int>(
                name: "ImageTypeId",
                table: "ImagingRequests",
                type: "int",
                maxLength: 200,
                nullable: false,
                oldClrType: typeof(byte),
                oldType: "tinyint",
                oldMaxLength: 200);
        }
    }
}
