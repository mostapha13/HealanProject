using System.Collections.Generic;

namespace Share.Application.Common.Cache
{
    public interface ICacheKeyGenerator
    {
        string GetKey();
        IEnumerable<string> GetTags() => new HashSet<string>();
        int GetCashTimeInterval() => 15;
    }
}