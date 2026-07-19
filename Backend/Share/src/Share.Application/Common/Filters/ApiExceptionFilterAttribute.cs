using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Share.Application.Common.Behaviours;
using Share.Domain.Exceptions;
using System.Collections.Generic;
using System.Linq;
namespace Share.Application.Common.Filters
{
    public class ApiExceptionFilterAttribute : ExceptionFilterAttribute
    {

        private readonly IDictionary<Type, Action<ExceptionContext>> _exceptionHandlers;
        private readonly ILogger<ApiExceptionFilterAttribute> _logger;
        public ApiExceptionFilterAttribute(ILogger<ApiExceptionFilterAttribute> logger)
        {
            _logger = logger;
            // Register known exception types and handlers.
            _exceptionHandlers = new Dictionary<Type, Action<ExceptionContext>>
            {
                { typeof(ValidationExceptions), HandleValidationException },
                { typeof(NotFoundExceptions), HandleNotFoundException },
                { typeof(UnauthorizedAccessException), HandleUnauthorizedAccessException },
                { typeof(ForbiddenAccessExceptions), HandleForbiddenAccessException },
                { typeof(BadRequestExceptions), HandleBadRequestException },
            };

        }

        public override void OnException(ExceptionContext context)
        {
            HandleException(context);
            _logger.LogError(context.Exception, "Error:");
            base.OnException(context);
        }

        private void HandleException(ExceptionContext context)
        {
            Type type = context.Exception.GetType();
            if (type.Name == "SecurityTokenExpiredException")
            {
                HandleSecurityTokenExpiredException(context);
                return;
            }
            if (_exceptionHandlers.ContainsKey(type))
            {
                _exceptionHandlers[type].Invoke(context);
                return;
            }

            // Do not mask real exceptions as "invalid input" just because ModelState
            // has NRT/[Required] noise (e.g. optional FilterText/SearchText left unset).
            HandleUnknownException(context);
        }

        private void HandleValidationException(ExceptionContext context)
        {
            //var exception = context.Exception as ValidationExceptions;

            //var details = new ValidationProblemDetails(exception.Errors)
            //{
            //    //   Type = "https://tools.ietf.org/html/rfc7231#section-6.5.1"
            //};

            //context.Result = new BadRequestObjectResult(details);
            // context.ExceptionHandled = true;




            var exception = context.Exception as ValidationExceptions;
            var details = new CustomProblemDetails()
            {
                Title = "The Request Is Not Correct.",
                Errors = exception.Errors.SelectMany(s => s.Value).ToArray()
            };

            context.Result = new BadRequestObjectResult(details);
            context.ExceptionHandled = true;
        }

        private void HandleInvalidModelStateException(ExceptionContext context)
        {
            //var details = new ValidationProblemDetails(context.ModelState)
            //{
            //    //  Type = "https://tools.ietf.org/html/rfc7231#section-6.5.1"
            //};
            //if (details.Errors != null)
            //{
            //    details.Errors.Clear();
            //    details.Errors.Add("Error", new string[] { "دیتای ورودی نامعتبر است" });
            //}
            //context.Result = new BadRequestObjectResult(details);

            //context.ExceptionHandled = true;



            var details = new CustomProblemDetails()
            {
                Title = "The Request Is Not Correct.",
                Errors = new string[] { "دیتای ورودی نامعتبر است" }
            };

            context.Result = new BadRequestObjectResult(details);
            context.ExceptionHandled = true;



        }

