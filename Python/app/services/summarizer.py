"""خلاصه‌سازی متن بلند (بلاگ / نظرات) برای ایندکس RAG — sync برای ingest."""

from __future__ import annotations

import logging
import re
from html import unescape

from app.config import Settings

logger = logging.getLogger(__name__)

_SOURCE_HINT = {
    "blog": "یک مقاله بلاگ پزشکی برای بیماران",
    "review": "یک نظر بیمار درباره مطب",
}


def strip_html(value: str) -> str:
    text = unescape(re.sub(r"<[^>]+>", " ", value or ""))
    return re.sub(r"\s+", " ", text).strip()


def fallback_summary(text: str, *, max_chars: int = 600) -> str:
    cleaned = strip_html(text)
    if not cleaned:
        return ""
    if len(cleaned) <= max_chars:
        return cleaned
    cut = cleaned[:max_chars].rsplit(" ", 1)[0].strip()
    return cut or cleaned[:max_chars]


def summarize_for_rag(
    settings: Settings,
    *,
    text: str,
    source: str,
    title: str = "",
) -> str:
    """
    خلاصه برای embed و پاسخ کاربر.
    اگر LLM در دسترس نباشد → برش امن متن.
    """
    cleaned = strip_html(text)
    if title and title not in cleaned:
        cleaned = f"{title}. {cleaned}".strip()

    if not cleaned:
        return fallback_summary(title)

    short_limit = max(120, int(settings.rag_summarize_skip_if_shorter_than))
    if len(cleaned) <= short_limit:
        return cleaned

    if not settings.rag_summarize_enabled or not settings.llm_configured:
        return fallback_summary(cleaned, max_chars=settings.rag_summarize_fallback_chars)

    max_input = max(1000, int(settings.rag_summarize_max_input_chars))
    payload = cleaned if len(cleaned) <= max_input else cleaned[:max_input]

    hint = _SOURCE_HINT.get(source, "متن")
    system = (
        f"تو یک خلاصه‌ساز فارسی برای دستیار مطب هستی. ورودی {hint} است. "
        "یک خلاصهٔ کوتاه، واضح و مفید به فارسی بنویس (۲ تا ۵ جمله یا چند بولت کوتاه). "
        "فقط از اطلاعات موجود در متن استفاده کن؛ تشخیص یا توصیه پزشکی جدید اضافه نکن. "
        "خروجی فقط خلاصه باشد، بدون مقدمه."
    )
    user = payload
    if title:
        user = f"عنوان: {title}\n\nمتن:\n{payload}"

    try:
        from openai import OpenAI

        api_key = settings.openai_api_key.strip() or "ollama"
        client = OpenAI(
            api_key=api_key,
            base_url=settings.openai_base_url,
        )
        model = (settings.rag_summarize_model or settings.openai_model).strip() or "qwen2.5:3b"
        response = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
            temperature=0.2,
            max_tokens=max(128, int(settings.rag_summarize_max_tokens)),
        )
        summary = (response.choices[0].message.content or "").strip()
        if summary:
            return summary
    except Exception as exc:
        logger.warning("RAG summarize failed for source=%s: %s", source, exc)

    return fallback_summary(cleaned, max_chars=settings.rag_summarize_fallback_chars)
