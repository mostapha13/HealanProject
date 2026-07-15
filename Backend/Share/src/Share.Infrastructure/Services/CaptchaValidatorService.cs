using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Share.Application.Common.Interfaces;
using Share.Domain.Models;
using Share.MessageBroker.RabbitMQ.Constants;
using Share.MessageBroker.RabbitMQ.Service;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Security.Cryptography.Xml;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

namespace Share.Infrastructure.Services
{
    public class CaptchaProviderService : ICaptchaProviderService
    {
        private static readonly TimeSpan HttpTimeout = TimeSpan.FromSeconds(5);

        ILogger<CaptchaProviderService> _logger;
        private readonly IConfiguration _configuration;
        public CaptchaProviderService(ILogger<CaptchaProviderService> logger, IConfiguration configuration)
        {
            _logger = logger;
            _configuration = configuration;
        }

        private HttpClient CreateClient()
        {
            var client = new HttpClient { Timeout = HttpTimeout };
            client.BaseAddress = new Uri(_configuration["CaptchaBaseUrl"]);
            return client;
        }

        public async Task<CaptchaValidatorResponce> ValidateCaptcha(CaptchaModelRequest captchaModelRequest)
        {
                CaptchaValidatorResponce captchaModelResponce = new CaptchaValidatorResponce() { Result = false };
            try
            {
                var captcha = JsonSerializer.Serialize(captchaModelRequest);
                var requestContent = new StringContent(captcha, Encoding.UTF8, "application/json");


                using HttpClient client = CreateClient();
                HttpResponseMessage response = await client.PostAsync($"Validate", requestContent);
                response.EnsureSuccessStatusCode();

                if (response.IsSuccessStatusCode)
                {
                    // Parse the response body.
                    var result =await response.Content.ReadAsStringAsync();
                    if (JsonSerializer.Deserialize<bool>(result))
                        captchaModelResponce.Result = true;
                    return captchaModelResponce;
                }
                else
                {
                    captchaModelResponce.ErrorMessage = response.ReasonPhrase;
                    return captchaModelResponce;
                }
            }
            catch (Exception ex)
            {
                _logger.LogCritical("ValidateCaptcha Has Exception ", ex);
                captchaModelResponce.ErrorMessage = ex.Message;
                return captchaModelResponce;
            }

        }

        public async Task<CaptchaModelResponse> GetCaptcha()
        {
            CaptchaModelResponse captcahResponse = new CaptchaModelResponse();
            try
            {
                var baseUrl = _configuration["CaptchaBaseUrl"];
                if (string.IsNullOrWhiteSpace(baseUrl))
                {
                    _logger.LogError("CaptchaBaseUrl is not configured");
                    return captcahResponse;
                }

                using var client = CreateClient();
                client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));

                HttpResponseMessage response = await client.GetAsync("Get");
                var empResponse = await response.Content.ReadAsStringAsync();
                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogError(
                        "Captcha Get failed: {Status} {Body} BaseUrl={BaseUrl}",
                        (int)response.StatusCode,
                        empResponse,
                        baseUrl);
                    return captcahResponse;
                }

                var settings = new Newtonsoft.Json.JsonSerializerSettings
                {
                    ContractResolver = new Newtonsoft.Json.Serialization.CamelCasePropertyNamesContractResolver()
                };
                captcahResponse = Newtonsoft.Json.JsonConvert.DeserializeObject<CaptchaModelResponse>(empResponse, settings)
                    ?? new CaptchaModelResponse();

                // STJ may emit Image as base64 string; also try parsing envelope-style payloads.
                if (captcahResponse.Image == null || captcahResponse.Image.Length == 0)
                {
                    try
                    {
                        using var doc = JsonDocument.Parse(empResponse);
                        if (doc.RootElement.TryGetProperty("image", out var imageEl)
                            || doc.RootElement.TryGetProperty("Image", out imageEl))
                        {
                            if (imageEl.ValueKind == JsonValueKind.String)
                                captcahResponse.Image = Convert.FromBase64String(imageEl.GetString()!);
                            else if (imageEl.ValueKind == JsonValueKind.Array)
                            {
                                captcahResponse.Image = imageEl.EnumerateArray()
                                    .Select(e => (byte)e.GetInt32())
                                    .ToArray();
                            }
                        }

                        if (captcahResponse.CaptchaKey == Guid.Empty)
                        {
                            if (doc.RootElement.TryGetProperty("captchaKey", out var keyEl)
                                || doc.RootElement.TryGetProperty("CaptchaKey", out keyEl))
                            {
                                if (Guid.TryParse(keyEl.GetString(), out var key))
                                    captcahResponse.CaptchaKey = key;
                            }
                        }
                    }
                    catch (Exception parseEx)
                    {
                        _logger.LogError(parseEx, "Captcha Get payload parse fallback failed. Body={Body}", empResponse);
                    }
                }

                if (captcahResponse.Image == null || captcahResponse.Image.Length == 0)
                    _logger.LogError("Captcha Get returned empty image. BaseUrl={BaseUrl} BodySnippet={Body}",
                        baseUrl,
                        empResponse.Length > 200 ? empResponse[..200] : empResponse);

                return captcahResponse;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Captcha Get exception. BaseUrl={BaseUrl}", _configuration["CaptchaBaseUrl"]);
                return captcahResponse;
            }
        }
    }
}
