using Microsoft.AspNetCore.Http;
using Share.Application.Common.Constant;
using Share.Application.Common.Interfaces;

namespace Share.Infrastructure.Services
{
    public class CookieManager : ICookieManager
    {
        private readonly IHttpContextAccessor _httpContextAccessor;
        public CookieManager(IHttpContextAccessor httpContextAccessor)
        {
            _httpContextAccessor = httpContextAccessor;
        }
        public bool AppendCookie(string key, string value)
        {
            //#if DEBUG
            //            _httpContextAccessor.HttpContext.Response.Cookies.Append(key, value, new CookieOptions() { HttpOnly = true, SameSite = SameSiteMode.Strict });
            //            return true;
            //#endif
            _httpContextAccessor.HttpContext.Response.Cookies.Append(key, value, new CookieOptions() { HttpOnly = true, SameSite = SameSiteMode.None, Secure = true });
            return true;
        }

        public bool DeleteAllCookie<T>()
        {
            var allCookie = CookieConstant.GetConstants(typeof(T));
            foreach (var item in allCookie)
            {
                DeleteCookie(item);
            }
            return true;
        }

        public bool DeleteCookie(string key)
        {
            if (_httpContextAccessor.HttpContext.Request.Cookies[key] != null)
            {
                _httpContextAccessor.HttpContext.Response.Cookies.Delete(key);
            }
            return true;
        }

        public string GetCookiesValue(string key)
        {
            if (_httpContextAccessor.HttpContext.Request.Cookies[key] != null)
                return _httpContextAccessor.HttpContext.Request.Cookies[key];
            return string.Empty;
        }
    }
}
