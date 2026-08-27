from __future__ import annotations

import asyncio
import os
import time
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
_circuit_failures = 0
_circuit_open_until = 0.0


def _circuit_is_open() -> bool:
    return time.monotonic() < _circuit_open_until


def _record_success() -> None:
    global _circuit_failures, _circuit_open_until
    _circuit_failures = 0
    _circuit_open_until = 0.0


def _record_failure() -> None:
    global _circuit_failures, _circuit_open_until
    _circuit_failures += 1
    threshold = _positive_int("LLM_CIRCUIT_FAILURE_THRESHOLD", 2)
    if _circuit_failures >= threshold:
        _circuit_open_until = time.monotonic() + _positive_float(
            "LLM_CIRCUIT_OPEN_SECONDS", 30.0
        )


async def post_chat_completion(
    url: str, headers: dict[str, str], payload: dict[str, Any]
) -> dict[str, Any] | None:
    """Bound local GPU work and fail closed when inference is busy or unavailable."""
    if _circuit_is_open():
        return None
    acquired = False
    try:
        await asyncio.wait_for(
            _llm_slots.acquire(),
            timeout=_positive_float("LLM_QUEUE_TIMEOUT_SECONDS", 15.0),
        )
        acquired = True
        request_timeout = _positive_float("LLM_REQUEST_TIMEOUT_SECONDS", 45.0)
        timeout = httpx.Timeout(
            request_timeout,
            connect=min(_positive_float("LLM_CONNECT_TIMEOUT_SECONDS", 2.0), request_timeout),
            pool=min(_positive_float("LLM_POOL_TIMEOUT_SECONDS", 2.0), request_timeout),
        )
        async with httpx.AsyncClient(timeout=timeout) as client:
            response = await client.post(url, headers=headers, json=payload)
            response.raise_for_status()
            body = response.json()
        if not isinstance(body, dict):
            _record_failure()
            return None
        _record_success()
        return body
    except (TimeoutError, httpx.HTTPError, KeyError, TypeError, ValueError):
        _record_failure()
        return None
    finally:
        if acquired:
            _llm_slots.release()
