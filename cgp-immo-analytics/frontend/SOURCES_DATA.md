# Guide Complet : Obtenir Toutes les Donnees du Site

Ce document detaille **chaque donnee utilisee par la plateforme**, ou la trouver, et comment l'obtenir en production.

---

## Table des matieres

1. [Vue d'ensemble des donnees](#1-vue-densemble-des-donnees)
2. [Sources principales](#2-sources-principales)
3. [Donnees par champ — Detail complet](#3-donnees-par-champ--detail-complet)
4. [APIs et flux automatisables](#4-apis-et-flux-automatisables)
5. [Donnees calculees en interne](#5-donnees-calculees-en-interne)
6. [Frequence de mise a jour](#6-frequence-de-mise-a-jour)
7. [Plan d'integration technique](#7-plan-dintegration-technique)

---

## 1. Vue d'ensemble des donnees

La plateforme utilise **5 categories** de donnees :

| Categorie | Nombre de champs | Source principale |
|---|---|---|
| Identification SCPI | 8 champs | ASPIM / AMF |
| Prix et valorisation | 3 champs | Societes de gestion / ASPIM |
| Performance | 4 champs | Rapports annuels / ASPIM |
| Frais et metriques | 10 champs | DIC (PRIIPS) / Rapports annuels |
| Repartitions et patrimoine | 4 blocs | Bulletins trimestriels |
| Historique | serie temporelle | Rapports annuels N-1 a N-10 |
| Immeubles (carte) | 7 champs/immeuble | Rapports annuels + geocoding |
| Avis communautaires | 5 champs/avis | Donnees utilisateur (UGC) |
| Fiscalite | 2 champs | IFU annuel / Rapports de gestion |
| Alternatives (ETF, etc.) | 9 champs | Morningstar / quantalys / AMF |

---

## 2. Sources principales

### 2.1 ASPIM (Association francaise des Societes de Placement Immobilier)

- **Site** : https://www.aspim.fr
- **Donnees disponibles** : Statistiques marche, collecte, TD moyen, nombre d'associes
- **Acces** : Statistiques publiques gratuites + API payante pour membres
- **Format** : PDF trimestriels publics, fichiers Excel pour membres
- **Contact API** : contact@aspim.fr — demander l'acces au "flux de donnees SCPI"

**Donnees obtenues :**
- Capitalisation de chaque SCPI
- Collecte nette trimestrielle
- Nombre d'associes
- TD (Taux de Distribution) annuel
- Prix de part et evolution
- TRI 5 ans / 10 ans

### 2.2 Societes de gestion (sites individuels)

Chaque societe de gestion publie obligatoirement :

| Societe | URL | SCPI concernees |
|---|---|---|
| Corum AM | https://www.corum.fr | Corum Origin, Corum XL |
| Iroko | https://www.iroko.eu | Iroko Zen |
| Remake AM | https://www.remake-am.fr | Remake Live |
| Primonial REIM | https://www.primonialreim.com | Primovie |
| Atland Voisin | https://www.atland-voisin.com | Epargne Pierre |
| Arkea REIM | https://www.arkea-reim.com | Transitions Europe |
| Novaxia | https://www.novaxia-investissement.com | Novaxia Neo |
| Sofidy | https://www.sofidy.com | Immorente |
| Euryale AM | https://www.euryale-am.com | Pierval Sante |
| Perial AM | https://www.perial-am.com | PFO2 |
| Alderan | https://www.alderan.fr | ActivImmo |

**Documents a telecharger sur chaque site :**

1. **DIC / DICI** (Document d'Informations Cles) — obligatoire PRIIPS
   - Frais de souscription
   - Frais de gestion
   - Scenarii de performance
   - Risques

2. **Rapport annuel** (publie avant le 30 juin N+1)
   - TD et TDVM
   - TOF
   - Ratio d'endettement
   - Report a nouveau (RAN)
   - Provision pour Gros Reparation (PGR)
   - Repartition geographique detaillee
   - Repartition sectorielle
   - Liste des immeubles (adresses)
   - Nombre d'associes
   - Capitalisation
   - Collecte nette
   - Part des revenus etrangers
   - Part des plus-values

3. **Bulletin trimestriel** (T1, T2, T3, T4)
   - Prix de part actualise
   - Prix de retrait
   - Valeur de reconstitution
   - Dividende trimestriel
   - TOF actualise
   - Acquisitions/cessions recentes

4. **Note d'information** (visa AMF)
   - Statuts juridiques
   - Date de creation
   - Type de capital (variable/fixe)
   - Delai de jouissance
   - Categorie officielle

### 2.3 AMF (Autorite des Marches Financiers)

- **Site** : https://www.amf-france.org
- **Base GECO** : https://geco.amf-france.org
- **Recherche** : Taper le nom de la SCPI dans GECO pour obtenir :
  - Numero d'agrement
  - Societe de gestion agreee
  - Date de visa de la note d'information
  - Documents reglementaires (DIC, note d'information)
- **Format** : Consultation en ligne, PDF telechargeables

### 2.4 IEIF (Institut de l'Epargne Immobiliere et Fonciere)

- **Site** : https://www.ieif.fr
- **Donnees** : TRI 5 ans, TRI 10 ans, TRI 15 ans (reference du marche)
- **Acces** : Abonnement payant (~2000-5000 EUR/an selon formule)
- **Format** : Excel, API sur demande
- **Utilite** : Source de reference pour les TRI historiques et les benchmarks marche

### 2.5 Morningstar / Quantalys (pour les Alternatives)

- **Morningstar** : https://www.morningstar.fr — ETF data, fonds euros
- **Quantalys** : https://www.quantalys.com — Comparateur fonds, SCPI, AV
- **Donnees** : Rendement moyen ETF, frais, encours, performance historique
- **Acces** : API Morningstar payante, Quantalys gratuit (scraping) ou API pro

---

## 3. Donnees par champ — Detail complet

### 3.1 Identification

| Champ | Type | Ou le trouver | Document exact |
|---|---|---|---|
| `id` | string | Genere en interne | Slug du nom (ex: `corum-origin`) |
| `nom` | string | AMF GECO / ASPIM | Note d'information, page 1 |
| `societeGestion` | string | AMF GECO | Fiche GECO de la SCPI |
| `type` | 'SCPI' / 'OPCI' / 'SCI' | AMF GECO | Agrement AMF |
| `categorie` | string | ASPIM | Classification ASPIM (Diversifiee, Bureaux, Commerces, Sante, Logistique, etc.) |
| `capitalType` | 'variable' / 'fixe' | Note d'information | Statuts juridiques |
| `creationDate` | string | Note d'information | Page de garde |
| `anciennete` | number | Calcule | `annee_courante - annee_creation` |

### 3.2 Prix et valorisation

| Champ | Type | Ou le trouver | Document exact | Frequence |
|---|---|---|---|---|
| `prixPart` | EUR | Societe de gestion | Bulletin trimestriel, rubrique "Prix de souscription" | Trimestriel |
| `prixRetrait` | EUR | Societe de gestion | Bulletin trimestriel, rubrique "Prix de retrait" | Trimestriel |
| `valeurReconstitution` | EUR | Rapport annuel | Rubrique "Valeur de reconstitution au 31/12" | Annuel |

**Calcul du prix de retrait** : `prixRetrait = prixPart * (1 - fraisSouscription/100)`

**Ou exactement sur le site de la societe de gestion** :
- Corum : Espace "Nos SCPI" > Corum Origin > Onglet "Chiffres cles"
- Iroko : Page d'accueil > "Performances" > Tableau recapitulatif
- Etc. (chaque site a une page "Chiffres cles" ou "Performance")

### 3.3 Performance

| Champ | Type | Ou le trouver | Document exact |
|---|---|---|---|
| `td` | % | ASPIM / Rapport annuel | "Taux de Distribution" (nouvelle norme depuis 2022, remplace TDVM) |
| `tdN1` | % | ASPIM / Rapport annuel N-1 | TD de l'annee precedente |
| `tri5ans` | % | IEIF / ASPIM | Indice IEIF ou "TRI sur 5 ans" du rapport de gestion |
| `tri10ans` | % | IEIF / ASPIM | Indice IEIF ou "TRI sur 10 ans" du rapport de gestion |

**Attention** : Le TD a remplace le TDVM depuis le 01/01/2022.
- **TD** = Dividende brut annuel / Prix de part au 01/01 de l'annee
- **TDVM** (ancien) = Dividende brut / Prix moyen de l'annee

### 3.4 Frais

| Champ | Type | Ou le trouver | Document exact |
|---|---|---|---|
| `fraisSouscription` | % | DIC (PRIIPS) | Rubrique "Couts ponctuels" > "Couts d'entree" |
| `fraisGestion` | % | DIC (PRIIPS) | Rubrique "Couts recurrents" > "Frais de gestion" |

**Lien direct vers les DIC** :
- Chaque societe de gestion met le DIC en telechargement sur la fiche produit
- L'AMF les reference aussi dans GECO sous "Documents reglementaires"

### 3.5 Metriques operationnelles

| Champ | Type | Ou le trouver | Document exact |
|---|---|---|---|
| `tof` | % | Rapport annuel / Bulletin T4 | "Taux d'Occupation Financiere" — souvent dans le tableau de bord |
| `capitalisation` | EUR | ASPIM / Rapport annuel | "Capitalisation" ou "Actif net" |
| `collecteNette` | EUR | ASPIM / Rapport annuel | "Collecte nette de l'exercice" |
| `ratioEndettement` | % | Rapport annuel | "Ratio LTV" ou "Taux d'endettement" (dette / actifs bruts) |
| `reportANouveau` | jours | Rapport annuel | "Report a Nouveau" exprime en jours de dividende |
| `pgr` | % | Rapport annuel | "Provision pour Gros Reparation" en % des loyers |
| `nbAssocies` | nombre | ASPIM / Rapport annuel | "Nombre d'associes au 31/12" |
| `nbImmeubles` | nombre | Rapport annuel | "Nombre d'actifs en portefeuille" |
| `esg` | boolean | Societe de gestion | Presence du label ISR immobilier (delivre par l'AFNOR) |

### 3.6 Repartition geographique

| Champ | Source | Document |
|---|---|---|
| `repartitionGeo[].pays` | Rapport annuel | Section "Repartition geographique du patrimoine" (en % de la valeur venale) |
| `repartitionGeo[].pct` | Rapport annuel | Camembert / tableau de la repartition geographique |

**Ou exactement dans le rapport annuel** :
- Generalement pages 15-20 du rapport annuel
- Presente sous forme de camembert + tableau detaille
- Base de calcul : % en valeur venale (pas en surface)

### 3.7 Repartition sectorielle

| Champ | Source | Document |
|---|---|---|
| `repartitionSectorielle[].secteur` | Rapport annuel | Section "Repartition typologique" ou "par type d'actifs" |
| `repartitionSectorielle[].pct` | Rapport annuel | Camembert / tableau sectoriel |

**Categories standard ASPIM** :
- Bureaux
- Commerces
- Logistique / Locaux d'activite
- Sante
- Education
- Hotels / Tourisme
- Residentiel
- Autres

### 3.8 Historique annuel

| Champ | Source | Document |
|---|---|---|
| `historique[].annee` | Rapport annuel | Tableau recapitulatif sur 5-10 ans |
| `historique[].td` | Rapport annuel / ASPIM | Colonne "TD" ou "TDVM" (avant 2022) |
| `historique[].prixPart` | Rapport annuel | Colonne "Prix de souscription au 31/12" |
| `historique[].dividende` | Rapport annuel | Colonne "Dividende brut par part" ou calcul : `prixPart * td / 100` |

**Source la plus fiable** : Les rapports annuels incluent tous un tableau recapitulatif sur les 5 a 10 dernieres annees. C'est la source primaire.

**Source alternative** : L'IEIF publie un annuaire complet avec l'historique de toutes les SCPI (payant).

### 3.9 Immeubles (pour la carte interactive)

| Champ | Source | Comment l'obtenir |
|---|---|---|
| `immeubles[].nom` | Rapport annuel | Liste du patrimoine immobilier (annexe du rapport annuel) |
| `immeubles[].adresse` | Rapport annuel | Colonne "Adresse" dans la liste du patrimoine |
| `immeubles[].ville` | Rapport annuel | Extrait de l'adresse |
| `immeubles[].pays` | Rapport annuel | Extrait de l'adresse |
| `immeubles[].lat` | **Geocoding** | API Google Maps Geocoding ou OpenStreetMap Nominatim (gratuit) |
| `immeubles[].lng` | **Geocoding** | Idem — a partir de l'adresse |
| `immeubles[].type` | Rapport annuel | Colonne "Type d'actif" |
| `immeubles[].surface` | Rapport annuel | Colonne "Surface" (en m2) |
| `immeubles[].locataire` | Rapport annuel | Colonne "Locataire principal" (parfois anonymise) |
| `immeubles[].loyer` | Rapport annuel | Colonne "Loyer annuel" (parfois confidentiel, estimer via rendement moyen de la zone) |

**Processus de geocoding** :
1. Extraire les adresses du rapport annuel (PDF -> parsing ou manuel)
2. Appeler l'API Nominatim (gratuit, 1 req/sec) :
   ```
   GET https://nominatim.openstreetmap.org/search?q=42+Rue+Oberkampf+Paris&format=json
   ```
3. Recuperer `lat` et `lon` de la reponse
4. Stocker en base

**Alternative Google** :
```
GET https://maps.googleapis.com/maps/api/geocode/json?address=42+Rue+Oberkampf+Paris&key=VOTRE_CLE
```
(Facturation : 5 USD / 1000 requetes)

### 3.10 Fiscalite

| Champ | Source | Document |
|---|---|---|
| `partRevenusEtrangers` | IFU / Rapport annuel | "Part des revenus de source etrangere" — souvent dans la section fiscalite du rapport |
| `partPlusValues` | IFU / Rapport annuel | "Part des plus-values distribuees" — section fiscalite |

**IFU** (Imprime Fiscal Unique) : Document annuel envoye aux associes, detaille la ventilation fiscale. Les societes de gestion le publient avant le 28/02 de chaque annee.

**Constantes fiscales** (codees en dur dans `data.ts`) :

| Donnee | Valeur 2024 | Source |
|---|---|---|
| TMI tranche 1 | 0% jusqu'a 11 294 EUR | Code General des Impots, art. 197 |
| TMI tranche 2 | 11% de 11 294 a 28 797 EUR | CGI art. 197 |
| TMI tranche 3 | 30% de 28 797 a 82 341 EUR | CGI art. 197 |
| TMI tranche 4 | 41% de 82 341 a 177 106 EUR | CGI art. 197 |
| TMI tranche 5 | 45% au-dela de 177 106 EUR | CGI art. 197 |
| Prelevements sociaux | 17.2% | CSG 9.2% + CRDS 0.5% + PS 7.5% |

**Mise a jour** : Les tranches TMI sont revalorisees chaque annee dans la Loi de Finances (publiee au JO en decembre). Consulter : https://www.legifrance.gouv.fr

### 3.11 Donnees alternatives (ETF, fonds euros, locatif)

| Champ | Source pour ETF | Source pour Fonds Euros | Source pour Locatif |
|---|---|---|---|
| `rendementMoyen` | Morningstar / justETF | FFA (France Assureurs) | Observatoire Clameur / SeLoger |
| `fraisEntree` | DIC du fonds | Conditions generales contrat AV | Frais d'agence + notaire (~8%) |
| `fraisGestion` | DIC du fonds | Conditions generales contrat AV | N/A (gestion directe) |
| `fiscalite` | Code fiscal | Code fiscal AV (art. 125-0A CGI) | Code fiscal (revenus fonciers) |
| `liquidite` | Carnet d'ordres Euronext | Conditions de rachat assureur | Delai moyen de vente |
| `risque` | Volatilite historique (Morningstar) | Garantie en capital (assureur) | Indices vacance locative |
| `ticketMin` | Cours de l'ETF | Minimum contrat AV | Prix m2 local (MeilleursAgents) |

**Sources specifiques** :
- **justETF** : https://www.justetf.com/fr — Donnees ETF immobilier Europe (EPRA, etc.)
- **France Assureurs** : https://www.franceassureurs.fr — Rendement moyen fonds euros annuel
- **Observatoire Clameur** : https://www.clameur.fr — Rendements locatifs par ville
- **MeilleursAgents** : https://www.meilleursagents.com — Prix m2 par ville
- **SeLoger** : https://www.seloger.com — Prix et rendements locatifs

---

## 4. APIs et flux automatisables

### 4.1 API ASPIM (recommande pour production)

```
Endpoint : sur demande aupres d'ASPIM
Authentification : API Key (membre adherent)
Format : JSON
Frequence : Donnees mises a jour trimestriellement
```

**Donnees accessibles via API** :
- TD de toutes les SCPI du marche
- Prix de part, prix de retrait
- Capitalisation, collecte nette
- Nombre d'associes
- TRI 5/10 ans (source IEIF)

**Comment obtenir l'acces** :
1. Contacter ASPIM : contact@aspim.fr
2. Demander le statut "membre associe" ou "partenaire data"
3. Cout : variable selon usage (gratuit pour membres, payant pour partenaires)

### 4.2 API Nominatim (geocoding gratuit)

```
Base URL : https://nominatim.openstreetmap.org
Rate limit : 1 requete/seconde
Authentification : Aucune (mais User-Agent obligatoire)
Format : JSON
```

**Exemple** :
```bash
curl "https://nominatim.openstreetmap.org/search?q=40+Bd+Haussmann+Paris&format=json&limit=1" \
  -H "User-Agent: CGPImmoAnalytics/1.0"
```

**Reponse** :
```json
[{
  "lat": "48.8740",
  "lon": "2.3325",
  "display_name": "40, Boulevard Haussmann, 9e Arrondissement, Paris..."
}]
```

### 4.3 API Google Geocoding (alternative payante)

```
Base URL : https://maps.googleapis.com/maps/api/geocode/json
Authentification : API Key (Google Cloud Console)
Cout : 5 USD / 1000 requetes
Format : JSON
```

### 4.4 Morningstar API (alternatives)

```
Base URL : https://api.morningstar.com
Authentification : API Key (compte developpeur)
Cout : Payant (devis sur demande)
Donnees : Performance ETF, fonds, encours, frais
```

**Alternative gratuite** : Scraping de https://www.morningstar.fr (attention aux CGU).

### 4.5 Web scraping des societes de gestion

Pour automatiser la collecte depuis les sites des societes de gestion :

```python
# Exemple avec Python + BeautifulSoup
import requests
from bs4 import BeautifulSoup

# Chaque societe a une structure HTML differente
# Il faut creer un scraper par societe

# Exemple : page chiffres cles Corum Origin
url = "https://www.corum.fr/corum-origin"
resp = requests.get(url, headers={"User-Agent": "Mozilla/5.0"})
soup = BeautifulSoup(resp.text, 'html.parser')

# Extraire le TD, prix de part, etc.
# (selecteurs CSS specifiques a chaque site)
```

**Recommandation** : Privilegier l'API ASPIM plutot que le scraping (plus fiable, legal).

---

## 5. Donnees calculees en interne

Ces donnees ne sont pas a sourcer exterieurement, elles sont calculees par le code :

| Donnee calculee | Formule | Fichier |
|---|---|---|
| Score Alpha | Composite 6 axes ponderes (voir `computeScoreAlpha()`) | `data.ts:112` |
| Score Detail (6 axes) | Sous-scores rendement, risque, frais, liquidite, diversification, ESG | `data.ts:113-165` |
| Revenu net mensuel | Brut - IR - PS, avec conventions fiscales etrangeres | `data.ts:876-905` |
| TRI simule | Newton-Raphson sur flux de tresorerie | `data.ts:911-926` |
| Anciennete | `annee_courante - annee_creation` | Calcul simple |
| Prix de retrait | `prixPart * (1 - fraisSouscription/100)` | Fourni directement ou calcule |
| Dividende | `prixPart * td / 100` | Historique ou calcul |

---

## 6. Frequence de mise a jour

| Donnee | Frequence | Moment de publication |
|---|---|---|
| Prix de part / retrait | Trimestriel | Fin T+1 (ex: donnees T1 publiees en avril) |
| TD annuel | Annuel | Janvier-fevrier N+1 |
| TRI 5/10 ans | Annuel | Publication IEIF en mars N+1 |
| TOF | Trimestriel | Dans le bulletin trimestriel |
| Capitalisation | Trimestriel | Bulletin trimestriel |
| Collecte nette | Trimestriel | ASPIM publie les stats marche |
| Ratio endettement | Annuel | Rapport annuel (juin N+1 au plus tard) |
| RAN / PGR | Annuel | Rapport annuel |
| Repartition geo/sectorielle | Annuel | Rapport annuel |
| Liste immeubles | Annuel | Rapport annuel (annexe patrimoniale) |
| Fiscalite (IFU) | Annuel | Fevrier N+1 |
| Tranches TMI | Annuel | Loi de Finances (decembre N-1) |

---

## 7. Plan d'integration technique

### Phase 1 — Donnees statiques (immediat)

1. **Telecharger** les rapports annuels 2024 des 12 SCPI listees
2. **Extraire manuellement** dans un fichier JSON/CSV :
   - Prix, TD, frais, TOF, capitalisation, collecte, endettement, RAN, PGR
   - Repartitions geo et sectorielles
   - Liste des immeubles avec adresses
3. **Geocoder** les adresses via Nominatim
4. **Importer** dans `data.ts` ou dans une base PostgreSQL

### Phase 2 — Semi-automatisation (1-2 mois)

1. **Parser les PDF** des rapports annuels avec un outil comme :
   - `pdfplumber` (Python) pour extraire les tableaux
   - `tabula-py` pour les tableaux structures
   - LLM (Claude API) pour extraire des donnees non structurees
2. **Creer des scrapers** pour les pages "chiffres cles" de chaque societe de gestion
3. **Stocker** en base PostgreSQL avec historisation

### Phase 3 — API temps reel (3-6 mois)

1. **Obtenir l'acces** API ASPIM
2. **Creer un service backend** (FastAPI) qui :
   - Interroge l'API ASPIM trimestriellement
   - Met a jour la base PostgreSQL
   - Expose une API REST pour le frontend
3. **Integrer** le geocoding automatique pour les nouveaux immeubles
4. **Ajouter** les flux Morningstar/justETF pour les alternatives

### Phase 4 — Donnees utilisateur (communaute)

1. **Ajouter** un systeme d'authentification (NextAuth.js)
2. **Creer** les tables PostgreSQL pour les avis utilisateurs
3. **Implementer** la moderation et la verification des detenteurs
4. **Connecter** le module communaute au backend

---

## Recapitulatif des sites a consulter

| Site | URL | Donnees |
|---|---|---|
| ASPIM | https://www.aspim.fr | Stats marche, TD, collecte, TRI |
| AMF GECO | https://geco.amf-france.org | Agrements, notes d'information, DIC |
| IEIF | https://www.ieif.fr | TRI historiques, benchmarks (payant) |
| Legifrance | https://www.legifrance.gouv.fr | Tranches TMI, legislation fiscale |
| Nominatim OSM | https://nominatim.openstreetmap.org | Geocoding gratuit |
| Morningstar FR | https://www.morningstar.fr | Performance ETF, fonds |
| justETF | https://www.justetf.com/fr | ETF immobilier Europe |
| France Assureurs | https://www.franceassureurs.fr | Rendement fonds euros |
| Quantalys | https://www.quantalys.com | Comparateur multi-supports |
| MeilleursAgents | https://www.meilleursagents.com | Prix m2, rendements locatifs |
| Corum | https://www.corum.fr | Corum Origin, Corum XL |
| Iroko | https://www.iroko.eu | Iroko Zen |
| Remake AM | https://www.remake-am.fr | Remake Live |
| Primonial REIM | https://www.primonialreim.com | Primovie |
| Atland Voisin | https://www.atland-voisin.com | Epargne Pierre |
| Arkea REIM | https://www.arkea-reim.com | Transitions Europe |
| Novaxia | https://www.novaxia-investissement.com | Novaxia Neo |
| Sofidy | https://www.sofidy.com | Immorente |
| Euryale AM | https://www.euryale-am.com | Pierval Sante |
| Perial AM | https://www.perial-am.com | PFO2 |
| Alderan | https://www.alderan.fr | ActivImmo |
