using System.Globalization;
using System.Security.Cryptography;
using System.Text;
using System.Text.RegularExpressions;
using Dapper;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Caching.Memory;
using TSEAI.Application.Chat;

namespace TSEAI.Infrastructure.Chat;

public sealed partial class SqlAiCanonicalReferenceAnswerService
{
    private static readonly string[] InstitutionLocationAliases =
    [
        "اهواز","ماهشهر","دزفول","بهبهان","آبادان","خرمشهر","اصفهان","کاشان","شاهین شهر","شهرکرد","تبریز","مراغه","ارومیه",
        "مشهد","گناباد","نیشابور","بیرجند","بجنورد","شیراز","مرودشت","کرج","قزوین","زنجان","ساری","بابل","آمل","یزد",
        "کرمان","رفسنجان","کرمانشاه","کیش","رشت","قم","همدان","اراک","سمنان","خرم آباد","بروجرد","دورود","اردبیل","گرگان",
        "سنندج","بندرعباس","بوشهر","زاهدان","ایلام","یاسوج"
    ];

    private async Task<CanonicalReferenceAnswer?> AnswerFinancialInstitutionQuestion(
        SqlConnection connection,string question,string normalizedQuestion,
        CanonicalFinancialInstitutionQuestionIntent intent,CancellationToken ct)
    {
        switch(intent.Aggregate)
        {
            case FinancialInstitutionAggregateKind.Statistics:
                return Wrap(await FinancialInstitutionStatistics(connection,ct),"financial_institution_aggregate","آمار جدول Nahad_Mali");
            case FinancialInstitutionAggregateKind.TypeDistribution:
                return Wrap(await FinancialInstitutionTypeDistribution(connection,ct),"financial_institution_aggregate","توزیع نوع نهاد مالی");
            case FinancialInstitutionAggregateKind.HallDistribution:
                return Wrap(await FinancialInstitutionHallDistribution(connection,intent.Limit,ct),"financial_institution_aggregate","توزیع نهادهای مالی بر اساس تالار");
            case FinancialInstitutionAggregateKind.HallInstitutions:
                return Wrap(await FinancialInstitutionsByHall(connection,normalizedQuestion,intent,ct),"financial_institution_aggregate","نهادهای مالی تالار منطقه‌ای");
            case FinancialInstitutionAggregateKind.TypeInstitutions:
                return Wrap(await FinancialInstitutionsByType(connection,intent,ct),"financial_institution_aggregate","نهادهای مالی بر اساس نوع");
            case FinancialInstitutionAggregateKind.DataQuality:
                return Wrap(await FinancialInstitutionDataQuality(connection,ct),"financial_institution_quality","کیفیت جدول Nahad_Mali");
            case FinancialInstitutionAggregateKind.SourceTimestamp:
                return Wrap(await FinancialInstitutionSourceTimestamp(connection,ct),"financial_institution_aggregate","زمان جمع‌آوری Nahad_Mali");
            case FinancialInstitutionAggregateKind.Schema:
                return Wrap(FinancialInstitutionSchemaAnswer(normalizedQuestion),"financial_institution_schema","ساختار جدول Nahad_Mali");
            case FinancialInstitutionAggregateKind.Comparison:
                return await CompareFinancialInstitutionBranches(connection,intent,ct);
        }

        var lookup=intent.RecordId?.ToString()??intent.Lookups.FirstOrDefault();
        if(string.IsNullOrWhiteSpace(lookup)) return null;
        var resolution=await ResolveFinancialInstitution(connection,lookup,normalizedQuestion,intent.RecordId,ct);
        if(resolution.Rows.Count==0)
        {
            var alternatives=resolution.Alternatives.Count==0?string.Empty:$" نام‌های نزدیک: {string.Join("، ",resolution.Alternatives.Select(x=>$"«{Display(x)}»"))}.";
            return CanonicalReferenceAnswer.Exact(
                $"نهاد مالی «{Display(lookup)}» در جدول Nahad_Mali پیدا نشد.{alternatives}",
                "financial_institution","نهاد مالی یافت‌نشده",confidence:1);
        }

        var fields=intent.Fields.ToHashSet(StringComparer.Ordinal);
        if(fields.Contains("full"))
        {
            fields.UnionWith(["type","phone","address","hall","source_collected_at","record_id"]);
            fields.Remove("full");
        }
        if(fields.Count==0&&intent.Aggregate==FinancialInstitutionAggregateKind.Branches)
            fields.UnionWith(["hall","phone"]);
        if(fields.Count==0) fields.UnionWith(["type","phone","address","hall"]);
        if(resolution.Rows.Count==1&&(fields.Contains("phone")||fields.Contains("address"))) fields.Add("hall");

        var answer=ComposeFinancialInstitutionDetails(resolution,fields,intent,normalizedQuestion);
        var facts=resolution.Rows.Take(intent.Limit).SelectMany(row=>new CanonicalReferenceFact[]
        {
            new("institution_id",row.Id.ToString(),$"Nahad_Mali:{row.Id}"),
            new("institution_title",Display(row.Title),$"Nahad_Mali:{row.Id}"),
            new("institution_type",DisplayInstitutionType(row.TypeName),$"Nahad_Mali:{row.Id}"),
            new("phone",Display(row.TelNo),$"Nahad_Mali:{row.Id}"),
            new("address",Display(row.Address),$"Nahad_Mali:{row.Id}"),
            new("hall",Display(row.HallName),$"Nahad_Mali:{row.Id}"),
            new("source_collected_at",row.SourceCollectedAt?.ToString("O",CultureInfo.InvariantCulture)??string.Empty,$"Nahad_Mali:{row.Id}",AsOffset(row.SourceCollectedAt))
        }).ToArray();
        var subject=Display(resolution.Rows[0].Title);
        return CanonicalReferenceAnswer.Exact(answer,"financial_institution",$"اطلاعات نهاد مالی {subject}",facts,subjectName:subject,confidence:resolution.Confidence);
    }

