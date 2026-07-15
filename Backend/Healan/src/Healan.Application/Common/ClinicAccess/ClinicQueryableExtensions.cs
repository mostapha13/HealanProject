using Healan.Domain.Appointments.Entities;
using Healan.Domain.Doctors.Entities;
using Healan.Domain.Orders.Entities;
using Healan.Domain.Patients.Entities;

namespace Healan.Application.Common.ClinicAccess;

public static class ClinicQueryableExtensions
{
    public static IQueryable<Appointment> ApplyClinicScope(
        this IQueryable<Appointment> query,
        ClinicAccessScope scope)
    {
        return scope.Mode switch
        {
            ClinicDataAccessMode.All => query,
            ClinicDataAccessMode.ByDoctor when scope.DoctorId is > 0 =>
                query.Where(a => a.DoctorId == scope.DoctorId.Value),
            ClinicDataAccessMode.ByCompany when scope.CompanyId is > 0 =>
                query.Where(a => a.Doctor.CompanyId == scope.CompanyId.Value),
            ClinicDataAccessMode.ByCompany =>
                query.Where(a => a.CreatedBy == scope.IdentityUserId),
            _ => query.Where(_ => false),
        };
    }

    public static IQueryable<Patient> ApplyClinicScope(
        this IQueryable<Patient> query,
        ClinicAccessScope scope)
    {
        return scope.Mode switch
        {
            ClinicDataAccessMode.All => query,
            ClinicDataAccessMode.ByDoctor when scope.DoctorId is > 0 =>
                query.Where(p => p.Appointments.Any(a => a.DoctorId == scope.DoctorId.Value)),
            ClinicDataAccessMode.ByCompany when scope.CompanyId is > 0 =>
                query.Where(p =>
                    p.Appointments.Any(a => a.Doctor.CompanyId == scope.CompanyId.Value)
                    || p.CreatedBy == scope.IdentityUserId),
            ClinicDataAccessMode.ByCompany =>
                query.Where(p =>
                    p.CreatedBy == scope.IdentityUserId
                    || p.Appointments.Any(a => a.CreatedBy == scope.IdentityUserId)),
            _ => query.Where(_ => false),
        };
    }

    public static IQueryable<Doctor> ApplyClinicScope(
        this IQueryable<Doctor> query,
        ClinicAccessScope scope)
    {
        return scope.Mode switch
        {
            ClinicDataAccessMode.All => query,
            ClinicDataAccessMode.ByDoctor when scope.DoctorId is > 0 =>
                query.Where(d => d.DoctorId == scope.DoctorId.Value),
            ClinicDataAccessMode.ByCompany when scope.CompanyId is > 0 =>
                query.Where(d => d.CompanyId == scope.CompanyId.Value),
            ClinicDataAccessMode.ByCompany =>
                query.Where(_ => false),
            _ => query.Where(_ => false),
        };
    }

    public static IQueryable<Prescription> ApplyClinicScope(
        this IQueryable<Prescription> query,
        ClinicAccessScope scope)
    {
        return scope.Mode switch
        {
            ClinicDataAccessMode.All => query,
            ClinicDataAccessMode.ByDoctor when scope.DoctorId is > 0 =>
                query.Where(p => p.Appointment.DoctorId == scope.DoctorId.Value),
            ClinicDataAccessMode.ByCompany when scope.CompanyId is > 0 =>
                query.Where(p => p.Appointment.Doctor.CompanyId == scope.CompanyId.Value),
            ClinicDataAccessMode.ByCompany =>
                query.Where(p => p.Appointment.CreatedBy == scope.IdentityUserId),
            _ => query.Where(_ => false),
        };
    }

    public static bool AllowsAppointment(this ClinicAccessScope scope, Appointment appointment)
    {
        return scope.Mode switch
        {
            ClinicDataAccessMode.All => true,
            ClinicDataAccessMode.ByDoctor =>
                scope.DoctorId is > 0 && appointment.DoctorId == scope.DoctorId.Value,
            ClinicDataAccessMode.ByCompany when scope.CompanyId is > 0 =>
                appointment.Doctor != null && appointment.Doctor.CompanyId == scope.CompanyId.Value,
            ClinicDataAccessMode.ByCompany =>
                appointment.CreatedBy == scope.IdentityUserId,
            _ => false,
        };
    }

    public static bool AllowsPatient(this ClinicAccessScope scope, bool patientVisible)
        => scope.Mode == ClinicDataAccessMode.All || patientVisible;
}
