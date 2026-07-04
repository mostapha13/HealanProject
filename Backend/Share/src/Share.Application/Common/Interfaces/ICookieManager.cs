using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Share.Application.Common.Interfaces
{
    public interface ICookieManager
    {
        bool AppendCookie(string key, string value);
        bool DeleteCookie(string key);
        bool DeleteAllCookie<T>();
        string GetCookiesValue(string key);
    }
}
