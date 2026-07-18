"""اعمال خلاصه LLM روی اسناد بلاگ و نظرات قبل از embed."""

from __future__ import annotations

import logging

from app.config import Settings
from app.data.base import Document
from app.services.summarizer import summarize_for_rag

logger = logging.getLogger(__name__)

_SUMMARIZE_SOURCES = frozenset({"blog", "review"})


def enrich_documents_with_summaries(
    documents: list[Document],
    settings: Settings,
) -> list[Document]:
    """فقط blog و review: خلاصه می‌سازد، content را برای embed و answer را برای پاسخ عوض می‌کند."""
    if not documents:
        return documents

    enriched: list[Document] = []
    summarized = 0
    for doc in documents:
        meta = dict(doc.metadata or {})
        source = (meta.get("source") or "").strip().lower()
        if source not in _SUMMARIZE_SOURCES:
            enriched.append(doc)
            continue

        title = (meta.get("title") or "").strip()
        raw = (meta.get("raw_text") or doc.content or "").strip()
        summary = summarize_for_rag(
            settings,
            text=raw,
            source=source,
            title=title,
        )
        meta.pop("raw_text", None)
        if not summary:
            enriched.append(Document(id=doc.id, content=doc.content, metadata=meta))
            continue

        if source == "blog":
            content = " | ".join(p for p in [title, summary] if p)
            answer = summary
        else:
            name = (meta.get("display_name") or title or "بیمار").strip()
            rating = (meta.get("rating") or "").strip()
            content_parts = [f"نظر بیمار {name}", f"امتیاز {rating}" if rating else "", summary]
            content = " | ".join(p for p in content_parts if p)
            answer = f"نظر {name}: {summary}"

        meta["answer"] = answer
        enriched.append(Document(id=doc.id, content=content, metadata=meta))
        summarized += 1

    if summarized:
        logger.info("RAG summarized %s blog/review document(s)", summarized)
    return enriched
