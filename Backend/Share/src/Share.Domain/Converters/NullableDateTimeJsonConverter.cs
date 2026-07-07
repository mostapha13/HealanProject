using System.Globalization;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Share.Domain.Converters;

public class NullableDateTimeJsonConverter : JsonConverter<DateTime?>
{
    public override DateTime? Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        switch (reader.TokenType)
        {
            case JsonTokenType.Null:
                return null;
            case JsonTokenType.String:
                var text = reader.GetString();
                if (string.IsNullOrWhiteSpace(text))
                    return null;
                if (DateTime.TryParse(text, CultureInfo.InvariantCulture, DateTimeStyles.RoundtripKind, out var parsed))
                    return parsed;
                throw new JsonException($"Unable to convert \"{text}\" to DateTime.");
            default:
                return reader.TryGetDateTime(out var dt) ? dt : null;
        }
    }

    public override void Write(Utf8JsonWriter writer, DateTime? value, JsonSerializerOptions options)
    {
        if (value.HasValue)
            writer.WriteStringValue(value.Value.ToString("O", CultureInfo.InvariantCulture));
        else
            writer.WriteNullValue();
    }
}
