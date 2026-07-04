using Share.Application.Common.Cache;
using Share.Infrastructure.Cache.Abstract;
using StackExchange.Redis.Extensions.Core.Abstractions;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace Share.Infrastructure.Cache
{
    // ToDo:
    //  1- Handle connection difficaulty

    public class RedisCacheManager<TResult> : AbstractHybridCacheManager, IAppDistributedCacheManager<TResult>
    {
        private readonly IRedisDatabase cache;

        public RedisCacheManager(IRedisDatabase cache)
        {
            this.cache = cache ?? throw new ArgumentNullException(nameof(cache));
        }

        public async Task<CacheResult<TResult>> Get(ICacheKeyGenerator keyGenerator, CancellationToken cancellationToken = default)
        {
            var cacheResult = await cache.GetAsync<CacheData<TResult>>(keyGenerator.GetKey());
            if (cacheResult != null)
                return CacheResult<TResult>.Hit(cacheResult.D);

            return CacheResult<TResult>.Missed();
        }

        public async Task Remove(string key, CancellationToken cancellationToken = default)
        {
            await cache.RemoveAsync(key);
        }

        public async Task RemoveAll(IEnumerable<string> keys, CancellationToken cancellationToken = default)
        {
            await cache.RemoveAllAsync(keys.ToArray());
        }

        public async Task RemoveByTag(string tag, CancellationToken cancellationToken = default)
        {
            await cache.RemoveByTagAsync(tag.ToString());
        }

        public async Task Set(ICacheKeyGenerator keyGenerator, TResult item, CancellationToken cancellationToken = default)
        {
            await cache.AddAsync(keyGenerator.GetKey(), CacheData<TResult>.From(item),
                            tags: keyGenerator.GetTags()?.Select(tag => tag.ToString())?.ToHashSet() ?? new HashSet<string>());
        }
    }
}