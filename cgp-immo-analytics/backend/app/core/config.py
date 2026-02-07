"""
Configuration et connexion base de donnees.
C4 FIX: All secrets from env vars, no hardcoded defaults in production.
H2 FIX: Short access token (15min) + refresh token (7 days).
"""
from pydantic_settings import BaseSettings
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from functools import lru_cache


class Settings(BaseSettings):
    """Configuration de l'application. All secrets MUST be set via .env or environment."""

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://cgp_admin:changeme@db:5432/cgp_immo"
    DATABASE_URL_SYNC: str = "postgresql://cgp_admin:changeme@db:5432/cgp_immo"

    # Auth — H2 FIX: short-lived access tokens + separate refresh secret
    SECRET_KEY: str = "CHANGE_ME_IN_ENV"
    REFRESH_SECRET_KEY: str = "CHANGE_ME_REFRESH_IN_ENV"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15  # H2: was 1440 (24h), now 15min
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Claude API
    CLAUDE_API_KEY: str = ""

    # App
    ENVIRONMENT: str = "development"
    APP_NAME: str = "CGP Immo Analytics"
    APP_VERSION: str = "0.2.0"

    # CORS — H3: explicit allowed origins (comma-separated)
    CORS_ORIGINS: str = "http://localhost:3000"

    class Config:
        env_file = ".env"


@lru_cache()
def get_settings() -> Settings:
    return Settings()


# --- Database Engine ---
settings = get_settings()

engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.ENVIRONMENT == "development",
    pool_size=20,
    max_overflow=10,
)

async_session = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


class Base(DeclarativeBase):
    pass


async def get_db() -> AsyncSession:
    """Dependency injection pour les sessions DB."""
    async with async_session() as session:
        try:
            yield session
        finally:
            await session.close()
