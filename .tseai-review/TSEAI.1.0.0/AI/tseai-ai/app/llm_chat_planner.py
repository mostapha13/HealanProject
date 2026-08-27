from __future__ import annotations

import json
import os
import re

from .chat_planner import ChatPlan
from .local_inference import post_chat_completion


_ALLOWED_INTENTS = {
    "knowledge",
    "marketsymbol",
    "marketfilter",
    "hybrid",
    "clarification",
}

_ALLOWED_FIELDS = {
    "last_price",
    "closing_price",
    "trade_volume",
    "trade_value",
    "market_value",
    "trade_count",
    "pe",
    "eps",
    "observed_at",
    "market_summary",
    "identity",
    "instrument_id",
    "ins_code",
    "first_price",
    "yesterday_price",
    "high_price",
    "low_price",
    "last_price_change",
    "last_price_change_percent",
    "closing_price_change",
    "closing_price_change_percent",
    "effect_on_index",
    "raw_min_value",
    "raw_max_value",
    "best_bid",
    "best_ask",
    "best_bid_price",
    "best_bid_volume",
    "best_bid_count",
    "best_ask_price",
    "best_ask_volume",
    "best_ask_count",
    "orderbook",
    "bid_levels",
    "ask_levels",
    "orderbook_level",
    "spread",
    "spread_percent",
    "mid_price",
    "total_bid_volume",
    "total_ask_volume",
    "total_bid_count",
    "total_ask_count",
    "total_bid_value",
    "total_ask_value",
    "orderbook_imbalance",
    "depth_ratio",
    "largest_bid_level",
    "largest_ask_level",
    "orderbook_state",
    "orderbook_observed_at",
    "orderbook_sequence",
    "market",
    "board",
    "industry",
    "state",
    "intraday_range",
    "average_trade_price",
    "average_trade_value",
    "average_trade_volume",
    "turnover_ratio",
}

# llama.cpp expands bounded JSON-schema strings into a very large grammar.
# JSON-object mode is portable; _parse_plan below remains the strict trust
# boundary for allowed fields, enums, entity surfaces and output lengths.
_RESPONSE_FORMAT = {"type": "json_object"}

_SYSTEM_PROMPT = """You are the semantic query-understanding layer of TSEAI, a Persian Tehran Stock Exchange assistant.
Understand meaning, not keyword spelling. Formal, colloquial, misspelled and differently worded Persian questions with the same meaning must produce the same plan.

You do not answer the question and you never generate SQL or call a tool. Convert the user request to one bounded JSON plan.

Allowed intents:
- marketsymbol: a fact, metric, date or current/historical trading state for one named symbol, instrument, company or index.
- marketfilter: a list, ranking or screening condition over multiple symbols.
- knowledge: people and organizational roles, news, announcements, rules, definitions, descriptive company information and other document knowledge.
- hybrid: the answer requires both a market fact and document/news explanation for a named symbol.
- clarification: a required entity or meaning is genuinely ambiguous or missing.

Entity rules:
- symbol contains only the user's named market entity, without words such as symbol, price, date, related, today or question phrases.
- Copy the longest complete market entity mention from the question. Do not shorten a company phrase to a generic word inside it.
- Do not guess a symbol or person.
- knowledge_query is a concise Persian search rewrite that preserves the organization, role, topic and time meaning.
- Different forms such as «کیه»، «کی هست»، «چه کسیه»، «کی می‌باشد» and «چه کسی می‌باشد» all express the same person question.
- A request for the observation date of a price is marketsymbol and must keep only the actual symbol.
- Use clarification only when missing information prevents safe retrieval, not merely because wording is colloquial.

For marketsymbol and hybrid, requested_fields contains only explicitly requested facts. In addition to last_price, closing_price, trade_volume, trade_value, market_value, trade_count, pe, eps, observed_at and market_summary, use: identity (symbol/company name), instrument_id, ins_code, first_price (first/opening trade), yesterday_price (the snapshot's previous-day/base price), high_price, low_price, last_price_change, last_price_change_percent, closing_price_change, closing_price_change_percent, effect_on_index, raw_min_value, raw_max_value, best_bid/best_ask (complete top quote), best_bid_price/best_ask_price, best_bid_volume/best_ask_volume, best_bid_count/best_ask_count, orderbook (both five-level sides), bid_levels, ask_levels, orderbook_level, spread, spread_percent, mid_price, total_bid_volume, total_ask_volume, total_bid_count, total_ask_count, total_bid_value, total_ask_value, orderbook_imbalance, depth_ratio, largest_bid_level, largest_ask_level, orderbook_state, orderbook_observed_at, orderbook_sequence (BestLimitCounter), market, board, industry, state, intraday_range, average_trade_price (trade value divided by volume), average_trade_value (trade value divided by trade count), average_trade_volume (volume divided by trade count), and turnover_ratio (trade value divided by market value). Preserve multiple requested facts, including the named fact whose observation date is requested. Use observed_at for the market snapshot date and orderbook_observed_at for source/update times of the order book. «قیمت دیروز»، «قیمت مبنا» or «قیمت روز قبل» for one current snapshot means yesterday_price, not a historical-data request. trade_volume is executed market volume; it is never an order-book quantity. For other intents use an empty list.

Metric meaning is semantic, independent of spelling:
- «نسبت قیمت به سود»، «پی بر ای» and P/E mean pe, never last_price.
- «سود هر سهم»، «سود به ازای هر سهم» and EPS mean eps.
- «سرمایه بازار» and «ارزش بازار شرکت» mean market_value.
- «بالاترین/سقف قیمت روز» means high_price; «کمترین/کف قیمت روز» means low_price.
- «قیمت آغازین/بازگشایی/اولین معامله» means first_price.
- «اثر روی شاخص» means effect_on_index.
- «بازار، تابلوی معاملاتی، صنعت و وضعیت مجاز/ممنوع» are market, board, industry and state respectively.
- A question about one named company remains marketsymbol even when it says «چند است»; marketfilter is only for a list, ranking or condition across several instruments.

Examples are illustrations of the ontology, not phrase-matching rules:
- «نسبت قیمت به سود پالایش نفت اصفهان چقدره؟» => marketsymbol, symbol «پالایش نفت اصفهان», requested_fields [pe]
- «پی بر ای فولاد مبارکه را می‌گویی؟» => marketsymbol, symbol «فولاد مبارکه», requested_fields [pe]
- «سود به ازای هر سهم شرکت نمونه چیست؟» => marketsymbol, symbol «شرکت نمونه», requested_fields [eps]
- «کدام سهم‌ها بیشترین ارزش معامله را دارند؟» => marketfilter, requested_fields []

Return strict JSON only with exactly these keys:
{"intent":"knowledge|marketsymbol|marketfilter|hybrid|clarification","symbol":string|null,"knowledge_query":string|null,"confidence":number,"clarification":string|null,"reasons":[],"requested_fields":[string]}
"""


