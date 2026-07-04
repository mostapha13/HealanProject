using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Refit;
using Share.Application.Common.Authorization;
using Share.Application.Common.Cache;
using Share.Application.Common.Interfaces;
using System;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Net.Mime;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using WorkFlow.Share.Services;

namespace WorkFlow.Share
{
    public static class DependencyInjection
    {
        public static void AddWorkFlowService(this IServiceCollection services, IConfiguration configuration)
        {
            
            #region API
            services.AddTransient<AuthHeaderHandler>();

            services.AddRefitClient<IWorkFlowHttpProvider>()
            .ConfigureHttpClient(c => c.BaseAddress = new Uri(configuration["WorkFlowBaseUrl"]))
            .AddHttpMessageHandler<AuthHeaderHandler>();

            #endregion



            //services.AddAuthorization(options =>
            //{
            //    options.AddPolicy("CanPurge", policy => policy.RequireRole("Administrator"));
            //});

        }


    }
    //class AuthHeaderHandler : DelegatingHandler
    //{
    //    private readonly IHttpContextAccessor _httpContextAccessor;
    //    public AuthHeaderHandler(IHttpContextAccessor httpContextAccessor)
    //    {
    //        _httpContextAccessor = httpContextAccessor;
    //    }

    //    protected override async Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
    //    {
    //        var accessToken = await _httpContextAccessor.HttpContext.GetTokenAsync("access_token");
    //        var token = accessToken;

    //        //potentially refresh token here if it has expired etc.

    //        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);

    //        var result= await base.SendAsync(request, cancellationToken).ConfigureAwait(false);
    //        if(result.StatusCode==System.Net.HttpStatusCode.NoContent)
    //        return new HttpResponseMessage(System.Net.HttpStatusCode.NoContent) { Content = new StringContent("null", Encoding.UTF8, MediaTypeNames.Application.Json),StatusCode=System.Net.HttpStatusCode.NoContent };
    //        return result;
    //    }
    //}
}