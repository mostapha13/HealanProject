"""ساخت پاسخ فارسی از نتایج جستجو — بدون LLM خارجی."""

from __future__ import annotations

from app.rag.intent import detect_districts, detect_intent, detect_specialty, get_today_persian
from app.rag.rerank import _parse_record


def _pick_fields(record: dict[str, str], intent_label: str) -> list[str]:
    if intent_label == "appointment":
        labels = [
            ("عنوان", "بیمار"),
            ("دسته", "تخصص"),
            ("تاریخ", "تاریخ"),
            ("وضعیت", "وضعیت"),
            ("کد", "کد نوبت"),
        ]
    elif intent_label == "doctor":
        labels = [
            ("عنوان", "پزشک"),
            ("دسته", "تخصص"),
            ("شماره_تماس", "تماس"),
            ("کد", "کد"),
        ]
    else:
        labels = [
            ("نوع_رکورد", "نوع"),
            ("عنوان", "عنوان"),
            ("دسته", "دسته"),
            ("شماره_تماس", "تماس"),
            ("تاریخ", "تاریخ"),
            ("وضعیت", "وضعیت"),
            ("کد", "کد"),
        ]

    lines: list[str] = []
    for key, label in labels:
        value = record.get(key, "").strip()
        if value:
            lines.append(f"{label}: {value}")

    text = record.get("متن", "")
    if text:
        short = text if len(text) <= 220 else text[:220] + "…"
        lines.append(f"جزئیات: {short}")
    return lines


def _intent_intro(question: str, filter_meta: dict | None) -> str:
    meta = filter_meta or {}
    intent = meta.get("intent", detect_intent(question).label)
    today = meta.get("today_persian") or get_today_persian()
    today_str = f"{today[0]}/{today[1]:02d}/{today[2]:02d}"

    if intent == "appointment" and meta.get("wants_empty_slot"):
        date_note = ""
        if meta.get("date_relation") == "before_today":
            date_note = f" (قبل از امروز {today_str})"
        elif meta.get("date_relation") == "today":
            date_note = f" (امروز {today_str})"
        return f"نوبت‌های خالی/آزاد{date_note} مطابق «{question}»:\n"

    if intent == "appointment":
        return f"نوبت‌های مرتبط با «{question}»:\n"
    if intent == "doctor":
        return f"پزشکان مرتبط با «{question}»:\n"
    return f"نتایج مرتبط با «{question}»:\n"


def generate_local_answer(
    question: str,
    hits: list[dict],
    *,
    filter_meta: dict | None = None,
) -> str:
    meta = filter_meta or {}
    intent = meta.get("intent", detect_intent(question).label)
    specialty = meta.get("specialty") or detect_specialty(question)
    districts = meta.get("districts") or detect_districts(question)
    relaxed = meta.get("relaxed", False)

    if not hits:
        parts = [f"برای «{question}» رکورد مناسبی در اکسل پیدا نشد."]
        if meta.get("wants_empty_slot"):
            parts.append("فیلتر: نوبت خالی/لغو‌شده.")
        if meta.get("date_relation") == "before_today":
            t = meta.get("today_persian") or get_today_persian()
            parts.append(f"تاریخ: قبل از {t[0]}/{t[1]:02d}/{t[2]:02d}.")
        if specialty:
            parts.append(f"تخصص: {specialty}.")
        if districts:
            parts.append(f"منطقه: {'، '.join(districts)}.")
        parts.append(
            "\nبرای سؤالات آزاد مثل ChatGPT، OPENAI_API_KEY واقعی در .env تنظیم کنید."
        )
        return "\n".join(parts)

    if relaxed and meta.get("relaxed_reason") == "date_or_status":
        intro = (
            _intent_intro(question, meta).rstrip()
            + "\n(فیلتر تاریخ دقیق نتیجه نداد — نزدیک‌ترین نوبت‌های مرتبط)\n"
        )
    elif relaxed and specialty and districts:
        intro = (
            f"ترکیب دقیق «{specialty}» در «{'، '.join(districts)}» یافت نشد.\n"
            f"نزدیک‌ترین نتایج:\n"
        )
    else:
        intro = _intent_intro(question, meta)

    blocks: list[str] = [intro]

    for i, hit in enumerate(hits, start=1):
        content = hit.get("content") or ""
        record = _parse_record(content)
        row = (hit.get("metadata") or {}).get("row", "?")
        score = int(float(hit.get("score", 0)) * 100)
        title = record.get("عنوان") or record.get("نوع_رکورد") or f"ردیف {row}"
        blocks.append(f"\n{i}. {title} (ردیف {row} — امتیاز {score}%)")
        blocks.extend(f"   • {line}" for line in _pick_fields(record, intent))

    if meta.get("intent") == "appointment" or meta.get("wants_empty_slot"):
        blocks.append(
            "\n— «نوبت خالی» = وضعیت «لغو شده» یا «در انتظار» در دادهٔ نمونه."
        )
    blocks.append(
        "\n— برای پاسخ طبیعی‌تر (مثل ChatGPT): OPENAI_API_KEY را در .env بگذارید."
    )
    return "\n".join(blocks)
