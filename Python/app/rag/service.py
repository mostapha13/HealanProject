from __future__ import annotations

from app.config import Settings, get_settings
from app.rag.pipeline import RagPipeline

_pipeline: RagPipeline | None = None
_ingesting: bool = False


def get_rag_pipeline() -> RagPipeline:
    global _pipeline
    if _pipeline is None:
        _pipeline = RagPipeline(get_settings())
    return _pipeline


def reset_rag_pipeline() -> None:
    global _pipeline
    _pipeline = None


def is_ingesting() -> bool:
    return _ingesting


def init_rag(settings: Settings | None = None) -> dict | None:
    settings = settings or get_settings()
    if not settings.rag_auto_ingest:
        return None

    pipeline = RagPipeline(settings)
    global _pipeline
    _pipeline = pipeline

    source = settings.data_source.lower().strip()
    if source == "excel" and not settings.excel_path.exists():
        return None
    if source == "sqlserver" and not settings.sql_server_connection_string.strip():
        return None

    global _ingesting
    _ingesting = True
    try:
        return pipeline.ingest()
    except (FileNotFoundError, ValueError) as exc:
        print(f"RAG ingest skipped: {exc}")
        return None
    except Exception as exc:
        print(f"RAG ingest failed (service will still start): {exc}")
        return None
    finally:
        _ingesting = False
