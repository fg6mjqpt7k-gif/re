"""
API Auth — Inscription, login, JWT.
Cible : étudiants CGP, freemium.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from passlib.context import CryptContext
from jose import jwt, JWTError
from datetime import datetime, timedelta
import secrets

from app.core.config import get_db, get_settings
from app.models.models import User
from app.schemas.schemas import UserCreate, UserOut, Token

router = APIRouter()
settings = get_settings()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


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
            detail="Cet email est déjà utilisé"
        )
    
    # Gérer le parrainage
    referred_by_id = None
    if user_data.referral_code:
        referrer = await db.execute(
            select(User).where(User.referral_code == user_data.referral_code)
        )
        referrer_user = referrer.scalar_one_or_none()
        if referrer_user:
            referred_by_id = referrer_user.id
            referrer_user.referral_count += 1
    
    # Créer l'utilisateur
    new_user = User(
        email=user_data.email,
        hashed_password=pwd_context.hash(user_data.password),
        first_name=user_data.first_name,
        last_name=user_data.last_name,
        role=user_data.role,
        school=user_data.school,
        referral_code=generate_referral_code(),
        referred_by=referred_by_id,
    )
    
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    
    return UserOut.model_validate(new_user)


@router.post("/login", response_model=Token)
async def login(email: str, password: str, db: AsyncSession = Depends(get_db)):
    """Connexion et obtention du JWT."""
    
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    
    if not user or not pwd_context.verify(password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou mot de passe incorrect"
        )
    
    # Update login stats
    user.last_login = datetime.utcnow()
    user.login_count += 1
    await db.commit()
    
    token = create_access_token({"sub": str(user.id), "role": user.role})
    return Token(access_token=token)
