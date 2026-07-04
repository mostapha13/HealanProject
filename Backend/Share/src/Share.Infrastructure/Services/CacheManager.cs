using MessagePack;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;
using Share.Application.Common.Interfaces;
using StackExchange.Redis;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Share.Infrastructure.Services
{
    public class CacheManager : ICacheManager
    {
        private readonly IDatabase _cache;
        private readonly ILogger<CacheManager> _logger;
        public CacheManager(IDatabase database, ILogger<CacheManager> logger)
        {
            _cache = database;
            _logger = logger;
        }

        public void AddData<T>(string key, T value, TimeSpan timeSpan)
        {
                //if (_cache.KeyExists(key))
                //    Remove(key);

                //var serializedValue = JsonConvert.SerializeObject(value);
                //_cache.StringSet(key, serializedValue, timeSpan);

                int retryCount = 3;
                while (retryCount-- > 0)
                {
                    try
                    {
                        var serializedValue = JsonConvert.SerializeObject(value);
                        _cache.StringSet(key, serializedValue, timeSpan);
                        break; // Exit loop if successful
                    }
                    catch (RedisConnectionException ex)
                    {
                        _logger.LogError(ex, $"Redis connection failed. Retries left: {retryCount}");
                        if (retryCount == 0) throw; // Rethrow if no retries left
                        System.Threading.Thread.Sleep(1000); // Wait 1 second before retrying
                    }
                }
        }

        public void AddString(string key, string value, TimeSpan timeSpan)
        {
            if (_cache.KeyExists(key))
                Remove(key);
            _cache.StringSet(key, value, timeSpan);

        }

        public T GetData<T>(string key)
        {
            var value = _cache.StringGet(key);
            if (!value.IsNullOrEmpty)
            {
                // Deserialize the binary value back to the original object
                //return MessagePackSerializer.Deserialize<T>(value);
                return JsonConvert.DeserializeObject<T>(value);
            }

            return default(T);
        }

        public string GetString(string key)
        {
            if (!_cache.KeyExists(key))
                return string.Empty;
            return _cache.StringGet(key);
        }

        public bool IsExistsData(string key)
        {
          return _cache.KeyExists(key);
        }

        public void Remove(string key)
        {
            _cache.KeyDelete(key);
        }
    }
}
