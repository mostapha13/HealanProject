import re
from dataclasses import dataclass

@dataclass
class ChatPlan:
    intent:str
    symbol:str|None
    knowledge_query:str|None
    confidence:float
    clarification:str|None
    reasons:list[str]

FILTER_WORDS=("فیلتر","نمادهایی","سهم‌هایی","صف خرید","صف فروش","حجم بیشتر","قیمت بیشتر","حقیقی","حقوقی","p/e","پی بر ای")
KNOWLEDGE_WORDS=("چرا","دلیل","خبر","اطلاعیه","گزارش","کدال","مجمع","افزایش سرمایه","سود نقدی","هیئت مدیره","اختیار معامله","قانون","دستورالعمل")
MARKET_WORDS=("قیمت","پایانی","حجم","ارزش معاملات","وضعیت","صف خرید","صف فروش","eps","p/e","شاخص","اردربوک","سفارش خرید","سفارش فروش")
STOP={"قیمت","آخرین","پایانی","حجم","نماد","سهم","امروز","فردا","پس","پریروز","دیروز","روز","هفته","ماه","سال","بعد","قبل","پیش","اخیر","جاری","گذشته","آینده","الان","وضعیت","چنده","چقدر","چیست","چیه","بود","بوده","هست","است","را","رو","برای","از","تا","به","در","چرا",
      "فروردین","اردیبهشت","خرداد","تیر","مرداد","شهریور","مهر","آبان","آذر","دی","بهمن","اسفند",
      "چطور","چطوره","چگونه","کرد","کرده","شد","شده","میشه","میشود","می‌شود","افت","رشد","مثبت","منفی","خبر","اطلاعیه","گزارش"}

EXPLICIT_MARKET_WORDS=("قیمت","پایانی","حجم","ارزش معاملات","صف خرید","صف فروش","eps","p/e","شاخص","اردر‌بوک","سفارش خرید","سفارش فروش","نماد","سهام","بازار","امروز","الان")

TOKEN_RE=re.compile(r"[آ-یA-Za-z][آ-یA-Za-z0-9_-]{0,31}")

def _is_stop(token:str)->bool:
    return token.lower() in STOP

def _entity_hint(q:str)->str|None:
    # TSETMC InsCode is a long numeric identifier; dates are much shorter and use separators.
    numeric_id=re.search(r"(?<![۰-۹٠-٩0-9])([۰-۹٠-٩0-9]{10,20})(?![۰-۹٠-٩0-9])",q)
    if numeric_id:return numeric_id.group(1)

    tokens=TOKEN_RE.findall(q)
    if not tokens:return None

    # Explicit market entity cue has priority, but can still be a multi-word company name.
    cue_index=next((i for i,t in enumerate(tokens) if t in ("نماد","سهم")),None)
    if cue_index is not None:
        phrase=[]
        for t in tokens[cue_index+1:cue_index+9]:
            if _is_stop(t):break
            phrase.append(t)
        if phrase:return " ".join(phrase)

    # Deterministic contiguous phrase extraction. Generic market/temporal words split runs.
    runs=[]; current=[]
    for t in tokens:
        if _is_stop(t):
            if current:runs.append(current);current=[]
            continue
        if len(t)>24:
            if current:runs.append(current);current=[]
            continue
        current.append(t)
        if len(current)==8:
            runs.append(current);current=[]
    if current:runs.append(current)
    if not runs:return None

    # Prefer the longest contiguous phrase; on ties prefer the rightmost one.
    best=max(enumerate(runs),key=lambda x:(len(x[1]),x[0]))[1]
    return " ".join(best)

def plan_chat(question:str)->ChatPlan:
    q=" ".join(question.strip().split())
    if len(q)<2:return ChatPlan("clarification",None,None,0.0,"سؤال را کمی کامل‌تر بنویسید.",["too-short"])
    low=q.lower()
    f=any(x in low for x in FILTER_WORDS)
    k=any(x in low for x in KNOWLEDGE_WORDS)
    m=any(x in low for x in MARKET_WORDS)
    company_state_question=("وضعیت" in low and any(x in low for x in ("چه وضعیتی","در چه وضعیت"))
                            and not any(x in low for x in EXPLICIT_MARKET_WORDS))
    has_entity_cue=bool(re.search(r"(?:نماد|سهم|شرکت)\s+",q))
    symbol=_entity_hint(q) if (m or has_entity_cue) else None
    if f:return ChatPlan("marketfilter",None,None,0.93,None,["filter-language"])
    if company_state_question:return ChatPlan("knowledge",None,q,0.9,None,["company-state-knowledge"])
    if k and m and symbol:return ChatPlan("hybrid",symbol,q,0.88,None,["knowledge-language","market-language","entity-hint-detected"])
    if k:return ChatPlan("knowledge",symbol,q,0.86,None,["knowledge-language"])
    if m and symbol:return ChatPlan("marketsymbol",symbol,None,0.84,None,["market-language","entity-hint-detected"])
    if m:return ChatPlan("clarification",None,None,0.65,"نماد موردنظر را مشخص کنید.",["market-language","entity-hint-missing"])
    return ChatPlan("knowledge",None,q,0.58,None,["knowledge-safe-default"])
