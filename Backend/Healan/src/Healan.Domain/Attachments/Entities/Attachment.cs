using Share.Domain.Entities;

namespace Healan.Domain.Attachments.Entities;
public class Attachment : AuditableEntity
{
    public Guid FileId { get; set; }
    public string Link { get; set; }
    public string Title { get; set; }
    public string FileName { get; set; }
    public string FileType { get; set; }
    public Guid? ParentId { get; set; }
    public int? SignerUserId { get; set; }
    public string? SignerFirstName { get; set; }
    public string? SignerLastName { get; set; }
}

