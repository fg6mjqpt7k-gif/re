"""
API Fonds — Liste, détail, filtres, historique.
"""
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from typing import Optional
from uuid import UUID

from app.core.config import get_db
from app.models.models import Fund, ManagementCompany, FundHistory, FundFinancial, RiskScore
from app.schemas.schemas import FundOut, FundListOut, FundHistoryOut, FundFinancialOut, RiskScoreOut

router = APIRouter()


@router.get("/", response_model=FundListOut)
async def list_funds(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    fund_type: Optional[str] = Query(None, description="SCPI, OPCI, SCI"),
    category: Optional[str] = Query(None),
    min_distribution_rate: Optional[float] = Query(None),
    max_debt_ratio: Optional[float] = Query(None),
    esg_only: bool = Query(False),
    search: Optional[str] = Query(None, description="Recherche par nom"),
    sort_by: str = Query("name", description="name, distribution_rate, market_capitalization, occupancy_rate"),
    sort_order: str = Query("asc", description="asc, desc"),
    db: AsyncSession = Depends(get_db),
):
    """Liste paginée des fonds avec filtres."""
    
    query = select(Fund).options(selectinload(Fund.management_company))
    count_query = select(func.count(Fund.id))
    
    # Filtres
    filters = [Fund.is_active == True]
    
    if fund_type:
        filters.append(Fund.fund_type == fund_type)
    if category:
        filters.append(Fund.category == category)
    if min_distribution_rate is not None:
        filters.append(Fund.distribution_rate >= min_distribution_rate)
    if max_debt_ratio is not None:
        filters.append(Fund.debt_ratio <= max_debt_ratio)
    if esg_only:
        filters.append(Fund.esg_label == True)
    if search:
        filters.append(Fund.name.ilike(f"%{search}%"))
    
    for f in filters:
        query = query.where(f)
        count_query = count_query.where(f)
    
    # Tri
    sort_column = getattr(Fund, sort_by, Fund.name)
    if sort_order == "desc":
        query = query.order_by(sort_column.desc().nulls_last())
    else:
        query = query.order_by(sort_column.asc().nulls_last())
    
    # Count total
    total = (await db.execute(count_query)).scalar()
    
    # Pagination
    offset = (page - 1) * page_size
    query = query.offset(offset).limit(page_size)
    
    result = await db.execute(query)
    funds = result.scalars().all()
    
    return FundListOut(
        items=[FundOut.model_validate(f) for f in funds],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=(total + page_size - 1) // page_size,
    )


@router.get("/{fund_id}", response_model=FundOut)
async def get_fund(fund_id: UUID, db: AsyncSession = Depends(get_db)):
    """Détail d'un fonds."""
    result = await db.execute(
        select(Fund)
        .options(selectinload(Fund.management_company))
        .where(Fund.id == fund_id)
    )
    fund = result.scalar_one_or_none()
    if not fund:
        raise HTTPException(status_code=404, detail="Fonds non trouvé")
    return FundOut.model_validate(fund)


@router.get("/{fund_id}/history", response_model=list[FundHistoryOut])
async def get_fund_history(fund_id: UUID, db: AsyncSession = Depends(get_db)):
    """Historique d'un fonds."""
    result = await db.execute(
        select(FundHistory)
        .where(FundHistory.fund_id == fund_id)
        .order_by(FundHistory.year.desc(), FundHistory.quarter.desc().nulls_last())
    )
    return [FundHistoryOut.model_validate(h) for h in result.scalars().all()]


@router.get("/{fund_id}/financials", response_model=list[FundFinancialOut])
async def get_fund_financials(fund_id: UUID, db: AsyncSession = Depends(get_db)):
    """Comptes de résultat d'un fonds."""
    result = await db.execute(
        select(FundFinancial)
        .where(FundFinancial.fund_id == fund_id)
        .order_by(FundFinancial.fiscal_year.desc())
    )
    return [FundFinancialOut.model_validate(f) for f in result.scalars().all()]


@router.get("/{fund_id}/risk", response_model=Optional[RiskScoreOut])
async def get_fund_risk(fund_id: UUID, db: AsyncSession = Depends(get_db)):
    """Dernier scoring de risque d'un fonds."""
    result = await db.execute(
        select(RiskScore)
        .where(RiskScore.fund_id == fund_id)
        .order_by(RiskScore.computed_at.desc())
        .limit(1)
    )
    score = result.scalar_one_or_none()
    if not score:
        return None
    return RiskScoreOut.model_validate(score)


@router.get("/stats/overview")
async def get_funds_overview(db: AsyncSession = Depends(get_db)):
    """Statistiques globales du marché."""
    
    # Count par type
    type_counts = await db.execute(
        select(Fund.fund_type, func.count(Fund.id))
        .where(Fund.is_active == True)
        .group_by(Fund.fund_type)
    )
    
    # Capitalisation totale
    total_cap = await db.execute(
        select(func.sum(Fund.market_capitalization))
        .where(Fund.is_active == True)
    )
    
    # Rendement moyen
    avg_yield = await db.execute(
        select(func.avg(Fund.distribution_rate))
        .where(Fund.is_active == True)
        .where(Fund.distribution_rate.isnot(None))
    )
    
    return {
        "funds_by_type": {row[0]: row[1] for row in type_counts.all()},
        "total_market_capitalization": float(total_cap.scalar() or 0),
        "average_distribution_rate": round(float(avg_yield.scalar() or 0), 2),
    }
