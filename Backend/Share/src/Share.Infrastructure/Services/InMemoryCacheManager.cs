using Microsoft.Extensions.Caching.Memory;
using Share.Application.Common.Interfaces;
using System;

namespace Share.Infrastructure.Services
{
    /// <summary>
    /// Local in-memory cache for development when Redis is unavailable.
    /// </summary>
    public class InMemoryCacheManager : ICacheManager
    {
        private readonly IMemoryCache _cache;

        public InMemoryCacheManager(IMemoryCache cache)
        {
            _cache = cache;
        }

        public void AddData<T>(string key, T value, TimeSpan timeSpan)
        {
            _cache.Set(key, value, timeSpan);
        }

        public void AddString(string key, string value, TimeSpan timeSpan)
        {
            _cache.Set(key, value, timeSpan);
        }

        public T GetData<T>(string key)
        {
            return _cache.TryGetValue(key, out T value) ? value : default;
        }

        public string GetString(string key)
        {
            return _cache.TryGetValue(key, out string value) ? value : string.Empty;
        }

        public bool IsExistsData(string key)
        {
            return _cache.TryGetValue(key, out _);
        }

        public void Remove(string key)
        {
            _cache.Remove(key);
        }
    }
}
