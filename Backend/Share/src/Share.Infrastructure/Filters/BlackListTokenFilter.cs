using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;
using Share.Application.Common.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http.Headers;
using System.Threading.Tasks;

namespace Share.Infrastructure.Filters
{
    public class BlackListTokenFilter : IAsyncActionFilter
    {
        private readonly ICacheManager _cacheManager;
        private readonly ICurrentUserService _currentUserService;
        private readonly ILogger<BlackListTokenFilter> _logger;
        public BlackListTokenFilter(ICacheManager cacheManager, ILogger<BlackListTokenFilter> logger, ICurrentUserService currentUserService)
        {
            _cacheManager = cacheManager;
            _logger = logger;
            _currentUserService = currentUserService;
        }
        public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
        {
#if DEBUG
            await next();
            return;
#endif


            var hasAllowAnonymous = context.ActionDescriptor.EndpointMetadata
     .OfType<AllowAnonymousAttribute>()
     .Any();

            if (hasAllowAnonymous)
            {
                await next();
                return;
            }




                if (_currentUserService.UserId==Guid.Empty)
            {
                //await next();
                //return;
                throw new UnauthorizedAccessException("Token Not Exists");
            }

            var key = _currentUserService.UserId.ToString() + "_" + _currentUserService.AuthTime;
            var tokenMemory= _cacheManager.GetString(key);
            if (!string.IsNullOrEmpty(tokenMemory))
            {
                throw new UnauthorizedAccessException("Token Is Expired");
            }
            await next();
        }
    }
 
}
