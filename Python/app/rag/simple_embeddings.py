"""Embedding محلی بدون نیاز به دانلود — برای تست آفلاین."""

from __future__ import annotations

import math
import re
from typing import Any

_DIM = 384
_vectorizer: Any = None
_fitted = False


def _tokenize(text: str) -> list[str]:
    # حروف فارسی، انگلیسی و اعداد
    return re.findall(r"[\w\u0600-\u06FF]+", text.lower())


def _hash_embed(texts: list[str]) -> list[list[float]]:
    vectors: list[list[float]] = []
    for text in texts:
        vec = [0.0] * _DIM
        for token in _tokenize(text):
            for i, ch in enumerate(token.encode("utf-8")):
                idx = (i * 31 + ch) % _DIM
                vec[idx] += 1.0
        norm = math.sqrt(sum(v * v for v in vec)) or 1.0
        vectors.append([v / norm for v in vec])
    return vectors


def _tfidf_embed(texts: list[str]) -> list[list[float]]:
    global _vectorizer, _fitted
    from sklearn.feature_extraction.text import TfidfVectorizer

    if _vectorizer is None:
        _vectorizer = TfidfVectorizer(analyzer=_tokenize, max_features=_DIM)
    if not _fitted:
        matrix = _vectorizer.fit_transform(texts)
        _fitted = True
    else:
        matrix = _vectorizer.transform(texts)

    dense = matrix.toarray()
    result: list[list[float]] = []
    for row in dense:
        norm = math.sqrt(sum(v * v for v in row)) or 1.0
        # pad to _DIM
        padded = list(row) + [0.0] * max(0, _DIM - len(row))
        padded = padded[:_DIM]
        result.append([v / norm for v in padded])
    return result


def embed_texts(texts: list[str], method: str = "hash") -> list[list[float]]:
    if method == "tfidf":
        try:
            return _tfidf_embed(texts)
        except ImportError:
            pass
    return _hash_embed(texts)


def reset_tfidf() -> None:
    global _vectorizer, _fitted
    _vectorizer = None
    _fitted = False


class SimpleLocalEmbeddingFunction:
    """برای ChromaDB — بدون دانلود مدل."""

    def __init__(self, method: str = "hash"):
        self.method = method
        self._chromadb_ef = None

    def _ensure_chromadb_wrapper(self):
        if self._chromadb_ef is not None:
            return self._chromadb_ef

        from chromadb.api.types import EmbeddingFunction, Documents, Embeddings

        method = self.method

        class _Wrapper(EmbeddingFunction[Documents]):
            def __call__(self, input: Documents) -> Embeddings:
                return embed_texts(list(input), method=method)

            def name(self) -> str:
                return f"healan-simple-{method}"

        self._chromadb_ef = _Wrapper()
        return self._chromadb_ef
