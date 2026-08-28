using System.Text.RegularExpressions;

namespace TSEAI.Application.Chat;

/// <summary>
/// Deterministic Persian market ontology used as an authority boundary around
/// the LLM planner. The model may expand language coverage, but explicit market
/// meanings detected here cannot be routed to document search or another tool.
/// </summary>
public static class PersianMarketQuestionSemantics
{
    public static bool IsOrderBookQuestion(string question)
    {
        var q=Normalize(question);
        return ContainsAny(q,"اردربوک","اوردر بوک","orderbook","دفتر سفارش")
            ||DetectRequestedFields(question).Any(IsOrderBookField);
    }

    public static IReadOnlyList<string> DetectRequestedFields(string question)
    {
        var q=Normalize(question);
        var fields=new HashSet<string>(StringComparer.Ordinal);
        void Add(string field,params string[] aliases)
        {
            if(aliases.Any(x=>q.Contains(x,StringComparison.Ordinal))) fields.Add(field);
        }

        Add("market_summary","گزارش کامل","گزارش خلاصه","خلاصه کامل","وضعیت فعلی","وضعیت امروز");
        Add("observed_at","چه تاریخی","چه تاریخ","کدام تاریخ","کدوم تاریخ","تاریخ داده","زمان داده","زمان ثبت","آخرین به روزرسانی","آخرین بروزرسانی");
        Add("identity","نام شرکت","اسم شرکت","نام نماد","این نماد چیه");
        Add("instrument_id","instrumentid","instrument id","شناسه ابزار","شناسه نماد در منبع");
        Add("ins_code","inscode","ins code","کد اینس","کد تی اس ای");
        Add("first_price","قیمت اولین معامله","اولین قیمت","قیمت آغازین","قیمت بازگشایی","با چه قیمتی باز شد","چند باز شد");
        Add("yesterday_price","قیمت روز قبل","قیمت دیروز","قیمت مبنا","مبنای ","مبنا چند");
        Add("high_price","بالاترین قیمت","بیشترین قیمت","بالاترین نرخ معامله","بیشترین نرخ معامله","سقف قیمت","حداکثر قیمت روز");
        Add("low_price","کمترین قیمت","پایین ترین قیمت","پایین ترین نرخ معامله","کمترین نرخ معامله","کف قیمت","حداقل قیمت روز");
        Add("intraday_range","دامنه نوسان روز","بازه قیمت روز","فاصله سقف و کف","فاصله سقف تا کف","بین چه قیمت هایی","از چه قیمتی تا چه قیمتی");
        Add("effect_on_index","اثر مثبت روی شاخص","اثر منفی روی شاخص","اثر مثبت بر شاخص","اثر منفی بر شاخص","اثر روی شاخص","اثر بر شاخص","روی شاخص اثر","تاثیر مثبت روی شاخص","تاثیر منفی روی شاخص","تاثیر روی شاخص","تاثیر بر شاخص");

        Add("closing_price_change_percent","درصد تغییر قیمت پایانی","درصد تغییر پایانی","پایانی چند درصد");
        Add("closing_price_change","تغییر قیمت پایانی","تغییر پایانی");
        Add("last_price_change_percent","درصد تغییر آخرین قیمت","درصد تغییر قیمت آخر","چند درصد بالا رفته","چند درصد پایین آمده","چند درصد رشد","چند درصد افت");
        Add("last_price_change","تغییر آخرین قیمت","تغییر قیمت آخر","چند ریال بالا رفته","چند ریال پایین آمده");

        Add("average_trade_price","میانگین وزنی قیمت","میانگین قیمت معامله","میانگین قیمت معاملات","متوسط قیمت معامله","متوسط قیمت معاملات");
        Add("average_trade_value","میانگین ارزش هر معامله","متوسط ارزش هر معامله");
        Add("average_trade_volume","میانگین حجم هر معامله","متوسط حجم هر معامله","میانگین در هر معامله","به طور میانگین در هر معامله");
        Add("turnover_ratio","نسبت گردش معاملات","نسبت ارزش معاملات به ارزش بازار");

        var bidContext=ContainsAny(q,"خرید","تقاضا","bid");
        var askContext=ContainsAny(q,"فروش","عرضه","ask");
        var orderBookContext=ContainsAny(q,"اردربوک","اوردر بوک","orderbook","دفتر سفارش","عمق بازار","عمق سفارش","عمق خرید","عمق فروش","ارزش سفارش","مظنه","اسپرد","spread","bestlimitcounter","کانتر اردربوک","نسخه اردربوک","سفارش خرید","سفارش فروش","تقاضا","عرضه","صف خرید","صف فروش","بهترین قیمت خرید","بهترین خرید","بهترین قیمت فروش","بهترین فروش","سرخط خرید","سرخط فروش")
            ||((bidContext||askContext)&&q.Contains("بهترین",StringComparison.Ordinal))
            ||((bidContext||askContext)&&ContainsAny(q,"سطح","ردیف"));
        var topLevel=ContainsAny(q,"بهترین","سرخط","ردیف اول","سطح اول","مظنه اول","تقاضای برتر","عرضه برتر");
        if(orderBookContext&&topLevel&&bidContext)
        {
            if(ContainsAny(q,"حجم","تعداد سهم","تعداد برگه")) fields.Add("best_bid_volume");
            else if(ContainsAny(q,"تعداد سفارش","چند سفارش")) fields.Add("best_bid_count");
            else if(ContainsAny(q,"قیمت","نرخ")) fields.Add("best_bid_price");
            else fields.Add("best_bid");
        }
        if(orderBookContext&&topLevel&&askContext)
        {
            if(ContainsAny(q,"حجم","تعداد سهم","تعداد برگه")) fields.Add("best_ask_volume");
            else if(ContainsAny(q,"تعداد سفارش","چند سفارش")) fields.Add("best_ask_count");
            else if(ContainsAny(q,"قیمت","نرخ")) fields.Add("best_ask_price");
            else fields.Add("best_ask");
        }
        if(orderBookContext&&ContainsAny(q,"اختلاف قیمت خرید و فروش","اختلاف مظنه","فاصله خرید و فروش","اسپرد","spread"))
            fields.Add(q.Contains("درصد",StringComparison.Ordinal)?"spread_percent":"spread");
        if(orderBookContext&&ContainsAny(q,"قیمت میانی","میانگین بهترین خرید و فروش","mid price","midpoint")) fields.Add("mid_price");
        if(orderBookContext&&bidContext&&ContainsAny(q,"عمق خرید","کل حجم","مجموع حجم","عمق کل","جمع حجم")) fields.Add("total_bid_volume");
        if(orderBookContext&&askContext&&ContainsAny(q,"عمق فروش","کل حجم","مجموع حجم","عمق کل","جمع حجم")) fields.Add("total_ask_volume");
        if(orderBookContext&&bidContext&&ContainsAny(q,"کل تعداد سفارش","مجموع تعداد سفارش","جمع تعداد سفارش")) fields.Add("total_bid_count");
        if(orderBookContext&&askContext&&ContainsAny(q,"کل تعداد سفارش","مجموع تعداد سفارش","جمع تعداد سفارش")) fields.Add("total_ask_count");
        if(orderBookContext&&bidContext&&ContainsAny(q,"ارزش سفارش های خرید","ارزش سفارشات خرید","ارزش سمت خرید")) fields.Add("total_bid_value");
        if(orderBookContext&&askContext&&ContainsAny(q,"ارزش سفارش های فروش","ارزش سفارشات فروش","ارزش سمت فروش")) fields.Add("total_ask_value");
        if(orderBookContext&&ContainsAny(q,"عدم تعادل","عدم‌تعادل","ایمبالانس","imbalance")) fields.Add("orderbook_imbalance");
        if(orderBookContext&&ContainsAny(q,"نسبت عمق خرید به فروش","نسبت حجم خرید به فروش","نسبت تقاضا به عرضه")) fields.Add("depth_ratio");
        if(orderBookContext&&bidContext&&ContainsAny(q,"بزرگترین ردیف","بیشترین حجم کدام سطح","بیشترین حجم کدوم سطح")) fields.Add("largest_bid_level");
        if(orderBookContext&&askContext&&ContainsAny(q,"بزرگترین ردیف","بیشترین حجم کدام سطح","بیشترین حجم کدوم سطح")) fields.Add("largest_ask_level");
        if(orderBookContext&&ContainsAny(q,"یک طرفه","یک‌طرفه","وضعیت اردربوک","وضعیت دفتر سفارش","صف خرید","صف فروش")) fields.Add("orderbook_state");
        if(orderBookContext&&ContainsAny(q,"آخرین به روزرسانی","آخرین بروزرسانی","زمان به روزرسانی اردربوک","زمان بروزرسانی اردربوک","تاریخ به روزرسانی اردربوک","تاریخ بروزرسانی اردربوک","زمان اردربوک","تاریخ اردربوک","زمان جمع آوری","زمان جمع‌آوری","اردربوک چه موقع")) fields.Add("orderbook_observed_at");
        if(orderBookContext&&ContainsAny(q,"bestlimitcounter","کانتر اردربوک","شمارنده اردربوک","نسخه اردربوک")) fields.Add("orderbook_sequence");
        if(orderBookContext&&ContainsAny(q,"سطح دوم","سطح سوم","سطح چهارم","سطح پنجم","ردیف دوم","ردیف سوم","ردیف چهارم","ردیف پنجم","level 2","level 3","level 4","level 5")) fields.Add("orderbook_level");
        if(orderBookContext&&bidContext&&ContainsAny(q,"همه ردیف","تمام ردیف","پنج ردیف","سمت خرید اردربوک")) fields.Add("bid_levels");
        if(orderBookContext&&askContext&&ContainsAny(q,"همه ردیف","تمام ردیف","پنج ردیف","سمت فروش اردربوک")) fields.Add("ask_levels");
        if(orderBookContext&&ContainsAny(q,"اردربوک کامل","اوردر بوک کامل","کل اردربوک","دفتر سفارش کامل","پنج سطح اردربوک","عمق بازار کامل")) fields.Add("orderbook");
        if(orderBookContext&&ContainsAny(q,"اردربوک","اوردر بوک","orderbook","دفتر سفارش","عمق بازار")
            &&!fields.Any(IsOrderBookField)
            &&!fields.Overlaps(["instrument_id","ins_code","identity"])) fields.Add("orderbook");
        Add("market","کدام بازار","کدوم بازار","چه بازاری","نام بازار","در بازار بورس یا فرابورس");
        Add("board","تابلوی معاملاتی","کدام تابلو","کدوم تابلو","چه تابلویی");
        Add("industry","صنعت و زیرصنعت","چه صنعتی","کدام صنعت","گروه صنعتی","گروه صنعت","زیرصنعت");
        Add("state","وضعیت معاملاتی","وضعیت نماد","مجاز است","ممنوع است");

        Add("last_price","آخرین قیمت","قیمت آخر","آخرین نرخ","قیمت لحظه ای","روی چه قیمتی معامله");
        Add("closing_price","قیمت پایانی","پایانی ","چند بسته شد","با چه قیمتی بسته شد");
        Add("trade_volume","حجم معاملات","حجم معامله","حجم دادوستد","حجم آخرین معامله","حجم معامله اش","حجم معامله‌اش","چندتا سهم","چند سهم دست به دست","چند سهم جابه جا","چند سهم جابجا");
        Add("trade_value","ارزش معاملات","ارزش دادوستد");
        Add("market_value","ارزش بازار","سرمایه بازار");
        Add("trade_count","تعداد معاملات","تعداد دادوستد","چند معامله","چند بار معامله");
        Add("pe","p/e","پی بر ای","پی ای","نسبت قیمت به سود");
        Add("eps","eps","ای پی اس","سود هر سهم","سود به ازای هر سهم");

        var clientTypeIntent=CanonicalClientTypeQuestion.Parse(question);
        foreach(var field in clientTypeIntent.Fields)
        {
            if(field=="full") fields.Add("client_type_summary");
            else if(IsClientTypeField(field)) fields.Add(field);
        }

        if(fields.Contains("orderbook_observed_at")) fields.Remove("observed_at");
        var hasSpecificPrice=fields.Overlaps(["last_price","closing_price","first_price","yesterday_price","high_price","low_price","intraday_range"])
            ||fields.Any(IsOrderBookField);
        if(!hasSpecificPrice&&HasWord(q,"قیمت")&&ContainsAny(q,"چنده","چقدر","الان","چه قیمتی")) fields.Add("last_price");

        // Elliptical conjunctions: «حجم، ارزش و تعداد معاملات».
        if(q.Contains("معاملات",StringComparison.Ordinal)||q.Contains("دادوستد",StringComparison.Ordinal))
        {
            if(HasWord(q,"حجم")) fields.Add("trade_volume");
            if(HasWord(q,"ارزش")) fields.Add("trade_value");
            if(HasWord(q,"تعداد")) fields.Add("trade_count");
        }
        if(q.Contains("درصد",StringComparison.Ordinal)&&ContainsAny(q,"بالا رفته","رشد کرده","مثبت شده","پایین آمده","افت کرده","منفی شده"))
            fields.Add("last_price_change_percent");
        if(ContainsAny(q,"بیشترین افت قیمت","بیشترین ریزش قیمت","بیشترین رشد قیمت","بیشترین افزایش قیمت","منفی ترین بازده","منفی‌ترین بازده"))
            fields.Add("last_price_change_percent");

        // «حجم مبنا» is an Instrument field, not yesterday's reference price.
        if(ContainsAny(q,"حجم مبنا","حجم مبنای")) fields.Remove("yesterday_price");

        if(fields.Contains("intraday_range"))
        {
            fields.Remove("high_price");
            fields.Remove("low_price");
        }
        if(fields.Contains("low_price")) fields.Remove("raw_min_value");
        if(fields.Contains("high_price")) fields.Remove("raw_max_value");
        if(fields.Contains("closing_price_change_percent")) fields.Remove("last_price_change_percent");
        if(fields.Contains("mid_price"))
        {
            fields.Remove("best_bid"); fields.Remove("best_bid_price"); fields.Remove("best_bid_volume"); fields.Remove("best_bid_count");
            fields.Remove("best_ask"); fields.Remove("best_ask_price"); fields.Remove("best_ask_volume"); fields.Remove("best_ask_count");
        }
        if(fields.Overlaps(["total_bid_volume","total_bid_count","total_bid_value","largest_bid_level"])) fields.Remove("bid_levels");
        if(fields.Overlaps(["total_ask_volume","total_ask_count","total_ask_value","largest_ask_level"])) fields.Remove("ask_levels");
        if(fields.Any(IsOrderBookField)) fields.Remove("trade_volume");
        if(fields.Any(IsClientTypeField)&&!ContainsAny(q,"حجم معاملات","حجم دادوستد")) fields.Remove("trade_volume");
        if(fields.Contains("turnover_ratio")&&!q.Contains("ارزش معاملات و نسبت",StringComparison.Ordinal))
        {
            fields.Remove("trade_value");
            fields.Remove("market_value");
        }
        if(fields.Contains("average_trade_price")&&!ContainsAny(q,"حجم معاملات و میانگین","ارزش معاملات و میانگین"))
        {
            fields.Remove("trade_value");
            fields.Remove("trade_volume");
        }
        return fields.ToArray();
    }

