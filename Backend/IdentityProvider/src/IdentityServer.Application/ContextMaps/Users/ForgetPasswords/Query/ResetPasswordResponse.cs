using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json.Serialization;
using System.Threading.Tasks;

namespace IdentityServer.Application.ContextMaps.Users.ForgetPasswords.Query
{
    public class ResetPasswordResponse
    {
        [JsonIgnore]
        public string userId { get; set; }
    }
}
