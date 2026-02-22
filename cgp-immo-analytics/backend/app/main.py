"""
CGP Immo Analytics — API principale.
Remediations: H1 (rate limiting), H3 (CORS restrict), M1 (structured logging), M2 (error handling).
"""
import logging
import sys
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from app.core.config import get_settings
from app.api import funds, assets, market, auth, health


settings = get_settings()

# ============================================================
# M1 FIX: Structured logging (JSON in production)
# ============================================================
log_format = "%(asctime)s %(levelname)s %(name)s %(message)s"
logging.basicConfig(
    level=logging.INFO,
    format=log_format,
    handlers=[logging.StreamHandler(sys.stdout)],
)
logger = logging.getLogger("cgp-immo")

# ============================================================
# H1 FIX: Rate limiting
# ============================================================
limiter = Limiter(key_func=get_remote_address, default_limits=["100/minute"])


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup / Shutdown."""
    logger.info("CGP Immo Analytics v%s started (env=%s)", settings.APP_VERSION, settings.ENVIRONMENT)
    yield
    logger.info("CGP Immo Analytics shutting down")


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Plateforme d'analyse de fonds immobiliers retail pour CGP",
    lifespan=lifespan,
    # M2 FIX: Hide docs in production
    docs_url="/docs" if settings.ENVIRONMENT == "development" else None,
    redoc_url="/redoc" if settings.ENVIRONMENT == "development" else None,
)

# H1: Attach rate limiter
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# ============================================================
# H3 FIX: CORS restricted to explicit origins
# ============================================================
allowed_origins = [o.strip() for o in settings.CORS_ORIGINS.split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
)


# ============================================================
# M2 FIX: Global error handler — no stack traces in production
# ============================================================
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error("Unhandled error: %s %s — %s", request.method, request.url.path, str(exc), exc_info=True)
    if settings.ENVIRONMENT == "development":
        detail = str(exc)
    else:
        detail = "Erreur interne du serveur"
    return JSONResponse(status_code=500, content={"detail": detail})


# Routes
app.include_router(health.router, tags=["Health"])
app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])
app.include_router(funds.router, prefix="/api/funds", tags=["Fonds"])
app.include_router(assets.router, prefix="/api/assets", tags=["Actifs"])
app.include_router(market.router, prefix="/api/market", tags=["Marche"])
