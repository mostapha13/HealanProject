using System.Runtime.CompilerServices;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.Data.SqlClient;

namespace TSEAI.Knowledge.Worker;

public sealed class SqlKnowledgeSourceReader
{
    private readonly KnowledgeOptions _options;
    public SqlKnowledgeSourceReader(KnowledgeOptions options) => _options = options;

    public async IAsyncEnumerable<KnowledgeBatch> ReadBatchesAsync(
        KnowledgeSourceOptions source,
        IngestionCheckpoint? checkpoint,
        [EnumeratorCancellation] CancellationToken ct)
    {
        ValidateSelect(source);
        var batchSize = Math.Clamp(_options.BatchSize, 1, 500);
        var maxDocuments = Math.Max(batchSize, _options.MaxDocumentsPerSourceRun);
        var batch = new List<KnowledgeDocument>(batchSize);
        IngestionCheckpoint? batchCheckpoint = null;
        var total = 0;
        var since = checkpoint?.Watermark.AddMinutes(-Math.Max(0, _options.WatermarkOverlapMinutes));

        await using var connection = CreateConnection();
        await connection.OpenAsync(ct);
        await using var command = new SqlCommand(source.Query, connection) { CommandTimeout = 60 };
        if (source.SupportsSince && source.Query.Contains("@Since", StringComparison.OrdinalIgnoreCase))
        {
            var parameter=command.Parameters.Add("@Since", System.Data.SqlDbType.DateTime2);
            parameter.Value=since is null ? DBNull.Value : since.Value.UtcDateTime;
        }
        if (source.Query.Contains("@Take", StringComparison.OrdinalIgnoreCase))
            command.Parameters.Add("@Take", System.Data.SqlDbType.Int).Value=maxDocuments;
        if (source.Query.Contains("@AfterWatermark", StringComparison.OrdinalIgnoreCase))
        {
            var parameter=command.Parameters.Add("@AfterWatermark", System.Data.SqlDbType.DateTime2);
            parameter.Value=checkpoint is null ? DBNull.Value : checkpoint.Watermark.UtcDateTime;
        }
        if (source.Query.Contains("@AfterSourceId", StringComparison.OrdinalIgnoreCase))
            command.Parameters.Add("@AfterSourceId", System.Data.SqlDbType.NVarChar,200).Value=checkpoint is null ? DBNull.Value : checkpoint.LastSourceId;

        await using var reader = await command.ExecuteReaderAsync(ct);
        var ordinals = Enumerable.Range(0, reader.FieldCount).ToDictionary(i => reader.GetName(i), StringComparer.OrdinalIgnoreCase);
        foreach (var required in new[] { "SourceId", "Title", "Body" })
            if (!ordinals.ContainsKey(required)) throw new InvalidOperationException($"Source '{source.Name}' query must return {required}.");

        while (await reader.ReadAsync(ct))
        {
            string Get(string name) => ordinals.TryGetValue(name, out var i) && !reader.IsDBNull(i) ? Convert.ToString(reader.GetValue(i)) ?? "" : "";
            object? Raw(string name) => ordinals.TryGetValue(name, out var i) && !reader.IsDBNull(i) ? reader.GetValue(i) : null;
            var sourceId = StableBoundedId(Get("SourceId"),200);
            if (string.IsNullOrWhiteSpace(sourceId))
                throw new InvalidOperationException($"Knowledge source '{source.Name}' returned an empty SourceId.");
            var metadata = ParseMetadataJson(Get("MetadataJson"));
            AddScalar(metadata,"content_type_id",Raw("ContentTypeId"));
            AddScalar(metadata,"language_id",Raw("LanguageId"));
            AddScalar(metadata,"content_status_id",Raw("ContentStatusId"));
            AddScalar(metadata,"category_id",Raw("CategoryId"));
            AddScalar(metadata,"resource_code",Raw("ResourceCode"));
            AddScalar(metadata,"is_deleted",Raw("IsDeleted"));
            AddScalar(metadata,"is_current",Raw("IsCurrent"));
            AddScalar(metadata,"effective_from",ToIso(Raw("EffectiveFrom")));
            AddScalar(metadata,"effective_to",ToIso(Raw("EffectiveTo")));
            AddScalar(metadata,"version",Raw("Version"));
            AddScalar(metadata,"last_modified_at",ToIso(Raw("LastModifiedAt")));
            AddScalar(metadata,"source_collected_at",ToIso(Raw("SourceCollectedAt")));
            AddScalar(metadata,"symbols",Get("Symbols"));
            AddScalar(metadata,"companies",Get("Companies"));
            AddScalar(metadata,"persons",Get("Persons"));
            AddScalar(metadata,"topics",Get("Topics"));
            metadata["ingestion_change_mode"] = source.ChangeMode.ToString();
            metadata["vectorization_policy"] = source.VectorizationPolicy.ToString();
            metadata["capture_mode"] = source.CaptureMode.ToString();

            var published = ToDateTimeOffset(Raw("PublishedAt"));
            var watermark = ToDateTimeOffset(Raw("WatermarkAt")) ?? ToDateTimeOffset(Raw("LastModifiedAt")) ?? published ?? ToDateTimeOffset(Raw("SourceCollectedAt"));
            if (watermark is not null)
            {
                var rowCheckpoint = new IngestionCheckpoint(watermark.Value, sourceId, DateTimeOffset.UtcNow);
                if (checkpoint is not null && IngestionCheckpoint.Compare(rowCheckpoint, checkpoint) <= 0) continue;
                if (batchCheckpoint is null || IngestionCheckpoint.Compare(rowCheckpoint, batchCheckpoint) > 0) batchCheckpoint = rowCheckpoint;
            }

            if (total >= maxDocuments) break;
            total++;

            var body=Get("Body").Trim();
            if(source.Name.Equals("phase1-tse-faq",StringComparison.OrdinalIgnoreCase))
                body=OverlappingFragmentMerger.Merge(body.Split('\u001e'));
            var isDeleted=metadata.TryGetValue("is_deleted",out var deletedValue) && IsTrue(deletedValue);
            if(string.IsNullOrWhiteSpace(body) && !isDeleted) continue;
            if(body.Length>200000)
            {
                metadata["original_body_length"]=body.Length;
                metadata["body_truncated"]=true;
                body=body[..200000];
            }
            var title=Get("Title").Trim();
            if(source.Name.Equals("phase1-tse-faq",StringComparison.OrdinalIgnoreCase))
                title=OverlappingFragmentMerger.Merge(title.Split('\u001e'));
            if(string.IsNullOrWhiteSpace(title)) title=$"{source.SourceType} {sourceId}";
            if(title.Length>1000) title=title[..1000];
            var documentId = BuildDocumentId(source,sourceId,metadata);
            batch.Add(new KnowledgeDocument(
                documentId, source.SourceType, sourceId,
                title, body.Length==0 ? "deleted" : body, Null(Get("Url")), Null(Get("Symbol")), Null(Get("Category")), published, metadata));

            if (batch.Count >= batchSize)
            {
                yield return new KnowledgeBatch(batch.ToArray(), batchCheckpoint);
                batch.Clear(); batchCheckpoint=null;
            }
        }
        if (batch.Count > 0) yield return new KnowledgeBatch(batch.ToArray(), batchCheckpoint);
    }

