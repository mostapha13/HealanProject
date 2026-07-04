using Microsoft.Extensions.Logging;
using Share.Application.Common.Interfaces;
using Share.Application.ContextMaps.Contents.Queries.LoginProvider.Login;
using Share.Application.ContextMaps.Contents.Queries.LoginProvider.Validate;
using System;
using System.Threading;
using System.Threading.Tasks;


namespace Share.Infrastructure.ApiProviders.LoginProvider
{
    public class RefitLoginProviderWrapper : ILoginProviderApi
    {
        private readonly ILogger<RefitLoginProviderWrapper> logger;
        private readonly IRefitLoginProvider api;

        public RefitLoginProviderWrapper(ILogger<RefitLoginProviderWrapper> logger, IRefitLoginProvider api)
        {
            this.logger = logger ?? throw new ArgumentNullException(nameof(logger));
            this.api = api ?? throw new ArgumentNullException(nameof(api));
        }

        public Task<LoginProviderResponse> Login(LoginProviderRequest request, CancellationToken cancellationToken = default)
        {
            return api.Login(request, cancellationToken);
        }

        public Task<LoginProviderValidationResponse> Validate(LoginProviderResponse request, CancellationToken cancellationToken = default)
        {
            return api.Validate(request, cancellationToken);
        }
    }
}
