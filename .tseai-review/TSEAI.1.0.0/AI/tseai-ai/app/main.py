import json
import os
import asyncio
from typing import Annotated

from pydantic import BaseModel, Field, ValidationError
from starlette.applications import Starlette
from starlette.middleware import Middleware
from starlette.middleware.trustedhost import TrustedHostMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse
from starlette.routing import Route

from .chat_planner import plan_chat
from .chat_reflection import reflect_chat
from .conversation_filter_planner import interpret_conversation
from .filter_planner import interpret_filter
from .knowledge import KnowledgeDocument, KnowledgeService, QdrantKnowledgeStore, create_embedding_provider
from .llm_conversation_planner import plan_conversation_with_llm
from .llm_filter_planner import plan_with_llm
from .llm_chat_planner import plan_chat_with_llm
from .llm_conversation_rewriter import rewrite_conversation_with_llm
from .llm_grounded_answer import synthesize_grounded_answer
from .llm_chat_reflection import reflect_chat_with_llm

knowledge_service = KnowledgeService(QdrantKnowledgeStore(), create_embedding_provider())
knowledge_index_lock = asyncio.Lock()


class InvalidJsonError(Exception):
    """Raised when a request body is not valid JSON."""


class FilterInterpretRequest(BaseModel):
    question: str = Field(min_length=2, max_length=2000)


class KnowledgeDocumentRequest(BaseModel):
    document_id: str = Field(min_length=1, max_length=200)
    source_type: str = Field(min_length=1, max_length=100)
    source_id: str = Field(min_length=1, max_length=200)
    title: str = Field(min_length=1, max_length=1000)
    body: str = Field(min_length=1, max_length=200000)
    url: str | None = None
    symbol: str | None = None
    category: str | None = None
    published_at: str | None = None
    metadata: dict = Field(default_factory=dict)


class KnowledgeIndexRequest(BaseModel):
    documents: list[KnowledgeDocumentRequest] = Field(min_length=1, max_length=500)


class KnowledgeRetrieveRequest(BaseModel):
    query: str = Field(min_length=2, max_length=2000)
    limit: int = Field(default=8, ge=1, le=30)
    source_type: str | None = None
    symbol: str | None = None
    category: str | None = None
    route: str | None = None
    content_type_id: int | None = None
    language_id: int | None = None
    date_from: str | None = None
    date_to: str | None = None
    latest_first: bool | None = None
    topic: str | None = None
    company: str | None = None
    current_only: bool | None = None


class KnowledgeRetrieveBatchRequest(BaseModel):
    queries: list[Annotated[str, Field(min_length=2, max_length=2000)]] = Field(min_length=1, max_length=8)
    limit: int = Field(default=8, ge=1, le=30)
    source_type: str | None = None
    symbol: str | None = None
    category: str | None = None
    route: str | None = None
    content_type_id: int | None = None
    language_id: int | None = None
    date_from: str | None = None
    date_to: str | None = None
    latest_first: bool | None = None
    topic: str | None = None
    company: str | None = None
    current_only: bool | None = None


class ConversationFilterInterpretRequest(BaseModel):
    question: str = Field(min_length=1, max_length=2000)
    current_code: str | None = None
    current_conditions: list[str] = Field(default_factory=list, max_length=100)


class ChatPlanRequest(BaseModel):
    question: str = Field(min_length=2, max_length=4000)


class ChatReflectionRequest(BaseModel):
    question: str = Field(min_length=2, max_length=4000)
    answer: str = Field(min_length=1, max_length=20000)
    intent: str = Field(min_length=1, max_length=100)
    confidence: float = Field(ge=0, le=1)
    evidenceCount: int = Field(default=0, ge=0, le=100)
    failedTools: list[str] = Field(default_factory=list, max_length=20)
    evidence: list[str] = Field(default_factory=list, max_length=20)


class ConversationRewriteRequest(BaseModel):
    question: str = Field(min_length=1, max_length=4000)
    activeReference: dict | None = None
    recentTurns: list[dict] = Field(default_factory=list, max_length=12)


class GroundedAnswerRequest(BaseModel):
    question: str = Field(min_length=1, max_length=4000)
    structuredAnswer: str = Field(min_length=1, max_length=20000)
    structuredFacts: list[dict] = Field(default_factory=list, max_length=50)
    evidence: list[dict] = Field(default_factory=list, max_length=20)
    missingFacets: list[str] = Field(default_factory=list, max_length=20)
    recentTurns: list[dict] = Field(default_factory=list, max_length=12)


