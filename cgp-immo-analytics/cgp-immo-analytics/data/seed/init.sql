-- =============================================================================
-- CGP Immo Analytics — Schema de base de données
-- PostgreSQL 16 + PostGIS
-- =============================================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- =============================================================================
-- 1. SOCIÉTÉS DE GESTION
-- =============================================================================
CREATE TABLE management_companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL UNIQUE,
    short_name VARCHAR(100),
    siren VARCHAR(9),
    amf_number VARCHAR(50),           -- Numéro agrément AMF
    website VARCHAR(500),
    logo_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- =============================================================================
-- 2. FONDS (SCPI, OPCI, SCI)
-- =============================================================================
CREATE TYPE fund_type AS ENUM ('SCPI', 'OPCI', 'SCI');
CREATE TYPE fund_category AS ENUM (
    'diversifiee', 'bureaux', 'commerces', 'logistique',
    'sante', 'residentiel', 'hotels', 'education', 'mixte', 'autre'
);
CREATE TYPE fund_capital_type AS ENUM ('variable', 'fixe');

CREATE TABLE funds (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Identification
    name VARCHAR(255) NOT NULL,
    isin VARCHAR(12) UNIQUE,
    fund_type fund_type NOT NULL,
    category fund_category,
    capital_type fund_capital_type,
    management_company_id UUID REFERENCES management_companies(id),
    
    -- Informations générales
    creation_date DATE,
    first_dividend_date DATE,
    minimum_subscription DECIMAL(15,2),     -- Montant minimum de souscription
    subscription_fee_rate DECIMAL(5,2),      -- Frais de souscription (%)
    management_fee_rate DECIMAL(5,2),        -- Frais de gestion (%)
    
    -- Dernières données connues (snapshot)
    share_price DECIMAL(15,2),               -- Prix de part (souscription)
    withdrawal_price DECIMAL(15,2),          -- Prix de retrait
    reconstitution_value DECIMAL(15,2),      -- Valeur de reconstitution
    realization_value DECIMAL(15,2),         -- Valeur de réalisation
    market_capitalization DECIMAL(18,2),     -- Capitalisation
    nb_shares BIGINT,                        -- Nombre de parts
    nb_shareholders INTEGER,                 -- Nombre d'associés
    
    -- Métriques clés
    distribution_rate DECIMAL(5,2),          -- Taux de distribution (TD)
    occupancy_rate DECIMAL(5,2),             -- Taux d'occupation financier (TOF)
    report_a_nouveau DECIMAL(15,2),          -- Report à nouveau (jours)
    provision_gros_reparation DECIMAL(15,2), -- Provision pour gros travaux
    debt_ratio DECIMAL(5,2),                 -- Ratio d'endettement (%)
    
    -- Données qualitatives
    investment_strategy TEXT,
    geographic_focus TEXT,                    -- Description zone géographique
    esg_label BOOLEAN DEFAULT FALSE,         -- Label ISR
    
    -- Meta
    is_active BOOLEAN DEFAULT TRUE,
    last_data_update TIMESTAMP,
    data_source VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_funds_type ON funds(fund_type);
CREATE INDEX idx_funds_category ON funds(category);
CREATE INDEX idx_funds_management_company ON funds(management_company_id);

-- =============================================================================
-- 3. HISTORIQUE DES FONDS (séries temporelles)
-- =============================================================================
CREATE TABLE fund_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    fund_id UUID NOT NULL REFERENCES funds(id) ON DELETE CASCADE,
    
    -- Période
    year INTEGER NOT NULL,
    quarter INTEGER,                         -- NULL = annuel, 1-4 = trimestriel
    
    -- Prix et valorisation
    share_price DECIMAL(15,2),
    withdrawal_price DECIMAL(15,2),
    reconstitution_value DECIMAL(15,2),
    realization_value DECIMAL(15,2),
    
    -- Performance
    distribution_rate DECIMAL(5,2),          -- TD
    dividend_per_share DECIMAL(10,2),        -- Dividende par part
    total_return DECIMAL(5,2),               -- Rendement global (TD + variation prix)
    
    -- Collecte et capitalisation
    gross_collection DECIMAL(18,2),          -- Collecte brute
    net_collection DECIMAL(18,2),            -- Collecte nette
    withdrawals DECIMAL(18,2),               -- Retraits
    waiting_withdrawals DECIMAL(18,2),       -- Parts en attente de retrait
    market_capitalization DECIMAL(18,2),
    nb_shares BIGINT,
    nb_shareholders INTEGER,
    
    -- Exploitation
    occupancy_rate DECIMAL(5,2),             -- TOF
    report_a_nouveau DECIMAL(15,2),
    debt_ratio DECIMAL(5,2),
    
    data_source VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(fund_id, year, quarter)
);

