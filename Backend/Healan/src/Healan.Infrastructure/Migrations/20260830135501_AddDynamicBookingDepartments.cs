using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Healan.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddDynamicBookingDepartments : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_DoctorScheduleTemplates_DoctorId_DayOfWeek",
                table: "DoctorScheduleTemplates");

            migrationBuilder.AddColumn<long>(
                name: "BookingDepartmentId",
                table: "DoctorScheduleTemplates",
                type: "bigint",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "ComplementaryInsuranceLimit",
                table: "DoctorScheduleTemplates",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<long>(
                name: "BookingDepartmentId",
                table: "AppointmentSlots",
                type: "bigint",
                nullable: true);

            migrationBuilder.AddColumn<long>(
                name: "DoctorScheduleTemplateId",
                table: "AppointmentSlots",
                type: "bigint",
                nullable: true);

            migrationBuilder.AddColumn<long>(
                name: "BookingDepartmentId",
                table: "AppointmentBookings",
                type: "bigint",
                nullable: true);

            migrationBuilder.AddColumn<byte>(
                name: "PaymentType",
                table: "AppointmentBookings",
                type: "tinyint",
                nullable: false,
                defaultValue: (byte)1);

            migrationBuilder.AddColumn<long>(
                name: "ServiceTypeId",
                table: "AppointmentBookings",
                type: "bigint",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "BookingDepartments",
                columns: table => new
                {
                    BookingDepartmentId = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Title = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: false),
                    MedicalGroupTypeId = table.Column<int>(type: "int", nullable: false),
                    SortOrder = table.Column<int>(type: "int", nullable: false),
                    SupportsComplementaryInsurance = table.Column<bool>(type: "bit", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BookingDepartments", x => x.BookingDepartmentId);
                });

            migrationBuilder.CreateTable(
                name: "BookingDepartmentServices",
                columns: table => new
                {
                    BookingDepartmentId = table.Column<long>(type: "bigint", nullable: false),
                    ServiceTypeId = table.Column<long>(type: "bigint", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BookingDepartmentServices", x => new { x.BookingDepartmentId, x.ServiceTypeId });
                    table.ForeignKey(
                        name: "FK_BookingDepartmentServices_BookingDepartments_BookingDepartmentId",
                        column: x => x.BookingDepartmentId,
                        principalTable: "BookingDepartments",
                        principalColumn: "BookingDepartmentId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_BookingDepartmentServices_ServiceTypes_ServiceTypeId",
                        column: x => x.ServiceTypeId,
                        principalTable: "ServiceTypes",
                        principalColumn: "ServiceTypeId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_DoctorScheduleTemplates_BookingDepartmentId",
                table: "DoctorScheduleTemplates",
                column: "BookingDepartmentId");

            migrationBuilder.CreateIndex(
                name: "IX_DoctorScheduleTemplates_DoctorId_DayOfWeek_StartTime_BookingDepartmentId",
                table: "DoctorScheduleTemplates",
                columns: new[] { "DoctorId", "DayOfWeek", "StartTime", "BookingDepartmentId" },
                unique: true,
                filter: "[BookingDepartmentId] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_AppointmentSlots_BookingDepartmentId",
                table: "AppointmentSlots",
                column: "BookingDepartmentId");

            migrationBuilder.CreateIndex(
                name: "IX_AppointmentSlots_DoctorScheduleTemplateId",
                table: "AppointmentSlots",
                column: "DoctorScheduleTemplateId");

            migrationBuilder.CreateIndex(
                name: "IX_AppointmentBookings_BookingDepartmentId",
                table: "AppointmentBookings",
                column: "BookingDepartmentId");

            migrationBuilder.CreateIndex(
                name: "IX_AppointmentBookings_ServiceTypeId",
                table: "AppointmentBookings",
                column: "ServiceTypeId");

            migrationBuilder.CreateIndex(
                name: "IX_BookingDepartments_MedicalGroupTypeId_Title",
                table: "BookingDepartments",
                columns: new[] { "MedicalGroupTypeId", "Title" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_BookingDepartmentServices_ServiceTypeId",
                table: "BookingDepartmentServices",
                column: "ServiceTypeId");

            migrationBuilder.AddForeignKey(
                name: "FK_AppointmentBookings_BookingDepartments_BookingDepartmentId",
                table: "AppointmentBookings",
                column: "BookingDepartmentId",
                principalTable: "BookingDepartments",
                principalColumn: "BookingDepartmentId",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_AppointmentBookings_ServiceTypes_ServiceTypeId",
                table: "AppointmentBookings",
                column: "ServiceTypeId",
                principalTable: "ServiceTypes",
                principalColumn: "ServiceTypeId",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_AppointmentSlots_BookingDepartments_BookingDepartmentId",
                table: "AppointmentSlots",
                column: "BookingDepartmentId",
                principalTable: "BookingDepartments",
                principalColumn: "BookingDepartmentId",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_AppointmentSlots_DoctorScheduleTemplates_DoctorScheduleTemplateId",
                table: "AppointmentSlots",
                column: "DoctorScheduleTemplateId",
                principalTable: "DoctorScheduleTemplates",
                principalColumn: "DoctorScheduleTemplateId",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_DoctorScheduleTemplates_BookingDepartments_BookingDepartmentId",
                table: "DoctorScheduleTemplates",
                column: "BookingDepartmentId",
                principalTable: "BookingDepartments",
                principalColumn: "BookingDepartmentId",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_AppointmentBookings_BookingDepartments_BookingDepartmentId",
                table: "AppointmentBookings");

            migrationBuilder.DropForeignKey(
                name: "FK_AppointmentBookings_ServiceTypes_ServiceTypeId",
                table: "AppointmentBookings");

            migrationBuilder.DropForeignKey(
                name: "FK_AppointmentSlots_BookingDepartments_BookingDepartmentId",
                table: "AppointmentSlots");

            migrationBuilder.DropForeignKey(
                name: "FK_AppointmentSlots_DoctorScheduleTemplates_DoctorScheduleTemplateId",
                table: "AppointmentSlots");

            migrationBuilder.DropForeignKey(
                name: "FK_DoctorScheduleTemplates_BookingDepartments_BookingDepartmentId",
                table: "DoctorScheduleTemplates");

            migrationBuilder.DropTable(
                name: "BookingDepartmentServices");

            migrationBuilder.DropTable(
                name: "BookingDepartments");

            migrationBuilder.DropIndex(
                name: "IX_DoctorScheduleTemplates_BookingDepartmentId",
                table: "DoctorScheduleTemplates");

            migrationBuilder.DropIndex(
                name: "IX_DoctorScheduleTemplates_DoctorId_DayOfWeek_StartTime_BookingDepartmentId",
                table: "DoctorScheduleTemplates");

            migrationBuilder.DropIndex(
                name: "IX_AppointmentSlots_BookingDepartmentId",
                table: "AppointmentSlots");

            migrationBuilder.DropIndex(
                name: "IX_AppointmentSlots_DoctorScheduleTemplateId",
                table: "AppointmentSlots");

            migrationBuilder.DropIndex(
                name: "IX_AppointmentBookings_BookingDepartmentId",
                table: "AppointmentBookings");

            migrationBuilder.DropIndex(
                name: "IX_AppointmentBookings_ServiceTypeId",
                table: "AppointmentBookings");

            migrationBuilder.DropColumn(
                name: "BookingDepartmentId",
                table: "DoctorScheduleTemplates");

            migrationBuilder.DropColumn(
                name: "ComplementaryInsuranceLimit",
                table: "DoctorScheduleTemplates");

            migrationBuilder.DropColumn(
                name: "BookingDepartmentId",
                table: "AppointmentSlots");

            migrationBuilder.DropColumn(
                name: "DoctorScheduleTemplateId",
                table: "AppointmentSlots");

            migrationBuilder.DropColumn(
                name: "BookingDepartmentId",
                table: "AppointmentBookings");

            migrationBuilder.DropColumn(
                name: "PaymentType",
                table: "AppointmentBookings");

            migrationBuilder.DropColumn(
                name: "ServiceTypeId",
                table: "AppointmentBookings");

            migrationBuilder.CreateIndex(
                name: "IX_DoctorScheduleTemplates_DoctorId_DayOfWeek",
                table: "DoctorScheduleTemplates",
                columns: new[] { "DoctorId", "DayOfWeek" },
                unique: true);
        }
    }
}
