"""
CrimeLens AI — Application Configuration

Single source of truth for all environment variables and runtime settings.
Uses Pydantic BaseSettings so every value can be overridden via environment
variables or a .env file — no hardcoded configuration anywhere in the codebase.

Pattern: settings are accessed via get_settings() which is decorated with
@lru_cache so the Settings object is instantiated exactly once per process.
Test suites override it with app.dependency_overrides[get_settings] = ...
"""

from __future__ import annotations

from functools import lru_cache
from typing import Literal

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    Centralised application settings resolved from environment variables.

    Resolution order (highest priority first):
      1. Environment variables set in the OS / Docker / CI
      2. Values in the .env file at the working directory
      3. Defaults defined here

    Field naming convention:
      - Python attribute: snake_case  (e.g. api_v1_prefix)
      - Environment variable: UPPER_SNAKE_CASE  (e.g. API_V1_PREFIX)
    """

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        # Ignore extra env vars present in the environment (e.g. system vars)
        extra="ignore",
    )

    # ── Application ──────────────────────────────────────────────────────────
    app_name: str = Field(default="CrimeLens AI", description="Human-readable service name.")
    app_version: str = Field(default="1.0.0", description="Semantic version string.")
    environment: Literal["development", "staging", "production"] = Field(
        default="development",
        description="Deployment environment. Controls docs availability and log format.",
    )
    debug: bool = Field(
        default=False,
        description="Enable debug mode. NEVER set to true in production.",
    )

    # ── API ───────────────────────────────────────────────────────────────────
    api_v1_prefix: str = Field(
        default="/api/v1",
        description="URL prefix for all v1 API endpoints.",
    )

    # ── CORS ──────────────────────────────────────────────────────────────────
    cors_origins: list[str] = Field(
        default=["http://localhost:5173"],
        description=(
            "Allowed CORS origins as a JSON array. "
            'Example: \'["https://crimelens.ksp.gov.in"]\''
        ),
    )
    cors_allow_credentials: bool = Field(
        default=True,
        description="Allow cookies and auth headers in cross-origin requests.",
    )

    # ── Security / JWT ────────────────────────────────────────────────────────
    jwt_secret_key: str = Field(
        default="INSECURE-DEV-SECRET-CHANGE-IN-PRODUCTION",
        description=(
            "HMAC signing key for JWT tokens. "
            "Generate with: openssl rand -hex 32"
        ),
    )
    jwt_algorithm: str = Field(
        default="HS256",
        description="JWT signing algorithm.",
    )
    jwt_access_token_expire_minutes: int = Field(
        default=480,  # 8 hours — covers a full police shift
        description="JWT access token lifetime in minutes.",
    )

    # ── Logging ───────────────────────────────────────────────────────────────
    log_level: str = Field(
        default="INFO",
        description="Minimum log level. One of: DEBUG, INFO, WARNING, ERROR, CRITICAL.",
    )
    log_json: bool = Field(
        default=False,
        description=(
            "Emit logs as JSON lines (for log aggregators). "
            "Set to true in staging and production."
        ),
    )

    # ── ML Models ─────────────────────────────────────────────────────────────
    ml_model_name: str = Field(
        default="all-MiniLM-L6-v2",
        description="Sentence Transformers model used for case similarity embeddings.",
    )
    ml_device: Literal["cpu", "cuda", "mps"] = Field(
        default="cpu",
        description="Torch device for ML inference.",
    )
    ml_faiss_index_path: str = Field(
        default="datasets/embeddings/cases.index",
        description="Path to the persisted FAISS index file.",
    )

    # ── Gemini AI ─────────────────────────────────────────────────────────────
    gemini_api_key: str = Field(
        default="INSECURE-MOCK-GEMINI-KEY",
        description="Google Gemini API Key.",
    )
    gemini_model: str = Field(
        default="gemini-2.5-flash",
        description="Gemini Model.",
    )

    # ── Database ──────────────────────────────────────────────────────────────
    database_url: str = Field(
        default="sqlite+aiosqlite:///./crimelens.db",
        description=(
            "SQLAlchemy async database URL. "
            "Examples: "
            "sqlite+aiosqlite:///./crimelens.db  (Phase 1 dev) "
            "postgresql+asyncpg://user:pass@host/db  (Phase 2+)"
        ),
    )

    # ── Validators ────────────────────────────────────────────────────────────

    @field_validator("log_level")
    @classmethod
    def validate_log_level(cls, value: str) -> str:
        allowed = {"DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"}
        upper = value.upper()
        if upper not in allowed:
            raise ValueError(f"log_level must be one of {allowed}, got: {value!r}")
        return upper

    @field_validator("jwt_secret_key")
    @classmethod
    def validate_jwt_secret(cls, value: str, info: object) -> str:
        # Prevent shipping the default insecure key in production
        if hasattr(info, "data"):
            env = info.data.get("environment", "development")
            if env == "production" and "INSECURE" in value:
                raise ValueError(
                    "jwt_secret_key must be changed from the default in production. "
                    "Generate one with: openssl rand -hex 32"
                )
        return value

    # ── Computed Properties ───────────────────────────────────────────────────

    @property
    def GEMINI_API_KEY(self) -> str:
        """Uppercase alias for Gemini API key."""
        return self.gemini_api_key

    @property
    def GEMINI_MODEL(self) -> str:
        """Uppercase alias for Gemini model code."""
        return self.gemini_model

    @property
    def is_production(self) -> bool:
        """True when running in the production environment."""
        return self.environment == "production"

    @property
    def is_development(self) -> bool:
        """True when running in the development environment."""
        return self.environment == "development"

    @property
    def docs_enabled(self) -> bool:
        """Swagger UI and ReDoc are disabled in production for security."""
        return not self.is_production


@lru_cache
def get_settings() -> Settings:
    """
    Return the application settings singleton.

    Using @lru_cache ensures Settings() is instantiated exactly once per
    process (reads .env file once, parses env vars once). This is the
    function injected into FastAPI routes via Depends(get_settings).

    To override in tests:
        app.dependency_overrides[get_settings] = lambda: Settings(environment="development")
    """
    return Settings()


settings = get_settings()
