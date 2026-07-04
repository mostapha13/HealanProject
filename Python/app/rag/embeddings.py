from __future__ import annotations

from typing import TYPE_CHECKING, Any

if TYPE_CHECKING:
    from chromadb.api.types import Documents, EmbeddingFunction, Embeddings


class PersianEmbeddingFunction:
    """
    Embedding مخصوص فارسی — heydariAI/persian-embeddings
    importهای سنگین فقط هنگام اولین استفاده بارگذاری می‌شوند.
    """

    def __init__(self, model_name: str):
        self.model_name = model_name
        self._model = None
        self._chromadb_ef: Any = None

    def _ensure_chromadb_wrapper(self) -> Any:
        if self._chromadb_ef is not None:
            return self._chromadb_ef

        from chromadb.api.types import EmbeddingFunction

        model_name = self.model_name
        outer = self

        class _Wrapper(EmbeddingFunction):
            def __call__(self, input: Documents) -> Embeddings:
                return outer.__call__(input)

        self._chromadb_ef = _Wrapper()
        return self._chromadb_ef

    def _get_model(self):
        if self._model is None:
            from sentence_transformers import SentenceTransformer

            self._model = SentenceTransformer(self.model_name)
        return self._model

    def __call__(self, input: Documents) -> Embeddings:
        model = self._get_model()
        vectors = model.encode(
            list(input),
            normalize_embeddings=True,
            show_progress_bar=False,
        )
        return vectors.tolist()

    def name(self) -> str:
        return f"persian-{self.model_name}"