def _clean_optional_text(value: object, maximum: int) -> str | None:
    if value is None:
        return None
    if not isinstance(value, str):
        return None
    cleaned = " ".join(value.strip().split())
    if not cleaned or len(cleaned) > maximum or any(x in cleaned for x in ("\n", "\r", "\x00")):
        return None
    return cleaned


def _normalized_surface(value: str) -> str:
    value = (value.lower().replace("ي", "ی").replace("ى", "ی").replace("ك", "ک")
             .replace("‌", " ").replace(" ", " "))
    value = re.sub(r"[^\w\u0600-\u06ff]+", " ", value, flags=re.UNICODE)
    return " ".join(value.split())


def _parse_plan(content: object, question: str, recover_entity: bool = False) -> ChatPlan | None:
    if not isinstance(content, str):
        return None
    cleaned = re.sub(r"^```(?:json)?|```$", "", content.strip(), flags=re.I | re.M).strip()
    try:
        value = json.loads(cleaned)
    except json.JSONDecodeError:
        return None
    if not isinstance(value, dict) or set(value) != {
        "intent", "symbol", "knowledge_query", "confidence", "clarification", "reasons", "requested_fields"
    }:
        return None

    intent = value.get("intent")
    if not isinstance(intent, str):
        return None
    intent = intent.strip().lower()
    if intent not in _ALLOWED_INTENTS:
        return None

    symbol = _clean_optional_text(value.get("symbol"), 200)
    knowledge_query = _clean_optional_text(value.get("knowledge_query"), 1000)
    clarification = _clean_optional_text(value.get("clarification"), 500)
    confidence = value.get("confidence")
    reasons = value.get("reasons")
    requested_fields = value.get("requested_fields")
    if isinstance(confidence, bool) or not isinstance(confidence, (int, float)):
        return None
    if not isinstance(reasons, list) or len(reasons) > 10 or not all(isinstance(x, str) for x in reasons):
        return None
    if not isinstance(requested_fields, list) or len(requested_fields) > 16:
        return None
    if not all(isinstance(x, str) and x in _ALLOWED_FIELDS for x in requested_fields):
        return None
    requested_fields = list(dict.fromkeys(requested_fields))
    safe_reasons = [" ".join(x.strip().split())[:100] for x in reasons if x.strip()]

    if intent in ("marketsymbol", "hybrid") and not symbol:
        return None
    symbol_is_surface = bool(symbol) and _normalized_surface(symbol) in _normalized_surface(question)
    symbol_is_specific = bool(symbol) and (
        symbol.isdigit()
        or len(re.sub(r"\W+", "", _normalized_surface(symbol), flags=re.UNICODE)) >= 3
    )
    if symbol and (not symbol_is_surface or not symbol_is_specific):
        # Entity text is a pointer into the authoritative SQL catalog, not a place
        # for the model to translate a Persian name into a guessed ticker. After
        # one repair attempt keep the semantic plan and let the authoritative
        # backend entity linker inspect the original user surface instead.
        if not recover_entity or len(question) > 256:
            return None
        symbol = question
    if intent == "hybrid" and not knowledge_query:
        knowledge_query = question
    if intent == "knowledge" and not knowledge_query:
        knowledge_query = question
    if intent == "clarification" and not clarification:
        return None

    # The model is an untrusted planner. Keep its confidence bounded and let the
    # authoritative backend resolve entities and choose from its fixed tool registry.
    bounded_confidence = min(0.97, max(0.0, float(confidence)))
    return ChatPlan(
        intent,
        symbol,
        knowledge_query,
        bounded_confidence,
        clarification,
        ["llm-semantic-plan", *safe_reasons],
        requested_fields,
    )


async def plan_chat_with_llm(question: str) -> ChatPlan | None:
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
    messages = [
        {"role": "system", "content": _SYSTEM_PROMPT},
        {"role": "user", "content": question},
    ]
    payload = {
        "model": model,
        "temperature": 0,
        "max_tokens": 192,
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
        plan = _parse_plan(content, question, recover_entity=attempt > 0)
        if plan is not None:
            return plan
        if attempt == 0:
            messages = [
                *messages,
                {"role": "assistant", "content": str(content)[:2000]},
                {"role": "user", "content": "Previous output failed the strict schema or entity-copy check. Return corrected JSON only. Never invent or translate a ticker: symbol must be the longest complete market entity phrase copied exactly from my original question, not a generic word inside the company name. Use only allowed requested_fields."},
            ]
            payload = {**payload, "messages": messages}
    return None
