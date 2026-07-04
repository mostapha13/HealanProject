"""فیلتر و rerank بر اساس intent، تخصص، منطقه و تاریخ."""

from __future__ import annotations

import re
import unicodedata

from app.rag.intent import (
    QueryIntent,
    compare_persian_date,
    detect_intent,
    get_today_persian,
    parse_persian_date,
)

SPECIALTY_KEYWORDS: dict[str, list[str]] = {
    "قلب و عروق": ["قلب", "قلب و عروق", "کاردیولوژ", "cardio"],
    "اطفال": ["اطفال", "کودک", "نوزاد", "pediatric"],
    "پوست و مو": ["پوست", "مو", "derma"],
    "ارتوپدی": ["ارتوپد", "استخوان", "مفصل"],
    "داخلی": ["داخلی", "internal"],
    "چشم‌پزشکی": ["چشم", "چشم پزشک", "ophthalm"],
    "گوش و حلق و بینی": ["گوش", "حلق", "بینی", "ent"],
    "روانپزشکی": ["روان", "روانپزش", "psych"],
    "زنان و زایمان": ["زنان", "زایمان", "obgyn"],
    "عمومی": ["عمومی", "general"],
}

DISTRICT_KEYWORDS: dict[str, list[str]] = {
    "ونک": ["ونک"],
    "سعادت‌آباد": ["سعادت آباد", "سعادت‌آباد", "سعادتاباد", "سعادت اباد", "سعادتآباد"],
    "تجریش": ["تجریش"],
    "پاسداران": ["پاسداران"],
    "شریعتی": ["شریعتی"],
    "یوسف‌آباد": ["یوسف آباد", "یوسف‌آباد"],
    "نیاوران": ["نیاوران"],
    "پیروزی": ["پیروزی"],
    "ستارخان": ["ستارخان"],
    "اکباتان": ["اکباتان"],
}


def normalize_text(text: str) -> str:
    text = unicodedata.normalize("NFKC", text)
    text = text.replace("ي", "ی").replace("ك", "ک").replace("\u200c", " ")
    text = re.sub(r"\s+", " ", text.strip().lower())
    return text


def _compact(text: str) -> str:
    return normalize_text(text).replace(" ", "")


def _parse_record(content: str) -> dict[str, str]:
    record: dict[str, str] = {}
    for segment in content.split(" | "):
        if ": " in segment:
            key, value = segment.split(": ", 1)
            record[key.strip()] = value.strip()
    return record


def _record_searchable_text(record: dict[str, str], content: str) -> str:
    parts = [
        record.get("دسته", ""),
        record.get("عنوان", ""),
        record.get("متن", ""),
        record.get("نوع_رکورد", ""),
        record.get("وضعیت", ""),
        record.get("تاریخ", ""),
        content,
    ]
    return normalize_text(" ".join(parts))


def detect_specialty(question: str) -> str | None:
    q = normalize_text(question)
    for specialty, keywords in SPECIALTY_KEYWORDS.items():
        for kw in keywords:
            if normalize_text(kw) in q:
                return specialty
    return None


def detect_districts(question: str) -> list[str]:
    q = normalize_text(question)
    q_compact = _compact(question)
    found: list[str] = []
    for district, keywords in DISTRICT_KEYWORDS.items():
        for kw in keywords:
            kn = normalize_text(kw)
            if kn in q or _compact(kw) in q_compact:
                found.append(district)
                break
    return found


def _matches_specialty(record: dict[str, str], text: str, specialty: str) -> bool:
    category = normalize_text(record.get("دسته", ""))
    body = normalize_text(text)
    spec_norm = normalize_text(specialty)
    if spec_norm in category or spec_norm in body:
        return True
    for kw in SPECIALTY_KEYWORDS.get(specialty, []):
        if normalize_text(kw) in body:
            return True
    return False


def _matches_district(text: str, district: str) -> bool:
    body = normalize_text(text)
    body_compact = _compact(text)
    if normalize_text(district) in body or _compact(district) in body_compact:
        return True
    for kw in DISTRICT_KEYWORDS.get(district, []):
        kn = normalize_text(kw)
        if kn in body or _compact(kw) in body_compact:
            return True
    return False


def _matches_record_type(record: dict[str, str], types: list[str]) -> bool:
    if not types:
        return True
    rt = normalize_text(record.get("نوع_رکورد", ""))
    return rt in [normalize_text(t) for t in types]


def _matches_status(record: dict[str, str], statuses: list[str]) -> bool:
    if not statuses:
        return True
    st = normalize_text(record.get("وضعیت", ""))
    body = normalize_text(record.get("متن", ""))
    for s in statuses:
        sn = normalize_text(s)
        if sn in st or sn in body:
            return True
    return False


