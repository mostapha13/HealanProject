using Healan.Infrastructure.Context;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Healan.Infrastructure.Migrations
{
    [DbContext(typeof(ApplicationDbContext))]
    [Migration("20260717190000_AddBookingTables")]
    public partial class AddBookingTables : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
IF OBJECT_ID(N'dbo.DoctorScheduleTemplates', N'U') IS NULL
BEGIN
    CREATE TABLE [DoctorScheduleTemplates] (
        [DoctorScheduleTemplateId] bigint NOT NULL IDENTITY(1,1),
        [DoctorId] bigint NOT NULL,
        [DayOfWeek] int NOT NULL,
        [StartTime] time NOT NULL,
        [EndTime] time NOT NULL,
        [VisitDurationMinutes] int NOT NULL CONSTRAINT [DF_DoctorScheduleTemplates_VisitDurationMinutes] DEFAULT 30,
        [IsActive] bit NOT NULL CONSTRAINT [DF_DoctorScheduleTemplates_IsActive] DEFAULT 1,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        CONSTRAINT [PK_DoctorScheduleTemplates] PRIMARY KEY ([DoctorScheduleTemplateId]),
        CONSTRAINT [FK_DoctorScheduleTemplates_Doctors_DoctorId] FOREIGN KEY ([DoctorId]) REFERENCES [Doctors] ([DoctorId]) ON DELETE NO ACTION
    );
    CREATE UNIQUE INDEX [IX_DoctorScheduleTemplates_DoctorId_DayOfWeek] ON [DoctorScheduleTemplates] ([DoctorId], [DayOfWeek]);
END

IF OBJECT_ID(N'dbo.DoctorScheduleExceptions', N'U') IS NULL
BEGIN
    CREATE TABLE [DoctorScheduleExceptions] (
        [DoctorScheduleExceptionId] bigint NOT NULL IDENTITY(1,1),
        [DoctorId] bigint NOT NULL,
        [Date] date NOT NULL,
        [IsClosed] bit NOT NULL,
        [StartTime] time NULL,
        [EndTime] time NULL,
        [VisitDurationMinutes] int NULL,
        [Note] nvarchar(500) NULL,
        [CreatedAt] datetime2 NOT NULL,
        CONSTRAINT [PK_DoctorScheduleExceptions] PRIMARY KEY ([DoctorScheduleExceptionId]),
        CONSTRAINT [FK_DoctorScheduleExceptions_Doctors_DoctorId] FOREIGN KEY ([DoctorId]) REFERENCES [Doctors] ([DoctorId]) ON DELETE NO ACTION
    );
    CREATE UNIQUE INDEX [IX_DoctorScheduleExceptions_DoctorId_Date] ON [DoctorScheduleExceptions] ([DoctorId], [Date]);
END

IF OBJECT_ID(N'dbo.AppointmentSlots', N'U') IS NULL
BEGIN
    CREATE TABLE [AppointmentSlots] (
        [AppointmentSlotId] bigint NOT NULL IDENTITY(1,1),
        [DoctorId] bigint NOT NULL,
        [StartAt] datetime2 NOT NULL,
        [EndAt] datetime2 NOT NULL,
        [Status] tinyint NOT NULL,
        [Source] tinyint NOT NULL,
        [Note] nvarchar(500) NULL,
        [CreatedAt] datetime2 NOT NULL,
        CONSTRAINT [PK_AppointmentSlots] PRIMARY KEY ([AppointmentSlotId]),
        CONSTRAINT [FK_AppointmentSlots_Doctors_DoctorId] FOREIGN KEY ([DoctorId]) REFERENCES [Doctors] ([DoctorId]) ON DELETE NO ACTION
    );
    CREATE UNIQUE INDEX [IX_AppointmentSlots_DoctorId_StartAt] ON [AppointmentSlots] ([DoctorId], [StartAt]);
    CREATE INDEX [IX_AppointmentSlots_DoctorId_StartAt_Status] ON [AppointmentSlots] ([DoctorId], [StartAt], [Status]);
END

IF OBJECT_ID(N'dbo.AppointmentBookings', N'U') IS NULL
BEGIN
    CREATE TABLE [AppointmentBookings] (
        [AppointmentBookingId] bigint NOT NULL IDENTITY(1,1),
        [AppointmentSlotId] bigint NOT NULL,
        [DoctorId] bigint NOT NULL,
        [PatientId] bigint NULL,
        [NationalCode] nvarchar(10) NOT NULL,
        [PhoneNumber] nvarchar(11) NOT NULL,
        [FirstName] nvarchar(100) NOT NULL,
        [LastName] nvarchar(100) NOT NULL,
        [Note] nvarchar(1000) NULL,
        [Status] tinyint NOT NULL,
        [AppointmentId] bigint NULL,
        [BookedByStaff] bit NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        [CancelledAt] datetime2 NULL,
        CONSTRAINT [PK_AppointmentBookings] PRIMARY KEY ([AppointmentBookingId]),
        CONSTRAINT [FK_AppointmentBookings_AppointmentSlots_AppointmentSlotId] FOREIGN KEY ([AppointmentSlotId]) REFERENCES [AppointmentSlots] ([AppointmentSlotId]) ON DELETE NO ACTION,
        CONSTRAINT [FK_AppointmentBookings_Doctors_DoctorId] FOREIGN KEY ([DoctorId]) REFERENCES [Doctors] ([DoctorId]) ON DELETE NO ACTION,
        CONSTRAINT [FK_AppointmentBookings_Patients_PatientId] FOREIGN KEY ([PatientId]) REFERENCES [Patients] ([PatientId]) ON DELETE NO ACTION,
        CONSTRAINT [FK_AppointmentBookings_Appointments_AppointmentId] FOREIGN KEY ([AppointmentId]) REFERENCES [Appointments] ([AppointmentId]) ON DELETE NO ACTION
    );
    CREATE UNIQUE INDEX [IX_AppointmentBookings_AppointmentSlotId] ON [AppointmentBookings] ([AppointmentSlotId]);
    CREATE INDEX [IX_AppointmentBookings_NationalCode_CreatedAt] ON [AppointmentBookings] ([NationalCode], [CreatedAt]);
    CREATE INDEX [IX_AppointmentBookings_PhoneNumber_CreatedAt] ON [AppointmentBookings] ([PhoneNumber], [CreatedAt]);
    CREATE INDEX [IX_AppointmentBookings_Status_CreatedAt] ON [AppointmentBookings] ([Status], [CreatedAt]);
END

IF OBJECT_ID(N'dbo.AppointmentBookingServiceTypes', N'U') IS NULL
BEGIN
    CREATE TABLE [AppointmentBookingServiceTypes] (
        [AppointmentBookingId] bigint NOT NULL,
        [ServiceTypeId] bigint NOT NULL,
        CONSTRAINT [PK_AppointmentBookingServiceTypes] PRIMARY KEY ([AppointmentBookingId], [ServiceTypeId]),
        CONSTRAINT [FK_AppointmentBookingServiceTypes_AppointmentBookings_AppointmentBookingId] FOREIGN KEY ([AppointmentBookingId]) REFERENCES [AppointmentBookings] ([AppointmentBookingId]) ON DELETE CASCADE,
        CONSTRAINT [FK_AppointmentBookingServiceTypes_ServiceTypes_ServiceTypeId] FOREIGN KEY ([ServiceTypeId]) REFERENCES [ServiceTypes] ([ServiceTypeId]) ON DELETE CASCADE
    );
    CREATE INDEX [IX_AppointmentBookingServiceTypes_ServiceTypeId] ON [AppointmentBookingServiceTypes] ([ServiceTypeId]);
END
");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
IF OBJECT_ID(N'dbo.AppointmentBookingServiceTypes', N'U') IS NOT NULL DROP TABLE [AppointmentBookingServiceTypes];
IF OBJECT_ID(N'dbo.AppointmentBookings', N'U') IS NOT NULL DROP TABLE [AppointmentBookings];
IF OBJECT_ID(N'dbo.AppointmentSlots', N'U') IS NOT NULL DROP TABLE [AppointmentSlots];
IF OBJECT_ID(N'dbo.DoctorScheduleExceptions', N'U') IS NOT NULL DROP TABLE [DoctorScheduleExceptions];
IF OBJECT_ID(N'dbo.DoctorScheduleTemplates', N'U') IS NOT NULL DROP TABLE [DoctorScheduleTemplates];
");
        }
    }
}
