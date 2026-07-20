"""Lazy Persian speech-to-text with faster-whisper (CPU-friendly)."""

from __future__ import annotations

import logging
import tempfile
import threading
from pathlib import Path

from app.config import Settings

logger = logging.getLogger(__name__)

_model = None
_model_lock = threading.Lock()
_infer_lock = threading.Lock()
_model_key: tuple[str, str, str] | None = None


def _load_model(settings: Settings):
    global _model, _model_key
    key = (settings.stt_model, settings.stt_device, settings.stt_compute_type)
    with _model_lock:
        if _model is not None and _model_key == key:
            return _model
        from faster_whisper import WhisperModel

        logger.info(
            "Loading Whisper STT model=%s device=%s compute=%s",
            settings.stt_model,
            settings.stt_device,
            settings.stt_compute_type,
        )
        _model = WhisperModel(
            settings.stt_model,
            device=settings.stt_device,
            compute_type=settings.stt_compute_type,
        )
        _model_key = key
        logger.info("Whisper STT model ready")
        return _model


def _run_transcribe(model, path: str, settings: Settings, *, vad_filter: bool) -> tuple[str, float | None]:
    segments, info = model.transcribe(
        path,
        language=settings.stt_language or "fa",
        vad_filter=vad_filter,
        beam_size=1,
    )
    parts: list[str] = []
    for segment in segments:
        text = (segment.text or "").strip()
        if text:
            parts.append(text)
    duration: float | None = None
    if info is not None and getattr(info, "duration", None) is not None:
        try:
            duration = float(info.duration)
        except (TypeError, ValueError):
            duration = None
    return " ".join(parts).strip(), duration


def transcribe_audio(data: bytes, filename: str, settings: Settings) -> tuple[str, float | None]:
    """Return (text, duration_seconds). Raises ValueError on empty/invalid audio."""
    if not data:
        raise ValueError("فایل صوتی خالی است.")

    suffix = Path(filename or "audio.webm").suffix.lower() or ".webm"
    if suffix not in {".webm", ".wav", ".mp3", ".ogg", ".m4a", ".mp4", ".mpeg", ".mpga"}:
        suffix = ".webm"

    model = _load_model(settings)
    with _infer_lock:
        with tempfile.NamedTemporaryFile(suffix=suffix, delete=True) as tmp:
            tmp.write(data)
            tmp.flush()
            text, duration = _run_transcribe(model, tmp.name, settings, vad_filter=True)
            # Quiet/short Persian clips sometimes get wiped by VAD — retry once without it
            if not text:
                logger.info("STT empty with VAD; retrying without vad_filter (%s bytes)", len(data))
                text, duration = _run_transcribe(model, tmp.name, settings, vad_filter=False)

    if not text:
        raise ValueError("گفتاری تشخیص داده نشد. لطفاً دوباره واضح‌تر صحبت کنید.")
    return text, duration


def warmup_stt(settings: Settings) -> None:
    """Load Whisper model in background so first user request is not a cold start."""
    if not settings.stt_enabled:
        return
    try:
        _load_model(settings)
    except Exception:
        logger.exception("STT warmup failed (will retry on first request)")


def stt_status(settings: Settings) -> dict:
    loaded = _model is not None and _model_key is not None
    return {
        "enabled": settings.stt_enabled,
        "model": settings.stt_model,
        "device": settings.stt_device,
        "language": settings.stt_language,
        "model_loaded": loaded,
    }
