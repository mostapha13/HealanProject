import asyncio

from app import llm_filter_planner


def _enable(monkeypatch):
    monkeypatch.setenv("LLM_FILTER_PLANNER_ENABLED", "true")
    monkeypatch.setenv("LLM_BASE_URL", "http://local-llm:8080/v1")
    monkeypatch.setenv("LLM_MODEL", "qwen3.5-4b-fa")


def test_llm_outage_fails_closed(monkeypatch):
    _enable(monkeypatch)

    async def unavailable(*_args, **_kwargs):
        return None

    monkeypatch.setattr(llm_filter_planner, "post_chat_completion", unavailable)
    assert asyncio.run(llm_filter_planner.plan_with_llm("شرط نامعتبر")) is None


def test_malformed_llm_response_fails_closed(monkeypatch):
    _enable(monkeypatch)

    async def malformed(*_args, **_kwargs):
        return {"choices": []}

    monkeypatch.setattr(llm_filter_planner, "post_chat_completion", malformed)
    assert asyncio.run(llm_filter_planner.plan_with_llm("شرط نامعتبر")) is None


def test_valid_llm_json_is_parsed(monkeypatch):
    _enable(monkeypatch)

    async def valid(*_args, **_kwargs):
        return {
            "choices": [
                {"message": {"content": '{"tsetmc_code":"(tvol)>1000","explanation":"حجم"}'}}
            ]
        }

    monkeypatch.setattr(llm_filter_planner, "post_chat_completion", valid)
    result = asyncio.run(llm_filter_planner.plan_with_llm("حجم بیشتر از هزار"))
    assert result == {"tsetmc_code": "(tvol)>1000", "explanation": "حجم"}
