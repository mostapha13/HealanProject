using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Http;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Net.Mime;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

namespace Share.Application.Common.Authorization
{
   public class AuthHeaderHandler : DelegatingHandler
    {
        private readonly IHttpContextAccessor _httpContextAccessor;
        public AuthHeaderHandler(IHttpContextAccessor httpContextAccessor)
        {
            _httpContextAccessor = httpContextAccessor;
        }

        protected override async Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            var accessToken = await _httpContextAccessor.HttpContext.GetTokenAsync("access_token");
            var token = accessToken;

            //potentially refresh token here if it has expired etc.

            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);

            var result = await base.SendAsync(request, cancellationToken).ConfigureAwait(false);
            if (result.StatusCode == System.Net.HttpStatusCode.NoContent)
                return new HttpResponseMessage(System.Net.HttpStatusCode.NoContent) { Content = new StringContent("null", Encoding.UTF8, MediaTypeNames.Application.Json), StatusCode = System.Net.HttpStatusCode.NoContent };
            return result;
        }
    }
}
