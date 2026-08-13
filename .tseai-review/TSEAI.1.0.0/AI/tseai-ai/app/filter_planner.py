import re
from dataclasses import dataclass
from typing import Optional

FA_DIGITS = str.maketrans("۰۱۲۳۴۵۶۷۸۹٠١٢٣٤٥٦٧٨٩", "01234567890123456789")
WORDS={"یک":1,"دو":2,"سه":3,"چهار":4,"پنج":5,"شش":6,"هفت":7,"هشت":8,"نه":9,"ده":10}

@dataclass
class PlannedFilter:
    status: str
    tsetmc_code: Optional[str]
    explanation: str
    confidence: float
    matched_rules: list[str]

def normalize(text: str) -> str:
    return (text or "").translate(FA_DIGITS).replace("ي","ی").replace("ك","ک").replace("‌"," ").replace("٬",",").strip().lower()

def _number(text: str) -> Optional[float]:
    m=re.search(r"(?<![\w])([0-9]+(?:[.,][0-9]+)?)",text)
    if m:return float(m.group(1).replace(",",""))
    for word,value in WORDS.items():
        if re.search(rf"(?:^|\s){word}(?:\s|$)",text):return float(value)
    return None

def _before_equal(text: str, default: float=2) -> float:
    token=r"([0-9]+(?:[.,][0-9]+)?|یک|دو|سه|چهار|پنج|شش|هفت|هشت|نه|ده)"
    m=re.search(token+r"\s*برابر",text)
    if not m:return default
    raw=m.group(1);return float(WORDS[raw]) if raw in WORDS else float(raw.replace(",",""))

def _segment(text: str, phrase: str, size: int=80) -> str:
    i=text.find(phrase);return text[i:i+size] if i>=0 else text

def _money_irr(text: str) -> Optional[int]:
    m=re.search(r"([0-9]+(?:[.,][0-9]+)?)\s*(هزار|میلیون|میلیارد)?\s*(تومان|ریال)?",text)
    if not m:return None
    value=float(m.group(1).replace(",",""));scale={None:1,"هزار":1_000,"میلیون":1_000_000,"میلیارد":1_000_000_000}[m.group(2)]
    return int(round(value*scale*(10 if m.group(3)=="تومان" else 1)))

def _clause_supported(clause:str)->bool:
    checks=[
      ("خرید حقیقی" in clause and "فروش حقیقی" in clause and "برابر" in clause),
      any(k in clause for k in ["قدرت خریدار","قدرت خرید","سرانه خرید"]),
      "صف خرید" in clause,
      ("آخرین قیمت" in clause and "پایانی" in clause),
      ("حجم معاملات" in clause and "حجم مبنا" in clause),
      "تعداد معاملات" in clause,
      "ارزش معاملات" in clause,
      ("اولین قیمت" in clause and "قیمت دیروز" in clause),
      ("نماد" in clause and "شروع" in clause),
    ]
    return any(checks)

def _must_fallback(text:str)->bool:
    unsupported=["rsi","macd","ایچیموکو","میانگین متحرک","بولینگر","سه روز","3 روز","روز قبل","هفته قبل","ماه قبل","سابقه","کندل","حمایت","مقاومت"]
    if any(x in text for x in unsupported):return True
    if " یا " in text and "بیشتر یا مساوی" not in text and "کمتر یا مساوی" not in text:return True
    clauses=[x.strip() for x in re.split(r"\s+و\s+",text) if x.strip()]
    return len(clauses)>1 and any(not _clause_supported(c) for c in clauses)

