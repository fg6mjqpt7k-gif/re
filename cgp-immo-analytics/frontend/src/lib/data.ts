/**
 * Donnees SCPI completes pour toute la plateforme.
 * Mock data enrichi — a remplacer par API ASPIM en production.
 */

// ============================================================
// TYPES
// ============================================================

export interface SCPIImmeuble {
  nom: string
  adresse: string
  ville: string
  pays: string
  lat: number
  lng: number
  type: string
  surface: number
  locataire: string
  loyer: number
}

export interface SCPIAvis {
  auteur: string
  date: string
  note: number
  commentaire: string
  verifie: boolean
  detenteurDepuis?: string
}

export interface ScoreAlphaDetail {
  rendement: number
  risque: number
  frais: number
  liquidite: number
  diversification: number
  esg: number
}

export interface SCPIHistorique {
  annee: number
  td: number
  prixPart: number
  dividende: number
}

export interface SCPI {
  id: string
  nom: string
  societeGestion: string
  type: 'SCPI' | 'OPCI' | 'SCI'
  categorie: string
  capitalType: 'variable' | 'fixe'
  creationDate: string
  anciennete: number

  // Prix
  prixPart: number
  prixRetrait: number
  valeurReconstitution: number

  // Performance
  td: number
  tdN1: number
  tri5ans: number
  tri10ans: number

  // Frais
  fraisSouscription: number
  fraisGestion: number

  // Metriques
  tof: number
  capitalisation: number
  collecteNette: number
  ratioEndettement: number
  reportANouveau: number
  pgr: number
  nbAssocies: number
  nbImmeubles: number

  // Qualite
  esg: boolean

  // Repartitions
  repartitionGeo: { pays: string; pct: number }[]
  repartitionSectorielle: { secteur: string; pct: number }[]

  // Score Alpha
  scoreAlpha: number
  scoreDetails: ScoreAlphaDetail

  // Historique
  historique: SCPIHistorique[]

  // Immeubles
  immeubles: SCPIImmeuble[]

  // Avis
  avis: SCPIAvis[]

  // Fiscalite
  partRevenusEtrangers: number // % des revenus soumis a convention fiscale
  partPlusValues: number // % des revenus en plus-values
}

// ============================================================
// SCORING ALGORITHM — Score Alpha SCPI
// ============================================================

export function computeScoreAlpha(scpi: Omit<SCPI, 'scoreAlpha' | 'scoreDetails'>): { scoreAlpha: number; scoreDetails: ScoreAlphaDetail } {
  // Rendement (0-100) — TD pondere par anciennete
  const rendement = Math.min(100, Math.max(0,
    (scpi.td / 8) * 70 + (scpi.tri5ans > 0 ? (scpi.tri5ans / 10) * 30 : 0)
  ))

  // Risque (0-100, 100 = faible risque = bon)
  const tofScore = Math.min(100, (scpi.tof / 100) * 100)
  const detteScore = Math.max(0, 100 - scpi.ratioEndettement * 2.5)
  const ancienneteScore = Math.min(100, scpi.anciennete * 4)
  const risque = tofScore * 0.4 + detteScore * 0.35 + ancienneteScore * 0.25

  // Frais (0-100, 100 = frais faibles = bon)
  const fraisSouscScore = Math.max(0, 100 - scpi.fraisSouscription * 8)
  const fraisGestionScore = Math.max(0, 100 - scpi.fraisGestion * 60)
  const frais = fraisSouscScore * 0.6 + fraisGestionScore * 0.4

  // Liquidite (0-100)
  const capiScore = Math.min(100, (scpi.capitalisation / 5e9) * 50)
  const collecteScore = scpi.collecteNette > 0 ? Math.min(100, (scpi.collecteNette / 500e6) * 50) : 0
  const associesScore = Math.min(100, (scpi.nbAssocies / 50000) * 50)
  const liquidite = capiScore * 0.4 + collecteScore * 0.3 + associesScore * 0.3

  // Diversification (0-100)
  const nbPays = scpi.repartitionGeo.length
  const nbSecteurs = scpi.repartitionSectorielle.length
  const herfindahlGeo = scpi.repartitionGeo.reduce((s, g) => s + (g.pct / 100) ** 2, 0)
  const diversification = Math.min(100,
    (1 - herfindahlGeo) * 50 + Math.min(50, nbPays * 8 + nbSecteurs * 6)
  )

  // ESG (0-100)
  const esgScore = scpi.esg ? 80 : 20

  const scoreAlpha = Math.round(
    rendement * 0.25 +
    risque * 0.20 +
    frais * 0.15 +
    liquidite * 0.15 +
    diversification * 0.15 +
    esgScore * 0.10
  )

  return {
    scoreAlpha,
    scoreDetails: {
      rendement: Math.round(rendement),
      risque: Math.round(risque),
      frais: Math.round(frais),
      liquidite: Math.round(liquidite),
      diversification: Math.round(diversification),
      esg: Math.round(esgScore),
    }
  }
}

// ============================================================
// MOCK DATA — 12 SCPI
// ============================================================

function buildSCPI(raw: Omit<SCPI, 'scoreAlpha' | 'scoreDetails'>): SCPI {
  const { scoreAlpha, scoreDetails } = computeScoreAlpha(raw)
  return { ...raw, scoreAlpha, scoreDetails }
}

