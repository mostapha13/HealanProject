using Microsoft.Data.SqlClient;

namespace TSEAI.Knowledge.Worker;

/// <summary>Discovers the Phase-1 SQL-AI knowledge tables without assuming optional legacy column names.</summary>
public sealed class Phase1KnowledgeSourceDiscovery(KnowledgeOptions options, ILogger<Phase1KnowledgeSourceDiscovery> logger)
{
    public async Task<IReadOnlyList<KnowledgeSourceOptions>> DiscoverAsync(CancellationToken ct)
    {
        if (!options.EnablePhase1AutoSources || string.IsNullOrWhiteSpace(options.ConnectionString)) return [];
        var csb=new SqlConnectionStringBuilder(options.ConnectionString);
        await using var connection=new SqlConnection(csb.ConnectionString); await connection.OpenAsync(ct);
        var sources=new List<KnowledgeSourceOptions>();
        foreach (var spec in new[] { "Content", "FAQ", "TseFaq", "Companystate", "EDeliveryObject", "TsePerson" })
        {
            var columns=await GetColumnsAsync(connection,spec,ct);
            if (columns.Count==0) { logger.LogWarning("Phase-1 knowledge table dbo.{Table} is not present; source skipped.",spec); continue; }
            var source=spec switch
            {
                "Content" => BuildContent(columns),
                "FAQ" => BuildFaq(columns),
                "TseFaq" => BuildTseFaq(columns),
                "Companystate" => BuildCompanyState(columns),
                "EDeliveryObject" => BuildDelivery(columns),
                "TsePerson" => BuildTsePerson(columns),
                _ => null
            };
            if (source is null) logger.LogWarning("dbo.{Table} does not expose enough known columns for safe knowledge ingestion.",spec);
            else sources.Add(source);
        }
        return sources;
    }

    private static async Task<HashSet<string>> GetColumnsAsync(SqlConnection connection,string table,CancellationToken ct)
    {
        await using var command=new SqlCommand("SELECT name FROM sys.columns WHERE object_id=OBJECT_ID(@TableName,'U')",connection);
        command.Parameters.AddWithValue("@TableName",$"dbo.{table}");
        var result=new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        await using var reader=await command.ExecuteReaderAsync(ct); while(await reader.ReadAsync(ct)) result.Add(reader.GetString(0));
        return result;
    }

    private static KnowledgeSourceOptions? BuildContent(HashSet<string> c)
    {
        if (!Has(c,"Id","Body")) return null;
        var watermark=GreatestDate(c,"LastModifiedAt","DeletedAt","CreatedAt","PublishAt");
        var title=FirstExpr(c,"Title","Subject","Name") ?? "CONCAT(N'Content ',CONVERT(nvarchar(64),[Id]))";
        var isDeleted=c.Contains("IsDeleted")?"COALESCE([IsDeleted],CAST(0 AS bit))":"CAST(0 AS bit)";
        var isPublished=c.Contains("ContentStatusId")?"[ContentStatusId]=3":"1=1";
        const string hasBody="NULLIF(LTRIM(RTRIM([Body])),N'') IS NOT NULL";
        var vectorDeleted=$"CASE WHEN {isDeleted}=1 OR NOT ({isPublished}) OR NOT ({hasBody}) THEN CAST(1 AS bit) ELSE CAST(0 AS bit) END";
        return Source("phase1-content","cms_content",$"""
SELECT CONVERT(nvarchar(200),[Id]) AS SourceId,
       {title} AS Title,
       CONVERT(nvarchar(max),[Body]) AS Body,
       NULL AS Url, NULL AS Symbol, N'cms' AS Category,
       {ColOrNull(c,"PublishAt")} AS PublishedAt,
       {ColOrNull(c,"ContentTypeId")} AS ContentTypeId,
       {ColOrNull(c,"LanguageId")} AS LanguageId,
       {ColOrNull(c,"ContentStatusId")} AS ContentStatusId,
       {vectorDeleted} AS IsDeleted,
       {ColOrNull(c,"LastModifiedAt")} AS LastModifiedAt,
       {ColOrNull(c,"SourceCollectedAt")} AS SourceCollectedAt,
       {watermark} AS WatermarkAt,
       NULL AS MetadataJson
FROM dbo.Content c
INNER JOIN (
    SELECT TOP (@Take) [Id] AS SelectedId
    FROM dbo.Content
    WHERE (@AfterWatermark IS NOT NULL OR ({hasBody} AND {isDeleted}=0 AND {isPublished}))
      AND (@AfterWatermark IS NULL
           OR {watermark} > @AfterWatermark
           OR ({watermark} = @AfterWatermark AND [Id] > TRY_CONVERT(int,@AfterSourceId)))
    ORDER BY {watermark},[Id]
) selected ON selected.SelectedId=c.[Id]
ORDER BY {watermark},c.[Id]
""",true,60,IngestionChangeMode.Upsert);
    }

