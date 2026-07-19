using System;
using System.Diagnostics;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;

namespace FileManager.WebUI.Middleware
{
    /// <summary>
    /// Writes request/response diagnostics to stdout so `docker logs` shows Upload failures.
    /// TseLog often hides ILogger output from the container console.
    /// </summary>
    public sealed class UploadConsoleDiagnosticsMiddleware
    {
        private readonly RequestDelegate _next;

        public UploadConsoleDiagnosticsMiddleware(RequestDelegate next)
        {
            _next = next;
        }

        public async Task Invoke(HttpContext context)
        {
            var path = context.Request.Path.Value ?? "";
            var isUpload = path.Contains("/Upload", StringComparison.OrdinalIgnoreCase)
                           || path.Contains("/File/", StringComparison.OrdinalIgnoreCase);

            if (!isUpload)
            {
                await _next(context);
                return;
            }

            var sw = Stopwatch.StartNew();
            var method = context.Request.Method;
            var contentType = context.Request.ContentType ?? "(none)";
            var contentLength = context.Request.ContentLength?.ToString() ?? "?";
            var auth = context.Request.Headers.ContainsKey("Authorization") ? "Bearer?" : "NO-AUTH";

            Console.WriteLine(
                $"[FileMgrDiag] >>> {method} {path} ct={contentType} len={contentLength} auth={auth}");

            try
            {
                await _next(context);
                sw.Stop();
                Console.WriteLine(
                    $"[FileMgrDiag] <<< {method} {path} status={context.Response.StatusCode} ms={sw.ElapsedMilliseconds}");
            }
            catch (Exception ex)
            {
                sw.Stop();
                Console.Error.WriteLine(
                    $"[FileMgrDiag] !!! {method} {path} EX={ex.GetType().FullName}: {ex.Message}");
                if (ex.InnerException != null)
                {
                    Console.Error.WriteLine(
                        $"[FileMgrDiag] !!! inner={ex.InnerException.GetType().FullName}: {ex.InnerException.Message}");
                }
                Console.Error.WriteLine(ex.ToString());
                throw;
            }
        }
    }
}
