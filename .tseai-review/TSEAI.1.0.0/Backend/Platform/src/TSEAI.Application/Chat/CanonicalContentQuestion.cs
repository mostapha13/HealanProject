using System.Text.RegularExpressions;

namespace TSEAI.Application.Chat;

public enum ContentAggregateKind
{
    None = 0,
    Statistics,
    TypeDistribution,
    LanguageDistribution,
    StatusDistribution,
    DepartmentDistribution,
    LatestPublished,
    DateRange,
    DataQuality,
    Schema
}

public sealed record CanonicalContentQuestionIntent(
    bool IsMatch,
    ContentAggregateKind Aggregate,
    IReadOnlyList<string> Fields,
    int? ContentId,
    int Limit,
    bool FullText);

/// <summary>
/// Deterministic semantics for the CMS base table dbo.Content. Generic topical
/// questions intentionally remain on the RAG path; this parser only owns
/// explicit table/record/metadata questions.
/// </summary>
public static class CanonicalContentQuestion
{
    public static CanonicalContentQuestionIntent Parse(string? question)
    {
        var q=Normalize(question);
        var fields=new HashSet<string>(StringComparer.Ordinal);
        void Add(string field,params string[] aliases)
        {
            if(aliases.Any(x=>q.Contains(x,StringComparison.Ordinal))) fields.Add(field);
        }

        Add("body","متن محتوا","بدنه محتوا","متن رکورد","بدنه رکورد","body");
        Add("publish_at","تاریخ انتشار","زمان انتشار","publishat","publish at");
        Add("content_type_id","نوع محتوا","نوع های محتوا","نوع های محتوای","contenttypeid","content type id");
        Add("language_id","زبان محتوا","زبان","languageid","language id");
        Add("content_status_id","وضعیت انتشار","contentstatusid","content status id");
        Add("department_id","دپارتمان","واحد ثبت کننده","واحد ثبت‌کننده","departmentid","department id");
        Add("created_at","تاریخ ایجاد","زمان ایجاد","createdat","created at");
        Add("last_modified_at","آخرین ویرایش","تاریخ ویرایش","زمان ویرایش","lastmodifiedat","last modified at");
        Add("source_collected_at","زمان جمع آوری","زمان جمع‌آوری","زمان دریافت از منبع","sourcecollectedat","source collected at");
        Add("is_deleted","حذف شده","حذف‌شده","isdeleted","is deleted");

        var explicitTable=ContainsAny(q,"جدول content","dbo content","در content","رکورد content","داده های content","داده‌های content","content id","شناسه content");
        var contentId=ExtractContentId(q,explicitTable);
        var aggregate=DetectAggregate(q,explicitTable,fields);
        var explicitRecord=contentId is not null&&ContainsAny(q,"content","محتوا","رکورد","شناسه");
        return new(explicitTable||explicitRecord||aggregate!=ContentAggregateKind.None,
            aggregate,fields.ToArray(),contentId,DetectLimit(q),ContainsAny(q,"متن کامل","کل متن","عین متن","بدون خلاصه","کاملش"));
    }

