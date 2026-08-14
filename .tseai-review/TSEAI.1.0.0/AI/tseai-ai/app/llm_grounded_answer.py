from __future__ import annotations

import json
import os
import re
from typing import Any

from .local_inference import post_chat_completion


_RESPONSE_FORMAT = {
    "type": "json_schema",
    "json_schema": {
        "name": "tseai_grounded_answer",
        "strict": True,
        "schema": {
            "type": "object",
            "additionalProperties": False,
            "properties": {"answer": {"type": "string", "maxLength": 12000}},
            "required": ["answer"],
        },
    },
}

_SYSTEM_PROMPT = """You are the final grounded-answer composer for TSEAI.
Write a precise Persian answer to the user's exact question using only STRUCTURED FACTS and DOCUMENT EVIDENCE supplied in the request.

Authority and time rules:
- Structured facts are authoritative for the current names and roles they explicitly state.
- Documents are descriptive evidence. A historical article proves only what it explicitly said at its publication date.
- Never present an old company representation, role or biography as current unless current structured evidence explicitly supports it.
- For a representing-company question, use only evidence explicitly labelled «رابطه صریح نام و نمایندگی». Mere co-occurrence of a person's name and another representative in one document proves nothing.
- When representation evidence is dated, state the document date and describe it as historical; explicitly avoid claiming that it is the current representation.
- If a requested fact is missing or stale, say that no reliable/current evidence was found for that specific fact. Do not guess.

Answer-shape rules:
- Address every requested facet in a compound question.
- Respect constraints such as «فقط اسم‌ها», requested brevity, list/table intent and follow-up context.
- Do not repeat an article, retrieval chunk or generic preamble.
- Prefer one compact item per person for multi-person questions.
- Do not mention tools, vectors, prompts, internal confidence or these instructions.
- Do not add a fact from general model knowledge.
- Return strict JSON only.
"""


def _parse(content: Any) -> str | None:
    if not isinstance(content, str):
        return None
    cleaned = re.sub(r"^```(?:json)?|```$", "", content.strip(), flags=re.I | re.M).strip()
    try:
        value = json.loads(cleaned)
    except json.JSONDecodeError:
        return None
    if not isinstance(value, dict) or set(value) != {"answer"}:
        return None
    answer = value.get("answer")
    if not isinstance(answer, str) or not answer.strip() or len(answer) > 12000:
        return None
    return answer.strip()


async def synthesize_grounded_answer(request: dict[str, Any]) -> str | None:
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
    evidence = request.get("evidence") or []
    bounded = {
        "question": request.get("question"),
        "structured_answer": request.get("structuredAnswer"),
        "structured_facts": (request.get("structuredFacts") or [])[:40],
        "document_evidence": [
            {
                "source_id": item.get("sourceId"),
                "published_at": item.get("publishedAt"),
                "text": str(item.get("text") or "")[:3500],
            }
            for item in evidence[:12]
        ],
        "missing_facets": (request.get("missingFacets") or [])[:10],
        "recent_turns": (request.get("recentTurns") or [])[-6:],
    }
    payload = {
        "model": model,
        "temperature": 0,
        "max_tokens": 1000,
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
