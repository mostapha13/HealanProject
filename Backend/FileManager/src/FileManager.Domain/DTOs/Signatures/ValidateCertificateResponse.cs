using System;

namespace FileManager.Domain.DTOs.Signatures;

public class ValidateCertificateResponse
{
    public string Error { get; set; }
    public int StatusCode { get; set; }
    public ValidateCertificateResult Result { get; set; }
}


public class ValidateCertificateResult
{
    public int CertificateValidationStatus { get; set; }
    public DateTime RevocationTime { get; set; }
}
