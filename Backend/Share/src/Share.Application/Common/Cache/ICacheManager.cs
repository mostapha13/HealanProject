using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace Share.Application.Common.Cache
{
    public interface ICacheManager<TResult>
    {
        Task<CacheResult<TResult>> Get(ICacheKeyGenerator keyGenerator, CancellationToken cancellationToken = default);
        Task Set(ICacheKeyGenerator keyGenerator, TResult item, CancellationToken cancellationToken = default);
        Task RemoveAll(IEnumerable<string> keys, CancellationToken cancellationToken = default);
        Task Remove(string key, CancellationToken cancellationToken = default);
        void SetForceToUpdateStatus(ICacheKeyGenerator keyGenerator, bool isEnable);
        bool GetForceToUpdateStatus(ICacheKeyGenerator keyGenerator);
        Task RemoveByTag(string tag, CancellationToken cancellationToken = default);
    }
}
