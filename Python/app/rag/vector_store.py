from __future__ import annotations

from app.data.base import Document
from app.rag.embeddings import PersianEmbeddingFunction


def _create_embedding_function(embedding_model: str):
    model = embedding_model.lower().strip()

    # آفلاین — بدون دانلود (پیشنهاد برای تست)
    if model in ("simple", "local", "hash", "offline"):
        from app.rag.simple_embeddings import SimpleLocalEmbeddingFunction

        return SimpleLocalEmbeddingFunction(method="hash")._ensure_chromadb_wrapper()

    if model in ("tfidf",):
        from app.rag.simple_embeddings import SimpleLocalEmbeddingFunction

        return SimpleLocalEmbeddingFunction(method="tfidf")._ensure_chromadb_wrapper()

    if model in ("default", "chromadb", "onnx"):
        from chromadb.utils import embedding_functions

        return embedding_functions.DefaultEmbeddingFunction()

    try:
        return PersianEmbeddingFunction(embedding_model)._ensure_chromadb_wrapper()
    except ImportError:
        from app.rag.simple_embeddings import SimpleLocalEmbeddingFunction

        print(
            "Warning: sentence-transformers not installed. "
            "Using offline simple embedding. Set EMBEDDING_MODEL=simple in .env"
        )
        return SimpleLocalEmbeddingFunction(method="hash")._ensure_chromadb_wrapper()


class VectorStore:
    def __init__(
        self,
        persist_dir: str,
        collection_name: str,
        embedding_model: str,
    ):
        import chromadb
        from chromadb.config import Settings as ChromaSettings

        chroma_ef = _create_embedding_function(embedding_model)

        self._client = chromadb.PersistentClient(
            path=persist_dir,
            settings=ChromaSettings(anonymized_telemetry=False),
        )
        try:
            self._collection = self._client.get_or_create_collection(
                name=collection_name,
                embedding_function=chroma_ef,
                metadata={"hnsw:space": "cosine"},
            )
        except ValueError as exc:
            if "embedding function" not in str(exc).lower():
                raise
            try:
                self._client.delete_collection(collection_name)
            except Exception:
                pass
            self._collection = self._client.get_or_create_collection(
                name=collection_name,
                embedding_function=chroma_ef,
                metadata={"hnsw:space": "cosine"},
            )
        self._embedding_model = embedding_model

    @property
    def document_count(self) -> int:
        return self._collection.count()

    def clear(self) -> None:
        name = self._collection.name
        embedding_model = getattr(self, "_embedding_model", "chromadb")
        self._client.delete_collection(name)
        chroma_ef = _create_embedding_function(embedding_model)
        self._collection = self._client.get_or_create_collection(
            name=name,
            embedding_function=chroma_ef,
            metadata={"hnsw:space": "cosine"},
        )

    def add_documents(self, documents: list[Document]) -> int:
        if not documents:
            return 0

        batch_size = 100
        total = 0
        for start in range(0, len(documents), batch_size):
            batch = documents[start : start + batch_size]
            self._collection.upsert(
                ids=[d.id for d in batch],
                documents=[d.content for d in batch],
                metadatas=[d.metadata for d in batch],
            )
            total += len(batch)
        return total

    def search(self, query: str, top_k: int) -> list[dict]:
        if self.document_count == 0:
            return []

        result = self._collection.query(
            query_texts=[query],
            n_results=min(top_k, self.document_count),
            include=["documents", "metadatas", "distances"],
        )

        items: list[dict] = []
        docs = result.get("documents", [[]])[0]
        metas = result.get("metadatas", [[]])[0]
        distances = result.get("distances", [[]])[0]

        for doc, meta, distance in zip(docs, metas, distances, strict=False):
            items.append(
                {
                    "content": doc,
                    "metadata": meta or {},
                    "score": round(1 - float(distance), 4),
                }
            )
        return items