export const SCPI_DATA: SCPI[] = [
  buildSCPI({
    id: 'corum-origin',
    nom: 'Corum Origin',
    societeGestion: 'Corum AM',
    type: 'SCPI',
    categorie: 'Diversifiee',
    capitalType: 'variable',
    creationDate: '2012-03-20',
    anciennete: 13,
    prixPart: 1135,
    prixRetrait: 999.33,
    valeurReconstitution: 1198.52,
    td: 6.06,
    tdN1: 6.26,
    tri5ans: 5.97,
    tri10ans: 6.84,
    fraisSouscription: 11.96,
    fraisGestion: 1.20,
    tof: 96.8,
    capitalisation: 2800000000,
    collecteNette: 420000000,
    ratioEndettement: 5.2,
    reportANouveau: 22,
    pgr: 0.8,
    nbAssocies: 52000,
    nbImmeubles: 158,
    esg: false,
    partRevenusEtrangers: 92,
    partPlusValues: 4,
    repartitionGeo: [
      { pays: 'Pays-Bas', pct: 26 }, { pays: 'Italie', pct: 14 }, { pays: 'Irlande', pct: 12 },
      { pays: 'Finlande', pct: 10 }, { pays: 'Espagne', pct: 9 }, { pays: 'Portugal', pct: 8 },
      { pays: 'Lituanie', pct: 7 }, { pays: 'Autres', pct: 14 },
    ],
    repartitionSectorielle: [
      { secteur: 'Bureaux', pct: 42 }, { secteur: 'Commerces', pct: 25 },
      { secteur: 'Logistique', pct: 15 }, { secteur: 'Hotels', pct: 10 }, { secteur: 'Sante', pct: 8 },
    ],
    historique: [
      { annee: 2019, td: 6.25, prixPart: 1090, dividende: 68.13 },
      { annee: 2020, td: 6.00, prixPart: 1090, dividende: 65.40 },
      { annee: 2021, td: 7.03, prixPart: 1090, dividende: 76.63 },
      { annee: 2022, td: 6.88, prixPart: 1090, dividende: 75.00 },
      { annee: 2023, td: 6.26, prixPart: 1135, dividende: 71.05 },
      { annee: 2024, td: 6.06, prixPart: 1135, dividende: 68.78 },
    ],
    immeubles: [
      { nom: 'Zuidas Office Tower', adresse: 'Gustav Mahlerlaan 28', ville: 'Amsterdam', pays: 'Pays-Bas', lat: 52.338, lng: 4.874, type: 'Bureaux', surface: 12500, locataire: 'ING Group', loyer: 2800000 },
      { nom: 'Centro Commerciale Roma', adresse: 'Via del Corso 112', ville: 'Rome', pays: 'Italie', lat: 41.903, lng: 12.480, type: 'Commerces', surface: 8200, locataire: 'Multi-locataires', loyer: 1650000 },
      { nom: 'Dublin Docklands Hub', adresse: 'Grand Canal Dock', ville: 'Dublin', pays: 'Irlande', lat: 53.344, lng: -6.238, type: 'Bureaux', surface: 9800, locataire: 'Salesforce', loyer: 2200000 },
      { nom: 'Helsinki Business Park', adresse: 'Keilaniementie 1', ville: 'Espoo', pays: 'Finlande', lat: 60.176, lng: 24.829, type: 'Bureaux', surface: 15000, locataire: 'Nokia', loyer: 3100000 },
      { nom: 'Logistics Hub Madrid', adresse: 'Ctra. Andalucia km 23', ville: 'Madrid', pays: 'Espagne', lat: 40.332, lng: -3.767, type: 'Logistique', surface: 22000, locataire: 'Amazon', loyer: 1800000 },
      { nom: 'Porto Retail Center', adresse: 'Rua de Santa Catarina', ville: 'Porto', pays: 'Portugal', lat: 41.149, lng: -8.611, type: 'Commerces', surface: 5500, locataire: 'Zara', loyer: 980000 },
    ],
    avis: [
      { auteur: 'Pierre M.', date: '2024-11-15', note: 5, commentaire: 'Excellente diversification europeenne. Rendement regulier depuis 10 ans. Fiscalite avantageuse grace aux revenus etrangers.', verifie: true, detenteurDepuis: '2015' },
      { auteur: 'Sophie L.', date: '2024-09-22', note: 4, commentaire: 'Bon rendement mais frais de souscription eleves (12%). Il faut garder longtemps pour amortir.', verifie: true, detenteurDepuis: '2019' },
      { auteur: 'Marc D.', date: '2024-07-10', note: 4, commentaire: 'Solide. Le seul bemol : le prix de part eleve limite l\'accessibilite.', verifie: false },
    ],
  }),

  buildSCPI({
    id: 'iroko-zen',
    nom: 'Iroko Zen',
    societeGestion: 'Iroko',
    type: 'SCPI',
    categorie: 'Diversifiee',
    capitalType: 'variable',
    creationDate: '2020-10-01',
    anciennete: 5,
    prixPart: 200,
    prixRetrait: 200,
    valeurReconstitution: 210.24,
    td: 7.12,
    tdN1: 7.04,
    tri5ans: 7.08,
    tri10ans: 0,
    fraisSouscription: 0,
    fraisGestion: 1.40,
    tof: 98.4,
    capitalisation: 650000000,
    collecteNette: 310000000,
    ratioEndettement: 8.1,
    reportANouveau: 18,
    pgr: 1.2,
    nbAssocies: 22000,
    nbImmeubles: 82,
    esg: true,
    partRevenusEtrangers: 45,
    partPlusValues: 2,
    repartitionGeo: [
      { pays: 'France', pct: 55 }, { pays: 'Espagne', pct: 15 }, { pays: 'Irlande', pct: 12 },
      { pays: 'Allemagne', pct: 10 }, { pays: 'Portugal', pct: 8 },
    ],
    repartitionSectorielle: [
      { secteur: 'Commerces', pct: 35 }, { secteur: 'Bureaux', pct: 25 },
      { secteur: 'Logistique', pct: 20 }, { secteur: 'Sante', pct: 12 }, { secteur: 'Residentiel', pct: 8 },
    ],
    historique: [
      { annee: 2021, td: 7.10, prixPart: 200, dividende: 14.20 },
      { annee: 2022, td: 7.04, prixPart: 200, dividende: 14.08 },
      { annee: 2023, td: 7.04, prixPart: 200, dividende: 14.08 },
      { annee: 2024, td: 7.12, prixPart: 200, dividende: 14.24 },
    ],
    immeubles: [
      { nom: 'Carrefour City Paris 11', adresse: '42 Rue Oberkampf', ville: 'Paris', pays: 'France', lat: 48.865, lng: 2.380, type: 'Commerces', surface: 450, locataire: 'Carrefour', loyer: 145000 },
      { nom: 'Action Retail Madrid', adresse: 'Calle Alcala 180', ville: 'Madrid', pays: 'Espagne', lat: 40.427, lng: -3.667, type: 'Commerces', surface: 1200, locataire: 'Action', loyer: 210000 },
      { nom: 'Clinique Veterinaire Nantes', adresse: '15 Bd de la Prairie', ville: 'Nantes', pays: 'France', lat: 47.214, lng: -1.559, type: 'Sante', surface: 680, locataire: 'Univet', loyer: 95000 },
      { nom: 'Data Center Dublin', adresse: 'Clonshaugh Industrial Estate', ville: 'Dublin', pays: 'Irlande', lat: 53.404, lng: -6.204, type: 'Logistique', surface: 3200, locataire: 'Equinix', loyer: 580000 },
      { nom: 'Bureau Lyon Part-Dieu', adresse: '65 Bd Vivier-Merle', ville: 'Lyon', pays: 'France', lat: 45.761, lng: 4.859, type: 'Bureaux', surface: 2800, locataire: 'Capgemini', loyer: 420000 },
    ],
    avis: [
      { auteur: 'Thomas R.', date: '2024-12-01', note: 5, commentaire: 'Zero frais d\'entree, rendement au top, ISR. La meilleure SCPI pour les jeunes investisseurs.', verifie: true, detenteurDepuis: '2021' },
      { auteur: 'Julie K.', date: '2024-10-15', note: 5, commentaire: 'Tres satisfaite. Versements trimestriels reguliers, interface de gestion moderne.', verifie: true, detenteurDepuis: '2022' },
      { auteur: 'Antoine B.', date: '2024-08-20', note: 4, commentaire: 'Bonne SCPI mais jeune, on manque de recul sur les performances long terme.', verifie: false },
    ],
  }),

  buildSCPI({
    id: 'remake-live',
    nom: 'Remake Live',
    societeGestion: 'Remake AM',
    type: 'SCPI',
    categorie: 'Diversifiee',
    capitalType: 'variable',
    creationDate: '2022-02-01',
    anciennete: 3,
    prixPart: 204,
    prixRetrait: 204,
    valeurReconstitution: 213.68,
    td: 7.79,
    tdN1: 7.64,
    tri5ans: 0,
    tri10ans: 0,
    fraisSouscription: 0,
    fraisGestion: 1.50,
    tof: 99.2,
    capitalisation: 520000000,
    collecteNette: 280000000,
    ratioEndettement: 12.8,
    reportANouveau: 25,
    pgr: 0.5,
    nbAssocies: 15000,
    nbImmeubles: 48,
    esg: true,
    partRevenusEtrangers: 65,
    partPlusValues: 1,
    repartitionGeo: [
      { pays: 'France', pct: 35 }, { pays: 'Espagne', pct: 20 }, { pays: 'Pays-Bas', pct: 15 },
      { pays: 'Irlande', pct: 12 }, { pays: 'Royaume-Uni', pct: 10 }, { pays: 'Portugal', pct: 8 },
    ],
    repartitionSectorielle: [
      { secteur: 'Bureaux', pct: 30 }, { secteur: 'Commerces', pct: 28 },
      { secteur: 'Logistique', pct: 18 }, { secteur: 'Education', pct: 14 }, { secteur: 'Sante', pct: 10 },
    ],
    historique: [
      { annee: 2022, td: 7.64, prixPart: 204, dividende: 15.59 },
      { annee: 2023, td: 7.64, prixPart: 204, dividende: 15.59 },
      { annee: 2024, td: 7.79, prixPart: 204, dividende: 15.89 },
    ],
    immeubles: [
      { nom: 'Campus Universitaire Madrid', adresse: 'Ciudad Universitaria', ville: 'Madrid', pays: 'Espagne', lat: 40.449, lng: -3.727, type: 'Education', surface: 8500, locataire: 'Universite Complutense', loyer: 1200000 },
      { nom: 'Retail Park Amsterdam', adresse: 'Wibautstraat 150', ville: 'Amsterdam', pays: 'Pays-Bas', lat: 52.351, lng: 4.909, type: 'Commerces', surface: 6200, locataire: 'Multi-locataires', loyer: 980000 },
      { nom: 'Bureaux La Defense', adresse: 'Tour Initiale', ville: 'Courbevoie', pays: 'France', lat: 48.892, lng: 2.236, type: 'Bureaux', surface: 4500, locataire: 'Thales', loyer: 850000 },
      { nom: 'London Office', adresse: '30 Finsbury Square', ville: 'Londres', pays: 'Royaume-Uni', lat: 51.521, lng: -0.086, type: 'Bureaux', surface: 3800, locataire: 'Deloitte', loyer: 1100000 },
    ],
    avis: [
      { auteur: 'Nicolas P.', date: '2024-11-05', note: 5, commentaire: 'Meilleur TD du marche sans frais d\'entree. Le combo parfait.', verifie: true, detenteurDepuis: '2022' },
      { auteur: 'Claire V.', date: '2024-09-18', note: 4, commentaire: 'Tres prometteur mais manque encore d\'historique. A surveiller.', verifie: true, detenteurDepuis: '2023' },
    ],
  }),

  buildSCPI({
    id: 'primovie',
    nom: 'Primovie',
    societeGestion: 'Primonial REIM',
    type: 'SCPI',
    categorie: 'Sante / Education',
    capitalType: 'variable',
    creationDate: '2012-07-13',
    anciennete: 13,
    prixPart: 203,
    prixRetrait: 184.13,
    valeurReconstitution: 213.54,
    td: 4.21,
    tdN1: 4.52,
    tri5ans: 3.10,
    tri10ans: 3.82,
    fraisSouscription: 9.24,
    fraisGestion: 0.96,
    tof: 95.2,
    capitalisation: 4200000000,
    collecteNette: 180000000,
    ratioEndettement: 18.5,
    reportANouveau: 35,
    pgr: 1.8,
    nbAssocies: 48000,
    nbImmeubles: 295,
    esg: true,
    partRevenusEtrangers: 40,
    partPlusValues: 3,
    repartitionGeo: [
      { pays: 'France', pct: 60 }, { pays: 'Allemagne', pct: 15 }, { pays: 'Italie', pct: 10 },
      { pays: 'Espagne', pct: 8 }, { pays: 'Pays-Bas', pct: 7 },
    ],
    repartitionSectorielle: [
      { secteur: 'Sante', pct: 55 }, { secteur: 'Education', pct: 30 },
      { secteur: 'Residentiel', pct: 10 }, { secteur: 'Bureaux', pct: 5 },
    ],
    historique: [
      { annee: 2019, td: 4.51, prixPart: 203, dividende: 9.16 },
      { annee: 2020, td: 4.50, prixPart: 203, dividende: 9.14 },
      { annee: 2021, td: 4.50, prixPart: 203, dividende: 9.14 },
      { annee: 2022, td: 4.52, prixPart: 203, dividende: 9.18 },
      { annee: 2023, td: 4.52, prixPart: 203, dividende: 9.18 },
      { annee: 2024, td: 4.21, prixPart: 203, dividende: 8.55 },
    ],
    immeubles: [
      { nom: 'Clinique du Parc Lyon', adresse: '155 Bd de Stalingrad', ville: 'Villeurbanne', pays: 'France', lat: 45.766, lng: 4.880, type: 'Sante', surface: 12000, locataire: 'Ramsay Sante', loyer: 2100000 },
      { nom: 'EHPAD Les Jardins', adresse: '22 Rue des Lilas', ville: 'Bordeaux', pays: 'France', lat: 44.837, lng: -0.579, type: 'Sante', surface: 5500, locataire: 'Korian', loyer: 890000 },
      { nom: 'Campus Scolaire Munich', adresse: 'Leopoldstrasse 50', ville: 'Munich', pays: 'Allemagne', lat: 48.159, lng: 11.585, type: 'Education', surface: 8000, locataire: 'Phorms Education', loyer: 1350000 },
      { nom: 'Residence Etudiante Toulouse', adresse: '40 Allee Jules Guesde', ville: 'Toulouse', pays: 'France', lat: 43.596, lng: 1.448, type: 'Education', surface: 4200, locataire: 'Nexity Studea', loyer: 620000 },
    ],
    avis: [
      { auteur: 'Francoise G.', date: '2024-10-28', note: 3, commentaire: 'Rendement en baisse depuis 2 ans. La thematique sante est rassurante mais les performances decoivent.', verifie: true, detenteurDepuis: '2016' },
      { auteur: 'Jean-Paul H.', date: '2024-06-12', note: 4, commentaire: 'Bonne capitalisation, tres liquide. Placement securitaire mais pas le plus rentable.', verifie: true, detenteurDepuis: '2014' },
    ],
  }),

  buildSCPI({
    id: 'epargne-pierre',
    nom: 'Epargne Pierre',
    societeGestion: 'Atland Voisin',
    type: 'SCPI',
    categorie: 'Diversifiee',
    capitalType: 'variable',
    creationDate: '2013-12-01',
    anciennete: 12,
    prixPart: 208,
    prixRetrait: 189.28,
    valeurReconstitution: 222.30,
    td: 5.28,
    tdN1: 5.28,
    tri5ans: 4.42,
    tri10ans: 5.11,
    fraisSouscription: 9.00,
    fraisGestion: 0.95,
    tof: 93.8,
    capitalisation: 3100000000,
    collecteNette: 240000000,
    ratioEndettement: 12.3,
    reportANouveau: 28,
    pgr: 1.5,
    nbAssocies: 55000,
    nbImmeubles: 380,
    esg: true,
    partRevenusEtrangers: 25,
    partPlusValues: 5,
    repartitionGeo: [
      { pays: 'France', pct: 75 }, { pays: 'Allemagne', pct: 8 }, { pays: 'Pays-Bas', pct: 7 },
      { pays: 'Espagne', pct: 5 }, { pays: 'Italie', pct: 5 },
    ],
    repartitionSectorielle: [
      { secteur: 'Bureaux', pct: 50 }, { secteur: 'Commerces', pct: 22 },
      { secteur: 'Sante', pct: 12 }, { secteur: 'Logistique', pct: 10 }, { secteur: 'Hotels', pct: 6 },
    ],
    historique: [
      { annee: 2019, td: 5.85, prixPart: 208, dividende: 12.17 },
      { annee: 2020, td: 5.36, prixPart: 208, dividende: 11.15 },
      { annee: 2021, td: 5.36, prixPart: 208, dividende: 11.15 },
      { annee: 2022, td: 5.28, prixPart: 208, dividende: 10.98 },
      { annee: 2023, td: 5.28, prixPart: 208, dividende: 10.98 },
      { annee: 2024, td: 5.28, prixPart: 208, dividende: 10.98 },
    ],
    immeubles: [
      { nom: 'Immeuble Haussmann', adresse: '45 Bd Haussmann', ville: 'Paris', pays: 'France', lat: 48.874, lng: 2.330, type: 'Bureaux', surface: 6500, locataire: 'BNP Paribas', loyer: 1850000 },
      { nom: 'Centre Commercial Confluences', adresse: '112 Cours Charlemagne', ville: 'Lyon', pays: 'France', lat: 45.745, lng: 4.818, type: 'Commerces', surface: 4200, locataire: 'Multi-locataires', loyer: 720000 },
      { nom: 'Plateforme Logistique Lille', adresse: 'ZI de Seclin', ville: 'Lille', pays: 'France', lat: 50.547, lng: 3.032, type: 'Logistique', surface: 18000, locataire: 'DB Schenker', loyer: 1100000 },
    ],
    avis: [
      { auteur: 'Bernard T.', date: '2024-11-20', note: 4, commentaire: 'Valeur sure. Bonne diversification France + Europe. Rendement stable.', verifie: true, detenteurDepuis: '2017' },
    ],
  }),

  buildSCPI({
    id: 'transitions-europe',
    nom: 'Transitions Europe',
    societeGestion: 'Arkea REIM',
    type: 'SCPI',
    categorie: 'Diversifiee',
    capitalType: 'variable',
    creationDate: '2022-06-01',
    anciennete: 3,
    prixPart: 200,
    prixRetrait: 200,
    valeurReconstitution: 209.12,
    td: 8.16,
    tdN1: 8.16,
    tri5ans: 0,
    tri10ans: 0,
    fraisSouscription: 0,
    fraisGestion: 1.50,
    tof: 100,
    capitalisation: 210000000,
    collecteNette: 150000000,
    ratioEndettement: 15.0,
    reportANouveau: 30,
    pgr: 0.3,
    nbAssocies: 6500,
    nbImmeubles: 22,
    esg: true,
    partRevenusEtrangers: 85,
    partPlusValues: 1,
    repartitionGeo: [
      { pays: 'Espagne', pct: 30 }, { pays: 'Pays-Bas', pct: 25 }, { pays: 'Irlande', pct: 20 },
      { pays: 'Italie', pct: 15 }, { pays: 'Portugal', pct: 10 },
    ],
    repartitionSectorielle: [
      { secteur: 'Bureaux', pct: 35 }, { secteur: 'Logistique', pct: 30 },
      { secteur: 'Commerces', pct: 20 }, { secteur: 'Sante', pct: 15 },
    ],
    historique: [
      { annee: 2022, td: 8.16, prixPart: 200, dividende: 16.32 },
      { annee: 2023, td: 8.16, prixPart: 200, dividende: 16.32 },
      { annee: 2024, td: 8.16, prixPart: 200, dividende: 16.32 },
    ],
    immeubles: [
      { nom: 'Office Park Barcelona', adresse: 'Carrer de Llull 321', ville: 'Barcelone', pays: 'Espagne', lat: 41.403, lng: 2.207, type: 'Bureaux', surface: 7500, locataire: 'Siemens', loyer: 1400000 },
      { nom: 'Logistics Rotterdam', adresse: 'Maasvlakte', ville: 'Rotterdam', pays: 'Pays-Bas', lat: 51.949, lng: 4.025, type: 'Logistique', surface: 25000, locataire: 'DHL', loyer: 2100000 },
      { nom: 'Medical Center Lisbonne', adresse: 'Av. da Liberdade 245', ville: 'Lisbonne', pays: 'Portugal', lat: 38.722, lng: -9.149, type: 'Sante', surface: 3500, locataire: 'Luz Saude', loyer: 680000 },
    ],
    avis: [
      { auteur: 'Stephane F.', date: '2024-12-10', note: 5, commentaire: 'TD phenomenal a 8.16% sans frais d\'entree. Le meilleur rapport qualite/prix du marche.', verifie: true, detenteurDepuis: '2022' },
      { auteur: 'Marie C.', date: '2024-08-05', note: 4, commentaire: 'Tres bon rendement mais tres jeune SCPI. A surveiller sur la duree.', verifie: false },
    ],
  }),

  buildSCPI({
    id: 'novaxia-neo',
    nom: 'Novaxia Neo',
    societeGestion: 'Novaxia Investissement',
    type: 'SCPI',
    categorie: 'Diversifiee',
    capitalType: 'variable',
    creationDate: '2019-11-01',
    anciennete: 6,
    prixPart: 187,
    prixRetrait: 187,
    valeurReconstitution: 196.48,
    td: 6.51,
    tdN1: 6.33,
    tri5ans: 6.12,
    tri10ans: 0,
    fraisSouscription: 0,
    fraisGestion: 1.50,
    tof: 97.6,
    capitalisation: 380000000,
    collecteNette: 180000000,
    ratioEndettement: 10.2,
    reportANouveau: 20,
    pgr: 0.9,
    nbAssocies: 12000,
    nbImmeubles: 45,
    esg: true,
    partRevenusEtrangers: 55,
    partPlusValues: 8,
    repartitionGeo: [
      { pays: 'France', pct: 45 }, { pays: 'Pays-Bas', pct: 18 }, { pays: 'Espagne', pct: 15 },
      { pays: 'Irlande', pct: 12 }, { pays: 'Belgique', pct: 10 },
    ],
    repartitionSectorielle: [
      { secteur: 'Bureaux', pct: 40 }, { secteur: 'Logistique', pct: 25 },
      { secteur: 'Commerces', pct: 20 }, { secteur: 'Residentiel', pct: 15 },
    ],
    historique: [
      { annee: 2020, td: 6.00, prixPart: 187, dividende: 11.22 },
      { annee: 2021, td: 6.49, prixPart: 187, dividende: 12.14 },
      { annee: 2022, td: 6.33, prixPart: 187, dividende: 11.84 },
      { annee: 2023, td: 6.33, prixPart: 187, dividende: 11.84 },
      { annee: 2024, td: 6.51, prixPart: 187, dividende: 12.17 },
    ],
    immeubles: [
      { nom: 'Reconversion Bureaux Paris 12', adresse: '120 Av. Daumesnil', ville: 'Paris', pays: 'France', lat: 48.843, lng: 2.388, type: 'Bureaux', surface: 3500, locataire: 'WeWork', loyer: 620000 },
      { nom: 'Entrepot Amsterdam Nord', adresse: 'NDSM-Plein', ville: 'Amsterdam', pays: 'Pays-Bas', lat: 52.401, lng: 4.891, type: 'Logistique', surface: 8000, locataire: 'PostNL', loyer: 520000 },
      { nom: 'Residence Bruxelles', adresse: 'Av. Louise 250', ville: 'Bruxelles', pays: 'Belgique', lat: 50.826, lng: 4.362, type: 'Residentiel', surface: 2800, locataire: 'Multi-locataires', loyer: 380000 },
    ],
    avis: [
      { auteur: 'Remi A.', date: '2024-11-30', note: 5, commentaire: 'Le concept de reconversion immobiliere est original et performant. Zero frais, beau rendement.', verifie: true, detenteurDepuis: '2020' },
    ],
  }),

  buildSCPI({
    id: 'immorente',
    nom: 'Immorente',
    societeGestion: 'Sofidy',
    type: 'SCPI',
    categorie: 'Commerces',
    capitalType: 'variable',
    creationDate: '1988-01-01',
    anciennete: 37,
    prixPart: 340,
    prixRetrait: 307.36,
    valeurReconstitution: 359.82,
    td: 5.00,
    tdN1: 5.01,
    tri5ans: 3.55,
    tri10ans: 4.84,
    fraisSouscription: 9.60,
    fraisGestion: 0.84,
    tof: 95.5,
    capitalisation: 3800000000,
    collecteNette: 150000000,
    ratioEndettement: 10.8,
    reportANouveau: 42,
    pgr: 2.5,
    nbAssocies: 58000,
    nbImmeubles: 450,
    esg: false,
    partRevenusEtrangers: 30,
    partPlusValues: 6,
    repartitionGeo: [
      { pays: 'France', pct: 70 }, { pays: 'Allemagne', pct: 10 }, { pays: 'Pays-Bas', pct: 8 },
      { pays: 'Belgique', pct: 7 }, { pays: 'Espagne', pct: 5 },
    ],
    repartitionSectorielle: [
      { secteur: 'Commerces', pct: 65 }, { secteur: 'Bureaux', pct: 20 },
      { secteur: 'Hotels', pct: 10 }, { secteur: 'Logistique', pct: 5 },
    ],
    historique: [
      { annee: 2019, td: 4.58, prixPart: 340, dividende: 15.57 },
      { annee: 2020, td: 4.42, prixPart: 340, dividende: 15.03 },
      { annee: 2021, td: 4.64, prixPart: 340, dividende: 15.78 },
      { annee: 2022, td: 5.01, prixPart: 340, dividende: 17.03 },
      { annee: 2023, td: 5.01, prixPart: 340, dividende: 17.03 },
      { annee: 2024, td: 5.00, prixPart: 340, dividende: 17.00 },
    ],
    immeubles: [
      { nom: 'Galeries Lafayette Haussmann (quote-part)', adresse: '40 Bd Haussmann', ville: 'Paris', pays: 'France', lat: 48.875, lng: 2.332, type: 'Commerces', surface: 2500, locataire: 'Galeries Lafayette', loyer: 1500000 },
      { nom: 'Centre Commercial V2', adresse: 'Av. de l\'Europe', ville: 'Villeneuve-d\'Ascq', pays: 'France', lat: 50.631, lng: 3.131, type: 'Commerces', surface: 8000, locataire: 'Multi-locataires', loyer: 1800000 },
      { nom: 'Hotel Marriott Champs-Elysees', adresse: '70 Av. Champs-Elysees', ville: 'Paris', pays: 'France', lat: 48.871, lng: 2.303, type: 'Hotels', surface: 4500, locataire: 'Marriott', loyer: 2200000 },
      { nom: 'Retail Park Berlin', adresse: 'Alexanderplatz 5', ville: 'Berlin', pays: 'Allemagne', lat: 52.522, lng: 13.413, type: 'Commerces', surface: 5200, locataire: 'MediaMarkt', loyer: 890000 },
    ],
    avis: [
      { auteur: 'Jacques R.', date: '2024-10-10', note: 4, commentaire: '37 ans d\'historique, c\'est la reference. Tres bon report a nouveau (42 jours). Pere de famille.', verifie: true, detenteurDepuis: '2005' },
      { auteur: 'Anne-Marie S.', date: '2024-07-22', note: 3, commentaire: 'Frais de souscription lourds. Rendement correct mais sans plus par rapport aux nouvelles SCPI.', verifie: true, detenteurDepuis: '2018' },
    ],
  }),

  buildSCPI({
    id: 'pierval-sante',
    nom: 'Pierval Sante',
    societeGestion: 'Euryale AM',
    type: 'SCPI',
    categorie: 'Sante',
    capitalType: 'variable',
    creationDate: '2013-12-01',
    anciennete: 12,
    prixPart: 200,
    prixRetrait: 186.40,
    valeurReconstitution: 210.34,
    td: 5.10,
    tdN1: 5.10,
    tri5ans: 4.35,
    tri10ans: 4.92,
    fraisSouscription: 6.80,
    fraisGestion: 0.96,
    tof: 97.1,
    capitalisation: 2900000000,
    collecteNette: 350000000,
    ratioEndettement: 14.2,
    reportANouveau: 32,
    pgr: 1.6,
    nbAssocies: 42000,
    nbImmeubles: 180,
    esg: true,
    partRevenusEtrangers: 65,
    partPlusValues: 2,
    repartitionGeo: [
      { pays: 'Irlande', pct: 25 }, { pays: 'France', pct: 22 }, { pays: 'Allemagne', pct: 18 },
      { pays: 'Portugal', pct: 12 }, { pays: 'Espagne', pct: 10 }, { pays: 'Italie', pct: 8 }, { pays: 'Autres', pct: 5 },
    ],
    repartitionSectorielle: [
      { secteur: 'Sante', pct: 100 },
    ],
    historique: [
      { annee: 2019, td: 5.05, prixPart: 200, dividende: 10.10 },
      { annee: 2020, td: 4.95, prixPart: 200, dividende: 9.90 },
      { annee: 2021, td: 5.00, prixPart: 200, dividende: 10.00 },
      { annee: 2022, td: 5.35, prixPart: 200, dividende: 10.70 },
      { annee: 2023, td: 5.10, prixPart: 200, dividende: 10.20 },
      { annee: 2024, td: 5.10, prixPart: 200, dividende: 10.20 },
    ],
    immeubles: [
      { nom: 'Cork University Hospital Extension', adresse: 'Wilton Rd', ville: 'Cork', pays: 'Irlande', lat: 51.884, lng: -8.492, type: 'Sante', surface: 15000, locataire: 'HSE Ireland', loyer: 3200000 },
      { nom: 'Clinique Ambroise Pare', adresse: '25 Bd Victor Hugo', ville: 'Boulogne-Billancourt', pays: 'France', lat: 48.837, lng: 2.244, type: 'Sante', surface: 8000, locataire: 'Ramsay Sante', loyer: 1800000 },
      { nom: 'Pflegeheim Hamburg', adresse: 'Eppendorfer Baum 15', ville: 'Hambourg', pays: 'Allemagne', lat: 53.580, lng: 9.982, type: 'Sante', surface: 6500, locataire: 'Korian DACH', loyer: 1100000 },
    ],
    avis: [
      { auteur: 'Dr. Laurent M.', date: '2024-11-01', note: 5, commentaire: 'La thematique sante est anti-cyclique. Excellente diversification geographique pour une SCPI thematique.', verifie: true, detenteurDepuis: '2015' },
    ],
  }),

  buildSCPI({
    id: 'corum-xl',
    nom: 'Corum XL',
    societeGestion: 'Corum AM',
    type: 'SCPI',
    categorie: 'Diversifiee',
    capitalType: 'variable',
    creationDate: '2017-04-01',
    anciennete: 8,
    prixPart: 195,
    prixRetrait: 171.60,
    valeurReconstitution: 206.05,
    td: 5.53,
    tdN1: 5.40,
    tri5ans: 5.21,
    tri10ans: 0,
    fraisSouscription: 12.00,
    fraisGestion: 1.30,
    tof: 98.5,
    capitalisation: 1900000000,
    collecteNette: 380000000,
    ratioEndettement: 7.8,
    reportANouveau: 19,
    pgr: 0.6,
    nbAssocies: 35000,
    nbImmeubles: 72,
    esg: false,
    partRevenusEtrangers: 100,
    partPlusValues: 3,
    repartitionGeo: [
      { pays: 'Royaume-Uni', pct: 28 }, { pays: 'Pologne', pct: 18 }, { pays: 'Norvege', pct: 14 },
      { pays: 'Canada', pct: 12 }, { pays: 'Finlande', pct: 10 }, { pays: 'Irlande', pct: 8 }, { pays: 'Autres', pct: 10 },
    ],
    repartitionSectorielle: [
      { secteur: 'Bureaux', pct: 40 }, { secteur: 'Commerces', pct: 25 },
      { secteur: 'Logistique', pct: 20 }, { secteur: 'Hotels', pct: 15 },
    ],
    historique: [
      { annee: 2019, td: 5.97, prixPart: 189, dividende: 11.28 },
      { annee: 2020, td: 5.66, prixPart: 189, dividende: 10.70 },
      { annee: 2021, td: 5.84, prixPart: 189, dividende: 11.04 },
      { annee: 2022, td: 5.40, prixPart: 195, dividende: 10.53 },
      { annee: 2023, td: 5.40, prixPart: 195, dividende: 10.53 },
      { annee: 2024, td: 5.53, prixPart: 195, dividende: 10.78 },
    ],
    immeubles: [
      { nom: 'Manchester Office', adresse: 'Spinningfields', ville: 'Manchester', pays: 'Royaume-Uni', lat: 53.480, lng: -2.252, type: 'Bureaux', surface: 6000, locataire: 'Deloitte UK', loyer: 1350000 },
      { nom: 'Warsaw Business Center', adresse: 'Ul. Emilii Plater 53', ville: 'Varsovie', pays: 'Pologne', lat: 52.230, lng: 21.006, type: 'Bureaux', surface: 8500, locataire: 'PwC Poland', loyer: 980000 },
      { nom: 'Oslo Logistics Park', adresse: 'Gardermoen', ville: 'Oslo', pays: 'Norvege', lat: 60.195, lng: 11.100, type: 'Logistique', surface: 20000, locataire: 'Posten Norge', loyer: 1800000 },
      { nom: 'Toronto Retail Complex', adresse: 'Queen Street W', ville: 'Toronto', pays: 'Canada', lat: 43.649, lng: -79.392, type: 'Commerces', surface: 4200, locataire: 'Hudson Bay', loyer: 920000 },
    ],
    avis: [
      { auteur: 'Alexandre T.', date: '2024-12-05', note: 4, commentaire: 'La diversification hors zone euro (UK, Canada, Pologne) est unique. 100% revenus etrangers = fiscalite optimale.', verifie: true, detenteurDepuis: '2018' },
    ],
  }),

  buildSCPI({
    id: 'pfo2',
    nom: 'PFO2',
    societeGestion: 'Perial AM',
    type: 'SCPI',
    categorie: 'Bureaux',
    capitalType: 'variable',
    creationDate: '2009-06-15',
    anciennete: 16,
    prixPart: 196,
    prixRetrait: 178.36,
    valeurReconstitution: 206.88,
    td: 4.10,
    tdN1: 4.10,
    tri5ans: 2.88,
    tri10ans: 3.45,
    fraisSouscription: 9.00,
    fraisGestion: 0.96,
    tof: 92.1,
    capitalisation: 2500000000,
    collecteNette: 80000000,
    ratioEndettement: 22.1,
    reportANouveau: 38,
    pgr: 2.2,
    nbAssocies: 40000,
    nbImmeubles: 195,
    esg: true,
    partRevenusEtrangers: 35,
    partPlusValues: 4,
    repartitionGeo: [
      { pays: 'France', pct: 65 }, { pays: 'Allemagne', pct: 15 }, { pays: 'Italie', pct: 10 },
      { pays: 'Espagne', pct: 5 }, { pays: 'Autres', pct: 5 },
    ],
    repartitionSectorielle: [
      { secteur: 'Bureaux', pct: 80 }, { secteur: 'Commerces', pct: 12 },
      { secteur: 'Logistique', pct: 5 }, { secteur: 'Sante', pct: 3 },
    ],
    historique: [
      { annee: 2019, td: 4.61, prixPart: 196, dividende: 9.04 },
      { annee: 2020, td: 4.41, prixPart: 196, dividende: 8.64 },
      { annee: 2021, td: 4.22, prixPart: 196, dividende: 8.27 },
      { annee: 2022, td: 4.10, prixPart: 196, dividende: 8.04 },
      { annee: 2023, td: 4.10, prixPart: 196, dividende: 8.04 },
      { annee: 2024, td: 4.10, prixPart: 196, dividende: 8.04 },
    ],
    immeubles: [
      { nom: 'Tour Franklin', adresse: '100 Terrasse Boieldieu', ville: 'Courbevoie', pays: 'France', lat: 48.895, lng: 2.236, type: 'Bureaux', surface: 22000, locataire: 'EDF', loyer: 5200000 },
      { nom: 'Green Office Meudon', adresse: '10 Place de la Gare', ville: 'Meudon', pays: 'France', lat: 48.810, lng: 2.237, type: 'Bureaux', surface: 12000, locataire: 'Thales', loyer: 2800000 },
      { nom: 'Buero Frankfurt', adresse: 'Mainzer Landstrasse 30', ville: 'Francfort', pays: 'Allemagne', lat: 50.111, lng: 8.663, type: 'Bureaux', surface: 5500, locataire: 'Commerzbank', loyer: 1100000 },
    ],
    avis: [
      { auteur: 'Patrick D.', date: '2024-09-15', note: 3, commentaire: 'Rendement en erosion depuis 5 ans. Trop concentre bureaux France. Le teletravail pese.', verifie: true, detenteurDepuis: '2012' },
      { auteur: 'Isabelle M.', date: '2024-05-20', note: 3, commentaire: 'TOF sous 93%, dette a 22%. Je surveille mais j\'hesite a renforcer.', verifie: true, detenteurDepuis: '2016' },
    ],
  }),

  buildSCPI({
    id: 'activimmo',
    nom: 'ActivImmo',
    societeGestion: 'Alderan',
    type: 'SCPI',
    categorie: 'Logistique',
    capitalType: 'variable',
    creationDate: '2019-09-01',
    anciennete: 6,
    prixPart: 610,
    prixRetrait: 555.10,
    valeurReconstitution: 643.96,
    td: 5.52,
    tdN1: 5.50,
    tri5ans: 5.18,
    tri10ans: 0,
    fraisSouscription: 9.00,
    fraisGestion: 0.96,
    tof: 96.4,
    capitalisation: 1100000000,
    collecteNette: 220000000,
    ratioEndettement: 16.5,
    reportANouveau: 15,
    pgr: 1.0,
    nbAssocies: 18000,
    nbImmeubles: 95,
    esg: false,
    partRevenusEtrangers: 15,
    partPlusValues: 3,
    repartitionGeo: [
      { pays: 'France', pct: 85 }, { pays: 'Espagne', pct: 8 }, { pays: 'Pays-Bas', pct: 7 },
    ],
    repartitionSectorielle: [
      { secteur: 'Logistique', pct: 78 }, { secteur: 'Locaux d\'activite', pct: 15 },
      { secteur: 'Commerces', pct: 7 },
    ],
    historique: [
      { annee: 2020, td: 6.05, prixPart: 610, dividende: 36.91 },
      { annee: 2021, td: 5.72, prixPart: 610, dividende: 34.89 },
      { annee: 2022, td: 5.50, prixPart: 610, dividende: 33.55 },
      { annee: 2023, td: 5.50, prixPart: 610, dividende: 33.55 },
      { annee: 2024, td: 5.52, prixPart: 610, dividende: 33.67 },
    ],
    immeubles: [
      { nom: 'Hub Logistique A6', adresse: 'ZAC de la Plaine', ville: 'Lieusaint', pays: 'France', lat: 48.630, lng: 2.562, type: 'Logistique', surface: 35000, locataire: 'XPO Logistics', loyer: 3200000 },
      { nom: 'Entrepot Marseille Fos', adresse: 'Zone Industrielle Fos', ville: 'Fos-sur-Mer', pays: 'France', lat: 43.422, lng: 4.944, type: 'Logistique', surface: 28000, locataire: 'CMA CGM', loyer: 2400000 },
      { nom: 'Plateforme e-commerce Toulouse', adresse: 'ZI de Montredon', ville: 'Toulouse', pays: 'France', lat: 43.556, lng: 1.494, type: 'Logistique', surface: 18000, locataire: 'Cdiscount', loyer: 1500000 },
    ],
    avis: [
      { auteur: 'Christophe L.', date: '2024-11-12', note: 4, commentaire: 'Seule SCPI 100% logistique. Le e-commerce tire la demande. Bon pari thematique.', verifie: true, detenteurDepuis: '2020' },
    ],
  }),
]

