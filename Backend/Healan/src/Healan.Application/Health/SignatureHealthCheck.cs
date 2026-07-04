using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using RestSharp;

namespace Healan.Application.Health;
public class SignatureHealthCheck : IHealthCheck
{
    private readonly IConfiguration _configuration;

    public SignatureHealthCheck(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public async Task<HealthCheckResult> CheckHealthAsync(HealthCheckContext context, CancellationToken cancellationToken = default)
    {
        try
        {
            var certificate = "MIIFOTCCBCGgAwIBAgILWnELS4AAAAAAABUwDQYJKoZIhvcNAQELBQAwgc4xCzAJBgNVBAYTAklSMRUwEwYDVQQKEwxHb3Zlcm5tZW50YWwxLTArBgNVBAsTJFNlY3VyaXRpZXMgYW5kIEV4Y2hhbmdlIE9yZ2FuaXphdGlvbjE/MD0GA1UECxM2SXJhbiBDYXBpdGFsIE1hcmtldCBHb3Zlcm5tZW50YWwgQ2VydGlmaWNhdGUgQXV0aG9yaXR5MTgwNgYDVQQDEy9JQ01HQ0EgR292ZXJubWVudGFsIEludGVybWVkaWF0ZSBCcm9uemUgQ0EgLSBHMzAeFw0yNDA5MTcwNDQ5MTRaFw0yNjA5MTcwNDQ5MTRaMIHhMQswCQYDVQQGEwJJUjETMBEGA1UECAwK2KrZh9ix2KfZhjETMBEGA1UEBwwK2KrZh9ix2KfZhjEZMBcGA1UECgwQTm9uLUdvdmVybm1lbnRhbDEhMB8GA1UECwwYVGVocmFuIFN0b2NrIEV4Y2hhbmdlIENvMSQwIgYDVQQDDBtUZWhyYW4gU3RvY2sgRXhjaGFuZ2UuIFJBIDMxEzARBgNVBAUTCjAwNzI3MTU0MjExETAPBgNVBCoMCNmG24zYsdmHMRwwGgYDVQQEDBPYrdio24zYqNuMINin2YLYr9mFMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA5CUudz479/9cAha+g10OmmCiUL6/D9XODoMrrhzGvN87hVQ6x4/tgIhaJykgU4ZBzWngqbIshcft1UKCrqS35KCILK01rtWirxXbsUGLpwzwIEuM5+HxiTZQge7E7Xpptsh+4itzhHtV+f1lGOeOkQvQn3447gIXWaNyjaUR7LHWyLQ6wtHixx6ly/r5ZauM+l83LisTD8vcOI3JflieDuj2ngkbtiGOBFjE1vTx8Bft69U0z0QjjmEJgPCvxYucYdNJU+WrKQd9KXrAlc3K4XEk5O9cbkcXFldr9c9os/v4Sg4Llxk5WMy5LvOkk0+2J5uxwi2nz6kjr+cUPiR/jQIDAQABo4IBATCB/jA2BgNVHR8ELzAtMCugKaAnhiVodHRwOi8vY3JsMS5pY21nY2EuaXIvaWNtZ2NhLWwxZzMuY3JsMDUGCCsGAQUFBwEBBCkwJzAlBggrBgEFBQcwAYYZaHR0cDovL29jc3BsMWczLmljbWdjYS5pcjAfBgNVHSMEGDAWgBSwjkvSk9sGS1WtOCihxLSaSo11KTAOBgNVHQ8BAf8EBAMCBsAwPQYDVR0gBDYwNDAyBgdggmxlAQEBMCcwJQYIKwYBBQUHAgEWGWh0dHBzOi8vd3d3LmljbWdjYS5pci9jcHMwHQYDVR0OBBYEFL3rTNnuyodFm3EyWLwZH5HDq5xXMA0GCSqGSIb3DQEBCwUAA4IBAQAcUmXoNwBMAZ+gD1F1v3gl527DF8bDsKbbtfunGsf+eFt+Jw564ZOgBVTampZSRIcXhwNdBYz6X7coXGQBM0jjXamUb6g0kryh3i6VA8JcsfXiPpErQwnGBYZ5RyRFxHi8FvL8OymuVdAJFRHiuRJf8clXPktUHcryWhmWmxdxGq9B9htc3b8f3bEt32vJPxrgpHu55IFAw0AMgIfbnPNiSS+/h+7M2ZlkmPhRaOzkVzC5SBfMAF8cVHTg1pzKCEN3yfV4+IjZStUdp8Od64HPaP8EXniVF+vVybdu5gfegMsGVO9Y+rtxb5cCyA4tDeEp/ce/j2dh2HX1MUIBxXT5";

            string signUrl = _configuration["Dss:Url"] + "/api/VAService/ValidateCertificateEntirelyEx";
            var client = new RestClient(signUrl);
            var restRequest = new RestRequest();
            restRequest.Method = RestSharp.Method.Post;
            restRequest.Timeout = TimeSpan.FromSeconds(3);
            restRequest.AddHeader("Content-Type", "application/json");

            var body = new { Certificate = certificate, VaProfile = "" };
            restRequest.AddJsonBody(body);

            var response = await client.ExecuteAsync(restRequest);

            return response.IsSuccessful
            ? HealthCheckResult.Healthy("Signature is healthy")
            : HealthCheckResult.Unhealthy("Signature is not healthy");
        }
        catch (Exception ex)
        {
            return HealthCheckResult.Unhealthy("Signature threw exception", ex);
        }
    }
}
