using Refit;
using Share.Application.ContextMaps.Contents.Queries.LoginProvider.Login;
using Share.Application.ContextMaps.Contents.Queries.LoginProvider.Validate;
using System.Threading;
using System.Threading.Tasks;


namespace Share.Infrastructure.ApiProviders.LoginProvider
{
    public interface IRefitLoginProvider
    {
        [Post("/User/Login")]
        Task<LoginProviderResponse> Login([Body] LoginProviderRequest request, CancellationToken cancellationToken = default);

        [Post("/User/Validate")]
        Task<LoginProviderValidationResponse> Validate([Body] LoginProviderResponse request, CancellationToken cancellationToken = default);
    }

}