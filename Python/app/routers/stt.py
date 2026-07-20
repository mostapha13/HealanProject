from __future__ import annotations

import asyncio
import logging

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile

from app.config import Settings, get_settings
from app.rag.runtime_settings import apply_rag_sql_overrides
from app.schemas import SttResponse, SttStatusResponse
from app.services.stt import stt_status, transcribe_audio

router = APIRouter(prefix="/api/v1/rag", tags=["rag-stt"])
logger = logging.getLogger(__name__)


def get_runtime_settings() -> Settings:
    return apply_rag_sql_overrides(get_settings())


@router.get("/stt/status", response_model=SttStatusResponse)
async def speech_to_text_status(settings: Settings = Depends(get_runtime_settings)):
    info = stt_status(settings)
    return SttStatusResponse(**info)


@router.post("/stt", response_model=SttResponse)
async def speech_to_text(
    file: UploadFile = File(...),
    settings: Settings = Depends(get_runtime_settings),
):
    if not settings.stt_enabled:
        raise HTTPException(status_code=503, detail="سرویس گفتار به متن غیرفعال است.")

    data = await file.read()
    if not data:
        raise HTTPException(status_code=400, detail="فایل صوتی خالی است.")
    if len(data) > settings.stt_max_upload_bytes:
        raise HTTPException(
            status_code=400,
            detail=f"حجم فایل بیش از حد مجاز است (حداکثر {settings.stt_max_upload_bytes // (1024 * 1024)} مگابایت).",
        )

    filename = file.filename or "voice.webm"
    try:
        text, duration = await asyncio.to_thread(transcribe_audio, data, filename, settings)
    except ImportError as exc:
        logger.exception("faster-whisper not installed")
        raise HTTPException(
            status_code=503,
            detail="بسته faster-whisper نصب نیست. pip install faster-whisper",
        ) from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        logger.exception("STT failed for %s (%s bytes)", filename, len(data))
        raise HTTPException(
            status_code=500,
            detail="خطا در تبدیل گفتار به متن. لطفاً دوباره تلاش کنید.",
        ) from exc

    return SttResponse(
        text=text,
        language=settings.stt_language or "fa",
        duration_seconds=duration,
        model=settings.stt_model,
    )