    public static bool IsOrderBookField(string field) => field is
        "best_bid" or "best_bid_price" or "best_bid_volume" or "best_bid_count" or
        "best_ask" or "best_ask_price" or "best_ask_volume" or "best_ask_count" or
        "orderbook" or "bid_levels" or "ask_levels" or "orderbook_level" or
        "spread" or "spread_percent" or "mid_price" or "total_bid_volume" or "total_ask_volume" or
        "total_bid_count" or "total_ask_count" or "total_bid_value" or "total_ask_value" or
        "orderbook_imbalance" or "depth_ratio" or "largest_bid_level" or "largest_ask_level" or
        "orderbook_state" or "orderbook_observed_at" or "orderbook_sequence";

    public static bool IsClientTypeField(string field) => field is
        "client_type_summary" or "individual_buy_count" or "legal_buy_count" or "individual_sell_count" or "legal_sell_count" or
        "individual_buy_volume" or "legal_buy_volume" or "individual_sell_volume" or "legal_sell_volume" or
        "total_buy_volume" or "total_sell_volume" or "individual_net_volume" or "legal_net_volume" or
        "individual_buy_per_capita" or "individual_sell_per_capita" or "buyer_power" or "buyer_power_signal" or
        "individual_buy_share" or "legal_buy_share" or "individual_sell_share" or "legal_sell_share" or
        "counter" or "updated_at" or "source_collected_at" or "money_value_unavailable";

