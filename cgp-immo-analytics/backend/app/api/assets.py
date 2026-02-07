"""
API Actifs — Carte, geolocalisation, filtres.
C1 FIX: All endpoints require authentication.
"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import Optional
from uuid import UUID

from app.core.config import get_db
from app.models.models import Asset, Fund, User
from app.schemas.schemas import AssetOut, AssetMapOut
from app.api.auth import get_current_user

router = APIRouter()


@router.get("/map", response_model=list[AssetMapOut])
async def get_assets_for_map(
    fund_id: Optional[UUID] = Query(None),
    fund_type: Optional[str] = Query(None),
    asset_type: Optional[str] = Query(None),
    city: Optional[str] = Query(None),
    country: Optional[str] = Query(None, description="Filtre par pays"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Tous les actifs géolocalisés pour la carte interactive."""
    
    query = (
        select(
            Asset.id,
            Asset.fund_id,
            Fund.name.label("fund_name"),
            Fund.fund_type,
            Asset.name,
            Asset.city,
            Asset.latitude,
            Asset.longitude,
            Asset.asset_type,
            Asset.surface_sqm,
            Asset.current_valuation,
        )
        .join(Fund, Asset.fund_id == Fund.id)
        .where(Asset.latitude.isnot(None))
        .where(Asset.longitude.isnot(None))
    )
    
    if fund_id:
        query = query.where(Asset.fund_id == fund_id)
    if fund_type:
        query = query.where(Fund.fund_type == fund_type)
    if asset_type:
        query = query.where(Asset.asset_type == asset_type)
    if city:
        query = query.where(Asset.city.ilike(f"%{city}%"))
    if country:
        query = query.where(Asset.country == country)
    
    result = await db.execute(query)
    rows = result.all()
    
    return [
        AssetMapOut(
            id=row.id,
            fund_id=row.fund_id,
            fund_name=row.fund_name,
            fund_type=row.fund_type,
            name=row.name,
            city=row.city,
            latitude=row.latitude,
            longitude=row.longitude,
            asset_type=row.asset_type,
            surface_sqm=row.surface_sqm,
            current_valuation=row.current_valuation,
        )
        for row in rows
    ]


@router.get("/fund/{fund_id}", response_model=list[AssetOut])
async def get_fund_assets(fund_id: UUID, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Liste des actifs d'un fonds spécifique."""
    result = await db.execute(
        select(Asset)
        .where(Asset.fund_id == fund_id)
        .order_by(Asset.current_valuation.desc().nulls_last())
    )
    return [AssetOut.model_validate(a) for a in result.scalars().all()]


@router.get("/stats")
async def get_assets_stats(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Statistiques sur le patrimoine."""
    
    # Par type d'actif
    by_type = await db.execute(
        select(
            Asset.asset_type,
            func.count(Asset.id),
            func.sum(Asset.surface_sqm),
            func.sum(Asset.current_valuation),
        )
        .where(Asset.asset_type.isnot(None))
        .group_by(Asset.asset_type)
    )
    
    # Par pays
    by_country = await db.execute(
        select(
            Asset.country,
            func.count(Asset.id),
            func.sum(Asset.current_valuation),
        )
        .group_by(Asset.country)
        .order_by(func.sum(Asset.current_valuation).desc())
    )
    
    return {
        "by_asset_type": [
            {
                "type": row[0], "count": row[1],
                "total_surface": float(row[2] or 0),
                "total_valuation": float(row[3] or 0),
            }
            for row in by_type.all()
        ],
        "by_country": [
            {"country": row[0], "count": row[1], "total_valuation": float(row[2] or 0)}
            for row in by_country.all()
        ],
    }
