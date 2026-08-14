from __future__ import annotations

import json
import os
import re
from typing import Any

from .local_inference import post_chat_completion


_RESPONSE_FORMAT = {
    "type": "json_schema",
    "json_schema": {
        "name": "tseai_conversation_rewrite",
        "strict": True,
        "schema": {
            "type": "object",
            "additionalProperties": False,
            "properties": {
                "standalone_question": {"type": "string", "maxLength": 4000},
                "context_applied": {"type": "boolean"},
                "reason": {"type": ["string", "null"], "maxLength": 100},
            },
            "required": ["standalone_question", "context_applied", "reason"],
        },
    },
}

_SYSTEM_PROMPT = """You rewrite a Persian follow-up question into a standalone question for TSEAI.
Use only the supplied active reference and recent turns. Resolve pronouns, omitted subjects and phrases such as «او»، «ایشان»، «آن شرکت»، «نماینده کدام شرکت» or «سابقه‌اش» when the context makes the referent unambiguous.

Rules:
- Do not answer the question.
- Do not add or infer facts that are absent from the supplied context.
- Preserve every request facet, comparison, date, output constraint and named entity in the new user question.
- If the question starts a new topic or the referent is ambiguous, return the original question and context_applied=false.
- A short follow-up may depend on the immediately preceding answer even if it does not contain an explicit pronoun.
- Output strict JSON only.
"""


def _parse(content: Any, original: str) -> dict[str, Any] | None:
    if not isinstance(content, str):
        return None
    cleaned = re.sub(r"^```(?:json)?|```$", "", content.strip(), flags=re.I | re.M).strip()
    try:
        value = json.loads(cleaned)
    except json.JSONDecodeError:
        return None
    if not isinstance(value, dict) or set(value) != {"standalone_question", "context_applied", "reason"}:
        return None
    question = value.get("standalone_question")
    applied = value.get("context_applied")
    reason = value.get("reason")
    if not isinstance(question, str) or not question.strip() or len(question) > 4000:
        return None
    if not isinstance(applied, bool) or (reason is not None and not isinstance(reason, str)):
        return None
    if not applied:
        question = original
    return {
        "standalone_question": " ".join(question.split()),
        "context_applied": applied,
        "reason": (" ".join(reason.split())[:100] if isinstance(reason, str) and reason.strip() else None),
    }


async def rewrite_conversation_with_llm(
    question: str,
    active_reference: dict[str, Any] | None,
    recent_turns: list[dict[str, Any]],
) -> dict[str, Any] | None:
    if os.getenv("LLM_CHAT_PLANNER_ENABLED", "false").lower() != "true" or not recent_turns:
        return None
    base = os.getenv("LLM_BASE_URL", "").rstrip("/")
    model = os.getenv("LLM_MODEL", "")
    if not base or not model:
        return None
    headers = {"Content-Type": "application/json"}
    key = os.getenv("LLM_API_KEY", "")
    if key:
        headers["Authorization"] = "Bearer " + key
    context = {
        "active_reference": active_reference,
        "recent_turns": recent_turns[-8:],
        "new_question": question,
    }
    payload = {
        "model": model,
        "temperature": 0,
        "max_tokens": 256,
        "response_format": _RESPONSE_FORMAT,
        "chat_template_kwargs": {"enable_thinking": False},
        "messages": [
            {"role": "system", "content": _SYSTEM_PROMPT},
            {"role": "user", "content": json.dumps(context, ensure_ascii=False)},
        ],
    }
    response = await post_chat_completion(base + "/chat/completions", headers, payload)
    if not response:
        return None
    try:
        content = response["choices"][0]["message"]["content"]
    except (KeyError, IndexError, TypeError):
        return None
    return _parse(content, question)
