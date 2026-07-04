using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Share.Application.ContextMaps.Contents.Queries.LoginProvider.Validate
{
    public class LoginProviderValidationResponse
    {
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public string IPAddress { get; set; }
        public bool  IsValid { get; set; }
        public string ErrorMessage { get; set; }
    }
}
