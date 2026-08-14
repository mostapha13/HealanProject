using System.Globalization;
using System.Net;
using System.Text.RegularExpressions;
using Dapper;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using TSEAI.Application.Chat;
using TSEAI.Application.Temporal;

namespace TSEAI.Infrastructure.Chat;

public sealed class SqlAiCanonicalReferenceAnswerService(
    IConfiguration configuration,
    Microsoft.Extensions.Logging.ILogger<SqlAiCanonicalReferenceAnswerService> logger) : ICanonicalReferenceAnswerService
{
    private string? ConnectionString => configuration.GetConnectionString("SqlAi");

    public async Task<string?> TryAnswerAsync(string question, TemporalResolution temporal, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(ConnectionString)) return null;
        var q = Normalize(question);
        var currentScope = !temporal.HasTemporalReference || temporal.IsReferenceDayOnly;
        var symbol = SymbolAfter(q, "نماد");
        var aboutSymbol = SymbolAfter(q, "در مورد");
        var isNews = currentScope && (q.Contains("آخرین خبر", StringComparison.Ordinal) || q.Contains("جدیدترین خبر", StringComparison.Ordinal));
        var isLatestInstrument = currentScope && (q.Contains("آخرین نماد", StringComparison.Ordinal) || q.Contains("جدیدترین نماد", StringComparison.Ordinal));
        var isHall = q.Contains("تالار", StringComparison.Ordinal) &&
            (q.Contains("خوزستان", StringComparison.Ordinal) || q.Contains("اهواز", StringComparison.Ordinal));
        var isVolume = currentScope && !string.IsNullOrWhiteSpace(symbol) && q.Contains("حجم", StringComparison.Ordinal);
        var isPersonRole = currentScope
            && q.Contains("بورس تهران",StringComparison.Ordinal)
            && CanonicalPersonRoleMatcher.IsPersonRoleQuestion(q);
        if (!currentScope) aboutSymbol=null;
        if (!isNews && !isLatestInstrument && !isHall && !isVolume && !isPersonRole && string.IsNullOrWhiteSpace(aboutSymbol)) return null;

        try
        {
            await using var connection = new SqlConnection(new SqlConnectionStringBuilder(ConnectionString)
            {
                ApplicationIntent = ApplicationIntent.ReadOnly
            }.ConnectionString);
            if (isPersonRole) return await CurrentPersonRole(connection, q, ct);
            if (isNews) return await LatestNews(connection, ct);
            if (isLatestInstrument) return await LatestInstrument(connection, ct);
            if (isHall) return await RegionHall(connection, q, ct);
            if (isVolume) return await SymbolVolume(connection, symbol!, ct);
            return await InstrumentSummary(connection, aboutSymbol!, ct);
        }
        catch (SqlException exception)
        {
            logger.LogWarning(exception, "Canonical reference lookup failed; normal chat routing will continue.");
            return null;
        }
    }

    private static async Task<string> CurrentPersonRole(SqlConnection connection, string question, CancellationToken ct)
    {
        const string sql = """
            WITH current_roles AS
            (
                SELECT ContentId, TsePersonCateryId, Role, Fullname, SourceCollectedAt,
                       ROW_NUMBER() OVER
                       (
                           PARTITION BY COALESCE(TsePersonCateryId,-1), LTRIM(RTRIM(Role))
                           ORDER BY ContentId DESC
                       ) AS rn
                FROM dbo.TsePerson
                WHERE NULLIF(LTRIM(RTRIM(Role)),N'') IS NOT NULL
            )
            SELECT ContentId, TsePersonCateryId, Role, Fullname, SourceCollectedAt
            FROM current_roles
            WHERE rn=1 AND NULLIF(LTRIM(RTRIM(Fullname)),N'') IS NOT NULL
            """;
        var rows=(await connection.QueryAsync<CanonicalPersonRoleCandidate>(new CommandDefinition(sql,cancellationToken:ct,commandTimeout:20))).AsList();
        var match=CanonicalPersonRoleMatcher.Match(question,rows);
        if(match is null)
            return "در اطلاعات فعلی بورس تهران، شخص مشخص و قابل اتکایی برای این عنوان سمت پیدا نشد؛ لطفاً عنوان سمت را دقیق‌تر بنویسید.";
        var name=PersianDisplayText.Normalize(match.FullName);
        var role=PersianDisplayText.Normalize(match.Role);
        var organization=role.Contains("بورس تهران",StringComparison.Ordinal)?"":" بورس تهران";
        return $"{name}، {role}{organization} است.";
    }

    private static async Task<string?> LatestNews(SqlConnection connection, CancellationToken ct)
    {
        const string sql = """
            SELECT TOP (1) Id, Body, PublishAt
            FROM dbo.Content
            WHERE IsDeleted=0 AND ContentTypeId=1 AND LanguageId=1 AND NULLIF(Body,N'') IS NOT NULL
            ORDER BY PublishAt DESC, Id DESC
            """;
        var row = await connection.QuerySingleOrDefaultAsync<NewsRow>(new CommandDefinition(sql, cancellationToken: ct, commandTimeout: 20));
        if (row is null) return null;
        var text = CleanHtml(row.Body);
        if (text.Length == 0) return null;
        return $"آخرین خبر ثبت‌شده در {Date(row.PublishAt)}: {TrimAtSentence(text, 300)}";
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
        return $"{row.Symbol} نماد {row.SymbolName} است. در آخرین داده ثبت‌شده ({Date(row.SourceCollectedAt)})، قیمت پایانی {row.ClosingPrice:N0} ریال و حجم معاملات {row.TradeVolume:N0} سهم بوده است.";
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
    private static string Date(DateTime? value) => value?.ToString("yyyy/MM/dd", CultureInfo.InvariantCulture) ?? "تاریخ نامشخص";
    private static string ListedDate(int? value)
    {
        if (value is null) return "";
        var raw = value.Value.ToString(CultureInfo.InvariantCulture);
        return raw.Length == 8 ? $" در تاریخ {raw[..4]}/{raw.Substring(4,2)}/{raw[6..]}" : "";
    }

    private sealed class NewsRow { public int Id { get; set; } public string Body { get; set; } = ""; public DateTime? PublishAt { get; set; } }
    private sealed class InstrumentRow { public string Symbol { get; set; } = ""; public string SymbolName { get; set; } = ""; public int? ListedDate { get; set; } }
    private sealed class HallRow { public Guid Id { get; set; } public string HallName { get; set; } = ""; public int HallCode { get; set; } public int InstitutionCount { get; set; } }
    private sealed class MarketRow { public string Symbol { get; set; } = ""; public string SymbolName { get; set; } = ""; public long TradeVolume { get; set; } public decimal LastPrice { get; set; } public decimal ClosingPrice { get; set; } public DateTime? SourceCollectedAt { get; set; } }
}
