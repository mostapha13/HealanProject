using MediatR;
using Share.Application.Common.Cache;
using System.Threading;
using System.Threading.Tasks;

namespace Share.Application.Common.Behaviours
{
    //ToDo: Improve this. Try not to block response or atleast remove all tags at once by WhenAll
    public class ResetCachingBehaviour<TRequest, TResponse> : IPipelineBehavior<TRequest, TResponse>
        where TRequest : IRequest<TResponse>, IResetCache
    {
        private readonly ICacheManager<TResponse> cacheManager;

        public ResetCachingBehaviour(ICacheManager<TResponse> cacheManager)
        {
            this.cacheManager = cacheManager ?? throw new System.ArgumentNullException(nameof(cacheManager));
        }

          public async Task<TResponse> Handle(TRequest request, RequestHandlerDelegate<TResponse> next, CancellationToken cancellationToken)
        {
            TResponse response = await next();

            await cacheManager.RemoveAll(((IResetCache)request).GetCacheKeys(), cancellationToken);
            foreach (var tag in ((IResetCache)request).GetCacheTags())
            {
                await cacheManager.RemoveByTag(tag, cancellationToken);
            }

            return response;
        }
    }
}