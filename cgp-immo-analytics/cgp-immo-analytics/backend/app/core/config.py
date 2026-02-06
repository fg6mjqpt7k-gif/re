"""
Configuration et connexion base de données.
"""
from pydantic_settings import BaseSettings
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from functools import lru_cache


class Settings(BaseSettings):
    """Configuration de l'application."""
    
    # Database
    DATABASE_URL: str = "postgresql+asyncpg://cgp_admin:changeme@db:5432/cgp_immo"
    DATABASE_URL_SYNC: str = "postgresql://cgp_admin:changeme@db:5432/cgp_immo"
    
    # Auth
    SECRET_KEY: str = "changeme_in_production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24h
    
    # Claude API
    CLAUDE_API_KEY: str = ""
    
    # App
    ENVIRONMENT: str = "development"
    APP_NAME: str = "CGP Immo Analytics"
    APP_VERSION: str = "0.1.0"
    
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
