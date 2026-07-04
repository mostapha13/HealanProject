using System;

namespace FileManager.Domain.DTOs.Signatures;
public class PdfDigestForMultiSignRequest
{
    public string PdfData { get; set; }
    public string SignerCertificate { get; set; }
    public int CertificationLevel { get; set; }
    public DateTime DateTime { get; set; }

    public string Reason { get; set; }
    public string Location { get; set; }
    public string ImageDataUrl { get; set; }
    public int Page { get; set; }
    public float LowerLeftX { get; set; }
    public float LowerLeftY { get; set; }
    public float UpperRightX { get; set; }
    public float UpperRightY { get; set; }
    public string SignatureFieldName { get; set; }
    public byte HashAlgoritm { get; set; }
}

