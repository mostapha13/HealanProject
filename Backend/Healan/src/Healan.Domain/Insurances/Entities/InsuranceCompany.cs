using Healan.Domain.Appointments.Entities;
using Healan.Domain.Attachments.Entities;
using Healan.Domain.Insurances.Enums;
using Healan.Domain.Patients.Entities;
using Share.Domain.Entities;
using System.Collections.ObjectModel;

namespace Healan.Domain.Insurances.Entities;

/// <summary>
/// شرکت بیمه
/// </summary>
public class InsuranceCompany:AuditableEntity
{
    public InsuranceCompany()
    {
        InsuranceContracts=new Collection<InsuranceContract>();
        PrimaryInsuranceAppointments = new Collection<Appointment>();
        SecondInsuranceAppointments = new Collection<Appointment>();
    }
    public long InsuranceCompanyId { get; set; }
    public InsuranceTypeId InsuranceTypeId { get; set; }
    public string Name { get; set; }
    public string? Code { get; set; }
    public string? PhoneNumber { get; set; }
    public Guid? AttachmentId { get; set; }
    public Attachment Attachment { get; set; }
    public ICollection<InsuranceContract> InsuranceContracts { get; set; }
    public ICollection<Appointment> PrimaryInsuranceAppointments { get; set; }
    public ICollection<Appointment> SecondInsuranceAppointments { get; set; }
}