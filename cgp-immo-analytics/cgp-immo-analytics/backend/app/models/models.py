"""
Modèles SQLAlchemy — Fonds et sociétés de gestion.
"""
import uuid
from datetime import datetime, date
from sqlalchemy import (
    Column, String, Integer, BigInteger, Numeric, Boolean, Text, Date,
    DateTime, ForeignKey, Enum as PgEnum, ARRAY
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from geoalchemy2 import Geometry

from app.core.config import Base


class ManagementCompany(Base):
    __tablename__ = "management_companies"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False, unique=True)
    short_name = Column(String(100))
    siren = Column(String(9))
    amf_number = Column(String(50))
    website = Column(String(500))
    logo_url = Column(String(500))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    funds = relationship("Fund", back_populates="management_company")


class Fund(Base):
    __tablename__ = "funds"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Identification
    name = Column(String(255), nullable=False)
    isin = Column(String(12), unique=True)
    fund_type = Column(PgEnum('SCPI', 'OPCI', 'SCI', name='fund_type'), nullable=False)
    category = Column(PgEnum(
        'diversifiee', 'bureaux', 'commerces', 'logistique',
        'sante', 'residentiel', 'hotels', 'education', 'mixte', 'autre',
        name='fund_category'
    ))
    capital_type = Column(PgEnum('variable', 'fixe', name='fund_capital_type'))
    management_company_id = Column(UUID(as_uuid=True), ForeignKey("management_companies.id"))
    
    # Informations générales
    creation_date = Column(Date)
    minimum_subscription = Column(Numeric(15, 2))
    subscription_fee_rate = Column(Numeric(5, 2))
    management_fee_rate = Column(Numeric(5, 2))
    
    # Snapshot dernières données
    share_price = Column(Numeric(15, 2))
    withdrawal_price = Column(Numeric(15, 2))
    reconstitution_value = Column(Numeric(15, 2))
    realization_value = Column(Numeric(15, 2))
    market_capitalization = Column(Numeric(18, 2))
    nb_shares = Column(BigInteger)
    nb_shareholders = Column(Integer)
    
    # Métriques clés
    distribution_rate = Column(Numeric(5, 2))
    occupancy_rate = Column(Numeric(5, 2))
    report_a_nouveau = Column(Numeric(15, 2))
    provision_gros_reparation = Column(Numeric(15, 2))
    debt_ratio = Column(Numeric(5, 2))
    
    # Qualitatif
    investment_strategy = Column(Text)
    geographic_focus = Column(Text)
    esg_label = Column(Boolean, default=False)
    
    # Meta
    is_active = Column(Boolean, default=True)
    last_data_update = Column(DateTime)
    data_source = Column(String(100))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relations
    management_company = relationship("ManagementCompany", back_populates="funds")
    assets = relationship("Asset", back_populates="fund", cascade="all, delete-orphan")
    history = relationship("FundHistory", back_populates="fund", cascade="all, delete-orphan")
    financials = relationship("FundFinancial", back_populates="fund", cascade="all, delete-orphan")
    risk_scores = relationship("RiskScore", back_populates="fund", cascade="all, delete-orphan")


class FundHistory(Base):
    __tablename__ = "fund_history"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    fund_id = Column(UUID(as_uuid=True), ForeignKey("funds.id", ondelete="CASCADE"), nullable=False)
    year = Column(Integer, nullable=False)
    quarter = Column(Integer)
    
    share_price = Column(Numeric(15, 2))
    withdrawal_price = Column(Numeric(15, 2))
    reconstitution_value = Column(Numeric(15, 2))
    distribution_rate = Column(Numeric(5, 2))
    dividend_per_share = Column(Numeric(10, 2))
    total_return = Column(Numeric(5, 2))
    
    gross_collection = Column(Numeric(18, 2))
    net_collection = Column(Numeric(18, 2))
    withdrawals = Column(Numeric(18, 2))
    waiting_withdrawals = Column(Numeric(18, 2))
    market_capitalization = Column(Numeric(18, 2))
    nb_shares = Column(BigInteger)
    nb_shareholders = Column(Integer)
    
    occupancy_rate = Column(Numeric(5, 2))
    report_a_nouveau = Column(Numeric(15, 2))
    debt_ratio = Column(Numeric(5, 2))
    
    data_source = Column(String(100))
    created_at = Column(DateTime, default=datetime.utcnow)

    fund = relationship("Fund", back_populates="history")


class Asset(Base):
    __tablename__ = "assets"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    fund_id = Column(UUID(as_uuid=True), ForeignKey("funds.id", ondelete="CASCADE"), nullable=False)
    
    name = Column(String(500))
    address = Column(String(500))
    city = Column(String(255))
    postal_code = Column(String(10))
    country = Column(String(100), default="France")
    
    location = Column(Geometry("POINT", srid=4326))
    latitude = Column(Numeric(10, 7))
    longitude = Column(Numeric(10, 7))
    
    asset_type = Column(PgEnum(
        'bureaux', 'commerces', 'logistique', 'residentiel',
        'sante', 'hotels', 'education', 'mixte', 'terrain', 'autre',
        name='asset_type'
    ))
    surface_sqm = Column(Numeric(12, 2))
    nb_units = Column(Integer)
    year_built = Column(Integer)
    year_acquired = Column(Integer)
    acquisition_date = Column(Date)
    
    acquisition_price = Column(Numeric(18, 2))
    current_valuation = Column(Numeric(18, 2))
    valuation_date = Column(Date)
    price_per_sqm = Column(Numeric(10, 2))
    
    annual_rent = Column(Numeric(15, 2))
    occupancy_rate = Column(Numeric(5, 2))
    main_tenant = Column(String(255))
    nb_tenants = Column(Integer)
    lease_duration_years = Column(Numeric(4, 1))
    walt = Column(Numeric(4, 1))
    
    energy_label = Column(String(10))
    environmental_cert = Column(String(100))
    
    data_source = Column(String(100))
    source_document = Column(String(500))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    fund = relationship("Fund", back_populates="assets")


