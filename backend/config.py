"""
Bunyan — Backend Configuration
================================
Centralized settings via Pydantic BaseSettings.
Values can be overridden via environment variables or a .env file.
"""

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Bunyan API"
    api_v1_prefix: str = "/api/v1"

    # Comma-separated string in env: "http://localhost:5173,https://bunyan.up.railway.app"
    cors_origins: list[str] = [
        "http://localhost:3000",
        "http://localhost:3004",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3004",
    ]
    environment: str = "development"
    debug: bool = True

    # Database — Railway provides postgres:// or postgresql://, we normalize to postgresql+asyncpg://
    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/bunyan"

    # JWT
    jwt_secret_key: str = "dev-secret-change-in-production"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    @field_validator("database_url", mode="before")
    @classmethod
    def normalize_database_url(cls, v: str) -> str:
        """Normalize Railway's postgres:// / postgresql:// to postgresql+asyncpg://."""
        if isinstance(v, str):
            if v.startswith("postgres://"):
                return v.replace("postgres://", "postgresql+asyncpg://", 1)
            if v.startswith("postgresql://") and "+asyncpg" not in v:
                return v.replace("postgresql://", "postgresql+asyncpg://", 1)
        return v

    @field_validator("cors_origins", mode="before")
    @classmethod
    def parse_cors_origins(cls, v: object) -> list[str]:
        """Accept a comma-separated string from env or a list directly."""
        if isinstance(v, str):
            return [o.strip() for o in v.split(",") if o.strip()]
        return v  # type: ignore[return-value]

    @property
    def sync_database_url(self) -> str:
        """Synchronous DB URL for Alembic (psycopg2, no +asyncpg)."""
        return self.database_url.replace("+asyncpg", "")


settings = Settings()