    private static KnowledgeSourceOptions? BuildFaq(HashSet<string> c)
    {
        if (!c.Contains("QuestionText")) return null;
        var answer=c.Contains("AnswerRaw")?"CONVERT(nvarchar(max),[AnswerRaw])":"CAST(NULL AS nvarchar(max))";
        var watermark=Coalesce(c,"CreatedDate","SourceCollectedAt");
        var resource=ColOrNull(c,"ResourceCode");
        var id=$"CONVERT(varchar(64),HASHBYTES('SHA2_256',CONCAT(CONVERT(nvarchar(max),[QuestionText]),N'|',COALESCE(CONVERT(nvarchar(64),{resource}),N''))),2)";
        return Source("phase1-faq","faq",$"""
SELECT {id} AS SourceId,
       CONVERT(nvarchar(1000),[QuestionText]) AS Title,
       {answer} AS Body,
       NULL AS Url, NULL AS Symbol, N'faq' AS Category,
       {ColOrNull(c,"CreatedDate")} AS PublishedAt,
       CAST(1 AS int) AS LanguageId,
       {resource} AS ResourceCode,
       {ColOrNull(c,"SourceCollectedAt")} AS SourceCollectedAt,
       {watermark} AS WatermarkAt,
       NULL AS MetadataJson
FROM dbo.FAQ
WHERE [QuestionText] IS NOT NULL AND (@Since IS NULL OR {watermark} >= @Since)
ORDER BY WatermarkAt,SourceId
""",true,600,IngestionChangeMode.Upsert);
    }