CREATE INDEX idx_fund_history_fund ON fund_history(fund_id);
CREATE INDEX idx_fund_history_date ON fund_history(year, quarter);

-- =============================================================================
-- 4. ACTIFS IMMOBILIERS (patrimoine des fonds)
-- =============================================================================
CREATE TYPE asset_type AS ENUM (
    'bureaux', 'commerces', 'logistique', 'residentiel',
    'sante', 'hotels', 'education', 'mixte', 'terrain', 'autre'
);

CREATE TABLE assets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    fund_id UUID NOT NULL REFERENCES funds(id) ON DELETE CASCADE,
    
    -- Identification
    name VARCHAR(500),
    address VARCHAR(500),
    city VARCHAR(255),
    postal_code VARCHAR(10),
    country VARCHAR(100) DEFAULT 'France',
    
    -- Géolocalisation (PostGIS)
    location GEOMETRY(Point, 4326),          -- SRID 4326 = WGS84
    latitude DECIMAL(10,7),
    longitude DECIMAL(10,7),
    
    -- Caractéristiques
    asset_type asset_type,
    surface_sqm DECIMAL(12,2),               -- Surface en m²
    nb_units INTEGER,                        -- Nombre de lots
    nb_floors INTEGER,
    year_built INTEGER,
    year_acquired INTEGER,
    acquisition_date DATE,
    
    -- Valorisation
    acquisition_price DECIMAL(18,2),
    current_valuation DECIMAL(18,2),         -- Dernière expertise
    valuation_date DATE,
    price_per_sqm DECIMAL(10,2),             -- Prix au m² (calculé)
    
    -- Locatif
    annual_rent DECIMAL(15,2),               -- Loyer annuel
    occupancy_rate DECIMAL(5,2),             -- Taux d'occupation
    main_tenant VARCHAR(255),
    nb_tenants INTEGER,
    lease_duration_years DECIMAL(4,1),       -- Durée moyenne résiduelle baux
    walt DECIMAL(4,1),                       -- Weighted Average Lease Term
    
    -- Certifications
    energy_label VARCHAR(10),                -- DPE (A-G)
    environmental_cert VARCHAR(100),         -- BREEAM, HQE, LEED...
    
    -- Meta
    data_source VARCHAR(100),
    source_document VARCHAR(500),            -- Nom du PDF source
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_assets_fund ON assets(fund_id);
CREATE INDEX idx_assets_type ON assets(asset_type);
CREATE INDEX idx_assets_location ON assets USING GIST(location);
CREATE INDEX idx_assets_city ON assets(city);

-- =============================================================================
-- 5. DONNÉES DE MARCHÉ (JLL, CBRE, BNP RE, IEIF)
-- =============================================================================
CREATE TYPE market_segment AS ENUM (
    'bureaux_prime', 'bureaux_secondaire',
    'commerces_high_street', 'commerces_retail_park', 'commerces_centre_commercial',
    'logistique', 'residentiel', 'sante', 'hotels'
);

