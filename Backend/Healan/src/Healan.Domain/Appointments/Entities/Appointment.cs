using Healan.Domain.Appointments.Enums;
using Healan.Domain.Doctors.Entities;
using Healan.Domain.Insurances.Entities;
using Healan.Domain.Invoices.Entities;
using Healan.Domain.Orders.Entities;
using Healan.Domain.Patients.Entities;
using Healan.Domain.PublicInfos.Entities;
using Share.Domain.Entities;

namespace Healan.Domain.Appointments.Entities;

public class Appointment : AuditableEntity
{
    public Appointment()
    {
        Invoices = new List<Invoice>();
        Prescriptions = new List<Prescription>();
        ServiceTypes=new List<ServiceType>();
    }
    public long AppointmentId { get; set; }
    public long PatientId { get; set; }
    public long DoctorId { get; set; }
    public DateTime AppointmentDate { get; set; }
    /// <summary>
    /// مدت زمان ویزیت
    /// </summary>
    public int? DurationMinutes { get; set; }
    /// <summary>
    /// وضعیت نوبت
    /// </summary>
    public AppointmentTypeId AppointmentTypeId { get; set; }
    /// <summary>
    /// یادداشت مرکز
    /// </summary>
    public string? Note { get; set; }

    public long? PrimaryInsuranceCompanyId { get; set; }
    public bool ConfirmPrimaryInsuranceCompany { get; set; }
    public long? SecondInsuranceCompanyId { get; set; }
    public bool ConfirmSecondInsuranceCompany { get; set; }


    public Patient Patient { get; set; }
    public Doctor Doctor { get; set; }
    public ICollection<ServiceType> ServiceTypes { get; set; }
    public List<Invoice> Invoices { get; set; }

    public InsuranceCompany? PrimaryInsuranceCompany { get; set; }
    public InsuranceCompany? SecondInsuranceCompany { get; set; }

    public ICollection<Prescription> Prescriptions { get; set; }
}