        private void HandleNotFoundException(ExceptionContext context)
        {
            var exception = context.Exception as NotFoundExceptions;

            var details = new ProblemDetails()
            {
                //  Type = "https://tools.ietf.org/html/rfc7231#section-6.5.4",
                Title = "The specified resource was not found.",
                Detail = exception.Message
            };

            context.Result = new NotFoundObjectResult(details);

            context.ExceptionHandled = true;
        }
        private void HandleSecurityTokenExpiredException(ExceptionContext context)
        {

            //SecurityTokenExpiredException

            var details = new ProblemDetails()
            {
                Status = 420,
                Title = "TokenExpired"
            };

            context.Result = new ObjectResult(details)
            {
                StatusCode = 420,
            };

            context.ExceptionHandled = true;
        }
        private void HandleUnauthorizedAccessException(ExceptionContext context)
        {
            var details = new ProblemDetails
            {
                Status = StatusCodes.Status401Unauthorized,
                Title = "Unauthorized",
                //   Type = "https://tools.ietf.org/html/rfc7235#section-3.1"
            };

            context.Result = new ObjectResult(details)
            {
                StatusCode = StatusCodes.Status401Unauthorized
            };

            context.ExceptionHandled = true;
        }

        private void HandleForbiddenAccessException(ExceptionContext context)
        {
            var details = new ProblemDetails
            {
                Status = StatusCodes.Status403Forbidden,
                Title = "Forbidden",
                // Type = "https://tools.ietf.org/html/rfc7231#section-6.5.3"
            };

            context.Result = new ObjectResult(details)
            {
                StatusCode = StatusCodes.Status403Forbidden
            };

            context.ExceptionHandled = true;
        }

        private void HandleUnknownException(ExceptionContext context)
        {
            var ex = context.Exception;
            var env = context.HttpContext.RequestServices.GetService(typeof(IHostEnvironment)) as IHostEnvironment;
            var isDevelopment = env?.IsDevelopment() == true;

            var errors = isDevelopment
                ? BuildDevelopmentErrors(ex)
                : new[]
                {
                    "خطای داخلی سرور.",
                    $"diag:{ex.GetType().Name}:{Truncate(ex.Message, 180)}",
                };

            _logger.LogError(ex,
                "Unhandled API exception. Type={ExceptionType}, Message={Message}",
                ex.GetType().FullName, ex.Message);

            Console.Error.WriteLine(
                $"[ApiException] {context.HttpContext.Request.Method} {context.HttpContext.Request.Path} => {ex.GetType().FullName}: {ex.Message}");
            if (ex.InnerException != null)
            {
                Console.Error.WriteLine(
                    $"[ApiException] inner => {ex.InnerException.GetType().FullName}: {ex.InnerException.Message}");
            }
            Console.Error.WriteLine(ex.ToString());

            var details = new CustomProblemDetails()
            {
                Title = "The Request Is Not Correct.",
                Errors = errors
            };

            context.Result = new ObjectResult(details)
            {
                StatusCode = StatusCodes.Status500InternalServerError
            };

            context.ExceptionHandled = true;
        }

        private static string[] BuildDevelopmentErrors(Exception ex)
        {
            var messages = new List<string>();
            var current = ex;
            while (current != null)
            {
                if (!string.IsNullOrWhiteSpace(current.Message))
                    messages.Add(current.Message);
                current = current.InnerException;
            }

            return messages.Count > 0
                ? messages.Distinct().ToArray()
                : new[] { "خطای نامشخص سرور" };
        }

        private static string Truncate(string? value, int max)
        {
            if (string.IsNullOrEmpty(value)) return string.Empty;
            return value.Length <= max ? value : value.Substring(0, max);
        }

        private void HandleBadRequestException(ExceptionContext context)
        {
            var exception = context.Exception as BadRequestExceptions;

            //var details = new ProblemDetails()
            //{
            //    //   Type = "https://tools.ietf.org/html/rfc7231#section-6.5.4",
            //    Title = "The Request Is Not Correct.",
            //    Detail = exception.Message
            //};

            var details = new CustomProblemDetails()
            {
                Title = "The Request Is Not Correct.",
                Errors = new string[] { exception.Message }
            };

            context.Result = new BadRequestObjectResult(details);
            context.ExceptionHandled = true;
        }
    }

    public class CustomProblemDetails
    {
        public string Title { get; set; }
        public string[] Errors { get; set; }
    }
}
