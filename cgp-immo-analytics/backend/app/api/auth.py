"""
API Auth — Inscription, login, JWT avec refresh tokens.
Remediations: C1 (get_current_user), C2 (role hardcode), C3 (body login), H2 (refresh tokens).
"""
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from passlib.context import CryptContext
from jose import jwt, JWTError
from datetime import datetime, timedelta
import secrets
import logging

from app.core.config import get_db, get_settings
from app.models.models import User
from app.schemas.schemas import UserCreate, UserOut, Token, LoginRequest, RefreshRequest

logger = logging.getLogger(__name__)
router = APIRouter()
settings = get_settings()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire, "type": "access"})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def create_refresh_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire, "type": "refresh"})
    return jwt.encode(to_encode, settings.REFRESH_SECRET_KEY, algorithm=settings.ALGORITHM)


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    """Decode JWT and return the current authenticated user."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Token invalide ou expire",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id: str = payload.get("sub")
        token_type: str = payload.get("type")
        if user_id is None or token_type != "access":
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if user is None or not user.is_active:
        raise credentials_exception
    return user


async def require_admin(current_user: User = Depends(get_current_user)) -> User:
    """Require admin role."""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acces reserve aux administrateurs",
        )
    return current_user


def generate_referral_code() -> str:
    return secrets.token_urlsafe(6).upper()[:8]


@router.post("/register", response_model=UserOut)
async def register(user_data: UserCreate, db: AsyncSession = Depends(get_db)):
    """Inscription d'un nouvel utilisateur."""

    # Check email unique
    existing = await db.execute(
        select(User).where(User.email == user_data.email)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cet email est deja utilise"
        )

    # Gerer le parrainage
    referred_by_id = None
    if user_data.referral_code:
        referrer = await db.execute(
            select(User).where(User.referral_code == user_data.referral_code)
        )
        referrer_user = referrer.scalar_one_or_none()
        if referrer_user:
            referred_by_id = referrer_user.id
            referrer_user.referral_count += 1

    # C2 FIX: Role is always "student" — never user-controlled
    new_user = User(
        email=user_data.email,
        hashed_password=pwd_context.hash(user_data.password),
        first_name=user_data.first_name,
        last_name=user_data.last_name,
        role="student",
        school=user_data.school,
        referral_code=generate_referral_code(),
        referred_by=referred_by_id,
    )

    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)

    logger.info("New user registered: %s", new_user.email)
    return UserOut.model_validate(new_user)


@router.post("/login", response_model=Token)
async def login(credentials: LoginRequest, db: AsyncSession = Depends(get_db)):
    """C3 FIX: Credentials in request body, not query params."""

    result = await db.execute(select(User).where(User.email == credentials.email))
    user = result.scalar_one_or_none()

    if not user or not pwd_context.verify(credentials.password, user.hashed_password):
        logger.warning("Failed login attempt for: %s", credentials.email)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou mot de passe incorrect"
        )

    # Update login stats
    user.last_login = datetime.utcnow()
    user.login_count += 1
    await db.commit()

    token_data = {"sub": str(user.id), "role": user.role}
    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)

    logger.info("User logged in: %s", user.email)
    return Token(access_token=access_token, refresh_token=refresh_token)


@router.post("/refresh", response_model=Token)
async def refresh_token(request: RefreshRequest, db: AsyncSession = Depends(get_db)):
    """H2 FIX: Refresh token endpoint to get new access token."""
    try:
        payload = jwt.decode(
            request.refresh_token,
            settings.REFRESH_SECRET_KEY,
            algorithms=[settings.ALGORITHM],
        )
        user_id: str = payload.get("sub")
        token_type: str = payload.get("type")
        if user_id is None or token_type != "refresh":
            raise HTTPException(status_code=401, detail="Refresh token invalide")
    except JWTError:
        raise HTTPException(status_code=401, detail="Refresh token invalide ou expire")

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if user is None or not user.is_active:
        raise HTTPException(status_code=401, detail="Utilisateur inactif")

    token_data = {"sub": str(user.id), "role": user.role}
    new_access = create_access_token(token_data)
    new_refresh = create_refresh_token(token_data)

    return Token(access_token=new_access, refresh_token=new_refresh)


@router.get("/me", response_model=UserOut)
async def get_me(current_user: User = Depends(get_current_user)):
    """Get current authenticated user profile."""
    return UserOut.model_validate(current_user)
