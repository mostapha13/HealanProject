namespace Healan.Application.Signatures.Dtos;
public class PutPdfDigestForMultiSignRequest
{
    public Guid Id { get; set; }
    public byte[] Certificate { get; set; }
    public byte[] Sign { get; set; }
}



public record PutPdfDigestForMultiSignResult
{
    public Guid AttachmentId { get; set; }
}