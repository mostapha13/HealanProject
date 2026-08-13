from __future__ import annotations

import asyncio
import os
from typing import Any

import httpx


def _positive_int(name: str, default: int) -> int:
    try:
        return max(1, int(os.getenv(name, str(default))))
    except ValueError:
        return default


def _positive_float(name: str, default: float) -> float:
    try:
        return max(0.1, float(os.getenv(name, str(default))))
    except ValueError:
        return default


_llm_slots = asyncio.Semaphore(_positive_int("LLM_MAX_CONCURRENCY", 2))


async def post_chat_completion(
    url: str, headers: dict[str, str], payload: dict[str, Any]
) -> dict[str, Any] | None:
    """Bound local GPU work and fail closed when inference is busy or unavailable."""
    acquired = False
    try:
        await asyncio.wait_for(
            _llm_slots.acquire(),
            timeout=_positive_float("LLM_QUEUE_TIMEOUT_SECONDS", 15.0),
        )
        acquired = True
        timeout = httpx.Timeout(_positive_float("LLM_REQUEST_TIMEOUT_SECONDS", 45.0))
        async with httpx.AsyncClient(timeout=timeout) as client:
            response = await client.post(url, headers=headers, json=payload)
            response.raise_for_status()
            body = response.json()
        return body if isinstance(body, dict) else None
    except (TimeoutError, httpx.HTTPError, KeyError, TypeError, ValueError):
        return None
    finally:
        if acquired:
            _llm_slots.release()
