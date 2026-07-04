using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Newtonsoft.Json;
using Share.Domain.Exceptions;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Text;
using System.Threading.Tasks;

namespace Share.Infrastructure.SecurityMiddlewares
{
    public static class MiddlewareExceptionHandler
    {
        public static Task HandleExceptionAsync(this Exception ex, HttpContext context)
        {
            var code = (int)HttpStatusCode.ExpectationFailed;
            if (ex is NotFoundExceptions) code = (int)HttpStatusCode.NotFound;
            else if (ex is UnauthorizedAccessException) code = (int)HttpStatusCode.NotAcceptable;
            else if (ex is BadRequestExceptions) code = (int)HttpStatusCode.BadRequest;


            context.Response.ContentType = "application/json";
            context.Response.StatusCode = (int)code;
            if (ex.InnerException != null)
                ex = ex.InnerException;


            string exceptionDescription = "HandledError";
            if (code == 500 || code == 417)
            {
                exceptionDescription = "پارامترهای ورودی معتبر نیست";
            }
            else
                exceptionDescription = ex.Message;

            Errors errors = new Errors();
            errors.Error = new string[1] { exceptionDescription };

            var details = new ProblemError()
            {
                Title = "The Request Is Not Correct.",
                Errors = errors,
                Status=code
            };

            var JsonResolt = Newtonsoft.Json.JsonConvert.SerializeObject(details);
           return context.Response.WriteAsync(JsonResolt);
        }
    }
    public  class ProblemError
    {
        [JsonProperty("type")]
        public string Type { get; set; }

        [JsonProperty("title")]
        public string Title { get; set; }

        [JsonProperty("status")]
        public long Status { get; set; }

        [JsonProperty("errors")]
        public Errors Errors { get; set; }
    }

    public  class Errors
    {
        [JsonProperty("Error")]
        public string[] Error { get; set; }
    }
}
