namespace FileManager.Domain.DTOs.Signatures;

public class PdfDigestForMultiSignResponse
{
    public string Error { get; set; }
    public byte[] Result { get; set; }
    public int StatusCode { get; set; }
}
