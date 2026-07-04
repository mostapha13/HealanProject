using Healan.Domain.Attachments.Entities;
using Share.Domain.Entities;
using System.Collections.ObjectModel;

namespace Healan.Domain.Orders.Entities;
public class LabTestRequest : AuditableEntity
{
    public LabTestRequest()
    {
        LabTestResults = new Collection<LabTestResult>();
    }
    public long LabTestRequestId { get; set; }
    public long PrescriptionId { get; set; }
    public string LabTestType { get; set; }
    public string Notes { get; set; }
    public Guid? AttachmentId { get; set; }
    public Attachment Attachment { get; set; }
    public ICollection<LabTestResult> LabTestResults { get; set; }
    public Prescription Prescription { get; set; }
}