CREATE TABLE market_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Localisation et segment
    segment market_segment NOT NULL,
    geography VARCHAR(255) NOT NULL,         -- "Paris QCA", "Lyon Part-Dieu", "Ile-de-France"
    sub_geography VARCHAR(255),              -- Sous-zone plus fine
    
    -- Période
    year INTEGER NOT NULL,
    quarter INTEGER,
    
    -- Indicateurs de marché
    cap_rate DECIMAL(5,2),                   -- Taux de capitalisation (%)
    prime_rent DECIMAL(10,2),                -- Loyer prime (€/m²/an)
    average_rent DECIMAL(10,2),              -- Loyer moyen
    vacancy_rate DECIMAL(5,2),               -- Taux de vacance (%)
    take_up DECIMAL(18,2),                   -- Demande placée (m²)
    investment_volume DECIMAL(18,2),         -- Volume d'investissement (€)
    supply DECIMAL(18,2),                    -- Offre disponible (m²)
    pipeline DECIMAL(18,2),                  -- Pipeline de construction (m²)
    
    -- Source
    source VARCHAR(100) NOT NULL,            -- JLL, CBRE, BNP RE, IEIF, etc.
    report_name VARCHAR(500),
    
    created_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(segment, geography, year, quarter, source)
);

CREATE INDEX idx_market_data_segment ON market_data(segment);
CREATE INDEX idx_market_data_geo ON market_data(geography);
CREATE INDEX idx_market_data_date ON market_data(year, quarter);

-- =============================================================================
-- 6. COMPTES DE RÉSULTAT DES FONDS
-- =============================================================================
CREATE TABLE fund_financials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    fund_id UUID NOT NULL REFERENCES funds(id) ON DELETE CASCADE,
    fiscal_year INTEGER NOT NULL,
    
    -- Produits
    rental_income DECIMAL(18,2),             -- Produits locatifs bruts
    other_income DECIMAL(18,2),              -- Autres produits
    financial_income DECIMAL(18,2),          -- Produits financiers
    total_income DECIMAL(18,2),              -- Total produits
    
    -- Charges
    property_charges DECIMAL(18,2),          -- Charges immobilières
    non_recoverable_charges DECIMAL(18,2),   -- Charges non récupérables
    management_fees DECIMAL(18,2),           -- Frais de gestion
    provision_charges DECIMAL(18,2),         -- Dotations aux provisions
    financial_charges DECIMAL(18,2),         -- Charges financières (dette)
    other_charges DECIMAL(18,2),
    total_charges DECIMAL(18,2),
    
    -- Résultats
    net_income DECIMAL(18,2),                -- Résultat net
    net_income_per_share DECIMAL(10,2),
    distributable_income DECIMAL(18,2),      -- Résultat distribuable
    distributed_amount DECIMAL(18,2),        -- Montant distribué
    
    -- Ratios calculés
    cost_ratio DECIMAL(5,2),                 -- Ratio de charges (%)
    distribution_payout DECIMAL(5,2),        -- Taux de distribution / résultat
    
    data_source VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(fund_id, fiscal_year)
);

CREATE INDEX idx_fund_financials_fund ON fund_financials(fund_id);

-- =============================================================================
-- 7. SCORING DE RISQUE
-- =============================================================================
CREATE TABLE risk_scores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    fund_id UUID NOT NULL REFERENCES funds(id) ON DELETE CASCADE,
    computed_at TIMESTAMP DEFAULT NOW(),
    
    -- Score global (0-100, 100 = risque max)
    overall_score DECIMAL(5,2),
    risk_category VARCHAR(20),               -- 'faible', 'modéré', 'élevé', 'très élevé'
    
    -- Sous-scores (0-100 chacun)
    geographic_concentration DECIMAL(5,2),   -- Concentration géographique
    sector_concentration DECIMAL(5,2),       -- Concentration sectorielle
    tenant_concentration DECIMAL(5,2),       -- Concentration locataire
    leverage_score DECIMAL(5,2),             -- Risque d'endettement
    liquidity_score DECIMAL(5,2),            -- Risque de liquidité
    occupancy_score DECIMAL(5,2),            -- Risque de vacance
    lease_duration_score DECIMAL(5,2),       -- Durée résiduelle des baux
    valuation_gap_score DECIMAL(5,2),        -- Écart valorisation vs marché
    collection_trend_score DECIMAL(5,2),     -- Tendance collecte
    
    -- Détails du modèle
    model_version VARCHAR(50),
    methodology_notes TEXT,
    
    UNIQUE(fund_id, computed_at)
);

CREATE INDEX idx_risk_scores_fund ON risk_scores(fund_id);

