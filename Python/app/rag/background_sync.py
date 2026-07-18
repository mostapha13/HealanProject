"""همگام‌سازی دوره‌ای ChromaDB از SQL Server."""

from __future__ import annotations

import asyncio
import logging

from app.config import Settings
from app.data.healan_sql_source import HealanSqlDataSource
from app.rag.pipeline import RagPipeline
from app.rag.service import is_ingesting, reset_rag_pipeline

logger = logging.getLogger(__name__)


async def run_background_sync(settings: Settings, stop_event: asyncio.Event) -> None:
    if not settings.rag_sync_enabled:
        logger.info("RAG background sync is disabled")
        return

    if settings.data_source.lower().strip() != "sqlserver":
        logger.info("RAG background sync only runs with DATA_SOURCE=sqlserver")
        return

    if not settings.sql_server_connection_string.strip():
        logger.warning("RAG sync skipped: SQL_SERVER_CONNECTION_STRING is empty")
        return

    logger.info("RAG background sync worker started")

    while not stop_event.is_set():
        while is_ingesting() and not stop_event.is_set():
            await asyncio.sleep(1)

        interval_minutes = settings.rag_sync_interval_minutes
        try:
            sql_settings = HealanSqlDataSource.read_sync_settings(
                settings.sql_server_connection_string
            )
            if sql_settings.get("is_enabled") is False:
                logger.info("RAG is disabled in RagSettings — skipping sync")
            else:
                interval_minutes = int(
                    sql_settings.get("sync_interval_minutes") or interval_minutes
                )
                await asyncio.to_thread(_sync_once, settings)
        except Exception as exc:
            logger.exception("RAG background sync failed: %s", exc)

        try:
            await asyncio.wait_for(stop_event.wait(), timeout=interval_minutes * 60)
            break
        except asyncio.TimeoutError:
            continue

    logger.info("RAG background sync worker stopped")


def _sync_once(settings: Settings) -> None:
    from app.rag.runtime_settings import apply_rag_sql_overrides

    reset_rag_pipeline()
    runtime = apply_rag_sql_overrides(settings)
    pipeline = RagPipeline(runtime)
    from app.rag import service as rag_service

    rag_service._pipeline = pipeline
    result = pipeline.ingest()
    HealanSqlDataSource.touch_last_synced(settings.sql_server_connection_string)
    logger.info(
        "RAG synced %s documents (source=%s, embedding=%s, summarize=%s)",
        result.get("indexed"),
        result.get("source"),
        runtime.embedding_model,
        runtime.rag_summarize_model or runtime.openai_model,
    )
