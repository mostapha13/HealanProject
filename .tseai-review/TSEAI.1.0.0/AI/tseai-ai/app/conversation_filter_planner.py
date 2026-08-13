import re
from dataclasses import dataclass
from typing import Optional
from .filter_planner import interpret_filter, normalize, _money_irr

ORDINALS={"اول":1,"اولین":1,"دوم":2,"دومین":2,"سوم":3,"سومین":3,"چهارم":4,"پنجم":5,"ششم":6,"هفتم":7,"هشتم":8,"نهم":9,"دهم":10}
FIELD_TERMS={
    "ارزش معاملات":"tval",
    "حجم معاملات":"tvol",
    "تعداد معاملات":"tno",
    "آخرین قیمت":"pl",
    "قیمت پایانی":"pc",
    "اولین قیمت":"pf",
    "قیمت دیروز":"py",
    "حجم مبنا":"bvol",
    "ارزش بازار":"mv",
    "p/e":"pe",
    "پی به ای":"pe",
    "نسبت پی به ای":"pe",
    "eps":"eps",
    "ای پی اس":"eps",
    "بیشترین قیمت":"pmax",
    "کمترین قیمت":"pmin",
}

@dataclass
class ConversationPlan:
    status:str
    operation:str
    tsetmc_code:Optional[str]
    condition_index:Optional[int]
    field_code:Optional[str]
    explanation:str
    confidence:float
    matched_rules:list[str]

def _ok(operation, code=None, index=None, field=None, explanation="", confidence=.96, rules=None):
    return ConversationPlan("ok",operation,code,index,field,explanation,confidence,rules or [])

def _no(message):
    return ConversationPlan("no_match","none",None,None,None,message,0.0,[])

def _condition_index(text:str)->Optional[int]:
    m=re.search(r"شرط\s*(\d+)",text)
    if m:return int(m.group(1))
    for word,index in ORDINALS.items():
        if re.search(rf"شرط\s+{word}",text):return index
    return None

def _field_from_text(text:str)->Optional[str]:
    for phrase,field in FIELD_TERMS.items():
        if phrase in text:return field
    return None

def _scaled_number(text:str)->Optional[float]:
    m=re.search(r"([0-9]+(?:[.,][0-9]+)?)\s*(هزار|میلیون|میلیارد)?",text)
    if m:
        value=float(m.group(1).replace(",","")); scale={None:1,"هزار":1_000,"میلیون":1_000_000,"میلیارد":1_000_000_000}[m.group(2)]
        return value*scale
    words={"یک":1,"دو":2,"سه":3,"چهار":4,"پنج":5,"شش":6,"هفت":7,"هشت":8,"نه":9,"ده":10}
    for word,value in words.items():
        if re.search(rf"(?:^|\s){word}(?:\s|$)",text):return float(value)
    return None

def _pick_condition_index(text:str,conditions:list[str])->Optional[int]:
    explicit=_condition_index(text)
    if explicit:return explicit if 1<=explicit<=len(conditions) else None
    field=_field_from_text(text)
    if field:
        for i,c in enumerate(conditions,1):
            if f"({field})" in c:return i
    if "صف" in text:
        for i,c in reversed(list(enumerate(conditions,1))):
            if "(qd1)" in c or "(pd1)" in c:return i
    return len(conditions) if conditions else None

def _replace_numeric_condition(condition:str,text:str)->Optional[str]:
    # Replace only a terminal comparison literal; never touch digits in qd1/pd1 field names.
    m=re.search(r"(>=|<=|==|!=|>|<)\s*([0-9]+(?:\.[0-9]+)?)\s*$",condition)
    if not m:return None
    is_money="(tval)" in condition or "(mv)" in condition
    value=_money_irr(text) if is_money else _scaled_number(text)
    if value is None:return None
    op=m.group(1)
    if "حداقل" in text:op=">="
    elif "حداکثر" in text:op="<="
    elif any(x in text for x in ["کمتر","زیر","پایین تر","پایین‌تر"]):op="<"
    elif any(x in text for x in ["بیشتر","بالای","بالاتر"]):op=">"
    rendered = str(int(value)) if isinstance(value,(int,float)) and float(value).is_integer() else str(value)
    return condition[:m.start(1)] + f"{op} {rendered}"

def _remove_group(text:str,conditions:list[str])->Optional[str]:
    if "صف خرید" in text:
        remaining=[c for c in conditions if "(pd1)" not in c and "(qd1)" not in c]
        return " && ".join(remaining) if len(remaining)!=len(conditions) else None
    if any(x in text for x in ["قدرت خرید","قدرت خریدار","سرانه خرید"]):
        remaining=[c for c in conditions if "(ct).Buy_CountI" not in c and "(ct).Sell_CountI" not in c and not ("(ct).Buy_I_Volume" in c and "(ct).Sell_I_Volume" in c)]
        return " && ".join(remaining) if len(remaining)!=len(conditions) else None
    return None

