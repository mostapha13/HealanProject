from __future__ import annotations

import json
import os
import re
from typing import Any

from .chat_reflection import ReflectionDecision
from .local_inference import post_chat_completion


_ACTIONS = {"accept", "retrieve_more", "clarify"}
_RESPONSE_FORMAT = {"type": "json_object"}

_SYSTEM_PROMPT = """You are the bounded final-answer reviewer for a Persian RAG assistant.
Compare the USER QUESTION, CANDIDATE ANSWER and supplied EVIDENCE.

Choose:
- accept: the answer directly addresses every requested facet, follows requested format, and makes no claim beyond evidence.
- retrieve_more: a requested facet is missing and a focused evidence query could resolve it. Provide that Persian query.
- clarify: a required referent is genuinely ambiguous, a required tool failed, or the answer contains an unsupported claim that cannot safely be repaired by retrieval.

Rules:
- Do not answer or rewrite the answer.
- Treat an explicit statement that reliable data was not found as valid when evidence truly lacks that fact.
- A concise answer is correct when the user requested only names or one fact.
- required_response_shape is binding: names_only must contain only names, short must avoid unrelated background, and list/table requests must be complete enough for the evidence supplied.
- Historical evidence must not be presented as current fact.
- Output strict JSON only.
"""


def _parse(content: Any) -> ReflectionDecision | None:
    if not isinstance(content, str):
        return None
    cleaned = re.sub(r"^```(?:json)?|```$", "", content.strip(), flags=re.I | re.M).strip()
    try:
        value = json.loads(cleaned)
    except json.JSONDecodeError:
        return None
    if not isinstance(value, dict) or set(value) != {"action", "improved_query", "clarification", "reasons"}:
        return None
    action = value.get("action")
    improved = value.get("improved_query")
    clarification = value.get("clarification")
    reasons = value.get("reasons")
    if action not in _ACTIONS or not isinstance(reasons, list) or len(reasons) > 4:
        return None
    if any(not isinstance(x, str) for x in reasons):
        return None
    if improved is not None and not isinstance(improved, str):
        return None
    if clarification is not None and not isinstance(clarification, str):
        return None
    if isinstance(improved, str) and len(improved) > 2000:
        return None
    if isinstance(clarification, str) and len(clarification) > 500:
        return None
    if action == "retrieve_more" and not improved:
        return None
    if action == "clarify" and not clarification:
        clarification = "برای پاسخ دقیق‌تر، مرجع سؤال را مشخص کنید."
    return ReflectionDecision(action, improved, clarification, [" ".join(x.split())[:100] for x in reasons])


async def reflect_chat_with_llm(request: dict[str, Any]) -> ReflectionDecision | None:
    if os.getenv("LLM_CHAT_PLANNER_ENABLED", "false").lower() != "true":
        return None
    base = os.getenv("LLM_BASE_URL", "").rstrip("/")
    model = os.getenv("LLM_MODEL", "")
    if not base or not model:
        return None
    headers = {"Content-Type": "application/json"}
    key = os.getenv("LLM_API_KEY", "")
    if key:
        headers["Authorization"] = "Bearer " + key
    bounded = {
        "question": request.get("question"),
        "candidate_answer": str(request.get("answer") or "")[:1800],
        "intent": request.get("intent"),
        "confidence": request.get("confidence"),
        "failed_tools": request.get("failedTools") or [],
        "semantic_domain": request.get("semanticDomain"),
        "semantic_operation": request.get("semanticOperation"),
        "required_response_shape": request.get("responseShape"),
        # The preview model has a 4096-token context. A previous 12x3500
        # character envelope could exceed it, return 503 and open the shared
        # circuit breaker. Four focused excerpts are enough for bounded review.
        "evidence": [str(x)[:800] for x in (request.get("evidence") or [])[:4]],
    }
    payload = {
        "model": model,
        "temperature": 0,
        "max_tokens": 256,
        "response_format": _RESPONSE_FORMAT,
        "chat_template_kwargs": {"enable_thinking": False},
        "messages": [
            {"role": "system", "content": _SYSTEM_PROMPT},
            {"role": "user", "content": json.dumps(bounded, ensure_ascii=False)},
        ],
    }
    response = await post_chat_completion(base + "/chat/completions", headers, payload)
    if not response:
        return None
    try:
        content = response["choices"][0]["message"]["content"]
    except (KeyError, IndexError, TypeError):
        return None
    return _parse(content)
