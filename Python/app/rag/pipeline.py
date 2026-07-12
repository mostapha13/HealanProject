from __future__ import annotations

from openai import AsyncOpenAI

from app.config import Settings
from app.data.base import DataSource, Document
from app.data.excel_source import ExcelDataSource
from app.data.healan_sql_source import HealanSqlDataSource
from app.data.sql_server_source import SqlServerDataSource
from app.rag.direct_answer import ask_direct
from app.rag.local_answer import generate_local_answer
from app.rag.prompts import RAG_SYSTEM_PROMPT
from app.rag.rerank import filter_and_rerank
from app.rag.vector_store import VectorStore
from app.services.llm import chat_completion, create_client


def build_data_source(settings: Settings) -> DataSource:
    source = settings.data_source.lower().strip()
    if source == "excel":
        return ExcelDataSource(
            file_path=settings.excel_path,
            sheet_name=settings.excel_sheet_name,
        )
    if source == "sqlserver":
        if settings.sql_server_use_healan_bundle:
            return HealanSqlDataSource(connection_string=settings.sql_server_connection_string)
        return SqlServerDataSource(
            connection_string=settings.sql_server_connection_string,
            query=settings.sql_server_query,
        )
    raise ValueError(f"Unknown DATA_SOURCE: {settings.data_source}")


def format_context(hits: list[dict]) -> str:
    blocks: list[str] = []
    for i, hit in enumerate(hits, start=1):
        meta = hit.get("metadata") or {}
        row = meta.get("row", meta.get("id", "?"))
        source = meta.get("source", "data")
        blocks.append(
            f"[{i}] ({source}, row/id={row}, relevance={hit.get('score', 0)})\n"
            f"{hit['content']}"
        )
    return "\n\n".join(blocks)


class RagPipeline:
    def __init__(self, settings: Settings):
        self.settings = settings
        self.store = VectorStore(
            persist_dir=str(settings.chroma_path),
            collection_name=settings.chroma_collection,
            embedding_model=settings.embedding_model,
        )

    def ingest(self) -> dict:
        from app.rag.simple_embeddings import reset_tfidf

        reset_tfidf()
        source = build_data_source(self.settings)
        documents = source.load()
        self.store.clear()
        count = self.store.add_documents(documents)
        return {
            "indexed": count,
            "source": self.settings.data_source,
            "embedding_model": self.settings.embedding_model,
        }

    async def ask(
        self,
        question: str,
        *,
        top_k: int | None = None,
        client: AsyncOpenAI | None = None,
        similarity_threshold: float | None = None,
        answer_mode: str | None = None,
    ) -> dict:
        mode = (answer_mode or self.settings.rag_answer_mode or "direct").lower().strip()
        threshold = (
            similarity_threshold
            if similarity_threshold is not None
            else self.settings.rag_similarity_threshold
        )
        k = top_k or self.settings.rag_top_k

        if mode == "direct":
            pool = max(k * 4, 12)
            hits = self.store.search(question, top_k=pool)
            return ask_direct(hits, question=question, similarity_threshold=threshold)

        from app.rag.intent import detect_intent

        intent = detect_intent(question)
        # برای نوبت/خدمت/FAQ جستجوی گسترده‌تر + فیلتر intent
        pool = 40 if intent.record_types else max(k * 4, 20)
        raw_hits = self.store.search(question, top_k=pool)
        hits, filter_meta = filter_and_rerank(question, raw_hits, top_k=k)

        if not hits:
            return {
                "answer": "داده‌ای در ایندکس وجود ندارد. ابتدا ingest را اجرا کنید.",
                "sources": [],
                "model": "none",
                "answer_mode": "none",
            }

        if not self.settings.llm_configured:
            return {
                "answer": generate_local_answer(question, hits, filter_meta=filter_meta),
                "sources": hits,
                "model": "local",
                "embedding_model": self.settings.embedding_model,
                "answer_mode": "local",
            }

        context = format_context(hits)
        llm = client or create_client(self.settings)

        try:
            answer = await chat_completion(
                llm,
                model=self.settings.openai_model,
                messages=[
                    {"role": "system", "content": RAG_SYSTEM_PROMPT},
                    {
                        "role": "user",
                        "content": (
                            f"Context from data:\n{context}\n\n"
                            f"User question: {question}"
                        ),
                    },
                ],
                temperature=0.2,
                max_tokens=1024,
            )
            return {
                "answer": answer,
                "sources": hits,
                "model": self.settings.openai_model,
                "embedding_model": self.settings.embedding_model,
                "answer_mode": "llm",
            }
        except Exception:
            return {
                "answer": generate_local_answer(question, hits, filter_meta=filter_meta),
                "sources": hits,
                "model": "local",
                "embedding_model": self.settings.embedding_model,
                "answer_mode": "local",
            }
