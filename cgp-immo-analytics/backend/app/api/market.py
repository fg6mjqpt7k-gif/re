"""
API Donnees de marche — JLL, CBRE, BNP RE.
C1 FIX: All endpoints require authentication.
"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional

from app.core.config import get_db
from app.models.models import MarketData, User
from app.schemas.schemas import MarketDataOut
from app.api.auth import get_current_user

router = APIRouter()


@router.get("/", response_model=list[MarketDataOut])
async def list_market_data(
    segment: Optional[str] = Query(None),
    geography: Optional[str] = Query(None),
    year: Optional[int] = Query(None),
    source: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Données de marché avec filtres."""
    query = select(MarketData)
    
    if segment:
        query = query.where(MarketData.segment == segment)
    if geography:
        query = query.where(MarketData.geography.ilike(f"%{geography}%"))
    if year:
        query = query.where(MarketData.year == year)
    if source:
        query = query.where(MarketData.source == source)
    
    query = query.order_by(MarketData.year.desc(), MarketData.quarter.desc().nulls_last())
    
    result = await db.execute(query)
    return [MarketDataOut.model_validate(m) for m in result.scalars().all()]


@router.get("/segments")
async def list_segments(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Liste des segments disponibles."""
    result = await db.execute(
        select(MarketData.segment).distinct().order_by(MarketData.segment)
    )
    return [row[0] for row in result.all()]


@router.get("/geographies")
async def list_geographies(
    segment: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Liste des géographies disponibles."""
    query = select(MarketData.geography).distinct()
    if segment:
        query = query.where(MarketData.segment == segment)
    result = await db.execute(query.order_by(MarketData.geography))
    return [row[0] for row in result.all()]
