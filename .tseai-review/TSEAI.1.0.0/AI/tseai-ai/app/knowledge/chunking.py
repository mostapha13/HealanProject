from __future__ import annotations
import hashlib
from .models import KnowledgeChunk, KnowledgeDocument
from .normalization import normalize_persian


def chunk_document(document: KnowledgeDocument, max_chars: int = 1200, overlap_chars: int = 180) -> list[KnowledgeChunk]:
    if max_chars < 200: raise ValueError("max_chars must be >= 200")
    if overlap_chars < 0 or overlap_chars >= max_chars: raise ValueError("invalid overlap_chars")
    text=normalize_persian(document.body)
    if not text: return []
    paragraphs=[p.strip() for p in text.split("\n") if p.strip()]
    pieces: list[str]=[]
    current=""
    for paragraph in paragraphs or [text]:
        candidates=[paragraph[i:i+max_chars] for i in range(0,len(paragraph),max_chars)] if len(paragraph)>max_chars else [paragraph]
        for part in candidates:
            if not current: current=part
            elif len(current)+1+len(part) <= max_chars: current += "\n"+part
            else:
                pieces.append(current)
                tail=current[-overlap_chars:] if overlap_chars else ""
                current=(tail+"\n"+part).strip()
                while len(current)>max_chars:
                    pieces.append(current[:max_chars])
                    current=current[max_chars-overlap_chars:].strip()
    if current: pieces.append(current)
    chunks=[]
    for ordinal,piece in enumerate(pieces):
        cid=hashlib.sha256(f"{document.document_id}:{ordinal}:{piece}".encode("utf-8")).hexdigest()[:32]
        chunks.append(KnowledgeChunk(cid,document.document_id,document.source_type,document.source_id,document.title,piece,ordinal,document.url,document.symbol,document.category,document.published_at,dict(document.metadata)))
    return chunks
