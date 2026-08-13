from __future__ import annotations
from dataclasses import dataclass, field
from typing import Any

@dataclass(slots=True)
class KnowledgeDocument:
    document_id: str
    source_type: str
    source_id: str
    title: str
    body: str
    url: str | None = None
    symbol: str | None = None
    category: str | None = None
    published_at: str | None = None
    metadata: dict[str, Any] = field(default_factory=dict)

@dataclass(slots=True)
class KnowledgeChunk:
    chunk_id: str
    document_id: str
    source_type: str
    source_id: str
    title: str
    text: str
    ordinal: int
    url: str | None = None
    symbol: str | None = None
    category: str | None = None
    published_at: str | None = None
    metadata: dict[str, Any] = field(default_factory=dict)
