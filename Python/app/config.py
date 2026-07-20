from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    openai_api_key: str = ""
    openai_base_url: str = "https://api.openai.com/v1"
    # gpt-4o برای فارسی قوی‌تر است؛ پیش‌فرض خلاصه لوکال: qwen2.5:3b (Ollama)
    openai_model: str = "qwen2.5:3b"

    host: str = "0.0.0.0"
    port: int = 8000
    debug: bool = False

    # RAG — مدل embedding مخصوص فارسی (tokenization بهتر برای متن فارسی)
    embedding_model: str = "heydariAI/persian-embeddings"
    chroma_persist_dir: str = "data/chroma"
    chroma_collection: str = "healan_rag"

    # منبع داده: excel | sqlserver
    data_source: str = "sqlserver"
    excel_file_path: str = "data/sample.xlsx"
    excel_sheet_name: str | None = None

    sql_server_connection_string: str = ""
    sql_server_query: str = ""
    sql_server_use_healan_bundle: bool = True

    rag_top_k: int = 5
    rag_auto_ingest: bool = True
    rag_chunk_max_chars: int = 1200
    rag_answer_mode: str = "direct"
    rag_similarity_threshold: float = 0.55
    rag_sync_enabled: bool = True
    rag_sync_interval_minutes: int = 10

    # خلاصه‌سازی بلاگ و نظرات قبل از embed (نیاز به OPENAI_API_KEY)
    rag_summarize_enabled: bool = True
    rag_summarize_model: str = "qwen2.5:3b"
    rag_summarize_max_tokens: int = 400
    rag_summarize_max_input_chars: int = 8000
    rag_summarize_skip_if_shorter_than: int = 280
    rag_summarize_fallback_chars: int = 600

    # Speech-to-text (faster-whisper) — فارسی رایگان و self-host
    stt_enabled: bool = True
    stt_model: str = "small"
    stt_device: str = "cpu"
    stt_compute_type: str = "int8"
    stt_language: str = "fa"
    stt_max_upload_bytes: int = 8 * 1024 * 1024

    _PLACEHOLDER_KEYS = frozenset(
        {"", "your-api-key-here", "sk-placeholder-set-your-key"}
    )

    @property
    def llm_configured(self) -> bool:
        key = self.openai_api_key.strip()
        base = self.openai_base_url.lower()
        # Ollama / لوکال OpenAI-compatible
        if "11434" in base or "ollama" in base:
            return True
        if key.lower() in {"ollama", "local"}:
            return True
        if not key:
            return False
        if key in self._PLACEHOLDER_KEYS or "placeholder" in key.lower():
            return False
        return key.startswith("sk-") or len(key) > 20

    @property
    def excel_path(self) -> Path:
        path = Path(self.excel_file_path)
        return path if path.is_absolute() else BASE_DIR / path

    @property
    def chroma_path(self) -> Path:
        path = Path(self.chroma_persist_dir)
        return path if path.is_absolute() else BASE_DIR / path


@lru_cache
def get_settings() -> Settings:
    return Settings()