    private SqlConnection CreateConnection()
    {
        if (string.IsNullOrWhiteSpace(_options.ConnectionString)) throw new InvalidOperationException("Knowledge:ConnectionString is not configured.");
        var csb=new SqlConnectionStringBuilder(_options.ConnectionString);
        return new SqlConnection(csb.ConnectionString);
    }

    private static void ValidateSelect(KnowledgeSourceOptions source)
    {
        var query=(source.Query ?? "").Trim();
        if (!query.StartsWith("select", StringComparison.OrdinalIgnoreCase))
            throw new InvalidOperationException($"Knowledge source '{source.Name}' must be a SELECT query.");
        if (query.Contains(';') || query.Contains("--") || query.Contains("/*",StringComparison.Ordinal))
            throw new InvalidOperationException($"Knowledge source '{source.Name}' contains forbidden SQL syntax.");
        foreach (var token in new[] { " insert ", " update ", " delete ", " merge ", " drop ", " alter ", " exec ", " execute " })
            if ($" {query.ToLowerInvariant()} ".Contains(token,StringComparison.Ordinal))
                throw new InvalidOperationException($"Knowledge source '{source.Name}' is not read-only.");
    }

    private static Dictionary<string,object?> ParseMetadataJson(string value)
    {
        if (string.IsNullOrWhiteSpace(value)) return new(StringComparer.OrdinalIgnoreCase);
        try
        {
            using var doc=JsonDocument.Parse(value);
            if (doc.RootElement.ValueKind != JsonValueKind.Object) return new(StringComparer.OrdinalIgnoreCase);
            return doc.RootElement.EnumerateObject().ToDictionary(x=>x.Name,x=>(object?)ToObject(x.Value),StringComparer.OrdinalIgnoreCase);
        }
        catch (JsonException) { return new(StringComparer.OrdinalIgnoreCase); }
    }
    private static object? ToObject(JsonElement x) => x.ValueKind switch
    {
        JsonValueKind.String => x.GetString(), JsonValueKind.Number when x.TryGetInt64(out var n) => n,
        JsonValueKind.Number => x.GetDecimal(), JsonValueKind.True => true, JsonValueKind.False => false,
        JsonValueKind.Array => x.EnumerateArray().Select(ToObject).ToArray(), _ => x.ToString()
    };
    private static void AddScalar(IDictionary<string,object?> d,string key,object? value)
    {
        if (value is null) return;
        if (value is string s && string.IsNullOrWhiteSpace(s)) return;
        d[key]=value;
    }
    private static string? ToIso(object? value) => ToDateTimeOffset(value)?.ToString("O");
    private static DateTimeOffset? ToDateTimeOffset(object? value) => value switch
    {
        null => null,
        DateTimeOffset dto => dto,
        DateTime dt => new DateTimeOffset(DateTime.SpecifyKind(dt, dt.Kind==DateTimeKind.Unspecified?DateTimeKind.Utc:dt.Kind)),
        _ when DateTimeOffset.TryParse(Convert.ToString(value),out var parsed) => parsed,
        _ => null
    };
    private static string? Null(string value) => string.IsNullOrWhiteSpace(value) ? null : value;
    private static string BuildDocumentId(KnowledgeSourceOptions source,string sourceId,IReadOnlyDictionary<string,object?> metadata)
    {
        if(source.VectorizationPolicy!=VectorizationPolicy.AllVersions) return StableBoundedId($"{source.SourceType}:{sourceId}",200);
        var version = metadata.TryGetValue("version",out var explicitVersion) ? Convert.ToString(explicitVersion) : null;
        if(string.IsNullOrWhiteSpace(version) && metadata.TryGetValue("effective_from",out var effectiveFrom)) version=Convert.ToString(effectiveFrom);
        if(string.IsNullOrWhiteSpace(version))
            throw new InvalidOperationException($"Knowledge source '{source.Name}' uses AllVersions but did not return Version or EffectiveFrom.");
        return StableBoundedId($"{source.SourceType}:{sourceId}:v:{version}",200);
    }
    private static bool IsTrue(object? value) => value is true || string.Equals(Convert.ToString(value),"1",StringComparison.OrdinalIgnoreCase) || string.Equals(Convert.ToString(value),"true",StringComparison.OrdinalIgnoreCase);
    private static string StableBoundedId(string value,int maxLength)
    {
        value=(value ?? "").Trim();
        if(value.Length<=maxLength) return value;
        var hash=Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(value)));
        return $"{value[..(maxLength-hash.Length-1)]}:{hash}";
    }
}