    private static KnowledgeSourceOptions? BuildCompanyState(HashSet<string> c)
    {
        var bodyName=First(c,"ReasonRawHtml","Reasons","Reason","Dalil","Vaziyatdesc","Description","RawTitle","Title");
        if (bodyName is null) return null;
        var titleName=First(c,"companyName","StateTitle","Title","Nam","Namad","RawTitle");
        var company=titleName is null?"N'نامشخص'":$"COALESCE(CONVERT(nvarchar(1000),{Q(titleName)}),N'نامشخص')";
        var symbol=c.Contains("Namad")?"COALESCE(CONVERT(nvarchar(512),[Namad]),N'نامشخص')":"N'نامشخص'";
        var status=c.Contains("Vaziyatdesc")?"COALESCE(CONVERT(nvarchar(100),[Vaziyatdesc]),N'نامشخص')":"N'نامشخص'";
        var changed=c.Contains("Lastdatechange")?"COALESCE(CONVERT(nvarchar(32),[Lastdatechange]),N'نامشخص')":"N'نامشخص'";
        var ceo=c.Contains("CEO")?"COALESCE(CONVERT(nvarchar(1000),[CEO]),N'ثبت نشده')":"N'ثبت نشده'";
        var board=c.Contains("BOARDMEMBER")?"COALESCE(REPLACE(CONVERT(nvarchar(max),[BOARDMEMBER]),N'<br>',NCHAR(10)),N'ثبت نشده')":"N'ثبت نشده'";
        var reason=$"REPLACE(CONVERT(nvarchar(max),{Q(bodyName)}),N'<br>',NCHAR(10))";
        var title=$"CONCAT({symbol},N' — ',{company})";
        const string stateMetadata="N'{\"snapshot\":\"current\",\"date_calendar\":\"jalali\"}'";
        var sourceId=c.Contains("Kodnamaddarsamane")?"CONVERT(nvarchar(200),[Kodnamaddarsamane])"
            :c.Contains("Namad")?"CONVERT(nvarchar(200),[Namad])"
            :c.Contains("Id")?"CONVERT(nvarchar(200),[Id])"
            :$"CONVERT(varchar(64),HASHBYTES('SHA2_256',CONVERT(nvarchar(max),{Q(bodyName)})),2)";
        var watermark=Coalesce(c,"CreatedDate","SourceCollectedAt");
        return Source("phase1-company-state","company_state",$"""
SELECT {sourceId} AS SourceId,
       CONVERT(nvarchar(1000),{title}) AS Title,
       CONCAT(N'نماد: ',{symbol},NCHAR(10),
              N'نام شرکت: ',{company},NCHAR(10),
              N'وضعیت: ',{status},NCHAR(10),
              N'آخرین تغییر وضعیت (شمسی): ',{changed},NCHAR(10),
              N'علت‌ها: ',{reason},NCHAR(10),
              N'مدیرعامل: ',{ceo},NCHAR(10),
              N'اعضای هیئت‌مدیره: ',{board}) AS Body,
       NULL AS Url, {(c.Contains("Namad")?"[Namad]":"NULL")} AS Symbol, N'company_state' AS Category,
       NULL AS PublishedAt,
       CAST(1 AS int) AS LanguageId,
       {ColOrNull(c,"ResourceCode")} AS ResourceCode,
       {ColOrNull(c,"SourceCollectedAt")} AS EffectiveFrom,
       CAST(1 AS bit) AS IsCurrent,
       {ColOrNull(c,"SourceCollectedAt")} AS SourceCollectedAt,
       {watermark} AS WatermarkAt,
       {stateMetadata} AS MetadataJson
FROM dbo.Companystate
WHERE {Q(bodyName)} IS NOT NULL AND (@Since IS NULL OR {watermark} >= @Since)
ORDER BY WatermarkAt,SourceId
""",true,300,IngestionChangeMode.SlowlyChangingDimension2,VectorizationPolicy.CurrentProjection);
    }

    private static KnowledgeSourceOptions? BuildDelivery(HashSet<string> c)
    {
        var idName=First(c,"Id","ContentId"); if (idName is null) return null;
        var titleName=First(c,"Title","Name"); if (titleName is null) return null;
        var bodyName=First(c,"Description","Summary","Abstract","Body") ?? titleName;
        var urlName=First(c,"PageUrl","Url");
        var published=First(c,"PublishedAt","PublishAt","CreatedDate","CreatedAt");
        var watermark=Coalesce(c,"LastModifiedAt","DeletedAt",published,"SourceCollectedAt");
        return Source("phase1-download-center","download_center",$"""
SELECT CONVERT(nvarchar(200),{Q(idName)}) AS SourceId,
       CONVERT(nvarchar(1000),{Q(titleName)}) AS Title,
       CONVERT(nvarchar(max),{Q(bodyName)}) AS Body,
       {(urlName is null?"NULL":Q(urlName))} AS Url, NULL AS Symbol, N'download_center' AS Category,
       {(published is null?"NULL":Q(published))} AS PublishedAt,
       {ColOrDefault(c,"LanguageId","CAST(1 AS int)")} AS LanguageId,
       {ColOrNull(c,"CategoryId")} AS CategoryId,
       {ColOrNull(c,"IsDeleted")} AS IsDeleted,
       {ColOrNull(c,"LastModifiedAt")} AS LastModifiedAt,
       {ColOrNull(c,"SourceCollectedAt")} AS SourceCollectedAt,
       {watermark} AS WatermarkAt,
       NULL AS MetadataJson
FROM dbo.EDeliveryObject
WHERE {Q(titleName)} IS NOT NULL AND (@Since IS NULL OR {watermark} >= @Since)
ORDER BY WatermarkAt,SourceId
""",true,900,IngestionChangeMode.Upsert);
    }

