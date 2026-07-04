using Share.Application.Common.Cache;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json.Serialization;
using System.Threading.Tasks;

namespace Share.Application.Common.Models
{
    public class SimpleLoginResponse : ICacheKeyGenerator
    {
        [JsonIgnore]
        public string userId { get; set; }
        public string token { get; set; }

        public string GetKey()
        {
            return $"SimpleLoginResponse-{userId}";
        }
    }
}