async def body(request: Request, model: type[BaseModel]) -> BaseModel:
    try:
        payload = await request.json()
    except (json.JSONDecodeError, UnicodeDecodeError) as exception:
        raise InvalidJsonError from exception
    return model.model_validate(payload)


async def validation_error(_: Request, exception: ValidationError) -> JSONResponse:
    return JSONResponse(
        {"code": "validation_error", "detail": exception.errors(include_input=False)},
        status_code=422,
    )


async def invalid_json_error(_: Request, __: InvalidJsonError) -> JSONResponse:
    return JSONResponse(
        {"code": "invalid_json", "detail": "Request body must be valid JSON."},
        status_code=400,
    )


async def root(_: Request) -> JSONResponse:
    return JSONResponse({
        "service": "TSEAI.AI",
        "status": "chat-orchestrator-support-v1",
        "modules": [
            "chat-intent-planner", "deterministic-persian-planner", "conversation-editor",
            "optional-llm-fallback", "knowledge-indexing", "hybrid-retrieval",
            "bounded-reflection", "policy-based-tool-use", "mcp-extension-boundary",
        ],
    })


async def health(_: Request) -> JSONResponse:
    return JSONResponse({
        "status": "ok", "service": "TSEAI.AI", "sprint": 41,
        "knowledge": "advanced-hybrid-retrieval-v1", "chat": "conversation-context-v1",
    })


async def chat_plan(request: Request) -> JSONResponse:
    req = await body(request, ChatPlanRequest)
    plan = await plan_chat_with_llm(req.question)
    planner_name = "llm-semantic-v1"
    if plan is None:
        plan = plan_chat(req.question)
        planner_name = "deterministic-allowlist-v1"
    return JSONResponse({
        "intent": plan.intent, "symbol": plan.symbol, "knowledge_query": plan.knowledge_query,
        "confidence": plan.confidence, "clarification": plan.clarification,
        "reasons": plan.reasons, "requested_fields": plan.requested_fields or [], "planner": planner_name,
    })


async def chat_reflect(request: Request) -> JSONResponse:
    req = await body(request, ChatReflectionRequest)
    result = await reflect_chat_with_llm(req.model_dump())
    reflector_name = "bounded-llm-v1"
    if result is None:
        result = reflect_chat(req.question, req.answer, req.intent, req.confidence, req.evidenceCount, req.failedTools)
        reflector_name = "bounded-deterministic-v1"
    return JSONResponse({
        "action": result.action, "improvedQuery": result.improved_query,
        "clarification": result.clarification, "reasons": result.reasons,
        "reflector": reflector_name,
    })


async def chat_rewrite(request: Request) -> JSONResponse:
    req = await body(request, ConversationRewriteRequest)
    result = await rewrite_conversation_with_llm(req.question, req.activeReference, req.recentTurns)
    if result is None:
        result = {"standalone_question": req.question, "context_applied": False, "reason": "rewriter-unavailable"}
    return JSONResponse({
        "standaloneQuestion": result["standalone_question"],
        "contextApplied": result["context_applied"],
        "reason": result.get("reason"),
        "rewriter": "llm-context-v1" if result["context_applied"] else "no-context-v1",
    })


async def chat_synthesize(request: Request) -> JSONResponse:
    req = await body(request, GroundedAnswerRequest)
    answer = await synthesize_grounded_answer(req.model_dump())
    if answer is None:
        return JSONResponse({"code": "synthesis_unavailable"}, status_code=503)
    return JSONResponse({"answer": answer, "synthesizer": "grounded-local-llm-v1"})


async def filter_interpret(request: Request) -> JSONResponse:
    req = await body(request, FilterInterpretRequest)
    plan = interpret_filter(req.question)
    if plan.status == "ok":
        return JSONResponse({
            "status": plan.status, "tsetmc_code": plan.tsetmc_code, "explanation": plan.explanation,
            "confidence": plan.confidence, "matched_rules": plan.matched_rules, "planner": "deterministic",
        })
    llm = await plan_with_llm(req.question)
    if llm and llm.get("tsetmc_code"):
        return JSONResponse({
            "status": "ok", "tsetmc_code": llm["tsetmc_code"], "explanation": llm.get("explanation", ""),
            "confidence": 0.65, "matched_rules": ["llm-fallback"], "planner": "llm",
        })
    return JSONResponse({
        "status": "no_match", "tsetmc_code": None, "explanation": plan.explanation,
        "confidence": 0.0, "matched_rules": [], "planner": "none",
    })