    private static KnowledgeSourceOptions? BuildTseFaq(HashSet<string> c)
    {
        if (!Has(c,"Id","Title")) return null;
        var keyword=c.Contains("Keywords")?"COALESCE(CONVERT(nvarchar(1000),[Keywords]),N'')":"N''";
        var resource=c.Contains("ResourceCode")?"COALESCE(CONVERT(bigint,[ResourceCode]),-1)":"CAST(-1 AS bigint)";
        var created=c.Contains("CreatedDate")?"[CreatedDate]":"CAST('19000101' AS datetime2)";
        const string faqIdMetadata="N'{\"fragmented_source\":true,\"parent_key\":\"FaqId\"}'";
        if(c.Contains("FaqId"))
        {
            // FaqId is the authoritative parent key. Keywords are nullable for
            // thousands of market rows and therefore cannot define document
            // boundaries: grouping by them collapses unrelated symbols into one
            // huge document and poisons parent-document retrieval.
            return Source("phase1-tse-faq","faq",$"""
SELECT CONVERT(nvarchar(200),[FaqId]) AS SourceId,
       CONVERT(nvarchar(1000),LEFT(COALESCE(NULLIF(MAX({keyword}),N''),STRING_AGG(CONVERT(nvarchar(max),[Title]),NCHAR(30)) WITHIN GROUP (ORDER BY [Id])),1000)) AS Title,
       STRING_AGG(CONVERT(nvarchar(max),[Title]),NCHAR(30)) WITHIN GROUP (ORDER BY [Id]) AS Body,
       NULL AS Url, NULL AS Symbol, N'faq' AS Category,
       MAX({created}) AS PublishedAt,
       CAST(1 AS int) AS LanguageId,
       NULLIF(MAX({resource}),-1) AS ResourceCode,
       MAX({created}) AS WatermarkAt,
       {faqIdMetadata} AS MetadataJson
FROM dbo.TseFaq
WHERE [Title] IS NOT NULL
GROUP BY [FaqId]
HAVING @Since IS NULL OR MAX({created}) >= @Since
ORDER BY WatermarkAt,SourceId
""",true,900,IngestionChangeMode.Append);
        }
        return Source("phase1-tse-faq","faq",$"""
SELECT CONVERT(nvarchar(200),MIN([Id])) AS SourceId,
       CONVERT(nvarchar(1000),LEFT(STRING_AGG(CONVERT(nvarchar(max),[Title]),NCHAR(30)) WITHIN GROUP (ORDER BY [Id]),1000)) AS Title,
       STRING_AGG(CONVERT(nvarchar(max),[Title]),NCHAR(30)) WITHIN GROUP (ORDER BY [Id]) AS Body,
       NULL AS Url, NULL AS Symbol, N'faq' AS Category,
       MAX({created}) AS PublishedAt,
       CAST(1 AS int) AS LanguageId,
       NULLIF(MAX({resource}),-1) AS ResourceCode,
       MAX({created}) AS WatermarkAt,
       N'{"fragmented_source":true}' AS MetadataJson
FROM (
    SELECT x.*,SUM(x.IsNewGroup) OVER (ORDER BY x.Id ROWS UNBOUNDED PRECEDING) AS FragmentGroup
    FROM (
        SELECT t.*,
               CASE WHEN LAG({keyword}) OVER (ORDER BY t.Id)={keyword}
                          AND LAG({resource}) OVER (ORDER BY t.Id)={resource}
                    THEN 0 ELSE 1 END AS IsNewGroup
        FROM dbo.TseFaq t
    ) x
) grouped
WHERE [Title] IS NOT NULL
GROUP BY FragmentGroup
HAVING @Since IS NULL OR MAX({created}) >= @Since
ORDER BY WatermarkAt,SourceId
""",true,900,IngestionChangeMode.Append);
    }