-- =============================================================================
-- 8. UTILISATEURS (étudiants CGP, CGP)
-- =============================================================================
CREATE TYPE user_role AS ENUM ('student', 'cgp', 'admin');

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    email VARCHAR(255) NOT NULL UNIQUE,
    hashed_password VARCHAR(255) NOT NULL,
    
    -- Profil
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    role user_role DEFAULT 'student',
    school VARCHAR(255),                     -- École/université (pour étudiants)
    company VARCHAR(255),                    -- Cabinet (pour CGP)
    cif_number VARCHAR(50),                  -- N° CIF (pour CGP vérifiés)
    
    -- Engagement
    is_active BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE,
    last_login TIMESTAMP,
    login_count INTEGER DEFAULT 0,
    
    -- Parrainage / viralité
    referral_code VARCHAR(20) UNIQUE,
    referred_by UUID REFERENCES users(id),
    referral_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_referral ON users(referral_code);

-- =============================================================================
-- 9. FAVORIS ET ALERTES UTILISATEUR
-- =============================================================================
CREATE TABLE user_favorites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    fund_id UUID NOT NULL REFERENCES funds(id) ON DELETE CASCADE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, fund_id)
);

CREATE TABLE user_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    fund_id UUID REFERENCES funds(id) ON DELETE CASCADE,
    
    alert_type VARCHAR(50),                  -- 'price_change', 'new_report', 'risk_change'
    threshold_value DECIMAL(10,2),
    is_active BOOLEAN DEFAULT TRUE,
    last_triggered TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT NOW()
);

-- =============================================================================
-- 10. LOGS D'EXTRACTION PDF (traçabilité)
-- =============================================================================
CREATE TABLE extraction_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    fund_id UUID REFERENCES funds(id),
    
    document_name VARCHAR(500),
    document_type VARCHAR(100),              -- 'rapport_annuel', 'bulletin_trimestriel', etc.
    document_year INTEGER,
    
    extraction_status VARCHAR(50),           -- 'success', 'partial', 'failed'
    extraction_method VARCHAR(100),          -- 'claude_api', 'tabula', 'manual'
    fields_extracted TEXT[],                 -- Liste des champs extraits
    confidence_score DECIMAL(5,2),           -- Score de confiance extraction
    error_message TEXT,
    
    processed_at TIMESTAMP DEFAULT NOW()
);

-- =============================================================================
-- 11. VUES UTILES
-- =============================================================================

-- Vue synthèse fonds avec société de gestion
CREATE VIEW v_funds_summary AS
SELECT 
    f.id,
    f.name AS fund_name,
    f.fund_type,
    f.category,
    f.capital_type,
    mc.name AS management_company,
    f.share_price,
    f.distribution_rate,
    f.occupancy_rate,
    f.market_capitalization,
    f.debt_ratio,
    f.report_a_nouveau,
    f.esg_label,
    f.is_active,
    f.last_data_update,
    (SELECT COUNT(*) FROM assets a WHERE a.fund_id = f.id) AS nb_assets,
    (SELECT COALESCE(SUM(a.current_valuation), 0) FROM assets a WHERE a.fund_id = f.id) AS total_patrimony_value
FROM funds f
LEFT JOIN management_companies mc ON f.management_company_id = mc.id
WHERE f.is_active = TRUE;

-- Vue actifs géolocalisés pour la carte
CREATE VIEW v_assets_map AS
SELECT 
    a.id,
    a.fund_id,
    f.name AS fund_name,
    f.fund_type,
    a.name AS asset_name,
    a.address,
    a.city,
    a.country,
    a.latitude,
    a.longitude,
    a.asset_type,
    a.surface_sqm,
    a.current_valuation,
    a.annual_rent,
    a.occupancy_rate,
    a.main_tenant,
    a.energy_label
FROM assets a
JOIN funds f ON a.fund_id = f.id
WHERE a.latitude IS NOT NULL AND a.longitude IS NOT NULL;

-- =============================================================================
-- 12. DONNÉES DE DÉMONSTRATION
-- =============================================================================

