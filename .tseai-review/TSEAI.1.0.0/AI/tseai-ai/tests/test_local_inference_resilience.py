from app import local_inference
from app import (
    llm_chat_planner,
    llm_chat_reflection,
    llm_conversation_rewriter,
    llm_grounded_answer,
)


def test_circuit_opens_after_bounded_failures_and_success_resets(monkeypatch):
    monkeypatch.setenv("LLM_CIRCUIT_FAILURE_THRESHOLD", "2")
    monkeypatch.setenv("LLM_CIRCUIT_OPEN_SECONDS", "60")
    local_inference._record_success()

    local_inference._record_failure()
    assert not local_inference._circuit_is_open()
    local_inference._record_failure()
    assert local_inference._circuit_is_open()

    local_inference._record_success()
    assert not local_inference._circuit_is_open()


def test_llama_cpp_uses_portable_json_object_mode():
    expected = {"type": "json_object"}
    assert llm_chat_planner._RESPONSE_FORMAT == expected
    assert llm_chat_reflection._RESPONSE_FORMAT == expected
    assert llm_conversation_rewriter._RESPONSE_FORMAT == expected
    assert llm_grounded_answer._RESPONSE_FORMAT == expected
