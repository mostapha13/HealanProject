using System.Text.Json;

namespace Share.Domain.Extensions
{
    public static class JsonConverter
    {
        public static string ConvertToJson(this object objData)
        {
            if (objData == null)
                return default;

            var options = new JsonSerializerOptions
            {
                WriteIndented = true
            };
            var jsonString = JsonSerializer.Serialize(objData, options);

            return jsonString;
        }

        public static T JsonToObject<T>(this string json)
        {
            if (string.IsNullOrEmpty(json))
                return default;

            return Newtonsoft.Json.JsonConvert.DeserializeObject<T>(json);
        }

    }
}
