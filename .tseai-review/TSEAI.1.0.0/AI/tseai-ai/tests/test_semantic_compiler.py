import asyncio
import json

from app import semantic_compiler


def _response(value: dict):
    return {"choices": [{"message": {"content": json.dumps(value, ensure_ascii=False)}}]}


def _frame(**overrides):
    value = {
        "domain": "financial_institution",
        "operation": "count",
        "entities": [{"kind": "regional_hall", "value": "کرمان"}],
        "metrics": ["count"],
        "temporal_expression": None,
        "response_shape": "short",
        "canonical_question": "تعداد نهادهای مالی تالار کرمان چقدر است؟",
        "confidence": 0.96,
        "requires_clarification": False,
        "clarification": None,
        "reasons": ["colloquial-count"],
    }
    value.update(overrides)
    return value


def test_strict_frame_normalizes_colloquial_hall_count():
    parsed = semantic_compiler._parse_frame(
        json.dumps(_frame(), ensure_ascii=False), "تالار کرمان شمارش چنده؟"
    )
    assert parsed is not None
    assert parsed.domain == "financial_institution"
    assert parsed.operation == "count"
    assert parsed.entities == [{"kind": "regional_hall", "value": "کرمان"}]


def test_invented_entity_is_rejected():
    parsed = semantic_compiler._parse_frame(
        json.dumps(_frame(entities=[{"kind": "regional_hall", "value": "اصفهان"}],
                          canonical_question="تعداد نهادهای مالی تالار اصفهان چقدر است؟"), ensure_ascii=False),
        "تالار کرمان شمارش چنده؟",
    )
    assert parsed is None


def test_unknown_metric_is_rejected():
    parsed = semantic_compiler._parse_frame(
        json.dumps(_frame(metrics=["execute_sql"]), ensure_ascii=False), "تالار کرمان شمارش چنده؟"
    )
    assert parsed is None


def test_genuine_ambiguity_requires_one_clarification():
    parsed = semantic_compiler._parse_frame(json.dumps(_frame(
        domain="unknown", operation="unknown", entities=[], metrics=[], canonical_question="کرمان چندتاست؟",
        confidence=0.4, requires_clarification=True,
        clarification="منظورتان تعداد شرکت‌هاست یا تعداد نهادهای مالی کرمان؟",
        reasons=["missing-counted-object"],
    ), ensure_ascii=False), "کرمان چندتاست؟")
    assert parsed is not None
    assert parsed.requires_clarification


def test_llm_compiler_repairs_invalid_first_response(monkeypatch):
    monkeypatch.setenv("LLM_SEMANTIC_COMPILER_ENABLED", "true")
    monkeypatch.setenv("LLM_BASE_URL", "http://local-llm:8080/v1")
    monkeypatch.setenv("LLM_MODEL", "local-persian")
    calls = 0

    async def repair(*_args, **_kwargs):
        nonlocal calls
        calls += 1
        value = _frame(entities=[{"kind": "regional_hall", "value": "تهران"}],
                       canonical_question="تعداد نهادهای مالی تالار تهران چقدر است؟") if calls == 1 else _frame()
        return _response(value)

    monkeypatch.setattr(semantic_compiler, "post_chat_completion", repair)
    result = asyncio.run(semantic_compiler.compile_semantic_with_llm("تالار کرمان شمارش چنده؟"))
    assert calls == 2
    assert result is not None
    assert result.entities[0]["value"] == "کرمان"


def test_deterministic_availability_fallback_is_typed():
    result = semantic_compiler.compile_semantic_deterministic("تالار کرمان شمارش چنده؟")
    assert result is not None
    assert result.domain == "financial_institution"
    assert result.canonical_question == "تعداد نهادهای مالی تالار کرمان چقدر است؟"


def test_semantic_paraphrase_needs_only_one_lexical_anchor():
    parsed = semantic_compiler._parse_frame(json.dumps(_frame(
        domain="market", operation="lookup",
        entities=[{"kind": "symbol", "value": "فملی"}],
        metrics=["trade_volume"],
        canonical_question="حجم معاملات نماد فملی چقدر است؟",
        confidence=.95,
    ), ensure_ascii=False), "فملی چند دست به دست شده؟")
    assert parsed is not None
    assert parsed.metrics == ["trade_volume"]


def test_safe_name_metric_alias_is_canonicalized():
    parsed = semantic_compiler._parse_frame(json.dumps(_frame(
        domain="organization", operation="lookup",
        entities=[{"kind": "role", "value": "گرداننده فناوری بورس"}],
        metrics=["name"],
        canonical_question="نام گرداننده فناوری بورس چیست؟",
        confidence=.95,
    ), ensure_ascii=False), "گرداننده فناوری بورس اسمش چیه؟")
    assert parsed is not None
    assert parsed.metrics == ["person_name"]


def test_name_metric_alias_respects_domain():
    parsed = semantic_compiler._parse_frame(json.dumps(_frame(
        domain="company", operation="latest", entities=[], metrics=["name"],
        canonical_question="آخرین شرکت عرضه‌شده کدام است؟", confidence=.9,
    ), ensure_ascii=False), "آخرین شرکت عرضه‌شده کدام است؟")
    assert parsed is not None
    assert parsed.metrics == ["company_title"]


def test_semantically_normalized_role_is_not_treated_as_named_entity():
    parsed = semantic_compiler._parse_frame(json.dumps(_frame(
        domain="organization", operation="lookup",
        entities=[{"kind": "role", "value": "مسئول فناوری بورس"},
                  {"kind": "organization", "value": "بورس"}],
        metrics=["person_name"],
        canonical_question="نام مسئول فناوری بورس چیست؟",
        confidence=.95,
    ), ensure_ascii=False), "اسم کسی که کار فناوری بورس رو می‌چرخونه چیه؟")
    assert parsed is not None
    assert parsed.entities == [{"kind": "organization", "value": "بورس"}]


def test_latest_company_population_query_never_requires_named_entity():
    parsed = semantic_compiler._parse_frame(json.dumps(_frame(
        domain="company", operation="latest", entities=[],
        metrics=["company_title", "ipo_date"],
        canonical_question="آخرین شرکت تازه‌وارد به بورس کدام است؟",
        confidence=.88, requires_clarification=True,
        clarification="نام شرکت را مشخص کنید.",
    ), ensure_ascii=False), "تازه‌ترین تازه‌وارد بورس کدوم شرکته؟")
    assert parsed is not None
    assert not parsed.requires_clarification
    assert parsed.clarification is None