-- Quelques sociétés de gestion majeures
INSERT INTO management_companies (name, short_name, website) VALUES
    ('Amundi Immobilier', 'Amundi', 'https://www.amundi-immobilier.com'),
    ('Primonial REIM', 'Primonial', 'https://www.primonialreim.com'),
    ('La Française REM', 'La Française', 'https://www.la-francaise.com'),
    ('Corum Asset Management', 'Corum', 'https://www.corum.fr'),
    ('Paref Gestion', 'Paref', 'https://www.paref-gestion.com'),
    ('Sofidy', 'Sofidy', 'https://www.sofidy.com'),
    ('Perial Asset Management', 'Perial', 'https://www.perial.com'),
    ('Swiss Life Asset Managers France', 'Swiss Life AM', 'https://www.swisslife-am.com'),
    ('Atland Voisin', 'Atland Voisin', 'https://www.atland-voisin.com'),
    ('Arkéa REIM', 'Arkéa', 'https://www.arkea-reim.com');

-- Quelques fonds SCPI de référence (données illustratives)
INSERT INTO funds (name, isin, fund_type, category, capital_type, management_company_id, creation_date, share_price, distribution_rate, occupancy_rate, market_capitalization, debt_ratio, subscription_fee_rate, management_fee_rate, esg_label, minimum_subscription)
VALUES
    ('Primovie', NULL, 'SCPI', 'sante', 'variable',
     (SELECT id FROM management_companies WHERE short_name = 'Primonial'),
     '2012-07-13', 203.00, 4.21, 95.2, 4200000000, 18.5, 9.24, 0.96, TRUE, 203.00),
    
    ('Épargne Pierre', NULL, 'SCPI', 'diversifiee', 'variable',
     (SELECT id FROM management_companies WHERE short_name = 'Atland Voisin'),
     '2013-12-01', 208.00, 5.28, 93.8, 3100000000, 12.3, 9.00, 0.95, TRUE, 208.00),
    
    ('Corum Origin', NULL, 'SCPI', 'diversifiee', 'variable',
     (SELECT id FROM management_companies WHERE short_name = 'Corum'),
     '2012-03-20', 1135.00, 6.06, 96.8, 2800000000, 5.2, 11.96, 1.20, FALSE, 1135.00),
    
    ('PFO2', NULL, 'SCPI', 'bureaux', 'variable',
     (SELECT id FROM management_companies WHERE short_name = 'Perial'),
     '2009-06-15', 196.00, 4.10, 92.1, 2500000000, 22.1, 9.00, 0.96, TRUE, 196.00),
    
    ('Immorente', NULL, 'SCPI', 'commerces', 'variable',
     (SELECT id FROM management_companies WHERE short_name = 'Sofidy'),
     '1988-01-01', 340.00, 5.00, 95.5, 3800000000, 10.8, 9.60, 0.84, FALSE, 340.00);

-- Données de marché illustratives
INSERT INTO market_data (segment, geography, year, quarter, cap_rate, prime_rent, vacancy_rate, source)
VALUES
    ('bureaux_prime', 'Paris QCA', 2024, 4, 3.50, 950, 3.2, 'JLL'),
    ('bureaux_prime', 'La Défense', 2024, 4, 4.75, 580, 12.5, 'JLL'),
    ('bureaux_secondaire', 'Ile-de-France', 2024, 4, 5.50, 320, 8.7, 'CBRE'),
    ('commerces_high_street', 'Paris', 2024, 4, 3.25, 15000, 4.1, 'CBRE'),
    ('logistique', 'Ile-de-France', 2024, 4, 4.80, 72, 2.8, 'JLL'),
    ('sante', 'France', 2024, 4, 5.00, 180, 3.5, 'BNP RE'),
    ('residentiel', 'Paris', 2024, 4, 3.00, 420, 2.1, 'CBRE'),
    ('bureaux_prime', 'Lyon Part-Dieu', 2024, 4, 4.25, 330, 5.8, 'JLL'),
    ('bureaux_prime', 'Marseille Euroméditerranée', 2024, 4, 5.25, 260, 7.2, 'JLL');

RAISE NOTICE '✅ Base de données CGP Immo Analytics initialisée avec succès';
