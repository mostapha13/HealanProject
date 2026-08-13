from __future__ import annotations
import hashlib
import re
from dataclasses import replace
from typing import Any
from .models import KnowledgeDocument
from .html_sanitizer import html_to_text
from .normalization import normalize_persian, normalize_for_search
from .content_policy import decide_route

_TOPIC_RULES: tuple[tuple[str,tuple[str,...]],...]=(
    ("capital_increase",("افزایش سرمایه",)),
    ("assembly",("مجمع", "مجمع عمومی")),
    ("market_maker",("بازارگردان", "بازارگردانی")),
    ("option",("اختیار معامله", "اختیار خرید", "اختیار فروش")),
    ("future",("قرارداد آتی", "بازار آتی")),
    ("bond",("اوراق بدهی", "اوراق مشارکت", "صکوک")),
    ("fund",("صندوق سرمایه", "صندوق سرمایه گذاری")),
    ("suspension",("تعلیق", "متوقف", "توقف نماد")),
    ("listing",("پذیرش", "درج نماد")),
    ("dividend",("سود نقدی", "سود سهام")),
)


def _as_int(value:Any)->int|None:
    try:
        if value is None or value=="": return None
        return int(value)
    except (TypeError,ValueError): return None


def _as_bool(value:Any)->bool:
    if isinstance(value,bool): return value
    return str(value or "").strip().lower() in {"1","true","yes","y"}


def _normalize_list(value:Any)->list[str]:
    if value is None: return []
    if isinstance(value,(list,tuple,set)): raw=list(value)
    else: raw=re.split(r"[|,;\n]+",str(value))
    out=[]; seen=set()
    for item in raw:
        text=normalize_persian(str(item)).strip()
        key=normalize_for_search(text)
        if text and key and key not in seen:
            seen.add(key); out.append(text)
    return out[:100]


def detect_topics(title:str,text:str,existing:Any=None)->list[str]:
    topics=_normalize_list(existing)
    normalized=normalize_for_search(f"{title} {text}")
    seen={x.lower() for x in topics}
    for topic,patterns in _TOPIC_RULES:
        if topic in seen: continue
        if any(normalize_for_search(p) in normalized for p in patterns):
            topics.append(topic); seen.add(topic)
    return topics[:50]


def compute_content_hash(source_type:str,title:str,text:str,metadata:dict[str,Any])->str:
    semantic_meta="|".join(str(metadata.get(k) or "") for k in ("content_type_id","language_id","route","category_id"))
    material=f"{source_type}\n{normalize_for_search(title)}\n{normalize_for_search(text)}\n{semantic_meta}"
    return hashlib.sha256(material.encode("utf-8")).hexdigest()


def compute_text_hash(source_type:str,title:str,text:str)->str:
    material=f"{source_type}\n{normalize_for_search(title)}\n{normalize_for_search(text)}"
    return hashlib.sha256(material.encode("utf-8")).hexdigest()


def prepare_document(document:KnowledgeDocument)->tuple[KnowledgeDocument|None,str]:
    metadata=dict(document.metadata or {})
    if _as_bool(metadata.get("is_deleted")):
        return None,"deleted"

    title=normalize_persian(html_to_text(document.title))
    text=normalize_persian(html_to_text(document.body))
    if document.source_type == "faq" and not text:
        return None,"faq-without-answer"
    content_type_id=_as_int(metadata.get("content_type_id"))
    decision=decide_route(document.source_type,content_type_id,text)
    if not decision.indexable:
        return None,decision.reason

    symbols=_normalize_list(metadata.get("symbols") or document.symbol)
    companies=_normalize_list(metadata.get("companies"))
    persons=_normalize_list(metadata.get("persons"))
    topics=detect_topics(title,text,metadata.get("topics"))
    metadata.update({
        "route":decision.route,
        "authority":decision.authority,
        "content_type_id":content_type_id,
        "symbols":symbols,
        "companies":companies,
        "persons":persons,
        "topics":topics,
        "body_plain_text":True,
        "sanitizer":"stdlib-htmlparser-v1",
    })
    metadata["content_hash"]=compute_content_hash(document.source_type,title,text,metadata)
    metadata["text_hash"]=compute_text_hash(document.source_type,title,text)
    if document.source_type == "company_state":
        reasons=[x.strip(" •-\t") for x in re.split(r"\n+|\s*[؛;]\s*",text) if x.strip(" •-\t")]
        metadata["reason_count"]=len(reasons)
    if document.source_type == "download_center":
        metadata["download_mode"]="page_link_only"
    symbol=symbols[0] if len(symbols)==1 else document.symbol
    return replace(document,title=title or document.title.strip(),body=text,symbol=symbol,metadata=metadata),decision.reason
