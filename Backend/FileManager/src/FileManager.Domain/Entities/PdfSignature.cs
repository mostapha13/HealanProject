using Share.Domain.Entities;
using Share.Domain.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FileManager.Domain.Entities;
public class PdfSignature : AuditableEntity
{
    public Guid Id { get; set; }
    public Guid AttachmentId { get; set; }

    public CertificationLevelType? CertificationLevel { get; set; }
    public DateTime? RequestDate { get; set; }
    public string? Reason { get; set; }
    public string? Location { get; set; }
    public string? ImageDataUrl { get; set; }
    public int? Page { get; set; }
    public float? LowerLeftX { get; set; }
    public float? LowerLeftY { get; set; }
    public float? UpperRightX { get; set; }
    public float? UpperRightY { get; set; }
    public string? FileName { get; set; }
    public HashAlgorithmType? HashAlgorithm { get; set; }
    public Guid? SignatureAttachmentId { get; set; }
    public byte[]? Digest { get; set; }
    public byte[]? Certificate { get; set; }
    public Guid? ParentPdfSignatureId { get; set; }

    public PdfSignature ParentPdfSignature { get; set; }
    public ICollection<PdfSignature>? ChildPdfSignatures { get; set; } 
}

