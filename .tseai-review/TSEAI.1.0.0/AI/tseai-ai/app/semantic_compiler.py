from __future__ import annotations

import json
import os
import re
from dataclasses import dataclass
from typing import Any

from .local_inference import post_chat_completion


_DOMAINS = {
    "unknown", "market", "company", "company_state", "instrument", "order_book",
    "client_type", "financial_institution", "content", "organization", "market_filter", "knowledge",
}
_OPERATIONS = {
    "unknown", "lookup", "count", "list", "rank", "compare", "latest", "aggregate",
    "relationship", "definition", "explain",
}
_SHAPES = {"short", "names_only", "list", "table", "summary", "detailed"}
_ENTITY_KINDS = {
    "symbol", "company", "person", "organization", "regional_hall", "financial_institution",
    "content", "index", "role", "unknown",
}
_METRICS = {
    "identity", "price", "last_price", "closing_price", "trade_volume", "trade_value", "market_value",
    "trade_count", "pe", "eps", "observed_at", "order_book", "best_bid", "best_ask", "spread",
    "client_type", "real_buy_volume", "real_sell_volume", "legal_buy_volume", "legal_sell_volume",
    "company_title", "symbol", "hall", "phone", "website", "ceo", "ipo_date", "company_state",
    "state_reason", "board_members", "person_name", "role", "representation", "parent_unit",
    "subordinates", "content_title", "content_body", "publish_at", "count",
}
_RESPONSE_FORMAT = {"type": "json_object"}


@dataclass(frozen=True)
class SemanticFrame:
    domain: str
    operation: str
    entities: list[dict[str, str]]
    metrics: list[str]
    temporal_expression: str | None
    response_shape: str
    canonical_question: str
    confidence: float
    requires_clarification: bool
    clarification: str | None
    reasons: list[str]


_SYSTEM_PROMPT = """You are the semantic compiler of TSEAI, a Persian Tehran Stock Exchange assistant.
Your job is to understand meaning across formal, colloquial, incomplete-looking, misspelled and reordered Persian wording. You do not answer, generate SQL, invent facts or choose arbitrary tools. Produce one strict JSON semantic frame.

Domains:
- market: current/historical price, volume, value, P/E, EPS and trading facts for a named instrument.
- instrument: identity and reference fields of an exchange instrument.
- order_book: bids, asks, spread and market depth.
- client_type: حقیقی/حقوقی participant counts and volumes.
- company: company identity, regional hall, CEO field, contact data and IPO date.
- company_state: suspension/state, reason, issuer CEO or board data held in CompanyState.
- financial_institution: Nahad_Mali branches/offices, types and their regional halls.
- organization: TSE management people, roles, reporting hierarchy, representatives and board.
- content: news/content records, publish dates and latest news.
- market_filter: ranking, screening or conditions across multiple symbols.
- knowledge: rules, explanations, history or descriptive document questions.
- unknown: genuinely insufficient meaning.

Operations: lookup, count, list, rank, compare, latest, aggregate, relationship, definition, explain, unknown.
Response shapes: short, names_only, list, table, summary, detailed.

Rules:
1. Copy entity values exactly from the user's question; never invent or translate a ticker/name.
   entities contains only a concrete named symbol, company, person, organization, hall, institution,
   content or role explicitly present in the question. A generic phrase such as «آخرین شرکت»،
   «شرکتی که آمده» or «اسمش» is not an entity; use an empty entities array.
2. canonical_question is a concise standalone Persian question using explicit domain language that TSEAI typed tools understand. Preserve every requested facet, entity, temporal meaning and output shape.
3. Do not add facts. Do not generate SQL/table identifiers unless the user already named them or the domain name is needed to make the request explicit.
4. Structured counts/lookups must stay structured. Never rewrite a numeric, identity, organization, hall or status request as a news search.
5. «شمارش»، «چندتا داریم»، «تعدادش»، «چقدره ازش هست» can mean count. Bind the counted object from context within the same question. If the object is genuinely absent, require clarification.
6. «کیه»، «چه کسیه»، «کی هست»، «چه فردی است» and equivalent forms are lookup(person/role), not document search.
7. If one phrase can safely mean two materially different metrics and no context resolves it, set requires_clarification=true and ask one short Persian clarification question.
8. Colloquial wording alone is never a reason to clarify.
9. For names-only requests canonical_question must explicitly retain «فقط نام‌ها».
10. confidence is semantic confidence, at most 0.98.
11. Set-level operations do not require a named entity. In particular, a request for the latest/newest
    company that entered or was admitted to the exchange is company/latest with company_title+ipo_date
    and does not require clarification merely because no company name was supplied.

Allowed entity kinds only: symbol, company, person, organization, regional_hall,
financial_institution, content, index, role, unknown.
Allowed metrics only: identity, price, last_price, closing_price, trade_volume, trade_value,
market_value, trade_count, pe, eps, observed_at, order_book, best_bid, best_ask, spread,
client_type, real_buy_volume, real_sell_volume, legal_buy_volume, legal_sell_volume,
company_title, symbol, hall, phone, website, ceo, ipo_date, company_state, state_reason,
board_members, person_name, role, representation, parent_unit, subordinates, content_title,
content_body, publish_at, count.

Examples:
- تالار کرمان شمارش چنده؟ => financial_institution/count, entity regional_hall=کرمان, canonical «تعداد نهادهای مالی تالار کرمان چقدر است؟»
- چند شرکت به تالار کرمان وصل‌اند؟ => company/count, entity regional_hall=کرمان, canonical «تعداد شرکت‌های منتسب به تالار کرمان چقدر است؟»
- کی مسئول فناوری بورسه؟ => organization/lookup; preserve the organization wording from the question.
- آخری عرضه اولیه چی بوده؟ => company/latest, metrics company_title+ipo_date.
- فملی چند دست به دست شده؟ => market/lookup, metric trade_volume; entity symbol=فملی.
- کرمان چندتاست؟ => unknown and clarification because the counted object is absent.

Return exactly these keys and nothing else:
{"domain":"...","operation":"...","entities":[{"kind":"...","value":"..."}],"metrics":["..."],"temporal_expression":string|null,"response_shape":"...","canonical_question":"...","confidence":number,"requires_clarification":boolean,"clarification":string|null,"reasons":["..."]}
"""


