using Healan.Domain.Attachments.Entities;
using Share.Domain.Entities;

namespace Healan.Domain.Orders.Entities;

public class ImagingResult : AuditableEntity
{
    public long ImagingResultId { get; set; }
    public long ImagingRequestId { get; set; }
    public string Report { get; set; }
    public Guid? AttachmentId { get; set; }
    public ImagingRequest ImagingRequest { get; set; }
    public Attachment Attachment { get; set; }
}