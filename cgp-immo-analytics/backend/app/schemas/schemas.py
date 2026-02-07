"""
Pydantic schemas — Validation et sérialisation API.
"""
from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime, date
from uuid import UUID
from decimal import Decimal


# =============================================================================
# Management Company
# =============================================================================
class ManagementCompanyBase(BaseModel):
    name: str
    short_name: Optional[str] = None
    website: Optional[str] = None

class ManagementCompanyOut(ManagementCompanyBase):
    id: UUID
    class Config:
        from_attributes = True


# =============================================================================
# Fund
# =============================================================================
class FundBase(BaseModel):
    name: str
    fund_type: str
    category: Optional[str] = None
    capital_type: Optional[str] = None

class FundCreate(FundBase):
    isin: Optional[str] = None
    management_company_id: Optional[UUID] = None
    creation_date: Optional[date] = None
    share_price: Optional[Decimal] = None
    distribution_rate: Optional[Decimal] = None
    occupancy_rate: Optional[Decimal] = None

class FundOut(FundBase):
    id: UUID
    isin: Optional[str] = None
    management_company: Optional[ManagementCompanyOut] = None
    
    # Prix et valorisation
    share_price: Optional[Decimal] = None
    withdrawal_price: Optional[Decimal] = None
    reconstitution_value: Optional[Decimal] = None
    market_capitalization: Optional[Decimal] = None
    
    # Métriques
    distribution_rate: Optional[Decimal] = None
    occupancy_rate: Optional[Decimal] = None
    debt_ratio: Optional[Decimal] = None
    report_a_nouveau: Optional[Decimal] = None
    
    # Frais
    subscription_fee_rate: Optional[Decimal] = None
    management_fee_rate: Optional[Decimal] = None
    
    # Meta
    esg_label: bool = False
    is_active: bool = True
    creation_date: Optional[date] = None
    last_data_update: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class FundListOut(BaseModel):
    """Réponse paginée pour la liste des fonds."""
    items: List[FundOut]
    total: int
    page: int
    page_size: int
    total_pages: int


# =============================================================================
# Fund History
# =============================================================================
class FundHistoryOut(BaseModel):
    id: UUID
    year: int
    quarter: Optional[int] = None
    share_price: Optional[Decimal] = None
    distribution_rate: Optional[Decimal] = None
    dividend_per_share: Optional[Decimal] = None
    total_return: Optional[Decimal] = None
    gross_collection: Optional[Decimal] = None
    net_collection: Optional[Decimal] = None
    market_capitalization: Optional[Decimal] = None
    occupancy_rate: Optional[Decimal] = None
    debt_ratio: Optional[Decimal] = None
    
    class Config:
        from_attributes = True


# =============================================================================
# Asset
# =============================================================================
class AssetOut(BaseModel):
    id: UUID
    fund_id: UUID
    name: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    country: str = "France"
    latitude: Optional[Decimal] = None
    longitude: Optional[Decimal] = None
    asset_type: Optional[str] = None
    surface_sqm: Optional[Decimal] = None
    current_valuation: Optional[Decimal] = None
    annual_rent: Optional[Decimal] = None
    occupancy_rate: Optional[Decimal] = None
    main_tenant: Optional[str] = None
    energy_label: Optional[str] = None
    walt: Optional[Decimal] = None
    
    class Config:
        from_attributes = True

class AssetMapOut(BaseModel):
    """Format léger pour la carte."""
    id: UUID
    fund_id: UUID
    fund_name: str
    fund_type: str
    name: Optional[str] = None
    city: Optional[str] = None
    latitude: Decimal
    longitude: Decimal
    asset_type: Optional[str] = None
    surface_sqm: Optional[Decimal] = None
    current_valuation: Optional[Decimal] = None


# =============================================================================
# Market Data
# =============================================================================
class MarketDataOut(BaseModel):
    id: UUID
    segment: str
    geography: str
    year: int
    quarter: Optional[int] = None
    cap_rate: Optional[Decimal] = None
    prime_rent: Optional[Decimal] = None
    vacancy_rate: Optional[Decimal] = None
    investment_volume: Optional[Decimal] = None
    source: str
    
    class Config:
        from_attributes = True


# =============================================================================
# Fund Financials
# =============================================================================
class FundFinancialOut(BaseModel):
    id: UUID
    fiscal_year: int
    rental_income: Optional[Decimal] = None
    total_income: Optional[Decimal] = None
    management_fees: Optional[Decimal] = None
    financial_charges: Optional[Decimal] = None
    total_charges: Optional[Decimal] = None
    net_income: Optional[Decimal] = None
    net_income_per_share: Optional[Decimal] = None
    distributable_income: Optional[Decimal] = None
    distributed_amount: Optional[Decimal] = None
    cost_ratio: Optional[Decimal] = None
    
    class Config:
        from_attributes = True


# =============================================================================
# Risk Score
# =============================================================================
class RiskScoreOut(BaseModel):
    id: UUID
    fund_id: UUID
    computed_at: datetime
    overall_score: Optional[Decimal] = None
    risk_category: Optional[str] = None
    geographic_concentration: Optional[Decimal] = None
    sector_concentration: Optional[Decimal] = None
    tenant_concentration: Optional[Decimal] = None
    leverage_score: Optional[Decimal] = None
    liquidity_score: Optional[Decimal] = None
    occupancy_score: Optional[Decimal] = None
    lease_duration_score: Optional[Decimal] = None
    valuation_gap_score: Optional[Decimal] = None
    collection_trend_score: Optional[Decimal] = None
    model_version: Optional[str] = None
    
    class Config:
        from_attributes = True


# =============================================================================
# User / Auth
# =============================================================================
class UserCreate(BaseModel):
    """C2 FIX: role field removed — always defaults to 'student' server-side."""
    email: EmailStr
    password: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    school: Optional[str] = None
    referral_code: Optional[str] = None

class LoginRequest(BaseModel):
    """C3 FIX: Credentials in request body, not query params."""
    email: EmailStr
    password: str

class RefreshRequest(BaseModel):
    """H2 FIX: Refresh token request."""
    refresh_token: str

class UserOut(BaseModel):
    id: UUID
    email: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    role: str
    school: Optional[str] = None
    company: Optional[str] = None
    referral_code: Optional[str] = None
    referral_count: int = 0
    created_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    refresh_token: Optional[str] = None
    token_type: str = "bearer"
