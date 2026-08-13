from __future__ import annotations
from dataclasses import dataclass

@dataclass(frozen=True,slots=True)
class KnowledgeRouteDecision:
    indexable: bool
    route: str
    authority: str
    reason: str

# CMS ids are the contract captured from the Phase-1 source system.
_RAG_FIRST={1,2,4,23,24}
_IGNORE={3}
_HYBRID=set(range(5,22))|{25,26}


def decide_route(source_type:str, content_type_id:int|None, plain_text:str)->KnowledgeRouteDecision:
    source=(source_type or "").strip().lower()
    if source == "faq":
        return KnowledgeRouteDecision(True,"rag","answer_text","faq")
    if source == "company_state":
        return KnowledgeRouteDecision(bool(plain_text),"hybrid","descriptive_only","company-state-reason")
    if source == "download_center":
        return KnowledgeRouteDecision(bool(plain_text),"hybrid","metadata_only","download-page-metadata")
    if source != "cms_content":
        return KnowledgeRouteDecision(bool(plain_text),"rag","descriptive_only","generic-knowledge-source")
    if content_type_id in _IGNORE:
        return KnowledgeRouteDecision(False,"ignore","none","cms-banner-is-not-qa-knowledge")
    if content_type_id == 22:
        # Image records are only useful when the source actually carries meaningful textual metadata.
        ok=len(plain_text) >= 80
        return KnowledgeRouteDecision(ok,"hybrid" if ok else "ignore","metadata_only","multimedia-text-metadata" if ok else "multimedia-without-usable-text")
    if content_type_id in _RAG_FIRST:
        return KnowledgeRouteDecision(bool(plain_text),"rag","descriptive_only","cms-rag-first")
    if content_type_id in _HYBRID:
        # Text may support discovery/explanation, but numeric/structured facts remain authoritative in SQL tools.
        return KnowledgeRouteDecision(bool(plain_text),"hybrid","descriptive_only","cms-structured-hybrid")
    return KnowledgeRouteDecision(False,"ignore","none","unknown-content-type-fail-closed")
