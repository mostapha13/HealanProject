"""اعمال تنظیمات RagSettings از SQL روی Settings زمان اجرا."""

from __future__ import annotations

import logging

from app.config import Settings
from app.data.healan_sql_source import HealanSqlDataSource

logger = logging.getLogger(__name__)


def apply_rag_sql_overrides(settings: Settings) -> Settings:
    """مدل embedding و خلاصه‌ساز را از جدول RagSettings می‌خواند (اگر موجود باشد)."""
    if settings.data_source.lower().strip() != "sqlserver":
        return settings
    if not settings.sql_server_connection_string.strip():
        return settings

    try:
        sql = HealanSqlDataSource.read_sync_settings(settings.sql_server_connection_string)
    except Exception as exc:
        logger.warning("Could not read RagSettings for model overrides: %s", exc)
        return settings

    emb = (sql.get("embedding_model") or "").strip()
    if emb:
        settings.embedding_model = emb

    summarize = (sql.get("summarize_model") or "").strip()
    if summarize:
        settings.rag_summarize_model = summarize
        # اگر OPENAI_MODEL جدا ست نشده، خلاصه‌ساز از همین مدل استفاده کند
        if not (settings.openai_model or "").strip() or settings.openai_model == "gpt-4o-mini":
            settings.openai_model = summarize

    threshold_pct = sql.get("similarity_threshold_percent")
    if threshold_pct is not None:
        try:
            settings.rag_similarity_threshold = max(0.01, min(1.0, int(threshold_pct) / 100.0))
        except (TypeError, ValueError):
            pass

    return settings
