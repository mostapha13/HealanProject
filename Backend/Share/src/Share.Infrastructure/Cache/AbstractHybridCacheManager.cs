using Share.Application.Common.Cache;
using Share.Infrastructure.Cache.Abstract;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace Share.Infrastructure.Cache
{

    public abstract class AbstractHybridCacheManager
    {
        private readonly Dictionary<string, bool> dic = new Dictionary<string, bool>();

        public void SetForceToUpdateStatus(ICacheKeyGenerator keyGenerator, bool isEnable)
        {
            var key = keyGenerator.GetKey();
            if (string.IsNullOrEmpty(key))
                return;
            SetForceToUpdateStatue(keyGenerator.GetKey(), isEnable);
        }
        public bool GetForceToUpdateStatus(ICacheKeyGenerator keyGenerator)
        {
            var key = keyGenerator.GetKey();
            if (string.IsNullOrEmpty(key))
                return false;
            if (!dic.ContainsKey(key))
                return false;
            return dic[key];
        }
        private void SetForceToUpdateStatue(string key, bool isEnable)
        {
            if (dic.ContainsKey(key))
                dic[key] = isEnable;
            else
            {
                dic.Add(key, isEnable);
            }
        }
    }
}