    private static async Task<string> FinancialInstitutionStatistics(SqlConnection connection,CancellationToken ct)
    {
        const string sql="""
            SELECT COUNT_BIG(*) TotalRows,COUNT_BIG(DISTINCT Id) DistinctIds,
                COUNT_BIG(DISTINCT NULLIF(LTRIM(RTRIM(Title)),N'')) DistinctTitles,
                COUNT_BIG(DISTINCT Nahad_Mali_Type_Id) UsedTypes,
                COUNT_BIG(DISTINCT Talar_Id) DistinctHalls,
                SUM(CASE WHEN Broker_TypeId IS NULL THEN CONVERT(bigint,1) ELSE CONVERT(bigint,0) END) NullBrokerTypes,
                MIN(SourceCollectedAt) MinCollectedAt,MAX(SourceCollectedAt) MaxCollectedAt
            FROM dbo.Nahad_Mali;
            """;
        var x=await connection.QuerySingleAsync<FinancialInstitutionStatsRow>(new CommandDefinition(sql,cancellationToken:ct,commandTimeout:20));
        return $"جدول Nahad_Mali دارای {x.TotalRows:N0} رکورد شعبه/دفتر، {x.DistinctIds:N0} شناسه یکتا و {x.DistinctTitles:N0} نام متمایز است. این رکوردها در {x.DistinctHalls:N0} تالار منطقه‌ای و {x.UsedTypes:N0} نوع استفاده‌شده قرار دارند. Broker_TypeId در هر {x.NullBrokerTypes:N0} رکورد خالی است؛ زمان جمع‌آوری Snapshot {PersianDisplayText.FormatPersianDate(x.MaxCollectedAt!.Value,true)} است.";
    }

    private static async Task<string> FinancialInstitutionTypeDistribution(SqlConnection connection,CancellationToken ct)
    {
        const string sql="""
            SELECT nt.Id,nt.Title TypeName,COUNT_BIG(n.Id) RecordCount,
                   COUNT_BIG(DISTINCT NULLIF(LTRIM(RTRIM(n.Title)),N'')) DistinctTitles
            FROM dbo.Nahad_Mali_Type nt
            LEFT JOIN dbo.Nahad_Mali n ON n.Nahad_Mali_Type_Id=nt.Id
            GROUP BY nt.Id,nt.Title
            ORDER BY RecordCount DESC,nt.Title;
            """;
        var rows=(await connection.QueryAsync<FinancialInstitutionTypeCountRow>(new CommandDefinition(sql,cancellationToken:ct,commandTimeout:20))).ToArray();
        return "توزیع Nahad_Mali بر اساس نوع نهاد:\n"+
            string.Join("\n",rows.Select((x,i)=>$"{i+1}. {DisplayInstitutionType(x.TypeName)}: {x.RecordCount:N0} رکورد؛ {x.DistinctTitles:N0} نام متمایز"))+
            $"\nجدول مرجع Nahad_Mali_Type شامل {rows.Length:N0} نوع است؛ {rows.Count(x=>x.RecordCount>0):N0} نوع در Nahad_Mali فعلی استفاده شده‌اند.";
    }

