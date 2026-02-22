# CGP Immo Analytics — Documentation Globale

## Vue d'ensemble

Plateforme d'aide a la decision pour Conseillers en Gestion de Patrimoine (CGP) specialisee dans l'analyse de fonds immobiliers (SCPI, OPCI, SCI).

**Stack technique** : Next.js 14 (App Router) + TypeScript + Tailwind CSS + Recharts + Leaflet

---

## Architecture des pages

| Route | Fichier | Description |
|---|---|---|
| `/` | `src/app/page.tsx` | Landing page — Hero, bento grid des 10 fonctionnalites, showcase Score Alpha, pricing |
| `/funds` | `src/app/funds/page.tsx` | Catalogue des SCPI avec Score Alpha, filtres, tri, fiches detaillees |
| `/simulateur` | `src/app/simulateur/page.tsx` | Double onglet : Simulateur de Revenus Mensuel + Simulateur TRI (5/10/20 ans) |
| `/comparateur` | `src/app/comparateur/page.tsx` | Comparateur radar/spider chart (2-4 SCPI en overlay) |
| `/alternatives` | `src/app/alternatives/page.tsx` | SCPI vs ETF Immobilier vs Fonds Euros vs Locatif Direct |
| `/carte` | `src/app/carte/page.tsx` | Carte interactive Leaflet des immeubles par SCPI |
| `/portefeuille` | `src/app/portefeuille/page.tsx` | Tracker multi-SCPI avec allocation, rendement agrege, alertes |
| `/alertes` | `src/app/alertes/page.tsx` | Configuration des alertes prix/dividende/TOF/score |
| `/communaute` | `src/app/communaute/page.tsx` | Avis communautaires verifies (type Trustpilot pour SCPI) |
| `/recommandation` | `src/app/recommandation/page.tsx` | Wizard IA de recommandation personnalisee |

---

## Composants partages

| Fichier | Description |
|---|---|
| `src/components/AppShell.tsx` | Shell de navigation (sidebar + topbar) qui enveloppe toutes les pages |
| `src/lib/data.ts` | Couche de donnees centrale — 12 SCPI, Score Alpha, calculs fiscaux, IRR |

---

## Sources et dependances a installer

### Dependances NPM (deja dans package.json)

```bash
npm install
```

Les dependances incluses :

| Package | Version | Usage |
|---|---|---|
| `next` | ^14.2.21 | Framework React SSR/SSG |
| `react` | ^18.3.1 | Bibliotheque UI |
| `react-dom` | ^18.3.1 | Rendu DOM React |
| `leaflet` | ^1.9.4 | Cartes interactives (page Carte) |
| `react-leaflet` | ^4.2.1 | Binding React pour Leaflet |
| `recharts` | ^2.14.1 | Graphiques (barres, lignes, aires) |
| `lucide-react` | ^0.468.0 | Icones SVG |
| `@tanstack/react-query` | ^5.62.8 | Gestion de cache/fetching |
| `axios` | ^1.7.9 | Client HTTP |
| `clsx` | ^2.1.1 | Gestion conditionnelle de classes CSS |
| `tailwind-merge` | ^2.6.0 | Merge intelligent de classes Tailwind |

### Dependances de developpement

| Package | Version | Usage |
|---|---|---|
| `@types/leaflet` | ^1.9.14 | Types TypeScript pour Leaflet |
| `@types/node` | ^22.10.2 | Types Node.js |
| `@types/react` | ^19.0.2 | Types React |
| `autoprefixer` | ^10.4.20 | PostCSS autoprefixer |
| `postcss` | ^8.4.49 | Outil de transformation CSS |
| `tailwindcss` | ^3.4.17 | Framework CSS utilitaire |
| `typescript` | ^5.7.2 | Superset type de JavaScript |

### Ressources externes (CDN / Google Fonts)

Importees dans `globals.css` :

```
Google Fonts:
  - Inter (400, 500, 600, 700) — Police principale
  - JetBrains Mono (500, 600) — Police pour les chiffres financiers
```

URL : `https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@500;600&display=swap`

### Assets Leaflet (tuiles cartographiques)

La page `/carte` utilise les tuiles OpenStreetMap via CartoDB Dark Matter :

```
https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png
```

Aucune cle API requise. Attribution : OpenStreetMap contributors & CARTO.

---

## Styles globaux

Fichier : `src/app/globals.css`

### Variables CSS custom

