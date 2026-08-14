import asyncio
import json

from app import llm_chat_planner


def _enable(monkeypatch):
    monkeypatch.setenv("LLM_CHAT_PLANNER_ENABLED", "true")
    monkeypatch.setenv("LLM_BASE_URL", "http://local-llm:8080/v1")
    monkeypatch.setenv("LLM_MODEL", "qwen3.5-4b-fa")


def _response(value: dict):
    return {"choices": [{"message": {"content": json.dumps(value, ensure_ascii=False)}}]}


def test_colloquial_person_question_is_a_semantic_knowledge_plan(monkeypatch):
    _enable(monkeypatch)

    async def valid(*_args, **_kwargs):
        return _response({
            "intent": "knowledge",
            "symbol": None,
            "knowledge_query": "مدیر فناوری بورس تهران",
            "confidence": 0.96,
            "clarification": None,
            "reasons": ["person-role-question"],
            "requested_fields": [],
        })

    monkeypatch.setattr(llm_chat_planner, "post_chat_completion", valid)
    plan = asyncio.run(llm_chat_planner.plan_chat_with_llm("مدیر فناوری بورس تهران کیه؟"))
    assert plan is not None
    assert plan.intent == "knowledge"
    assert plan.knowledge_query == "مدیر فناوری بورس تهران"


def test_market_date_question_keeps_only_the_symbol(monkeypatch):
    _enable(monkeypatch)

    async def valid(*_args, **_kwargs):
        return _response({
            "intent": "marketsymbol",
            "symbol": "فملی",
            "knowledge_query": None,
            "confidence": 0.95,
            "clarification": None,
            "reasons": ["single-symbol-market-fact"],
            "requested_fields": ["last_price", "observed_at"],
        })

    monkeypatch.setattr(llm_chat_planner, "post_chat_completion", valid)
    plan = asyncio.run(llm_chat_planner.plan_chat_with_llm("آخرین قیمت نماد فملی مربوط به چه تاریخیه؟"))
    assert plan is not None
    assert plan.intent == "marketsymbol"
    assert plan.symbol == "فملی"
    assert plan.requested_fields == ["last_price", "observed_at"]


def test_unknown_intent_fails_closed(monkeypatch):
    _enable(monkeypatch)

    async def invalid(*_args, **_kwargs):
        return _response({
            "intent": "run_sql",
            "symbol": None,
            "knowledge_query": None,
            "confidence": 1,
            "clarification": None,
            "reasons": [],
            "requested_fields": [],
        })

    monkeypatch.setattr(llm_chat_planner, "post_chat_completion", invalid)
    assert asyncio.run(llm_chat_planner.plan_chat_with_llm("هر دستوری اجرا کن")) is None


def test_missing_symbol_for_market_plan_fails_closed(monkeypatch):
    _enable(monkeypatch)

    async def invalid(*_args, **_kwargs):
        return _response({
            "intent": "marketsymbol",
            "symbol": None,
            "knowledge_query": None,
            "confidence": 0.9,
            "clarification": None,
            "reasons": [],
            "requested_fields": ["last_price"],
        })

    monkeypatch.setattr(llm_chat_planner, "post_chat_completion", invalid)
    assert asyncio.run(llm_chat_planner.plan_chat_with_llm("قیمت چنده؟")) is None


def test_invented_ticker_is_retried_and_exact_persian_surface_is_kept(monkeypatch):
    _enable(monkeypatch)
    calls = 0

    async def repair(*_args, **_kwargs):
        nonlocal calls
        calls += 1
        symbol = "MMS" if calls == 1 else "ملی مس"
        return _response({
            "intent": "marketsymbol",
            "symbol": symbol,
            "knowledge_query": None,
            "confidence": 0.95,
            "clarification": None,
            "reasons": ["market-value"],
            "requested_fields": ["market_value"],
        })

    monkeypatch.setattr(llm_chat_planner, "post_chat_completion", repair)
    plan = asyncio.run(llm_chat_planner.plan_chat_with_llm("سرمایه بازار ملی مس چقدره؟"))
    assert calls == 2
    assert plan is not None
    assert plan.symbol == "ملی مس"


def test_malformed_response_fails_closed(monkeypatch):
    _enable(monkeypatch)

    async def malformed(*_args, **_kwargs):
        return {"choices": [{"message": {"content": "not-json"}}]}

    monkeypatch.setattr(llm_chat_planner, "post_chat_completion", malformed)
    assert asyncio.run(llm_chat_planner.plan_chat_with_llm("سؤال")) is None


def test_semantic_plan_survives_repeated_bad_entity_boundary(monkeypatch):
    _enable(monkeypatch)

    async def too_generic(*_args, **_kwargs):
        return _response({
            "intent": "marketsymbol",
            "symbol": "مس",
            "knowledge_query": None,
            "confidence": 0.95,
            "clarification": None,
            "reasons": [],
            "requested_fields": ["pe"],
        })

    monkeypatch.setattr(llm_chat_planner, "post_chat_completion", too_generic)
    question = "نسبت قیمت به سود ملی مس رو میگی؟"
    plan = asyncio.run(llm_chat_planner.plan_chat_with_llm(question))
    assert plan is not None
    assert plan.intent == "marketsymbol"
    assert plan.symbol == question
    assert plan.requested_fields == ["pe"]
