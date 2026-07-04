using Healan.Domain.Appointments.Entities;
using Healan.Domain.Insurances.Entities;
using Healan.Domain.Invoices.Entities;
using Healan.Domain.MedicalFeeServices.Entities;
using Healan.Domain.MedicalFeeServices.Enums;
using Share.Domain.Entities;
using System.Collections.ObjectModel;

namespace Healan.Domain.PublicInfos.Entities;

public class ServiceType //: AuditableEntity
{
    public ServiceType()
    {
        MedicalFeeServices = new Collection<MedicalFeeService>();
        InvoiceItems = new Collection<InvoiceItem>();
        InsuranceContractServices = new Collection<InsuranceContractService>();
        Appointments=new Collection<Appointment>();
    }
    public long ServiceTypeId { get; set; }
    public string Title { get; set; }
    public string? Code { get; set; }
    public CategoryTypeId CategoryTypeId { get; set; }
    public string Description { get; set; }
    public ICollection<MedicalFeeService> MedicalFeeServices { get; set; }
    public ICollection<InvoiceItem> InvoiceItems { get; set; }
    public ICollection<InsuranceContractService> InsuranceContractServices { get; set; }
    public ICollection<Appointment> Appointments { get; set; }
}