async def filter_conversation_interpret(request: Request) -> JSONResponse:
    req = await body(request, ConversationFilterInterpretRequest)
    plan = interpret_conversation(req.question, req.current_code, req.current_conditions)
    if plan.status == "ok":
        return JSONResponse({
            "status": plan.status, "operation": plan.operation, "tsetmc_code": plan.tsetmc_code,
            "condition_index": plan.condition_index, "field_code": plan.field_code,
            "explanation": plan.explanation, "confidence": plan.confidence,
            "matched_rules": plan.matched_rules, "planner": "deterministic",
        })
    llm = await plan_conversation_with_llm(req.question, req.current_code, req.current_conditions)
    if llm and llm.get("operation") not in (None, "none"):
        return JSONResponse({
            "status": "ok", "operation": llm.get("operation"), "tsetmc_code": llm.get("tsetmc_code"),
            "condition_index": llm.get("condition_index"), "field_code": llm.get("field_code"),
            "explanation": llm.get("explanation", ""), "confidence": 0.62,
            "matched_rules": ["llm-conversation-fallback"], "planner": "llm",
        })
    return JSONResponse({
        "status": "no_match", "operation": "none", "tsetmc_code": None, "condition_index": None,
        "field_code": None, "explanation": plan.explanation, "confidence": 0.0,
        "matched_rules": [], "planner": "none",
    })


async def knowledge_index(request: Request) -> JSONResponse:
    req = await body(request, KnowledgeIndexRequest)
    documents = [KnowledgeDocument(**item.model_dump()) for item in req.documents]
    # Local embedding runtimes can return 503 while warming up or when parallel GPU
    # batches exceed their slot capacity. Keep ingestion serialized and bounded-retry.
    async with knowledge_index_lock:
        for attempt in range(4):
            try:
                result = await knowledge_service.index(documents)
                break
            except Exception:
                if attempt == 3:
                    raise
                await asyncio.sleep(2 ** attempt)
    return JSONResponse({"status": "ok", **result})


async def knowledge_retrieve(request: Request) -> JSONResponse:
    req = await body(request, KnowledgeRetrieveRequest)
    result = await knowledge_service.retrieve(
        req.query, req.limit, req.source_type, req.symbol, req.category, req.route,
        req.content_type_id, req.language_id, req.date_from, req.date_to,
        req.latest_first, req.topic, req.company, req.current_only,
    )
    return JSONResponse(result)


async def knowledge_retrieve_batch(request: Request) -> JSONResponse:
    req = await body(request, KnowledgeRetrieveBatchRequest)
    results = await knowledge_service.retrieve_many(
        req.queries, req.limit, req.source_type, req.symbol, req.category, req.route,
        req.content_type_id, req.language_id, req.date_from, req.date_to,
        req.latest_first, req.topic, req.company, req.current_only,
    )
    return JSONResponse({"count": len(results), "results": results})


allowed_hosts = [value.strip() for value in os.getenv(
    "AI_ALLOWED_HOSTS", "ai-engine,localhost,127.0.0.1,testserver"
).split(",") if value.strip()]
routes = [
    Route("/", root, methods=["GET"]),
    Route("/health", health, methods=["GET"]),
    Route("/chat/plan", chat_plan, methods=["POST"]),
    Route("/chat/reflect", chat_reflect, methods=["POST"]),
    Route("/chat/rewrite", chat_rewrite, methods=["POST"]),
    Route("/chat/synthesize", chat_synthesize, methods=["POST"]),
    Route("/filter/interpret", filter_interpret, methods=["POST"]),
    Route("/filter/conversation/interpret", filter_conversation_interpret, methods=["POST"]),
    Route("/knowledge/index", knowledge_index, methods=["POST"]),
    Route("/knowledge/retrieve", knowledge_retrieve, methods=["POST"]),
    Route("/knowledge/retrieve-batch", knowledge_retrieve_batch, methods=["POST"]),
]
app = Starlette(
    routes=routes,
    middleware=[Middleware(TrustedHostMiddleware, allowed_hosts=allowed_hosts)],
    exception_handlers={
        ValidationError: validation_error,
        InvalidJsonError: invalid_json_error,
    },
)
