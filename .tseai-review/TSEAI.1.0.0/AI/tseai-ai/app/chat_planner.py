import re
from dataclasses import dataclass

@dataclass
class ChatPlan:
    intent: str
    symbol: str | None
    knowledge_query: str | None
    confidence: float
    clarification: str | None
    reasons: list[str]
    requested_fields: list[str] | None = None

FILTER_WORDS=(
    "فیلتر","نمادهایی","سهم‌هایی","حجم بیشتری","حجم بیشتر","قیمت بیشتر","بیشترین","قیمتی",
    "حق تقدم","حق‌تقدم","p/e","پی بر ای"
)

KNOWLEDGE_WORDS=(
    "چرا","دلیل","خبر","اطلاعیه","گزارش","کدال","مجمع","افزایش سرمایه","سود نقدی",
    "هیئت مدیره","اختیار معامله","قانون","دستورالعمل","استراتژی","مسئول","مسئولیّت","مسئولیت"
)

MARKET_WORDS=(
    "قیمت","پایانی","حجم","ارزش معاملات","وضعیت","صف خرید","صف فروش","eps","p/e","شاخص",
    "آردربوک","آردربوک","سفارش خرید","سفارش فروش","امروز","دیروز","فردا","پایانی",
    "حجم معاملات","ارزش بازار","ارزش","بالاترین قیمت","کمترین قیمت","قیمت آغازین","اولین معامله",
    "قیمت مبنا","اثر بر شاخص","اثر روی شاخص","بازار و تابلو","صنعت","دامنه نوسان"
)

EXPLICIT_MARKET_WORDS=(
    "قیمت","پایانی","حجم","حجم معاملات","ارزش","ارزش معاملات","صف خرید","صف فروش","eps","p/e",
    "شاخص","آدرربوک","سفارش خرید","سفارش فروش","نماد","سهم","امروز","الان","پایانی روز",
    "اولین معامله","قیمت آغازین","قیمت بازگشایی","قیمت دیروز","قیمت مبنا","سقف قیمت","کف قیمت",
    "اثر روی شاخص","اثر بر شاخص","تابلو","صنعت","دامنه نوسان"
)

STOP=(
    "قیمت","آخرین","پایانی","حجم","نماد","سهم","امروز","فردا","پس","پریروز","دیروز","روز","هفته","ماه","سال","بعد","قبل","پیش","اخیر","الان","وضعیت",
    "چنده","چقدر","چیه","بود","بوده","هست","است","را","رو","برای","از","تا","به","در","چرا",
    "فروردین","اردیبهشت","خرداد","تیر","مرداد","شهریور","مهر","آبان","آذر","دی","بهمن","اسفند",
    "چطور","چطوره","چگونه","کرد","کرده","شد","شده","میشه","میشود","می‌شود","افت","رشد","مثبت","منفی","خبر","اطلاعیه","گزارش","امروز",
    "مربوط","مربوطه","مربوطشه","مربوطه‌اش","تاریخی","چه","چند","چیه","چیست",
    "چند","چنده","چه","چهطور","چهطور؟","کیه","که","است","هست","است؟","می","می‌شود","کند","کرده","بود","هستید","چهنده","چند?",
    "ببین","می‌پرسم","گزارشات","آیا","و","وضعیتش","بود","بودن","شد","شدن","تا","این","اون","اینکه","یا","چهار","پنج","ش"
)