class FundFinancial(Base):
    __tablename__ = "fund_financials"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    fund_id = Column(UUID(as_uuid=True), ForeignKey("funds.id", ondelete="CASCADE"), nullable=False)
    fiscal_year = Column(Integer, nullable=False)
    
    rental_income = Column(Numeric(18, 2))
    other_income = Column(Numeric(18, 2))
    financial_income = Column(Numeric(18, 2))
    total_income = Column(Numeric(18, 2))
    
    property_charges = Column(Numeric(18, 2))
    non_recoverable_charges = Column(Numeric(18, 2))
    management_fees = Column(Numeric(18, 2))
    provision_charges = Column(Numeric(18, 2))
    financial_charges = Column(Numeric(18, 2))
    other_charges = Column(Numeric(18, 2))
    total_charges = Column(Numeric(18, 2))
    
    net_income = Column(Numeric(18, 2))
    net_income_per_share = Column(Numeric(10, 2))
    distributable_income = Column(Numeric(18, 2))
    distributed_amount = Column(Numeric(18, 2))
    
    cost_ratio = Column(Numeric(5, 2))
    distribution_payout = Column(Numeric(5, 2))
    
    data_source = Column(String(100))
    created_at = Column(DateTime, default=datetime.utcnow)

    fund = relationship("Fund", back_populates="financials")


class RiskScore(Base):
    __tablename__ = "risk_scores"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    fund_id = Column(UUID(as_uuid=True), ForeignKey("funds.id", ondelete="CASCADE"), nullable=False)
    computed_at = Column(DateTime, default=datetime.utcnow)
    
    overall_score = Column(Numeric(5, 2))
    risk_category = Column(String(20))
    
    geographic_concentration = Column(Numeric(5, 2))
    sector_concentration = Column(Numeric(5, 2))
    tenant_concentration = Column(Numeric(5, 2))
    leverage_score = Column(Numeric(5, 2))
    liquidity_score = Column(Numeric(5, 2))
    occupancy_score = Column(Numeric(5, 2))
    lease_duration_score = Column(Numeric(5, 2))
    valuation_gap_score = Column(Numeric(5, 2))
    collection_trend_score = Column(Numeric(5, 2))
    
    model_version = Column(String(50))
    methodology_notes = Column(Text)

    fund = relationship("Fund", back_populates="risk_scores")


class MarketData(Base):
    __tablename__ = "market_data"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    segment = Column(PgEnum(
        'bureaux_prime', 'bureaux_secondaire',
        'commerces_high_street', 'commerces_retail_park', 'commerces_centre_commercial',
        'logistique', 'residentiel', 'sante', 'hotels',
        name='market_segment'
    ), nullable=False)
    geography = Column(String(255), nullable=False)
    sub_geography = Column(String(255))
    year = Column(Integer, nullable=False)
    quarter = Column(Integer)
    
    cap_rate = Column(Numeric(5, 2))
    prime_rent = Column(Numeric(10, 2))
    average_rent = Column(Numeric(10, 2))
    vacancy_rate = Column(Numeric(5, 2))
    take_up = Column(Numeric(18, 2))
    investment_volume = Column(Numeric(18, 2))
    supply = Column(Numeric(18, 2))
    pipeline = Column(Numeric(18, 2))
    
    source = Column(String(100), nullable=False)
    report_name = Column(String(500))
    created_at = Column(DateTime, default=datetime.utcnow)


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), nullable=False, unique=True)
    hashed_password = Column(String(255), nullable=False)
    
    first_name = Column(String(100))
    last_name = Column(String(100))
    role = Column(PgEnum('student', 'cgp', 'admin', name='user_role'), default='student')
    school = Column(String(255))
    company = Column(String(255))
    cif_number = Column(String(50))
    
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    last_login = Column(DateTime)
    login_count = Column(Integer, default=0)
    
    referral_code = Column(String(20), unique=True)
    referred_by = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    referral_count = Column(Integer, default=0)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class ExtractionLog(Base):
    __tablename__ = "extraction_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    fund_id = Column(UUID(as_uuid=True), ForeignKey("funds.id"))
    
    document_name = Column(String(500))
    document_type = Column(String(100))
    document_year = Column(Integer)
    
    extraction_status = Column(String(50))
    extraction_method = Column(String(100))
    fields_extracted = Column(ARRAY(Text))
    confidence_score = Column(Numeric(5, 2))
    error_message = Column(Text)
    
    processed_at = Column(DateTime, default=datetime.utcnow)
