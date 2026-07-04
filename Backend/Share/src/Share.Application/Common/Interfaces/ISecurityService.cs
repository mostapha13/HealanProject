using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Share.Application.Common.Interfaces
{
    public interface ISecurityService
    {
        string Encrypt(string key, object data);
        T Decrypt<T>(string key, string data);
        string Encrypt(string key, string data);
        string Decrypt(string key, string data);
        public string Hash(object source);
        public string Hash(string source);
    }
}
