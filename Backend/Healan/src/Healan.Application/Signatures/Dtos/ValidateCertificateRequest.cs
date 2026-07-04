namespace Healan.Application.Signatures.Dtos;

public class ValidateCertificateRequest
{
    public byte[] Certificate { get; set; }
}


public class ValidateCertificateResult
{
    public string? Error { get; set; }
    public int? StatusCode { get; set; }
    public ValidateCertificateDto? Result { get; set; }
}

public class ValidateCertificateDto
{
    public int? CertificateValidationStatus { get; set; }
    public DateTime? RevocationTime { get; set; }
}