FIELD_ALIASES=(
    ("instrument_id",("instrumentid","instrument id","شناسه ابزار")),
    ("ins_code",("inscode","ins code","کد اینس")),
    ("effect_on_index",("اثر روی شاخص","اثر بر شاخص","تاثیر روی شاخص","تأثیر روی شاخص","اثر شاخص")),
    ("closing_price_change_percent",("درصد تغییر قیمت پایانی","درصد تغییر پایانی")),
    ("closing_price_change",("تغییر قیمت پایانی","تغییر پایانی")),
    ("last_price_change_percent",("درصد تغییر آخرین قیمت","درصد تغییر قیمت آخر","درصد تغییر")),
    ("last_price_change",("تغییر آخرین قیمت","تغییر قیمت آخر")),
    ("first_price",("اولین قیمت","قیمت اولین معامله","قیمت آغازین","قیمت بازگشایی")),
    ("yesterday_price",("قیمت دیروز","قیمت روز قبل","قیمت مبنا")),
    ("high_price",("بالاترین قیمت","بیشترین قیمت","سقف قیمت","حداکثر قیمت روز")),
    ("low_price",("کمترین قیمت","پایین ترین قیمت","پایین‌ترین قیمت","کف قیمت","حداقل قیمت روز")),
    ("average_trade_price",("میانگین قیمت معامله","متوسط قیمت معامله")),
    ("average_trade_value",("میانگین ارزش هر معامله","متوسط ارزش هر معامله")),
    ("average_trade_volume",("میانگین حجم هر معامله","متوسط حجم هر معامله")),
    ("turnover_ratio",("نسبت گردش معاملات","نسبت ارزش معاملات به ارزش بازار")),
    ("intraday_range",("دامنه نوسان روز","بازه قیمت روز","فاصله سقف و کف")),
    ("closing_price",("قیمت پایانی","پایانی")),
    ("last_price",("آخرین قیمت","قیمت آخر","آخرین نرخ")),
    ("trade_volume",("حجم معاملات","حجم دادوستد","چند سهم")),
    ("trade_value",("ارزش معاملات","ارزش دادوستد")),
    ("market_value",("ارزش بازار","سرمایه بازار")),
    ("trade_count",("تعداد معاملات","تعداد دادوستد","چند معامله")),
    ("pe",("p/e","پی بر ای","پی ای","نسبت قیمت به سود")),
    ("eps",("eps","ای پی اس","سود هر سهم","سود به ازای هر سهم")),
    ("best_bid_volume",("حجم بهترین سفارش خرید","حجم سرخط خرید","حجم بهترین تقاضا")),
    ("best_bid_count",("تعداد سفارش بهترین خرید","تعداد سفارش سرخط خرید")),
    ("best_bid_price",("بهترین قیمت خرید","قیمت سرخط خرید")),
    ("best_ask_volume",("حجم بهترین سفارش فروش","حجم سرخط فروش","حجم بهترین عرضه")),
    ("best_ask_count",("تعداد سفارش بهترین فروش","تعداد سفارش سرخط فروش")),
    ("best_ask_price",("بهترین قیمت فروش","قیمت سرخط فروش")),
    ("best_bid",("بهترین سفارش خرید","بهترین خرید","تقاضای برتر")),
    ("best_ask",("بهترین سفارش فروش","بهترین فروش","عرضه برتر")),
    ("spread_percent",("درصد اختلاف مظنه","درصد اسپرد")),
    ("spread",("اختلاف مظنه","اسپرد","فاصله خرید و فروش")),
    ("mid_price",("قیمت میانی","میانگین بهترین خرید و فروش")),
    ("total_bid_volume",("عمق خرید","مجموع حجم خرید","کل حجم خرید")),
    ("total_ask_volume",("عمق فروش","مجموع حجم فروش","کل حجم فروش")),
    ("total_bid_count",("مجموع تعداد سفارش خرید","کل تعداد سفارش خرید")),
    ("total_ask_count",("مجموع تعداد سفارش فروش","کل تعداد سفارش فروش")),
    ("orderbook_imbalance",("عدم تعادل اردربوک","ایمبالانس اردربوک")),
    ("depth_ratio",("نسبت عمق خرید به فروش","نسبت تقاضا به عرضه")),
    ("orderbook_observed_at",("آخرین به روزرسانی اردربوک","آخرین بروزرسانی اردربوک","زمان به روزرسانی اردربوک","زمان بروزرسانی اردربوک","تاریخ به روزرسانی اردربوک","تاریخ بروزرسانی اردربوک","زمان اردربوک","تاریخ اردربوک","اردربوک چه موقع")),
    ("orderbook_sequence",("bestlimitcounter","کانتر اردربوک","نسخه اردربوک")),
    ("orderbook",("اردربوک کامل","دفتر سفارش کامل","پنج سطح اردربوک")),
    ("board",("تابلو",)),
    ("industry",("صنعت","گروه صنعت")),
    ("state",("وضعیت معاملاتی","وضعیت نماد","مجاز","ممنوع")),
    ("market",("کدام بازار","چه بازاری","بازار و تابلو")),
    ("observed_at",("چه تاریخی","چه تاریخ","زمان ثبت","تاریخ داده","آخرین به روزرسانی","آخرین بروزرسانی")),
)

def _requested_market_fields(question:str)->list[str]:
    low=question.lower().replace("ي","ی").replace("ك","ک").replace("‌"," ")
    fields=[]
    for field,aliases in FIELD_ALIASES:
        if any(alias in low for alias in aliases): fields.append(field)
    if any(x in fields for x in ("best_bid_price","best_bid_volume","best_bid_count")) and "best_bid" in fields:
        fields.remove("best_bid")
    if any(x in fields for x in ("best_ask_price","best_ask_volume","best_ask_count")) and "best_ask" in fields:
        fields.remove("best_ask")
    if "orderbook_observed_at" in fields and not any(x in low for x in ("اردربوک کامل","اوردر بوک کامل","دفتر سفارش کامل","کل اردربوک","پنج سطح","همه ردیف","تمام ردیف")):
        fields=[x for x in fields if x not in ("orderbook","bid_levels","ask_levels","orderbook_level","observed_at")]
    return list(dict.fromkeys(fields))

