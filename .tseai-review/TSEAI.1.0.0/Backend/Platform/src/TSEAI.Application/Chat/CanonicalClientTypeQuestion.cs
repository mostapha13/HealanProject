using System.Text.RegularExpressions;

namespace TSEAI.Application.Chat;

public enum ClientTypeAggregateKind
{
    None = 0,
    Statistics,
    InstrumentCoverage,
    CashMarketCoverage,
    DataQuality,
    LatestTimestamps,
    Ranking
}

public sealed record CanonicalClientTypeQuestionIntent(
    bool IsMatch,
    ClientTypeAggregateKind Aggregate,
    IReadOnlyList<string> Fields,
    string? RankingField,
    int Limit,
    bool IsComparison,
    bool AsksForMoneyValue)
{
    public bool IsAggregate => Aggregate != ClientTypeAggregateKind.None;
}

/// <summary>
/// Persian semantics for dbo.ClientType.  I means individual (حقیقی) and N
/// means legal/institutional (حقوقی).  The table contains participant counts
/// and share/unit volumes, not transaction counts or monetary values.
/// </summary>
public static class CanonicalClientTypeQuestion
{
    private static readonly string[] MetricPhrases =
    [
        "تعداد خریداران حقیقی","تعداد خریدار حقیقی","تعداد کدهای خریدار حقیقی","تعداد کد خریدار حقیقی",
        "تعداد خریداران حقوقی","تعداد خریدار حقوقی","تعداد کدهای خریدار حقوقی","تعداد کد خریدار حقوقی",
        "تعداد فروشندگان حقیقی","تعداد فروشنده حقیقی","تعداد کدهای فروشنده حقیقی","تعداد کد فروشنده حقیقی",
        "تعداد فروشندگان حقوقی","تعداد فروشنده حقوقی","تعداد کدهای فروشنده حقوقی","تعداد کد فروشنده حقوقی",
        "حجم خرید حقیقی","حجم خرید افراد حقیقی","خرید حقیقی","buy_i_volume","buy counti","buy_counti",
        "حجم خرید حقوقی","حجم خرید اشخاص حقوقی","خرید حقوقی","buy_n_volume","buy countn","buy_countn",
        "حجم فروش حقیقی","حجم فروش افراد حقیقی","فروش حقیقی","sell_i_volume","sell counti","sell_counti",
        "حجم فروش حقوقی","حجم فروش اشخاص حقوقی","فروش حقوقی","sell_n_volume","sell countn","sell_countn",
        "خالص حجم حقیقی","خالص خرید حقیقی","خالص معاملات حقیقی","خالص ورود حقیقی","ورود حقیقی","خروج حقیقی",
        "خالص حجم حقوقی","خالص خرید حقوقی","خالص معاملات حقوقی","خالص ورود حقوقی","ورود حقوقی","خروج حقوقی",
        "سرانه خرید حقیقی","میانگین خرید هر حقیقی","خرید سرانه حقیقی","سرانه خریدار حقیقی",
        "سرانه فروش حقیقی","میانگین فروش هر حقیقی","فروش سرانه حقیقی","سرانه فروشنده حقیقی",
        "قدرت خریدار حقیقی","قدرت خریدار","نسبت قدرت خریدار","نسبت سرانه خرید به فروش","buyer power",
        "سهم حقیقی از خرید","درصد خرید حقیقی","سهم خرید حقیقی","سهم حقوقی از خرید","درصد خرید حقوقی","سهم خرید حقوقی",
        "سهم حقیقی از فروش","درصد فروش حقیقی","سهم فروش حقیقی","سهم حقوقی از فروش","درصد فروش حقوقی","سهم فروش حقوقی",
        "مجموع حجم خرید","کل حجم خرید","مجموع حجم فروش","کل حجم فروش","اطلاعات حقیقی و حقوقی","آمار حقیقی و حقوقی",
        "اطلاعات کامل clienttype","مشخصات کامل clienttype","داده clienttype","جدول clienttype",
        "زمان داده clienttype","تاریخ داده clienttype","زمان به روزرسانی clienttype","زمان بروزرسانی clienttype",
        "زمان snapshot منبع clienttype","تاریخ snapshot منبع clienttype","snapshot clienttype",
        "زمان جمع آوری clienttype","زمان جمع‌آوری clienttype","sourcecollectedat","creationtime","clienttype_counter","clienttype counter",
        "قیمت پایانی","آخرین قیمت","قیمت آخر","حجم معاملات","ارزش معاملات","زمان داده بازار"
    ];

