using Healan.Domain.Appointments.Entities;
using Share.Domain.Entities;
using System.Collections.ObjectModel;

namespace Healan.Domain.Orders.Entities;
public class Prescription : AuditableEntity
{
    public Prescription()
    {
        PrescriptionDrugs = new Collection<PrescriptionDrug>();
        LabTestRequests = new Collection<LabTestRequest>();
        ImagingRequests = new Collection<ImagingRequest>();
    }
    public long PrescriptionId { get; set; }
    public long AppointmentId { get; set; }
    public DateTime IssueDate { get; set; }
    public string Notes { get; set; }
    public DateTime? NextAppointmentDate { get; set; }

    public ICollection<PrescriptionDrug> PrescriptionDrugs { get; set; }
    public ICollection<LabTestRequest> LabTestRequests { get; set; }
    public ICollection<ImagingRequest> ImagingRequests { get; set; }
    public Appointment Appointment { get; set; }


}
