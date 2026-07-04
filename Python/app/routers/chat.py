from fastapi import APIRouter, Depends, HTTPException
from openai import AsyncOpenAI

from app.config import Settings, get_settings
from app.prompts import MEDICAL_ASSISTANT_SYSTEM
from app.schemas import ChatRequest, ChatResponse, SummarizeRequest, SummarizeResponse
from app.services.llm import chat_completion, create_client

router = APIRouter(prefix="/api/v1", tags=["ai"])


def require_llm(settings: Settings = Depends(get_settings)) -> Settings:
    if not settings.llm_configured:
        raise HTTPException(
            status_code=503,
            detail="LLM is not configured. Set OPENAI_API_KEY in .env",
        )
    return settings


def get_client(settings: Settings = Depends(require_llm)) -> AsyncOpenAI:
    return create_client(settings)


@router.post("/chat", response_model=ChatResponse)
async def chat(
    body: ChatRequest,
    settings: Settings = Depends(require_llm),
    client: AsyncOpenAI = Depends(get_client),
) -> ChatResponse:
    messages: list[dict[str, str]] = []
    if body.use_medical_prompt:
        messages.append({"role": "system", "content": MEDICAL_ASSISTANT_SYSTEM})
    messages.extend(m.model_dump() for m in body.messages)

    reply = await chat_completion(
        client,
        model=settings.openai_model,
        messages=messages,
        temperature=body.temperature,
        max_tokens=body.max_tokens,
    )
    return ChatResponse(reply=reply, model=settings.openai_model)


@router.post("/summarize", response_model=SummarizeResponse)
async def summarize(
    body: SummarizeRequest,
    settings: Settings = Depends(require_llm),
    client: AsyncOpenAI = Depends(get_client),
) -> SummarizeResponse:
    lang = "Persian (Farsi)" if body.language.lower().startswith("fa") else body.language
    messages = [
        {
            "role": "system",
            "content": (
                "Summarize the following medical or clinical text for healthcare staff. "
                f"Write the summary in {lang}. Use bullet points when helpful. "
                "Do not add information that is not in the source text."
            ),
        },
        {"role": "user", "content": body.text},
    ]
    summary = await chat_completion(
        client,
        model=settings.openai_model,
        messages=messages,
        temperature=0.3,
        max_tokens=512,
    )
    return SummarizeResponse(summary=summary, model=settings.openai_model)
