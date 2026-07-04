using Share.Application.ContextMaps.Contents.Queries.LoginProvider.Login;
using Share.Application.ContextMaps.Contents.Queries.LoginProvider.Validate;
using System.Threading;
using System.Threading.Tasks;


namespace Share.Application.Common.Interfaces
{
    public interface ILoginProviderApi
    {
        Task<LoginProviderResponse> Login(LoginProviderRequest request, CancellationToken cancellationToken = default);

        Task<LoginProviderValidationResponse> Validate(LoginProviderResponse request, CancellationToken cancellationToken = default);
    }
}
