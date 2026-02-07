# CLAUDE.md

This file provides guidance to Claude Code when working in this repository.

## Project Overview

CGP Immo Analytics — plateforme d'analyse SCPI pour conseillers en gestion de patrimoine.

## Repository Structure

- `cgp-immo-analytics/` — Application principale (FastAPI + Next.js + PostgreSQL + Docker)
- `input/` — Rapports annuels SCPI (PDF sources, 10 fichiers)
- `docs/` — Documentation, rapport d'audit BCG, screenshots
- `scripts/` — Scripts Python utilitaires (audit PDF, preview)
- `archives/` — Sauvegardes ZIP

## Key Files

- `cgp-immo-analytics/frontend/src/lib/data.ts` — Toutes les donnees SCPI (21 fonds), interfaces, Score Alpha, checks coherence
- `cgp-immo-analytics/frontend/src/app/funds/page.tsx` — Page catalogue fonds avec bilans/CDR
- `cgp-immo-analytics/backend/app/` — API FastAPI (auth, funds, assets, market)
- `docs/audit/rapport-audit-bcg.pdf` — Rapport d'audit complet

## Development Guidelines

- Keep changes minimal and focused on the task at hand.
- Avoid introducing unnecessary abstractions or over-engineering.
- Write clear commit messages that explain *why*, not just *what*.
