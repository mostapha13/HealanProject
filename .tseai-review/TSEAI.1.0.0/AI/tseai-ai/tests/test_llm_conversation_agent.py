import asyncio
import json

from app import llm_chat_reflection, llm_conversation_rewriter, llm_grounded_answer


def _enable(monkeypatch):
    monkeypatch.setenv("LLM_CHAT_PLANNER_ENABLED", "true")
    monkeypatch.setenv("LLM_BASE_URL", "http://local-llm:8080/v1")
    monkeypatch.setenv("LLM_MODEL", "qwen-local")


def _response(value):
    return {"choices": [{"message": {"content": json.dumps(value, ensure_ascii=False)}}]}


def test_followup_rewriter_resolves_active_organization_person(monkeypatch):
    _enable(monkeypatch)

    async def fake(*_args, **_kwargs):
        return _response({
            "standalone_question": "بهروز خالق‌ویردی نماینده کدام شرکت در هیئت‌مدیره بورس تهران است؟",
            "context_applied": True,
            "reason": "active-person",
        })

    monkeypatch.setattr(llm_conversation_rewriter, "post_chat_completion", fake)
    result = asyncio.run(llm_conversation_rewriter.rewrite_conversation_with_llm(
        "نماینده کدوم شرکت هست؟",
        {"subjectName": "بهروز خالق‌ویردی", "subjectRole": "رئیس هیئت‌مدیره"},
        [{"question": "رئیس هیئت مدیره کیه؟", "answer": "بهروز خالق‌ویردی است."}],
    ))
    assert result and result["context_applied"]
    assert "بهروز خالق‌ویردی" in result["standalone_question"]


def test_grounded_synthesizer_returns_question_focused_answer(monkeypatch):
    _enable(monkeypatch)

    async def fake(*_args, **_kwargs):
        return _response({"answer": "عسگر نوربخش — در خبر ۱۴۰۳، نماینده سرمایه‌گذاری تدبیر معرفی شده است؛ مدرک جاری‌تری یافت نشد."})

    monkeypatch.setattr(llm_grounded_answer, "post_chat_completion", fake)
    answer = asyncio.run(llm_grounded_answer.synthesize_grounded_answer({
        "question": "نماینده کدام شرکت است؟",
        "structuredAnswer": "عسگر نوربخش، نائب‌رئیس هیئت‌مدیره است.",
        "structuredFacts": [],
        "evidence": [{"sourceId": "93747", "publishedAt": "2024-12-21", "text": "عسگر نوربخش به نمایندگی از سرمایه‌گذاری تدبیر"}],
        "missingFacets": ["representing_company"],
        "recentTurns": [],
    }))
    assert answer and "سرمایه‌گذاری تدبیر" in answer


def test_reflector_can_request_more_evidence_for_missing_compound_facet(monkeypatch):
    _enable(monkeypatch)

    async def fake(*_args, **_kwargs):
        return _response({
            "action": "retrieve_more",
            "improved_query": "سوابق عسگر نوربخش نمایندگی شرکت",
            "clarification": None,
            "reasons": ["missing-history"],
        })

    monkeypatch.setattr(llm_chat_reflection, "post_chat_completion", fake)
    result = asyncio.run(llm_chat_reflection.reflect_chat_with_llm({
        "question": "سابقه و شرکت نمایندگی او چیست؟",
        "answer": "عسگر نوربخش نائب‌رئیس است.",
        "intent": "knowledge",
        "confidence": .9,
        "evidence": ["عسگر نوربخش نائب‌رئیس است"],
    }))
    assert result and result.action == "retrieve_more"
    assert result.improved_query
