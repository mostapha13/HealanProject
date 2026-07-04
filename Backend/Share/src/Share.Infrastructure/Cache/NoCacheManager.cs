using Share.Application.Common.Cache;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace Share.Infrastructure.Cache
{
    public class NoCacheManager<TResult> : AbstractHybridCacheManager, ICacheManager<TResult>
    {

        public NoCacheManager()
        {
        }

        public Task<CacheResult<TResult>> Get(ICacheKeyGenerator keyGenerator, CancellationToken cancellationToken = default)
        {
            return Task.FromResult(CacheResult<TResult>.Missed());
        }

        public Task Remove(string key, CancellationToken cancellationToken = default)
        {
            return Task.CompletedTask;
        }

        public Task RemoveAll(IEnumerable<string> keys, CancellationToken cancellationToken = default)
        {
            return Task.CompletedTask;
        }

        public Task RemoveByTag(string tag, CancellationToken cancellationToken = default)
        {
            return Task.CompletedTask;
        }

        public Task Set(ICacheKeyGenerator keyGenerator, TResult item, CancellationToken cancellationToken = default)
        {
            return Task.CompletedTask;
        }
    }
}