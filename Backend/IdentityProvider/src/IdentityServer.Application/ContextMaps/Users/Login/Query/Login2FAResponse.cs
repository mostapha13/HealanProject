
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json.Serialization;
using System.Threading.Tasks;

namespace IdentityServer.Application.ContextMaps.Users.Login.Query
{
    public class Login2FAResponse
    {
        [JsonIgnore]
        public string userId { get; set; }
        public bool IsSuccess { get; set; }
        [JsonIgnore]
        public bool IsAdmin { get; set; }
    }
}
