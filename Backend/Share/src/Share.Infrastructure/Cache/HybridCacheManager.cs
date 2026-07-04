using Share.Application.Common.Cache;
using Share.Infrastructure.Cache.Abstract;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace Share.Infrastructure.Cache
{
    //ToDo:
    //  1- Handle different policy for local cache and distributed cache
    //  2- Handle set to local cache when get from distributed cache
    //  3- Handle connection difficaulty

    public class HybridCacheManager<TResult> :AbstractHybridCacheManager, ICacheManager<TResult>
    {
        private readonly IEnumerable<ICacheManager<TResult>> cacheManagers;
        public HybridCacheManager(IEnumerable<IAppCacheManager<TResult>> lvl1CacheManagers, IEnumerable<IAppDistributedCacheManager<TResult>> lvl2CacheManagers)
        {
            this.cacheManagers = lvl1CacheManagers.Select(item => (ICacheManager<TResult>)item).Concat(lvl2CacheManagers.Select(item => (ICacheManager<TResult>)item));
        }

        public async Task Remove(ICacheKeyGenerator keyGenerator, CancellationToken cancellationToken)
        {
            List<Task> taskList = new List<Task>();
            foreach (var cacheManager in cacheManagers)
                taskList.Add(cacheManager.Remove(keyGenerator.GetKey(), cancellationToken));

            await Task.WhenAll(taskList);
        }

        public async Task<CacheResult<TResult>> Get(ICacheKeyGenerator keyGenerator, CancellationToken cancellationToken)
        {
            foreach (var cacheManager in cacheManagers)
            {
                var result = await cacheManager.Get(keyGenerator, cancellationToken);
                if (result.IsHit)
                    return result;
            }

            return CacheResult<TResult>.Missed();
        }

        public async Task Set(ICacheKeyGenerator keyGenerator, TResult item, CancellationToken cancellationToken = default)
        {
            List<Task> taskList = new List<Task>();
            foreach (var cacheManager in cacheManagers)
                taskList.Add(cacheManager.Set(keyGenerator, item, cancellationToken));

            await Task.WhenAll(taskList);
        }

        public async Task RemoveAll(IEnumerable<string> keys, CancellationToken cancellationToken = default)
        {
            List<Task> taskList = new List<Task>();
            foreach (var cacheManager in cacheManagers)
                taskList.Add(cacheManager.RemoveAll(keys, cancellationToken));

            await Task.WhenAll(taskList);
        }

        public async Task Remove(string key, CancellationToken cancellationToken = default)
        {
            List<Task> taskList = new List<Task>();
            foreach (var cacheManager in cacheManagers)
                taskList.Add(cacheManager.Remove(key, cancellationToken));

            await Task.WhenAll(taskList);
        }

        public async Task RemoveByTag(string tag, CancellationToken cancellationToken = default)
        {
            List<Task> taskList = new List<Task>();
            foreach (var cacheManager in cacheManagers)
                taskList.Add(cacheManager.RemoveByTag(tag, cancellationToken));

            await Task.WhenAll(taskList);
        }

 
    }
}