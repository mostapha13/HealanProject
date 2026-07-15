using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Share.Application.Common.Interfaces;
using Share.Application.ContextMaps.Contents.Queries.LoginProvider.Login;
using Share.Domain.Exceptions;
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
    public class SmsApiService : ISmsApiService
    {
        ILogger<SmsApiService> _logger;
        private readonly IConfiguration _configuration;
        private readonly ILoginProviderApi _loginProviderApi;
        private readonly IMemoryCache _memoryCache;
        public SmsApiService(ILogger<SmsApiService> logger, IConfiguration configuration, ILoginProviderApi loginProviderApi, IMemoryCache memoryCache)
        {
            _logger = logger;
            _configuration = configuration;
            _loginProviderApi = loginProviderApi;
            _memoryCache = memoryCache;
        }
        public async Task<SMSModelResponce> SendSMS(SMSModelRequest sMSModelRequest)
        {

            SMSModelResponce sMSModelResponce = new SMSModelResponce() { };
            try
            {
                var sms = JsonSerializer.Serialize(sMSModelRequest);
                var requestContent = new StringContent(sms, Encoding.UTF8, "application/json");

                var baseUrl = _configuration["SMSBaseUrl"];
                if (string.IsNullOrWhiteSpace(baseUrl))
                {
                    sMSModelResponce.ErrorMessage = "SMSBaseUrl تنظیم نشده است.";
                    return sMSModelResponce;
                }

                HttpClient client = new HttpClient();
                client.BaseAddress = new Uri(baseUrl);

                // SMSProvider محلی نیازی به LoginProvider / token ندارد.
                var skipAuth = string.Equals(_configuration["SMSSkipAuthToken"], "true", StringComparison.OrdinalIgnoreCase)
                    || baseUrl.Contains("SMSProvider", StringComparison.OrdinalIgnoreCase)
                    || baseUrl.Contains("smsprovider", StringComparison.OrdinalIgnoreCase);

                if (!skipAuth)
                {
                    var loginResult = await _loginProviderApi.Login(new LoginProviderRequest()
                    {
                        userName = _configuration["LoginProviderUserName"],
                        password = _configuration["LoginProviderPassword"],
                    });
                    client.DefaultRequestHeaders.Add("token", loginResult.token);
                }

                HttpResponseMessage response = await client.PostAsync($"SendSMS", requestContent);
                var result = await response.Content.ReadAsStringAsync();

                if (response.IsSuccessStatusCode)
                {
                    try
                    {
                        sMSModelResponce = JsonSerializer.Deserialize<SMSModelResponce>(result, new JsonSerializerOptions
                        {
                            PropertyNameCaseInsensitive = true,
                        }) ?? new SMSModelResponce();
                    }
                    catch
                    {
                        sMSModelResponce = new SMSModelResponce { TraceNumber = result };
                    }
                    client.Dispose();

                    if (!string.IsNullOrWhiteSpace(sMSModelResponce.ErrorMessage))
                        return sMSModelResponce;

                    foreach (var item in sMSModelRequest.PhoneNumbers)
                    {
                        string key = $"Phone_{item}";
                        _memoryCache.Set(key, DateTime.Now);
                    }

                    return sMSModelResponce;
                }
                else
                {
                    client.Dispose();
                    sMSModelResponce.ErrorMessage = string.IsNullOrWhiteSpace(result)
                        ? response.ReasonPhrase
                        : result;
                    return sMSModelResponce;
                }
            }
            catch (Exception ex)
            {
                _logger.LogCritical("SendSMS Has Exception ", ex);
                sMSModelResponce.ErrorMessage = ex.Message;
                return sMSModelResponce;
            }
        }

        public void ValidToSendSms(string phoneNumber)
        {
            string key = $"Phone_{phoneNumber}";
            DateTime? dout;
            if (_memoryCache.TryGetValue(key, out dout))
            {
                if (DateTime.Now.Subtract(dout.Value).TotalSeconds < 120)
                    throw new BadRequestExceptions($"پیامک قبلا ارسال شده.لطفا {120-(int)DateTime.Now.Subtract(dout.Value).TotalSeconds} ثانیه دیگر منتظر بمانید");
            }
        }
    }
}