def interpret_conversation(question:str,current_code:Optional[str],current_conditions:list[str])->ConversationPlan:
    t=normalize(question)
    has_current=bool(current_code and current_conditions)

    if any(x in t for x in ["نسخه قبل","برگرد به قبل","برگرد قبلی","undo","یک مرحله برگرد"]):
        return _ok("undo",explanation="بازگشت به نسخه قبلی فیلتر",rules=["undo"])
    if any(x in t for x in ["redo","دوباره اعمال","نسخه بعد"]):
        return _ok("redo",explanation="اعمال مجدد نسخه بعدی فیلتر",rules=["redo"])
    if any(x in t for x in ["فیلتر رو توضیح","فیلتر را توضیح","توضیح فیلتر","شرط ها رو توضیح","شرط‌ها رو توضیح"]):
        return _ok("explain",explanation="توضیح فیلتر و شرط‌های فعال",rules=["explain"])
    if any(x in t for x in ["فیلتر رو اجرا","فیلتر را اجرا","اجراش کن","همین رو اجرا","همین را اجرا"]):
        return _ok("execute",explanation="اجرای فیلتر فعلی",rules=["execute"])
    if any(x in t for x in ["فیلتر فعلی","شرط های فعلی","شرط‌های فعلی","نمایش فیلتر","چی گذاشتی","فیلترم چیه"]):
        return _ok("show",explanation="نمایش فیلتر فعلی",rules=["show"])
    if any(x in t for x in ["همه شرط", "کل فیلتر رو پاک", "فیلتر رو پاک", "فیلتر را پاک", "فیلتر رو حذف کن"]):
        return _ok("clear",explanation="پاک کردن فیلتر فعال",rules=["clear"])

    if has_current and "حذف" in t:
        grouped=_remove_group(t,current_conditions)
        if grouped is not None:
            return _ok("replace_all",grouped,explanation="حذف گروه شرط درخواستی",rules=["remove-group"]) if grouped else _ok("clear",explanation="حذف آخرین گروه شرط و پاک شدن فیلتر",rules=["remove-group","clear"])
        idx=_condition_index(t)
        if idx:
            return _ok("remove_condition",index=idx,explanation=f"حذف شرط شماره {idx}",rules=["remove-index"])
        if any(x in t for x in ["آخرین شرط","این شرط","شرط آخری"]):
            return _ok("remove_last",explanation="حذف آخرین شرط",rules=["remove-last"])
        field=_field_from_text(t)
        if field:
            return _ok("remove_field",field=field,explanation=f"حذف شرط مربوط به ({field})",rules=["remove-field"])

    # Explicit conversational additions take precedence over generic "بذار/کن" change verbs.
    if has_current and ("اضافه" in t or " هم " in f" {t} "):
        planner_question=question
        if ("قدرت خرید" in t or "قدرت خریدار" in t or "سرانه خرید" in t) and "حقیقی" not in t:
            planner_question=question+" حقیقی"
        addition=interpret_filter(planner_question)
        if addition.status=="ok" and addition.tsetmc_code:
            return _ok("add",addition.tsetmc_code,explanation="افزودن شرط به فیلتر فعلی: "+addition.explanation,confidence=addition.confidence,rules=addition.matched_rules+["conversation-add"])

    # Explicit replacement with raw TSETMC condition inside a conversational edit.
    if has_current and any(x in t for x in ["جایگزین","عوض کن","تغییر بده","تغییرش بده"]) and re.search(r"\([a-z0-9_.]+\).*?(>=|<=|==|!=|>|<)",t,re.I):
        idx=_pick_condition_index(t,current_conditions)
        if idx:
            m=re.search(r"(\([a-z0-9_.]+\)\s*(?:>=|<=|==|!=|>|<)\s*(?:\([a-z0-9_.]+\)|[0-9]+(?:\.[0-9]+)?))",t,re.I)
            if m:
                return _ok("replace_condition",m.group(1).strip(),index=idx,explanation=f"جایگزینی شرط شماره {idx}",confidence=.99,rules=["replace-dsl"])

    # Numeric modification of an existing condition: "حدش را 30 میلیارد کن" / "شرط دوم را 50 میلیون کن".
    change_words=["تغییر","بکن","کن","بذار","بگذار","حدش","مقدارش","عددش"]
    if has_current and any(x in t for x in change_words) and re.search(r"\d|یک|دو|سه|چهار|پنج|شش|هفت|هشت|نه|ده",t):
        idx=_pick_condition_index(t,current_conditions)
        if idx:
            replacement=_replace_numeric_condition(current_conditions[idx-1],t)
            if replacement:
                return _ok("replace_condition",replacement,index=idx,explanation=f"تغییر مقدار شرط شماره {idx}",confidence=.98,rules=["replace-value"])

    planner_question=question
    if has_current and ("قدرت خرید" in t or "قدرت خریدار" in t or "سرانه خرید" in t) and "حقیقی" not in t:
        planner_question=question+" حقیقی"
    standalone=interpret_filter(planner_question)
    if standalone.status=="ok" and standalone.tsetmc_code:
        if not has_current or any(x in t for x in ["فیلتر جدید","از اول","جایگزین","همه رو عوض"]):
            return _ok("create",standalone.tsetmc_code,explanation=standalone.explanation,confidence=standalone.confidence,rules=standalone.matched_rules)
        return _ok("add",standalone.tsetmc_code,explanation="افزودن شرط به فیلتر فعلی: "+standalone.explanation,confidence=standalone.confidence,rules=standalone.matched_rules+["conversation-add"])

    return _no("درخواست ویرایش فیلتر با اطمینان کافی تشخیص داده نشد.")
