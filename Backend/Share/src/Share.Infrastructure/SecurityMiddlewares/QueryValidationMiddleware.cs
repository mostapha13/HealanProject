using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Share.Domain.Exceptions;
using Share.Domain.Extensions;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Share.Infrastructure.SecurityMiddlewares
{
    public class QueryValidationMiddleware
    {
        private readonly RequestDelegate _next;
        ILogger<QueryValidationMiddleware> _logger;
        public QueryValidationMiddleware(RequestDelegate next, ILogger<QueryValidationMiddleware> logger)
        {
            _next = next;
            _logger = logger;
        }
        public async Task Invoke(HttpContext context)
        {
            try
            {
                
                var QueryString = context.Request.QueryString.HasValue ? System.Web.HttpUtility.UrlDecode(context.Request.QueryString.Value) : null;
                if (!string.IsNullOrEmpty(QueryString))
                {
                    if (QueryString.Length > 512)
                        throw new BadRequestExceptions("اندازه دیتای ورودی غیر مجاز است");
                    if (QueryString.Contains("--") || QueryString.Contains("!"))
                        throw new BadRequestExceptions("در ارسال درخواست از کاراکتر غیر مجاز استفاده شده است");



                    QueryString = System.Web.HttpUtility.UrlDecode(QueryString);
                    QueryString.ValidateInput();
                }
            }
            catch (Exception ex)
            {
                _logger.LogError($"QueryValidation Exception: {JsonConverter.ConvertToJson(ex.Message)}");
                await ex.HandleExceptionAsync(context);
                return;
            }
            //if (!string.IsNullOrEmpty(QueryString) && context.Request.Query.Any())
            //{
            //    var queryStringValues = context.Request.Query.Select(s => s.Value).Aggregate((a, b) => a + " " + b);
            //}
            await _next(context);




        }
    }
}
