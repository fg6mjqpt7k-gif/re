# CGP Immo Analytics

Plateforme d'analyse SCPI/OPCI/SCI pour conseillers en gestion de patrimoine (CGP).

## Structure du projet

```
re/
├── cgp-immo-analytics/       # Application principale
│   ├── backend/              # API FastAPI + PostgreSQL
│   ├── frontend/             # Next.js 14 + React + Tailwind
│   ├── nginx/                # Reverse proxy
│   ├── data/seed/            # Schema BDD
│   └── docker-compose.yml
├── input/                    # Rapports annuels SCPI (PDF sources)
├── docs/                     # Documentation
│   ├── audit/                # Rapport audit BCG + exports
│   ├── screenshots/          # Captures d'ecran
│   ├── nomenclature-rapport-annuel-scpi.md
│   └── vps-setup.md
├── scripts/                  # Scripts utilitaires
│   ├── generate_audit_report.py
│   └── generate_preview.py
└── archives/                 # Sauvegardes ZIP
```

## Stack technique

- **Frontend** : Next.js 14, React 18, TypeScript, Tailwind CSS
- **Backend** : FastAPI, SQLAlchemy, PostgreSQL + PostGIS
- **Infra** : Docker Compose, Nginx

## Donnees

21 SCPI integrees avec bilans, comptes de resultat, et controles de coherence automatises (12 checks/fonds).

## Audit

Le rapport d'audit BCG est disponible dans `docs/audit/rapport-audit-bcg.pdf`.
