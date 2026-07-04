using Healan.Domain.Attachments.Entities;
using Share.Domain.Entities;

namespace Healan.Domain.Orders.Entities;

public class LabTestResult : AuditableEntity
{
    public long LabTestResultId{ get; set; }
    public long LabTestRequestId { get; set; }
    public string LabResultData { get; set; }
    public Guid? AttachmentId { get; set; }
    public Attachment Attachment { get; set; }
    public LabTestRequest LabTestRequest { get; set; }
}