    private static ContentAggregateKind DetectAggregate(string q,bool explicitTable,HashSet<string> fields)
    {
        if(!explicitTable&&!q.Contains("content",StringComparison.Ordinal)) return ContentAggregateKind.None;
        if(ContainsAny(q,"کلید اصلی","primary key","ایندکس","index","کلید خارجی","foreign key","نوع داده","ستون ها","ستون‌های","ستون های","ساختار جدول","رابطه با contenttype","عنوان دارد","ستون عنوان","ستون title","ستون subject","title دارد","subject دارد","معنی contenttypeid"))
            return ContentAggregateKind.Schema;
        if(ContainsAny(q,"کیفیت داده","بدنه خالی","body خالی","محتوای خالی","رکورد خالی","تکراری","html","اچ تی ام ال","داده ناقص","تاریخ انتشار ندار","نام ایجادکننده","createdbyname","قابل بردارسازی","قابل vector","نویز","آلودگی"))
            return ContentAggregateKind.DataQuality;
        if(fields.Contains("content_type_id")&&ContainsAny(q,"تفکیک","توزیع","فراوانی","چند نوع","هر نوع","به ازای هر نوع")) return ContentAggregateKind.TypeDistribution;
        if(fields.Contains("language_id")&&ContainsAny(q,"تفکیک","توزیع","فراوانی","چند زبان","هر زبان")) return ContentAggregateKind.LanguageDistribution;
        if(fields.Contains("content_status_id")&&ContainsAny(q,"تفکیک","توزیع","فراوانی","هر وضعیت","چند وضعیت")) return ContentAggregateKind.StatusDistribution;
        if(fields.Contains("department_id")&&ContainsAny(q,"تفکیک","توزیع","فراوانی","هر دپارتمان","هر واحد")) return ContentAggregateKind.DepartmentDistribution;
        if(fields.Contains("publish_at")&&ContainsAny(q,"بازه","قدیمی ترین","قدیمی‌ترین","جدیدترین تاریخ","اولین تاریخ","کمترین و بیشترین")) return ContentAggregateKind.DateRange;
        if(ContainsAny(q,"آخرین رکوردهای content","جدیدترین رکوردهای content","آخرین محتواهای جدول","جدیدترین محتواهای جدول")) return ContentAggregateKind.LatestPublished;
        if(ContainsAny(q,"چند رکورد","تعداد رکورد","آمار جدول","چند محتوای","تعداد محتوا","چند id","بازه شناسه","وضعیت کلی جدول")) return ContentAggregateKind.Statistics;
        return ContentAggregateKind.None;
    }

    private static int? ExtractContentId(string q,bool explicitTable)
    {
        var patterns=new[]
        {
            @"(?:content\s*id|شناسه\s*(?:content|محتوا)|محتوای\s*شماره|رکورد\s*(?:content\s*)?)(?:شماره\s*)?[:#\-]?\s*(?<id>[0-9۰-۹]{1,9})",
            @"(?:content)\s*[:#\-]?\s*(?<id>[0-9۰-۹]{1,9})"
        };
        foreach(var pattern in patterns)
        {
            var match=Regex.Match(q,pattern,RegexOptions.CultureInvariant);
            if(match.Success&&int.TryParse(ToLatinDigits(match.Groups["id"].Value),out var id)) return id;
        }
        if(explicitTable)
        {
            var match=Regex.Match(q,@"(?<![0-9۰-۹])(?<id>[0-9۰-۹]{4,9})(?![0-9۰-۹])");
            if(match.Success&&int.TryParse(ToLatinDigits(match.Groups["id"].Value),out var id)) return id;
        }
        return null;
    }

    private static int DetectLimit(string q)
    {
        var match=Regex.Match(q,@"(?<n>[0-9۰-۹]{1,2})\s*(?:رکورد|محتوا|مورد|تا)");
        if(match.Success&&int.TryParse(ToLatinDigits(match.Groups["n"].Value),out var value)) return Math.Clamp(value,1,20);
        var words=new Dictionary<string,int>(StringComparer.Ordinal){{"یک",1},{"دو",2},{"سه",3},{"چهار",4},{"پنج",5},{"شش",6},{"هفت",7},{"هشت",8},{"نه",9},{"ده",10}};
        foreach(var (word,count) in words)
            if(Regex.IsMatch(q,$@"(?:^|\s){word}\s+(?:رکورد|محتوا|مورد)")) return count;
        return 5;
    }

    public static string Normalize(string? value)
    {
        var q=PersianDisplayText.Normalize(value??string.Empty).ToLowerInvariant().Replace('‌',' ')
            .Replace('ي','ی').Replace('ى','ی').Replace('ك','ک').Replace('ة','ه').Replace('ۀ','ه');
        q=Regex.Replace(q,@"[^\p{L}\p{Nd}_/#:\-]+"," ");
        return Regex.Replace(q,@"\s+"," ").Trim();
    }

    private static bool ContainsAny(string value,params string[] candidates)=>candidates.Any(x=>value.Contains(x,StringComparison.Ordinal));
    private static string ToLatinDigits(string value)=>string.Concat(value.Select(ch=>ch is >= '۰' and <= '۹'?(char)('0'+ch-'۰'):ch));
}
