from __future__ import annotations

import threading

from app.config import Settings, get_settings
from app.rag.pipeline import RagPipeline
from app.rag.runtime_settings import apply_rag_sql_overrides

_pipeline: RagPipeline | None = None
_ingesting: bool = False
_ingest_lock = threading.Lock()
_last_ingest_error: str | None = None


def get_rag_pipeline() -> RagPipeline:
    global _pipeline
    if _pipeline is None:
        # Health/status/ask can arrive while startup ingest is constructing
        # Chroma. Serialize client creation to avoid Chroma's shared-client
        # registry race (KeyError on the persistence path).
        with _ingest_lock:
            if _pipeline is None:
                settings = apply_rag_sql_overrides(get_settings())
                _pipeline = RagPipeline(settings)
    return _pipeline


def reset_rag_pipeline() -> None:
    global _pipeline
    _pipeline = None


def is_ingesting() -> bool:
    return _ingesting


def document_count() -> int:
    pipeline = _pipeline
    return pipeline.store.document_count if pipeline is not None else 0


def last_ingest_error() -> str | None:
    return _last_ingest_error


def init_rag(settings: Settings | None = None, *, force: bool = False) -> dict | None:
    settings = apply_rag_sql_overrides(settings or get_settings())
    if not force and not settings.rag_auto_ingest:
        return None

    global _pipeline, _ingesting, _last_ingest_error
    with _ingest_lock:
        _ingesting = True
        try:
            source = settings.data_source.lower().strip()
            if source == "excel" and not settings.excel_path.exists():
                raise FileNotFoundError(str(settings.excel_path))
            if source == "sqlserver" and not settings.sql_server_connection_string.strip():
                raise ValueError("SQL_SERVER_CONNECTION_STRING is empty")

            # Do not publish a replacement pipeline until its refresh succeeds.
            # The underlying collection is updated with upsert-first semantics.
            candidate = RagPipeline(settings)
            result = candidate.ingest()
            _pipeline = candidate
            _last_ingest_error = None
            return result
        except Exception as exc:
            _last_ingest_error = f"{type(exc).__name__}: {exc}"
            print(f"RAG ingest failed (existing index preserved): {_last_ingest_error}")
            return None
        finally:
            _ingesting = False
