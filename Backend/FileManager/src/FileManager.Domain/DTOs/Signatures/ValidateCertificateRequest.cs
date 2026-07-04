using Microsoft.AspNetCore.Http;
using Share.Domain.Enums;

namespace FileManager.Domain.DTOs.Signatures;

public class ValidateCertificateRequest
{
    public IFormFile file { get; set; }
    public byte[] Certificate { get; set; }

    public string SignerCertificate { get; set; }
    public string Reason { get; set; }
    public string Location { get; set; }
    public string ImageDataUrl { get; set; }
    public int Page { get; set; }
    public float LowerLeftX { get; set; }
    public float LowerLeftY { get; set; }
    public float UpperRightX { get; set; }
    public float UpperRightY { get; set; }
    public string SignatureFieldName { get; set; }
    public HashAlgorithmType? HashAlgorithm { get; set; }
}
