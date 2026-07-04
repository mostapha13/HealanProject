using Healan.Domain.Attachments.Entities;
using Healan.Domain.Orders.Enums;
using Share.Domain.Entities;
using System.Collections.ObjectModel;

namespace Healan.Domain.Orders.Entities;

public class ImagingRequest : AuditableEntity
{
    public ImagingRequest()
    {
        ImagingResults=new Collection<ImagingResult>();
    }
    public long ImagingRequestId { get; set; }
    public long PrescriptionId { get; set; }
    public ImageTypeId ImageTypeId { get; set; }
    public string Notes { get; set; }
    public Guid? AttachmentId { get; set; }
    public ICollection<ImagingResult> ImagingResults { get; set; }
    public Prescription Prescription { get; set; }
    public Attachment Attachment { get; set; }
}
