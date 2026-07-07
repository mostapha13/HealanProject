using System.Globalization;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Share.Domain.Converters;

/// <summary>
/// رشته خالی JSON را برای فیلدهای nullable به null تبدیل می‌کند.
/// </summary>
public class NullableStringJsonConverter : JsonConverter<string?>
{
    public override string? Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        if (reader.TokenType == JsonTokenType.Null)
            return null;
        if (reader.TokenType == JsonTokenType.String)
        {
            var text = reader.GetString();
            return string.IsNullOrWhiteSpace(text) ? null : text;
        }
        throw new JsonException($"Unable to convert token {reader.TokenType} to string.");
    }

    public override void Write(Utf8JsonWriter writer, string? value, JsonSerializerOptions options)
    {
        if (value is null)
            writer.WriteNullValue();
        else
            writer.WriteStringValue(value);
    }
}
