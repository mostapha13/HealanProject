using Microsoft.Extensions.Caching.Memory;
using Share.Application.Common.Cache;
using Share.Infrastructure.Cache.Abstract;
using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace Share.Infrastructure.Cache
{
    public class MemoryCacheManager<TResult> : AbstractHybridCacheManager, IAppCacheManager<TResult>
    {
        private readonly IMemoryCache cache;

        public MemoryCacheManager(IMemoryCache cache)
        {
            this.cache = cache ?? throw new ArgumentNullException(nameof(cache));
        }

        public Task<CacheResult<TResult>> Get(ICacheKeyGenerator keyGenerator, CancellationToken cancellationToken = default)
        {
            var cacheResult = cache.Get<CacheData<TResult>>(keyGenerator.GetKey());
            if (cacheResult == null)
                return Task.FromResult(CacheResult<TResult>.Missed());
            return Task.FromResult(CacheResult<TResult>.Hit(cacheResult.D));
        }

        public Task Remove(string key, CancellationToken cancellationToken = default)
        {
            cache.Remove(key);
            return Task.CompletedTask;
        }

        public Task RemoveAll(IEnumerable<string> keys, CancellationToken cancellationToken = default)
        {
            foreach (var key in keys)
                cache.Remove(key);
            return Task.CompletedTask;
        }

        public Task RemoveByTag(string tag, CancellationToken cancellationToken = default)
        {
            var keys = cache.Get<HashSet<string>>(GetKey(tag)) ?? new HashSet<string>();
            cache.Set(GetKey(tag), new HashSet<string>());

            foreach (var key in keys)
                cache.Remove(key);

            return Task.CompletedTask;
        }

        public Task Set(ICacheKeyGenerator keyGenerator, TResult item, CancellationToken cancellationToken = default)
        {

            DateTime now = DateTime.Now;
            var cashInterval = keyGenerator.GetCashTimeInterval();
            DateTime dt = now.AddSeconds(cashInterval);

            //int absoluteWindow = option.TimeWindowMin;

            //var minute = (((dt.Minute / absoluteWindow) + 1) * absoluteWindow);

            //dt = dt.AddMinutes(minute - dt.Minute);
            //dt = dt.AddSeconds(-dt.Second);
            //dt = dt.AddMilliseconds(-dt.Millisecond);


            if (keyGenerator.GetCashTimeInterval()>0)
                cache.Set(keyGenerator.GetKey(), CacheData<TResult>.From(item), dt);
            else
                cache.Set(keyGenerator.GetKey(), CacheData<TResult>.From(item));

            if (keyGenerator.GetTags() != null)
                foreach (var tag in keyGenerator.GetTags())
                {
                    var keyList = cache.Get<HashSet<string>>(GetKey(tag)) ?? new HashSet<string>();
                    keyList.Add(keyGenerator.GetKey());
                    cache.Set(GetKey(tag), keyList);
                }

            return Task.CompletedTask;
        }

        private string GetKey(string tag)
        {
            return $"tag_{tag}";
        }
    }
}
