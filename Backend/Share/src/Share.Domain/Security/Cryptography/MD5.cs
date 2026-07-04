using Share.Domain.Extensions;
using System.Text;

namespace Share.Domain.Security.Cryptography
{
    public static class MD5
    {
        public static string Hash(string source)
        {
            using (var md5Hash = System.Security.Cryptography.MD5.Create())
            {
                // Byte array representation of source string
                var sourceBytes = Encoding.UTF8.GetBytes(source);

                // Generate hash value(Byte Array) for input data
                var hashBytes = md5Hash.ComputeHash(sourceBytes);

                // Convert hash byte array to string
                var hash = BitConverter.ToString(hashBytes).Replace("-", string.Empty);

                return hash;
            }

        }
        public static string Hash(object source)
        {
            var result = JsonConverter.ConvertToJson(source);
            return Hash(result);

        }
    }
}
