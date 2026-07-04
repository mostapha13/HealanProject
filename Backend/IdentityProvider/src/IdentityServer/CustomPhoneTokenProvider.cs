using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System;

namespace IdentityServer
{
    public class CustomPhoneTokenProvider<TUser> : DataProtectorTokenProvider<TUser> where TUser : class
    {

        public CustomPhoneTokenProvider(
      IDataProtectionProvider dataProtectionProvider,
      IOptions<PhoneTokenProviderOptions> options,ILogger<DataProtectorTokenProvider<TUser>> logger):  base(dataProtectionProvider, options, logger)
        {

        }
    }
    public class PhoneTokenProviderOptions : DataProtectionTokenProviderOptions
    {
        public PhoneTokenProviderOptions()
        {
            Name = "CustomPhoneTokenProvider";
            TokenLifespan = TimeSpan.FromMinutes(2);
            
        }
    }
}
