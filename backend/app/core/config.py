from typing import List
from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict
from app.core.db_url import to_async_url, to_sync_url


class Settings(BaseSettings):
    """
    Application settings loaded from environment variables and/or .env file.
    Fails explicitly if required variables or PostgreSQL format is invalid.
    """
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        # Validation errors must never echo the value (DATABASE_URL contains a password)
        hide_input_in_errors=True,
    )

    APP_ENV: str = Field(default="development", description="Environment: development, staging, production")
    APP_HOST: str = Field(default="127.0.0.1", description="Server host interface")
    APP_PORT: int = Field(default=8000, description="Server port")
    APP_SECRET_KEY: str = Field(..., min_length=16, description="Secret key for security and token signatures")
    
    DATABASE_URL: str = Field(
        ...,
        description="Async PostgreSQL connection URL (e.g. postgresql+asyncpg://user:pass@host:port/dbname)"
    )
    
    FRONTEND_ORIGINS: str = Field(
        default="http://localhost:5173,http://127.0.0.1:5173",
        description="Comma-separated list of allowed frontend origins"
    )

    # Authentication & JWT Security Settings
    JWT_ALGORITHM: str = Field(default="HS256", description="JWT signing algorithm")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(default=1440, description="Access token expiration in minutes (default 24h)")
    COOKIE_SECURE: bool = Field(default=False, description="Set True in production for HTTPS only cookies")
    COOKIE_SAMESITE: str = Field(default="lax", description="SameSite policy for auth cookies")

    # Email Service Configuration (Optional in dev, defaults to console mock)
    EMAIL_PROVIDER: str = Field(default="console", description="Email provider: console, smtp")
    SMTP_HOST: str = Field(default="", description="SMTP server host")
    SMTP_PORT: int = Field(default=587, description="SMTP server port")
    SMTP_USER: str = Field(default="", description="SMTP username")
    SMTP_PASSWORD: str = Field(default="", description="SMTP password")
    SMTP_FROM_EMAIL: str = Field(default="noreply@salvex-auction.in", description="Sender email address")
    SMTP_FROM_NAME: str = Field(default="Salvex Auction Platform", description="Sender display name")

    @field_validator("DATABASE_URL")
    @classmethod
    def validate_postgres_url(cls, v: str) -> str:
        # Strictly require PostgreSQL driver
        if not (v.startswith("postgresql://") or v.startswith("postgresql+asyncpg://") or v.startswith("postgres://")):
            raise ValueError(
                "Invalid DATABASE_URL. Salvex backend requires PostgreSQL. "
                "Provided connection string must start with 'postgresql://' or 'postgresql+asyncpg://'."
            )
        # Normalize to asyncpg for async SQLAlchemy engine if not specified
        if v.startswith("postgresql://"):
            v = v.replace("postgresql://", "postgresql+asyncpg://", 1)
        elif v.startswith("postgres://"):
            v = v.replace("postgres://", "postgresql+asyncpg://", 1)
        # asyncpg spells the SSL option ?ssl=..., while the company/provider URL (and
        # psycopg2) use ?sslmode=.... Translate it; never add or weaken SSL.
        return to_async_url(v)

    @property
    def sync_database_url(self) -> str:
        """DATABASE_URL in the form Alembic's psycopg2 driver understands."""
        return to_sync_url(self.DATABASE_URL)

    @property
    def cors_origins(self) -> List[str]:
        """Parse comma-separated origins string into a clean list of allowed origins."""
        return [origin.strip() for origin in self.FRONTEND_ORIGINS.split(",") if origin.strip()]


# Global settings singleton
settings = Settings()
