using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Healan.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class EchoReportsSnapshotFix : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "EchoReports",
                columns: table => new
                {
                    EchoReportId = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    PrescriptionId = table.Column<long>(type: "bigint", nullable: false),
                    Phm = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    Rvid = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    Lvidd = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    Lvids = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    Ivsd = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    Pwd = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    Lvef = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    SimpsonEf = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    LvMass = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    Sm = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    TelIndex = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    AvAnnulus = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    SinusValsalva = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    StJunction = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    Acs = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    AscAo = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    LaArea = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    LaDia = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    LaVolume = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    Edv = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    Esv = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    Mve = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    Mva = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    Mvdt = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    Mvpht = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    MvMean = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    MvArea = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    MvAnnulus = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    PvsMax = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    PvdMax = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    DtiEm = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    DtiAm = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    AovMax = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    LvotVmax = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    LvotVti = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    AvVti = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    AoPeak = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    AoMean = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    Ava = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    At = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    AovMg = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    AovPg = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    TrgMax = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    Rvsp = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    Pap = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    TvMean = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    TvAnnulus = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    TvMg = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    TvPg = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    PvMax = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    PvPg = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    PvVti = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    RvotVti = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    Piphi = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    Ivc = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    RaArea = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    SeptalE = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    LateralE = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    SPrime = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    APrime = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    SmTdi = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    Tapsie = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    Conclusion = table.Column<string>(type: "nvarchar(4000)", maxLength: 4000, nullable: true),
                    Recommendation = table.Column<string>(type: "nvarchar(4000)", maxLength: 4000, nullable: true),
                    CreatedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    DepartmentId = table.Column<short>(type: "smallint", nullable: false),
                    LastModifiedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    LastModifiedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    DeletedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    DeletedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EchoReports", x => x.EchoReportId);
                    table.ForeignKey(
                        name: "FK_EchoReports_Prescriptions_PrescriptionId",
                        column: x => x.PrescriptionId,
                        principalTable: "Prescriptions",
                        principalColumn: "PrescriptionId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_EchoReports_PrescriptionId",
                table: "EchoReports",
                column: "PrescriptionId",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "EchoReports");
        }
    }
}