    private static async Task<string> FinancialInstitutionHallDistribution(SqlConnection connection,int limit,CancellationToken ct)
    {
        const string sql="""
            SELECT TOP (@Limit) t.Id,t.Talar_Name HallName,t.Talar_Code HallCode,
                COUNT_BIG(n.Id) RecordCount,COUNT_BIG(DISTINCT NULLIF(LTRIM(RTRIM(n.Title)),N'')) DistinctTitles
            FROM dbo.Talar t JOIN dbo.Nahad_Mali n ON n.Talar_Id=t.Id
            GROUP BY t.Id,t.Talar_Name,t.Talar_Code
            ORDER BY RecordCount DESC,t.Talar_Name;
            """;
        var rows=(await connection.QueryAsync<FinancialInstitutionHallCountRow>(new CommandDefinition(sql,new{Limit=limit},cancellationToken:ct,commandTimeout:20))).ToArray();
        return $"{rows.Length:N0} تالار اول از نظر تعداد رکورد نهاد مالی:\n"+
            string.Join("\n",rows.Select((x,i)=>$"{i+1}. {Display(x.HallName)} (کد {x.HallCode}): {x.RecordCount:N0} رکورد؛ {x.DistinctTitles:N0} نام متمایز"));
    }

    private async Task<string?> FinancialInstitutionsByHall(
        SqlConnection connection,string question,CanonicalFinancialInstitutionQuestionIntent intent,CancellationToken ct)
    {
        var hall=await ResolveFinancialInstitutionHall(connection,question,ct);
        if(hall is null) return "نام تالار یا استان موردنظر در سؤال مشخص نیست؛ لطفاً نام تالار منطقه‌ای را بنویسید.";
        var catalog=await FinancialInstitutionCatalog(connection,ct);
        var rows=catalog.Where(x=>x.TalarId==hall.Id).ToArray();
        if(intent.TypeHint is not null) rows=rows.Where(x=>InstitutionTypeMatches(x.TypeName,intent.TypeHint)).ToArray();
        var distinct=rows.GroupBy(x=>CanonicalFinancialInstitutionQuestion.MatchKey(x.Title),StringComparer.Ordinal).Select(x=>x.First()).OrderBy(x=>x.Title).ToArray();
        var label=intent.TypeHint is null?"نهاد مالی":DisplayInstitutionType(intent.TypeHint);
        if(ContainsAny(question,"چند نهاد","تعداد نهاد","چند کارگزاری","تعداد کارگزاری","چند سبدگردان","تعداد سبدگردان","چند رکورد","تعداد رکورد"))
            return $"در تالار {Display(hall.HallName)}، {rows.Length:N0} رکورد {label} با {distinct.Length:N0} نام متمایز ثبت شده است.";
        var listNames=intent.NamesOnly||
            (ContainsAny(question,"فهرست","لیست","کدام نهاد","کدوم نهاد","چه نهاد")&&!ContainsAny(question,"تلفن","تماس","آدرس","نشانی"));
        var take=listNames?Math.Min(25,distinct.Length):Math.Min(intent.Limit,rows.Length);
        if(listNames)
            return distinct.Length==0?$"هیچ {label}ی برای تالار {Display(hall.HallName)} ثبت نشده است.":
                $"نام‌های {label} ثبت‌شده در تالار {Display(hall.HallName)} ({distinct.Length:N0} نام):\n"+string.Join("\n",distinct.Take(take).Select((x,i)=>$"{i+1}. {Display(x.Title)}"))+
                (take<distinct.Length?$"\n… {distinct.Length-take:N0} نام دیگر نمایش داده نشد.":string.Empty);
        return rows.Length==0?$"هیچ {label}ی برای تالار {Display(hall.HallName)} ثبت نشده است.":
            $"{Math.Min(intent.Limit,rows.Length):N0} رکورد اول از {rows.Length:N0} رکورد {label} در تالار {Display(hall.HallName)}:\n"+
            string.Join("\n",rows.Take(intent.Limit).Select((x,i)=>$"{i+1}. {Display(x.Title)} — {Display(x.TelNo)} — {Display(x.Address)}"));
    }

