using MediatR;
using Share.Application.Common.Cache;
using System.Threading;
using System.Threading.Tasks;

namespace Share.Application.Common.Behaviours
{
    public class CachingBehaviour<TRequest, TResponse> : IPipelineBehavior<TRequest, TResponse>
        where TRequest : IRequest<TResponse>, ICacheKeyGenerator
    {
        private readonly ICacheManager<TResponse> cacheManager;

        public CachingBehaviour(ICacheManager<TResponse> cacheManager)
        {
            this.cacheManager = cacheManager ?? throw new System.ArgumentNullException(nameof(cacheManager));
        }

        public async Task<TResponse> Handle(TRequest request, RequestHandlerDelegate<TResponse> next, CancellationToken cancellationToken)
        {
            TResponse response=default(TResponse);

            var cacheResult = await cacheManager.Get(request);
            var forceToUpdateStatus = cacheManager.GetForceToUpdateStatus(request);


            if (cacheResult.IsHit)
                response = cacheResult.Data;
            else if(!forceToUpdateStatus)
            {
                forceToUpdateStatus = false;
                response = await next();
                await cacheManager.Set(request, response);
            }

            if (forceToUpdateStatus)
            {
                cacheManager.SetForceToUpdateStatus(request, false);
                UpdateCashAsync(request, next);
            }

            return response;
        }
        public async Task UpdateCashAsync(TRequest request, RequestHandlerDelegate<TResponse> next)
        {
            var response = await next();
            await cacheManager.Set(request, response);
        }
    }
}