def _normalize(value: str) -> str:
    value = (value or "").lower().replace("ي", "ی").replace("ى", "ی").replace("ك", "ک").replace("‌", " ")
    return " ".join(re.sub(r"[^\w\u0600-\u06ff]+", " ", value, flags=re.UNICODE).split())


def _clean(value: Any, maximum: int) -> str | None:
    if value is None or not isinstance(value, str):
        return None
    result = " ".join(value.strip().split())
    if not result or len(result) > maximum or any(ch in result for ch in ("\n", "\r", "\x00")):
        return None
    return result


def _parse_frame(content: Any, question: str) -> SemanticFrame | None:
    if not isinstance(content, str):
        return None
    cleaned = re.sub(r"^```(?:json)?|```$", "", content.strip(), flags=re.I | re.M).strip()
    try:
        value = json.loads(cleaned)
    except json.JSONDecodeError:
        return None
    expected = {
        "domain", "operation", "entities", "metrics", "temporal_expression", "response_shape",
        "canonical_question", "confidence", "requires_clarification", "clarification", "reasons",
    }
    if not isinstance(value, dict) or set(value) != expected:
        return None
    domain, operation, shape = value.get("domain"), value.get("operation"), value.get("response_shape")
    if domain not in _DOMAINS or operation not in _OPERATIONS or shape not in _SHAPES:
        return None
    confidence = value.get("confidence")
    requires = value.get("requires_clarification")
    if isinstance(confidence, bool) or not isinstance(confidence, (int, float)) or not isinstance(requires, bool):
        return None
    entities = value.get("entities")
    metrics = value.get("metrics")
    reasons = value.get("reasons")
    if not isinstance(entities, list) or len(entities) > 4 or not isinstance(metrics, list) or len(metrics) > 16:
        return None
    if not isinstance(reasons, list) or len(reasons) > 8 or any(not isinstance(x, str) for x in reasons):
        return None
    if any(not isinstance(x, str) for x in metrics):
        return None
    name_alias = {
        "organization": "person_name",
        "company": "company_title",
        "content": "content_title",
    }.get(domain, "identity")
    metrics = [name_alias if x == "name" else x for x in metrics]
    if any(x not in _METRICS for x in metrics):
        return None
    canonical = _clean(value.get("canonical_question"), 1000)
    temporal = _clean(value.get("temporal_expression"), 120)
    clarification = _clean(value.get("clarification"), 500)
    if canonical is None or (requires and clarification is None):
        return None

    # This is a contract invariant, not a phrase rule: latest company/IPO is a
    # population query and cannot require a specific company entity.
    if (domain == "company" and operation == "latest"
            and any(x in metrics for x in ("company_title", "ipo_date"))
            and float(confidence) >= .75):
        requires = False
        clarification = None

    source, target = _normalize(question), _normalize(canonical)
    safe_entities: list[dict[str, str]] = []
    for item in entities:
        if not isinstance(item, dict) or set(item) != {"kind", "value"} or item.get("kind") not in _ENTITY_KINDS:
            return None
        entity = _clean(item.get("value"), 200)
        if entity is None:
            return None
        surface = _normalize(entity)
        # A role descriptor may be semantically normalized by the compiler
        # (for example «کار فناوری را می‌چرخاند» -> «مسئول فناوری»). It is not
        # a named entity, so discard a non-verbatim role mention while keeping
        # strict copy protection for people, companies, symbols and places.
        if item["kind"] == "role" and (surface not in source or surface not in target):
            continue
        if len(surface) < 2 or surface not in source or surface not in target:
            return None
        safe_entities.append({"kind": item["kind"], "value": entity})

    source_terms = {x for x in source.split() if len(x) > 1}
    target_terms = set(target.split())
    # A real semantic rewrite often replaces the complete colloquial predicate.
    # Named entities remain exact-copy guarded above; one lexical anchor is enough
    # for the remaining question text.
    if source_terms and not any(term in target_terms for term in source_terms):
        return None
    if domain == "unknown" and not requires:
        return None
    safe_reasons = [" ".join(x.split())[:100] for x in reasons if x.strip()]
    return SemanticFrame(
        domain, operation, safe_entities, list(dict.fromkeys(metrics)), temporal, shape, canonical,
        min(0.98, max(0.0, float(confidence))), requires, clarification, safe_reasons,
    )


