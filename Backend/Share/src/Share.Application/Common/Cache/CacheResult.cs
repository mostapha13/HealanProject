namespace Share.Application.Common.Cache
{
    public class CacheResult<T>
    {
        public static CacheResult<T> Missed()
        {
            return new CacheResult<T>()
            {
                IsHit = false
            };
        }

        public static CacheResult<T> Hit(T data)
        {
            return new CacheResult<T>()
            {
                IsHit = true,
                Data = data
            };
        }

        public CacheResult()
        {

        }

        public bool IsHit { get; set; }
        public T Data { get; set; }
    }
}