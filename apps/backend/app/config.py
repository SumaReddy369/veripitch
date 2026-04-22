from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    # ── Application ───────────────────────────────────────────
    app_name: str = "VeriPitch API"
    app_version: str = "0.1.0"
    app_env: str = "development"
    debug: bool = True

    # ── CORS ──────────────────────────────────────────────────
    # In .env use JSON array syntax: ALLOWED_ORIGINS=["http://localhost:3000"]
    allowed_origins: list[str] = ["http://localhost:3000"]

    # ── Groq (OpenAI-compatible LLM) ──────────────────────────
    groq_api_key: str
    groq_base_url: str = "https://api.groq.com/openai/v1"
    llm_model: str = "llama-3.3-70b-versatile"

    # ── Local embeddings (sentence-transformers, no API key) ──
    embedding_model: str = "all-MiniLM-L6-v2"

    # ── ChromaDB (local persistent vector store) ──────────────
    chromadb_path: str = "./chroma_db"
    chromadb_collection: str = "document_chunks"

    # ── RAG tuning ────────────────────────────────────────────
    rag_match_count: int = 3

    # ── File limits (bytes) ───────────────────────────────────
    max_pdf_size: int = 20 * 1024 * 1024   # 20 MB
    max_xlsx_size: int = 5 * 1024 * 1024   # 5 MB

    # ── Concurrency ───────────────────────────────────────────
    rfp_concurrency_limit: int = 5

    @property
    def is_production(self) -> bool:
        return self.app_env == "production"


@lru_cache
def get_settings() -> Settings:
    return Settings()
