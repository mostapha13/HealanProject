using System;

namespace FileManager.Domain.DTOs.Signatures;
public class PutPdfDigestForMultiSignRequest
{
    public Guid Id { get; set; }
    public byte[] Certificate { get; set; }
    public byte[] Sign { get; set; }
}



public class PutPdfDigestForMultiSignResponse
{
    public Guid SignatureAttachmentId { get; set; }
}