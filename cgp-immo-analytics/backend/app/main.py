"""
CGP Immo Analytics — API principale.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from loguru import logger

from app.core.config import get_settings
from app.api import funds, assets, market, auth, health


settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup / Shutdown."""
    logger.info(f"🚀 {settings.APP_NAME} v{settings.APP_VERSION} démarré")
    logger.info(f"📊 Environnement: {settings.ENVIRONMENT}")
    yield
    logger.info("👋 Arrêt de l'application")


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Plateforme d'analyse de fonds immobiliers retail pour CGP",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:8000",
        "https://*.vercel.app",  # Si deploy front séparé
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routes
app.include_router(health.router, tags=["Health"])
app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])
app.include_router(funds.router, prefix="/api/funds", tags=["Fonds"])
app.include_router(assets.router, prefix="/api/assets", tags=["Actifs"])
app.include_router(market.router, prefix="/api/market", tags=["Marché"])
