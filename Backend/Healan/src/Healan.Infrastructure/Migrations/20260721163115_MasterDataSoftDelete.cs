using Healan.Infrastructure.Context;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Healan.Infrastructure.Migrations;

[DbContext(typeof(ApplicationDbContext))]
[Migration("20260721163115_MasterDataSoftDelete")]
public partial class MasterDataSoftDelete : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<DateTime>(
            name: "CreatedAt",
            table: "ServiceTypes",
            type: "datetime2",
            nullable: false,
            defaultValueSql: "SYSUTCDATETIME()");

        migrationBuilder.AddColumn<Guid>(
            name: "CreatedBy",
            table: "ServiceTypes",
            type: "uniqueidentifier",
            nullable: false,
            defaultValue: Guid.Empty);

        migrationBuilder.AddColumn<DateTime>(
            name: "DeletedAt",
            table: "ServiceTypes",
            type: "datetime2",
            nullable: true);

        migrationBuilder.AddColumn<Guid>(
            name: "DeletedBy",
            table: "ServiceTypes",
            type: "uniqueidentifier",
            nullable: true);

        migrationBuilder.AddColumn<short>(
            name: "DepartmentId",
            table: "ServiceTypes",
            type: "smallint",
            nullable: false,
            defaultValue: (short)0);

        migrationBuilder.AddColumn<bool>(
            name: "IsDeleted",
            table: "ServiceTypes",
            type: "bit",
            nullable: false,
            defaultValue: false);

        migrationBuilder.AddColumn<DateTime>(
            name: "LastModifiedAt",
            table: "ServiceTypes",
            type: "datetime2",
            nullable: true);

        migrationBuilder.AddColumn<Guid>(
            name: "LastModifiedBy",
            table: "ServiceTypes",
            type: "uniqueidentifier",
            nullable: true);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropColumn(name: "CreatedAt", table: "ServiceTypes");
        migrationBuilder.DropColumn(name: "CreatedBy", table: "ServiceTypes");
        migrationBuilder.DropColumn(name: "DeletedAt", table: "ServiceTypes");
        migrationBuilder.DropColumn(name: "DeletedBy", table: "ServiceTypes");
        migrationBuilder.DropColumn(name: "DepartmentId", table: "ServiceTypes");
        migrationBuilder.DropColumn(name: "IsDeleted", table: "ServiceTypes");
        migrationBuilder.DropColumn(name: "LastModifiedAt", table: "ServiceTypes");
        migrationBuilder.DropColumn(name: "LastModifiedBy", table: "ServiceTypes");
    }
}