def compile_semantic_deterministic(question: str) -> SemanticFrame | None:
    """Small availability fallback. General semantic coverage belongs to the local LLM."""
    q = _normalize(question)
    hall_match = re.search(r"(?:تالار(?: منطقه ای)?\s+)([\u0600-\u06ff]+)", q)
    if hall_match and any(cue in q for cue in ("شمارش", "تعدادش", "چند نهاد", "تعداد نهاد")):
        hall = hall_match.group(1)
        return SemanticFrame(
            "financial_institution", "count", [{"kind": "regional_hall", "value": hall}], ["count"], None,
            "short", f"تعداد نهادهای مالی تالار {hall} چقدر است؟", 0.96, False, None,
            ["deterministic-colloquial-hall-count"],
        )
    if len(q) < 3:
        return SemanticFrame(
            "unknown", "unknown", [], [], None, "short", question, 0.2, True,
            "لطفاً موضوع یا موجودیتی را که درباره آن سؤال دارید مشخص کنید.", ["insufficient-question"],
        )
    return None


async def compile_semantic_with_llm(question: str) -> SemanticFrame | None:
    enabled = os.getenv("LLM_SEMANTIC_COMPILER_ENABLED", os.getenv("LLM_CHAT_PLANNER_ENABLED", "false"))
    if enabled.lower() != "true":
        return None
    base = os.getenv("LLM_BASE_URL", "").rstrip("/")
    model = os.getenv("LLM_MODEL", "")
    if not base or not model:
        return None
    headers = {"Content-Type": "application/json"}
    key = os.getenv("LLM_API_KEY", "")
    if key:
        headers["Authorization"] = "Bearer " + key
    messages = [{"role": "system", "content": _SYSTEM_PROMPT}, {"role": "user", "content": question}]
    payload = {
        "model": model,
        "temperature": 0,
        "max_tokens": 384,
        "response_format": _RESPONSE_FORMAT,
        "chat_template_kwargs": {"enable_thinking": False},
        "messages": messages,
    }
    for attempt in range(2):
        response = await post_chat_completion(base + "/chat/completions", headers, payload)
        if not response:
            return None
        try:
            content = response["choices"][0]["message"]["content"]
        except (KeyError, IndexError, TypeError):
            return None
        frame = _parse_frame(content, question)
        if frame is not None:
            return frame
        if attempt == 0:
            messages = [
                *messages,
                {"role": "assistant", "content": str(content)[:2000]},
                {"role": "user", "content": "خروجی با قرارداد سازگار نبود. فقط JSON اصلاح‌شده با کلیدهای دقیق قرارداد برگردان. entities فقط برای نام مشخصِ شخص، نماد، شرکت، سازمان، تالار یا سمتِ عیناً موجود در سؤال است؛ عبارت عمومی یا پرسشی entity نیست. فقط از entity kind و metricهای allowlist پیام system استفاده کن و هیچ واقعیتی اضافه نکن."},
            ]
            payload = {**payload, "messages": messages}
    return None


async def compile_semantic(question: str) -> tuple[SemanticFrame | None, str]:
    frame = await compile_semantic_with_llm(question)
    if frame is not None:
        return frame, "bounded-local-llm-v1"
    return compile_semantic_deterministic(question), "deterministic-availability-v1"
