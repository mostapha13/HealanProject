#!/usr/bin/env python3
"""Remove derived organization history points only when they equal their current point."""

from __future__ import annotations

import json
import os
import sys
import urllib.request


QDRANT = os.getenv("QDRANT_URL", "http://qdrant:6333").rstrip("/")
COLLECTION = os.getenv("QDRANT_KNOWLEDGE_COLLECTION", "tseai_knowledge_v1")


def post(path: str, payload: dict) -> dict:
    request = urllib.request.Request(
        f"{QDRANT}{path}",
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(request, timeout=60) as response:
        return json.loads(response.read().decode("utf-8"))


def organization_points() -> list[dict]:
    points: list[dict] = []
    offset = None
    while True:
        body = {
            "filter": {"must": [{"key": "source_type", "match": {"value": "organization_person"}}]},
            "limit": 1000,
            "with_payload": True,
            "with_vector": False,
        }
        if offset is not None:
            body["offset"] = offset
        result = post(f"/collections/{COLLECTION}/points/scroll", body).get("result", {})
        points.extend(result.get("points") or [])
        offset = result.get("next_page_offset")
        if offset is None:
            return points


def main() -> None:
    apply = "--apply" in sys.argv[1:]
    points = organization_points()
    current = {
        p["payload"].get("document_id"): p
        for p in points
        if (p.get("payload", {}).get("metadata") or {}).get("is_current") is not False
    }
    duplicates = []
    for point in points:
        payload = point.get("payload") or {}
        metadata = payload.get("metadata") or {}
        archived_from = metadata.get("archived_from")
        active = current.get(archived_from)
        if not archived_from or active is None:
            continue
        active_payload = active.get("payload") or {}
        if (payload.get("title"), payload.get("text"), payload.get("ordinal")) == (
            active_payload.get("title"), active_payload.get("text"), active_payload.get("ordinal")
        ):
            duplicates.append(point["id"])
    if apply and duplicates:
        post(
            f"/collections/{COLLECTION}/points/delete?wait=true",
            {"points": duplicates},
        )
    print(json.dumps({"apply": apply, "scanned": len(points), "duplicate_history": len(duplicates)}, ensure_ascii=False))


if __name__ == "__main__":
    main()