def _matches_date(record: dict[str, str], content: str, relation: str | None) -> bool:
    if not relation:
        return True
    date_str = record.get("تاریخ") or content
    parsed = parse_persian_date(date_str)
    if not parsed:
        return relation != "today"  # رکورد بدون تاریخ برای «امروز» رد شود
    today = get_today_persian()
    cmp = compare_persian_date(parsed, today)
    if relation == "before_today":
        return cmp < 0
    if relation == "today":
        return cmp == 0
    if relation == "after_today":
        return cmp > 0
    return True


def _score_record(
    record: dict[str, str],
    content: str,
    intent: QueryIntent,
    question: str,
    vector_score: float,
) -> float | None:
    text = _record_searchable_text(record, content)

    if not _matches_record_type(record, intent.record_types):
        return None

    if intent.appointment_statuses and not _matches_status(record, intent.appointment_statuses):
        return None

    if not _matches_date(record, content, intent.date_relation):
        return None

    if intent.specialty and not _matches_specialty(record, text, intent.specialty):
        return None

    if intent.districts and not any(_matches_district(text, d) for d in intent.districts):
        return None

    score = 0.2
    if intent.wants_empty_slot and _matches_status(record, ["لغو شده", "در انتظار"]):
        score += 0.45
    if intent.specialty and _matches_specialty(record, text, intent.specialty):
        score += 0.25
    if intent.districts:
        score += 0.15

    q = normalize_text(question)
    tokens = [t for t in re.findall(r"[\w\u0600-\u06FF]+", q) if len(t) > 2]
    if tokens:
        matched = sum(1 for t in tokens if t in text)
        score += 0.15 * (matched / len(tokens))

    return score * 0.65 + vector_score * 0.35


def filter_and_rerank(
    question: str,
    hits: list[dict],
    *,
    top_k: int = 5,
    strict: bool = True,
) -> tuple[list[dict], dict]:
    intent = detect_intent(question)
    meta: dict = {
        "intent": intent.label,
        "record_types": intent.record_types,
        "specialty": intent.specialty,
        "districts": intent.districts,
        "appointment_statuses": intent.appointment_statuses,
        "date_relation": intent.date_relation,
        "wants_empty_slot": intent.wants_empty_slot,
        "today_persian": get_today_persian(),
        "strict_filter": strict,
    }

    if not hits:
        return [], meta

    scored: list[dict] = []
    for hit in hits:
        content = hit.get("content") or ""
        record = _parse_record(content)
        vector = float(hit.get("score", 0))
        kw = _score_record(record, content, intent, question, vector)
        if kw is None:
            continue
        scored.append({**hit, "score": round(kw, 4), "keyword_score": round(kw, 4)})

    scored.sort(key=lambda h: h["score"], reverse=True)

    # اگر intent مشخص بود ولی نتیجه نبود، یک بار فیلتر تاریخ/وضعیت را شل کن
    if not scored and strict and intent.record_types:
        relaxed_intent = QueryIntent(
            record_types=intent.record_types,
            appointment_statuses=intent.appointment_statuses if intent.wants_empty_slot else [],
            date_relation=None,
            specialty=intent.specialty,
            districts=intent.districts,
            wants_empty_slot=intent.wants_empty_slot,
            label=intent.label,
        )
        for hit in hits:
            content = hit.get("content") or ""
            record = _parse_record(content)
            vector = float(hit.get("score", 0))
            kw = _score_record(record, content, relaxed_intent, question, vector)
            if kw is None:
                continue
            scored.append({**hit, "score": round(kw, 4), "keyword_score": round(kw, 4)})
        scored.sort(key=lambda h: h["score"], reverse=True)
        meta["relaxed"] = True
        meta["relaxed_reason"] = "date_or_status"

    # fallback تخصص/منطقه برای پزشک
    if not scored and strict and intent.specialty and intent.record_types == ["پزشک"]:
        relaxed_intent = QueryIntent(
            record_types=["پزشک"],
            specialty=intent.specialty,
            label="doctor",
        )
        for hit in hits:
            content = hit.get("content") or ""
            record = _parse_record(content)
            if not _matches_specialty(record, _record_searchable_text(record, content), intent.specialty):
                continue
            vector = float(hit.get("score", 0))
            scored.append({**hit, "score": vector, "keyword_score": 0.5})
        scored.sort(key=lambda h: h["score"], reverse=True)
        meta["relaxed"] = True
        meta["relaxed_reason"] = "district"

    return scored[:top_k], meta
