using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace IdentityServer.Domain.Migrations;

public partial class NegareshAIAccessUserAudit : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<Guid>("CreatedBy", "AspNetUsers", "uniqueidentifier", nullable: true);
        migrationBuilder.AddColumn<DateTime>("CreatedUtc", "AspNetUsers", "datetime2", nullable: false, defaultValueSql: "SYSUTCDATETIME()");
        migrationBuilder.AddColumn<Guid>("DeletedBy", "AspNetUsers", "uniqueidentifier", nullable: true);
        migrationBuilder.AddColumn<DateTime>("DeletedUtc", "AspNetUsers", "datetime2", nullable: true);
        migrationBuilder.AddColumn<bool>("IsDeleted", "AspNetUsers", "bit", nullable: false, defaultValue: false);
        migrationBuilder.AddColumn<Guid>("ModifiedBy", "AspNetUsers", "uniqueidentifier", nullable: true);
        migrationBuilder.AddColumn<DateTime>("ModifiedUtc", "AspNetUsers", "datetime2", nullable: true);

        migrationBuilder.CreateTable(
            name: "AccessUserDeny",
            columns: table => new
            {
                AccessUserDenyId = table.Column<int>(type: "int", nullable: false)
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
                table.PrimaryKey("PK_AccessUserDeny", x => x.AccessUserDenyId);
                table.ForeignKey("FK_AccessUserDeny_AccessMenu_AccessMenuId", x => x.AccessMenuId, "AccessMenu", "AccessMenuId", onDelete: ReferentialAction.Restrict);
                table.ForeignKey("FK_AccessUserDeny_AccessSystem_AccessSystemId", x => x.AccessSystemId, "AccessSystem", "AccessSystemId", onDelete: ReferentialAction.Restrict);
                table.ForeignKey("FK_AccessUserDeny_AspNetUsers_UserId", x => x.UserId, "AspNetUsers", "Id", onDelete: ReferentialAction.Restrict);
            });
        migrationBuilder.CreateIndex("IX_AccessUserDeny_AccessMenuId", "AccessUserDeny", "AccessMenuId");
        migrationBuilder.CreateIndex("IX_AccessUserDeny_AccessSystemId", "AccessUserDeny", "AccessSystemId");
        migrationBuilder.CreateIndex("IX_AccessUserDeny_UserId_AccessSystemId_AccessMenuId", "AccessUserDeny",
            new[] { "UserId", "AccessSystemId", "AccessMenuId" }, unique: true);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable("AccessUserDeny");
        migrationBuilder.DropColumn("CreatedBy", "AspNetUsers");
        migrationBuilder.DropColumn("CreatedUtc", "AspNetUsers");
        migrationBuilder.DropColumn("DeletedBy", "AspNetUsers");
        migrationBuilder.DropColumn("DeletedUtc", "AspNetUsers");
        migrationBuilder.DropColumn("IsDeleted", "AspNetUsers");
        migrationBuilder.DropColumn("ModifiedBy", "AspNetUsers");
        migrationBuilder.DropColumn("ModifiedUtc", "AspNetUsers");
    }
}