def interpret_filter(question: str) -> PlannedFilter:
    t=normalize(question);conditions=[];rules=[];explanations=[]
    if _must_fallback(t):return PlannedFilter("no_match",None,"برای جلوگیری از حذف بخشی از شرط، این درخواست باید توسط planner کامل‌تر پردازش شود.",0.0,[])
    if "خرید حقیقی" in t and "فروش حقیقی" in t and "برابر" in t:
        ratio=_before_equal(_segment(t,"خرید حقیقی",120),2);conditions.append(f"(ct).Buy_I_Volume >= {ratio:g} * (ct).Sell_I_Volume");rules.append("individual-buy-volume-ratio");explanations.append(f"حجم خرید حقیقی حداقل {ratio:g} برابر حجم فروش حقیقی")
    if ("قدرت خریدار" in t or "قدرت خرید" in t or "سرانه خرید" in t) and "حقیقی" in t:
        key=next(k for k in ["قدرت خریدار","قدرت خرید","سرانه خرید"] if k in t);ratio=_number(_segment(t,key,50)) or 2
        conditions += ["(ct).Buy_CountI > 0","(ct).Sell_CountI > 0",f"((ct).Buy_I_Volume/(ct).Buy_CountI) >= {ratio:g}*((ct).Sell_I_Volume/(ct).Sell_CountI)"]
        rules.append("individual-buyer-power");explanations.append(f"قدرت خریدار حقیقی حداقل {ratio:g}")
    if "صف خرید" in t:
        conditions.append("(pd1) == (tmax)");rules.append("buy-queue");explanations.append("قیمت خرید ردیف اول برابر سقف مجاز روز")
        seg=_segment(t,"صف خرید",80);m=re.search(r"([0-9]+(?:[.,][0-9]+)?)\s*(هزار|میلیون|میلیارد)?\s*(?:سهم)?",seg)
        if m:
            value=float(m.group(1).replace(",",""));scale={None:1,"هزار":1_000,"میلیون":1_000_000,"میلیارد":1_000_000_000}[m.group(2)];q=int(round(value*scale));conditions.append(f"(qd1) >= {q}");explanations.append(f"حجم خرید ردیف اول حداقل {q:,} سهم")
        else:conditions.append("(qd1) > 0")
    if "آخرین قیمت" in t and "پایانی" in t:
        seg=_segment(t,"آخرین قیمت",70)
        if any(x in seg for x in ["بیشتر","بالاتر","بزرگتر"]):conditions.append("(pl) > (pc)");rules.append("last-above-close");explanations.append("آخرین قیمت بیشتر از قیمت پایانی")
        elif any(x in seg for x in ["کمتر","پایین تر","پایین‌تر"]):conditions.append("(pl) < (pc)");rules.append("last-below-close");explanations.append("آخرین قیمت کمتر از قیمت پایانی")
    if "حجم معاملات" in t and "حجم مبنا" in t and any(x in _segment(t,"حجم معاملات",70) for x in ["بیشتر","بالاتر"]):conditions.append("(tvol) > (bvol)");rules.append("volume-above-base");explanations.append("حجم معاملات بیشتر از حجم مبنا")
    if "تعداد معاملات" in t:
        seg=_segment(t,"تعداد معاملات",60);n=_number(seg)
        if n is not None and any(x in seg for x in ["بیشتر","بالای","حداقل"]):op=">=" if "حداقل" in seg else ">";conditions.append(f"(tno) {op} {int(n)}");rules.append("trade-count");explanations.append(f"تعداد معاملات {op} {int(n)}")
    if "ارزش معاملات" in t:
        seg=_segment(t,"ارزش معاملات",80);amount=_money_irr(seg)
        if amount is not None:
            op="<" if any(x in seg for x in ["کمتر","زیر"]) else "<=" if "حداکثر" in seg else ">=" if "حداقل" in seg else ">"
            conditions.append(f"(tval) {op} {amount}");rules.append("trade-value");explanations.append(f"ارزش معاملات {op} {amount:,} ریال")
    if "اولین قیمت" in t and "قیمت دیروز" in t and any(x in _segment(t,"اولین قیمت",70) for x in ["بیشتر","بالاتر","مساوی"]):conditions.append("(pf) >= (py)");rules.append("first-vs-yesterday");explanations.append("اولین قیمت بیشتر یا مساوی قیمت دیروز")
    m=re.search(r'نماد(?:هایی)?[^\n]{0,25}با\s+[\'\"]?([^\s\'\"]+)[\'\"]?\s+شروع',t)
    if m:value=m.group(1);conditions.append(f'(l18).indexOf("{value}") == 0');rules.append("symbol-prefix");explanations.append(f"نماد با {value} شروع شود")
    conditions=list(dict.fromkeys(conditions))
    if not conditions:return PlannedFilter("no_match",None,"درخواست به یک فیلتر مطمئن V1 تبدیل نشد.",0.0,[])
    return PlannedFilter("ok"," && ".join(conditions)," و ".join(explanations),min(0.99,0.84+0.03*len(rules)),rules)
