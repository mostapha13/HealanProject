from contextlib import asynccontextmanager
from pathlib import Path
import asyncio

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from app import __version__
from app.config import get_settings
from app.rag.background_sync import run_background_sync
from app.rag.runtime_settings import apply_rag_sql_overrides
from app.rag.service import get_rag_pipeline, init_rag
from app.routers import chat, rag, stt
from app.services.stt import warmup_stt

STATIC_DIR = Path(__file__).parent / "static"


@asynccontextmanager
async def lifespan(_: FastAPI):
    settings = get_settings()
    if not settings.llm_configured:
        print("Info: OPENAI_API_KEY is not set — RAG runs in direct-answer mode without LLM.")

    async def _run_initial_ingest() -> None:
        ingest_result = await asyncio.to_thread(init_rag, settings)
        if ingest_result:
            print(
                f"RAG indexed {ingest_result['indexed']} documents "
                f"({ingest_result['embedding_model']})"
            )
        elif settings.data_source.lower() == "excel" and settings.excel_path.exists():
            print("RAG: auto-ingest skipped or failed.")
        elif settings.data_source.lower() == "sqlserver":
            print("RAG: initial SQL Server ingest failed — background sync will retry.")
        else:
            print(f"RAG: data source not ready ({settings.data_source}).")

    async def _warmup_stt() -> None:
        runtime = apply_rag_sql_overrides(settings)
        await asyncio.to_thread(warmup_stt, runtime)

    ingest_task = asyncio.create_task(_run_initial_ingest())
    stt_task = asyncio.create_task(_warmup_stt())

    stop_event = asyncio.Event()
    sync_task = asyncio.create_task(run_background_sync(settings, stop_event))

    yield

    stop_event.set()
    ingest_task.cancel()
    stt_task.cancel()
    sync_task.cancel()
    for task in (ingest_task, stt_task, sync_task):
        try:
            await task
        except asyncio.CancelledError:
            pass


app = FastAPI(
    title="Healan AI",
    description="LLM + RAG microservice for Healan Doctor",
    version=__version__,
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat.router)
app.include_router(rag.router)
app.include_router(stt.router)

if STATIC_DIR.is_dir():
    app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")


@app.get("/")
async def ui():
    index = STATIC_DIR / "index.html"
    if index.exists():
        return FileResponse(index)
    return {"message": "UI not found. Run from Python/ with app/static/index.html"}


@app.get("/health")
async def health():
    settings = get_settings()
    rag_documents = 0
    try:
        rag_documents = get_rag_pipeline().store.document_count
    except Exception:
        pass
    return {
        "status": "ok",
        "version": __version__,
        "llm_configured": settings.llm_configured,
        "model": settings.openai_model,
        "embedding_model": settings.embedding_model,
        "rag_documents": rag_documents,
        "data_source": settings.data_source,
        "stt_enabled": settings.stt_enabled,
        "stt_model": settings.stt_model,
    }
