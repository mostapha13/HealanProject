using AngleSharp;
using AngleSharp.Css;
using Microsoft.AspNetCore.Http;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

using AngleSharp.Css.Dom;
using AngleSharp.Css.Parser;
using AngleSharp.Dom;
using AngleSharp.Html.Dom;
using AngleSharp.Html.Parser;
using System.Reflection;
using System.Text.RegularExpressions;
using System.Threading;
using Serilog;
using Microsoft.Extensions.Logging;
using Share.Domain.Extensions;

namespace Share.Infrastructure.SecurityMiddlewares
{
    public class InputValidationMiddleware
    {
        private readonly RequestDelegate _next;
        ILogger<InputValidationMiddleware> _logger;
        public InputValidationMiddleware(RequestDelegate next, ILogger<InputValidationMiddleware> logger)
        {

            _next = next;
            _logger = logger;
        }
        public async Task Invoke(HttpContext context)
        {
            try
            {
                var TextBody = await GetBodyRequest(context.Request);
                if (!string.IsNullOrEmpty(TextBody))
                {
                    //TextBody = System.Web.HttpUtility.UrlDecode(TextBody);
                    TextBody.ValidateInput();
                }

            }
            catch (Exception ex)
            {
                _logger.LogError($"InputValidation Exceprion: {JsonConverter.ConvertToJson(ex.Message)}");
                await ex.HandleExceptionAsync(context);
                return;
            }

            //Copy a pointer to the original response body stream
            var originalBodyStream = context.Response.Body;
            using (var responseBody = new MemoryStream())
            {

                await _next(context);

                context.Response.Body = responseBody;

                await responseBody.CopyToAsync(originalBodyStream);
            }
        }

        private async Task<string> GetBodyRequest(HttpRequest request)
        {
            request.EnableBuffering();
            string bodyAsText = string.Empty;
            using (StreamReader reader = new StreamReader(request.Body, Encoding.UTF8, detectEncodingFromByteOrderMarks: false, leaveOpen: true))
            {
                bodyAsText = await reader.ReadToEndAsync();
                request.Body.Position = 0;
            }

            return bodyAsText;

        }


    }

}
