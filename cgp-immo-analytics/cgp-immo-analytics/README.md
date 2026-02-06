# CGP Immo Analytics

Plateforme d'analyse de fonds immobiliers retail français (SCPI, OPCI, SCI) pour les Conseillers en Gestion de Patrimoine.

## Stack technique

- **Backend** : FastAPI + SQLAlchemy + PostgreSQL/PostGIS
- **Frontend** : Next.js 14 + Tailwind CSS + Leaflet + Recharts
- **Infrastructure** : Docker Compose + Nginx + OVH VPS

## Démarrage rapide

```bash
# 1. Setup VPS (première fois uniquement)
chmod +x scripts/setup-vps.sh
sudo ./scripts/setup-vps.sh

# 2. Configuration
cp .env.example .env
nano .env  # Éditer avec tes valeurs

# 3. Lancement
docker compose up -d

# 4. Vérification
curl http://localhost/health
```

## Accès
- Frontend : http://localhost
- API Docs : http://localhost/docs
- Health : http://localhost/health