    private static readonly HashSet<string> LookupStopWords = new(StringComparer.OrdinalIgnoreCase)
    {
        "نماد","سهم","شرکت","ابزار","جدول","clienttype","snapshot","sql","داده","آمار","اطلاعات","کامل","مشخصات","فعلی","آخرین",
        "حقیقی","حقوقی","خریدار","خریداران","فروشنده","فروشندگان","خرید","فروش","حجم","تعداد","کد","کدهای",
        "خالص","ورود","خروج","پول","نقدینگی","سرانه","میانگین","قدرت","نسبت","درصد","سهم","مجموع","کل",
        "قیمت","پایانی","آخر","معاملات","ارزش","زمان","تاریخ","ثبت","منبع","جمع","آوری","به","روزرسانی","بروزرسانی",
        "را","رو","بهم","لطفا","لطفاً","بگو","بده","اعلام","کن","نمایش","چقدر","چند","چنده","چیست","چیه",
        "است","هست","میباشد","می‌باشد","می","باشد","مربوط","چه","کدام","کدوم","در","از","برای","و","یا","هر",
        "بیشترین","بالاترین","کمترین","پایین","ترین","اول","تا","مورد","نفر","شخص","حساب","معاملاتی","واحد","عدد",
        "مقایسه","مقایسه‌ای","مقایسهٔ","کنید","کرده","کند","دارد","دارند","رتبه","رتبه‌بندی","ها","های",
        "بیشتر","کمتر","خریدند","فروختند","تاریخی","موقع","موقعی","مربوطه"
    };

