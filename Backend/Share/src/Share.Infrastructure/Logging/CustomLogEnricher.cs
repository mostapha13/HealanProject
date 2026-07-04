using System;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.DependencyInjection;
using Serilog.Core;
using Serilog.Events;

namespace Share.Infrastructure.Logging
{
    public class TseCustomLogEnricher : ILogEventEnricher, ITseCustomLogEnricher
    {
        public static IServiceProvider ServiceProvider { get; set; }
        public void Enrich(LogEvent logEvent, ILogEventPropertyFactory propertyFactory)
        {

            if ((!(ServiceProvider?.GetService<IHttpContextAccessor>()?.HttpContext is HttpContext httpContext)))
                return;
            var headers = httpContext.Request.Headers;
            RequestId = headers["RequestId"];
            logEvent.AddOrUpdateProperty(new LogEventProperty("CorrelationId", new ScalarValue(RequestId)));
        }

        public string RequestId { get; set; }
    }
}
