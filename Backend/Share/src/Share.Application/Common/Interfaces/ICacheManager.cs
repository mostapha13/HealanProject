using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Share.Application.Common.Interfaces
{
    public interface ICacheManager
    {
        void Remove(string key);
        void AddString(string key,string value,TimeSpan timeSpan);
        string GetString(string key);
        void AddData<T>(string key, T value, TimeSpan timeSpan);
        T GetData<T>(string key);
        bool IsExistsData(string key);
    }
}