    public static CanonicalClientTypeQuestionIntent Parse(string question)
    {
        var q=Normalize(question);
        var fields=new HashSet<string>(StringComparer.Ordinal);
        void Add(string field,params string[] aliases)
        {
            if(aliases.Any(x=>q.Contains(x,StringComparison.Ordinal))) fields.Add(field);
        }

        Add("individual_buy_count","تعداد خریدار حقیقی","تعداد خریداران حقیقی","تعداد کد خریدار حقیقی","buy_counti","buy counti");
        Add("legal_buy_count","تعداد خریدار حقوقی","تعداد خریداران حقوقی","تعداد کد خریدار حقوقی","buy_countn","buy countn");
        Add("individual_sell_count","تعداد فروشنده حقیقی","تعداد فروشندگان حقیقی","تعداد کد فروشنده حقیقی","sell_counti","sell counti");
        Add("legal_sell_count","تعداد فروشنده حقوقی","تعداد فروشندگان حقوقی","تعداد کد فروشنده حقوقی","sell_countn","sell countn");

        Add("individual_buy_volume","حجم خرید حقیقی","خرید حقیقی","buy_i_volume","buy i volume");
        Add("legal_buy_volume","حجم خرید حقوقی","خرید حقوقی","buy_n_volume","buy n volume");
        Add("individual_sell_volume","حجم فروش حقیقی","فروش حقیقی","sell_i_volume","sell i volume");
        Add("legal_sell_volume","حجم فروش حقوقی","فروش حقوقی","sell_n_volume","sell n volume");
        Add("total_buy_volume","مجموع حجم خرید","کل حجم خرید","حجم کل خرید");
        Add("total_sell_volume","مجموع حجم فروش","کل حجم فروش","حجم کل فروش");

        Add("individual_net_volume","خالص حجم حقیقی","خالص خرید حقیقی","خالص معاملات حقیقی","خالص ورود حقیقی","ورود حقیقی","خروج حقیقی");
        Add("legal_net_volume","خالص حجم حقوقی","خالص خرید حقوقی","خالص معاملات حقوقی","خالص ورود حقوقی","ورود حقوقی","خروج حقوقی");
        Add("individual_buy_per_capita","سرانه خرید حقیقی","میانگین خرید هر حقیقی","خرید سرانه حقیقی","سرانه خریدار حقیقی");
        Add("individual_sell_per_capita","سرانه فروش حقیقی","میانگین فروش هر حقیقی","فروش سرانه حقیقی","سرانه فروشنده حقیقی");
        Add("buyer_power","قدرت خریدار حقیقی","قدرت خریدار","نسبت قدرت خریدار","نسبت سرانه خرید به فروش","buyer power");
        Add("buyer_power_signal","وضعیت قدرت خریدار","تفسیر قدرت خریدار","خریدار قوی تر","خریدار قوی‌تر","فروشنده قوی تر","فروشنده قوی‌تر");

        Add("individual_buy_share","سهم حقیقی از خرید","درصد خرید حقیقی","سهم خرید حقیقی");
        Add("legal_buy_share","سهم حقوقی از خرید","درصد خرید حقوقی","سهم خرید حقوقی");
        Add("individual_sell_share","سهم حقیقی از فروش","درصد فروش حقیقی","سهم فروش حقیقی");
        Add("legal_sell_share","سهم حقوقی از فروش","درصد فروش حقوقی","سهم فروش حقوقی");
        Add("counter","clienttype_counter","clienttype counter","کانتر clienttype","شمارنده clienttype");
        Add("updated_at","creationtime","creation time","زمان به روزرسانی clienttype","زمان بروزرسانی clienttype","تاریخ داده clienttype","زمان داده clienttype","زمان snapshot منبع clienttype","تاریخ snapshot منبع clienttype","snapshot clienttype");
        Add("source_collected_at","sourcecollectedat","source collected at","زمان جمع آوری clienttype","زمان جمع‌آوری clienttype","زمان ورود به sql","زمان دریافت در sql");
        Add("full","اطلاعات حقیقی و حقوقی","آمار حقیقی و حقوقی","اطلاعات کامل clienttype","مشخصات کامل clienttype","همه اطلاعات clienttype");

        var asksVolume=ContainsAny(q,"حجم","چند سهم","چه حجمی","تعداد سهم","چقدر سهم");
        var asksCount=ContainsAny(q,"چند خریدار","چند فروشنده","تعداد خریدار","تعداد فروشنده","چند کد");
        if(asksVolume&&q.Contains("خرید",StringComparison.Ordinal)&&q.Contains("حقیقی",StringComparison.Ordinal)) fields.Add("individual_buy_volume");
        if(asksVolume&&q.Contains("خرید",StringComparison.Ordinal)&&q.Contains("حقوقی",StringComparison.Ordinal)) fields.Add("legal_buy_volume");
        if(asksVolume&&q.Contains("فروش",StringComparison.Ordinal)&&q.Contains("حقیقی",StringComparison.Ordinal)) fields.Add("individual_sell_volume");
        if(asksVolume&&q.Contains("فروش",StringComparison.Ordinal)&&q.Contains("حقوقی",StringComparison.Ordinal)) fields.Add("legal_sell_volume");
        if(asksCount&&q.Contains("خریدار",StringComparison.Ordinal)&&q.Contains("حقیقی",StringComparison.Ordinal)) fields.Add("individual_buy_count");
        if(asksCount&&q.Contains("خریدار",StringComparison.Ordinal)&&q.Contains("حقوقی",StringComparison.Ordinal)) fields.Add("legal_buy_count");
        if(asksCount&&q.Contains("فروشنده",StringComparison.Ordinal)&&q.Contains("حقیقی",StringComparison.Ordinal)) fields.Add("individual_sell_count");
        if(asksCount&&q.Contains("فروشنده",StringComparison.Ordinal)&&q.Contains("حقوقی",StringComparison.Ordinal)) fields.Add("legal_sell_count");
        if(ContainsAny(q,"درصد","چه سهمی","سهم چند درصد")&&q.Contains("خرید",StringComparison.Ordinal)&&q.Contains("حقیقی",StringComparison.Ordinal)) fields.Add("individual_buy_share");
        if(ContainsAny(q,"درصد","چه سهمی","سهم چند درصد")&&q.Contains("خرید",StringComparison.Ordinal)&&q.Contains("حقوقی",StringComparison.Ordinal)) fields.Add("legal_buy_share");
        if(ContainsAny(q,"درصد","چه سهمی","سهم چند درصد")&&q.Contains("فروش",StringComparison.Ordinal)&&q.Contains("حقیقی",StringComparison.Ordinal)) fields.Add("individual_sell_share");
        if(ContainsAny(q,"درصد","چه سهمی","سهم چند درصد")&&q.Contains("فروش",StringComparison.Ordinal)&&q.Contains("حقوقی",StringComparison.Ordinal)) fields.Add("legal_sell_share");

        // In natural ranking questions «خرید حقیقی» is often expressed with
        // the participant before the action (for example «حقیقی‌ها ... خرید»).
        // Bind that semantic frame to volume unless the user explicitly asks
        // for participant count, per-capita value, net flow or buyer power.
        var rankingCue=ContainsAny(q,"بیشترین","بالاترین","کمترین","برتر")
            &&ContainsAny(q,"کدام نماد","کدوم نماد","چه نمادی","نمادها","نماد های","سهم ها","سهم‌ها");
        if(rankingCue&&q.Contains("خرید",StringComparison.Ordinal)&&q.Contains("حقیقی",StringComparison.Ordinal)
           &&!fields.Overlaps(["individual_buy_count","individual_buy_per_capita","individual_net_volume","buyer_power"]))
            fields.Add("individual_buy_volume");
        if(rankingCue&&q.Contains("خرید",StringComparison.Ordinal)&&q.Contains("حقوقی",StringComparison.Ordinal)
           &&!fields.Overlaps(["legal_buy_count","legal_net_volume"]))
            fields.Add("legal_buy_volume");
        if(rankingCue&&q.Contains("فروش",StringComparison.Ordinal)&&q.Contains("حقیقی",StringComparison.Ordinal)
           &&!fields.Overlaps(["individual_sell_count","individual_sell_per_capita","individual_net_volume"]))
            fields.Add("individual_sell_volume");
        if(rankingCue&&q.Contains("فروش",StringComparison.Ordinal)&&q.Contains("حقوقی",StringComparison.Ordinal)
           &&!fields.Overlaps(["legal_sell_count","legal_net_volume"]))
            fields.Add("legal_sell_volume");

        if(q.Contains("حقیقی",StringComparison.Ordinal)&&q.Contains("حقوقی",StringComparison.Ordinal))
        {
            if(q.Contains("خرید",StringComparison.Ordinal)) { fields.Add("individual_buy_volume"); fields.Add("legal_buy_volume"); }
            if(q.Contains("فروش",StringComparison.Ordinal)) { fields.Add("individual_sell_volume"); fields.Add("legal_sell_volume"); }
        }
        if(q.Contains("clienttype",StringComparison.Ordinal)&&ContainsAny(q,"چه تاریخ","کدام تاریخ","کدوم تاریخ","چه زمان","کی ثبت","کی جمع"))
            fields.Add(q.Contains("جمع",StringComparison.Ordinal)||q.Contains("sql",StringComparison.Ordinal)?"source_collected_at":"updated_at");

        // Derived phrases contain words such as «خرید حقیقی» but should not
        // silently expand a focused question into unrelated raw fields.
        if(fields.Contains("individual_net_volume")&&!ContainsAny(q,"حجم خرید حقیقی و","خرید حقیقی و خالص")) fields.Remove("individual_buy_volume");
        if(fields.Contains("legal_net_volume")&&!ContainsAny(q,"حجم خرید حقوقی و","خرید حقوقی و خالص")) fields.Remove("legal_buy_volume");
        if(fields.Contains("individual_buy_per_capita")&&!ContainsAny(q,"حجم خرید حقیقی و","خرید حقیقی و سرانه")) fields.Remove("individual_buy_volume");
        if(fields.Contains("individual_sell_per_capita")&&!ContainsAny(q,"حجم فروش حقیقی و","فروش حقیقی و سرانه")) fields.Remove("individual_sell_volume");
        if(fields.Contains("individual_buy_share")&&!ContainsAny(q,"حجم خرید حقیقی و","خرید حقیقی و درصد")) fields.Remove("individual_buy_volume");
        if(fields.Contains("legal_buy_share")&&!ContainsAny(q,"حجم خرید حقوقی و","خرید حقوقی و درصد")) fields.Remove("legal_buy_volume");
        if(fields.Contains("individual_sell_share")&&!ContainsAny(q,"حجم فروش حقیقی و","فروش حقیقی و درصد")) fields.Remove("individual_sell_volume");
        if(fields.Contains("legal_sell_share")&&!ContainsAny(q,"حجم فروش حقوقی و","فروش حقوقی و درصد")) fields.Remove("legal_sell_volume");

        var aggregate=DetectAggregate(q,fields,out var rankingField);
        var mentionsClientType=q.Contains("clienttype",StringComparison.Ordinal)||q.Contains("client type",StringComparison.Ordinal);
        var mentionsParticipants=ContainsAny(q,"حقیقی","حقوقی")&&ContainsAny(q,"خرید","فروش","خریدار","فروشنده","سرانه","قدرت","ورود","خروج","معاملات");
        var asksForMoney=ContainsAny(q,"ورود پول","خروج پول","خالص پول","ارزش خرید حقیقی","ارزش فروش حقیقی","نقدینگی حقیقی","نقدینگی حقوقی");
        if(asksForMoney) fields.Add("money_value_unavailable");
        var isComparison=ContainsAny(q,"مقایسه","در برابر","نسبت به هم","کدام بیشتر","کدوم بیشتر","بیشتر خریده","بیشتر فروخته");
        return new(aggregate!=ClientTypeAggregateKind.None||fields.Count>0||mentionsClientType||mentionsParticipants,
            aggregate,fields.ToArray(),rankingField,DetectLimit(q),isComparison,asksForMoney);
    }