// ============================================================
// HELPERS
// ============================================================

export function getSCPIById(id: string): SCPI | undefined {
  return SCPI_DATA.find(s => s.id === id)
}

export function getSCPIsSorted(key: keyof SCPI, desc = true): SCPI[] {
  return [...SCPI_DATA].sort((a, b) => {
    const av = a[key] as number
    const bv = b[key] as number
    return desc ? bv - av : av - bv
  })
}

// ============================================================
// FISCALITE
// ============================================================

export const TMI_TRANCHES = [
  { label: '0%', taux: 0, plafond: 11294 },
  { label: '11%', taux: 11, plafond: 28797 },
  { label: '30%', taux: 30, plafond: 82341 },
  { label: '41%', taux: 41, plafond: 177106 },
  { label: '45%', taux: 45, plafond: Infinity },
]

export const PRELEVEMENTS_SOCIAUX = 17.2 // %

export function calcRevenuNetMensuel(
  montantInvesti: number,
  td: number,
  tmi: number,
  partEtranger: number,
): { brut: number; net: number; ir: number; ps: number } {
  const revenuAnnuelBrut = montantInvesti * (td / 100)
  const revenuFrancais = revenuAnnuelBrut * ((100 - partEtranger) / 100)
  const revenuEtranger = revenuAnnuelBrut * (partEtranger / 100)

  // Revenus francais : IR + PS
  const irFrance = revenuFrancais * (tmi / 100)
  const psFrance = revenuFrancais * (PRELEVEMENTS_SOCIAUX / 100)

  // Revenus etrangers : credit d'impot (taux effectif moyen ~20%) + PS reduits (7.5% CSG deductible)
  const tauxEffectifEtranger = Math.max(0, tmi - 20) // convention fiscale ~20% de credit
  const irEtranger = revenuEtranger * (tauxEffectifEtranger / 100)
  const psEtranger = revenuEtranger * (PRELEVEMENTS_SOCIAUX / 100)

  const totalIR = irFrance + irEtranger
  const totalPS = psFrance + psEtranger
  const netAnnuel = revenuAnnuelBrut - totalIR - totalPS

  return {
    brut: revenuAnnuelBrut / 12,
    net: netAnnuel / 12,
    ir: totalIR / 12,
    ps: totalPS / 12,
  }
}