    public static bool IsScreeningQuestion(string question)
    {
        var q=Normalize(question);
        if(Regex.IsMatch(q,@"(?:نماد|سهم|شرکت)\s*(?:ها|هایی|های)")) return true;
        if(Regex.IsMatch(q,@"(?:^|\s)(?:[0-9۰-۹]+|یک|دو|سه|چهار|پنج|شش|هفت|هشت|نه|ده)\s+(?:نماد|سهم|شرکت)")) return true;
        if(ContainsAny(q,"چه نمادی","کدام نماد","کدوم نماد")&&ContainsAny(q,"بیشترین","کمترین","بالاترین","پایین ترین","پایین‌ترین","برتر","پرحجم")) return true;
        if(HasWord(q,"نماد")&&ContainsAny(q,"بیشترین","کمترین","بالاترین","پایین ترین","پایین‌ترین","برتر","پرحجم")) return true;
        return ContainsAny(q,"چه نمادهایی","کدام نمادها","کدوم نمادها","فهرست نماد","لیست نماد","کدام اند","کدامند");
    }

    public static bool HasKnowledgeFacet(string question)
    {
        var q=Normalize(question);
        return ContainsAny(q,"خبر","اخبار","اطلاعیه","گزارش کدال","مجمع","عرضه اولیه","افزایش سرمایه","سود نقدی","چرا","دلیل","علت","تحلیل بنیادی","معرفی شرکت","تاریخچه","قانون","دستورالعمل");
    }

    private static bool HasWord(string text,string word)=>Regex.IsMatch(text,$@"(?:^|\s){Regex.Escape(word)}(?:\s|$)");
    private static bool ContainsAny(string text,params string[] values)=>values.Any(x=>text.Contains(x,StringComparison.Ordinal));
    private static string Normalize(string value)
    {
        var normalized=PersianDisplayText.Normalize(value).Replace('‌',' ').ToLowerInvariant();
        normalized=normalized.Replace('ي','ی').Replace('ى','ی').Replace('ك','ک').Replace('ة','ه').Replace('ۀ','ه');
        normalized=Regex.Replace(normalized,@"[^\p{L}\p{Nd}/]+"," ");
        return Regex.Replace(normalized,@"\s+"," ").Trim();
    }
}