    private static KnowledgeSourceOptions? BuildTsePerson(HashSet<string> c)
    {
        if (!Has(c,"ContentId","Role","SourceCollectedAt")) return null;
        var fullName=ColOrNull(c,"Fullname");
        return Source("phase1-organization-person","organization_person",$"""
SELECT CONVERT(varchar(64),HASHBYTES('SHA2_256',CONCAT(CONVERT(nvarchar(64),COALESCE([TsePersonCateryId],0)),N'|',CONVERT(nvarchar(1000),[Role]))),2) AS SourceId,
       CONVERT(nvarchar(1000),[Role]) AS Title,
       CONCAT(N'سمت: ',CONVERT(nvarchar(1000),[Role]),NCHAR(10),N'نام: ',COALESCE(CONVERT(nvarchar(1000),{fullName}),N'نامشخص')) AS Body,
       NULL AS Url, NULL AS Symbol, N'organization_person' AS Category,
       [SourceCollectedAt] AS PublishedAt,
       CAST(1 AS int) AS LanguageId,
       [SourceCollectedAt] AS EffectiveFrom,
       CAST(1 AS bit) AS IsCurrent,
       {fullName} AS Persons,
       [SourceCollectedAt] AS SourceCollectedAt,
       [SourceCollectedAt] AS WatermarkAt,
       NULL AS MetadataJson
FROM dbo.TsePerson
WHERE [Role] IS NOT NULL AND [ContentId] IN
      (SELECT MAX([ContentId]) FROM dbo.TsePerson GROUP BY [TsePersonCateryId],[Role])
  AND (@Since IS NULL OR [SourceCollectedAt] >= @Since)
ORDER BY WatermarkAt,SourceId
""",true,3600,IngestionChangeMode.SlowlyChangingDimension2,VectorizationPolicy.CurrentProjection);
    }

    private static KnowledgeSourceOptions Source(string name,string type,string query,bool since,int pollSeconds,IngestionChangeMode changeMode,VectorizationPolicy vectorizationPolicy=VectorizationPolicy.ChangedTextOnly)=>new()
    {
        Name=name, SourceType=type, Query=query, SupportsSince=since, Enabled=true,
        PollSeconds=pollSeconds, ChangeMode=changeMode, CaptureMode=ChangeCaptureMode.Watermark,
        VectorizationPolicy=vectorizationPolicy
    };
    private static bool Has(HashSet<string> c,params string[] names)=>names.All(c.Contains);
    private static string? First(HashSet<string> c,params string?[] names)=>names.FirstOrDefault(x=>x is not null && c.Contains(x));
    private static string? FirstExpr(HashSet<string> c,params string[] names){var x=First(c,names);return x is null?null:$"CONVERT(nvarchar(1000),{Q(x)})";}
    private static string ColOrNull(HashSet<string> c,string name)=>c.Contains(name)?Q(name):"NULL";
    private static string ColOrDefault(HashSet<string> c,string name,string fallback)=>c.Contains(name)?$"COALESCE({Q(name)},{fallback})":fallback;
    private static string Coalesce(HashSet<string> c,params string?[] names)
    {
        var cols=names.Where(x=>x is not null && c.Contains(x!)).Select(x=>Q(x!)).ToArray();
        return cols.Length switch {0=>"CAST('19000101' AS datetime2)",1=>cols[0],_=>$"COALESCE({string.Join(',',cols)})"};
    }
    private static string GreatestDate(HashSet<string> c,params string[] names)
    {
        var cols=names.Where(c.Contains).Select(Q).ToArray();
        return cols.Length switch
        {
            0=>"CAST('19000101' AS datetime2)",
            1=>cols[0],
            _=>$"(SELECT MAX(v) FROM (VALUES ({string.Join("),(",cols)})) AS watermark_values(v))"
        };
    }
    private static string Q(string name)
    {
        if (string.IsNullOrWhiteSpace(name) || name.Any(ch=>!(char.IsLetterOrDigit(ch)||ch=='_'))) throw new InvalidOperationException("Unsafe discovered SQL identifier.");
        return $"[{name}]";
    }
}
