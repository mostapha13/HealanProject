"""تشخیص intent سؤال — نوبت، پزشک، خدمت، تاریخ."""

from __future__ import annotations

import re
import unicodedata
from dataclasses import dataclass, field

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


@dataclass
class QueryIntent:
    record_types: list[str] = field(default_factory=list)
    appointment_statuses: list[str] = field(default_factory=list)
    date_relation: str | None = None  # before_today | today | after_today
    specialty: str | None = None
    districts: list[str] = field(default_factory=list)
    wants_empty_slot: bool = False
    label: str = "general"


def detect_intent(question: str) -> QueryIntent:
    q = normalize_text(question)
    intent = QueryIntent(
        specialty=detect_specialty(question),
        districts=detect_districts(question),
    )

    # --- نوع رکورد ---
    has_appointment = any(w in q for w in ("نوبت", "وقت", "رزرو", "ویزیت"))
    has_doctor = any(w in q for w in ("دکتر", "پزشک", "متخصص"))
    has_service = any(w in q for w in ("خدمت", "آزمایش", "سونو", "هزینه", "قیمت"))
    has_faq = any(w in q for w in ("قانون", "ساعت", "پارکینگ", "بیمه", "پذیرش"))

    intent.wants_empty_slot = any(
        p in q for p in ("نوبت خالی", "وقت خالی", "نوبت آزاد", "زمان خالی", "slot")
    ) or ("خالی" in q and has_appointment)

    if intent.wants_empty_slot or (has_appointment and not has_doctor):
        intent.record_types = ["نوبت"]
        intent.label = "appointment"
    elif has_appointment and has_doctor:
        # «نوبت خالی پزشک» → نوبت مهم‌تر است
        intent.record_types = ["نوبت"]
        intent.label = "appointment"
    elif has_doctor:
        intent.record_types = ["پزشک"]
        intent.label = "doctor"
    elif has_service:
        intent.record_types = ["خدمت"]
        intent.label = "service"
    elif has_faq:
        intent.record_types = ["سوالات_متداول"]
        intent.label = "faq"

    # --- وضعیت نوبت ---
    if intent.wants_empty_slot:
        intent.appointment_statuses = ["لغو شده", "در انتظار"]
    elif "لغو" in q:
        intent.appointment_statuses = ["لغو شده"]
    elif "تأیید" in q or "تایید" in q:
        intent.appointment_statuses = ["تأیید شده"]
    elif "انجام" in q:
        intent.appointment_statuses = ["انجام شده"]

    # --- تاریخ ---
    if any(w in q for w in ("قبل امروز", "گذشته", "قبلی", "before today")):
        intent.date_relation = "before_today"
    elif any(w in q for w in ("امروز", "today")):
        intent.date_relation = "today"
    elif any(w in q for w in ("فردا", "بعد امروز", "آینده", "upcoming")):
        intent.date_relation = "after_today"

    return intent


def parse_persian_date(text: str) -> tuple[int, int, int] | None:
    m = re.search(r"(\d{4})/(\d{1,2})/(\d{1,2})", text)
    if not m:
        return None
    return int(m.group(1)), int(m.group(2)), int(m.group(3))


def get_today_persian() -> tuple[int, int, int]:
    try:
        import jdatetime

        t = jdatetime.date.today()
        return t.year, t.month, t.day
    except ImportError:
        # fallback
        return 1404, 3, 8


def compare_persian_date(date: tuple[int, int, int], today: tuple[int, int, int]) -> int:
    """منفی=قبل امروز، صفر=امروز، مثبت=بعد امروز"""
    if date < today:
        return -1
    if date > today:
        return 1
    return 0
