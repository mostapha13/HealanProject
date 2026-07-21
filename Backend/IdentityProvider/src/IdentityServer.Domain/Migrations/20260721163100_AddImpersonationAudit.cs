using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace IdentityServer.Domain.Migrations
{
    /// <inheritdoc />
    public partial class AddImpersonationAudit : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ImpersonationAudits",
                columns: table => new
                {
                    ImpersonationAuditId = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ActorUserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    TargetUserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    SessionId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    OccurredAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false),
                    IpAddress = table.Column<string>(type: "nvarchar(45)", maxLength: 45, nullable: false),
                    Event = table.Column<string>(type: "nvarchar(16)", maxLength: 16, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ImpersonationAudits", x => x.ImpersonationAuditId);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ImpersonationAudits_ActorUserId",
                table: "ImpersonationAudits",
                column: "ActorUserId");

            migrationBuilder.CreateIndex(
                name: "IX_ImpersonationAudits_SessionId_Event",
                table: "ImpersonationAudits",
                columns: new[] { "SessionId", "Event" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ImpersonationAudits_TargetUserId",
                table: "ImpersonationAudits",
                column: "TargetUserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(name: "ImpersonationAudits");
        }
    }
}
