using Microsoft.AspNetCore.Identity;
using System.Threading.Tasks;

namespace IdentityServer.CustomTokenProvider
{
    public class CustomPhoneNumberTokenProvider<TUser> : PhoneNumberTokenProvider<TUser> where TUser : class
    {
        public CustomPhoneNumberTokenProvider()
        {
            
        }
        public override Task<string> GenerateAsync(string purpose, UserManager<TUser> manager, TUser user)
        {
            return base.GenerateAsync(purpose, manager, user);
        }
        public override Task<bool> ValidateAsync(string purpose, string token, UserManager<TUser> manager, TUser user)
        {
            return base.ValidateAsync(purpose, token, manager, user);
        }
    }
}