```css
--bg: #0B1120           /* Fond principal */
--bg-surface: #131825   /* Fond des cartes */
--accent: #2563EB       /* Bleu accent */
--success: #10B981      /* Vert positif */
--danger: #EF4444       /* Rouge negatif */
--gold: #C9A84C         /* Or (premium) */
--compliance: #6366F1   /* Indigo (compliance) */
```

### Classes utilitaires incluses

- `.glass-card` — Carte avec backdrop-filter et bordure transparente
- `.font-tabular` — JetBrains Mono pour chiffres alignes
- `.btn-primary` / `.btn-ghost` — Boutons stylises
- `.score-pill` + `.score-excellent/good/average/poor` — Badges de score
- `.sim-input` / `.sim-select` / `.sim-slider` — Inputs du simulateur
- `.fund-table` — Tableau de donnees financieres
- `.shimmer-badge` — Badge avec animation shimmer
- `.reveal` / `.reveal.visible` — Animation de scroll reveal
- `.dot-grid` — Fond en grille de points
- `.hero-glow` — Halo radial du hero

---

## Modele de donnees (src/lib/data.ts)

### Type SCPI

```typescript
interface SCPI {
  id: string
  nom: string
  gerant: string
  capitalisation: number       // en millions EUR
  prixPart: number
  rendement: number            // ex: 5.2 pour 5.2%
  rendement5ans: number
  tdvm: number                 // Taux de Distribution sur Valeur de Marche
  tri5: number                 // TRI 5 ans
  tri10: number                // TRI 10 ans
  tof: number                  // Taux d'Occupation Financiere
  fraisEntree: number          // ex: 8.5 pour 8.5%
  fraisGestion: number
  delaiJouissance: number      // en mois
  secteurs: { nom: string; pct: number }[]
  geographies: { zone: string; pct: number }[]
  immeubles: { nom: string; ville: string; lat: number; lng: number; surface: number }[]
  avis: { auteur: string; note: number; texte: string; date: string }[]
  esg: boolean
  anneeCreation: number
  revenusEtrangers: number     // % de revenus d'origine etrangere
  scoreAlpha?: number          // Score composite calcule
}
```

### Fonctions exportees

| Fonction | Description |
|---|---|
| `computeScoreAlpha(scpi)` | Calcule le score composite sur 100 (6 axes ponderes) |
| `calcRevenuNetMensuel(montant, rendement, fraisGestion, tmi, prevSociales, revenusEtrangers)` | Revenu net mensuel apres impots |
| `computeIRR(cashflows)` | TRI par Newton-Raphson + fallback bisection |
| `getSCPIById(id)` | Recupere une SCPI par ID |
| `getSCPIsSorted(key, direction)` | Tri des SCPI par cle |
| `TMI_TRANCHES` | Tranches d'imposition sur le revenu |
| `PRELEVEMENTS_SOCIAUX` | Taux de prelevements sociaux (17.2%) |
| `ALTERNATIVES` | Donnees comparatives ETF/Fonds Euros/Locatif |

### Score Alpha — Ponderation

| Axe | Poids | Meilleur scenario |
|---|---|---|
| Rendement | 25% | > 6% |
| Risque (TOF) | 20% | > 95% |
| Frais | 15% | < 3% entree |
| Liquidite | 15% | Capitalisation > 3Md EUR |
| Diversification | 15% | > 5 secteurs + > 5 zones |
| ESG | 10% | Label ISR / ESG |

---

## Lancement du projet

```bash
cd cgp-immo-analytics/frontend
npm install
npm run dev
```

Le site sera accessible sur `http://localhost:3000`.

---

## 10 fonctionnalites implementees

1. **Simulateur de revenus mensuel** — Projection nette apres TMI, prelevements sociaux, convention fiscale etrangere
2. **Score Alpha SCPI** — Score composite proprietaire sur 6 axes (rendement, risque, frais, liquidite, diversification, ESG)
3. **Alertes prix/rendement** — Configuration d'alertes par SCPI avec seuils personnalises et historique
4. **Comparateur radar** — Spider chart pour overlay de 2 a 4 SCPI sur 6 metriques
5. **SCPI vs Alternatives** — Comparaison detaillee vs ETF Immobilier, Fonds Euros, Locatif Direct
6. **Carte interactive** — Visualisation Leaflet de tous les immeubles par SCPI (filtre, cluster)
7. **Portefeuille multi-SCPI** — Tracker avec allocation, rendement pondere, alertes de rebalancing
8. **Donnees ASPIM** — Architecture prete pour integration API ASPIM (donnees mock actuellement)
9. **Avis communautaires** — Systeme de notation/commentaire verifie par SCPI
10. **Recommandation IA** — Wizard en 5 etapes avec scoring personnalise et profil investisseur
