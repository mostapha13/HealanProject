using Microsoft.AspNetCore.Identity;
using System.Threading.Tasks;

namespace IdentityServer.CustomTokenProvider
{
    public class CustomEmailTokenProvider<TUser> : EmailTokenProvider<TUser> where TUser : class
    {
        public CustomEmailTokenProvider()
        {

        }
        public override Task<string> GenerateAsync(string purpose, UserManager<TUser> manager, TUser user)
        {
            purpose = "TwoFactor";
            return base.GenerateAsync(purpose, manager, user);
        }
        public override Task<bool> ValidateAsync(string purpose, string token, UserManager<TUser> manager, TUser user)
        {
            purpose = "TwoFactor";
            return base.ValidateAsync(purpose, token, manager, user);
        }
    }
}