MARKET_ENTITY_LEAD_NOISE=(
    "فروش","خرید","نسبت","سهم","نماد","سهام","ایرانی","برای","به","از","در",
    "تعداد","چند","چقدر","فهرست","آماده","به‌روزرسانی","بخش","حجم","قیمت","صف","صفحه","فروشنده","خریدار",
)

MARKET_ENTITY_TRAIL_NOISE=(
    "را","رو","می‌کند","می‌کند؟","کرده","بود","های","است","است؟","هست","بود","چند","است.","هست؟","در","امروز","مربوط","مربوطه","به","چه","تاریخی",
    "پایان","قیمت","حجم","حجمش","حجمی","بیشتر","فروش","خرید","صف","صفی","کن","کن؟","کدام","چیست","چیه",
)

TOKEN_RE = re.compile(r"[آ-یA-Za-z][آ-یA-Za-z0-9_-]{0,31}")

def _is_stop(token:str) -> bool:
    return token.lower() in STOP

def _trim_entity_noise(tokens:list[str]) -> list[str]:
    if not tokens:
        return []
    left = 0
    right = len(tokens)
    while left < right and tokens[left] in MARKET_ENTITY_LEAD_NOISE:
        left += 1
    while right > left and tokens[right-1] in MARKET_ENTITY_TRAIL_NOISE:
        right -= 1
    return tokens[left:right]

def _entity_hint(q:str) -> str | None:
    # TSETMC InsCode is a long numeric identifier; dates are much shorter and use separators.
    numeric_id = re.search(r"(?<![۰-۹٠-٩0-9])([۰-۹٠-٩0-9]{10,20})(?![۰-۹٠-٩0-9])", q)
    if numeric_id:
        return numeric_id.group(1)

    tokens = TOKEN_RE.findall(q)
    if not tokens:
        return None

    # Explicit market entity cues are the strongest signals (نماد / سهم)
    cue_index = next((i for i,t in enumerate(tokens) if t in ("نماد","سهم")), None)
    if cue_index is not None:
        phrase = []
        for t in tokens[cue_index+1 : cue_index+10]:
            if _is_stop(t):
                break
            phrase.append(t)
        phrase = _trim_entity_noise(phrase)
        if phrase:
            return " ".join(phrase)

    # Deterministic contiguous phrase extraction; generic market/temporal words split runs.
    runs = []
    current = []
    for t in tokens:
        if _is_stop(t):
            if current:
                runs.append(current)
                current = []
            continue
        if len(t) > 24:
            if current:
                runs.append(current)
                current = []
            continue
        current.append(t)
        if len(current) == 8:
            runs.append(current)
            current = []
    if current:
        runs.append(current)
    if not runs:
        return None

    cleaned = [_trim_entity_noise(run) for run in runs]
    cleaned = [run for run in cleaned if run]
    if not cleaned:
        return None

    # Prefer the longest contiguous phrase; on ties keep the rightmost relevant one.
    best = max(enumerate(cleaned), key=lambda x: (len(x[1]), x[0]))[1]
    if not best:
        return None
    return " ".join(best)

def plan_chat(question:str)->ChatPlan:
    q = " ".join(question.strip().split())
    if len(q) < 2:
        return ChatPlan("clarification", None, None, 0.0, "سؤال را کمی کامل‌تر بنویسید.", ["too-short"])

    low = q.lower()
    f = any(x in low for x in FILTER_WORDS)
    k = any(x in low for x in KNOWLEDGE_WORDS)
    market_metric = any(x in low for x in MARKET_WORDS if x != "وضعیت")
    m = market_metric or "وضعیت" in low

    market_state_question = "وضعیت" in low and ("امروز" in low or market_metric)
    company_state_question = ("چه" in low or "چطور" in low or "چیست" in low or "کیست" in low or "کیه" in low) and (
        "وضعیت" in low or "وضع" in low
    ) and not market_state_question

    has_entity_cue = bool(re.search(r"(?:نماد|سهم)\s+", q))
    symbol = _entity_hint(q) if (m or has_entity_cue) else None

    if f:
        return ChatPlan("marketfilter", None, None, 0.93, None, ["filter-language"])
    if company_state_question:
        return ChatPlan("knowledge", None, q, 0.9, None, ["company-state-knowledge"])
    if k and m and symbol:
        return ChatPlan("hybrid", symbol, q, 0.88, None, ["knowledge-language","market-language","entity-hint-detected"],_requested_market_fields(q))
    if k:
        return ChatPlan("knowledge", symbol, q, 0.86, None, ["knowledge-language"])
    if m and symbol:
        return ChatPlan("marketsymbol", symbol, None, 0.84, None, ["market-language","entity-hint-detected"],_requested_market_fields(q))
    if m:
        return ChatPlan("clarification", None, None, 0.65, "نماد موردنظر را مشخص کنید.", ["market-language","entity-hint-missing"])
    return ChatPlan("knowledge", None, q, 0.58, None, ["knowledge-safe-default"])
