from fastapi import APIRouter, Depends, HTTPException
from openai import AsyncOpenAI
import logging

from app.config import Settings, get_settings
from app.rag.pipeline import build_data_source
from app.rag.rerank import filter_and_rerank
from app.rag.direct_answer import INDEXING_MESSAGE
from app.rag.service import get_rag_pipeline, is_ingesting, reset_rag_pipeline
from app.schemas import (
    RagAskRequest,
    RagAskResponse,
    RagIngestResponse,
    RagSearchRequest,
    RagSearchResponse,
    RagSourceItem,
    RagStatusResponse,
)
from app.services.llm import create_client

router = APIRouter(prefix="/api/v1/rag", tags=["rag"])
logger = logging.getLogger(__name__)


def require_llm(settings: Settings = Depends(get_settings)) -> Settings:
    if not settings.llm_configured:
        raise HTTPException(
            status_code=503,
            detail="LLM is not configured. Set OPENAI_API_KEY in .env",
        )
    return settings


def _rag_deps_error(exc: Exception) -> HTTPException:
    return HTTPException(
        status_code=503,
        detail=(
            f"RAG dependencies not ready: {exc}. "
            "Run: pip install chromadb sentence-transformers"
        ),
    )


@router.get("/status", response_model=RagStatusResponse)
async def rag_status(settings: Settings = Depends(get_settings)):
    try:
        pipeline = get_rag_pipeline()
    except ImportError as exc:
        raise _rag_deps_error(exc) from exc
    return RagStatusResponse(
        document_count=pipeline.store.document_count,
        data_source=settings.data_source,
        excel_path=str(settings.excel_path),
        excel_exists=settings.excel_path.exists(),
        embedding_model=settings.embedding_model,
        llm_model=settings.openai_model,
    )


@router.post("/ingest", response_model=RagIngestResponse)
async def rag_ingest(settings: Settings = Depends(get_settings)):
    try:
        build_data_source(settings).load()
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    reset_rag_pipeline()
    try:
        pipeline = get_rag_pipeline()
    except ImportError as exc:
        raise _rag_deps_error(exc) from exc
    result = pipeline.ingest()
    return RagIngestResponse(
        indexed=result["indexed"],
        source=result["source"],
        embedding_model=result["embedding_model"],
        document_count=pipeline.store.document_count,
    )


@router.post("/search", response_model=RagSearchResponse)
async def rag_search(
    body: RagSearchRequest,
    settings: Settings = Depends(get_settings),
):
    """جستجو در اکسل بدون LLM — برای تست بدون API key."""
    try:
        pipeline = get_rag_pipeline()
    except ImportError as exc:
        raise _rag_deps_error(exc) from exc
    if pipeline.store.document_count == 0:
        raise HTTPException(
            status_code=404,
            detail="Index is empty. POST /api/v1/rag/ingest first.",
        )
    hits = pipeline.store.search(body.question, top_k=max((body.top_k or settings.rag_top_k) * 4, 20))
    hits, _ = filter_and_rerank(
        body.question,
        hits,
        top_k=body.top_k or settings.rag_top_k,
    )
    sources = [
        RagSourceItem(
            content=h["content"],
            metadata=h.get("metadata") or {},
            score=float(h.get("score", 0)),
        )
        for h in hits
    ]
    return RagSearchResponse(
        sources=sources,
        embedding_model=settings.embedding_model,
    )


@router.post("/ask", response_model=RagAskResponse)
async def rag_ask(
    body: RagAskRequest,
    settings: Settings = Depends(get_settings),
):
    try:
        pipeline = get_rag_pipeline()
    except ImportError as exc:
        raise _rag_deps_error(exc) from exc
    if pipeline.store.document_count == 0:
        if is_ingesting():
            logger.info(
                "RAG ask while indexing. question=%r document_count=0",
                body.question,
            )
            return RagAskResponse(
                answer=INDEXING_MESSAGE,
                was_answered=False,
                similarity_score=None,
                matched_id=None,
                source_type=None,
                sources=[],
                model="direct",
                embedding_model=settings.embedding_model,
                answer_mode="direct",
            )
        logger.warning(
            "RAG ask rejected: index empty. question=%r document_count=0 ingesting=%s",
            body.question,
            is_ingesting(),
        )
        raise HTTPException(
            status_code=404,
            detail="Index is empty. POST /api/v1/rag/ingest first or wait for background sync.",
        )

    mode = (body.answer_mode or settings.rag_answer_mode or "direct").lower().strip()
    threshold = body.similarity_threshold
    if threshold is None and settings.sql_server_connection_string.strip():
        sql_settings = {}
        try:
            from app.data.healan_sql_source import HealanSqlDataSource

            sql_settings = HealanSqlDataSource.read_sync_settings(
                settings.sql_server_connection_string
            )
        except Exception:
            sql_settings = {}
        if sql_settings.get("similarity_threshold_percent") is not None:
            threshold = float(sql_settings["similarity_threshold_percent"]) / 100.0

    client = create_client(settings) if mode == "llm" and settings.llm_configured else None
    result = await pipeline.ask(
        body.question,
        top_k=body.top_k,
        client=client,
        similarity_threshold=threshold,
        answer_mode=mode,
    )

    logger.info(
        "RAG ask result. question=%r was_answered=%s score=%s matched_id=%s source_type=%s documents=%s threshold=%s",
        body.question,
        result.get("was_answered"),
        result.get("similarity_score"),
        result.get("matched_id"),
        result.get("source_type"),
        pipeline.store.document_count,
        threshold,
    )

    sources = [
        RagSourceItem(
            content=h["content"],
            metadata=h.get("metadata") or {},
            score=float(h.get("score", 0)),
        )
        for h in result.get("sources", [])
    ]

    return RagAskResponse(
        answer=result["answer"],
        was_answered=bool(result.get("was_answered")),
        similarity_score=result.get("similarity_score"),
        matched_id=result.get("matched_id"),
        source_type=result.get("source_type"),
        sources=sources,
        model=result["model"],
        embedding_model=result.get("embedding_model") or settings.embedding_model,
        answer_mode=result.get("answer_mode", mode),
    )
