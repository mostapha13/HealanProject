using System.Globalization;
using System.Net;
using System.Security.Cryptography;
using System.Text;
using System.Text.RegularExpressions;
using Dapper;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using System.Text.Json;
using TSEAI.Application.Chat;
using TSEAI.Application.Entities;
using TSEAI.Application.Temporal;
using TSEAI.Shared.Application;

namespace TSEAI.Infrastructure.Chat;

public sealed partial class SqlAiCanonicalReferenceAnswerService(
    IConfiguration configuration,
    Microsoft.Extensions.Logging.ILogger<SqlAiCanonicalReferenceAnswerService> logger,
    IMemoryCache cache,
    IDistributedCache distributedCache,
    IClock clock,
    IPersianEntityResolver entityResolver) : ICanonicalReferenceAnswerService
{
    private static readonly SemaphoreSlim ReferenceCatalogLock=new(1,1);
    private static readonly SemaphoreSlim ContentMetricsLock=new(1,1);
    private static readonly SemaphoreSlim InstrumentAggregateLock=new(1,1);
    private static readonly SemaphoreSlim CompanySymbolLock=new(1,1);
    private static readonly TimeSpan ReferenceCacheTtl=TimeSpan.FromMinutes(15);
    private static readonly IReadOnlyDictionary<string,string[]> RegionalHallAliases =
        new Dictionary<string,string[]>(StringComparer.Ordinal)
        {
            ["آذربایجانشرقی"]=["تبریز"], ["آذربایجانغربی"]=["ارومیه"],
            ["البرز"]=["کرج"], ["چهارمحالوبختیاری"]=["شهرکرد"],
            ["خراسانجنوبی"]=["بیرجند"], ["خراسانرضوی"]=["مشهد"], ["خراسانشمالی"]=["بجنورد"],
            ["خوزستان"]=["اهواز"], ["سیستانوبلوچستان"]=["زاهدان"], ["فارس"]=["شیراز"],
            ["کردستان"]=["سنندج"], ["کهگیلویهوبویراحمد"]=["یاسوج"], ["گلستان"]=["گرگان"],
            ["گیلان"]=["رشت"], ["لرستان"]=["خرمآباد"], ["مازندران"]=["ساری"],
            ["مرکزی"]=["اراک"], ["هرمزگان"]=["بندرعباس"]
        };
    private string? ConnectionString => configuration.GetConnectionString("SqlAi");

    public async Task<CanonicalReferenceAnswer?> TryAnswerAsync(string question, TemporalResolution temporal, CancellationToken ct)
    {
        var q = Normalize(question);
        var ownership=CanonicalQuestionOwnership.Detect(q);
        var clientTypeIntent = CanonicalClientTypeQuestion.Parse(q);
        var companyIntent = CanonicalCompanyQuestion.Parse(q);
        var companyStateIntent = CanonicalCompanyStateQuestion.Parse(q);
        var contentIntent = CanonicalContentQuestion.Parse(q);
        var financialInstitutionIntent = CanonicalFinancialInstitutionQuestion.Parse(q);
        var targetedNewsEntity=PersianQuestionFacetAnalysis.TryExtractTargetedNewsEntity(q);
        var isGlobalLatestNews=ContainsAny(q,"آخرین خبر","جدیدترین خبر","تازه ترین خبر","تازه‌ترین خبر","خبر آخر","خبر تازه");
        if(isGlobalLatestNews&&(ContainsAny(q,"در آخرین خبر","در جدیدترین خبر","اوراق آخرین خبر","اوراق خبر آخر","خبر تازه بورس","خبر تازه تهران")
           ||ContainsAny(q,"بورس تهران","بورس اوراق بهادار تهران","بازار سرمایه")&&!q.Contains("نماد بورس",StringComparison.Ordinal)))
            targetedNewsEntity=null;
        clientTypeIntent=clientTypeIntent with { IsMatch=ownership is CanonicalQuestionDomain.None or CanonicalQuestionDomain.ClientType && clientTypeIntent.IsMatch };
        companyIntent=companyIntent with { IsMatch=ownership is CanonicalQuestionDomain.None or CanonicalQuestionDomain.Company && companyIntent.IsMatch };
        companyStateIntent=companyStateIntent with { IsMatch=ownership is CanonicalQuestionDomain.None or CanonicalQuestionDomain.CompanyState && companyStateIntent.IsMatch };
        if(companyIntent.IsMatch&&companyIntent.Aggregate!=CompanyAggregateKind.None)
            companyStateIntent=companyStateIntent with { IsMatch=false };
        contentIntent=contentIntent with { IsMatch=ownership is CanonicalQuestionDomain.None or CanonicalQuestionDomain.Content && contentIntent.IsMatch };
        if(!string.IsNullOrWhiteSpace(targetedNewsEntity))
            contentIntent=contentIntent with { IsMatch=false };
        financialInstitutionIntent=financialInstitutionIntent with { IsMatch=ownership is CanonicalQuestionDomain.None or CanonicalQuestionDomain.FinancialInstitution && financialInstitutionIntent.IsMatch };
        var isOrderBookQuestion=PersianMarketQuestionSemantics.IsOrderBookQuestion(q);
        var isMarketTradingState=q.Contains("وضعیت معاملاتی",StringComparison.Ordinal)
            &&q.Contains("نماد",StringComparison.Ordinal)
            &&!q.Contains("companystate",StringComparison.Ordinal);
        if(isMarketTradingState)
            companyStateIntent=companyStateIntent with { IsMatch=false };
        if(isOrderBookQuestion)
        {
            clientTypeIntent=clientTypeIntent with { IsMatch=false };
            companyIntent=companyIntent with { IsMatch=false };
            companyStateIntent=companyStateIntent with { IsMatch=false };
        }
        var clockAnswer=clientTypeIntent.IsMatch||companyIntent.IsMatch||companyStateIntent.IsMatch||contentIntent.IsMatch||financialInstitutionIntent.IsMatch?null:CanonicalClockAnswer.TryAnswer(question,temporal,clock.UtcNow);
        if(clockAnswer is not null)
            return CanonicalReferenceAnswer.Exact(clockAnswer,"clock","تاریخ و زمان جاری",
                [new("current_time",clockAnswer,"system-clock",clock.UtcNow)]);
        if (string.IsNullOrWhiteSpace(ConnectionString)) return null;
        var currentScope = !temporal.HasTemporalReference || temporal.IsReferenceDayOnly;
        var instrumentIntent = currentScope ? CanonicalInstrumentQuestion.Parse(q) : new(false,InstrumentAggregateKind.None,[],null,null,10,false);
        instrumentIntent=instrumentIntent with { IsMatch=ownership is CanonicalQuestionDomain.None or CanonicalQuestionDomain.Instrument && instrumentIntent.IsMatch };
        if(isOrderBookQuestion&&instrumentIntent.Aggregate!=InstrumentAggregateKind.OrderBookCoverage)
            instrumentIntent=instrumentIntent with { IsMatch=false };
        var boardIntent = currentScope ? CanonicalBoardMemberAnswer.Parse(q) : default;
        if(boardIntent.IsMemberList&&!companyStateIntent.ExplicitStateContext&&string.IsNullOrWhiteSpace(companyStateIntent.LookupHint))
            companyStateIntent=companyStateIntent with { IsMatch=false };
        if(PersianMarketQuestionSemantics.IsScreeningQuestion(q)
           &&PersianMarketQuestionSemantics.DetectRequestedFields(q).Count>0)
            instrumentIntent=instrumentIntent with { IsMatch=false };
        var personFacets = currentScope ? CanonicalBoardMemberAnswer.AdditionalPersonFacets(q) : default;
        var symbol = SymbolAfter(q, "نماد");
        var aboutSymbol = SymbolAfter(q, "در مورد");
        var allowOrganizationReference=ownership!=CanonicalQuestionDomain.Knowledge
            &&!companyStateIntent.IsMatch&&!companyIntent.IsMatch;
        var isNews = currentScope && ownership!=CanonicalQuestionDomain.Knowledge
            &&string.IsNullOrWhiteSpace(targetedNewsEntity)
            &&(isGlobalLatestNews||ContainsAny(q,"تازه ترین خبری","تازه‌ترین خبری"));
        var isLatestInstrument = currentScope && (q.Contains("آخرین نماد", StringComparison.Ordinal) || q.Contains("جدیدترین نماد", StringComparison.Ordinal));
        var isHallAddressCatalog=currentScope
            &&q.Contains("تالار",StringComparison.Ordinal)
            &&ContainsAny(q,"آدرس","نشانی","نشونی","مکان فیزیکی")
            &&ContainsAny(q,"کدام تالار","کدوم تالار","چه تالار","همه تالار","تالارها","تالار ها","دارید","داری");
        var isRegionalHallLookup=currentScope
            &&q.Contains("تالار",StringComparison.Ordinal)
            &&(ContainsAny(q,"آدرس","نشانی","نشونی","کجاست","کجا قرار","محل قرار","تلفن تالار","شماره تماس تالار",
                    "کد تالار","کدش","مشخصات تالار","اطلاعات تالار","آخرین بروزرسانی تالار","آخرین به روزرسانی تالار",
                    "زمان جمع آوری تالار","زمان جمع‌آوری تالار","کدام معاونت","کدوم معاونت","چه معاونتی","بالادست")
                ||(!companyIntent.IsMatch&&!financialInstitutionIntent.IsMatch&&Regex.IsMatch(q,@"^تالار(?: منطقه ای| منطقه‌ای)?\s+.+$",RegexOptions.CultureInvariant)))
            &&!isHallAddressCatalog
            &&!ContainsAny(q,"شرکت","کارگزاری","سبدگردان","نهاد مالی","تأمین سرمایه","تامین سرمایه");
        var isHall = q.Contains("تالار", StringComparison.Ordinal) &&
            (q.Contains("خوزستان", StringComparison.Ordinal) || q.Contains("اهواز", StringComparison.Ordinal));
        var isVolume = currentScope && !string.IsNullOrWhiteSpace(symbol) && q.Contains("حجم", StringComparison.Ordinal);
        var isHierarchy = currentScope && allowOrganizationReference && CanonicalOrganizationHierarchyAnswer.IsSubordinateQuestion(q);
        var isHierarchyParent = currentScope && allowOrganizationReference && CanonicalOrganizationHierarchyAnswer.IsParentQuestion(q);
        var isDeputyRoster = currentScope && allowOrganizationReference && IsOrganizationDeputyRosterQuestion(q);
        var isPersonFacet = currentScope && allowOrganizationReference && (personFacets.WantsHistory || personFacets.WantsRepresentation);
        var isPersonRole = currentScope && allowOrganizationReference && CanonicalPersonRoleMatcher.IsPersonRoleQuestion(q);
        if (!currentScope) aboutSymbol=null;
        if (!companyStateIntent.IsMatch && !companyIntent.IsMatch && !clientTypeIntent.IsMatch && !contentIntent.IsMatch && !financialInstitutionIntent.IsMatch && !instrumentIntent.IsMatch && !isNews && !isLatestInstrument && !isHallAddressCatalog && !isRegionalHallLookup && !isHall && !isVolume && !isHierarchy && !isHierarchyParent && !isDeputyRoster && !isPersonFacet && !isPersonRole && (!allowOrganizationReference||!boardIntent.IsMemberList) && string.IsNullOrWhiteSpace(aboutSymbol)) return null;

        if(clientTypeIntent.IsMatch&&!currentScope)
            return CanonicalReferenceAnswer.Exact(
                "جدول ClientType فعلی فقط یک Snapshot جاری دارد و تاریخچه روزانه در آن نگهداری نشده است؛ بنابراین پاسخ قابل اتکا برای تاریخ درخواستی وجود ندارد.",
                "client_type","نبود تاریخچه حقیقی و حقوقی",confidence:1);
        if(financialInstitutionIntent.IsMatch&&(!currentScope||CanonicalFinancialInstitutionQuestion.HasHistoricalReference(q)))
            return CanonicalReferenceAnswer.Exact(
                "جدول Nahad_Mali فقط Snapshot فعلی شعب و اطلاعات تماس نهادهای مالی را نگهداری می‌کند و تاریخچه زمانی در آن وجود ندارد؛ بنابراین وضعیت تاریخی درخواستی قابل پاسخ نیست.",
                "financial_institution","نبود تاریخچه نهادهای مالی",confidence:1);

        for(var attempt=1;attempt<=2;attempt++)
        {
            try
            {
                await using var connection = new SqlConnection(new SqlConnectionStringBuilder(ConnectionString).ConnectionString);
                await connection.OpenAsync(ct);
                if(isHallAddressCatalog)
                    return await RegionalHallAddressCatalog(connection,ct);
                if(isRegionalHallLookup)
                {
                    var hallAnswer=await RegionalHallDetails(connection,q,ct);
                    if(hallAnswer is not null) return hallAnswer;
                }
                if(financialInstitutionIntent.IsMatch)
                {
                    var financialInstitutionAnswer=await AnswerFinancialInstitutionQuestion(connection,question,q,financialInstitutionIntent,ct);
                    if(financialInstitutionAnswer is not null) return financialInstitutionAnswer;
                }
                if(contentIntent.IsMatch)
                {
                    var contentAnswer=await AnswerContentQuestion(connection,question,q,contentIntent,ct);
                    if(contentAnswer is not null) return contentAnswer;
                }
                if(companyStateIntent.IsMatch)
                {
                    var companyStateAnswer=await AnswerCompanyStateQuestion(connection,question,q,companyStateIntent,ct);
                    if(companyStateAnswer is not null) return companyStateAnswer;
                }
                if(companyIntent.IsMatch)
                {
                    var companyAnswer=await AnswerCompanyQuestion(connection,question,q,companyIntent,temporal,ct);
                    if(companyAnswer is not null) return companyAnswer;
                }
                if(clientTypeIntent.IsMatch)
                {
                    var clientTypeAnswer=await AnswerClientTypeQuestion(connection,question,q,clientTypeIntent,ct);
                    if(clientTypeAnswer is not null) return clientTypeAnswer;
                }
                if (boardIntent.IsMemberList)
                {
                    var boardMembers = await CurrentBoardMembers(connection, boardIntent, ct);
                    if (boardMembers is not null)
                        return boardMembers;
                }
                if(isHierarchy)
                {
                    var hierarchy=await CurrentOrganizationSubordinates(connection,q,ct);
                    if(hierarchy is not null) return hierarchy;
                }
                if(isHierarchyParent)
                {
                    var parent=await CurrentOrganizationParent(connection,q,ct);
                    if(parent is not null) return parent;
                }
                if(isDeputyRoster)
                    return await CurrentOrganizationDeputyRoster(connection,q,ct);
                if(isPersonFacet)
                {
                    var personReference=await CurrentPersonReferenceByName(connection,q,personFacets,ct);
                    if(personReference is not null) return personReference;
                }
                if (isPersonRole)
                {
                    var personRole = await CurrentPersonRole(connection, q, ct);
                    if (personRole is not null)
                        return personRole;
                }
                if (isNews) return Wrap(await LatestNews(connection, q, ct),"news","آخرین خبر بورس تهران");
                if(instrumentIntent.IsMatch)
                {
                    var instrumentAnswer=await AnswerInstrumentQuestion(connection,question,q,instrumentIntent,ct);
                    if(instrumentAnswer is not null) return instrumentAnswer;
                }
                if (isLatestInstrument) return Wrap(await LatestInstrument(connection, ct),"instrument","آخرین نماد ثبت‌شده");
                if (isHall) return Wrap(await RegionHall(connection, q, ct),"hall","تالار استان خوزستان");
                if (isVolume) return Wrap(await SymbolVolume(connection, symbol!, ct),"market_reference",$"حجم معاملات {symbol}",subjectName:symbol);
                if (string.IsNullOrWhiteSpace(aboutSymbol)) return null;
                return Wrap(await InstrumentSummary(connection, aboutSymbol!, ct),"instrument",$"نماد {aboutSymbol}",subjectName:aboutSymbol);
            }
            catch(Exception exception) when(attempt<2&&IsTransientSqlFailure(exception))
            {
                logger.LogWarning(exception,"Transient canonical SQL failure on attempt {Attempt}; clearing the SQL pool and retrying once.",attempt);
                SqlConnection.ClearAllPools();
                await Task.Delay(TimeSpan.FromMilliseconds(150),ct);
            }
            catch (SqlException exception)
            {
                logger.LogWarning(exception, "Canonical reference lookup failed; normal chat routing will continue.");
                return null;
            }
            catch(InvalidOperationException exception) when(IsClosedSqlConnection(exception))
            {
                logger.LogWarning(exception,"Canonical SQL connection was closed; normal chat routing will continue.");
                SqlConnection.ClearAllPools();
                return null;
            }
        }
        return null;
    }

    private static bool IsTransientSqlFailure(Exception exception)=>
        exception is SqlException sqlException&&sqlException.Number is -2 or 20 or 64 or 233 or 10053 or 10054 or 10060
        ||exception is InvalidOperationException invalidOperation&&IsClosedSqlConnection(invalidOperation);

    private static bool IsClosedSqlConnection(InvalidOperationException exception)=>
        exception.Message.Contains("connection is closed",StringComparison.OrdinalIgnoreCase)
        ||exception.Message.Contains("connection was not closed",StringComparison.OrdinalIgnoreCase);

    private async Task<CanonicalReferenceAnswer?> AnswerContentQuestion(
        SqlConnection connection,string question,string normalizedQuestion,
        CanonicalContentQuestionIntent intent,CancellationToken ct)
    {
        string? answer=intent.Aggregate switch
        {
            ContentAggregateKind.Statistics=>await ContentStatistics(connection,ct),
            ContentAggregateKind.TypeDistribution=>await ContentDistribution(connection,"ContentTypeId","نوع محتوا",ct),
            ContentAggregateKind.LanguageDistribution=>await ContentDistribution(connection,"LanguageId","زبان",ct),
            ContentAggregateKind.StatusDistribution=>await ContentDistribution(connection,"ContentStatusId","وضعیت محتوا",ct),
            ContentAggregateKind.DepartmentDistribution=>await ContentDistribution(connection,"DepartmentId","واحد",ct),
            ContentAggregateKind.LatestPublished=>await LatestContentRows(connection,intent.Limit,ct),
            ContentAggregateKind.DateRange=>await ContentDateRange(connection,ct),
            ContentAggregateKind.DataQuality=>await ContentDataQuality(connection,normalizedQuestion,ct),
            ContentAggregateKind.Schema=>ContentSchemaAnswer(normalizedQuestion),
            _=>null
        };
        if(!string.IsNullOrWhiteSpace(answer))
            return CanonicalReferenceAnswer.Exact(answer,"content_reference","جدول Content",confidence:1);
        if(intent.ContentId is null) return null;

        const string sql="""
            SELECT TOP (1) Id,ContentTypeId,LanguageId,PublishAt,ContentStatusId,Body,
                CreatedAt,DepartmentId,LastModifiedAt,DeletedAt,IsDeleted,SourceCollectedAt
            FROM dbo.Content WITH (READUNCOMMITTED) WHERE Id=@Id
            OPTION (MAXDOP 1);
            """;
        var row=await GetContentRow(connection,intent.ContentId.Value,sql,ct);
        if(row is null)
            return CanonicalReferenceAnswer.Exact($"رکوردی با شناسه {intent.ContentId.Value} در جدول Content وجود ندارد.","content_reference","نبود رکورد Content",confidence:1);
        var fields=intent.Fields.ToHashSet(StringComparer.Ordinal);
        if(fields.Count==0) fields.UnionWith(["body","publish_at","content_type_id","language_id","content_status_id"]);
        var parts=new List<string>();
        var cleanBody=CleanHtml(row.Body);
        if(fields.Contains("body"))
        {
            var body=intent.FullText
                ? (cleanBody.Length<=12000?cleanBody:cleanBody[..12000]+"… [متن در پاسخ به ۱۲٬۰۰۰ نویسه محدود شد]")
                : TrimAtSentence(cleanBody,fields.Count==1?1200:420);
            parts.Add(fields.Count==1?body:$"متن: {body}");
        }
        if(fields.Contains("publish_at")) parts.Add($"تاریخ انتشار: {ContentDateTime(row.PublishAt)}");
        if(fields.Contains("content_type_id")) parts.Add($"ContentTypeId: {row.ContentTypeId}");
        if(fields.Contains("language_id")) parts.Add($"LanguageId: {row.LanguageId}");
        if(fields.Contains("content_status_id")) parts.Add($"ContentStatusId: {row.ContentStatusId}");
        if(fields.Contains("department_id")) parts.Add($"DepartmentId: {row.DepartmentId}");
        if(fields.Contains("created_at")) parts.Add($"زمان ایجاد: {ContentDateTime(row.CreatedAt)}");
        if(fields.Contains("last_modified_at")) parts.Add($"آخرین ویرایش: {ContentDateTime(row.LastModifiedAt)}");
        if(fields.Contains("source_collected_at")) parts.Add($"زمان جمع‌آوری منبع: {ContentDateTime(row.SourceCollectedAt)}");
        if(fields.Contains("is_deleted")) parts.Add(row.IsDeleted?"رکورد حذف‌شده علامت خورده است.":"رکورد حذف‌شده نیست.");
        var text=$"رکورد Content با شناسه {row.Id}:\n"+string.Join("\n",parts);
        var source=$"Content:{row.Id}";
        var facts=new CanonicalReferenceFact[]
        {
            new("content_id",row.Id.ToString(CultureInfo.InvariantCulture),source),
            new("content_type_id",row.ContentTypeId.ToString(CultureInfo.InvariantCulture),source),
            new("language_id",row.LanguageId.ToString(CultureInfo.InvariantCulture),source),
            new("content_status_id",row.ContentStatusId.ToString(CultureInfo.InvariantCulture),source),
            new("publish_at",row.PublishAt?.ToString("O",CultureInfo.InvariantCulture)??"",source,AsOffset(row.PublishAt)),
            new("body",cleanBody,source),
            new("source_collected_at",row.SourceCollectedAt?.ToString("O",CultureInfo.InvariantCulture)??"",source,AsOffset(row.SourceCollectedAt))
        };
        return CanonicalReferenceAnswer.Exact(text,"content_reference",$"رکورد Content {row.Id}",facts,subjectName:row.Id.ToString(CultureInfo.InvariantCulture),confidence:1);
    }

    private async Task<ContentRow?> GetContentRow(SqlConnection connection,int id,string sql,CancellationToken ct)
    {
        var key=$"tseai:canonical:content-row:v2:{id}";
        if(cache.TryGetValue<ContentRow>(key,out var memoryRow)) return memoryRow;
        try
        {
            var serialized=await distributedCache.GetStringAsync(key,ct);
            if(!string.IsNullOrWhiteSpace(serialized))
            {
                var distributedRow=JsonSerializer.Deserialize<ContentRow>(serialized);
                if(distributedRow is not null)
                {
                    cache.Set(key,distributedRow,TimeSpan.FromMinutes(2));
                    return distributedRow;
                }
            }
        }
        catch(Exception exception) when(exception is not OperationCanceledException)
        {
            logger.LogWarning(exception,"Distributed Content row cache read failed for {ContentId}.",id);
        }

        await ReferenceCatalogLock.WaitAsync(ct);
        try
        {
            if(cache.TryGetValue<ContentRow>(key,out memoryRow)) return memoryRow;
            ContentRow? row=null;
            for(var attempt=1;attempt<=3;attempt++)
            {
                try
                {
                    row=await connection.QuerySingleOrDefaultAsync<ContentRow>(new CommandDefinition(
                        sql,new{Id=id},cancellationToken:ct,commandTimeout:8));
                    break;
                }
                catch(SqlException exception) when(exception.Number==-2&&attempt<3)
                {
                    logger.LogWarning(exception,"Content row {ContentId} timed out on attempt {Attempt}; retrying with a fresh SQL connection.",id,attempt);
                    SqlConnection.ClearPool(connection);
                    await connection.CloseAsync();
                    await Task.Delay(TimeSpan.FromMilliseconds(150*attempt),ct);
                }
            }
            if(row is null) return null;
            cache.Set(key,row,TimeSpan.FromMinutes(2));
            try
            {
                await distributedCache.SetStringAsync(key,JsonSerializer.Serialize(row),
                    new DistributedCacheEntryOptions{AbsoluteExpirationRelativeToNow=TimeSpan.FromMinutes(2)},ct);
            }
            catch(Exception exception) when(exception is not OperationCanceledException)
            {
                logger.LogWarning(exception,"Distributed Content row cache write failed for {ContentId}.",id);
            }
            return row;
        }
        finally { ReferenceCatalogLock.Release(); }
    }

    private async Task<string> ContentStatistics(SqlConnection connection,CancellationToken ct)
    {
        var identity=Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(ConnectionString!)))[..16];
        var cacheKey=$"content-statistics-answer:{identity}";
        if(cache.TryGetValue<string>(cacheKey,out var cached)&&!string.IsNullOrWhiteSpace(cached)) return cached;
        var distributed=await ReadDistributedCache<string>(cacheKey,ct);
        if(!string.IsNullOrWhiteSpace(distributed))
        {
            cache.Set(cacheKey,distributed,ReferenceCacheTtl);
            return distributed;
        }
        const string sql="""
            SELECT COUNT_BIG(*) TotalRows,COUNT_BIG(DISTINCT Id) DistinctIds,
                COUNT_BIG(DISTINCT ContentTypeId) ContentTypes,COUNT_BIG(DISTINCT LanguageId) Languages,
                COUNT_BIG(DISTINCT ContentStatusId) Statuses,COUNT_BIG(DISTINCT DepartmentId) Departments,
                MIN(Id) MinId,MAX(Id) MaxId,MAX(SourceCollectedAt) SourceCollectedAt
            FROM dbo.Content;
            """;
        var x=await connection.QuerySingleAsync<ContentStatsRow>(new CommandDefinition(sql,cancellationToken:ct,commandTimeout:20));
        var bodyCounts=await GetContentBodyCounts(connection,ct);
        var nonEmptyBodies=bodyCounts.TotalRows-bodyCounts.EmptyBodies;
        var answer=$"جدول Content دارای {x.TotalRows:N0} رکورد و {x.DistinctIds:N0} شناسه متمایز در بازه {x.MinId:N0} تا {x.MaxId:N0} است. {nonEmptyBodies:N0} رکورد بدنه غیرخالی دارند؛ داده شامل {x.ContentTypes:N0} ContentTypeId، {x.Languages:N0} LanguageId، {x.Statuses:N0} ContentStatusId و {x.Departments:N0} DepartmentId متمایز است. زمان جمع‌آوری منبع {ContentDateTime(x.SourceCollectedAt)} است.";
        cache.Set(cacheKey,answer,ReferenceCacheTtl);
        await WriteDistributedCache(cacheKey,answer,ct);
        return answer;
    }

    private async Task<string> ContentDistribution(SqlConnection connection,string column,string label,CancellationToken ct)
    {
        var allowed=new HashSet<string>(StringComparer.Ordinal){"ContentTypeId","LanguageId","ContentStatusId","DepartmentId"};
        if(!allowed.Contains(column)) throw new ArgumentOutOfRangeException(nameof(column));
        var cacheKey=$"sql-ai:content-distribution:{column}";
        if(cache.TryGetValue(cacheKey,out string? cached)&&!string.IsNullOrWhiteSpace(cached)) return cached;
        var distributed=await ReadDistributedCache<string>(cacheKey,ct);
        if(!string.IsNullOrWhiteSpace(distributed))
        {
            cache.Set(cacheKey,distributed,ReferenceCacheTtl);
            return distributed;
        }
        // The question asks for identifier distribution. Reading the large Body
        // column for a per-group non-empty count made this index-only aggregate
        // degrade into a full LOB scan and time out on the local SQL instance.
        var sql=$"SELECT {column} Value,COUNT_BIG(*) [Count] FROM dbo.Content GROUP BY {column} ORDER BY [Count] DESC,{column};";
        var rows=(await connection.QueryAsync<ContentDistributionRow>(new CommandDefinition(sql,cancellationToken:ct,commandTimeout:45))).ToArray();
        var body=string.Join("\n",rows.Select((x,i)=>$"{i+1}. {column}={x.Value}: {x.Count:N0} رکورد"));
        var caveat=column is "ContentTypeId" or "LanguageId"
            ? " جدول مرجع دارای نام برای این شناسه‌ها در داده فعلی خالی یا موجود نیست؛ بنابراین برچسب معنایی حدس زده نمی‌شود."
            : string.Empty;
        var answer=$"توزیع جدول Content بر اساس {label}:\n{body}\n{caveat}".Trim();
        cache.Set(cacheKey,answer,ReferenceCacheTtl);
        await WriteDistributedCache(cacheKey,answer,ct);
        return answer;
    }

    private static async Task<string> ContentDateRange(SqlConnection connection,CancellationToken ct)
    {
        const string sql="SELECT MIN(PublishAt) MinPublishAt,MAX(PublishAt) MaxPublishAt,MIN(CreatedAt) MinCreatedAt,MAX(CreatedAt) MaxCreatedAt FROM dbo.Content;";
        var x=await connection.QuerySingleAsync<ContentDateRangeRow>(new CommandDefinition(sql,cancellationToken:ct,commandTimeout:20));
        return $"بازه تاریخ انتشار ثبت‌شده Content از {ContentDateTime(x.MinPublishAt)} تا {ContentDateTime(x.MaxPublishAt)} است؛ بازه ایجاد رکوردها از {ContentDateTime(x.MinCreatedAt)} تا {ContentDateTime(x.MaxCreatedAt)} است. همه تاریخ‌ها برای نمایش به شمسی تبدیل شده‌اند.";
    }

    private static async Task<string> LatestContentRows(SqlConnection connection,int limit,CancellationToken ct)
    {
        const string sql="""
            SELECT TOP (@Limit) Id,ContentTypeId,LanguageId,PublishAt,ContentStatusId,Body
            FROM dbo.Content
            WHERE IsDeleted=0 AND ContentStatusId=3 AND NULLIF(LTRIM(RTRIM(Body)),N'') IS NOT NULL
            ORDER BY PublishAt DESC,Id DESC;
            """;
        var rows=(await connection.QueryAsync<ContentRow>(new CommandDefinition(sql,new{Limit=limit},cancellationToken:ct,commandTimeout:20))).ToArray();
        if(rows.Length==0) return "هیچ رکورد منتشرشده با بدنه غیرخالی در Content وجود ندارد.";
        return $"{rows.Length} رکورد منتشرشده اخیر Content:\n"+string.Join("\n",rows.Select((x,i)=>$"{i+1}. شناسه {x.Id} — {ContentDateTime(x.PublishAt)} — {TrimAtSentence(CleanHtml(x.Body),180)}"));
    }

    private async Task<string> ContentDataQuality(SqlConnection connection,string q,CancellationToken ct)
    {
        if(ContainsAny(q,"بدنه خالی","body خالی","محتوای خالی","رکورد خالی"))
        {
            var bodyCounts=await GetContentBodyCounts(connection,ct);
            return $"از {bodyCounts.TotalRows:N0} رکورد Content، تعداد {bodyCounts.EmptyBodies:N0} رکورد بدنه خالی و {bodyCounts.TotalRows-bodyCounts.EmptyBodies:N0} رکورد بدنه غیرخالی دارند.";
        }
        if(q.Contains("تکراری",StringComparison.Ordinal))
        {
            var duplicates=await GetContentDuplicateCounts(connection,ct);
            return $"در بدنه‌های حداقل ۸۰ نویسه‌ای Content، {duplicates.DuplicateGroups:N0} گروه متن کاملاً تکراری شامل {duplicates.ExtraDuplicateRows:N0} ردیف تکراری اضافه وجود دارد.";
        }

        var connectionIdentity=Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(ConnectionString!)))[..16];
        var key=$"content-quality:{connectionIdentity}";
        var x=await cache.GetOrCreateAsync(key,async entry=>
        {
            entry.AbsoluteExpirationRelativeToNow=ReferenceCacheTtl;
            const string sql="""
                WITH duplicate_bodies AS
                (
                    SELECT HASHBYTES('SHA2_256',CONVERT(varbinary(max),Body)) BodyHash,COUNT_BIG(*) Copies
                    FROM dbo.Content WHERE LEN(LTRIM(RTRIM(Body)))>=80
                    GROUP BY HASHBYTES('SHA2_256',CONVERT(varbinary(max),Body))
                    HAVING COUNT_BIG(*)>1
                )
                SELECT COUNT_BIG(*) TotalRows,
                    SUM(CASE WHEN NULLIF(LTRIM(RTRIM(Body)),N'') IS NULL THEN CONVERT(bigint,1) ELSE 0 END) EmptyBodies,
                    SUM(CASE WHEN LEN(LTRIM(RTRIM(Body))) BETWEEN 1 AND 79 THEN CONVERT(bigint,1) ELSE 0 END) ShortBodies,
                    SUM(CASE WHEN IsDeleted=0 AND ContentStatusId=3 AND LEN(LTRIM(RTRIM(Body)))>=80 THEN CONVERT(bigint,1) ELSE 0 END) InitialVectorCandidates,
                    SUM(CASE WHEN PublishAt IS NULL THEN CONVERT(bigint,1) ELSE 0 END) MissingPublishAt,
                    SUM(CASE WHEN Body LIKE N'%<%>%' THEN CONVERT(bigint,1) ELSE 0 END) HtmlBodies,
                    SUM(CASE WHEN CreatedByName IS NULL OR NULLIF(LTRIM(RTRIM(CreatedByName)),N'') IS NULL THEN CONVERT(bigint,1) ELSE 0 END) MissingCreatorNames,
                    SUM(CASE WHEN LastModifiedAt<CreatedAt THEN CONVERT(bigint,1) ELSE 0 END) ModifiedBeforeCreated,
                    SUM(CASE WHEN IsDeleted=1 THEN CONVERT(bigint,1) ELSE 0 END) DeletedRows,
                    (SELECT COUNT_BIG(*) FROM duplicate_bodies) DuplicateGroups,
                    (SELECT COALESCE(SUM(Copies-1),0) FROM duplicate_bodies) ExtraDuplicateRows
                FROM dbo.Content;
                """;
            return await connection.QuerySingleAsync<ContentQualityRow>(new CommandDefinition(sql,cancellationToken:ct,commandTimeout:60));
        });
        if(x is null) return "آمار کیفیت Content در دسترس نیست.";
        if(ContainsAny(q,"html","اچ تی ام ال")) return $"در {x.HtmlBodies:N0} رکورد Content نشانه‌های HTML دیده می‌شود؛ HTML پیش از chunk و embedding به متن ساده امن تبدیل می‌شود.";
        if(ContainsAny(q,"قابل بردارسازی","قابل vector")) return $"بر اساس کنترل اولیه SQL، {x.InitialVectorCandidates:N0} رکورد منتشرشده، حذف‌نشده و دارای بدنه حداقل ۸۰ نویسه‌اند. پاک‌سازی HTML و سیاست محتوایی ممکن است تعداد نهایی اسناد برداری را کمتر کند.";
        return $"کیفیت Content: از {x.TotalRows:N0} رکورد، {x.EmptyBodies:N0} بدنه خالی، {x.ShortBodies:N0} بدنه کوتاه‌تر از ۸۰ نویسه، {x.MissingPublishAt:N0} تاریخ انتشار خالی، {x.HtmlBodies:N0} بدنه دارای HTML و {x.MissingCreatorNames:N0} نام ایجادکننده خالی است. {x.DuplicateGroups:N0} گروه متن تکراری با {x.ExtraDuplicateRows:N0} ردیف اضافه و {x.ModifiedBeforeCreated:N0} ناسازگاری LastModifiedAt قبل از CreatedAt ثبت شده است.";
    }

    private async Task<ContentBodyCountRow> GetContentBodyCounts(SqlConnection connection,CancellationToken ct)
    {
        var identity=Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(ConnectionString!)))[..16];
        var key=$"content-body-counts:{identity}";
        if(cache.TryGetValue<ContentBodyCountRow>(key,out var cached)&&cached is not null) return cached;
        var distributed=await ReadDistributedCache<ContentBodyCountRow>(key,ct);
        if(distributed is not null)
        {
            cache.Set(key,distributed,ReferenceCacheTtl);
            return distributed;
        }
        await ContentMetricsLock.WaitAsync(ct);
        try
        {
            if(cache.TryGetValue<ContentBodyCountRow>(key,out cached)&&cached is not null) return cached;
            distributed=await ReadDistributedCache<ContentBodyCountRow>(key,ct);
            if(distributed is not null)
            {
                cache.Set(key,distributed,ReferenceCacheTtl);
                return distributed;
            }
            const string sql="""
                SELECT COUNT_BIG(*) TotalRows,
                    SUM(CASE WHEN NULLIF(LTRIM(RTRIM(Body)),N'') IS NULL THEN CONVERT(bigint,1) ELSE 0 END) EmptyBodies
                FROM dbo.Content;
                """;
            var result=await connection.QuerySingleAsync<ContentBodyCountRow>(new CommandDefinition(sql,cancellationToken:ct,commandTimeout:60));
            cache.Set(key,result,ReferenceCacheTtl);
            await WriteDistributedCache(key,result,ct);
            return result;
        }
        finally { ContentMetricsLock.Release(); }
    }

    private async Task<ContentDuplicateCountRow> GetContentDuplicateCounts(SqlConnection connection,CancellationToken ct)
    {
        var identity=Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(ConnectionString!)))[..16];
        var key=$"content-duplicate-counts:{identity}";
        if(cache.TryGetValue<ContentDuplicateCountRow>(key,out var cached)&&cached is not null) return cached;
        var distributed=await ReadDistributedCache<ContentDuplicateCountRow>(key,ct);
        if(distributed is not null)
        {
            cache.Set(key,distributed,ReferenceCacheTtl);
            return distributed;
        }
        await ContentMetricsLock.WaitAsync(ct);
        try
        {
            if(cache.TryGetValue<ContentDuplicateCountRow>(key,out cached)&&cached is not null) return cached;
            distributed=await ReadDistributedCache<ContentDuplicateCountRow>(key,ct);
            if(distributed is not null)
            {
                cache.Set(key,distributed,ReferenceCacheTtl);
                return distributed;
            }
            const string sql="""
                WITH duplicate_bodies AS
                (
                    SELECT HASHBYTES('SHA2_256',CONVERT(varbinary(max),Body)) BodyHash,COUNT_BIG(*) Copies
                    FROM dbo.Content WHERE LEN(LTRIM(RTRIM(Body)))>=80
                    GROUP BY HASHBYTES('SHA2_256',CONVERT(varbinary(max),Body))
                    HAVING COUNT_BIG(*)>1
                )
                SELECT COUNT_BIG(*) DuplicateGroups,COALESCE(SUM(Copies-1),0) ExtraDuplicateRows
                FROM duplicate_bodies;
                """;
            var result=await connection.QuerySingleAsync<ContentDuplicateCountRow>(new CommandDefinition(sql,cancellationToken:ct,commandTimeout:60));
            cache.Set(key,result,ReferenceCacheTtl);
            await WriteDistributedCache(key,result,ct);
            return result;
        }
        finally { ContentMetricsLock.Release(); }
    }

    private async Task<T?> ReadDistributedCache<T>(string key,CancellationToken ct)
    {
        try
        {
            var serialized=await distributedCache.GetStringAsync(key,ct);
            return string.IsNullOrWhiteSpace(serialized)?default:JsonSerializer.Deserialize<T>(serialized);
        }
        catch(Exception exception) when(exception is not OperationCanceledException)
        {
            logger.LogWarning(exception,"Distributed canonical cache read failed for {CacheKey}.",key);
            return default;
        }
    }

    private async Task WriteDistributedCache<T>(string key,T value,CancellationToken ct,TimeSpan? ttl=null)
    {
        try
        {
            await distributedCache.SetStringAsync(key,JsonSerializer.Serialize(value),
                new DistributedCacheEntryOptions{AbsoluteExpirationRelativeToNow=ttl??ReferenceCacheTtl},ct);
        }
        catch(Exception exception) when(exception is not OperationCanceledException)
        {
            logger.LogWarning(exception,"Distributed canonical cache write failed for {CacheKey}.",key);
        }
    }

    private static string ContentSchemaAnswer(string q)
    {
        if(ContainsAny(q,"کلید اصلی","primary key","ایندکس","index","کلید خارجی","foreign key"))
            return "جدول Content در Schema فعلی هیچ Primary Key، Index یا Foreign Key فیزیکی ندارد؛ یکتایی Id فقط در داده فعلی مشاهده می‌شود و در ساختار تضمین نشده است.";
        if(ContainsAny(q,"ستون عنوان","ستون title","ستون subject","title دارد","subject دارد","عنوان دارد"))
            return "جدول Content ستون Title یا Subject ندارد. عنوان برداری از اولین جمله بدنه پاک‌سازی‌شده ساخته می‌شود و عنوانی از SQL حدس زده نمی‌شود.";
        if(ContainsAny(q,"contenttypeid","نوع محتوا","رابطه با contenttype"))
            return "ContentTypeId یک tinyint اجباری است، اما Foreign Key به ContentType ندارد و جدول ContentType فعلی صفر رکورد دارد؛ بنابراین نام نوع‌ها را نمی‌توان به‌صورت قابل اتکا از SQL استخراج کرد.";
        if(ContainsAny(q,"تاریخ","datetime","publishat","createdat","lastmodifiedat"))
            return "PublishAt، CreatedAt و LastModifiedAt از نوع datetime2 هستند و SourceCollectedAt از نوع datetime است. مقدار SQL میلادی ذخیره می‌شود، اما همه تاریخ‌های پاسخ برای نمایش به شمسی تبدیل می‌شوند.";
        return "Content یک جدول CMS پایه با ۱۸ ستون است: شناسه و شناسه‌های نوع/زبان/وضعیت، Body از نوع nvarchar(max)، تاریخ انتشار و تاریخ‌های چرخه عمر، DepartmentId، اطلاعات ایجاد/ویرایش/حذف و SourceCollectedAt. ستون عنوان، Primary Key، Index و Foreign Key ندارد.";
    }

    private static string ContentDateTime(DateTime? value)
        => value is null?"ثبت نشده":PersianDisplayText.FormatPersianDate(value.Value,true);

    private async Task<CanonicalReferenceAnswer?> AnswerCompanyStateQuestion(
        SqlConnection connection,string question,string normalizedQuestion,
        CanonicalCompanyStateQuestionIntent intent,CancellationToken ct)
    {
        switch(intent.Aggregate)
        {
            case CompanyStateAggregateKind.Statistics:
                return Wrap(await CompanyStateStatistics(connection,ct),"company_state_aggregate","آمار جدول Companystate");
            case CompanyStateAggregateKind.StatusDistribution:
                return Wrap(await CompanyStateDistribution(connection,normalizedQuestion,ct),"company_state_aggregate","توزیع وضعیت ناشران");
            case CompanyStateAggregateKind.StatusList:
                return Wrap(await CompanyStateStatusList(connection,normalizedQuestion,intent.Limit,ct),"company_state_aggregate","فهرست وضعیت ناشران");
            case CompanyStateAggregateKind.LatestChanges:
                return Wrap(await CompanyStateChangeRanking(connection,intent.Limit,latest:true,ct),"company_state_aggregate","جدیدترین تغییر وضعیت‌ها");
            case CompanyStateAggregateKind.EarliestChanges:
                return Wrap(await CompanyStateChangeRanking(connection,intent.Limit,latest:false,ct),"company_state_aggregate","قدیمی‌ترین تغییر وضعیت‌ها");
            case CompanyStateAggregateKind.ChangeYear when intent.JalaliYear is not null:
                return Wrap(await CompanyStateChangeYear(connection,intent.JalaliYear.Value,intent.Limit,intent.NamesOnly,ct),"company_state_aggregate",$"تغییر وضعیت‌های سال {intent.JalaliYear}");
            case CompanyStateAggregateKind.ReasonAnalysis:
                return Wrap(await CompanyStateReasonAnalysis(connection,normalizedQuestion,ct),"company_state_aggregate","تحلیل دلایل وضعیت ناشران");
            case CompanyStateAggregateKind.DataQuality:
                return Wrap(await CompanyStateDataQuality(connection,normalizedQuestion,ct),"company_state_quality","کیفیت جدول Companystate");
            case CompanyStateAggregateKind.Schema:
                return Wrap(CompanyStateSchemaAnswer(normalizedQuestion),"company_state_schema","تعریف ستون‌های Companystate");
            case CompanyStateAggregateKind.Comparison:
                return await CompareCompanyStateChanges(connection,normalizedQuestion,ct);
        }

        var references=await ReferencedCompanyStates(connection,normalizedQuestion,ct);
        if(references.Count==0)
        {
            if(!intent.ExplicitStateContext) return null;
            var lookup=Display(intent.LookupHint);
            if(string.IsNullOrWhiteSpace(lookup)) return null;
            var missing=new List<string>();
            if(intent.Fields.Contains("ceo",StringComparer.Ordinal)) missing.Add("مدیرعامل");
            if(intent.Fields.Contains("board_members",StringComparer.Ordinal)) missing.Add("اعضای هیئت‌مدیره");
            if(intent.Fields.Contains("reason",StringComparer.Ordinal)) missing.Add("دلیل وضعیت");
            if(intent.Fields.Contains("status",StringComparer.Ordinal)) missing.Add("وضعیت معاملاتی");
            var requested=missing.Count==0?"فعال یا متوقف بودن آن":string.Join(" و ",missing);
            var answer=intent.Fields.Contains("status",StringComparer.Ordinal)
                ? $"در اطلاعات فعلی وضعیت شرکت‌ها، رکوردی برای «{lookup}» وجود ندارد؛ بنابراین نمی‌توان فعال یا متوقف بودن آن را نتیجه گرفت."
                : $"در اطلاعات فعلی وضعیت شرکت‌ها، رکوردی برای «{lookup}» وجود ندارد؛ بنابراین {requested} قابل تأیید نیست.";
            var absenceSource=$"Companystate:absent:{CanonicalCompanyStateQuestion.MatchKey(lookup)}";
            return CanonicalReferenceAnswer.Exact(answer,"company_state","نبود رکورد در Snapshot وضعیت ناشران",
                [new("symbol",lookup,absenceSource),new("record_status","absent",absenceSource)],subjectName:lookup,confidence:1);
        }
        if(references.Count>1) return null;

        var row=await CompanyStateDetail(connection,references[0].SystemCode,ct)??references[0];
        var fields=intent.Fields.ToHashSet(StringComparer.Ordinal);
        if(fields.Contains("full"))
        {
            fields.UnionWith(["company_name","symbol","status","status_code","last_state","last_change","reason","ceo","board_members","system_code","source_collected_at"]);
            fields.Remove("full");
        }
        if(fields.Count==0) fields.Add("status");
        var answerText=ComposeCompanyStateDetail(row,fields,intent.NamesOnly);
        var source=$"Companystate:{row.SystemCode}";
        var facts=new List<CanonicalReferenceFact>
        {
            new("symbol",Display(row.Symbol),source),
            new("company_name",Display(row.CompanyName),source),
            new("state",Display(row.StatusDescription),source),
            new("status_code",row.StatusCode?.ToString(CultureInfo.InvariantCulture)??"",source),
            new("last_state",row.LastState?.ToString(CultureInfo.InvariantCulture)??"",source),
            new("last_change_jalali",row.LastDateChange??"",source),
            new("reason",CleanCompanyStateText(row.Reason),source),
            new("ceo",Display(row.Ceo),source),
            new("board_members",string.Join("، ",SplitCompanyStateLines(row.BoardMembers)),source),
            new("system_code",row.SystemCode??"",source),
            new("source_collected_at",row.SourceCollectedAt?.ToString("O",CultureInfo.InvariantCulture)??"",source,AsOffset(row.SourceCollectedAt))
        };
        var subject=Display(row.Symbol);
        return CanonicalReferenceAnswer.Exact(answerText,"company_state",$"وضعیت نماد {subject}",facts,subjectName:subject,confidence:1);
    }

    private async Task<IReadOnlyList<CompanyStateRow>> ReferencedCompanyStates(SqlConnection connection,string question,CancellationToken ct)
    {
        var rows=await CompanyStateCatalog(connection,ct);
        var q=CanonicalCompanyStateQuestion.Normalize(question);
        var compact=CanonicalCompanyStateQuestion.MatchKey(q);
        var matches=rows.Where(row=>
        {
            var code=(row.SystemCode??string.Empty).Trim();
            if(code.Length>0&&q.Contains(code,StringComparison.OrdinalIgnoreCase)) return true;
            var symbol=CanonicalCompanyStateQuestion.Normalize(row.Symbol);
            if(symbol.Length>0&&Regex.IsMatch(q,$@"(?<![\p{{L}}\p{{Nd}}]){Regex.Escape(symbol)}(?![\p{{L}}\p{{Nd}}])")) return true;
            var companyKey=CanonicalCompanyStateQuestion.MatchKey(row.CompanyName);
            return companyKey.Length>=5&&compact.Contains(companyKey,StringComparison.Ordinal);
        }).OrderByDescending(x=>CanonicalCompanyStateQuestion.MatchKey(x.CompanyName).Length).ToArray();
        return matches.GroupBy(x=>x.SystemCode,StringComparer.OrdinalIgnoreCase).Select(x=>x.First()).ToArray();
    }

    private static string ComposeCompanyStateDetail(CompanyStateRow row,IReadOnlySet<string> fields,bool namesOnly)
    {
        var symbol=Display(row.Symbol);
        var company=Display(row.CompanyName);
        if(fields.SetEquals(["board_members"]))
        {
            var members=SplitCompanyStateLines(row.BoardMembers);
            return members.Count==0
                ? $"اعضای هیئت‌مدیره برای نماد {symbol} در Companystate ثبت نشده‌اند."
                : namesOnly?string.Join("، ",members):$"اعضای هیئت‌مدیره ثبت‌شده {symbol}: {string.Join("، ",members)}";
        }
        if(fields.SetEquals(["reason"]))
        {
            var reasons=SplitCompanyStateLines(row.Reason);
            if(reasons.Count==0) return $"دلیلی برای وضعیت نماد {symbol} در Companystate ثبت نشده است.";
            return reasons.Count==1?$"دلیل وضعیت {symbol}: {reasons[0]}":$"دلایل وضعیت {symbol}:\n"+string.Join("\n",reasons.Select((x,i)=>$"{i+1}. {x}"));
        }

        var parts=new List<string>();
        if(fields.Contains("company_name")) parts.Add($"نام شرکت {company} است");
        if(fields.Contains("symbol")) parts.Add($"نماد {symbol} است");
        if(fields.Contains("status")) parts.Add($"وضعیت «{Display(row.StatusDescription)}» است");
        if(fields.Contains("status_code")) parts.Add(row.StatusCode is null?"StatusCode ثبت نشده است":$"StatusCode برابر {row.StatusCode:0} است");
        if(fields.Contains("last_state")) parts.Add(row.LastState is null?"Laststate ثبت نشده است":$"Laststate برابر {row.LastState} است");
        if(fields.Contains("last_change")) parts.Add(string.IsNullOrWhiteSpace(row.LastDateChange)?"تاریخ تغییر وضعیت ثبت نشده است":$"آخرین تاریخ تغییر وضعیت {row.LastDateChange.Trim()} است");
        if(fields.Contains("reason"))
        {
            var reasons=SplitCompanyStateLines(row.Reason);
            parts.Add(reasons.Count==0?"دلیل ثبت نشده است":$"دلیل: {string.Join("؛ ",reasons)}");
        }
        if(fields.Contains("ceo")) parts.Add(string.IsNullOrWhiteSpace(row.Ceo)?"مدیرعامل ثبت نشده است":$"مدیرعامل ثبت‌شده {Display(row.Ceo)} است");
        if(fields.Contains("board_members"))
        {
            var members=SplitCompanyStateLines(row.BoardMembers);
            parts.Add(members.Count==0?"اعضای هیئت‌مدیره ثبت نشده‌اند":$"اعضای هیئت‌مدیره: {string.Join("، ",members)}");
        }
        if(fields.Contains("system_code")) parts.Add($"کد نماد در سامانه {row.SystemCode?.Trim()} است");
        if(fields.Contains("source_collected_at")) parts.Add(row.SourceCollectedAt is null?"زمان جمع‌آوری ثبت نشده است":$"Snapshot در {PersianDisplayText.FormatPersianDate(row.SourceCollectedAt.Value,true)} جمع‌آوری شده است");
        return $"{symbol} — {company}: {string.Join("؛ ",parts)}.";
    }

    private async Task<string> CompanyStateStatistics(SqlConnection connection,CancellationToken ct)
    {
        var rows=await CompanyStateCatalog(connection,ct);
        var dates=rows.Select(x=>x.LastDateChange).Where(x=>!string.IsNullOrWhiteSpace(x)).ToArray();
        var collected=rows.Max(x=>x.SourceCollectedAt);
        return $"جدول Companystate دارای {rows.Count:N0} رکورد، {rows.Select(x=>x.Symbol).Where(x=>!string.IsNullOrWhiteSpace(x)).Distinct(StringComparer.Ordinal).Count():N0} نماد متمایز و {rows.Select(x=>x.SystemCode).Where(x=>!string.IsNullOrWhiteSpace(x)).Distinct(StringComparer.OrdinalIgnoreCase).Count():N0} کد سامانه متمایز است. بازه آخرین تغییر وضعیت از {dates.Min()} تا {dates.Max()} شمسی است و Snapshot در {PersianDisplayText.FormatPersianDate(collected!.Value,true)} جمع‌آوری شده است.";
    }

    private async Task<string> CompanyStateDistribution(SqlConnection connection,string question,CancellationToken ct)
    {
        var rows=await CompanyStateCatalog(connection,ct);
        var suspended=rows.LongCount(x=>Display(x.StatusDescription)=="تعلیق شده");
        var pending=rows.LongCount(x=>Display(x.StatusDescription).Contains("مشمول",StringComparison.Ordinal));
        if(question.Contains("مشمول",StringComparison.Ordinal)) return $"در Snapshot فعلی Companystate، {pending:N0} نماد مشمول فرایند تعلیق‌اند.";
        if(question.Contains("تعلیق شده",StringComparison.Ordinal)||question.Contains("تعلیق‌شده",StringComparison.Ordinal)) return $"در Snapshot فعلی Companystate، {suspended:N0} نماد در وضعیت تعلیق‌شده‌اند.";
        return $"از {suspended+pending:N0} رکورد Companystate، {suspended:N0} نماد «تعلیق‌شده» و {pending:N0} نماد «مشمول فرایند تعلیق» هستند.";
    }

    private async Task<string> CompanyStateStatusList(SqlConnection connection,string question,int limit,CancellationToken ct)
    {
        var pending=question.Contains("مشمول",StringComparison.Ordinal);
        var status=pending?"مشمول فرایند تعلیق":"تعلیق شده";
        var all=(await CompanyStateCatalog(connection,ct)).Where(x=>Display(x.StatusDescription)==status).ToArray();
        var total=all.LongLength;
        var rows=all.Take(limit).ToArray();
        return $"{rows.Length:N0} نماد اول از {total:N0} نماد با وضعیت «{status}»:\n"+
            string.Join("\n",rows.Select((x,i)=>$"{i+1}. {Display(x.Symbol)} — {Display(x.CompanyName)}"));
    }

    private async Task<string> CompanyStateChangeRanking(SqlConnection connection,int limit,bool latest,CancellationToken ct)
    {
        var all=await CompanyStateCatalog(connection,ct);
        var ordered=latest?all.OrderByDescending(x=>x.LastDateChange):all.OrderBy(x=>x.LastDateChange);
        var rows=ordered.Take(limit).ToArray();
        return (latest?"جدیدترین تغییر وضعیت‌های ثبت‌شده":"قدیمی‌ترین تغییر وضعیت‌های ثبت‌شده")+":\n"+
            string.Join("\n",rows.Select((x,i)=>$"{i+1}. {Display(x.Symbol)} — {x.LastDateChange} — {Display(x.StatusDescription)}"));
    }

    private async Task<string> CompanyStateChangeYear(SqlConnection connection,int year,int limit,bool namesOnly,CancellationToken ct)
    {
        var prefix=$"{year}/";
        var all=(await CompanyStateCatalog(connection,ct)).Where(x=>x.LastDateChange?.StartsWith(prefix,StringComparison.Ordinal)==true).ToArray();
        var total=all.LongLength;
        var rows=all.OrderByDescending(x=>x.LastDateChange).Take(limit).ToArray();
        if(namesOnly) return string.Join("، ",rows.Select(x=>Display(x.Symbol)));
        return $"در Snapshot فعلی، آخرین تغییر وضعیت {total:N0} نماد مربوط به سال {year} است"+
            (rows.Length==0?".":":\n"+string.Join("\n",rows.Select((x,i)=>$"{i+1}. {Display(x.Symbol)} — {x.LastDateChange} — {Display(x.StatusDescription)}")));
    }

    private static async Task<string> CompanyStateReasonAnalysis(SqlConnection connection,string question,CancellationToken ct)
    {
        const string sql="""
            SELECT
              SUM(CASE WHEN Dalil LIKE N'%بررسی وضعیت شفافیت اطلاعاتی ناشر%' THEN CONVERT(bigint,1) ELSE CONVERT(bigint,0) END) TransparencyReview,
              SUM(CASE WHEN Dalil LIKE N'%عدم ارائه گزارش فعالیت ماهانه%' THEN CONVERT(bigint,1) ELSE CONVERT(bigint,0) END) MissingMonthly,
              SUM(CASE WHEN Dalil LIKE N'%عدم ارائه صورت%مالی%' THEN CONVERT(bigint,1) ELSE CONVERT(bigint,0) END) MissingFinancials,
              SUM(CASE WHEN Dalil LIKE N'%گزارش تفسیری مدیریت%' THEN CONVERT(bigint,1) ELSE CONVERT(bigint,0) END) MissingManagementInterpretation,
              SUM(CASE WHEN Dalil LIKE N'%کنترل داخلی%' THEN CONVERT(bigint,1) ELSE CONVERT(bigint,0) END) InternalControl
            FROM dbo.Companystate;
            """;
        var x=await connection.QuerySingleAsync<CompanyStateReasonStatsRow>(new CommandDefinition(sql,cancellationToken:ct,commandTimeout:10));
        if(question.Contains("شفافیت",StringComparison.Ordinal)) return $"در {x.TransparencyReview:N0} رکورد، «بررسی وضعیت شفافیت اطلاعاتی ناشر» جزو دلایل ثبت‌شده است.";
        if(question.Contains("فعالیت ماهانه",StringComparison.Ordinal)) return $"در {x.MissingMonthly:N0} رکورد، عدم ارائه گزارش فعالیت ماهانه جزو دلایل ثبت‌شده است.";
        if(question.Contains("صورت مالی",StringComparison.Ordinal)||question.Contains("صورتهای مالی",StringComparison.Ordinal)||question.Contains("صورت های مالی",StringComparison.Ordinal)) return $"در {x.MissingFinancials:N0} رکورد، عدم ارائه یکی از صورت‌های مالی جزو دلایل ثبت‌شده است.";
        if(question.Contains("تفسیری مدیریت",StringComparison.Ordinal)) return $"در {x.MissingManagementInterpretation:N0} رکورد، عدم ارائه گزارش تفسیری مدیریت جزو دلایل ثبت‌شده است.";
        if(question.Contains("کنترل داخلی",StringComparison.Ordinal)) return $"در {x.InternalControl:N0} رکورد، عدم ارائه گزارش کنترل داخلی جزو دلایل ثبت‌شده است.";
        return $"فراوانی چند دسته پرتکرار در ۵۸ رکورد Companystate: عدم ارائه صورت‌های مالی {x.MissingFinancials:N0} رکورد، گزارش تفسیری مدیریت {x.MissingManagementInterpretation:N0}، بررسی شفافیت ناشر {x.TransparencyReview:N0}، گزارش فعالیت ماهانه {x.MissingMonthly:N0} و گزارش کنترل داخلی {x.InternalControl:N0} رکورد. یک رکورد ممکن است در چند دسته شمرده شود.";
    }

    private static async Task<string> CompanyStateDataQuality(SqlConnection connection,string question,CancellationToken ct)
    {
        const string sql="""
            SELECT COUNT_BIG(*) TotalRows,
              SUM(CASE WHEN NULLIF(LTRIM(RTRIM(Namad)),N'') IS NULL THEN CONVERT(bigint,1) ELSE CONVERT(bigint,0) END) MissingSymbol,
              SUM(CASE WHEN NULLIF(LTRIM(RTRIM(companyName)),N'') IS NULL THEN CONVERT(bigint,1) ELSE CONVERT(bigint,0) END) MissingCompany,
              SUM(CASE WHEN NULLIF(LTRIM(RTRIM(Lastdatechange)),N'') IS NULL THEN CONVERT(bigint,1) ELSE CONVERT(bigint,0) END) MissingDate,
              SUM(CASE WHEN NULLIF(LTRIM(RTRIM(Dalil)),N'') IS NULL THEN CONVERT(bigint,1) ELSE CONVERT(bigint,0) END) MissingReason,
              SUM(CASE WHEN NULLIF(LTRIM(RTRIM(CEO)),N'') IS NULL THEN CONVERT(bigint,1) ELSE CONVERT(bigint,0) END) MissingCeo,
              SUM(CASE WHEN NULLIF(LTRIM(RTRIM(BOARDMEMBER)),N'') IS NULL THEN CONVERT(bigint,1) ELSE CONVERT(bigint,0) END) MissingBoard
            FROM dbo.Companystate;
            SELECT COUNT_BIG(*) FROM (SELECT Namad FROM dbo.Companystate GROUP BY Namad HAVING COUNT_BIG(*)>1)x;
            SELECT COUNT_BIG(*) FROM (SELECT Kodnamaddarsamane FROM dbo.Companystate GROUP BY Kodnamaddarsamane HAVING COUNT_BIG(*)>1)x;
            SELECT COUNT_BIG(*) FROM dbo.Companystate cs WHERE EXISTS(SELECT 1 FROM dbo.Instrument i WHERE i.InstrumentID=cs.Kodnamaddarsamane);
            """;
        using var grid=await connection.QueryMultipleAsync(new CommandDefinition(sql,cancellationToken:ct,commandTimeout:20));
        var x=await grid.ReadSingleAsync<CompanyStateQualityRow>();
        var duplicateSymbols=await grid.ReadSingleAsync<long>();
        var duplicateCodes=await grid.ReadSingleAsync<long>();
        var matchedInstrumentIds=await grid.ReadSingleAsync<long>();
        if(question.Contains("مدیرعامل",StringComparison.Ordinal)||question.Contains("ceo",StringComparison.Ordinal))
            return $"از {x.TotalRows:N0} رکورد Companystate، {x.TotalRows-x.MissingCeo:N0} رکورد مدیرعامل دارند و {x.MissingCeo:N0} رکورد فاقد مدیرعامل‌اند.";
        if(question.Contains("هیئت مدیره",StringComparison.Ordinal)||question.Contains("هیئت‌مدیره",StringComparison.Ordinal)||question.Contains("board",StringComparison.Ordinal))
            return $"از {x.TotalRows:N0} رکورد Companystate، {x.TotalRows-x.MissingBoard:N0} رکورد اعضای هیئت‌مدیره دارند و {x.MissingBoard:N0} رکورد فاقد آن‌اند.";
        if(question.Contains("instrument",StringComparison.Ordinal)||question.Contains("یتیم",StringComparison.Ordinal)||question.Contains("قابل اتصال",StringComparison.Ordinal))
            return $"کد سامانه ۵۵ رکورد از ۵۸ رکورد با Instrument.InstrumentID تطبیق مستقیم دارد؛ ۳ رکورد فعلی تطبیق ندارند. این ارتباط منطقی است و Foreign Key فیزیکی تعریف نشده است.";
        if(question.Contains("تکراری",StringComparison.Ordinal))
            return $"در Companystate تعداد گروه نماد تکراری {duplicateSymbols:N0} و تعداد گروه کد سامانه تکراری {duplicateCodes:N0} است.";
        return $"کیفیت Companystate: از {x.TotalRows:N0} رکورد، نماد، نام شرکت، تاریخ تغییر و دلیلِ خالی هرکدام {x.MissingSymbol:N0}، {x.MissingCompany:N0}، {x.MissingDate:N0} و {x.MissingReason:N0} رکورد است؛ {x.MissingCeo:N0} مدیرعامل و {x.MissingBoard:N0} هیئت‌مدیره خالی‌اند. گروه نماد و کد تکراری به‌ترتیب {duplicateSymbols:N0} و {duplicateCodes:N0} است.";
    }

    private static string CompanyStateSchemaAnswer(string q)
    {
        if(q.Contains("kodnamaddarsamane",StringComparison.Ordinal)||q.Contains("کد سامانه",StringComparison.Ordinal)||q.Contains("instrument",StringComparison.Ordinal)||q.Contains("رابطه",StringComparison.Ordinal))
            return "Companystate.Kodnamaddarsamane شناسه متنی نماد در سامانه منبع است و در داده فعلی برای ۵۵ رکورد از ۵۸ رکورد با Instrument.InstrumentID تطبیق دارد؛ Foreign Key فیزیکی تعریف نشده و ۳ رکورد تطبیق مستقیم ندارند.";
        if(q.Contains("statuscode",StringComparison.Ordinal)||q.Contains("کد وضعیت",StringComparison.Ordinal))
            return "در Snapshot فعلی Companystate، StatusCode=2 با «تعلیق‌شده» و StatusCode=3 با «مشمول فرایند تعلیق» همراه است. این نگاشت از داده موجود استنباط شده، نه از Constraint پایگاه‌داده.";
        if(q.Contains("laststate",StringComparison.Ordinal)||q.Contains("آخرین وضعیت",StringComparison.Ordinal))
            return "در Snapshot فعلی، Laststate=3 برای رکوردهای تعلیق‌شده و Laststate=4 برای رکوردهای مشمول فرایند تعلیق ثبت شده است؛ این ستون int است و Constraint مرجع برای معنای کدها وجود ندارد.";
        if(q.Contains("lastdatechange",StringComparison.Ordinal)||q.Contains("تاریخ تغییر",StringComparison.Ordinal))
            return "Companystate.Lastdatechange از نوع nvarchar(10) و به‌صورت تاریخ شمسی yyyy/MM/dd ذخیره شده است؛ DateTime میلادی نیست و برای مرتب‌سازی معتبر باید همین قالب ثابت حفظ شود.";
        if(q.Contains("sourcecollectedat",StringComparison.Ordinal)||q.Contains("جمع",StringComparison.Ordinal))
            return "Companystate.SourceCollectedAt زمان جمع‌آوری Snapshot از منبع است؛ در SQL از نوع datetime ذخیره می‌شود اما در پاسخ کاربر همیشه شمسی نمایش داده می‌شود. این فیلد تاریخ تغییر وضعیت ناشر نیست.";
        if(q.Contains("ایندکس",StringComparison.Ordinal)||q.Contains("index",StringComparison.Ordinal)||q.Contains("کلید اصلی",StringComparison.Ordinal)||q.Contains("primary key",StringComparison.Ordinal))
            return "روی جدول فعلی Companystate هیچ Primary Key، Index یا Foreign Key تعریف نشده است؛ Namad و Kodnamaddarsamane در ۵۸ رکورد فعلی متمایزند، اما یکتایی آن‌ها در Schema تضمین نشده است.";
        if(ContainsAny(q,"قیمت","حجم","ارزش معاملات","اطلاعات مالی"))
            return "Companystate قیمت، حجم یا ارزش معاملات ندارد؛ این جدول فقط Snapshot وضعیت تعلیق، علت، تاریخ تغییر، مدیرعامل، اعضای هیئت‌مدیره و شناسه‌های ناشر را نگهداری می‌کند.";
        if(q.Contains("تاریخچه",StringComparison.Ordinal))
            return "dbo.Companystate فعلی یک Snapshot جاری است و تاریخچه تغییرات را در خود جدول نگهداری نمی‌کند؛ برای سابقه باید نسخه‌ها در لایه تاریخچه جداگانه ثبت شوند.";
        return "Companystate یک Snapshot جاری از وضعیت‌های مرتبط با تعلیق ناشران است: نماد و نام شرکت، شرح و کد وضعیت، تاریخ شمسی تغییر، دلایل، مدیرعامل، اعضای هیئت‌مدیره، کد سامانه و زمان جمع‌آوری.";
    }

    private async Task<CanonicalReferenceAnswer?> CompareCompanyStateChanges(SqlConnection connection,string question,CancellationToken ct)
    {
        var rows=await ReferencedCompanyStates(connection,question,ct);
        if(rows.Count!=2||rows.Any(x=>string.IsNullOrWhiteSpace(x.LastDateChange))) return null;
        var left=rows[0];var right=rows[1];
        var comparison=string.CompareOrdinal(left.LastDateChange,right.LastDateChange);
        var relation=comparison>0?$"تغییر وضعیت {Display(left.Symbol)} جدیدتر است":comparison<0?$"تغییر وضعیت {Display(right.Symbol)} جدیدتر است":"تاریخ تغییر وضعیت هر دو نماد برابر است";
        var answer=$"آخرین تغییر وضعیت {Display(left.Symbol)} در {left.LastDateChange} و {Display(right.Symbol)} در {right.LastDateChange} ثبت شده است؛ {relation}.";
        return CanonicalReferenceAnswer.Exact(answer,"company_state_comparison","مقایسه تاریخ تغییر وضعیت ناشران",
            [new("left_last_change",left.LastDateChange!,$"Companystate:{left.SystemCode}"),new("right_last_change",right.LastDateChange!,$"Companystate:{right.SystemCode}")],
            subjectName:Display(left.Symbol),relatedSubjects:[Display(right.Symbol)]);
    }

    private async Task<IReadOnlyList<CompanyStateRow>> CompanyStateCatalog(SqlConnection connection,CancellationToken ct)
        => await GetCatalog("canonical:company-state-catalog",async()=>
        {
            const string sql="""
                SELECT Kodnamaddarsamane SystemCode,Nam RawName,Namad Symbol,companyName CompanyName,
                       Vaziyatdesc StatusDescription,StatusCode,Lastdatechange LastDateChange,
                       Laststate LastState,SourceCollectedAt
                FROM dbo.Companystate
                ORDER BY Namad;
                """;
            return (IReadOnlyList<CompanyStateRow>)(await connection.QueryAsync<CompanyStateRow>(new CommandDefinition(sql,cancellationToken:ct,commandTimeout:5))).AsList();
        },ct,TimeSpan.FromMinutes(5));

    private async Task<CompanyStateRow?> CompanyStateDetail(SqlConnection connection,string? systemCode,CancellationToken ct)
    {
        if(string.IsNullOrWhiteSpace(systemCode)) return null;
        var safeKey=Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(systemCode)))[..16];
        var rows=await GetCatalog($"canonical:company-state-detail:{safeKey}",async()=>
        {
            const string sql="""
                SELECT Kodnamaddarsamane SystemCode,Nam RawName,Namad Symbol,companyName CompanyName,
                       Vaziyatdesc StatusDescription,StatusCode,Lastdatechange LastDateChange,
                       RTRIM(Dalil) Reason,Laststate LastState,CEO Ceo,RTRIM(BOARDMEMBER) BoardMembers,
                       SourceCollectedAt
                FROM dbo.Companystate
                WHERE Kodnamaddarsamane=@SystemCode;
                """;
            return (IReadOnlyList<CompanyStateRow>)(await connection.QueryAsync<CompanyStateRow>(new CommandDefinition(sql,new{SystemCode=systemCode},cancellationToken:ct,commandTimeout:5))).AsList();
        },ct,TimeSpan.FromMinutes(5));
        return rows.SingleOrDefault();
    }

    private static IReadOnlyList<string> SplitCompanyStateLines(string? value)
    {
        if(string.IsNullOrWhiteSpace(value)) return [];
        var decoded=WebUtility.HtmlDecode(value).Replace("\r","\n",StringComparison.Ordinal);
        decoded=Regex.Replace(decoded,@"(?i)<br\s*/?>","\n");
        decoded=Regex.Replace(decoded,@"(?i)</?(?:p|div|li|ul|ol)[^>]*>","\n");
        decoded=Regex.Replace(decoded,@"<[^>]+>"," ");
        return decoded.Split('\n',StringSplitOptions.RemoveEmptyEntries|StringSplitOptions.TrimEntries)
            .Select(Display).Where(x=>x.Length>0).Distinct(StringComparer.Ordinal).ToArray();
    }

    private static string CleanCompanyStateText(string? value)=>string.Join("؛ ",SplitCompanyStateLines(value));

    private async Task<CanonicalReferenceAnswer?> AnswerCompanyQuestion(
        SqlConnection connection,string question,string normalizedQuestion,CanonicalCompanyQuestionIntent intent,
        TemporalResolution temporal,CancellationToken ct)
    {
        switch(intent.Aggregate)
        {
            case CompanyAggregateKind.Statistics:
                return Wrap(await CompanyStatistics(connection,ct),"company_aggregate","آمار جدول Company");
            case CompanyAggregateKind.DataQuality:
                return Wrap(await CompanyDataQuality(connection,normalizedQuestion,ct),"company_quality","کیفیت جدول Company");
            case CompanyAggregateKind.WebsiteCoverage:
                return Wrap(await CompanyWebsiteCoverage(connection,ct),"company_aggregate","پوشش وب‌سایت شرکت‌ها");
            case CompanyAggregateKind.HallDistribution:
                return Wrap(await CompanyHallDistribution(connection,intent.Limit,ct),"company_aggregate","توزیع شرکت‌ها بر اساس تالار");
            case CompanyAggregateKind.HallCompanies:
                return await CompanyHallCompanies(connection,normalizedQuestion,intent,ct);
            case CompanyAggregateKind.LatestIpo:
                return await CompanyIpoRanking(connection,intent.Limit,latest:true,
                    intent.Fields.Contains("symbol",StringComparer.Ordinal),intent.Fields.Contains("ceo",StringComparer.Ordinal),
                    intent.Fields.Contains("hall",StringComparer.Ordinal),ct);
            case CompanyAggregateKind.EarliestIpo:
                return await CompanyIpoRanking(connection,intent.Limit,latest:false,
                    intent.Fields.Contains("symbol",StringComparer.Ordinal),intent.Fields.Contains("ceo",StringComparer.Ordinal),
                    intent.Fields.Contains("hall",StringComparer.Ordinal),ct);
            case CompanyAggregateKind.IpoYear when intent.JalaliYear is not null:
                return Wrap(await CompanyIpoYear(connection,intent.JalaliYear.Value,intent.Limit,intent.NamesOnly,ct),"company_aggregate",$"عرضه‌های اولیه سال {intent.JalaliYear}");
            case CompanyAggregateKind.Schema:
                return Wrap(CompanySchemaAnswer(normalizedQuestion),"company_schema","تعریف ستون‌های Company");
            case CompanyAggregateKind.Comparison:
                return await CompareCompanyIpo(connection,intent,ct);
        }

        if(intent.Lookups.Count==0) return null;
        var resolved=await ResolveCompany(connection,intent.Lookups[0],ct);
        if(resolved is null) return null;
        var fields=intent.Fields.ToHashSet(StringComparer.Ordinal);
        if(fields.Contains("full"))
        {
            fields.UnionWith(["title","symbol","hall","url","ceo","phone","ipo_date","source_collected_at","company_id","source_instrument_id"]);
            fields.Remove("full");
        }
        var answer=ComposeCompanyDetail(resolved,fields);
        var row=resolved.Company;
        var source=$"Company:{row.Id}";
        var facts=new List<CanonicalReferenceFact>
        {
            new("company_id",row.Id.ToString(),source),
            new("company_title",Display(row.Title),source),
            new("hall",Display(row.HallName),source),
            new("url",CleanOptional(row.Url)??"",source),
            new("ceo",CleanOptional(row.Ceo)??"",source),
            new("phone",CleanOptional(row.Tel)??"",source),
            new("ipo_date",row.IpoDate?.ToString("O",CultureInfo.InvariantCulture)??"",source,AsOffset(row.IpoDate)),
            new("source_instrument_id",row.SourceInstrumentId?.ToString()??"",source),
            new("source_collected_at",row.SourceCollectedAt?.ToString("O",CultureInfo.InvariantCulture)??"",source,AsOffset(row.SourceCollectedAt))
        };
        if(!string.IsNullOrWhiteSpace(resolved.Symbol)) facts.Add(new("linked_symbol",resolved.Symbol!,source));
        var subject=Display(row.Title);
        return CanonicalReferenceAnswer.Exact(answer,"company",$"اطلاعات شرکت {subject}",facts,subjectName:subject,
            confidence:resolved.Confidence,
            sourceTool:fields.Contains("ipo_date")?CanonicalReferenceToolNames.CompanyIpo:null);
    }

    private async Task<ResolvedCompany?> ResolveCompany(SqlConnection connection,string lookup,CancellationToken ct)
    {
        var rows=await CompanyCatalog(connection,ct);
        if(Guid.TryParse(lookup,out var guid))
        {
            var byId=rows.Where(x=>x.Id==guid||x.SourceInstrumentId==guid).OrderByDescending(x=>x.SourceCollectedAt).FirstOrDefault();
            if(byId is not null) return new(byId,await SymbolForCompany(connection,byId,ct),1);
        }

        var key=CanonicalCompanyQuestion.MatchKey(lookup);
        if(key.Length>=3)
        {
            var exact=rows.Where(x=>CanonicalCompanyQuestion.MatchKey(x.Title)==key).ToArray();
            if(exact.Length>0)
            {
                var selected=exact.OrderByDescending(x=>x.SourceCollectedAt).ThenByDescending(x=>x.Id).First();
                return new(selected,await SymbolForCompany(connection,selected,ct),exact.Length==1?1:0.98);
            }
        }

        var instrument=await entityResolver.ResolveAsync(lookup,new EntityResolveOptions([EntityKind.Instrument],8,0.70,0.02),ct);
        if(instrument.Status==EntityResolutionStatus.Resolved&&instrument.Selected?.InstrumentId is not null)
        {
            var instrumentRow=await InstrumentById(connection,instrument.Selected.InstrumentId,ct);
            var issuerKeys=new[] { instrumentRow?.LSoc30,instrumentRow?.SymbolName,instrument.Selected.DisplayName }
                .Select(CanonicalCompanyQuestion.MatchKey).Where(x=>x.Length>=3).Distinct(StringComparer.Ordinal).ToArray();
            var matches=rows.Where(x=>issuerKeys.Contains(CanonicalCompanyQuestion.MatchKey(x.Title),StringComparer.Ordinal)).ToArray();
            if(matches.Length>0)
            {
                var selected=matches.OrderByDescending(x=>x.SourceCollectedAt).ThenByDescending(x=>x.Id).First();
                return new(selected,instrument.Selected.Symbol??instrumentRow?.Symbol,0.99);
            }
            var parenthetical=rows.Where(x=>
            {
                var alias=Regex.Match(x.Title??"",@"\((?<alias>[^)]{2,80})\)").Groups["alias"].Value;
                return alias.Length>0&&issuerKeys.Contains(CanonicalCompanyQuestion.MatchKey(alias),StringComparer.Ordinal);
            }).ToArray();
            if(parenthetical.Length==1)
                return new(parenthetical[0],instrument.Selected.Symbol??instrumentRow?.Symbol,0.97);
        }

        if(key.Length<4) return null;
        var fuzzyGroups=rows.Where(x=>
            {
                var candidate=CanonicalCompanyQuestion.MatchKey(x.Title);
                return candidate.Length>=4&&(candidate.Contains(key,StringComparison.Ordinal)||key.Contains(candidate,StringComparison.Ordinal));
            })
            .GroupBy(x=>CanonicalCompanyQuestion.MatchKey(x.Title),StringComparer.Ordinal)
            .OrderBy(x=>Math.Abs(x.Key.Length-key.Length)).ToArray();
        if(fuzzyGroups.Length!=1) return null;
        var fuzzy=fuzzyGroups[0].OrderByDescending(x=>x.SourceCollectedAt).ThenByDescending(x=>x.Id).First();
        return new(fuzzy,await SymbolForCompany(connection,fuzzy,ct),0.9);
    }

    private async Task<string?> SymbolForCompany(SqlConnection connection,CompanyRow company,CancellationToken ct)
    {
        if(string.IsNullOrWhiteSpace(company.Title)) return null;
        var cacheKey=$"sql-ai:company-symbol:v2:{company.Id:N}:{company.SourceCollectedAt?.Ticks.ToString(CultureInfo.InvariantCulture)??"0"}";
        if(cache.TryGetValue(cacheKey,out string? cached)&&cached is not null) return cached.Length==0?null:cached;
        var distributed=await ReadDistributedCache<string>(cacheKey,ct);
        if(distributed is not null)
        {
            cache.Set(cacheKey,distributed,TimeSpan.FromHours(1));
            return distributed.Length==0?null:distributed;
        }
        await CompanySymbolLock.WaitAsync(ct);
        try
        {
            if(cache.TryGetValue(cacheKey,out cached)&&cached is not null) return cached.Length==0?null:cached;
            distributed=await ReadDistributedCache<string>(cacheKey,ct);
            if(distributed is not null)
            {
                cache.Set(cacheKey,distributed,TimeSpan.FromHours(1));
                return distributed.Length==0?null:distributed;
            }
            var resolved=await ResolveCompanySymbol(connection,company,ct)??string.Empty;
            var symbolTtl=TimeSpan.FromHours(1);
            cache.Set(cacheKey,resolved,symbolTtl);
            await WriteDistributedCache(cacheKey,resolved,ct,symbolTtl);
            return resolved.Length==0?null:resolved;
        }
        finally { CompanySymbolLock.Release(); }
    }

    private async Task<string?> ResolveCompanySymbol(SqlConnection connection,CompanyRow company,CancellationToken ct)
    {
        var companyKey=CanonicalCompanyQuestion.MatchKey(company.Title);
        var cashSymbol=(await CashCompanySymbolCatalog(connection,ct))
            .Where(x=>CanonicalCompanyQuestion.MatchKey(x.CompanyName)==companyKey)
            .Select(x=>x.Symbol)
            .FirstOrDefault(x=>!string.IsNullOrWhiteSpace(x));
        if(!string.IsNullOrWhiteSpace(cashSymbol)) return Display(cashSymbol);
        const string sql="""
            SELECT TOP (1) LVal18AFC
            FROM dbo.Instrument WITH (READUNCOMMITTED)
            WHERE Valid=1 AND LSoc30=@Title AND LVal30=LSoc30
              AND InstrumentID LIKE N'IRO1%'
              AND NULLIF(LTRIM(RTRIM(LVal18AFC)),N'') IS NOT NULL
            ORDER BY LEN(LVal18AFC),LVal18AFC,
                     Id DESC
            OPTION (MAXDOP 1);
            """;
        var direct=await connection.QuerySingleOrDefaultAsync<string>(new CommandDefinition(
            sql,new{company.Title},cancellationToken:ct,commandTimeout:8));
        if(!string.IsNullOrWhiteSpace(direct)) return Display(direct);
        var resolution=await entityResolver.ResolveAsync(company.Title!,new EntityResolveOptions([EntityKind.Instrument],8,0.72,0.02),ct);
        return resolution.Status==EntityResolutionStatus.Resolved?resolution.Selected?.Symbol:null;
    }

    private async Task<IReadOnlyList<CompanySymbolRow>> CashCompanySymbolCatalog(SqlConnection connection,CancellationToken ct)
        =>await GetCatalog("canonical:cash-company-symbols:v1",async() =>
        {
            const string sql="""
                SELECT Instrumentname Symbol,Companynamepersian CompanyName
                FROM dbo.Cashmarket WITH (READUNCOMMITTED)
                WHERE NULLIF(LTRIM(RTRIM(Instrumentname)),N'') IS NOT NULL
                  AND NULLIF(LTRIM(RTRIM(Companynamepersian)),N'') IS NOT NULL
                OPTION (MAXDOP 1);
                """;
            return (IReadOnlyList<CompanySymbolRow>)(await connection.QueryAsync<CompanySymbolRow>(new CommandDefinition(
                sql,cancellationToken:ct,commandTimeout:8))).AsList();
        },ct,TimeSpan.FromHours(1));

    private static string ComposeCompanyDetail(ResolvedCompany resolved,IReadOnlySet<string> fields)
    {
        var row=resolved.Company;
        var name=Display(row.Title);
        var label=string.IsNullOrWhiteSpace(resolved.Symbol)?name:$"{name} (نماد {resolved.Symbol})";
        var parts=new List<string>();
        if(fields.Contains("title")) parts.Add($"نام ثبت‌شده شرکت «{name}» است");
        if(fields.Contains("symbol")) parts.Add(string.IsNullOrWhiteSpace(resolved.Symbol)?"نماد بورسی از ارتباط قابل اتکای فعلی پیدا نشد":$"نماد بورسی {resolved.Symbol} است");
        if(fields.Contains("hall")) parts.Add(string.IsNullOrWhiteSpace(row.HallName)?"تالار منطقه‌ای ثبت نشده":$"در Company به تالار {Display(row.HallName)} منتسب است");
        if(fields.Contains("url")) parts.Add(CleanOptional(row.Url) is { } url&&url!="-"?$"وب‌سایت ثبت‌شده {url} است":"وب‌سایتی در Company ثبت نشده است");
        if(fields.Contains("ceo")) parts.Add(CleanOptional(row.Ceo) is { } ceo?$"مدیرعامل ثبت‌شده {Display(ceo)} است":"نام مدیرعامل در اطلاعات فعلی شرکت‌ها ثبت نشده است");
        if(fields.Contains("phone")) parts.Add(CleanOptional(row.Tel) is { } phone?$"تلفن ثبت‌شده {phone} است":"شماره تماسی در Company ثبت نشده است");
        if(fields.Contains("ipo_date")) parts.Add(row.IpoDate is null?"تاریخ عرضه اولیه ثبت نشده است":$"تاریخ عرضه اولیه ثبت‌شده {PersianDisplayText.FormatPersianDate(row.IpoDate.Value)} است");
        if(fields.Contains("source_collected_at")) parts.Add(row.SourceCollectedAt is null?"زمان جمع‌آوری نامشخص است":$"داده در {PersianDisplayText.FormatPersianDate(row.SourceCollectedAt.Value,true)} جمع‌آوری شده است");
        if(fields.Contains("company_id")) parts.Add($"شناسه رکورد Company برابر {row.Id} است");
        if(fields.Contains("source_instrument_id")) parts.Add(row.SourceInstrumentId is null?"شناسه منبع Instrument ثبت نشده است":$"شناسه منبع Instrument در Company برابر {row.SourceInstrumentId} است");
        if(parts.Count==0) return $"رکورد شرکت «{label}» در جدول Company پیدا شد.";
        return $"{label}: {string.Join("؛ ",parts)}";
    }

    private static async Task<string> CompanyStatistics(SqlConnection connection,CancellationToken ct)
    {
        const string sql="""
            SELECT COUNT_BIG(*) TotalRows,
                   COUNT(DISTINCT NULLIF(LTRIM(RTRIM(Title)),N'')) DistinctTitles,
                   COUNT(DISTINCT InstrumentId) DistinctInstrumentIds,
                   COUNT(DISTINCT Talar_Id) DistinctTalars,
                   MIN(Ipo_Date) EarliestIpo,MAX(Ipo_Date) LatestIpo,
                   MAX(SourceCollectedAt) SourceCollectedAt
            FROM dbo.Company;
            """;
        var x=await connection.QuerySingleAsync<CompanyStatsRow>(new CommandDefinition(sql,cancellationToken:ct,commandTimeout:20));
        return $"جدول Company دارای {x.TotalRows:N0} رکورد، {x.DistinctTitles:N0} عنوان غیرخالی متمایز، {x.DistinctInstrumentIds:N0} شناسه منبع Instrument و {x.DistinctTalars:N0} تالار متمایز است. بازه تاریخ عرضه اولیه ثبت‌شده از {PersianDisplayText.FormatPersianDate(x.EarliestIpo!.Value)} تا {PersianDisplayText.FormatPersianDate(x.LatestIpo!.Value)} است؛ آخرین جمع‌آوری داده {PersianDisplayText.FormatPersianDate(x.SourceCollectedAt!.Value,true)} بوده است.";
    }

    private static async Task<string> CompanyDataQuality(SqlConnection connection,string question,CancellationToken ct)
    {
        if(question.Contains("یتیم",StringComparison.Ordinal)||question.Contains("بدون تالار",StringComparison.Ordinal))
        {
            // The source database has no supporting index for this join. Reading the two
            // tiny identifier sets and comparing them in memory avoids an 11+ second hash
            // join when the ingestion instance is under CPU pressure.
            var companyHallIds=(await connection.QueryAsync<Guid?>(new CommandDefinition(
                "SELECT Talar_Id FROM dbo.Company WITH (READUNCOMMITTED);",
                cancellationToken:ct,commandTimeout:8))).ToArray();
            var hallIds=(await connection.QueryAsync<Guid>(new CommandDefinition(
                "SELECT Id FROM dbo.Talar WITH (READUNCOMMITTED);",
                cancellationToken:ct,commandTimeout:8))).ToHashSet();
            var orphanCount=companyHallIds.LongCount(x=>x is null||!hallIds.Contains(x.Value));
            return $"تعداد Talar_Id یتیم {orphanCount:N0} است.";
        }
        if(question.Contains("مدیرعامل",StringComparison.Ordinal)||question.Contains("ceo",StringComparison.Ordinal))
        {
            const string ceoSql="""
                SELECT COUNT_BIG(*) TotalRows,
                    SUM(CASE WHEN NULLIF(LTRIM(RTRIM(Ceo)),N'') IS NULL THEN CONVERT(bigint,1) ELSE CONVERT(bigint,0) END) MissingCeo
                FROM dbo.Company WITH (READUNCOMMITTED)
                OPTION (MAXDOP 1);
                """;
            var ceo=await connection.QuerySingleAsync<CompanyQualityRow>(new CommandDefinition(ceoSql,cancellationToken:ct,commandTimeout:10));
            return $"اطلاعات مدیرعامل در هر {ceo.TotalRows:N0} رکورد فعلی شرکت‌ها خالی است؛ بنابراین مدیرعامل هیچ شرکت از این اطلاعات قابل تأیید نیست.";
        }
        const string sql="""
            SELECT COUNT_BIG(*) TotalRows,
              SUM(CASE WHEN NULLIF(LTRIM(RTRIM(Title)),N'') IS NULL THEN CONVERT(bigint,1) ELSE CONVERT(bigint,0) END) MissingTitle,
              SUM(CASE WHEN NULLIF(LTRIM(RTRIM(Url)),N'') IS NULL OR LTRIM(RTRIM(Url))=N'-' THEN CONVERT(bigint,1) ELSE CONVERT(bigint,0) END) MissingUrl,
              SUM(CASE WHEN NULLIF(LTRIM(RTRIM(Ceo)),N'') IS NULL THEN CONVERT(bigint,1) ELSE CONVERT(bigint,0) END) MissingCeo,
              SUM(CASE WHEN NULLIF(LTRIM(RTRIM(Tel)),N'') IS NULL THEN CONVERT(bigint,1) ELSE CONVERT(bigint,0) END) MissingTel,
              SUM(CASE WHEN t.Id IS NULL THEN CONVERT(bigint,1) ELSE CONVERT(bigint,0) END) OrphanTalar
            FROM dbo.Company c LEFT JOIN dbo.Talar t ON t.Id=c.Talar_Id;
            SELECT COUNT_BIG(*) FROM (SELECT InstrumentId FROM dbo.Company GROUP BY InstrumentId HAVING COUNT_BIG(*)>1)x;
            SELECT COUNT_BIG(*) FROM (SELECT LTRIM(RTRIM(Title)) Title FROM dbo.Company WHERE NULLIF(LTRIM(RTRIM(Title)),N'') IS NOT NULL GROUP BY LTRIM(RTRIM(Title)) HAVING COUNT_BIG(*)>1)x;
            """;
        using var grid=await connection.QueryMultipleAsync(new CommandDefinition(sql,cancellationToken:ct,commandTimeout:20));
        var x=await grid.ReadSingleAsync<CompanyQualityRow>();
        var duplicateInstrumentGroups=await grid.ReadSingleAsync<long>();
        var duplicateTitleGroups=await grid.ReadSingleAsync<long>();
        return $"کیفیت Company: از {x.TotalRows:N0} رکورد، {x.MissingTitle:N0} عنوان خالی، {x.MissingUrl:N0} وب‌سایت خالی/نامعتبر، {x.MissingCeo:N0} مدیرعامل خالی و {x.MissingTel:N0} تلفن خالی است. {duplicateInstrumentGroups:N0} گروه InstrumentId و {duplicateTitleGroups:N0} گروه عنوان تکراری وجود دارد؛ تعداد Talar_Id یتیم {x.OrphanTalar:N0} است.";
    }

    private static async Task<string> CompanyWebsiteCoverage(SqlConnection connection,CancellationToken ct)
    {
        const string sql="""
            SELECT COUNT_BIG(*) TotalRows,
              SUM(CASE WHEN NULLIF(LTRIM(RTRIM(Url)),N'') IS NOT NULL AND LTRIM(RTRIM(Url))<>N'-' THEN CONVERT(bigint,1) ELSE CONVERT(bigint,0) END) HasWebsite,
              SUM(CASE WHEN NULLIF(LTRIM(RTRIM(Url)),N'') IS NULL OR LTRIM(RTRIM(Url))=N'-' THEN CONVERT(bigint,1) ELSE CONVERT(bigint,0) END) MissingWebsite
            FROM dbo.Company;
            """;
        var x=await connection.QuerySingleAsync<CompanyWebsiteRow>(new CommandDefinition(sql,cancellationToken:ct,commandTimeout:20));
        return $"از {x.TotalRows:N0} رکورد Company، {x.HasWebsite:N0} رکورد وب‌سایت قابل استفاده دارند و {x.MissingWebsite:N0} رکورد فاقد وب‌سایت معتبرند.";
    }

    private static async Task<string> CompanyHallDistribution(SqlConnection connection,int limit,CancellationToken ct)
    {
        const string sql="""
            SELECT TOP (@Limit) t.Talar_Name HallName,COUNT_BIG(*) CompanyCount
            FROM dbo.Company c JOIN dbo.Talar t ON t.Id=c.Talar_Id
            GROUP BY t.Talar_Name ORDER BY CompanyCount DESC,t.Talar_Name;
            """;
        var rows=(await connection.QueryAsync<CompanyHallCountRow>(new CommandDefinition(sql,new{Limit=limit},cancellationToken:ct,commandTimeout:20))).ToArray();
        return "تالارهای دارای بیشترین رکورد Company:\n"+string.Join("\n",rows.Select((x,i)=>$"{i+1}. {Display(x.HallName)}: {x.CompanyCount:N0} شرکت"));
    }

    private async Task<CanonicalReferenceAnswer?> CompanyHallCompanies(SqlConnection connection,string question,CanonicalCompanyQuestionIntent intent,CancellationToken ct)
    {
        var hall=await ResolveRegionalHall(connection,question,ct);
        if(hall is null) return null;
        const string countSql="SELECT COUNT_BIG(*) FROM dbo.Company WHERE Talar_Id=@Id;";
        var total=await connection.ExecuteScalarAsync<long>(new CommandDefinition(countSql,new{hall.Id},cancellationToken:ct,commandTimeout:20));
        const string listSql="""
            SELECT TOP (@Limit) c.Id,c.Title,t.Talar_Name HallName,c.Url,c.Ceo,c.Tel,c.Ipo_Date IpoDate,
                   c.InstrumentId SourceInstrumentId,c.SourceCollectedAt
            FROM dbo.Company c JOIN dbo.Talar t ON t.Id=c.Talar_Id
            WHERE c.Talar_Id=@Id AND NULLIF(LTRIM(RTRIM(c.Title)),N'') IS NOT NULL
            ORDER BY c.Title,c.Id;
            """;
        var rows=(await connection.QueryAsync<CompanyRow>(new CommandDefinition(listSql,new{hall.Id,Limit=intent.Limit},cancellationToken:ct,commandTimeout:20))).ToArray();
        var names=rows.Select(x=>Display(x.Title)).Where(x=>x.Length>0).ToArray();
        var countOnly=ContainsAny(question,"چند شرکت","چندتا شرکت","چنتا شرکت","تعداد شرکت","شمارش شرکت");
        string answer;
        if(countOnly)
            answer=$"در جدول Company، {total:N0} شرکت به تالار {Display(hall.HallName)} منتسب‌اند.";
        else if(total==0)
            answer=$"در جدول Company هیچ شرکتی به تالار {Display(hall.HallName)} منتسب نشده است.";
        else if(rows.Length>=total)
            answer=$"شرکت‌های منتسب به تالار {Display(hall.HallName)} ({total:N0} شرکت):\n"+
                string.Join("\n",names.Select((x,i)=>$"{i+1}. {x}"));
        else
            answer=$"{rows.Length:N0} شرکت اول از {total:N0} شرکت منتسب به تالار {Display(hall.HallName)}:\n"+
                string.Join("\n",names.Select((x,i)=>$"{i+1}. {x}"))+
                $"\n… {total-rows.Length:N0} شرکت دیگر نمایش داده نشد؛ تعداد موردنظر یا نام دقیق‌تر را بنویسید.";
        var source=$"Talar:{hall.Id}";
        var facts=new List<CanonicalReferenceFact>{new("company_count",total.ToString(CultureInfo.InvariantCulture),source)};
        facts.AddRange(rows.Select((row,index)=>new CanonicalReferenceFact(
            $"company:{index+1}:title",Display(row.Title),$"Company:{row.Id}")));
        return CanonicalReferenceAnswer.Exact(answer,"company_hall",$"شرکت‌های تالار {Display(hall.HallName)}",facts,
            subjectName:Display(hall.HallName),relatedSubjects:names,sourceTool:CanonicalReferenceToolNames.CompanyLookup);
    }

    private async Task<CanonicalReferenceAnswer> CompanyIpoRanking(
        SqlConnection connection,int limit,bool latest,bool includeSymbol,bool includeCeo,bool includeHall,CancellationToken ct)
    {
        var direction=latest?"DESC":"ASC";
        var sql=$"""
            SELECT TOP (@Limit) c.Id,c.Title,c.Ceo,c.Ipo_Date IpoDate,t.Talar_Name HallName
            FROM dbo.Company c LEFT JOIN dbo.Talar t ON t.Id=c.Talar_Id
            WHERE NULLIF(LTRIM(RTRIM(c.Title)),N'') IS NOT NULL AND c.Ipo_Date IS NOT NULL
            ORDER BY c.Ipo_Date {direction},c.Id;
            """;
        var rows=(await connection.QueryAsync<CompanyRow>(new CommandDefinition(sql,new{Limit=limit},cancellationToken:ct,commandTimeout:20))).ToArray();
        var topic=latest?"جدیدترین عرضه‌های اولیه Company":"قدیمی‌ترین عرضه‌های اولیه Company";
        if(rows.Length==0)
            return CanonicalReferenceAnswer.Exact("در داده‌های فعلی تاریخ عرضه اولیه‌ای ثبت نشده است.","company_aggregate",topic,
                sourceTool:CanonicalReferenceToolNames.CompanyIpo);
        var symbols=new Dictionary<Guid,string?>();
        if(includeSymbol)
            foreach(var row in rows)
                symbols[row.Id]=await SymbolForCompany(connection,row,ct);
        string answer;
        if(limit==1)
        {
            var row=rows[0];
            var prefix=latest?"آخرین":"اولین";
            answer=$"{prefix} عرضه اولیه ثبت‌شده مربوط به {Display(row.Title)} در تاریخ {PersianDisplayText.FormatPersianDate(row.IpoDate!.Value)} است."
                +(includeSymbol
                    ? string.IsNullOrWhiteSpace(symbols.GetValueOrDefault(row.Id))
                        ? " نماد بورسی آن از ارتباط قابل اتکای فعلی پیدا نشد."
                        : $" نماد بورسی آن {symbols[row.Id]} است."
                    : string.Empty)
                +(includeCeo
                    ? string.IsNullOrWhiteSpace(CleanOptional(row.Ceo))
                        ? " نام مدیرعامل در داده‌های فعلی ثبت نشده است."
                        : $" مدیرعامل ثبت‌شده آن {Display(row.Ceo)} است."
                    : string.Empty)
                +(includeHall
                    ? string.IsNullOrWhiteSpace(CleanOptional(row.HallName))
                        ? " تالار منطقه‌ای آن در داده‌های فعلی ثبت نشده است."
                        : $" تالار منطقه‌ای ثبت‌شده آن {Display(row.HallName)} است."
                    : string.Empty);
        }
        else
        {
            var title=latest?"جدیدترین تاریخ‌های عرضه اولیه ثبت‌شده در Company":"قدیمی‌ترین تاریخ‌های عرضه اولیه ثبت‌شده در Company";
            answer=title+":\n"+string.Join("\n",rows.Select((x,i)=>
                $"{i+1}. {Display(x.Title)} — {PersianDisplayText.FormatPersianDate(x.IpoDate!.Value)}"
                +(includeSymbol&&!string.IsNullOrWhiteSpace(symbols.GetValueOrDefault(x.Id))?$" — نماد {symbols[x.Id]}":string.Empty)
                +(includeCeo&&!string.IsNullOrWhiteSpace(CleanOptional(x.Ceo))?$" — مدیرعامل {Display(x.Ceo)}":string.Empty)
                +(includeHall&&!string.IsNullOrWhiteSpace(CleanOptional(x.HallName))?$" — تالار {Display(x.HallName)}":string.Empty)));
        }
        var facts=rows.SelectMany(x=>
        {
            var source=$"Company:{x.Id}";
            var rowFacts=new List<CanonicalReferenceFact>
            {
                new("company_title",Display(x.Title),source),
                new("ipo_date",x.IpoDate!.Value.ToString("O",CultureInfo.InvariantCulture),source,AsOffset(x.IpoDate))
            };
            if(includeSymbol&&!string.IsNullOrWhiteSpace(symbols.GetValueOrDefault(x.Id)))
                rowFacts.Add(new("linked_symbol",symbols[x.Id]!,source));
            if(includeCeo)
                rowFacts.Add(new("ceo",CleanOptional(x.Ceo)??"",source));
            if(includeHall)
                rowFacts.Add(new("hall",CleanOptional(x.HallName)??"",source));
            return rowFacts;
        }).ToArray();
        return CanonicalReferenceAnswer.Exact(answer,"company_aggregate",topic,facts,
            subjectName:Display(rows[0].Title),relatedSubjects:rows.Skip(1).Select(x=>Display(x.Title)).ToArray(),
            sourceTool:CanonicalReferenceToolNames.CompanyIpo);
    }

    private static async Task<string> CompanyIpoYear(SqlConnection connection,int jalaliYear,int limit,bool namesOnly,CancellationToken ct)
    {
        var calendar=new PersianCalendar();
        var start=calendar.ToDateTime(jalaliYear,1,1,0,0,0,0);
        var end=calendar.ToDateTime(jalaliYear+1,1,1,0,0,0,0);
        const string countSql="SELECT COUNT_BIG(*) FROM dbo.Company WHERE Ipo_Date>=@Start AND Ipo_Date<@End;";
        var total=await connection.ExecuteScalarAsync<long>(new CommandDefinition(countSql,new{Start=start,End=end},cancellationToken:ct,commandTimeout:20));
        const string listSql="SELECT TOP (@Limit) Id,Title,Ipo_Date IpoDate FROM dbo.Company WHERE Ipo_Date>=@Start AND Ipo_Date<@End AND NULLIF(LTRIM(RTRIM(Title)),N'') IS NOT NULL ORDER BY Ipo_Date DESC,Id;";
        var rows=(await connection.QueryAsync<CompanyRow>(new CommandDefinition(listSql,new{Start=start,End=end,Limit=limit},cancellationToken:ct,commandTimeout:20))).ToArray();
        if(namesOnly) return string.Join("، ",rows.Select(x=>Display(x.Title)));
        return $"در سال {jalaliYear}، {total:N0} رکورد عرضه اولیه در Company ثبت شده است"+
            (rows.Length==0?".":":\n"+string.Join("\n",rows.Select((x,i)=>$"{i+1}. {Display(x.Title)} — {PersianDisplayText.FormatPersianDate(x.IpoDate!.Value)}")));
    }

    private static string CompanySchemaAnswer(string q)
    {
        if(q.Contains("instrumentid",StringComparison.Ordinal)||q.Contains("instrument id",StringComparison.Ordinal))
            return "Company.InstrumentId یک شناسه GUID منبع است؛ در Schema فعلی Foreign Key مستقیمی به dbo.Instrument ندارد و با Instrument.InstrumentID از نوع nvarchar نیز هم‌نوع نیست. اتصال نماد به شرکت باید با نام ناشر و تطبیق کنترل‌شده انجام شود، نه Join مستقیم این دو ستون.";
        if(q.Contains("talar",StringComparison.Ordinal)||q.Contains("تالار",StringComparison.Ordinal))
            return "Company.Talar_Id از نوع uniqueidentifier است و به‌صورت منطقی با Talar.Id تطبیق داده می‌شود؛ هر 403 رکورد فعلی دارای تالار قابل تطبیق‌اند، هرچند Foreign Key فیزیکی در Schema تعریف نشده است.";
        if(q.Contains("ipo",StringComparison.Ordinal)||q.Contains("عرضه",StringComparison.Ordinal))
            return "Company.Ipo_Date تاریخ عرضه اولیه ثبت‌شده شرکت است؛ برای نمایش کاربر به تقویم شمسی تبدیل می‌شود.";
        if(q.Contains("sourcecollectedat",StringComparison.Ordinal)||q.Contains("جمع",StringComparison.Ordinal))
            return "Company.SourceCollectedAt زمان جمع‌آوری و ثبت Snapshot منبع در SQL است و تاریخ عرضه اولیه شرکت نیست.";
        if(ContainsAny(q,"قیمت","حجم","معاملات","اطلاعات مالی","صورت مالی"))
            return "جدول Company قیمت، حجم و ارزش معاملات یا صورت مالی ندارد؛ این جدول فقط اطلاعات مرجع هویتی، تماس، تالار، تاریخ عرضه اولیه و زمان جمع‌آوری شرکت را نگهداری می‌کند.";
        return "Company یک Snapshot مرجع شامل نام شرکت، تالار منطقه‌ای، وب‌سایت، مدیرعامل خام، تلفن، تاریخ عرضه اولیه، شناسه منبع Instrument و زمان جمع‌آوری است.";
    }

    private async Task<CanonicalReferenceAnswer?> CompareCompanyIpo(SqlConnection connection,CanonicalCompanyQuestionIntent intent,CancellationToken ct)
    {
        if(intent.Lookups.Count<2) return null;
        var left=await ResolveCompany(connection,intent.Lookups[0],ct);
        var right=await ResolveCompany(connection,intent.Lookups[1],ct);
        if(left?.Company.IpoDate is null||right?.Company.IpoDate is null) return null;
        var l=left.Company;var r=right.Company;
        var relation=l.IpoDate<r.IpoDate?$"{Display(l.Title)} زودتر عرضه شده است":l.IpoDate>r.IpoDate?$"{Display(r.Title)} زودتر عرضه شده است":"تاریخ ثبت‌شده هر دو شرکت برابر است";
        var answer=$"تاریخ عرضه اولیه ثبت‌شده {Display(l.Title)}، {PersianDisplayText.FormatPersianDate(l.IpoDate.Value)} و {Display(r.Title)}، {PersianDisplayText.FormatPersianDate(r.IpoDate.Value)} است؛ {relation}.";
        return CanonicalReferenceAnswer.Exact(answer,"company_comparison","مقایسه تاریخ عرضه اولیه شرکت‌ها",
            [new("left_ipo",l.IpoDate.Value.ToString("O"),$"Company:{l.Id}",AsOffset(l.IpoDate)),new("right_ipo",r.IpoDate.Value.ToString("O"),$"Company:{r.Id}",AsOffset(r.IpoDate))],
            subjectName:Display(l.Title),relatedSubjects:[Display(r.Title)]);
    }

    private async Task<IReadOnlyList<CompanyRow>> CompanyCatalog(SqlConnection connection,CancellationToken ct)
        => await GetCatalog("canonical:company-catalog",async()=>
        {
            const string sql="""
                SELECT c.Id,c.Title,t.Talar_Name HallName,c.Url,c.Ceo,c.Tel,c.Ipo_Date IpoDate,
                       c.InstrumentId SourceInstrumentId,c.SourceCollectedAt
                FROM dbo.Company c LEFT JOIN dbo.Talar t ON t.Id=c.Talar_Id;
                """;
            return (IReadOnlyList<CompanyRow>)(await connection.QueryAsync<CompanyRow>(new CommandDefinition(sql,cancellationToken:ct,commandTimeout:20))).AsList();
        },ct,TimeSpan.FromHours(1));

    private async Task<IReadOnlyList<CompanyHallRow>> HallCatalog(SqlConnection connection,CancellationToken ct)
        // v2 includes SourceCollectedAt.  Keep the schema version in the key;
        // otherwise Redis can deserialize the older payload successfully but
        // silently leave the new field null after a rolling deployment.
        => await GetCatalog("canonical:company-halls:v2",async()=>
        {
            const string sql="SELECT Id,Talar_Name HallName,Talar_Code HallCode,SourceCollectedAt FROM dbo.Talar;";
            return (IReadOnlyList<CompanyHallRow>)(await connection.QueryAsync<CompanyHallRow>(new CommandDefinition(sql,cancellationToken:ct,commandTimeout:20))).AsList();
        },ct);

    private async Task<CompanyHallRow?> ResolveRegionalHall(SqlConnection connection,string question,CancellationToken ct)
    {
        var questionKey=CanonicalCompanyQuestion.MatchKey(question);
        if(questionKey.Length<2) return null;
        var matches=new List<(CompanyHallRow Hall,int Length)>();
        foreach(var hall in await HallCatalog(connection,ct))
        {
            var full=CanonicalCompanyQuestion.MatchKey(hall.HallName);
            var baseName=CanonicalCompanyQuestion.MatchKey(Regex.Replace(hall.HallName??string.Empty,@"\s*\([^)]*\)\s*"," "));
            var city=CanonicalCompanyQuestion.MatchKey(Regex.Match(hall.HallName??string.Empty,@"\((?<city>[^)]*)\)").Groups["city"].Value);
            var aliases=new List<string>{full,baseName,city};
            if(RegionalHallAliases.TryGetValue(baseName,out var configured)) aliases.AddRange(configured);
            foreach(var alias in aliases.Where(x=>x.Length>=2).Distinct(StringComparer.Ordinal))
                if(questionKey.Contains(alias,StringComparison.Ordinal)) matches.Add((hall,alias.Length));
        }
        return matches.OrderByDescending(x=>x.Length).Select(x=>x.Hall).FirstOrDefault();
    }

    private async Task<CanonicalReferenceAnswer?> RegionalHallDetails(SqlConnection connection,string question,CancellationToken ct)
    {
        var hall=await ResolveRegionalHall(connection,question,ct);
        if(hall is null) return null;
        var hallName=Display(hall.HallName);
        var asksAddress=ContainsAny(question,"آدرس","نشانی","نشونی","کجاست","کجا قرار","محل قرار");
        var asksPhone=ContainsAny(question,"تلفن تالار","شماره تماس تالار");
        var asksHierarchy=ContainsAny(question,"کدام معاونت","کدوم معاونت","چه معاونتی","بالادست");
        var asksTimestamp=ContainsAny(question,"آخرین بروزرسانی","آخرین به روزرسانی","زمان جمع آوری","زمان جمع‌آوری");
        var answer=asksAddress
            ? $"نام این تالار در داده‌های فعلی «{hallName}» است، اما آدرس فیزیکی آن ثبت نشده است."
            : asksPhone
                ? $"شماره تماس تالار منطقه‌ای «{hallName}» در داده‌های فعلی موجود نیست."
                : asksHierarchy
                    ? $"واحد بالادست تالار منطقه‌ای «{hallName}» در داده‌های فعلی ثبت نشده است."
                    : asksTimestamp&&hall.SourceCollectedAt is not null
                        ? $"آخرین بروزرسانی اطلاعات تالار منطقه‌ای «{hallName}»، {PersianDisplayText.FormatPersianDate(hall.SourceCollectedAt.Value,true)} بوده است."
                        : $"تالار منطقه‌ای «{hallName}» با کد {hall.HallCode} ثبت شده است.";
        var facts=new List<CanonicalReferenceFact>
        {
            new("hall_name",hallName,$"Talar:{hall.Id}"),
            new("hall_code",hall.HallCode.ToString(CultureInfo.InvariantCulture),$"Talar:{hall.Id}")
        };
        if(hall.SourceCollectedAt is not null)
            facts.Add(new("source_collected_at",hall.SourceCollectedAt.Value.ToString("O",CultureInfo.InvariantCulture),$"Talar:{hall.Id}",AsOffset(hall.SourceCollectedAt)));
        return CanonicalReferenceAnswer.Exact(answer,"hall",$"تالار منطقه‌ای {hallName}",
            facts,
            subjectName:hallName,sourceTool:CanonicalReferenceToolNames.RegionHall);
    }

    private async Task<CanonicalReferenceAnswer> RegionalHallAddressCatalog(SqlConnection connection,CancellationToken ct)
    {
        var halls=await HallCatalog(connection,ct);
        var answer="در داده‌های فعلی، آدرس فیزیکی هیچ‌یک از تالارهای منطقه‌ای ثبت نشده است؛ فقط نام و کد تالارها موجود است.";
        return CanonicalReferenceAnswer.Exact(answer,"hall_address_catalog","پوشش آدرس فیزیکی تالارهای منطقه‌ای",
            [
                new("hall_count",halls.Count.ToString(CultureInfo.InvariantCulture),"Talar"),
                new("physical_address_count","0","Talar")
            ],subjectName:"تالارهای منطقه‌ای",sourceTool:CanonicalReferenceToolNames.RegionHall);
    }

    private static string Display(string? value)=>PersianDisplayText.Normalize(value);
    private static string? CleanOptional(string? value)=>string.IsNullOrWhiteSpace(value)?null:value.Trim();

    private async Task<CanonicalReferenceAnswer?> CurrentPersonReferenceByName(
        SqlConnection connection,string question,(bool WantsHistory,bool WantsRepresentation) facets,CancellationToken ct)
    {
        var rows=await PersonRoleCatalog(connection,ct);
        var normalizedQuestion=Compact(question);
        var match=rows.Where(x=>CanonicalOrganizationHierarchyAnswer.ContainsPersian(x.FullName))
            .Where(x=>normalizedQuestion.Contains(Compact(x.FullName),StringComparison.Ordinal))
            .OrderByDescending(x=>Compact(x.FullName).Length)
            .ThenByDescending(x=>x.ContentId)
            .FirstOrDefault();
        if(match is null) return null;
        var name=PersianDisplayText.Normalize(match.FullName);
        var role=PersianDisplayText.Normalize(match.Role);
        var missing=new List<string>();
        if(facets.WantsHistory) missing.Add("person_history");
        if(facets.WantsRepresentation) missing.Add("representing_company");
        var answer=$"{name}، {role}{(role.Contains("بورس تهران",StringComparison.Ordinal)?"":" بورس تهران")} است.";
        return new(answer,new("organization_person",role,name,role,[]),
            [new("person_name",name,$"TsePerson:{match.ContentId}"),new("person_role",role,$"TsePerson:{match.ContentId}")],
            false,missing,[name],0.94);
    }

    private async Task<CanonicalReferenceAnswer?> CurrentOrganizationSubordinates(
        SqlConnection connection,string question,CancellationToken ct)
    {
        var masters=(await PersonRoleCatalog(connection,ct)).Where(x=>x.IsMaster).ToArray();
        var master=CanonicalPersonRoleMatcher.Match(question,masters);
        if(master?.TsePersonCateryId is null) return null;
        var rows=await SubordinateCatalog(connection,master.TsePersonCateryId.Value,ct);
        var current=rows.Where(x=>CanonicalOrganizationHierarchyAnswer.ContainsPersian(x.FullName))
            .GroupBy(x=>PersianDisplayText.Normalize(x.Role),StringComparer.Ordinal)
            .Select(group=>group.OrderByDescending(x=>x.EffectiveAt).ThenByDescending(x=>x.ContentId).First())
            .OrderBy(x=>x.Position).ToArray();
        var answer=CanonicalOrganizationHierarchyAnswer.Compose(question,master.Role,current);
        if(string.IsNullOrWhiteSpace(answer)) return null;
        var masterName=PersianDisplayText.Normalize(master.FullName);
        var masterRole=PersianDisplayText.Normalize(master.Role);
        var related=current.Select(x=>PersianDisplayText.Normalize(x.FullName)).Distinct(StringComparer.Ordinal).ToArray();
        var facts=current.SelectMany(row=>new[]
        {
            new CanonicalReferenceFact($"subordinate:{row.Position}:name",PersianDisplayText.Normalize(row.FullName),$"TsePerson:{row.ContentId}",AsOffset(row.EffectiveAt)),
            new CanonicalReferenceFact($"subordinate:{row.Position}:role",PersianDisplayText.Normalize(row.Role),$"TsePerson:{row.ContentId}",AsOffset(row.EffectiveAt))
        }).ToArray();
        return new(answer,new("organization_unit",masterRole,masterName,masterRole,related),facts,true,[],[],1);
    }

    private async Task<CanonicalReferenceAnswer?> CurrentOrganizationParent(
        SqlConnection connection,string question,CancellationToken ct)
    {
        var catalog=await PersonRoleCatalog(connection,ct);
        var children=catalog.Where(x=>!x.IsMaster && x.TsePersonCateryId is not null).ToArray();
        var child=CanonicalPersonRoleMatcher.MatchPersonName(question,children)
            ?? CanonicalPersonRoleMatcher.Match(question,children);
        if(child?.TsePersonCateryId is null) return null;

        var parent=catalog
            .Where(x=>x.IsMaster && x.TsePersonCateryId==child.TsePersonCateryId)
            .Where(x=>CanonicalOrganizationHierarchyAnswer.ContainsPersian(x.FullName))
            .OrderByDescending(x=>x.SourceCollectedAt)
            .ThenByDescending(x=>x.ContentId)
            .FirstOrDefault();
        if(parent is null) return null;

        var answer=CanonicalOrganizationHierarchyAnswer.ComposeParent(question,child,parent);
        var childName=PersianDisplayText.Normalize(child.FullName);
        var childRole=PersianDisplayText.Normalize(child.Role);
        var parentName=PersianDisplayText.Normalize(parent.FullName);
        var parentRole=PersianDisplayText.Normalize(parent.Role);
        return new(answer,new("organization_person",childRole,childName,childRole,[parentName,parentRole]),
            [
                new("person_name",childName,$"TsePerson:{child.ContentId}",AsOffset(child.SourceCollectedAt)),
                new("person_role",childRole,$"TsePerson:{child.ContentId}",AsOffset(child.SourceCollectedAt)),
                new("parent_name",parentName,$"TsePerson:{parent.ContentId}",AsOffset(parent.SourceCollectedAt)),
                new("parent_role",parentRole,$"TsePerson:{parent.ContentId}",AsOffset(parent.SourceCollectedAt)),
                new("organization_parent_category",child.TsePersonCateryId.Value.ToString(CultureInfo.InvariantCulture),$"TsePerson:{child.ContentId}",AsOffset(child.SourceCollectedAt))
            ],true,[],[],1);
    }

    private async Task<CanonicalReferenceAnswer?> CurrentBoardMembers(
        SqlConnection connection,
        CanonicalBoardQuestionIntent intent,
        CancellationToken ct)
    {
        var rows=await BoardCatalog(connection,ct);
        var answer=CanonicalBoardMemberAnswer.Compose(intent,rows);
        if(string.IsNullOrWhiteSpace(answer)) return null;
        var names=rows.Select(x=>PersianDisplayText.Normalize(x.FullName)).Where(x=>x.Length>0).Distinct(StringComparer.Ordinal).ToArray();
        var facts=rows.SelectMany(row=>new[]
        {
            new CanonicalReferenceFact($"board_member:{row.Position}:name",PersianDisplayText.Normalize(row.FullName),$"TsePerson:{row.ContentId}",AsOffset(row.EffectiveAt)),
            new CanonicalReferenceFact($"board_member:{row.Position}:role",PersianDisplayText.Normalize(row.Role),$"TsePerson:{row.ContentId}",AsOffset(row.EffectiveAt))
        }).ToArray();
        var missing=new List<string>();
        if(intent.WantsHistory) missing.Add("member_history");
        if(intent.WantsRepresentation) missing.Add("representing_company");
        var queries=intent.NeedsKnowledge
            ? names.ToArray()
            : [];
        return new(answer,new("organization_board","هیئت‌مدیره بورس تهران",null,null,names),facts,
            !intent.NeedsKnowledge,missing,queries,intent.NeedsKnowledge?0.92:1);
    }

    private async Task<CanonicalReferenceAnswer?> CurrentPersonRole(SqlConnection connection, string question, CancellationToken ct)
    {
        var rows=await PersonRoleCatalog(connection,ct);
        var match=CanonicalPersonRoleMatcher.Match(question,rows);
        if(match is null)
            return null;
        var name=PersianDisplayText.Normalize(match.FullName);
        var role=PersianDisplayText.Normalize(match.Role);
        var organization=role.Contains("بورس تهران",StringComparison.Ordinal)?"":" بورس تهران";
        var answer=$"{name}، {role}{organization} است.";
        var facets=CanonicalBoardMemberAnswer.AdditionalPersonFacets(question);
        var missing=new List<string>();
        if(facets.WantsHistory) missing.Add("person_history");
        if(facets.WantsRepresentation) missing.Add("representing_company");
        var query=missing.Count>0?name:null;
        return new(answer,new("organization_person",role,name,role,[]),
            [new("person_name",name,$"TsePerson:{match.ContentId}"),new("person_role",role,$"TsePerson:{match.ContentId}")],
            missing.Count==0,missing,query is null?[]:[query],missing.Count==0?1:0.94);
    }

    private async Task<IReadOnlyList<CanonicalPersonRoleCandidate>> PersonRoleCatalog(SqlConnection connection,CancellationToken ct)
        => await GetCatalog("canonical:person-role-catalog",async () =>
        {
            const string sql = """
            WITH current_roles AS
            (
                SELECT p.ContentId, p.TsePersonCateryId, p.IsMaster, p.Role, p.Fullname, p.SourceCollectedAt,
                       ROW_NUMBER() OVER
                       (
                           PARTITION BY COALESCE(p.TsePersonCateryId,-1), LTRIM(RTRIM(p.Role))
                           ORDER BY COALESCE(c.LastModifiedAt,c.PublishAt,c.CreatedAt,p.SourceCollectedAt) DESC,
                                    p.ContentId DESC
                       ) AS rn
                FROM dbo.TsePerson p
                LEFT JOIN dbo.Content c ON c.Id=p.ContentId
                WHERE NULLIF(LTRIM(RTRIM(p.Role)),N'') IS NOT NULL
                  AND (c.LanguageId=1 OR c.Id IS NULL)
            )
            SELECT ContentId, TsePersonCateryId, IsMaster, Role, Fullname, SourceCollectedAt
            FROM current_roles
            WHERE rn=1 AND NULLIF(LTRIM(RTRIM(Fullname)),N'') IS NOT NULL
            """;
            return (IReadOnlyList<CanonicalPersonRoleCandidate>)(await connection.QueryAsync<CanonicalPersonRoleCandidate>(
                new CommandDefinition(sql,cancellationToken:ct,commandTimeout:20))).AsList();
        },ct);

    private async Task<IReadOnlyList<CanonicalBoardMember>> BoardCatalog(SqlConnection connection,CancellationToken ct)
        => await GetCatalog("canonical:board-catalog",async () =>
        {
            const string sql="""
                WITH ranked_board_seats AS
                (
                    SELECT p.ContentId,p.[Row] AS Position,p.Fullname AS FullName,p.Role,
                           COALESCE(c.LastModifiedAt,c.PublishAt,c.CreatedAt,p.SourceCollectedAt) AS EffectiveAt,
                           ROW_NUMBER() OVER
                           (
                               PARTITION BY p.[Row]
                               ORDER BY COALESCE(c.LastModifiedAt,c.PublishAt,c.CreatedAt,p.SourceCollectedAt) DESC,p.ContentId DESC
                           ) AS rn
                    FROM dbo.TsePerson p LEFT JOIN dbo.Content c ON c.Id=p.ContentId
                    WHERE p.TsePersonCateryId IS NULL
                      AND (p.Role LIKE N'%هیئت مدیره%' OR p.Role LIKE N'%هیات مدیره%')
                      AND (c.LanguageId=1 OR c.Id IS NULL)
                )
                SELECT ContentId,FullName,Role,Position,EffectiveAt FROM ranked_board_seats
                WHERE rn=1 AND NULLIF(LTRIM(RTRIM(FullName)),N'') IS NOT NULL
                  AND LTRIM(RTRIM(FullName))<>LTRIM(RTRIM(Role)) ORDER BY Position
                """;
            return (IReadOnlyList<CanonicalBoardMember>)(await connection.QueryAsync<CanonicalBoardMember>(
                new CommandDefinition(sql,cancellationToken:ct,commandTimeout:20))).AsList();
        },ct);

    private async Task<IReadOnlyList<CanonicalBoardMember>> SubordinateCatalog(SqlConnection connection,int categoryId,CancellationToken ct)
        => await GetCatalog($"canonical:subordinates:{categoryId}",async () =>
        {
            const string sql="""
                SELECT p.ContentId,p.[Row] AS Position,p.Fullname AS FullName,p.Role,
                       COALESCE(c.LastModifiedAt,c.PublishAt,c.CreatedAt,p.SourceCollectedAt) AS EffectiveAt
                FROM dbo.TsePerson p LEFT JOIN dbo.Content c ON c.Id=p.ContentId
                WHERE p.TsePersonCateryId=@CategoryId AND p.IsMaster=0
                  AND NULLIF(LTRIM(RTRIM(p.Fullname)),N'') IS NOT NULL
                  AND NULLIF(LTRIM(RTRIM(p.Role)),N'') IS NOT NULL
                  AND (c.LanguageId=1 OR c.Id IS NULL)
                """;
            return (IReadOnlyList<CanonicalBoardMember>)(await connection.QueryAsync<CanonicalBoardMember>(
                new CommandDefinition(sql,new { CategoryId=categoryId },cancellationToken:ct,commandTimeout:20))).AsList();
        },ct);

    private async Task<IReadOnlyList<T>> GetCatalog<T>(string key,Func<Task<IReadOnlyList<T>>> loader,CancellationToken ct,TimeSpan? maxAge=null)
    {
        var freshness=maxAge??ReferenceCacheTtl;
        var connectionIdentity=Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(ConnectionString!)))[..16];
        var cacheKey=$"sql-ai:{key}:{connectionIdentity}";
        cache.TryGetValue(cacheKey,out CachedCatalog<T>? stale);
        if(stale is null)
        {
            try
            {
                var json=await distributedCache.GetStringAsync(cacheKey,ct);
                if(!string.IsNullOrWhiteSpace(json))
                {
                    stale=JsonSerializer.Deserialize<CachedCatalog<T>>(json);
                    if(stale is not null) cache.Set(cacheKey,stale,TimeSpan.FromHours(24));
                }
            }
            catch(Exception exception) when(exception is not OperationCanceledException)
            {
                logger.LogWarning(exception,"Distributed canonical catalog cache read failed for {CatalogKey}.",key);
            }
        }
        if(stale is not null && clock.UtcNow-stale.FetchedAt<freshness) return stale.Rows;
        await ReferenceCatalogLock.WaitAsync(ct);
        try
        {
            cache.TryGetValue(cacheKey,out stale);
            if(stale is not null && clock.UtcNow-stale.FetchedAt<freshness) return stale.Rows;
            try
            {
                var rows=await loader();
                var entry=new CachedCatalog<T>(rows,clock.UtcNow);
                cache.Set(cacheKey,entry,TimeSpan.FromHours(24));
                try
                {
                    await distributedCache.SetStringAsync(cacheKey,JsonSerializer.Serialize(entry),
                        new DistributedCacheEntryOptions { AbsoluteExpirationRelativeToNow=TimeSpan.FromHours(24) },ct);
                }
                catch(Exception exception) when(exception is not OperationCanceledException)
                {
                    logger.LogWarning(exception,"Distributed canonical catalog cache write failed for {CatalogKey}.",key);
                }
                return rows;
            }
            catch(SqlException exception) when(stale is not null)
            {
                logger.LogWarning(exception,"Canonical catalog refresh failed; serving stale cache for {CatalogKey}.",key);
                return stale.Rows;
            }
        }
        finally { ReferenceCatalogLock.Release(); }
    }

    private sealed record CachedCatalog<T>(IReadOnlyList<T> Rows,DateTimeOffset FetchedAt);

    private async Task<CanonicalReferenceAnswer?> AnswerClientTypeQuestion(
        SqlConnection connection,string question,string normalizedQuestion,CanonicalClientTypeQuestionIntent intent,CancellationToken ct)
    {
        if(intent.IsAggregate)
        {
            var aggregate=await ClientTypeAggregateAnswer(connection,normalizedQuestion,intent,ct);
            return Wrap(aggregate,"client_type_aggregate","آمار مرجع حقیقی و حقوقی");
        }

        if(ContainsAny(normalizedQuestion,"یعنی چه","چیست","چه مفهومی","معنی","ستون","فیلد")
            &&intent.Fields.Count>0)
            return Wrap(ComposeClientTypeDefinitions(intent.Fields),"client_type_schema","تعریف ستون‌های ClientType");

        var lookups=CanonicalClientTypeQuestion.ExtractLookupTexts(question,intent.IsComparison);
        if(lookups.Count==0)
        {
            if(normalizedQuestion.Contains("clienttype",StringComparison.Ordinal))
                return Wrap("جدول ClientType برای هر InsCode، تعداد و حجم خرید و فروش حقیقی و حقوقی را در Snapshot جاری نگهداری می‌کند؛ این جدول ارزش ریالی معامله و تاریخچه روزانه ندارد.","client_type_schema","تعریف جدول ClientType");
            return null;
        }

        var rows=new List<ClientTypeReferenceRow>();
        foreach(var lookup in lookups)
        {
            var resolution=await entityResolver.ResolveAsync(lookup,new EntityResolveOptions([EntityKind.Instrument],8,0.68,0.025),ct);
            if(resolution.Status==EntityResolutionStatus.Ambiguous)
                return Wrap(resolution.Clarification??"چند نماد با این عبارت منطبق است؛ نماد دقیق‌تری وارد کنید.","client_type","ابهام در نماد");
            if(resolution.Status!=EntityResolutionStatus.Resolved||resolution.Selected?.InstrumentId is null) continue;
            if(lookup.Contains(' '))
            {
                var exactKeys=new[]{resolution.Selected.Symbol,resolution.Selected.DisplayName}
                    .Where(x=>!string.IsNullOrWhiteSpace(x)).Select(x=>Compact(x!)).ToArray();
                if(!exactKeys.Contains(Compact(lookup),StringComparer.Ordinal)) continue;
            }
            var row=await ClientTypeByInstrument(connection,resolution.Selected.InstrumentId,ct);
            if(row is null) continue;
            rows.Add(row);
        }
        if(rows.Count==0)
            return Wrap($"نماد یا ابزار «{lookups[0]}» در اطلاعات حقیقی و حقوقی پیدا نشد؛ نماد دقیق‌تری وارد کنید.","client_type","نماد ناشناخته در اطلاعات حقیقی و حقوقی");
        if(rows.Any(x=>x.ClientTypeId is null))
        {
            var missing=rows.First(x=>x.ClientTypeId is null);
            return Wrap($"برای نماد {missing.Symbol} اطلاعات حقیقی و حقوقی ثبت نشده است.","client_type","نماد فاقد داده حقیقی و حقوقی",missing.Symbol);
        }

        var answer=intent.IsComparison&&rows.Count>1
            ? ComposeClientTypeComparison(rows,intent)
            : ComposeClientTypeAnswer(rows[0],intent,question);
        var facts=rows.SelectMany(row=>ClientTypeFacts(row)).ToArray();
        return CanonicalReferenceAnswer.Exact(answer,"client_type",$"اطلاعات حقیقی و حقوقی {string.Join(" و ",rows.Select(x=>x.Symbol))}",facts,
            subjectName:rows[0].Symbol,confidence:0.995);
    }

    private static async Task<ClientTypeReferenceRow?> ClientTypeByInstrument(SqlConnection connection,string instrumentId,CancellationToken ct)
    {
        const string sql="""
            SELECT TOP (1)
                i.InstrumentID,i.InsCode,i.LVal18AFC AS Symbol,i.LVal30 AS SymbolName,
                ct.Id AS ClientTypeId,ct.Buy_CountI AS BuyCountI,ct.Buy_CountN AS BuyCountN,
                ct.Buy_I_Volume AS BuyIVolume,ct.Buy_N_Volume AS BuyNVolume,
                ct.Sell_CountI AS SellCountI,ct.Sell_CountN AS SellCountN,
                ct.Sell_I_Volume AS SellIVolume,ct.Sell_N_Volume AS SellNVolume,
                ct.ClientType_counter AS ClientTypeCounter,ct.creationTime AS UpdatedAt,
                ct.SourceCollectedAt AS ClientTypeSourceCollectedAt,
                cash.Lastprice AS LastPrice,cash.Closingprice AS ClosingPrice,cash.Tradevolume AS TradeVolume,
                cash.Tradevalue AS TradeValue,cash.SourceCollectedAt AS CashMarketSourceCollectedAt
            FROM dbo.Instrument i
            OUTER APPLY
            (
                SELECT TOP (1) x.* FROM dbo.ClientType x
                WHERE x.InsCode=i.InsCode ORDER BY x.SourceCollectedAt DESC,x.Id DESC
            ) ct
            OUTER APPLY
            (
                SELECT TOP (1) c.Lastprice,c.Closingprice,c.Tradevolume,c.Tradevalue,c.SourceCollectedAt
                FROM dbo.Cashmarket c WHERE c.Instrumentid=i.InstrumentID
                ORDER BY c.SourceCollectedAt DESC
            ) cash
            WHERE i.InstrumentID=@InstrumentId
            ORDER BY i.Valid DESC,i.SourceCollectedAt DESC;
            """;
        return await connection.QuerySingleOrDefaultAsync<ClientTypeReferenceRow>(
            new CommandDefinition(sql,new{InstrumentId=instrumentId},cancellationToken:ct,commandTimeout:20));
    }

    private static string ComposeClientTypeAnswer(ClientTypeReferenceRow row,CanonicalClientTypeQuestionIntent intent,string question)
    {
        var fields=intent.Fields.ToHashSet(StringComparer.Ordinal);
        if(fields.Count==0||fields.Remove("full"))
            fields.UnionWith(["individual_buy_count","individual_buy_volume","legal_buy_count","legal_buy_volume",
                "individual_sell_count","individual_sell_volume","legal_sell_count","legal_sell_volume",
                "individual_net_volume","buyer_power","updated_at","source_collected_at"]);

        var parts=ClientTypeValues(row,fields);
        var marketFields=PersianMarketQuestionSemantics.DetectRequestedFields(question).ToHashSet(StringComparer.Ordinal);
        if(marketFields.Contains("last_price")) parts.Add(row.LastPrice is null?"آخرین قیمت در Cashmarket موجود نیست":$"آخرین قیمت {row.LastPrice:N0} ریال");
        if(marketFields.Contains("closing_price")) parts.Add(row.ClosingPrice is null?"قیمت پایانی در Cashmarket موجود نیست":$"قیمت پایانی {row.ClosingPrice:N0} ریال");
        if(marketFields.Contains("trade_volume")) parts.Add(row.TradeVolume is null?"حجم معاملات در Cashmarket موجود نیست":$"حجم معاملات {row.TradeVolume:N0} سهم");
        if(marketFields.Contains("trade_value")) parts.Add(row.TradeValue is null?"ارزش معاملات در Cashmarket موجود نیست":$"ارزش معاملات {row.TradeValue:N0} ریال");
        if(marketFields.Overlaps(["last_price","closing_price","trade_volume","trade_value"])&&row.CashMarketSourceCollectedAt.HasValue)
            parts.Add($"زمان داده Cashmarket {PersianDisplayText.FormatPersianDate(row.CashMarketSourceCollectedAt.Value,true)}");

        var crossTable=marketFields.Overlaps(["last_price","closing_price","trade_volume","trade_value"])
            &&row.CashMarketSourceCollectedAt.HasValue&&row.ClientTypeSourceCollectedAt.HasValue
            &&row.CashMarketSourceCollectedAt.Value!=row.ClientTypeSourceCollectedAt.Value;
        var suffix=crossTable?" توجه: زمان داده بازار و اطلاعات حقیقی و حقوقی یکسان نیست و اعداد هم‌زمان فرض نشده‌اند.":string.Empty;
        var body=string.Join("، ",parts);
        var ending=Regex.IsMatch(body,@"(?:است|نیست|نیستند|هستند|نمی‌شود|نمی شود)$")?".":" است.";
        return $"{row.Symbol}: {body}{ending}{suffix}";
    }

    private static string ComposeClientTypeComparison(IReadOnlyList<ClientTypeReferenceRow> rows,CanonicalClientTypeQuestionIntent intent)
    {
        var fields=intent.Fields.Where(x=>x!="full").ToHashSet(StringComparer.Ordinal);
        if(fields.Count==0)
        {
            fields.Add("individual_net_volume");
            fields.Add("buyer_power");
        }
        var lines=rows.Select(row=>$"- {row.Symbol}: {string.Join("، ",ClientTypeValues(row,fields))}");
        return "مقایسه بر اساس آخرین اطلاعات حقیقی و حقوقی ثبت‌شده:\n"+string.Join("\n",lines);
    }

    private static List<string> ClientTypeValues(ClientTypeReferenceRow row,HashSet<string> fields)
    {
        var parts=new List<string>();
        var buyI=row.BuyIVolume??0; var buyN=row.BuyNVolume??0; var sellI=row.SellIVolume??0; var sellN=row.SellNVolume??0;
        var buyTotal=buyI+buyN; var sellTotal=sellI+sellN;
        var buyPc=row.BuyCountI is >0?buyI/row.BuyCountI.Value:(decimal?)null;
        var sellPc=row.SellCountI is >0?sellI/row.SellCountI.Value:(decimal?)null;
        var power=buyPc.HasValue&&sellPc is >0?buyPc.Value/sellPc.Value:(decimal?)null;
        if(fields.Contains("individual_buy_count")) parts.Add($"تعداد خریداران حقیقی {row.BuyCountI:N0} کد معاملاتی");
        if(fields.Contains("legal_buy_count")) parts.Add($"تعداد خریداران حقوقی {row.BuyCountN:N0} کد معاملاتی");
        if(fields.Contains("individual_sell_count")) parts.Add($"تعداد فروشندگان حقیقی {row.SellCountI:N0} کد معاملاتی");
        if(fields.Contains("legal_sell_count")) parts.Add($"تعداد فروشندگان حقوقی {row.SellCountN:N0} کد معاملاتی");
        if(fields.Contains("individual_buy_volume")) parts.Add($"حجم خرید حقیقی {buyI:N0} سهم");
        if(fields.Contains("legal_buy_volume")) parts.Add($"حجم خرید حقوقی {buyN:N0} سهم");
        if(fields.Contains("individual_sell_volume")) parts.Add($"حجم فروش حقیقی {sellI:N0} سهم");
        if(fields.Contains("legal_sell_volume")) parts.Add($"حجم فروش حقوقی {sellN:N0} سهم");
        if(fields.Contains("total_buy_volume")) parts.Add($"مجموع حجم خرید {buyTotal:N0} سهم");
        if(fields.Contains("total_sell_volume")) parts.Add($"مجموع حجم فروش {sellTotal:N0} سهم");
        if(fields.Contains("individual_net_volume")) parts.Add($"خالص حجم حقیقی {SignedWhole(buyI-sellI)} سهم");
        if(fields.Contains("legal_net_volume")) parts.Add($"خالص حجم حقوقی {SignedWhole(buyN-sellN)} سهم");
        if(fields.Contains("individual_buy_per_capita")) parts.Add(buyPc.HasValue?$"سرانه خرید حقیقی {buyPc:N2} سهم":"سرانه خرید حقیقی به‌دلیل صفر بودن تعداد خریدار قابل محاسبه نیست");
        if(fields.Contains("individual_sell_per_capita")) parts.Add(sellPc.HasValue?$"سرانه فروش حقیقی {sellPc:N2} سهم":"سرانه فروش حقیقی به‌دلیل صفر بودن تعداد فروشنده قابل محاسبه نیست");
        if(fields.Contains("buyer_power")) parts.Add(power.HasValue?$"قدرت خریدار حقیقی {power:N4}":"قدرت خریدار به‌دلیل صفر بودن یکی از مخرج‌ها قابل محاسبه نیست");
        if(fields.Contains("buyer_power_signal")) parts.Add(power.HasValue?BuyerPowerDescription(power.Value):"وضعیت قدرت خریدار قابل تعیین نیست");
        if(fields.Contains("individual_buy_share")) parts.Add(buyTotal>0?$"سهم حقیقی از حجم خرید {buyI*100m/buyTotal:N2}٪":"سهم حقیقی از خرید قابل محاسبه نیست");
        if(fields.Contains("legal_buy_share")) parts.Add(buyTotal>0?$"سهم حقوقی از حجم خرید {buyN*100m/buyTotal:N2}٪":"سهم حقوقی از خرید قابل محاسبه نیست");
        if(fields.Contains("individual_sell_share")) parts.Add(sellTotal>0?$"سهم حقیقی از حجم فروش {sellI*100m/sellTotal:N2}٪":"سهم حقیقی از فروش قابل محاسبه نیست");
        if(fields.Contains("legal_sell_share")) parts.Add(sellTotal>0?$"سهم حقوقی از حجم فروش {sellN*100m/sellTotal:N2}٪":"سهم حقوقی از فروش قابل محاسبه نیست");
        if(fields.Contains("counter")) parts.Add($"شمارنده منبع ClientType برابر {row.ClientTypeCounter:N0} (این مقدار تعداد معامله نیست)");
        if(fields.Contains("updated_at")) parts.Add(row.UpdatedAt is null?"زمان Snapshot منبع نامشخص":$"زمان Snapshot منبع {PersianDisplayText.FormatPersianDate(row.UpdatedAt.Value,true)}");
        if(fields.Contains("source_collected_at")) parts.Add(row.ClientTypeSourceCollectedAt is null?"زمان دریافت در سامانه نامشخص":$"زمان دریافت در سامانه {PersianDisplayText.FormatPersianDate(row.ClientTypeSourceCollectedAt.Value,true)}");
        if(fields.Contains("money_value_unavailable"))
            parts.Add($"ارزش ریالی تفکیکی خرید و فروش حقیقی موجود نیست؛ خالص ورود پول ریالی قابل محاسبه نیست، اما خالص حجم حقیقی {SignedWhole(buyI-sellI)} سهم است");
        return parts;
    }

    private static string ComposeClientTypeDefinitions(IReadOnlyList<string> fields)
    {
        var definitions=new Dictionary<string,string>(StringComparer.Ordinal)
        {
            ["individual_buy_count"]="Buy_CountI تعداد کدهای خریدار حقیقی است، نه تعداد معاملات",
            ["legal_buy_count"]="Buy_CountN تعداد کدهای خریدار حقوقی است، نه تعداد معاملات",
            ["individual_sell_count"]="Sell_CountI تعداد کدهای فروشنده حقیقی است، نه تعداد معاملات",
            ["legal_sell_count"]="Sell_CountN تعداد کدهای فروشنده حقوقی است، نه تعداد معاملات",
            ["individual_buy_volume"]="Buy_I_Volume حجم خرید حقیقی بر حسب سهم/واحد است، نه ریال",
            ["legal_buy_volume"]="Buy_N_Volume حجم خرید حقوقی بر حسب سهم/واحد است، نه ریال",
            ["individual_sell_volume"]="Sell_I_Volume حجم فروش حقیقی بر حسب سهم/واحد است، نه ریال",
            ["legal_sell_volume"]="Sell_N_Volume حجم فروش حقوقی بر حسب سهم/واحد است، نه ریال",
            ["buyer_power"]="قدرت خریدار از تقسیم سرانه خرید حقیقی بر سرانه فروش حقیقی محاسبه می‌شود",
            ["counter"]="ClientType_counter شمارنده/نسخه منبع است و تعداد معامله نیست",
            ["updated_at"]="creationTime زمان Snapshot اعلام‌شده توسط منبع است",
            ["source_collected_at"]="SourceCollectedAt زمان دریافت و ثبت رکورد در SQL است"
        };
        var rows=fields.Where(definitions.ContainsKey).Select(x=>definitions[x]).Distinct().ToArray();
        return rows.Length==0
            ? "I در ClientType به حقیقی و N به حقوقی اشاره می‌کند؛ Count تعداد کدهای مشارکت‌کننده و Volume حجم سهم/واحد است."
            : string.Join("؛ ",rows)+".";
    }

    private static IEnumerable<CanonicalReferenceFact> ClientTypeFacts(ClientTypeReferenceRow row)
    {
        var source=$"ClientType:{row.ClientTypeId}";
        yield return new("symbol",row.Symbol,source);
        yield return new("buy_count_i",row.BuyCountI?.ToString(CultureInfo.InvariantCulture)??"",source);
        yield return new("buy_count_n",row.BuyCountN?.ToString(CultureInfo.InvariantCulture)??"",source);
        yield return new("buy_i_volume",row.BuyIVolume?.ToString(CultureInfo.InvariantCulture)??"",source);
        yield return new("buy_n_volume",row.BuyNVolume?.ToString(CultureInfo.InvariantCulture)??"",source);
        yield return new("sell_count_i",row.SellCountI?.ToString(CultureInfo.InvariantCulture)??"",source);
        yield return new("sell_count_n",row.SellCountN?.ToString(CultureInfo.InvariantCulture)??"",source);
        yield return new("sell_i_volume",row.SellIVolume?.ToString(CultureInfo.InvariantCulture)??"",source);
        yield return new("sell_n_volume",row.SellNVolume?.ToString(CultureInfo.InvariantCulture)??"",source);
        yield return new("updated_at",row.UpdatedAt?.ToString("O",CultureInfo.InvariantCulture)??"",source,AsOffset(row.UpdatedAt));
        yield return new("source_collected_at",row.ClientTypeSourceCollectedAt?.ToString("O",CultureInfo.InvariantCulture)??"",source,AsOffset(row.ClientTypeSourceCollectedAt));
    }

    private static async Task<string?> ClientTypeAggregateAnswer(
        SqlConnection connection,string q,CanonicalClientTypeQuestionIntent intent,CancellationToken ct)
    {
        switch(intent.Aggregate)
        {
            case ClientTypeAggregateKind.Statistics:
            {
                const string sql="""
                    SELECT COUNT_BIG(*) TotalRows,COUNT_BIG(DISTINCT InsCode) DistinctInsCodes,
                        MAX(creationTime) UpdatedAt,MAX(SourceCollectedAt) SourceCollectedAt,
                        COUNT_BIG(DISTINCT ClientType_counter) DistinctCounters
                    FROM dbo.ClientType;
                    """;
                var x=await connection.QuerySingleAsync<ClientTypeStatsRow>(new CommandDefinition(sql,cancellationToken:ct,commandTimeout:20));
                return $"جدول ClientType دارای {x.TotalRows:N0} رکورد برای {x.DistinctInsCodes:N0} InsCode متمایز است. آخرین زمان Snapshot منبع {PersianDisplayText.FormatPersianDate(x.UpdatedAt!.Value,true)} و زمان دریافت در SQL {PersianDisplayText.FormatPersianDate(x.SourceCollectedAt!.Value,true)} است؛ {x.DistinctCounters:N0} مقدار متمایز برای شمارنده منبع ثبت شده است.";
            }
            case ClientTypeAggregateKind.InstrumentCoverage:
            {
                const string sql="""
                    SELECT COUNT_BIG(*) TotalRows,
                        SUM(CASE WHEN i.InsCode IS NOT NULL THEN CONVERT(bigint,1) ELSE 0 END) MatchedRows,
                        SUM(CASE WHEN i.InsCode IS NULL THEN CONVERT(bigint,1) ELSE 0 END) OrphanRows
                    FROM dbo.ClientType ct OUTER APPLY
                    (SELECT TOP (1) x.InsCode FROM dbo.Instrument x WHERE x.InsCode=ct.InsCode ORDER BY x.Valid DESC,x.SourceCollectedAt DESC)i;
                    """;
                var x=await connection.QuerySingleAsync<ClientTypeCoverageRow>(new CommandDefinition(sql,cancellationToken:ct,commandTimeout:20));
                if(ContainsAny(q,"یتیم","بدون instrument","فاقد instrument")) return $"در ClientType، {x.OrphanRows:N0} رکورد به هیچ InsCode در Instrument متصل نمی‌شود.";
                return $"از {x.TotalRows:N0} رکورد ClientType، تعداد {x.MatchedRows:N0} رکورد به Instrument متصل و {x.OrphanRows:N0} رکورد فاقد تطبیق است.";
            }
            case ClientTypeAggregateKind.CashMarketCoverage:
            {
                const string sql="""
                    SELECT COUNT_BIG(*) TotalRows,
                        SUM(CASE WHEN linked.InsCode IS NOT NULL THEN CONVERT(bigint,1) ELSE 0 END) MatchedRows
                    FROM dbo.ClientType ct
                    LEFT JOIN
                    (
                        SELECT DISTINCT i.InsCode FROM dbo.Instrument i
                        INNER JOIN dbo.Cashmarket c ON c.Instrumentid=i.InstrumentID
                    ) linked ON linked.InsCode=ct.InsCode;
                    """;
                var x=await connection.QuerySingleAsync<ClientTypeCoverageRow>(new CommandDefinition(sql,cancellationToken:ct,commandTimeout:20));
                return $"از {x.TotalRows:N0} رکورد ClientType، تعداد {x.MatchedRows:N0} رکورد از مسیر InsCode و InstrumentID به Cashmarket متصل می‌شود. زمان Snapshot دو جدول باید جداگانه بررسی شود.";
            }
            case ClientTypeAggregateKind.DataQuality:
            {
                const string sql="""
                    SELECT
                        SUM(CASE WHEN Buy_CountI<0 OR Buy_CountN<0 OR Buy_I_Volume<0 OR Buy_N_Volume<0 OR Sell_CountI<0 OR Sell_CountN<0 OR Sell_I_Volume<0 OR Sell_N_Volume<0 THEN CONVERT(bigint,1) ELSE 0 END) NegativeRows,
                        SUM(CASE WHEN Buy_I_Volume+Buy_N_Volume<>Sell_I_Volume+Sell_N_Volume THEN CONVERT(bigint,1) ELSE 0 END) UnbalancedRows,
                        SUM(CASE WHEN Buy_CountI=0 THEN CONVERT(bigint,1) ELSE 0 END) ZeroBuyCountI,
                        SUM(CASE WHEN Buy_CountN=0 THEN CONVERT(bigint,1) ELSE 0 END) ZeroBuyCountN,
                        SUM(CASE WHEN Sell_CountI=0 THEN CONVERT(bigint,1) ELSE 0 END) ZeroSellCountI,
                        SUM(CASE WHEN Sell_CountN=0 THEN CONVERT(bigint,1) ELSE 0 END) ZeroSellCountN
                    FROM dbo.ClientType;
                    """;
                var x=await connection.QuerySingleAsync<ClientTypeQualityRow>(new CommandDefinition(sql,cancellationToken:ct,commandTimeout:20));
                if(ContainsAny(q,"منفی")) return $"در ClientType، {x.NegativeRows:N0} رکورد دارای مقدار منفی است.";
                if(ContainsAny(q,"نامتوازن","نابرابر","برابر نیست")) return $"در ClientType، {x.UnbalancedRows:N0} رکورد مجموع حجم خریدی نابرابر با مجموع حجم فروش دارد.";
                return $"کنترل کیفیت ClientType: رکورد منفی {x.NegativeRows:N0}، رکورد نامتوازن {x.UnbalancedRows:N0}؛ تعداد خریدار حقیقی صفر {x.ZeroBuyCountI:N0}، خریدار حقوقی صفر {x.ZeroBuyCountN:N0}، فروشنده حقیقی صفر {x.ZeroSellCountI:N0} و فروشنده حقوقی صفر {x.ZeroSellCountN:N0} رکورد است.";
            }
            case ClientTypeAggregateKind.LatestTimestamps:
            {
                const string sql="SELECT MAX(creationTime) UpdatedAt,MAX(SourceCollectedAt) SourceCollectedAt,MAX(ClientType_counter) MaxCounter FROM dbo.ClientType;";
                var x=await connection.QuerySingleAsync<ClientTypeStatsRow>(new CommandDefinition(sql,cancellationToken:ct,commandTimeout:20));
                return $"آخرین Snapshot اعلام‌شده ClientType مربوط به {PersianDisplayText.FormatPersianDate(x.UpdatedAt!.Value,true)} است؛ این داده در {PersianDisplayText.FormatPersianDate(x.SourceCollectedAt!.Value,true)} وارد SQL شده و بیشترین شمارنده منبع {x.MaxCounter:N0} است.";
            }
            case ClientTypeAggregateKind.Ranking:
                return await ClientTypeRankingAnswer(connection,intent,ct);
            default:return null;
        }
    }

    private static async Task<string> ClientTypeRankingAnswer(SqlConnection connection,CanonicalClientTypeQuestionIntent intent,CancellationToken ct)
    {
        var metrics=new Dictionary<string,(string Sql,string Label,string Format,bool DenominatorSensitive)>(StringComparer.Ordinal)
        {
            ["individual_buy_volume"]=("ct.Buy_I_Volume","حجم خرید حقیقی","N0",false),
            ["legal_buy_volume"]=("ct.Buy_N_Volume","حجم خرید حقوقی","N0",false),
            ["individual_sell_volume"]=("ct.Sell_I_Volume","حجم فروش حقیقی","N0",false),
            ["legal_sell_volume"]=("ct.Sell_N_Volume","حجم فروش حقوقی","N0",false),
            ["individual_buy_count"]=("ct.Buy_CountI","تعداد خریداران حقیقی","N0",false),
            ["legal_buy_count"]=("ct.Buy_CountN","تعداد خریداران حقوقی","N0",false),
            ["individual_sell_count"]=("ct.Sell_CountI","تعداد فروشندگان حقیقی","N0",false),
            ["legal_sell_count"]=("ct.Sell_CountN","تعداد فروشندگان حقوقی","N0",false),
            ["individual_net_volume"]=("ct.Buy_I_Volume-ct.Sell_I_Volume","خالص حجم حقیقی","N0",false),
            ["legal_net_volume"]=("ct.Buy_N_Volume-ct.Sell_N_Volume","خالص حجم حقوقی","N0",false),
            ["individual_buy_per_capita"]=("ct.Buy_I_Volume/NULLIF(CONVERT(decimal(38,8),ct.Buy_CountI),0)","سرانه خرید حقیقی","N2",true),
            ["individual_sell_per_capita"]=("ct.Sell_I_Volume/NULLIF(CONVERT(decimal(38,8),ct.Sell_CountI),0)","سرانه فروش حقیقی","N2",true),
            ["buyer_power"]=("(ct.Buy_I_Volume/NULLIF(CONVERT(decimal(38,8),ct.Buy_CountI),0))/NULLIF(ct.Sell_I_Volume/NULLIF(CONVERT(decimal(38,8),ct.Sell_CountI),0),0)","قدرت خریدار حقیقی","N4",true)
        };
        var key=intent.RankingField??"individual_net_volume";
        var metric=metrics[key];
        var sql=$"""
            SELECT TOP (@Limit) i.LVal18AFC AS Symbol,i.LVal30 AS SymbolName,{metric.Sql} AS MetricValue
            FROM dbo.ClientType ct
            CROSS APPLY(SELECT TOP (1) x.LVal18AFC,x.LVal30 FROM dbo.Instrument x WHERE x.InsCode=ct.InsCode AND x.Valid=1 ORDER BY x.SourceCollectedAt DESC,x.Id DESC)i
            WHERE {metric.Sql} IS NOT NULL
            ORDER BY MetricValue DESC,ct.InsCode DESC;
            """;
        var rows=(await connection.QueryAsync<ClientTypeRankingRow>(new CommandDefinition(sql,new{Limit=intent.Limit},cancellationToken:ct,commandTimeout:20))).ToArray();
        var unit=key.EndsWith("count",StringComparison.Ordinal)?" کد معاملاتی":key=="buyer_power"?string.Empty:" سهم";
        var result=$"نمادهای دارای بیشترین {metric.Label} میان رکوردهای ClientType قابل اتصال به Instrument:\n"+
            string.Join("\n",rows.Select((x,i)=>$"{i+1}. {x.Symbol} — {CleanInstrumentName(x.SymbolName)}: {x.MetricValue.ToString(metric.Format,CultureInfo.InvariantCulture)}{unit}"));
        if(metric.DenominatorSensitive)
            result+="\nاین رتبه‌بندی خام است و آستانه حداقل حجم یا تعداد مشارکت‌کننده روی آن اعمال نشده است.";
        return result;
    }

    private static string BuyerPowerDescription(decimal power)=>power switch
    {
        >1m=>$"سرانه خرید حقیقی {power:N2} برابر سرانه فروش است و سمت خرید حقیقی قوی‌تر است",
        <1m=>$"قدرت خریدار {power:N2} است و سرانه فروش حقیقی قوی‌تر است",
        _=>"سرانه خرید و فروش حقیقی برابر است"
    };

    private static string SignedWhole(decimal value)=>value>0?$"+{value:N0}":value.ToString("N0",CultureInfo.InvariantCulture);
    private static bool ContainsAny(string text,params string[] values)=>values.Any(x=>text.Contains(x,StringComparison.Ordinal));

    private static CanonicalReferenceAnswer? Wrap(string? answer,string kind,string topic,string? subjectName=null)
        => string.IsNullOrWhiteSpace(answer)?null:CanonicalReferenceAnswer.Exact(answer,kind,topic,subjectName:subjectName);

    private static DateTimeOffset? AsOffset(DateTime? value)
        => value is null?null:new DateTimeOffset(DateTime.SpecifyKind(value.Value,DateTimeKind.Utc));

    private async Task<CanonicalReferenceAnswer?> AnswerInstrumentQuestion(
        SqlConnection connection,string question,string normalizedQuestion,CanonicalInstrumentQuestionIntent intent,CancellationToken ct)
    {
        if(intent.IsAggregate)
        {
            var aggregate=await CachedInstrumentAggregateAnswer(connection,question,normalizedQuestion,intent,ct);
            return Wrap(aggregate,"instrument_aggregate","اطلاعات مرجع ابزارها");
        }

        var lookup=CanonicalInstrumentQuestion.ExtractLookupText(question);
        var resolution=await entityResolver.ResolveAsync(string.IsNullOrWhiteSpace(lookup)?question:lookup,new EntityResolveOptions([EntityKind.Instrument],8,0.68,0.025),ct);
        if(resolution.Status==EntityResolutionStatus.Ambiguous)
            return Wrap(resolution.Clarification??"چند ابزار با این عبارت منطبق است؛ نماد یا شناسه دقیق‌تری وارد کنید.","instrument","ابهام در ابزار");
        if(resolution.Status!=EntityResolutionStatus.Resolved||resolution.Selected?.InstrumentId is null) return null;
        var row=await InstrumentById(connection,resolution.Selected.InstrumentId,ct);
        if(row is null)
            return Wrap($"برای ابزار «{resolution.Selected.Symbol??resolution.Selected.DisplayName}» رکورد منطبقی در جدول Instrument وجود ندارد.","instrument","ابزار فاقد رکورد",resolution.Selected.Symbol);
        var answer=ComposeInstrumentAnswer(row,intent);
        var facts=new List<CanonicalReferenceFact>
        {
            new("instrument_id",row.InstrumentID??"",$"Instrument:{row.InstrumentID}"),
            new("symbol",row.Symbol,$"Instrument:{row.InstrumentID}"),
            new("name",row.SymbolName,$"Instrument:{row.InstrumentID}"),
            new("valid",row.Valid?.ToString(CultureInfo.InvariantCulture)??"",$"Instrument:{row.InstrumentID}"),
            new("source_collected_at",row.SourceCollectedAt?.ToString("O",CultureInfo.InvariantCulture)??"",$"Instrument:{row.InstrumentID}",AsOffset(row.SourceCollectedAt))
        };
        return CanonicalReferenceAnswer.Exact(answer,"instrument",$"مشخصات {row.Symbol}",facts,subjectName:row.Symbol,confidence:0.99);
    }

    private async Task<InstrumentRow?> InstrumentById(SqlConnection connection,string instrumentId,CancellationToken ct)
    {
        var safeId=ShortHash(instrumentId);
        var rows=await GetCatalog($"canonical:instrument-detail:v2:{safeId}",async() =>
        {
            const string sql="""
                SELECT TOP (1)
                    marketcatery AS MarketCategory,Id,DEVen,InsCode,InstrumentID,CValMne,LVal18,
                    CSocCSAC,LSoc30,LVal18AFC AS Symbol,LVal30 AS SymbolName,CIsin,QNmVlo,ZTitad,
                    DESop,YOPSJ,CGdSVal,CGrValCot,DInMar,YUniExpP,YMarNSC,CComVal,CSecVal,CSoSecVal,
                    YDeComp,PSaiSMaxOkValMdv,PSaiSMinOkValMdv,BaseVol,YVal,QPasCotFxeVal,QQtTranMarVal,
                    Flow,QtitMinSaiOmProd,QtitMaxSaiOmProd,Valid,MarketCateryId,Industryid,Industrysubid,SourceCollectedAt
                FROM dbo.Instrument WITH (READUNCOMMITTED)
                WHERE InstrumentID=@InstrumentId
                ORDER BY Valid DESC,SourceCollectedAt DESC
                OPTION (MAXDOP 1);
                """;
            return (IReadOnlyList<InstrumentRow>)(await connection.QueryAsync<InstrumentRow>(new CommandDefinition(
                sql,new{InstrumentId=instrumentId},cancellationToken:ct,commandTimeout:12))).AsList();
        },ct,TimeSpan.FromHours(1));
        return rows.FirstOrDefault();
    }

    private static bool IsOrganizationDeputyRosterQuestion(string question)
    {
        var asksDeputies=ContainsAny(question,"معاونین","معاونان","معاونت ها","معاونت های","معاونت‌ها","معاونت‌های","چه معاونت","کدام معاونت ها","کدوم معاونت ها");
        var asksRoster=ContainsAny(question,"بورس تهران","بورس چه","بورس کدام","بورس کدوم")
            ||Regex.IsMatch(question,@"^(?:معاونین|معاونان|معاونت(?:\s|‌)*(?:ها|های))",RegexOptions.CultureInvariant);
        return asksDeputies&&asksRoster&&!ContainsAny(question,"زیر مجموعه","زیرمجموعه","بالادست");
    }

    private async Task<CanonicalReferenceAnswer> CurrentOrganizationDeputyRoster(
        SqlConnection connection,string question,CancellationToken ct)
    {
        var rows=(await PersonRoleCatalog(connection,ct))
            .Where(x=>x.IsMaster&&x.TsePersonCateryId is not null)
            .Where(x=>CanonicalOrganizationHierarchyAnswer.ContainsPersian(x.FullName))
            .Where(x=>PersianDisplayText.Normalize(x.Role).Contains("معاون",StringComparison.Ordinal))
            .GroupBy(x=>x.TsePersonCateryId)
            .Select(group=>group.OrderByDescending(x=>x.SourceCollectedAt).ThenByDescending(x=>x.ContentId).First())
            .OrderBy(x=>x.TsePersonCateryId).ToArray();
        if(rows.Length==0)
            return CanonicalReferenceAnswer.Exact("در داده‌های فعلی، فهرست معاونت‌های بورس تهران ثبت نشده است.",
                "organization_unit","معاونت‌های بورس تهران",sourceTool:CanonicalReferenceToolNames.OrganizationPeople);

        var asksPeople=ContainsAny(question,"معاونین","معاونان","کیا","چه کسانی","چه افرادی","اسم","نام","اسامی");
        var answer=asksPeople
            ? "معاونان فعلی ثبت‌شده بورس تهران:\n\n"+string.Join("\n",rows.Select((x,index)=>
                $"{index+1}. {PersianDisplayText.Normalize(x.FullName)} — {PersianDisplayText.Normalize(x.Role)}"))
            : "معاونت‌های فعلی ثبت‌شده بورس تهران:\n\n"+string.Join("\n",rows.Select((x,index)=>
                $"{index+1}. {ToDeputyUnit(PersianDisplayText.Normalize(x.Role))}"));
        var facts=rows.SelectMany(row=>new[]
        {
            new CanonicalReferenceFact($"deputy:{row.TsePersonCateryId}:name",PersianDisplayText.Normalize(row.FullName),$"TsePerson:{row.ContentId}",AsOffset(row.SourceCollectedAt)),
            new CanonicalReferenceFact($"deputy:{row.TsePersonCateryId}:role",PersianDisplayText.Normalize(row.Role),$"TsePerson:{row.ContentId}",AsOffset(row.SourceCollectedAt))
        }).ToArray();
        return new(answer,new("organization_unit","معاونت‌های بورس تهران",null,null,
            rows.Select(x=>PersianDisplayText.Normalize(x.FullName)).ToArray()),facts,true,[],[],1);
    }

    private static string ToDeputyUnit(string role)
        => role.StartsWith("معاون ",StringComparison.Ordinal)?"معاونت "+role[6..]:role;

    private static string ComposeInstrumentAnswer(InstrumentRow row,CanonicalInstrumentQuestionIntent intent)
    {
        var requested=intent.Fields.ToHashSet(StringComparer.Ordinal);
        if(requested.Contains("full"))
        {
            requested.UnionWith(["name","instrument_id","ins_code","isin","issuer","category","industry","subindustry","nominal_value","shares_count","base_volume","min_allowed_price","max_allowed_price","min_order_volume","max_order_volume","validity","event_date","market_entry_date","source_observed_at"]);
            requested.Remove("full");
        }
        var parts=new List<string>();
        if(requested.Contains("name")) parts.Add($"نام کامل «{CleanInstrumentName(row.SymbolName)}»");
        if(requested.Contains("instrument_id")) parts.Add($"InstrumentID برابر {row.InstrumentID}");
        if(requested.Contains("ins_code")) parts.Add($"InsCode برابر {row.InsCode}");
        if(requested.Contains("isin")) parts.Add(string.IsNullOrWhiteSpace(row.CIsin)?"ISIN ثبت نشده":$"ISIN برابر {row.CIsin}");
        if(requested.Contains("english_symbol")) parts.Add(string.IsNullOrWhiteSpace(row.CValMne)?"نماد انگلیسی ثبت نشده":$"نماد انگلیسی {CleanInstrumentName(row.CValMne)}");
        if(requested.Contains("english_name")) parts.Add(string.IsNullOrWhiteSpace(row.LVal18)?"نام انگلیسی ثبت نشده":$"نام انگلیسی {CleanInstrumentName(row.LVal18)}");
        if(requested.Contains("issuer")) parts.Add(string.IsNullOrWhiteSpace(row.LSoc30)?"نام ناشر ثبت نشده":$"ناشر «{CleanInstrumentName(row.LSoc30)}»");
        if(requested.Contains("issuer_symbol")) parts.Add(string.IsNullOrWhiteSpace(row.CSocCSAC)?"نماد ناشر ثبت نشده":$"نماد ناشر {row.CSocCSAC}");
        if(requested.Contains("category")) parts.Add($"گروه ابزار {CategoryLabel(row.MarketCategory)}");
        if(requested.Contains("market_category_id")) parts.Add(row.MarketCateryId is null?"شناسه دسته بازار ثبت نشده":$"شناسه دسته بازار {row.MarketCateryId}");
        if(requested.Contains("industry")) parts.Add(row.Industryid is null?"کد صنعت ثبت نشده":$"کد صنعت {row.Industryid}");
        if(requested.Contains("subindustry")) parts.Add(row.Industrysubid is null?"کد زیرصنعت ثبت نشده":$"کد زیرصنعت {row.Industrysubid}");
        if(requested.Contains("nominal_value")) parts.Add(row.QNmVlo is null?"ارزش اسمی ثبت نشده":$"ارزش اسمی {row.QNmVlo:N0} ریال");
        if(requested.Contains("shares_count")) parts.Add(row.ZTitad is null?"تعداد سهام ثبت نشده":$"تعداد سهام منتشره {row.ZTitad:N0} سهم");
        if(requested.Contains("base_volume")) parts.Add(row.BaseVol is null?"حجم مبنا ثبت نشده":$"حجم مبنا {row.BaseVol:N0} سهم");
        if(requested.Contains("min_allowed_price")||requested.Contains("max_allowed_price"))
        {
            if(row.PSaiSMinOkValMdv is null||row.PSaiSMaxOkValMdv is null)
                parts.Add("دامنه قیمت مجاز در Instrument ثبت نشده");
            else if(row.PSaiSMinOkValMdv==0&&row.PSaiSMaxOkValMdv==0)
                parts.Add("حداقل و حداکثر قیمت مجاز در Instrument هر دو صفر ثبت شده‌اند و برای تأیید دامنه یا صف رسمی قابل اتکا نیستند");
            else if(requested.Contains("min_allowed_price")&&requested.Contains("max_allowed_price"))
                parts.Add($"دامنه قیمت مجاز {row.PSaiSMinOkValMdv:N0} تا {row.PSaiSMaxOkValMdv:N0} ریال");
            else if(requested.Contains("min_allowed_price")) parts.Add($"حداقل قیمت مجاز {row.PSaiSMinOkValMdv:N0} ریال");
            else parts.Add($"حداکثر قیمت مجاز {row.PSaiSMaxOkValMdv:N0} ریال");
        }
        if(requested.Contains("min_order_volume")) parts.Add(row.QtitMinSaiOmProd is null?"حداقل حجم سفارش ثبت نشده":$"حداقل حجم هر سفارش {row.QtitMinSaiOmProd:N0}");
        if(requested.Contains("max_order_volume")) parts.Add(row.QtitMaxSaiOmProd is null?"حداکثر حجم سفارش ثبت نشده":$"حداکثر حجم هر سفارش {row.QtitMaxSaiOmProd:N0}");
        if(requested.Contains("validity")) parts.Add(row.Valid==1?"وضعیت ابزار معتبر/فعال است":"وضعیت ابزار نامعتبر/غیرفعال است");
        if(requested.Contains("event_date")) parts.Add($"تاریخ رویداد منبع {FormatInstrumentDate(row.DEVen)}");
        if(requested.Contains("market_entry_date"))
            parts.Add(row.DInMar==20000101?"فیلد DInMar مقدار پیش‌فرض دارد و تاریخ درج واقعی از آن قابل تأیید نیست":$"تاریخ ثبت‌شده در DInMar برابر {FormatInstrumentDate(row.DInMar)} است؛ این تاریخ لزوماً تاریخ عرضه اولیه شرکت نیست");
        if(requested.Contains("source_observed_at")) parts.Add(row.SourceCollectedAt is null?"زمان جمع‌آوری منبع نامشخص است":$"زمان جمع‌آوری داده {PersianDisplayText.FormatPersianDate(row.SourceCollectedAt.Value,true)}");
        if(requested.Contains("flow")) parts.Add(row.Flow is null?"Flow ثبت نشده":$"Flow برابر {row.Flow}");
        if(requested.Contains("instrument_type_code")) parts.Add(row.YVal is null?"YVal ثبت نشده":$"YVal برابر {row.YVal}");
        if(requested.Contains("market_code")) parts.Add(string.IsNullOrWhiteSpace(row.YMarNSC)?"YMarNSC ثبت نشده":$"YMarNSC برابر {row.YMarNSC}");
        if(parts.Count==0) return $"نماد «{row.Symbol}» متعلق به {CleanInstrumentName(row.SymbolName)} است.";
        var sentence=$"{row.Symbol}: {string.Join("، ",parts)}";
        return Regex.IsMatch(sentence,@"(?:است|هست|نیست|نیستند|هستند|شده(?:‌| )?اند|می(?:‌| )?شود)$")
            ? sentence+"."
            : sentence+" است.";
    }

    private static string FormatInstrumentDate(int? raw)
        => PersianDisplayText.FormatCompactDate(raw)??"نامشخص";

    private static string CategoryLabel(string? category)=>category?.ToLowerInvariant() switch
    {
        "cash"=>"cash (بازار نقدی)",
        "etf"=>"ETF (صندوق قابل معامله)",
        "debt"=>"debt (اوراق بدهی)",
        "tradeoption"=>"tradeoption (اختیار معامله)",
        "option"=>"option (اختیار معامله)",
        "future"=>"future (قرارداد آتی)",
        null or ""=>"ثبت‌نشده",
        _=>category
    };

    private static Task<long> InstrumentValidityCount(SqlConnection connection,bool valid,CancellationToken ct)
        =>connection.ExecuteScalarAsync<long>(new CommandDefinition(
            valid
                ? "SELECT COUNT_BIG(*) FROM dbo.Instrument WHERE Valid=1;"
                : "SELECT COUNT_BIG(*) FROM dbo.Instrument WHERE Valid=0;",
            cancellationToken:ct,commandTimeout:20));

    private static Task<long> InstrumentDistinctCount(SqlConnection connection,string requestedColumn,CancellationToken ct)
    {
        // The identifier comes only from this closed mapping; never from user text.
        var column=requestedColumn switch
        {
            "LSoc30"=>"LSoc30",
            "Industryid"=>"Industryid",
            "Industrysubid"=>"Industrysubid",
            "CIsin"=>"CIsin",
            _=>throw new ArgumentOutOfRangeException(nameof(requestedColumn))
        };
        var sql=$"SELECT COUNT_BIG(*) FROM (SELECT [{column}] FROM dbo.Instrument WHERE Valid=1 AND [{column}] IS NOT NULL GROUP BY [{column}]) d;";
        return connection.ExecuteScalarAsync<long>(new CommandDefinition(sql,cancellationToken:ct,commandTimeout:20));
    }

    private async Task<string?> CachedInstrumentAggregateAnswer(
        SqlConnection connection,string question,string q,CanonicalInstrumentQuestionIntent intent,CancellationToken ct)
    {
        var cacheKey=InstrumentAggregateCacheKey(q,intent);
        if(cache.TryGetValue(cacheKey,out string? hit)&&!string.IsNullOrWhiteSpace(hit)) return hit;
        var distributed=await ReadDistributedCache<string>(cacheKey,ct);
        if(!string.IsNullOrWhiteSpace(distributed))
        {
            cache.Set(cacheKey,distributed,TimeSpan.FromHours(1));
            return distributed;
        }

        await InstrumentAggregateLock.WaitAsync(ct);
        try
        {
            if(cache.TryGetValue(cacheKey,out hit)&&!string.IsNullOrWhiteSpace(hit)) return hit;
            distributed=await ReadDistributedCache<string>(cacheKey,ct);
            if(!string.IsNullOrWhiteSpace(distributed))
            {
                cache.Set(cacheKey,distributed,TimeSpan.FromHours(1));
                return distributed;
            }
            var answer=await InstrumentAggregateAnswer(connection,question,q,intent,ct);
            if(string.IsNullOrWhiteSpace(answer)) return answer;
            var aggregateTtl=TimeSpan.FromHours(1);
            cache.Set(cacheKey,answer,aggregateTtl);
            await WriteDistributedCache(cacheKey,answer,ct,aggregateTtl);
            return answer;
        }
        finally { InstrumentAggregateLock.Release(); }
    }

    private string InstrumentAggregateCacheKey(string q,CanonicalInstrumentQuestionIntent intent)
    {
        var detail=intent.Aggregate switch
        {
            InstrumentAggregateKind.Statistics when q.Contains("نامعتبر",StringComparison.Ordinal)||q.Contains("غیرفعال",StringComparison.Ordinal)=>"invalid",
            InstrumentAggregateKind.Statistics when q.Contains("شرکت",StringComparison.Ordinal)||q.Contains("ناشر",StringComparison.Ordinal)=>"issuers",
            InstrumentAggregateKind.Statistics when q.Contains("زیرصنعت",StringComparison.Ordinal)=>"sub-industries",
            InstrumentAggregateKind.Statistics when q.Contains("صنعت",StringComparison.Ordinal)=>"industries",
            InstrumentAggregateKind.Statistics when ContainsAny(q,"isin","آیزین","ایزین")=>"isins",
            InstrumentAggregateKind.Statistics when q.Contains("معتبر",StringComparison.Ordinal)||q.Contains("فعال",StringComparison.Ordinal)=>"valid",
            InstrumentAggregateKind.Statistics=>"summary",
            InstrumentAggregateKind.CompanyInstruments=>"company-"+ShortHash(q),
            InstrumentAggregateKind.IndustryInstruments=>$"industry-{intent.IndustryId?.ToString(CultureInfo.InvariantCulture)??ShortHash(q)}",
            _=>$"{intent.Category??"all"}:{intent.Limit}:{intent.IncludeInactive}"
        };
        var identity=Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(ConnectionString!)))[..16];
        return $"sql-ai:instrument-aggregate:v2:{identity}:{(int)intent.Aggregate}:{detail}";
    }

    private static string ShortHash(string value)
        =>Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(value)))[..16];

    private async Task<string?> InstrumentAggregateAnswer(
        SqlConnection connection,string question,string q,CanonicalInstrumentQuestionIntent intent,CancellationToken ct)
    {
        switch(intent.Aggregate)
        {
            case InstrumentAggregateKind.Statistics:
            {
                // Do not compute every DISTINCT metric for every statistics question. On the
                // source database, combining four unrelated COUNT(DISTINCT ...) expressions
                // creates a large spool/sort plan and can exceed the gateway timeout even
                // when the user only asks for one count.
                if(q.Contains("نامعتبر",StringComparison.Ordinal)||q.Contains("غیرفعال",StringComparison.Ordinal))
                {
                    var count=await InstrumentValidityCount(connection,valid:false,ct:ct);
                    return $"در جدول Instrument، {count:N0} ابزار نامعتبر/غیرفعال ثبت شده است.";
                }
                if(q.Contains("شرکت",StringComparison.Ordinal)||q.Contains("ناشر",StringComparison.Ordinal))
                {
                    var count=await InstrumentDistinctCount(connection,"LSoc30",ct);
                    return $"در میان ابزارهای معتبر Instrument، {count:N0} نام شرکت/ناشر متمایز ثبت شده است.";
                }
                if(q.Contains("زیرصنعت",StringComparison.Ordinal))
                {
                    var count=await InstrumentDistinctCount(connection,"Industrysubid",ct);
                    return $"در میان ابزارهای معتبر Instrument، {count:N0} کد زیرصنعت متمایز وجود دارد.";
                }
                if(q.Contains("صنعت",StringComparison.Ordinal))
                {
                    var count=await InstrumentDistinctCount(connection,"Industryid",ct);
                    return $"در میان ابزارهای معتبر Instrument، {count:N0} کد صنعت متمایز وجود دارد.";
                }
                if(q.Contains("isin",StringComparison.Ordinal)||q.Contains("آیزین",StringComparison.Ordinal)||q.Contains("ایزین",StringComparison.Ordinal))
                {
                    var count=await InstrumentDistinctCount(connection,"CIsin",ct);
                    return $"ابزارهای معتبر Instrument دارای {count:N0} ISIN متمایز هستند.";
                }
                if(q.Contains("معتبر",StringComparison.Ordinal)||q.Contains("فعال",StringComparison.Ordinal))
                {
                    var count=await InstrumentValidityCount(connection,valid:true,ct:ct);
                    return $"در جدول Instrument، {count:N0} ابزار معتبر/فعال ثبت شده است.";
                }
                const string sql="""
                    SELECT COUNT_BIG(*) TotalRows,
                        SUM(CASE WHEN Valid=1 THEN CONVERT(bigint,1) ELSE CONVERT(bigint,0) END) ValidRows,
                        SUM(CASE WHEN Valid=0 THEN CONVERT(bigint,1) ELSE CONVERT(bigint,0) END) InvalidRows,
                        MAX(SourceCollectedAt) SourceCollectedAt
                    FROM dbo.Instrument;
                    """;
                var x=await connection.QuerySingleAsync<InstrumentStatsRow>(new CommandDefinition(sql,cancellationToken:ct,commandTimeout:20));
                return $"جدول Instrument دارای {x.TotalRows:N0} رکورد است: {x.ValidRows:N0} معتبر و {x.InvalidRows:N0} نامعتبر. آخرین زمان جمع‌آوری کل جدول {PersianDisplayText.FormatPersianDate(x.SourceCollectedAt!.Value,true)} است.";
            }
            case InstrumentAggregateKind.CategoryCounts:
            {
                const string sql="SELECT marketcatery AS Category,COUNT_BIG(*) AS [Count] FROM dbo.Instrument WHERE Valid=1 GROUP BY marketcatery ORDER BY [Count] DESC;";
                var rows=(await connection.QueryAsync<InstrumentCategoryCountRow>(new CommandDefinition(sql,cancellationToken:ct,commandTimeout:20))).ToArray();
                return "تعداد ابزارهای معتبر به تفکیک گروه:\n"+string.Join("\n",rows.Select(x=>$"- {CategoryLabel(x.Category)}: {x.Count:N0}"));
            }
            case InstrumentAggregateKind.CategoryInstruments:
                return await CategoryInstrumentAnswer(connection,q,intent,ct);
            case InstrumentAggregateKind.LatestInstruments:
            {
                var rows=await RankedInstrumentRows(connection,"DInMar",intent.Limit,ct);
                return "ابزارهای معتبر با جدیدترین مقدار DInMar:\n"+string.Join("\n",rows.Select((x,i)=>$"{i+1}. {x.Symbol} — {CleanInstrumentName(x.SymbolName)}: {FormatInstrumentDate(x.DInMar)}"))+
                    "\nDInMar تاریخ ثبت مرجع ابزار است و لزوماً تاریخ عرضه اولیه شرکت نیست.";
            }
            case InstrumentAggregateKind.TopShares:
            {
                var rows=await RankedInstrumentRows(connection,"ZTitad",intent.Limit,ct);
                return "بیشترین تعداد سهام ثبت‌شده میان ابزارهای معتبر:\n"+string.Join("\n",rows.Select((x,i)=>$"{i+1}. {x.Symbol} — {CleanInstrumentName(x.SymbolName)}: {x.ZTitad:N0} سهم"));
            }
            case InstrumentAggregateKind.TopBaseVolume:
            {
                var rows=await RankedInstrumentRows(connection,"BaseVol",intent.Limit,ct);
                return "بیشترین حجم مبنای ثبت‌شده میان ابزارهای معتبر:\n"+string.Join("\n",rows.Select((x,i)=>$"{i+1}. {x.Symbol} — {CleanInstrumentName(x.SymbolName)}: {x.BaseVol:N0} سهم"));
            }
            case InstrumentAggregateKind.TopNominalValue:
            {
                var rows=await RankedInstrumentRows(connection,"QNmVlo",intent.Limit,ct);
                return "بیشترین ارزش اسمی ثبت‌شده میان ابزارهای معتبر:\n"+string.Join("\n",rows.Select((x,i)=>$"{i+1}. {x.Symbol} — {CleanInstrumentName(x.SymbolName)}: {x.QNmVlo:N0} ریال"));
            }
            case InstrumentAggregateKind.DuplicateSymbols:
            {
                const string sql="SELECT TOP (@Limit) LVal18AFC AS Symbol,COUNT_BIG(*) AS [Count] FROM dbo.Instrument WHERE Valid=1 GROUP BY LVal18AFC HAVING COUNT_BIG(*)>1 ORDER BY [Count] DESC,LVal18AFC;";
                var rows=(await connection.QueryAsync<DuplicateInstrumentRow>(new CommandDefinition(sql,new{Limit=intent.Limit},cancellationToken:ct,commandTimeout:20))).ToArray();
                const string countSql="SELECT COUNT_BIG(*) FROM (SELECT LVal18AFC FROM dbo.Instrument WHERE Valid=1 GROUP BY LVal18AFC HAVING COUNT_BIG(*)>1)x;";
                var total=await connection.ExecuteScalarAsync<long>(new CommandDefinition(countSql,cancellationToken:ct,commandTimeout:20));
                return $"در Instrument، {total:N0} نماد معتبر تکراری وجود دارد. نمونه‌ها:\n"+string.Join("\n",rows.Select(x=>$"- {x.Symbol}: {x.Count:N0} رکورد"));
            }
            case InstrumentAggregateKind.CompanyInstruments:
                return await RelatedInstrumentAnswer(connection,question,intent,byIndustry:false,ct);
            case InstrumentAggregateKind.IndustryInstruments:
                return await RelatedInstrumentAnswer(connection,question,intent,byIndustry:true,ct);
            case InstrumentAggregateKind.MissingAllowedPrices:
            {
                const string sql="""
                    SELECT SUM(CASE WHEN Valid=1 AND PSaiSMinOkValMdv=0 AND PSaiSMaxOkValMdv=0 THEN CONVERT(bigint,1) ELSE CONVERT(bigint,0) END) ValidZero,
                           SUM(CASE WHEN Valid=1 AND c.Instrumentid IS NOT NULL AND PSaiSMinOkValMdv=0 AND PSaiSMaxOkValMdv=0 THEN CONVERT(bigint,1) ELSE CONVERT(bigint,0) END) CashZero
                    FROM dbo.Instrument i LEFT JOIN (SELECT DISTINCT Instrumentid FROM dbo.Cashmarket)c ON c.Instrumentid=i.InstrumentID;
                    """;
                var x=await connection.QuerySingleAsync<AllowedPriceStatsRow>(new CommandDefinition(sql,cancellationToken:ct,commandTimeout:20));
                return $"در Instrument، {x.ValidZero:N0} ابزار معتبر حداقل و حداکثر قیمت مجاز صفر دارند؛ هر {x.CashZero:N0} ابزار دارای تطبیق مستقیم با Cashmarket نیز در همین وضعیت‌اند. این فیلدها برای تأیید صف رسمی قابل اتکا نیستند.";
            }
            case InstrumentAggregateKind.CashMarketCoverage:
            {
                const string sql="SELECT COUNT_BIG(*) FROM dbo.Instrument i WHERE i.Valid=1 AND EXISTS(SELECT 1 FROM dbo.Cashmarket c WHERE c.Instrumentid=i.InstrumentID);";
                var count=await connection.ExecuteScalarAsync<long>(new CommandDefinition(sql,cancellationToken:ct,commandTimeout:20));
                return $"از ابزارهای معتبر Instrument، {count:N0} ابزار با InstrumentID یکسان به Cashmarket متصل‌اند.";
            }
            case InstrumentAggregateKind.OrderBookCoverage:
            {
                const string sql="SELECT COUNT_BIG(*) FROM dbo.Instrument i WHERE i.Valid=1 AND EXISTS(SELECT 1 FROM dbo.OrderBookCurrent ob WHERE ob.InstrumentID=i.InstrumentID);";
                var count=await connection.ExecuteScalarAsync<long>(new CommandDefinition(sql,cancellationToken:ct,commandTimeout:20));
                return $"از ابزارهای معتبر Instrument، {count:N0} ابزار با InstrumentID یکسان در OrderBookCurrent رکورد دارند.";
            }
            default:return null;
        }
    }

    private static async Task<string> CategoryInstrumentAnswer(SqlConnection connection,string q,CanonicalInstrumentQuestionIntent intent,CancellationToken ct)
    {
        const string countSql="""
            SELECT COUNT_BIG(*) FROM dbo.Instrument
            WHERE Valid=1 AND ((@Category=N'__null__' AND marketcatery IS NULL)
                OR (@Category=N'__option_family__' AND marketcatery IN(N'option',N'tradeoption'))
                OR marketcatery=@Category);
            """;
        var total=await connection.ExecuteScalarAsync<long>(new CommandDefinition(countSql,new{intent.Category},cancellationToken:ct,commandTimeout:20));
        var label=intent.Category=="__option_family__"?"اختیار معامله":intent.Category=="__null__"?"بدون دسته":CategoryLabel(intent.Category);
        if(q.Contains("چند",StringComparison.Ordinal)||q.Contains("تعداد",StringComparison.Ordinal)) return $"در Instrument، {total:N0} ابزار معتبر از گروه {label} ثبت شده است.";
        const string listSql="""
            SELECT TOP (@Limit) LVal18AFC AS Symbol,LVal30 AS SymbolName,marketcatery AS MarketCategory,DInMar
            FROM dbo.Instrument WHERE Valid=1 AND ((@Category=N'__null__' AND marketcatery IS NULL)
                OR (@Category=N'__option_family__' AND marketcatery IN(N'option',N'tradeoption'))
                OR marketcatery=@Category)
            ORDER BY DInMar DESC,InsCode DESC;
            """;
        var rows=(await connection.QueryAsync<InstrumentRow>(new CommandDefinition(listSql,new{intent.Category,intent.Limit},cancellationToken:ct,commandTimeout:20))).ToArray();
        return $"{rows.Length:N0} مورد اول از {total:N0} ابزار معتبر گروه {label}:\n"+string.Join("\n",rows.Select((x,i)=>$"{i+1}. {x.Symbol} — {CleanInstrumentName(x.SymbolName)}"));
    }

    private async Task<string?> RelatedInstrumentAnswer(SqlConnection connection,string question,CanonicalInstrumentQuestionIntent intent,bool byIndustry,CancellationToken ct)
    {
        int? industry=intent.IndustryId;
        string? issuer=null;
        string? label=null;
        if(industry is null||!byIndustry)
        {
            var lookup=CanonicalInstrumentQuestion.ExtractLookupText(question);
            var resolution=await entityResolver.ResolveAsync(string.IsNullOrWhiteSpace(lookup)?question:lookup,new EntityResolveOptions([EntityKind.Instrument],8,0.68,0.025),ct);
            if(resolution.Status!=EntityResolutionStatus.Resolved||resolution.Selected?.InstrumentId is null) return resolution.Clarification;
            var reference=await InstrumentById(connection,resolution.Selected.InstrumentId,ct);
            if(reference is null) return null;
            industry??=reference.Industryid;
            issuer=reference.CSocCSAC;
            label=byIndustry?$"صنعت {industry}":CleanInstrumentName(reference.LSoc30??reference.SymbolName);
        }
        label??=$"صنعت {industry}";
        var predicate=byIndustry?"Industryid=@Industry":"CSocCSAC=@Issuer";
        var countSql=$"SELECT COUNT_BIG(*) FROM dbo.Instrument WHERE Valid=1 AND {predicate};";
        var args=new{Industry=industry,Issuer=issuer,Limit=intent.Limit};
        var total=await connection.ExecuteScalarAsync<long>(new CommandDefinition(countSql,args,cancellationToken:ct,commandTimeout:20));
        var listSql=$"SELECT TOP (@Limit) LVal18AFC AS Symbol,LVal30 AS SymbolName,marketcatery AS MarketCategory,DInMar FROM dbo.Instrument WHERE Valid=1 AND {predicate} ORDER BY CASE WHEN marketcatery='cash' AND InstrumentID LIKE '%0001' THEN 0 ELSE 1 END,marketcatery,LVal18AFC;";
        var rows=(await connection.QueryAsync<InstrumentRow>(new CommandDefinition(listSql,args,cancellationToken:ct,commandTimeout:20))).ToArray();
        return $"{rows.Length:N0} مورد اول از {total:N0} ابزار معتبر مرتبط با {label}:\n"+string.Join("\n",rows.Select((x,i)=>$"{i+1}. {x.Symbol} — {CleanInstrumentName(x.SymbolName)} ({CategoryLabel(x.MarketCategory)})"));
    }

    private static async Task<InstrumentRow[]> RankedInstrumentRows(SqlConnection connection,string metric,int limit,CancellationToken ct)
    {
        var allowed=new HashSet<string>(StringComparer.Ordinal){"DInMar","ZTitad","BaseVol","QNmVlo"};
        if(!allowed.Contains(metric)) throw new ArgumentOutOfRangeException(nameof(metric));
        var sql=$"SELECT TOP (@Limit) LVal18AFC AS Symbol,LVal30 AS SymbolName,marketcatery AS MarketCategory,DInMar,ZTitad,BaseVol,QNmVlo FROM dbo.Instrument WHERE Valid=1 ORDER BY {metric} DESC,InsCode DESC;";
        return (await connection.QueryAsync<InstrumentRow>(new CommandDefinition(sql,new{Limit=limit},cancellationToken:ct,commandTimeout:20))).ToArray();
    }

    private static async Task<string?> LatestNews(SqlConnection connection,string question,CancellationToken ct)
    {
        const string sql = """
            SELECT TOP (1) Id, Body, PublishAt
            FROM dbo.Content
            WHERE IsDeleted=0 AND ContentStatusId=3 AND ContentTypeId=1 AND LanguageId=1
              AND NULLIF(LTRIM(RTRIM(Body)),N'') IS NOT NULL
            ORDER BY PublishAt DESC, Id DESC
            """;
        var row = await connection.QuerySingleOrDefaultAsync<NewsRow>(new CommandDefinition(sql, cancellationToken: ct, commandTimeout: 20));
        if (row is null) return null;
        var text = CleanHtml(row.Body);
        if (text.Length == 0) return null;
        var details=new List<string>();
        if(ContainsAny(question,"نوع اوراق","چه اوراقی","چه اوراقی درج"))
        {
            var match=Regex.Match(text,@"(?:پذیرش|درج)\s+(?<value>اوراق\s+[^.!؟،؛]{2,160}?)\s+در\s+بورس",RegexOptions.CultureInvariant);
            if(match.Success)
            {
                var value=Regex.Replace(match.Groups["value"].Value,@"\s+"," ").Trim();
                var acronym=Regex.Match(value,@"^اوراق\s+(?<title>.+?)\s*\((?<abbr>[^)]+)\)\s*(?<tail>.*)$",RegexOptions.CultureInvariant);
                if(acronym.Success)
                    value=$"اوراق {acronym.Groups["abbr"].Value.Trim()} {acronym.Groups["tail"].Value.Trim()} ({acronym.Groups["title"].Value.Trim()})".Replace("  "," ",StringComparison.Ordinal);
                details.Add($"{value} درج شده است");
            }
        }
        if(ContainsAny(question,"تاریخ انتشار","چه تاریخی","کی منتشر","زمان انتشار")) details.Add($"تاریخ انتشار {Date(row.PublishAt)} است");
        if(question.Contains("نماد",StringComparison.Ordinal))
        {
            var match=Regex.Match(text,"نماد\\s*[\\\"«]?\\s*(?<value>[^\\\"»،؛.\\s]+)",RegexOptions.CultureInvariant);
            if(match.Success) details.Add($"نماد «{match.Groups["value"].Value.Trim()}» است");
        }
        if(ContainsAny(question,"مبلغ","ارزش اوراق","چقدر اوراق"))
        {
            var match=Regex.Match(text,@"مبلغ\s+(?<value>[0-9۰-۹٠-٩,.٬]+(?:\.\d+)?)\s*میلیارد\s+ریال",RegexOptions.CultureInvariant);
            if(match.Success) details.Add($"مبلغ اوراق {match.Groups["value"].Value} میلیارد ریال است");
        }
        if(question.Contains("سررسید",StringComparison.Ordinal))
        {
            var match=Regex.Match(text,@"سررسید\s+(?<value>[0-9۰-۹٠-٩ /]+)",RegexOptions.CultureInvariant);
            if(match.Success) details.Add($"سررسید {Regex.Replace(match.Groups["value"].Value,@"\s+"," ").Trim()} است");
        }
        if(ContainsAny(question,"ضامن","ضمانت","عاملیت","عامل این اوراق"))
        {
            var match=Regex.Match(text,@"ضمانت\s+و\s+عاملیت\s+این\s+اوراق\s+بر\s+عهده\s+(?<value>[^.؟!]+)",RegexOptions.CultureInvariant);
            if(match.Success)
            {
                var value=Regex.Replace(match.Groups["value"].Value.Trim(),@"\s+(?:می‌باشد|می باشد|است)$",string.Empty,RegexOptions.CultureInvariant);
                details.Add($"ضمانت و عاملیت بر عهده {value} است");
            }
        }
        if(details.Count>0) return $"در آخرین خبر ثبت‌شده، {string.Join("؛ ",details)}.";
        return $"آخرین خبر ثبت‌شده در {Date(row.PublishAt)}: {TrimAtSentence(text, 600)}";
    }

    private static async Task<string?> LatestInstrument(SqlConnection connection, CancellationToken ct)
    {
        const string sql = """
            SELECT TOP (1) LVal18AFC AS Symbol, LVal30 AS SymbolName, DInMar AS ListedDate
            FROM dbo.Instrument
            WHERE Valid=1 AND NULLIF(LVal18AFC,N'') IS NOT NULL AND DInMar IS NOT NULL
            ORDER BY DInMar DESC, SourceCollectedAt DESC, InsCode DESC
            """;
        var row = await connection.QuerySingleOrDefaultAsync<InstrumentRow>(new CommandDefinition(sql, cancellationToken: ct, commandTimeout: 20));
        if (row is null) return null;
        return $"بر اساس جدیدترین تاریخ درج ثبت‌شده، نماد {row.Symbol} متعلق به {row.SymbolName} است{ListedDate(row.ListedDate)}.";
    }

    private static async Task<string?> RegionHall(SqlConnection connection, string question, CancellationToken ct)
    {
        const string sql = """
            SELECT TOP (1) t.Id, t.Talar_Name AS HallName, t.Talar_Code AS HallCode,
                   (SELECT COUNT(*) FROM dbo.Nahad_Mali n WHERE n.Talar_Id=t.Id) AS InstitutionCount
            FROM dbo.Talar t
            WHERE t.Talar_Name LIKE N'%خوزستان%' OR t.Talar_Name LIKE N'%اهواز%'
            ORDER BY t.SourceCollectedAt DESC
            """;
        var row = await connection.QuerySingleOrDefaultAsync<HallRow>(new CommandDefinition(sql, cancellationToken: ct, commandTimeout: 20));
        if (row is null) return null;
        var asksCount = question.Contains("شمارش", StringComparison.Ordinal) || question.Contains("تعداد", StringComparison.Ordinal) || question.Contains("چند", StringComparison.Ordinal);
        return asksCount
            ? $"برای تالار {row.HallName}، {row.InstitutionCount:N0} نهاد مالی ثبت شده است."
            : $"تالار ثبت‌شده استان خوزستان، «{row.HallName}» با کد {row.HallCode} است.";
    }

    private static async Task<string?> SymbolVolume(SqlConnection connection, string symbol, CancellationToken ct)
    {
        const string sql = """
            SELECT TOP (1) i.LVal18AFC AS Symbol, i.LVal30 AS SymbolName, c.Tradevolume AS TradeVolume, c.SourceCollectedAt
            FROM dbo.Instrument i INNER JOIN dbo.Cashmarket c ON c.Instrumentid=i.InstrumentID
            WHERE i.Valid=1 AND REPLACE(REPLACE(i.LVal18AFC,NCHAR(8204),N''),N' ',N'')=@Symbol
            ORDER BY c.SourceCollectedAt DESC
            """;
        var row = await connection.QuerySingleOrDefaultAsync<MarketRow>(new CommandDefinition(sql, new { Symbol=Compact(symbol) }, cancellationToken: ct, commandTimeout: 20));
        return row is null ? null : $"حجم معاملات {row.Symbol} در آخرین داده ثبت‌شده ({Date(row.SourceCollectedAt)})، {row.TradeVolume:N0} سهم است.";
    }

    private static async Task<string?> InstrumentSummary(SqlConnection connection, string symbol, CancellationToken ct)
    {
        const string sql = """
            SELECT TOP (1) i.LVal18AFC AS Symbol, i.LVal30 AS SymbolName, c.Lastprice AS LastPrice,
                   c.Closingprice AS ClosingPrice, c.Tradevolume AS TradeVolume, c.SourceCollectedAt
            FROM dbo.Instrument i LEFT JOIN dbo.Cashmarket c ON c.Instrumentid=i.InstrumentID
            WHERE i.Valid=1 AND REPLACE(REPLACE(i.LVal18AFC,NCHAR(8204),N''),N' ',N'')=@Symbol
            ORDER BY c.SourceCollectedAt DESC
            """;
        var row = await connection.QuerySingleOrDefaultAsync<MarketRow>(new CommandDefinition(sql, new { Symbol=Compact(symbol) }, cancellationToken: ct, commandTimeout: 20));
        if (row is null) return null;
        var displayName=CleanInstrumentName(row.SymbolName);
        return $"نماد «{row.Symbol}» متعلق به {displayName} است. در آخرین داده ثبت‌شده ({Date(row.SourceCollectedAt)})، قیمت پایانی {row.ClosingPrice:N0} ریال و حجم معاملات {row.TradeVolume:N0} سهم بوده است.";
    }

    private static string? SymbolAfter(string question, string cue)
    {
        var index = question.IndexOf(cue, StringComparison.Ordinal);
        if (index < 0) return null;
        var tail = question[(index + cue.Length)..].Trim();
        var token = Regex.Match(tail, @"^[آ-یA-Za-z0-9‌_-]{2,24}").Value;
        return string.IsNullOrWhiteSpace(token) ? null : token;
    }

    private static string CleanHtml(string value)
    {
        var text = Regex.Replace(value ?? "", @"<[^>]+>", " ");
        text = WebUtility.HtmlDecode(text).Replace('\u2028', ' ');
        return Regex.Replace(text, @"\s+", " ").Trim();
    }

    private static string TrimAtSentence(string value, int max)
    {
        if (value.Length <= max) return End(value);
        var prefix=value[..max];
        var matches=Regex.Matches(prefix,@"[؟!]|\.(?=\s|$)");
        var cut=matches.Count>0?matches[^1].Index+matches[^1].Length:-1;
        if(cut>=max/2) return prefix[..cut].Trim();
        cut=prefix.LastIndexOf(' ');
        if(cut<max/2) cut=max;
        return prefix[..cut].TrimEnd(' ','.','،','؛')+"…";
    }

    private static string End(string value) => ".؟!".Contains(value[^1]) ? value : value + ".";
    private static string Normalize(string value) => Regex.Replace(value.Trim().ToLowerInvariant().Replace('ي','ی').Replace('ك','ک').Replace('ۀ','ه'), @"\s+", " ");
    private static string Compact(string value) => Normalize(value).Replace("‌", "").Replace(" ", "");
    private static string Date(DateTime? value) => value is null ? "تاریخ نامشخص" : PersianDisplayText.FormatPersianDate(value.Value);
    private static string ListedDate(int? value)
    {
        var date=PersianDisplayText.FormatCompactDate(value);
        return date is null ? "" : $" در تاریخ {date}";
    }

    private static string CleanInstrumentName(string value)
    {
        var normalized=Regex.Replace(PersianDisplayText.Normalize(value),@"\s+"," ").Trim();
        return normalized.StartsWith("نماد ",StringComparison.Ordinal) ? normalized[5..].Trim() : normalized;
    }

    private sealed class NewsRow { public int Id { get; set; } public string Body { get; set; } = ""; public DateTime? PublishAt { get; set; } }
    private sealed class ContentRow
    {
        public int Id { get; set; }
        public byte ContentTypeId { get; set; }
        public byte LanguageId { get; set; }
        public DateTime? PublishAt { get; set; }
        public byte ContentStatusId { get; set; }
        public string Body { get; set; } = "";
        public DateTime? CreatedAt { get; set; }
        public short DepartmentId { get; set; }
        public DateTime? LastModifiedAt { get; set; }
        public DateTime? DeletedAt { get; set; }
        public bool IsDeleted { get; set; }
        public DateTime? SourceCollectedAt { get; set; }
    }
    private sealed class ContentStatsRow
    {
        public long TotalRows { get; set; }
        public long DistinctIds { get; set; }
        public int ContentTypes { get; set; }
        public int Languages { get; set; }
        public int Statuses { get; set; }
        public int Departments { get; set; }
        public long NonEmptyBodies { get; set; }
        public int MinId { get; set; }
        public int MaxId { get; set; }
        public DateTime? SourceCollectedAt { get; set; }
    }
    private sealed class ContentDistributionRow { public int Value { get; set; } public long Count { get; set; } public long NonEmpty { get; set; } }
    private sealed class ContentBodyCountRow { public long TotalRows { get; set; } public long EmptyBodies { get; set; } }
    private sealed class ContentDuplicateCountRow { public long DuplicateGroups { get; set; } public long ExtraDuplicateRows { get; set; } }
    private sealed class ContentDateRangeRow
    {
        public DateTime? MinPublishAt { get; set; }
        public DateTime? MaxPublishAt { get; set; }
        public DateTime? MinCreatedAt { get; set; }
        public DateTime? MaxCreatedAt { get; set; }
    }
    private sealed class ContentQualityRow
    {
        public long TotalRows { get; set; }
        public long EmptyBodies { get; set; }
        public long ShortBodies { get; set; }
        public long InitialVectorCandidates { get; set; }
        public long MissingPublishAt { get; set; }
        public long HtmlBodies { get; set; }
        public long MissingCreatorNames { get; set; }
        public long ModifiedBeforeCreated { get; set; }
        public long DeletedRows { get; set; }
        public long DuplicateGroups { get; set; }
        public long ExtraDuplicateRows { get; set; }
    }
    private sealed class InstrumentRow
    {
        public string? MarketCategory { get; set; }
        public long Id { get; set; }
        public int? DEVen { get; set; }
        public long InsCode { get; set; }
        public string? InstrumentID { get; set; }
        public string? CValMne { get; set; }
        public string? LVal18 { get; set; }
        public string? CSocCSAC { get; set; }
        public string? LSoc30 { get; set; }
        public string Symbol { get; set; } = "";
        public string SymbolName { get; set; } = "";
        public string? CIsin { get; set; }
        public decimal? QNmVlo { get; set; }
        public decimal? ZTitad { get; set; }
        public int? DESop { get; set; }
        public byte? YOPSJ { get; set; }
        public string? CGdSVal { get; set; }
        public string? CGrValCot { get; set; }
        public int? DInMar { get; set; }
        public int? ListedDate { get => DInMar; set => DInMar=value; }
        public byte? YUniExpP { get; set; }
        public string? YMarNSC { get; set; }
        public string? CComVal { get; set; }
        public string? CSecVal { get; set; }
        public string? CSoSecVal { get; set; }
        public byte? YDeComp { get; set; }
        public decimal? PSaiSMaxOkValMdv { get; set; }
        public decimal? PSaiSMinOkValMdv { get; set; }
        public long? BaseVol { get; set; }
        public int? YVal { get; set; }
        public decimal? QPasCotFxeVal { get; set; }
        public int? QQtTranMarVal { get; set; }
        public byte? Flow { get; set; }
        public long? QtitMinSaiOmProd { get; set; }
        public long? QtitMaxSaiOmProd { get; set; }
        public byte? Valid { get; set; }
        public int? MarketCateryId { get; set; }
        public int? Industryid { get; set; }
        public int? Industrysubid { get; set; }
        public DateTime? SourceCollectedAt { get; set; }
    }
    private sealed class InstrumentStatsRow
    {
        public long TotalRows { get; set; }
        public long ValidRows { get; set; }
        public long InvalidRows { get; set; }
        public long ValidCompanies { get; set; }
        public long ValidIndustries { get; set; }
        public long ValidSubIndustries { get; set; }
        public long ValidIsins { get; set; }
        public DateTime? SourceCollectedAt { get; set; }
    }
    private sealed class InstrumentCategoryCountRow { public string? Category { get; set; } public long Count { get; set; } }
    private sealed class DuplicateInstrumentRow { public string Symbol { get; set; } = ""; public long Count { get; set; } }
    private sealed class AllowedPriceStatsRow { public long ValidZero { get; set; } public long CashZero { get; set; } }
    private sealed class ClientTypeReferenceRow
    {
        public string InstrumentID { get; set; } = "";
        public long InsCode { get; set; }
        public string Symbol { get; set; } = "";
        public string SymbolName { get; set; } = "";
        public long? ClientTypeId { get; set; }
        public long? BuyCountI { get; set; }
        public long? BuyCountN { get; set; }
        public decimal? BuyIVolume { get; set; }
        public decimal? BuyNVolume { get; set; }
        public long? SellCountI { get; set; }
        public long? SellCountN { get; set; }
        public decimal? SellIVolume { get; set; }
        public decimal? SellNVolume { get; set; }
        public long? ClientTypeCounter { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public DateTime? ClientTypeSourceCollectedAt { get; set; }
        public decimal? LastPrice { get; set; }
        public decimal? ClosingPrice { get; set; }
        public decimal? TradeVolume { get; set; }
        public decimal? TradeValue { get; set; }
        public DateTime? CashMarketSourceCollectedAt { get; set; }
    }
    private sealed class ClientTypeStatsRow
    {
        public long TotalRows { get; set; }
        public long DistinctInsCodes { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public DateTime? SourceCollectedAt { get; set; }
        public long DistinctCounters { get; set; }
        public long MaxCounter { get; set; }
    }
    private sealed class ClientTypeCoverageRow { public long TotalRows { get; set; } public long MatchedRows { get; set; } public long OrphanRows { get; set; } }
    private sealed class ClientTypeQualityRow
    {
        public long NegativeRows { get; set; }
        public long UnbalancedRows { get; set; }
        public long ZeroBuyCountI { get; set; }
        public long ZeroBuyCountN { get; set; }
        public long ZeroSellCountI { get; set; }
        public long ZeroSellCountN { get; set; }
    }
    private sealed class ClientTypeRankingRow { public string Symbol { get; set; } = ""; public string SymbolName { get; set; } = ""; public decimal MetricValue { get; set; } }
    private sealed class CompanyStateRow
    {
        public string? SystemCode { get; set; }
        public string? RawName { get; set; }
        public string? Symbol { get; set; }
        public string? CompanyName { get; set; }
        public string? StatusDescription { get; set; }
        public decimal? StatusCode { get; set; }
        public string? LastDateChange { get; set; }
        public string? Reason { get; set; }
        public int? LastState { get; set; }
        public string? Ceo { get; set; }
        public string? BoardMembers { get; set; }
        public DateTime? SourceCollectedAt { get; set; }
    }
    private sealed class CompanyStateStatsRow
    {
        public long TotalRows { get; set; }
        public long DistinctSymbols { get; set; }
        public long DistinctCodes { get; set; }
        public string? EarliestChange { get; set; }
        public string? LatestChange { get; set; }
        public DateTime? SourceCollectedAt { get; set; }
    }
    private sealed class CompanyStateCountRow { public string? StatusDescription { get; set; } public long Count { get; set; } }
    private sealed class CompanyStateReasonStatsRow
    {
        public long TransparencyReview { get; set; }
        public long MissingMonthly { get; set; }
        public long MissingFinancials { get; set; }
        public long MissingManagementInterpretation { get; set; }
        public long InternalControl { get; set; }
    }
    private sealed class CompanyStateQualityRow
    {
        public long TotalRows { get; set; }
        public long MissingSymbol { get; set; }
        public long MissingCompany { get; set; }
        public long MissingDate { get; set; }
        public long MissingReason { get; set; }
        public long MissingCeo { get; set; }
        public long MissingBoard { get; set; }
    }
    private sealed class CompanyRow
    {
        public Guid Id { get; set; }
        public string? Title { get; set; }
        public string? HallName { get; set; }
        public string? Url { get; set; }
        public string? Ceo { get; set; }
        public string? Tel { get; set; }
        public DateTime? IpoDate { get; set; }
        public Guid? SourceInstrumentId { get; set; }
        public DateTime? SourceCollectedAt { get; set; }
    }
    private sealed class CompanySymbolRow { public string? Symbol { get; set; } public string? CompanyName { get; set; } }
    private sealed record ResolvedCompany(CompanyRow Company,string? Symbol,double Confidence);
    private sealed class CompanyStatsRow
    {
        public long TotalRows { get; set; }
        public long DistinctTitles { get; set; }
        public long DistinctInstrumentIds { get; set; }
        public long DistinctTalars { get; set; }
        public DateTime? EarliestIpo { get; set; }
        public DateTime? LatestIpo { get; set; }
        public DateTime? SourceCollectedAt { get; set; }
    }
    private sealed class CompanyQualityRow
    {
        public long TotalRows { get; set; }
        public long MissingTitle { get; set; }
        public long MissingUrl { get; set; }
        public long MissingCeo { get; set; }
        public long MissingTel { get; set; }
        public long OrphanTalar { get; set; }
    }
    private sealed class CompanyWebsiteRow { public long TotalRows { get; set; } public long HasWebsite { get; set; } public long MissingWebsite { get; set; } }
    private sealed class CompanyHallCountRow { public string? HallName { get; set; } public long CompanyCount { get; set; } }
    private sealed class CompanyHallRow { public Guid Id { get; set; } public string? HallName { get; set; } public int HallCode { get; set; } public DateTime? SourceCollectedAt { get; set; } }
    private sealed class HallRow { public Guid Id { get; set; } public string HallName { get; set; } = ""; public int HallCode { get; set; } public int InstitutionCount { get; set; } }
    private sealed class MarketRow { public string Symbol { get; set; } = ""; public string SymbolName { get; set; } = ""; public long TradeVolume { get; set; } public decimal LastPrice { get; set; } public decimal ClosingPrice { get; set; } public DateTime? SourceCollectedAt { get; set; } }
}
