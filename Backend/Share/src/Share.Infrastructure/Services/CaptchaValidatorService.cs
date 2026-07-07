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
            using var client = CreateClient();
            client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));

            HttpResponseMessage response = await client.GetAsync("Get");
            if (response.IsSuccessStatusCode)
            {
                var empResponse = await response.Content.ReadAsStringAsync();
                captcahResponse = Newtonsoft.Json.JsonConvert.DeserializeObject<CaptchaModelResponse>(empResponse);
            }

            return captcahResponse;
        }
    }
}
