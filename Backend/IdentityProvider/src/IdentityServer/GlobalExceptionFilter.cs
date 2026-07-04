using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.AspNetCore.Mvc.ModelBinding;
using Microsoft.Extensions.Logging;
using System;
using System.Net;

public class GlobalExceptionFilters : IExceptionFilter
{
    private readonly ILogger _logger;


    public GlobalExceptionFilters(ILogger<GlobalExceptionFilters> logger)
    {
        _logger = logger;
    }


    public async void OnException(ExceptionContext context)
    {
        if (!context.ExceptionHandled)
        {
            var viewName = context.RouteData.Values["action"];
            var exception = context.Exception;


            int statusCode;


            switch (true)
            {
                case bool _ when exception is UnauthorizedAccessException:
                    statusCode = (int)HttpStatusCode.Unauthorized;
                    break;


                case bool _ when exception is InvalidOperationException:
                    statusCode = (int)HttpStatusCode.BadRequest;
                    break;


                default:
                    statusCode = (int)HttpStatusCode.InternalServerError;
                    break;
            }


            _logger.LogError($"GlobalExceptionFilter: Error in {context.ActionDescriptor.DisplayName}. {exception.Message}. Stack Trace: {exception.StackTrace}");

            
            // Custom Exception message to be returned to the UI
             //context.Result = new ObjectResult(exception.Message) { StatusCode = statusCode };
            
            //var data = context.HttpContext.Features.Get<ModelStateDictionary>();
      //      context.ExceptionHandled = true;
      //      //context.ModelState.AddModelError("error", exception.Message);
      //      context.HttpContext.Response.Redirect(
      //"http://localhost:5005/Account/Login", true);
      //      context.HttpContext.Response.Headers.Add("Error",exception.Message);

         
        }
    }
}