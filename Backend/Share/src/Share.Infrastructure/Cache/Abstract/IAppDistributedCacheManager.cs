using Share.Application.Common.Cache;

namespace Share.Infrastructure.Cache.Abstract
{
    public interface IAppDistributedCacheManager<TResult> : ICacheManager<TResult>
    {
    }
}
