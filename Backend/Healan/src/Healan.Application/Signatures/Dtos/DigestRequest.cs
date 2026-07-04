using Share.Domain.Enums;
namespace Healan.Application.Signatures.Dtos;


public class DigestRequest
{
    public int DossierId { get; set; }
    public int SubmenuId { get; set; }
    public Guid AttachmentId { get; set; }
    public byte[] Certificate { get; set; }
    public string? Reason { get; set; }
    public string? Location { get; set; }
    public string? ImageDataUrl { get; set; }
    public int? Page { get; set; }
    public float? LowerLeftX { get; set; }
    public float? LowerLeftY { get; set; }
    public float? UpperRightX { get; set; }
    public float? UpperRightY { get; set; }
    public HashAlgorithmType? HashAlgorithm { get; set; } = HashAlgorithmType.SHA256;
}

public class DigestResult
{
    public Guid Id { get; set; }
    public string Error { get; set; }
    public byte[] Result { get; set; }
    //public Guid AttachmentSingId { get; set; }
    public int StatusCode { get; set; }

}