    private async Task<string> FinancialInstitutionsByType(
        SqlConnection connection,CanonicalFinancialInstitutionQuestionIntent intent,CancellationToken ct)
    {
        if(intent.TypeHint is null) return "نوع نهاد مالی در سؤال مشخص نشده است.";
        var catalog=await FinancialInstitutionCatalog(connection,ct);
        var rows=catalog.Where(x=>InstitutionTypeMatches(x.TypeName,intent.TypeHint)).ToArray();
        var groups=rows.GroupBy(x=>CanonicalFinancialInstitutionQuestion.MatchKey(x.Title),StringComparer.Ordinal)
            .Select(x=>new{Row=x.First(),Branches=x.Count(),Halls=x.Select(y=>y.TalarId).Distinct().Count()})
            .OrderBy(x=>x.Row.Title).ToArray();
        var take=intent.NamesOnly?Math.Min(25,groups.Length):Math.Min(intent.Limit,groups.Length);
        var title=DisplayInstitutionType(intent.TypeHint);
        if(ContainsAny(CanonicalFinancialInstitutionQuestion.Normalize(string.Join(' ',intent.Fields)),"count"))
            return $"{rows.Length:N0} رکورد از نوع {title} با {groups.Length:N0} نام متمایز ثبت شده است.";
        return $"نهادهای نوع {title}: {rows.Length:N0} رکورد و {groups.Length:N0} نام متمایز.\n"+
            string.Join("\n",groups.Take(take).Select((x,i)=>intent.NamesOnly?$"{i+1}. {Display(x.Row.Title)}":$"{i+1}. {Display(x.Row.Title)} — {x.Branches:N0} رکورد در {x.Halls:N0} تالار"))+
            (take<groups.Length?$"\n… {groups.Length-take:N0} نام دیگر نمایش داده نشد.":string.Empty);
    }

