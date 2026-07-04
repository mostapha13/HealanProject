using Healan.Domain.Appointments.Entities;
using Healan.Domain.Invoices.Enums;
using Share.Domain.Entities;

namespace Healan.Domain.Invoices.Entities;
public class Invoice : AuditableEntity
{
    public Invoice()
    {
        InvoiceItems = new List<InvoiceItem>();
        Payments = new List<Payment>();
    }
    public long InvoiceId { get; set; }
    public long AppointmentId { get; set; }

    public InvoiceStatusTypeId InvoiceStatusTypeId { get; set; }
    public decimal TotalAmount { get; set; }
    public decimal PrimaryInsuranceCovered { get; set; }
    public decimal SecondaryInsuranceCovered { get; set; }
    public decimal PatientPayable { get; set; }
    public Appointment Appointment { get; set; }

    public List<InvoiceItem> InvoiceItems { get; set; }
    public List<Payment> Payments { get; set; }

}
