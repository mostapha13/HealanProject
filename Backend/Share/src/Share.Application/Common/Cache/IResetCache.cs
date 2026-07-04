using System.Collections.Generic;

namespace Share.Application.Common.Cache
{
    public interface IResetCache
    {
        public IEnumerable<string> GetCacheKeys();
        public IEnumerable<string> GetCacheTags() => new List<string>();
    }
}