    public static IReadOnlyList<string> ExtractLookupTexts(string question,bool comparison)
    {
        var normalized=Normalize(question);
        foreach(var phrase in MetricPhrases.OrderByDescending(x=>x.Length))
            normalized=normalized.Replace(phrase," ",StringComparison.OrdinalIgnoreCase);
        normalized=Regex.Replace(normalized,@"\b(?:بیشترین|بالاترین|کمترین|اولین)\b"," ");
        var segments=comparison
            ? Regex.Split(normalized,@"\s+(?:را\s+با|در\s+برابر|نسبت\s+به|با)\s+|\s+و\s+")
            : [normalized];
        var result=new List<string>();
        foreach(var segment in segments)
        {
            var tokens=Regex.Matches(segment,@"[\p{L}\p{Nd}‌_-]+")
                .Select(x=>x.Value).Where(x=>x.Length>=2&&!IsLookupNoise(x)).ToArray();
            var candidate=string.Join(' ',tokens).Trim();
            if(candidate.Length>0&&!result.Contains(candidate,StringComparer.OrdinalIgnoreCase)) result.Add(candidate);
        }
        return result.Take(comparison?2:1).ToArray();
    }

    private static ClientTypeAggregateKind DetectAggregate(string q,HashSet<string> fields,out string? rankingField)
    {
        rankingField=null;
        var plural=Regex.IsMatch(q,@"(?:نماد|سهم|شرکت)\s*(?:ها|های|هایی)")
            ||Regex.IsMatch(q,@"(?:^|\s)[0-9۰-۹]+\s*(?:نماد|سهم|شرکت)")
            ||ContainsAny(q,"کدام نماد","کدوم نماد","چه نماد","فهرست نماد","لیست نماد");
        var ranked=ContainsAny(q,"بیشترین","بالاترین","کمترین","رتبه بندی","رتبه‌بندی","برتر")&&plural;
        if(ranked)
        {
            rankingField=fields.Contains("buyer_power")?"buyer_power":
                fields.Contains("individual_buy_per_capita")?"individual_buy_per_capita":
                fields.Contains("individual_sell_per_capita")?"individual_sell_per_capita":
                fields.Contains("individual_net_volume")?"individual_net_volume":
                fields.Contains("legal_net_volume")?"legal_net_volume":
                fields.Contains("individual_buy_volume")?"individual_buy_volume":
                fields.Contains("legal_buy_volume")?"legal_buy_volume":
                fields.Contains("individual_sell_volume")?"individual_sell_volume":
                fields.Contains("legal_sell_volume")?"legal_sell_volume":
                fields.Contains("individual_buy_count")?"individual_buy_count":
                fields.Contains("legal_buy_count")?"legal_buy_count":
                fields.Contains("individual_sell_count")?"individual_sell_count":
                fields.Contains("legal_sell_count")?"legal_sell_count":null;
            if(rankingField is not null) return ClientTypeAggregateKind.Ranking;
        }
        if(ContainsAny(q,"رکورد یتیم","رکوردهای یتیم","بدون instrument","فاقد instrument","پوشش instrument","متصل به instrument","اتصال به instrument")
            ||(q.Contains("clienttype",StringComparison.Ordinal)&&q.Contains("instrument",StringComparison.Ordinal)&&ContainsAny(q,"پوشش","اتصال","متصل"))) return ClientTypeAggregateKind.InstrumentCoverage;
        if(ContainsAny(q,"پوشش cashmarket","متصل به cashmarket","اتصال به cashmarket","در cashmarket رکورد")) return ClientTypeAggregateKind.CashMarketCoverage;
        if(ContainsAny(q,"داده منفی","مقدار منفی","نامتوازن","نابرابر","برابر نیست","کیفیت داده","تعداد صفر","شمارش صفر","خریدار صفر","فروشنده صفر")) return ClientTypeAggregateKind.DataQuality;
        if(ContainsAny(q,"آخرین زمان کل جدول","جدیدترین زمان جدول","زمان کل جدول","آخرین بروزرسانی جدول","آخرین به روزرسانی جدول")) return ClientTypeAggregateKind.LatestTimestamps;
        if(q.Contains("clienttype",StringComparison.Ordinal)&&ContainsAny(q,"چند رکورد","تعداد رکورد","چند نماد","تعداد نماد","چند inscode","تعداد inscode","آمار جدول","وضعیت جدول","کل جدول")) return ClientTypeAggregateKind.Statistics;
        return ClientTypeAggregateKind.None;
    }