    private async Task<string> FinancialInstitutionDataQuality(SqlConnection connection,CancellationToken ct)
    {
        var identity=Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(ConnectionString!)))[..16];
        var cacheKey=$"financial-institution-quality:{identity}";
        if(cache.TryGetValue<string>(cacheKey,out var cached)&&!string.IsNullOrWhiteSpace(cached)) return cached;
        var distributed=await ReadDistributedCache<string>(cacheKey,ct);
        if(!string.IsNullOrWhiteSpace(distributed))
        {
            cache.Set(cacheKey,distributed,ReferenceCacheTtl);
            return distributed;
        }
        const string sql="""
            SELECT COUNT_BIG(*) TotalRows,
              SUM(CASE WHEN NULLIF(LTRIM(RTRIM(n.Title)),N'') IS NULL THEN CONVERT(bigint,1) ELSE CONVERT(bigint,0) END) MissingTitle,
              SUM(CASE WHEN NULLIF(LTRIM(RTRIM(n.TelNo)),N'') IS NULL THEN CONVERT(bigint,1) ELSE CONVERT(bigint,0) END) MissingPhone,
              SUM(CASE WHEN NULLIF(LTRIM(RTRIM(n.Address)),N'') IS NULL THEN CONVERT(bigint,1) ELSE CONVERT(bigint,0) END) MissingAddress,
              SUM(CASE WHEN nt.Id IS NULL THEN CONVERT(bigint,1) ELSE CONVERT(bigint,0) END) OrphanType,
              SUM(CASE WHEN t.Id IS NULL THEN CONVERT(bigint,1) ELSE CONVERT(bigint,0) END) OrphanHall,
              SUM(CASE WHEN n.Broker_TypeId IS NULL THEN CONVERT(bigint,1) ELSE CONVERT(bigint,0) END) NullBrokerType,
              SUM(CASE WHEN n.TelNo LIKE N'%[^0-9]%' OR LEN(n.TelNo)<7 OR LEN(n.TelNo)>15 THEN CONVERT(bigint,1) ELSE CONVERT(bigint,0) END) SuspiciousPhone
            FROM dbo.Nahad_Mali n
            LEFT JOIN dbo.Nahad_Mali_Type nt ON nt.Id=n.Nahad_Mali_Type_Id
            LEFT JOIN dbo.Talar t ON t.Id=n.Talar_Id;
            SELECT COUNT_BIG(*) DuplicateGroups,COALESCE(SUM(c-1),0) ExtraRows
            FROM (SELECT COUNT_BIG(*) c FROM dbo.Nahad_Mali
                  GROUP BY Title,Nahad_Mali_Type_Id,TelNo,Address,Talar_Id,Broker_TypeId HAVING COUNT_BIG(*)>1)x;
            SELECT COUNT_BIG(*) DuplicateGroups,COALESCE(SUM(c-1),0) ExtraRows
            FROM (SELECT COUNT_BIG(*) c FROM dbo.Nahad_Mali GROUP BY Title,Talar_Id HAVING COUNT_BIG(*)>1)x;
            """;
        using var grid=await connection.QueryMultipleAsync(new CommandDefinition(sql,cancellationToken:ct,commandTimeout:20));
        var x=await grid.ReadSingleAsync<FinancialInstitutionQualityRow>();
        var exact=await grid.ReadSingleAsync<FinancialInstitutionDuplicateRow>();
        var titleHall=await grid.ReadSingleAsync<FinancialInstitutionDuplicateRow>();
        var answer=$"از {x.TotalRows:N0} رکورد Nahad_Mali، عنوان، تلفن و نشانی خالی نداریم و رکورد یتیم نسبت به نوع یا تالار نیز صفر است. {x.SuspiciousPhone:N0} شماره از نظر طول یا نویسه‌های غیردیجیت مشکوک‌اند. Broker_TypeId در هر {x.NullBrokerType:N0} رکورد خالی است. {exact.DuplicateGroups:N0} گروه تکراری کاملاً یکسان با {exact.ExtraRows:N0} ردیف اضافه وجود دارد. همچنین {titleHall.DuplicateGroups:N0} گروه نام یکسان در یک تالار با {titleHall.ExtraRows:N0} ردیف اضافه دیده می‌شود؛ این مورد لزوماً خطا نیست، چون می‌تواند شعب متعدد در یک استان باشد.";
        cache.Set(cacheKey,answer,ReferenceCacheTtl);
        await WriteDistributedCache(cacheKey,answer,ct);
        return answer;
    }

    private static async Task<string> FinancialInstitutionSourceTimestamp(SqlConnection connection,CancellationToken ct)
    {
        const string sql="SELECT COUNT_BIG(*) TotalRows,MIN(SourceCollectedAt) MinCollectedAt,MAX(SourceCollectedAt) MaxCollectedAt,COUNT_BIG(DISTINCT SourceCollectedAt) DistinctTimes FROM dbo.Nahad_Mali;";
        var x=await connection.QuerySingleAsync<FinancialInstitutionSourceRow>(new CommandDefinition(sql,cancellationToken:ct,commandTimeout:20));
        return x.DistinctTimes==1
            ?$"هر {x.TotalRows:N0} رکورد Nahad_Mali در Snapshot منبعِ {PersianDisplayText.FormatPersianDate(x.MaxCollectedAt!.Value,true)} جمع‌آوری شده‌اند."
            :$"زمان جمع‌آوری Nahad_Mali از {PersianDisplayText.FormatPersianDate(x.MinCollectedAt!.Value,true)} تا {PersianDisplayText.FormatPersianDate(x.MaxCollectedAt!.Value,true)} است و {x.DistinctTimes:N0} زمان متمایز دارد.";
    }

    private static string FinancialInstitutionSchemaAnswer(string q)
    {
        if(ContainsAny(q,"قیمت","حجم معاملات","ارزش معاملات","صورت مالی"))
            return "Nahad_Mali قیمت، حجم یا ارزش معاملات و صورت مالی ندارد؛ این جدول فقط Snapshot مرجع شعب و اطلاعات تماس نهادهای مالی شامل نام، نوع، تلفن، نشانی، تالار و زمان جمع‌آوری را نگهداری می‌کند.";
        if(ContainsAny(q,"broker type","brokertypeid","broker_typeid"))
            return "Broker_TypeId یک uniqueidentifier اختیاری است، اما در Snapshot فعلی هر 807 مقدار آن NULL است؛ بنابراین نباید از آن برای تعیین نوع نهاد استفاده کرد. نوع معتبر فعلی از Nahad_Mali_Type_Id و جدول Nahad_Mali_Type خوانده می‌شود.";
        if(ContainsAny(q,"کلید","primary key","foreign key","ایندکس","index","رابطه"))
            return "Nahad_Mali در Schema فعلی هیچ Primary Key، Index یا Foreign Key فیزیکی ندارد؛ با این حال Id در 807 رکورد فعلی یکتا است و Nahad_Mali_Type_Id و Talar_Id به‌صورت منطقی با Nahad_Mali_Type.Id و Talar.Id تطبیق دارند.";
        return "Nahad_Mali هشت ستون دارد: Id، Title، Nahad_Mali_Type_Id، TelNo، Address، Talar_Id، Broker_TypeId و SourceCollectedAt. هر ردیف یک شعبه/دفتر منطقه‌ای است و جدول تاریخچه تغییرات ندارد.";
    }

    private async Task<CanonicalReferenceAnswer?> CompareFinancialInstitutionBranches(
        SqlConnection connection,CanonicalFinancialInstitutionQuestionIntent intent,CancellationToken ct)
    {
        if(intent.Lookups.Count<2) return null;
        var left=await ResolveFinancialInstitution(connection,intent.Lookups[0],string.Empty,null,ct);
        var right=await ResolveFinancialInstitution(connection,intent.Lookups[1],string.Empty,null,ct);
        if(left.Rows.Count==0||right.Rows.Count==0) return null;
        var leftName=Display(left.Rows[0].Title);var rightName=Display(right.Rows[0].Title);
        var leftHalls=left.Rows.Select(x=>x.TalarId).Distinct().Count();var rightHalls=right.Rows.Select(x=>x.TalarId).Distinct().Count();
        var relation=left.Rows.Count==right.Rows.Count?"تعداد رکورد شعب دو نهاد برابر است":left.Rows.Count>right.Rows.Count?$"{leftName} رکورد شعب بیشتری دارد":$"{rightName} رکورد شعب بیشتری دارد";
        var answer=$"{leftName}: {left.Rows.Count:N0} رکورد در {leftHalls:N0} تالار؛ {rightName}: {right.Rows.Count:N0} رکورد در {rightHalls:N0} تالار. {relation}.";
        return CanonicalReferenceAnswer.Exact(answer,"financial_institution_comparison","مقایسه شعب نهادهای مالی",confidence:1,subjectName:leftName,relatedSubjects:[rightName]);
    }

    private async Task<FinancialInstitutionResolution> ResolveFinancialInstitution(
        SqlConnection connection,string lookup,string question,Guid? recordId,CancellationToken ct)
    {
        var catalog=await FinancialInstitutionCatalog(connection,ct);
        var normalizedQuestion=CanonicalFinancialInstitutionQuestion.Normalize(question);
        FinancialInstitutionRow[] rows;
        var confidence=1d;
        var lookupId=recordId;
        if(lookupId is null&&Guid.TryParse(lookup,out var parsed)) lookupId=parsed;
        if(lookupId is not null)
        {
            rows=catalog.Where(x=>x.Id==lookupId.Value).ToArray();
        }
        else
        {
            var key=CanonicalFinancialInstitutionQuestion.MatchKey(lookup);
            rows=catalog.Where(x=>CanonicalFinancialInstitutionQuestion.MatchKey(x.Title)==key).ToArray();
            if(rows.Length==0&&key.Length>=4)
            {
                var groups=catalog.Where(x=>
                    {
                        var candidate=CanonicalFinancialInstitutionQuestion.MatchKey(x.Title);
                        return candidate.Length>=4&&(candidate.Contains(key,StringComparison.Ordinal)||key.Contains(candidate,StringComparison.Ordinal));
                    })
                    .GroupBy(x=>CanonicalFinancialInstitutionQuestion.MatchKey(x.Title),StringComparer.Ordinal)
                    .OrderBy(x=>Math.Abs(x.Key.Length-key.Length)).ToArray();
                if(groups.Length==1) { rows=groups[0].ToArray();confidence=0.92; }
                else return new([],groups.Take(5).Select(x=>Display(x.First().Title)).ToArray(),0);
            }
        }
        if(rows.Length==0) return new([],[],0);

        if(normalizedQuestion.Contains("صندوق سرمایه گذاری مشترک",StringComparison.Ordinal))
        {
            var fundRows=rows.Where(x=>CanonicalFinancialInstitutionQuestion.Normalize(x.Title).Contains("صندوق سرمایه گذاری مشترک",StringComparison.Ordinal)).ToArray();
            if(fundRows.Length>0) rows=fundRows;
        }

        var hall=await ResolveFinancialInstitutionHall(connection,normalizedQuestion,ct);
        if(hall is not null)
        {
            var hallRows=rows.Where(x=>x.TalarId==hall.Id).ToArray();
            if(hallRows.Length>0) rows=hallRows;
        }
        if(!normalizedQuestion.Contains("تالار",StringComparison.Ordinal))
        {
            var location=InstitutionLocationAliases.FirstOrDefault(x=>normalizedQuestion.Contains(CanonicalFinancialInstitutionQuestion.Normalize(x),StringComparison.Ordinal));
            if(location is not null)
            {
                var locationKey=CanonicalFinancialInstitutionQuestion.MatchKey(location);
                var cityRows=rows.Where(x=>CanonicalFinancialInstitutionQuestion.MatchKey(x.Address).Contains(locationKey,StringComparison.Ordinal)).ToArray();
                if(cityRows.Length>0) rows=cityRows;
            }
        }
        return new(rows,[],confidence);
    }

    private async Task<CompanyHallRow?> ResolveFinancialInstitutionHall(SqlConnection connection,string question,CancellationToken ct)
    {
        if(string.IsNullOrWhiteSpace(question)) return null;
        var q=CanonicalFinancialInstitutionQuestion.Normalize(question);
        var matches=new List<(CompanyHallRow Hall,string Alias)>();
        foreach(var hall in await HallCatalog(connection,ct))
        {
            var full=CanonicalFinancialInstitutionQuestion.Normalize(hall.HallName);
            var baseName=CanonicalFinancialInstitutionQuestion.Normalize(Regex.Replace(hall.HallName??string.Empty,@"\s*\([^)]*\)\s*"," "));
            var city=CanonicalFinancialInstitutionQuestion.Normalize(Regex.Match(hall.HallName??string.Empty,@"\((?<city>[^)]+)\)").Groups["city"].Value);
            foreach(var alias in new[]{full,baseName,city}.Where(x=>x.Length>=2).Distinct(StringComparer.Ordinal))
                if(q.Contains(alias,StringComparison.Ordinal)) matches.Add((hall,alias));
        }
        return matches.OrderByDescending(x=>x.Alias.Length).Select(x=>x.Hall).FirstOrDefault();
    }

    private static string ComposeFinancialInstitutionDetails(
        FinancialInstitutionResolution resolution,IReadOnlySet<string> fields,
        CanonicalFinancialInstitutionQuestionIntent intent,string question)
    {
        var rows=resolution.Rows;
        var name=Display(rows[0].Title);
        var branchQuestion=intent.Aggregate==FinancialInstitutionAggregateKind.Branches||ContainsAny(question,"شعبه","شعب","کجاها","چند تالار");
        if(branchQuestion&&ContainsAny(question,"چند شعبه","تعداد شعبه","تعداد شعب","چند رکورد شعبه","تعداد رکورد شعبه"))
            return $"برای «{name}» پس از یکسان‌سازی عنوان، {rows.Count:N0} رکورد شعبه/دفتر در {rows.Select(x=>x.TalarId).Distinct().Count():N0} تالار منطقه‌ای ثبت شده است.";
        if(fields.SetEquals(["type"])||fields.SetEquals(["title","type"]))
        {
            var types=rows.Select(x=>DisplayInstitutionType(x.TypeName)).Distinct(StringComparer.Ordinal).ToArray();
            return $"«{name}» در Nahad_Mali از نوع {string.Join(" و ",types)} ثبت شده است.";
        }
        if(fields.SetEquals(["hall"]))
        {
            var halls=rows.Select(x=>Display(x.HallName)).Distinct(StringComparer.Ordinal).OrderBy(x=>x).ToArray();
            return $"«{name}» در {halls.Length:N0} تالار منطقه‌ای ثبت شده است: {string.Join("، ",halls)}.";
        }
        if(fields.SetEquals(["source_collected_at"]))
            return $"رکوردهای «{name}» در {PersianDisplayText.FormatPersianDate(rows.Max(x=>x.SourceCollectedAt)!.Value,true)} جمع‌آوری شده‌اند.";
        if(rows.Count==1) return ComposeFinancialInstitutionRow(rows[0],fields);

        var take=Math.Min(intent.Limit,rows.Count);
        var lines=rows.OrderBy(x=>x.HallName).ThenBy(x=>x.Address).Take(take)
            .Select((x,i)=>$"{i+1}. {ComposeFinancialInstitutionRow(x,fields,false)}");
        return $"برای «{name}» {rows.Count:N0} رکورد منطبق در {rows.Select(x=>x.TalarId).Distinct().Count():N0} تالار پیدا شد:\n"+
            string.Join("\n",lines)+(take<rows.Count?$"\n… {rows.Count-take:N0} رکورد دیگر نمایش داده نشد؛ برای پاسخ دقیق‌تر نام شهر را بنویسید.":string.Empty);
    }

    private static string ComposeFinancialInstitutionRow(FinancialInstitutionRow row,IReadOnlySet<string> fields,bool includeName=true)
    {
        var parts=new List<string>();
        if(fields.Contains("type")) parts.Add($"نوع: {DisplayInstitutionType(row.TypeName)}");
        if(fields.Contains("phone")) parts.Add($"تلفن: {Display(row.TelNo)}");
        if(fields.Contains("address")) parts.Add($"نشانی: {Display(row.Address)}");
        if(fields.Contains("hall")) parts.Add($"تالار: {Display(row.HallName)} (کد {row.HallCode})");
        if(fields.Contains("record_id")) parts.Add($"شناسه: {row.Id}");
        if(fields.Contains("broker_type_id")) parts.Add(row.BrokerTypeId is null?"Broker_TypeId: ثبت نشده":$"Broker_TypeId: {row.BrokerTypeId}");
        if(fields.Contains("source_collected_at")) parts.Add($"زمان جمع‌آوری: {PersianDisplayText.FormatPersianDate(row.SourceCollectedAt!.Value,true)}");
        var prefix=includeName?$"{Display(row.Title)} — ":string.Empty;
        return prefix+string.Join("؛ ",parts)+".";
    }

    private async Task<IReadOnlyList<FinancialInstitutionRow>> FinancialInstitutionCatalog(SqlConnection connection,CancellationToken ct)
        => await GetCatalog("canonical:financial-institution-catalog",async()=>
        {
            const string sql="""
                SELECT n.Id,n.Title,n.Nahad_Mali_Type_Id TypeId,nt.Title TypeName,n.TelNo,n.Address,
                       n.Talar_Id TalarId,t.Talar_Name HallName,t.Talar_Code HallCode,
                       n.Broker_TypeId BrokerTypeId,n.SourceCollectedAt
                FROM dbo.Nahad_Mali n
                LEFT JOIN dbo.Nahad_Mali_Type nt ON nt.Id=n.Nahad_Mali_Type_Id
                LEFT JOIN dbo.Talar t ON t.Id=n.Talar_Id;
                """;
            return (IReadOnlyList<FinancialInstitutionRow>)(await connection.QueryAsync<FinancialInstitutionRow>(new CommandDefinition(sql,cancellationToken:ct,commandTimeout:20))).AsList();
        },ct);

    private static bool InstitutionTypeMatches(string? raw,string expected)
        => CanonicalFinancialInstitutionQuestion.MatchKey(DisplayInstitutionType(raw))==CanonicalFinancialInstitutionQuestion.MatchKey(DisplayInstitutionType(expected));

    private static string DisplayInstitutionType(string? value)
    {
        var display=Display(value);
        if(CanonicalFinancialInstitutionQuestion.MatchKey(display)=="مشاورسرمایهگذرای") return "مشاور سرمایه‌گذاری";
        if(CanonicalFinancialInstitutionQuestion.MatchKey(display)=="تامینسرمایه") return "تأمین سرمایه";
        if(display.Contains("رتبه",StringComparison.Ordinal)) return "مؤسسه رتبه‌بندی";
        return display;
    }

    private sealed class FinancialInstitutionRow
    {
        public Guid Id { get; set; }
        public string? Title { get; set; }
        public Guid TypeId { get; set; }
        public string? TypeName { get; set; }
        public string? TelNo { get; set; }
        public string? Address { get; set; }
        public Guid TalarId { get; set; }
        public string? HallName { get; set; }
        public int HallCode { get; set; }
        public Guid? BrokerTypeId { get; set; }
        public DateTime? SourceCollectedAt { get; set; }
    }
    private sealed record FinancialInstitutionResolution(IReadOnlyList<FinancialInstitutionRow> Rows,IReadOnlyList<string> Alternatives,double Confidence);
    private sealed class FinancialInstitutionStatsRow
    {
        public long TotalRows { get; set; }
        public long DistinctIds { get; set; }
        public long DistinctTitles { get; set; }
        public long UsedTypes { get; set; }
        public long DistinctHalls { get; set; }
        public long NullBrokerTypes { get; set; }
        public DateTime? MinCollectedAt { get; set; }
        public DateTime? MaxCollectedAt { get; set; }
    }
    private sealed class FinancialInstitutionTypeCountRow
    {
        public Guid Id { get; set; }
        public string? TypeName { get; set; }
        public long RecordCount { get; set; }
        public long DistinctTitles { get; set; }
    }
    private sealed class FinancialInstitutionHallCountRow
    {
        public Guid Id { get; set; }
        public string? HallName { get; set; }
        public int HallCode { get; set; }
        public long RecordCount { get; set; }
        public long DistinctTitles { get; set; }
    }
    private sealed class FinancialInstitutionQualityRow
    {
        public long TotalRows { get; set; }
        public long MissingTitle { get; set; }
        public long MissingPhone { get; set; }
        public long MissingAddress { get; set; }
        public long OrphanType { get; set; }
        public long OrphanHall { get; set; }
        public long NullBrokerType { get; set; }
        public long SuspiciousPhone { get; set; }
    }
    private sealed class FinancialInstitutionDuplicateRow { public long DuplicateGroups { get; set; } public long ExtraRows { get; set; } }
    private sealed class FinancialInstitutionSourceRow
    {
        public long TotalRows { get; set; }
        public DateTime? MinCollectedAt { get; set; }
        public DateTime? MaxCollectedAt { get; set; }
        public long DistinctTimes { get; set; }
    }
}
