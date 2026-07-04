using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Primitives;
using System;
using System.Collections.Generic;
using System.Collections.Immutable;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Share.Infrastructure.SecurityMiddlewares
{
    public class SecurityHeaderMiddleware
    {
        private readonly RequestDelegate _next;
        public SecurityHeaderMiddleware(RequestDelegate next)
        {
            _next = next;
        }
        public async Task Invoke(HttpContext context)
        {
            IHeaderDictionary header = context.Response.Headers;


            //context.Response.OnStarting(() =>
            //{
            //        if (context.Response.Headers.ContainsKey("X-Powered-By"))
            //        {
            //            context.Response.Headers.Remove("X-Powered-By");
            //        }

            //    return Task.FromResult(0);
            //});

            if (!header.ContainsKey("x-xss-protection"))
                header.Append("x-xss-protection", new StringValues("1; mode=block"));

            if (!header.ContainsKey("Strict-Transport-Security"))
                header.Append("Strict-Transport-Security", new StringValues("max-age=31536000; includeSubDomains"));

            if (!header.ContainsKey("X-Frame-Options"))
                header.Append("X-Frame-Options", new StringValues("DENY"));

            if (!header.ContainsKey("X-Content-Type-Option"))
                header.Append("X-Content-Type-Option", new StringValues("nosniff"));

            if (!header.ContainsKey("Content-Security-Policy"))
                header.Append("Content-Security-Policy", new StringValues("script-src 'self'; \" + \"style-src 'self'; "));

            if (!header.ContainsKey("Cache-Control"))
                header.Append("Cache-Control", new StringValues("no-store, no-cache, must-revalidate, max-age=0"));

            if (!header.ContainsKey("Pragma"))
                header.Append("Pragma", new StringValues("no-cache"));

            if (header.ContainsKey("Server"))
                header.Remove("Server");


            //context.Response.Headers.Add("x-xss-protection", new StringValues("1; mode=block"));
            //context.Response.Headers.Add("X-Frame-Options", "DENY");
            //context.Response.Headers.Add("X-Content-Type-Option", "nosniff");

            //context.Response.Headers.Add("Content-Security-Policy", "script-src 'self'; " + "style-src 'self'; ");// + "img-src 'self'");

            //context.Response.Headers.Add("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
            //context.Response.Headers.Add("Pragma", "no-cache");



            await _next(context);

        }
    }
}