    private static int DetectLimit(string q)
    {
        var match=Regex.Match(q,@"(?<n>[0-9۰-۹]{1,2})\s*(?:نماد|سهم|مورد|تا)");
        if(match.Success&&int.TryParse(ToLatinDigits(match.Groups["n"].Value),out var value)) return Math.Clamp(value,1,20);
        return 10;
    }

    private static string Normalize(string value)
    {
        var q=PersianDisplayText.Normalize(value??string.Empty).ToLowerInvariant().Replace('‌',' ')
            .Replace('ي','ی').Replace('ى','ی').Replace('ك','ک').Replace('ة','ه').Replace('ۀ','ه');
        q=Regex.Replace(q,@"[^\p{L}\p{Nd}_/]+"," ");
        return Regex.Replace(q,@"\s+"," ").Trim();
    }

    private static bool IsLookupNoise(string token)
    {
        if(LookupStopWords.Contains(token)) return true;
        var compact=token.Replace("‌",string.Empty,StringComparison.Ordinal);
        if(Regex.IsMatch(compact,@"^(?:چند|چقدر|چطوری|کدام|کدوم|درصد|حجم|سرانه|خالص|قدرت|نسبت|قوی|ضعیف).*$")) return true;
        if(Regex.IsMatch(compact,@"^(?:خرید|فروش|خریدار|فروشنده|معامله|محاسبه|حساب|مقایسه|تفسیر|نمایش|اعلام).*$")) return true;
        if(Regex.IsMatch(compact,@"^(?:است|هست|بود|بوده|شد|شده|کرد|کن|گفت|بگو|بده|دار|داشت|باشد|میباشد|میشه|میشود|خریده|فروخته|اند|هاست).*$")) return true;
        return compact is "روی" or "هم" or "باهم" or "الان" or "فعلا" or "فعلاً" or "متعلق" or "مربوط" or "موقع" or "موقعی" or "وضعیت";
    }

    private static bool ContainsAny(string value,params string[] candidates)=>candidates.Any(x=>value.Contains(x,StringComparison.Ordinal));
    private static string ToLatinDigits(string value)=>string.Concat(value.Select(ch=>ch is >= '۰' and <= '۹'?(char)('0'+ch-'۰'):ch));
}
