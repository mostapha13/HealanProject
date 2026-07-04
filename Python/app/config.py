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
    # gpt-4o برای فارسی قوی‌تر است؛ برای لوکال Ollama: qwen2.5:7b یا gemma2
    openai_model: str = "gpt-4o-mini"

    host: str = "0.0.0.0"
    port: int = 8000
    debug: bool = False

    # RAG — مدل embedding مخصوص فارسی (tokenization بهتر برای متن فارسی)
    embedding_model: str = "heydariAI/persian-embeddings"
    chroma_persist_dir: str = "data/chroma"
    chroma_collection: str = "healan_rag"

    # منبع داده: excel (فعلی) | sqlserver (آینده)
    data_source: str = "excel"
    excel_file_path: str = "data/sample.xlsx"
    excel_sheet_name: str | None = None

    sql_server_connection_string: str = ""
    sql_server_query: str = ""

    rag_top_k: int = 5
    rag_auto_ingest: bool = True
    rag_chunk_max_chars: int = 1200

    _PLACEHOLDER_KEYS = frozenset(
        {"", "your-api-key-here", "sk-placeholder-set-your-key"}
    )

    @property
    def llm_configured(self) -> bool:
        key = self.openai_api_key.strip()
        if not key:
            return False
        if key == "ollama" and "11434" in self.openai_base_url:
            return True
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
