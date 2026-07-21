-- Purge Healan TEST operational data; keep AdminUser + master lookups (insurance/services/menus).
-- Usage (from /opt/healan after source .env):
--   docker exec -i healan-sqlserver /opt/mssql-tools18/bin/sqlcmd -C -S localhost -U sa -P "$MSSQL_SA_PASSWORD" -b -i /dev/stdin < docker/scripts/purge-test-clinic-data.sql
-- Or pipe this file via: cat docker/scripts/purge-test-clinic-data.sql | docker exec -i ...

SET NOCOUNT ON;
SET XACT_ABORT ON;

DECLARE @AdminId uniqueidentifier =
(
    SELECT TOP (1) Id
    FROM [Healan-Identity].dbo.AspNetUsers
    WHERE UserName = N'AdminUser'
);

IF @AdminId IS NULL
BEGIN
    RAISERROR(N'AdminUser not found in Healan-Identity.AspNetUsers — aborting.', 16, 1);
    RETURN;
END

PRINT CONCAT(N'Keeping AdminUser Id=', CONVERT(nvarchar(36), @AdminId));

BEGIN TRAN;

------------------------------------------------------------
-- A) Healan clinic operational / clinical data
------------------------------------------------------------
USE [Healan];

IF OBJECT_ID(N'dbo.LabTestResults', N'U') IS NOT NULL DELETE FROM dbo.LabTestResults;
IF OBJECT_ID(N'dbo.ImagingResults', N'U') IS NOT NULL DELETE FROM dbo.ImagingResults;
IF OBJECT_ID(N'dbo.LabTestRequests', N'U') IS NOT NULL DELETE FROM dbo.LabTestRequests;
IF OBJECT_ID(N'dbo.ImagingRequests', N'U') IS NOT NULL DELETE FROM dbo.ImagingRequests;
IF OBJECT_ID(N'dbo.PrescriptionDrugs', N'U') IS NOT NULL DELETE FROM dbo.PrescriptionDrugs;
IF OBJECT_ID(N'dbo.EchoReports', N'U') IS NOT NULL DELETE FROM dbo.EchoReports;
IF OBJECT_ID(N'dbo.Prescriptions', N'U') IS NOT NULL DELETE FROM dbo.Prescriptions;

IF OBJECT_ID(N'dbo.Payments', N'U') IS NOT NULL DELETE FROM dbo.Payments;
IF OBJECT_ID(N'dbo.InvoiceItems', N'U') IS NOT NULL DELETE FROM dbo.InvoiceItems;
IF OBJECT_ID(N'dbo.Invoice', N'U') IS NOT NULL DELETE FROM dbo.Invoice;

IF OBJECT_ID(N'dbo.AppointmentBookingServiceTypes', N'U') IS NOT NULL DELETE FROM dbo.AppointmentBookingServiceTypes;
IF OBJECT_ID(N'dbo.AppointmentBookings', N'U') IS NOT NULL DELETE FROM dbo.AppointmentBookings;

IF OBJECT_ID(N'dbo.AppointmentServiceType', N'U') IS NOT NULL DELETE FROM dbo.AppointmentServiceType;
IF OBJECT_ID(N'dbo.Appointments', N'U') IS NOT NULL DELETE FROM dbo.Appointments;

IF OBJECT_ID(N'dbo.AppointmentSlots', N'U') IS NOT NULL DELETE FROM dbo.AppointmentSlots;
IF OBJECT_ID(N'dbo.DoctorScheduleExceptions', N'U') IS NOT NULL DELETE FROM dbo.DoctorScheduleExceptions;
IF OBJECT_ID(N'dbo.DoctorScheduleTemplates', N'U') IS NOT NULL DELETE FROM dbo.DoctorScheduleTemplates;

IF OBJECT_ID(N'dbo.PatientBloodPressureLogs', N'U') IS NOT NULL DELETE FROM dbo.PatientBloodPressureLogs;
IF OBJECT_ID(N'dbo.PatientMedicationReminders', N'U') IS NOT NULL DELETE FROM dbo.PatientMedicationReminders;

IF OBJECT_ID(N'dbo.Patients', N'U') IS NOT NULL DELETE FROM dbo.Patients;
IF OBJECT_ID(N'dbo.Doctors', N'U') IS NOT NULL DELETE FROM dbo.Doctors;
IF OBJECT_ID(N'dbo.BookingAuthTokens', N'U') IS NOT NULL DELETE FROM dbo.BookingAuthTokens;

-- Detach attachments so Companies/Users can be removed
IF COL_LENGTH(N'dbo.Companies', N'AttachmentId') IS NOT NULL
    UPDATE dbo.Companies SET AttachmentId = NULL WHERE AttachmentId IS NOT NULL;
IF COL_LENGTH(N'dbo.Users', N'AttachmentId') IS NOT NULL
    UPDATE dbo.Users SET AttachmentId = NULL WHERE AttachmentId IS NOT NULL;
IF COL_LENGTH(N'dbo.Users', N'CompanyId') IS NOT NULL
    UPDATE dbo.Users SET CompanyId = NULL WHERE IdentityUserId = @AdminId;

-- Remove non-admin clinic users before companies (Users → Company FK)
DELETE FROM dbo.Users
WHERE IdentityUserId IS NULL
   OR IdentityUserId <> @AdminId;

-- Companies: leaves first (ParentCompanyRef)
WHILE 1 = 1
BEGIN
    DELETE FROM dbo.Companies
    WHERE NOT EXISTS (
        SELECT 1 FROM dbo.Companies AS ch WHERE ch.ParentCompanyRef = Companies.CompanyId
    );
    IF @@ROWCOUNT = 0 BREAK;
END

------------------------------------------------------------
-- B) Identity users except AdminUser
------------------------------------------------------------
USE [Healan-Identity];

IF OBJECT_ID(N'dbo.AccessUserGrant', N'U') IS NOT NULL
    DELETE FROM dbo.AccessUserGrant WHERE UserId <> @AdminId;

IF OBJECT_ID(N'dbo.ImpersonationAudits', N'U') IS NOT NULL
    DELETE FROM dbo.ImpersonationAudits
    WHERE ActorUserId <> @AdminId OR TargetUserId <> @AdminId;

DELETE FROM dbo.AspNetUserTokens WHERE UserId <> @AdminId;
DELETE FROM dbo.AspNetUserLogins WHERE UserId <> @AdminId;
DELETE FROM dbo.AspNetUserClaims WHERE UserId <> @AdminId;
DELETE FROM dbo.AspNetUserRoles WHERE UserId <> @AdminId;
DELETE FROM dbo.AspNetUsers WHERE Id <> @AdminId AND UserName <> N'AdminUser';

DECLARE @AdminRoleId uniqueidentifier =
(
    SELECT TOP (1) Id FROM dbo.AspNetRoles WHERE Name = N'Admin'
);

IF @AdminRoleId IS NOT NULL
   AND NOT EXISTS (
        SELECT 1 FROM dbo.AspNetUserRoles WHERE UserId = @AdminId AND RoleId = @AdminRoleId
   )
BEGIN
    INSERT INTO dbo.AspNetUserRoles (UserId, RoleId) VALUES (@AdminId, @AdminRoleId);
END

COMMIT;

PRINT N'Wipe complete.';
PRINT N'Restart identity-server (optional clinic user seed) and healan-webapi (default company if empty). Re-login as AdminUser.';
