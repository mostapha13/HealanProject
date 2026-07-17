using Healan.Infrastructure.Context;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Healan.Infrastructure.Migrations
{
    [DbContext(typeof(ApplicationDbContext))]
    [Migration("20260717210000_AddBookingAuthTokens")]
    public partial class AddBookingAuthTokens : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
IF OBJECT_ID(N'dbo.BookingAuthTokens', N'U') IS NULL
BEGIN
    CREATE TABLE [BookingAuthTokens] (
        [TokenKey] nvarchar(128) NOT NULL,
        [TokenValue] nvarchar(64) NOT NULL,
        [ExpiresAtUtc] datetime2 NOT NULL,
        CONSTRAINT [PK_BookingAuthTokens] PRIMARY KEY ([TokenKey])
    );
    CREATE INDEX [IX_BookingAuthTokens_ExpiresAtUtc] ON [BookingAuthTokens] ([ExpiresAtUtc]);
END
");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
IF OBJECT_ID(N'dbo.BookingAuthTokens', N'U') IS NOT NULL DROP TABLE [BookingAuthTokens];
");
        }
    }
}
