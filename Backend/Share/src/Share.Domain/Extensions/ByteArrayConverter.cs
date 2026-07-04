using System.Linq;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Share.Domain.Extensions
{
    public static class ByteArrayConverter
    {
        public static byte[] ConvertToByteArray(this object objData)
        {
            if (objData == null)
                return default;

            return Encoding.UTF8.GetBytes(JsonSerializer.Serialize(objData, GetJsonSerializerOptions()));
        }
        public static T ByteArrayToObject<T>(this byte[] byteArray) where T : class
        {
            if (byteArray == null || !byteArray.Any())
                return default;

            try
            {
                return JsonSerializer.Deserialize<T>(byteArray, GetJsonSerializerOptions());
            }
            catch
            {
                return null;
            }
        }

        private static JsonSerializerOptions GetJsonSerializerOptions()
        {
            return new JsonSerializerOptions()
            {
                PropertyNamingPolicy = null,
                WriteIndented = true,
                AllowTrailingCommas = true,
                DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
            };
        }
    }
}
