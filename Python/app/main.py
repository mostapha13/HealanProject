from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from app import __version__
from app.config import get_settings
from app.rag.service import get_rag_pipeline, init_rag
from app.routers import chat, rag

STATIC_DIR = Path(__file__).parent / "static"


@asynccontextmanager
async def lifespan(_: FastAPI):
    settings = get_settings()
    if not settings.llm_configured:
        print("Warning: OPENAI_API_KEY is not set. AI endpoints will return 503.")

    ingest_result = init_rag(settings)
    if ingest_result:
        print(
            f"RAG indexed {ingest_result['indexed']} documents "
            f"({ingest_result['embedding_model']})"
        )
    elif settings.excel_path.exists():
        print("RAG: auto-ingest skipped or failed.")
    else:
        print(f"RAG: Excel not found at {settings.excel_path}. Run scripts/create_sample_excel.py")

    yield


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
    }
