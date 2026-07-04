namespace Share.Infrastructure.Cache
{
    public class CacheData<T>
    {
        public static CacheData<T> From(T data)
        {
            return new CacheData<T>()
            {
                D = data
            };
        }

        public T D { get; set; }
    }
}