// ============================================================
// TRI CALCULATION
// ============================================================

export function computeIRR(cashFlows: number[], guess = 0.05, maxIter = 200): number | null {
  let rate = guess
  for (let i = 0; i < maxIter; i++) {
    let npv = 0, dnpv = 0
    for (let t = 0; t < cashFlows.length; t++) {
      npv += cashFlows[t] / Math.pow(1 + rate, t)
      if (t > 0) dnpv -= t * cashFlows[t] / Math.pow(1 + rate, t + 1)
    }
    if (Math.abs(dnpv) < 1e-15) break
    const newRate = rate - npv / dnpv
    if (Math.abs(newRate - rate) < 1e-10) return newRate
    rate = newRate
    if (rate < -0.99 || rate > 10) return null
  }
  return rate
}

// ============================================================
// ALTERNATIVES DATA
// ============================================================

export interface AlternativeInvestissement {
  id: string
  nom: string
  type: string
  rendementMoyen: number
  fraisEntree: number
  fraisGestion: number
  fiscalite: string
  liquidite: string
  risque: string
  ticketMin: number
  description: string
}

export const ALTERNATIVES: AlternativeInvestissement[] = [
  { id: 'etf-immo', nom: 'ETF Immobilier (EPRA)', type: 'ETF', rendementMoyen: 4.5, fraisEntree: 0, fraisGestion: 0.30, fiscalite: 'PFU 30% ou bareme IR', liquidite: 'Immediate (bourse)', risque: 'Eleve (volatilite marche)', ticketMin: 10, description: 'Fonds cote repliquant un indice immobilier europeen.' },
  { id: 'etf-action', nom: 'ETF Actions Monde (MSCI World)', type: 'ETF', rendementMoyen: 8.0, fraisEntree: 0, fraisGestion: 0.20, fiscalite: 'PFU 30% ou bareme IR', liquidite: 'Immediate (bourse)', risque: 'Eleve (volatilite marche)', ticketMin: 10, description: 'Fonds cote diversifie sur les actions mondiales.' },
  { id: 'fonds-euros', nom: 'Fonds Euros', type: 'Assurance-vie', rendementMoyen: 2.5, fraisEntree: 0, fraisGestion: 0.60, fiscalite: 'PFU apres 8 ans (abattement 4600/9200E)', liquidite: 'Quelques jours', risque: 'Tres faible (capital garanti)', ticketMin: 100, description: 'Support en euros d\'assurance-vie avec capital garanti.' },
  { id: 'locatif-direct', nom: 'Investissement Locatif Direct', type: 'Immobilier physique', rendementMoyen: 3.5, fraisEntree: 8, fraisGestion: 0, fiscalite: 'Revenus fonciers (IR + PS 17.2%)', liquidite: 'Tres faible (mois de vente)', risque: 'Moyen (vacance, travaux, impayes)', ticketMin: 50000, description: 'Achat d\'un bien immobilier pour le mettre en location.' },
]
