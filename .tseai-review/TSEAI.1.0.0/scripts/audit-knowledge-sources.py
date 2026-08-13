#!/usr/bin/env python3
"""Read-only audit of Qdrant coverage and AI retrieval for every knowledge source."""

from __future__ import annotations

import json
import os
import urllib.request


QDRANT = os.getenv("QDRANT_URL", "http://qdrant:6333").rstrip("/")
AI = os.getenv("AI_URL", "http://ai-engine:8000").rstrip("/")
COLLECTION = os.getenv("QDRANT_KNOWLEDGE_COLLECTION", "tseai_knowledge_v1")
SOURCES = ("cms_content", "faq", "company_state", "download_center", "organization_person")


def post(url: str, payload: dict) -> dict:
    request = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(request, timeout=90) as response:
        return json.loads(response.read().decode("utf-8"))


def count(source: str, language: bool = False, history: bool = False) -> int:
    must = [{"key": "source_type", "match": {"value": source}}]
    if language:
        must.append({"key": "metadata.language_id", "match": {"value": 1}})
    if history:
        must.append({"key": "metadata.is_current", "match": {"value": False}})
    result = post(
        f"{QDRANT}/collections/{COLLECTION}/points/count",
        {"filter": {"must": must}, "exact": True},
    )
    return int(result["result"]["count"])


def sample(source: str) -> dict | None:
    result = post(
        f"{QDRANT}/collections/{COLLECTION}/points/scroll",
        {
            "filter": {
                "must": [{"key": "source_type", "match": {"value": source}}],
                "must_not": [{"key": "metadata.is_current", "match": {"value": False}}],
                "should": [
                    {"key": "metadata.language_id", "match": {"value": 1}},
                    {"is_empty": {"key": "metadata.language_id"}},
                ],
            },
            "limit": 1,
            "with_payload": True,
            "with_vector": False,
        },
    )
    points = result.get("result", {}).get("points", [])
    return (points[0].get("payload") or {}) if points else None


def retrieve(source: str, payload: dict) -> dict:
    query = str(payload.get("title") or payload.get("text") or "")[:250]
    result = post(
        f"{AI}/knowledge/retrieve",
        {
            "query": query,
            "limit": 3,
            "source_type": source,
            "language_id": 1,
            "current_only": True,
        },
    )
    return {
        "query": query,
        "count": result.get("count", 0),
        "top_document_id": ((result.get("items") or [{}])[0].get("source") or {}).get("document_id"),
        "top_title": (result.get("items") or [{}])[0].get("title"),
    }


def main() -> None:
    report = []
    for source in SOURCES:
        row = {
            "source": source,
            "vectors": count(source),
            "persian_tagged": count(source, language=True),
            "history": count(source, history=True),
        }
        payload = sample(source)
        row["sample"] = None if payload is None else {
            "document_id": payload.get("document_id"),
            "title": payload.get("title"),
            "language_id": (payload.get("metadata") or {}).get("language_id"),
        }
        row["retrieval"] = None if payload is None else retrieve(source, payload)
        report.append(row)
    print(json.dumps(report, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
