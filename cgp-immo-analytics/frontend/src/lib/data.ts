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

// ============================================================
// BILAN (Balance Sheet)
// ============================================================

export interface SCPIBilan {
  annee: number
  // Actif
  immobilisationsNettes: number    // Immeubles (valeur nette comptable) en M€
  autresActifsImmobilises: number  // Participations, immobilisations financières en M€
  creancesClients: number          // Créances locataires en M€
  tresorerie: number               // Trésorerie et équivalents en M€
  autresActifsCirculants: number   // Autres créances, CCA en M€
  totalActif: number               // Total actif en M€
  // Passif
  capitalSocial: number            // Capital social en M€
  primesEmission: number           // Primes d'émission/fusion en M€
  reportANouveau: number           // Report à nouveau en M€
  resultatExercice: number         // Résultat de l'exercice en M€
  totalCapitauxPropres: number     // Total capitaux propres en M€
  provisions: number               // Provisions pour risques et charges en M€
  dettesFinancieres: number        // Emprunts bancaires en M€
  dettesExploitation: number       // Dettes fournisseurs, fiscales, sociales en M€
  autresDettes: number             // Autres dettes en M€
  totalPassif: number              // Total passif en M€
}

// ============================================================
// COMPTE DE RESULTAT (Income Statement)
// ============================================================

export interface SCPICompteResultat {
  annee: number
  // Produits
  produitsLocatifs: number         // Loyers encaissés en M€
  autresProduits: number           // Produits financiers, divers en M€
  totalProduits: number            // Total produits en M€
  // Charges
  chargesImmobilieres: number      // Charges non récupérables, travaux en M€
  chargesGestion: number           // Commission SGP, frais de gestion en M€
  chargesFinancieres: number       // Intérêts d'emprunts en M€
  dotationsProvisions: number      // Dotations amortissements et provisions en M€
  autresCharges: number            // Charges diverses en M€
  totalCharges: number             // Total charges en M€
  // Résultats
  resultatCourant: number          // Résultat courant en M€
  resultatExceptionnel: number     // Plus/moins-values de cessions en M€
  resultatNet: number              // Résultat net en M€
  resultatNetParPart: number       // Résultat net par part en €
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

  // Etats financiers
  bilans: SCPIBilan[]
  comptesResultat: SCPICompteResultat[]

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
    bilans: [
      { annee: 2023, immobilisationsNettes: 2650, autresActifsImmobilises: 45, creancesClients: 28, tresorerie: 120, autresActifsCirculants: 35, totalActif: 2878, capitalSocial: 1580, primesEmission: 820, reportANouveau: 55, resultatExercice: 158, totalCapitauxPropres: 2613, provisions: 22, dettesFinancieres: 148, dettesExploitation: 72, autresDettes: 23, totalPassif: 2878 },
      { annee: 2024, immobilisationsNettes: 2720, autresActifsImmobilises: 48, creancesClients: 30, tresorerie: 105, autresActifsCirculants: 37, totalActif: 2940, capitalSocial: 1620, primesEmission: 840, reportANouveau: 48, resultatExercice: 152, totalCapitauxPropres: 2660, provisions: 25, dettesFinancieres: 155, dettesExploitation: 75, autresDettes: 25, totalPassif: 2940 },
    ],
    comptesResultat: [
      { annee: 2023, produitsLocatifs: 178.5, autresProduits: 8.2, totalProduits: 186.7, chargesImmobilieres: 12.4, chargesGestion: 9.8, chargesFinancieres: 3.2, dotationsProvisions: 1.8, autresCharges: 1.5, totalCharges: 28.7, resultatCourant: 158.0, resultatExceptionnel: 0.0, resultatNet: 158.0, resultatNetParPart: 64.12 },
      { annee: 2024, produitsLocatifs: 175.2, autresProduits: 7.8, totalProduits: 183.0, chargesImmobilieres: 13.1, chargesGestion: 10.2, chargesFinancieres: 3.5, dotationsProvisions: 2.0, autresCharges: 2.2, totalCharges: 31.0, resultatCourant: 152.0, resultatExceptionnel: 0.0, resultatNet: 152.0, resultatNetParPart: 61.68 },
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
    bilans: [
      { annee: 2023, immobilisationsNettes: 580, autresActifsImmobilises: 12, creancesClients: 8, tresorerie: 45, autresActifsCirculants: 10, totalActif: 655, capitalSocial: 340, primesEmission: 180, reportANouveau: 18, resultatExercice: 42, totalCapitauxPropres: 580, provisions: 5, dettesFinancieres: 52, dettesExploitation: 12, autresDettes: 6, totalPassif: 655 },
      { annee: 2024, immobilisationsNettes: 620, autresActifsImmobilises: 14, creancesClients: 9, tresorerie: 38, autresActifsCirculants: 12, totalActif: 693, capitalSocial: 365, primesEmission: 192, reportANouveau: 15, resultatExercice: 46, totalCapitauxPropres: 618, provisions: 6, dettesFinancieres: 50, dettesExploitation: 13, autresDettes: 6, totalPassif: 693 },
    ],
    comptesResultat: [
      { annee: 2023, produitsLocatifs: 44.8, autresProduits: 2.1, totalProduits: 46.9, chargesImmobilieres: 2.2, chargesGestion: 1.8, chargesFinancieres: 0.6, dotationsProvisions: 0.2, autresCharges: 0.1, totalCharges: 4.9, resultatCourant: 42.0, resultatExceptionnel: 0.0, resultatNet: 42.0, resultatNetParPart: 13.55 },
      { annee: 2024, produitsLocatifs: 48.5, autresProduits: 2.3, totalProduits: 50.8, chargesImmobilieres: 2.4, chargesGestion: 1.9, chargesFinancieres: 0.5, dotationsProvisions: 0.3, autresCharges: 0.2, totalCharges: 5.3, resultatCourant: 45.5, resultatExceptionnel: 0.5, resultatNet: 46.0, resultatNetParPart: 14.08 },
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
    bilans: [
      { annee: 2023, immobilisationsNettes: 460, autresActifsImmobilises: 8, creancesClients: 6, tresorerie: 42, autresActifsCirculants: 8, totalActif: 524, capitalSocial: 270, primesEmission: 145, reportANouveau: 20, resultatExercice: 36, totalCapitauxPropres: 471, provisions: 3, dettesFinancieres: 38, dettesExploitation: 8, autresDettes: 4, totalPassif: 524 },
      { annee: 2024, immobilisationsNettes: 495, autresActifsImmobilises: 10, creancesClients: 7, tresorerie: 35, autresActifsCirculants: 9, totalActif: 556, capitalSocial: 290, primesEmission: 155, reportANouveau: 18, resultatExercice: 40, totalCapitauxPropres: 503, provisions: 4, dettesFinancieres: 36, dettesExploitation: 9, autresDettes: 4, totalPassif: 556 },
    ],
    comptesResultat: [
      { annee: 2023, produitsLocatifs: 38.2, autresProduits: 1.8, totalProduits: 40.0, chargesImmobilieres: 1.8, chargesGestion: 1.5, chargesFinancieres: 0.5, dotationsProvisions: 0.1, autresCharges: 0.1, totalCharges: 4.0, resultatCourant: 36.0, resultatExceptionnel: 0.0, resultatNet: 36.0, resultatNetParPart: 14.82 },
      { annee: 2024, produitsLocatifs: 42.5, autresProduits: 2.0, totalProduits: 44.5, chargesImmobilieres: 2.0, chargesGestion: 1.6, chargesFinancieres: 0.6, dotationsProvisions: 0.2, autresCharges: 0.1, totalCharges: 4.5, resultatCourant: 40.0, resultatExceptionnel: 0.0, resultatNet: 40.0, resultatNetParPart: 15.30 },
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
    bilans: [
      { annee: 2023, immobilisationsNettes: 3850, autresActifsImmobilises: 85, creancesClients: 42, tresorerie: 180, autresActifsCirculants: 55, totalActif: 4212, capitalSocial: 2280, primesEmission: 1200, reportANouveau: 82, resultatExercice: 178, totalCapitauxPropres: 3740, provisions: 45, dettesFinancieres: 320, dettesExploitation: 80, autresDettes: 27, totalPassif: 4212 },
      { annee: 2024, immobilisationsNettes: 3780, autresActifsImmobilises: 90, creancesClients: 45, tresorerie: 165, autresActifsCirculants: 52, totalActif: 4132, capitalSocial: 2260, primesEmission: 1180, reportANouveau: 75, resultatExercice: 165, totalCapitauxPropres: 3680, provisions: 48, dettesFinancieres: 295, dettesExploitation: 82, autresDettes: 27, totalPassif: 4132 },
    ],
    comptesResultat: [
      { annee: 2023, produitsLocatifs: 195.0, autresProduits: 9.5, totalProduits: 204.5, chargesImmobilieres: 10.2, chargesGestion: 8.5, chargesFinancieres: 5.8, dotationsProvisions: 1.2, autresCharges: 0.8, totalCharges: 26.5, resultatCourant: 178.0, resultatExceptionnel: 0.0, resultatNet: 178.0, resultatNetParPart: 8.55 },
      { annee: 2024, produitsLocatifs: 188.0, autresProduits: 8.8, totalProduits: 196.8, chargesImmobilieres: 12.5, chargesGestion: 9.0, chargesFinancieres: 6.2, dotationsProvisions: 2.5, autresCharges: 1.6, totalCharges: 31.8, resultatCourant: 165.0, resultatExceptionnel: 0.0, resultatNet: 165.0, resultatNetParPart: 7.93 },
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
    bilans: [
      { annee: 2023, immobilisationsNettes: 2850, autresActifsImmobilises: 62, creancesClients: 35, tresorerie: 150, autresActifsCirculants: 42, totalActif: 3139, capitalSocial: 1750, primesEmission: 920, reportANouveau: 68, resultatExercice: 142, totalCapitauxPropres: 2880, provisions: 28, dettesFinancieres: 145, dettesExploitation: 62, autresDettes: 24, totalPassif: 3139 },
      { annee: 2024, immobilisationsNettes: 2890, autresActifsImmobilises: 65, creancesClients: 38, tresorerie: 135, autresActifsCirculants: 40, totalActif: 3168, capitalSocial: 1780, primesEmission: 935, reportANouveau: 62, resultatExercice: 138, totalCapitauxPropres: 2915, provisions: 30, dettesFinancieres: 140, dettesExploitation: 58, autresDettes: 25, totalPassif: 3168 },
    ],
    comptesResultat: [
      { annee: 2023, produitsLocatifs: 158.0, autresProduits: 6.5, totalProduits: 164.5, chargesImmobilieres: 9.8, chargesGestion: 7.2, chargesFinancieres: 3.5, dotationsProvisions: 1.0, autresCharges: 1.0, totalCharges: 22.5, resultatCourant: 142.0, resultatExceptionnel: 0.0, resultatNet: 142.0, resultatNetParPart: 9.52 },
      { annee: 2024, produitsLocatifs: 155.0, autresProduits: 6.2, totalProduits: 161.2, chargesImmobilieres: 10.5, chargesGestion: 7.5, chargesFinancieres: 3.2, dotationsProvisions: 1.2, autresCharges: 0.8, totalCharges: 23.2, resultatCourant: 138.0, resultatExceptionnel: 0.0, resultatNet: 138.0, resultatNetParPart: 9.25 },
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
    bilans: [
      { annee: 2023, immobilisationsNettes: 185, autresActifsImmobilises: 5, creancesClients: 3, tresorerie: 18, autresActifsCirculants: 4, totalActif: 215, capitalSocial: 110, primesEmission: 58, reportANouveau: 12, resultatExercice: 15, totalCapitauxPropres: 195, provisions: 2, dettesFinancieres: 12, dettesExploitation: 4, autresDettes: 2, totalPassif: 215 },
      { annee: 2024, immobilisationsNettes: 198, autresActifsImmobilises: 5, creancesClients: 3, tresorerie: 15, autresActifsCirculants: 4, totalActif: 225, capitalSocial: 118, primesEmission: 62, reportANouveau: 10, resultatExercice: 17, totalCapitauxPropres: 207, provisions: 2, dettesFinancieres: 10, dettesExploitation: 4, autresDettes: 2, totalPassif: 225 },
    ],
    comptesResultat: [
      { annee: 2023, produitsLocatifs: 16.8, autresProduits: 0.8, totalProduits: 17.6, chargesImmobilieres: 0.8, chargesGestion: 0.7, chargesFinancieres: 0.2, dotationsProvisions: 0.1, autresCharges: 0.0, totalCharges: 1.8, resultatCourant: 15.0, resultatExceptionnel: 0.8, resultatNet: 15.8, resultatNetParPart: 14.88 },
      { annee: 2024, produitsLocatifs: 18.5, autresProduits: 0.9, totalProduits: 19.4, chargesImmobilieres: 0.9, chargesGestion: 0.8, chargesFinancieres: 0.2, dotationsProvisions: 0.1, autresCharges: 0.1, totalCharges: 2.1, resultatCourant: 17.0, resultatExceptionnel: 0.3, resultatNet: 17.3, resultatNetParPart: 15.52 },
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
    bilans: [
      { annee: 2023, immobilisationsNettes: 340, autresActifsImmobilises: 8, creancesClients: 5, tresorerie: 28, autresActifsCirculants: 6, totalActif: 387, capitalSocial: 195, primesEmission: 105, reportANouveau: 15, resultatExercice: 28, totalCapitauxPropres: 343, provisions: 4, dettesFinancieres: 28, dettesExploitation: 8, autresDettes: 4, totalPassif: 387 },
      { annee: 2024, immobilisationsNettes: 360, autresActifsImmobilises: 9, creancesClients: 5, tresorerie: 22, autresActifsCirculants: 7, totalActif: 403, capitalSocial: 208, primesEmission: 112, reportANouveau: 13, resultatExercice: 30, totalCapitauxPropres: 363, provisions: 4, dettesFinancieres: 25, dettesExploitation: 7, autresDettes: 4, totalPassif: 403 },
    ],
    comptesResultat: [
      { annee: 2023, produitsLocatifs: 30.5, autresProduits: 1.5, totalProduits: 32.0, chargesImmobilieres: 1.5, chargesGestion: 1.2, chargesFinancieres: 0.4, dotationsProvisions: 0.2, autresCharges: 0.7, totalCharges: 4.0, resultatCourant: 28.0, resultatExceptionnel: 0.0, resultatNet: 28.0, resultatNetParPart: 11.42 },
      { annee: 2024, produitsLocatifs: 33.2, autresProduits: 1.6, totalProduits: 34.8, chargesImmobilieres: 1.6, chargesGestion: 1.3, chargesFinancieres: 0.4, dotationsProvisions: 0.3, autresCharges: 1.2, totalCharges: 4.8, resultatCourant: 30.0, resultatExceptionnel: 0.0, resultatNet: 30.0, resultatNetParPart: 11.85 },
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
    bilans: [
      { annee: 2023, immobilisationsNettes: 3500, autresActifsImmobilises: 75, creancesClients: 40, tresorerie: 200, autresActifsCirculants: 50, totalActif: 3865, capitalSocial: 2150, primesEmission: 1100, reportANouveau: 98, resultatExercice: 168, totalCapitauxPropres: 3516, provisions: 35, dettesFinancieres: 220, dettesExploitation: 68, autresDettes: 26, totalPassif: 3865 },
      { annee: 2024, immobilisationsNettes: 3520, autresActifsImmobilises: 78, creancesClients: 42, tresorerie: 185, autresActifsCirculants: 48, totalActif: 3873, capitalSocial: 2180, primesEmission: 1110, reportANouveau: 92, resultatExercice: 170, totalCapitauxPropres: 3552, provisions: 32, dettesFinancieres: 200, dettesExploitation: 65, autresDettes: 24, totalPassif: 3873 },
    ],
    comptesResultat: [
      { annee: 2023, produitsLocatifs: 192.0, autresProduits: 8.0, totalProduits: 200.0, chargesImmobilieres: 12.0, chargesGestion: 8.8, chargesFinancieres: 5.5, dotationsProvisions: 2.2, autresCharges: 3.5, totalCharges: 32.0, resultatCourant: 168.0, resultatExceptionnel: 0.0, resultatNet: 168.0, resultatNetParPart: 15.05 },
      { annee: 2024, produitsLocatifs: 195.0, autresProduits: 8.5, totalProduits: 203.5, chargesImmobilieres: 12.5, chargesGestion: 9.0, chargesFinancieres: 5.2, dotationsProvisions: 2.3, autresCharges: 4.5, totalCharges: 33.5, resultatCourant: 170.0, resultatExceptionnel: 0.0, resultatNet: 170.0, resultatNetParPart: 15.22 },
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
    bilans: [
      { annee: 2023, immobilisationsNettes: 2680, autresActifsImmobilises: 55, creancesClients: 30, tresorerie: 140, autresActifsCirculants: 38, totalActif: 2943, capitalSocial: 1580, primesEmission: 850, reportANouveau: 72, resultatExercice: 135, totalCapitauxPropres: 2637, provisions: 22, dettesFinancieres: 195, dettesExploitation: 65, autresDettes: 24, totalPassif: 2943 },
      { annee: 2024, immobilisationsNettes: 2720, autresActifsImmobilises: 58, creancesClients: 32, tresorerie: 130, autresActifsCirculants: 40, totalActif: 2980, capitalSocial: 1620, primesEmission: 870, reportANouveau: 68, resultatExercice: 140, totalCapitauxPropres: 2698, provisions: 25, dettesFinancieres: 170, dettesExploitation: 62, autresDettes: 25, totalPassif: 2980 },
    ],
    comptesResultat: [
      { annee: 2023, produitsLocatifs: 152.0, autresProduits: 6.5, totalProduits: 158.5, chargesImmobilieres: 8.5, chargesGestion: 7.0, chargesFinancieres: 4.2, dotationsProvisions: 1.5, autresCharges: 2.3, totalCharges: 23.5, resultatCourant: 135.0, resultatExceptionnel: 0.0, resultatNet: 135.0, resultatNetParPart: 9.31 },
      { annee: 2024, produitsLocatifs: 158.0, autresProduits: 7.0, totalProduits: 165.0, chargesImmobilieres: 9.0, chargesGestion: 7.5, chargesFinancieres: 4.5, dotationsProvisions: 1.8, autresCharges: 2.2, totalCharges: 25.0, resultatCourant: 140.0, resultatExceptionnel: 0.0, resultatNet: 140.0, resultatNetParPart: 9.66 },
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
    bilans: [
      { annee: 2023, immobilisationsNettes: 1750, autresActifsImmobilises: 35, creancesClients: 20, tresorerie: 95, autresActifsCirculants: 28, totalActif: 1928, capitalSocial: 1080, primesEmission: 580, reportANouveau: 42, resultatExercice: 98, totalCapitauxPropres: 1800, provisions: 15, dettesFinancieres: 75, dettesExploitation: 28, autresDettes: 10, totalPassif: 1928 },
      { annee: 2024, immobilisationsNettes: 1820, autresActifsImmobilises: 38, creancesClients: 22, tresorerie: 85, autresActifsCirculants: 30, totalActif: 1995, capitalSocial: 1120, primesEmission: 600, reportANouveau: 38, resultatExercice: 102, totalCapitauxPropres: 1860, provisions: 18, dettesFinancieres: 78, dettesExploitation: 28, autresDettes: 11, totalPassif: 1995 },
    ],
    comptesResultat: [
      { annee: 2023, produitsLocatifs: 108.0, autresProduits: 5.0, totalProduits: 113.0, chargesImmobilieres: 5.5, chargesGestion: 4.8, chargesFinancieres: 2.2, dotationsProvisions: 0.8, autresCharges: 1.7, totalCharges: 15.0, resultatCourant: 98.0, resultatExceptionnel: 0.0, resultatNet: 98.0, resultatNetParPart: 10.06 },
      { annee: 2024, produitsLocatifs: 115.0, autresProduits: 5.5, totalProduits: 120.5, chargesImmobilieres: 6.0, chargesGestion: 5.2, chargesFinancieres: 2.5, dotationsProvisions: 1.0, autresCharges: 3.8, totalCharges: 18.5, resultatCourant: 102.0, resultatExceptionnel: 0.0, resultatNet: 102.0, resultatNetParPart: 10.47 },
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
    bilans: [
      { annee: 2023, immobilisationsNettes: 2320, autresActifsImmobilises: 50, creancesClients: 32, tresorerie: 120, autresActifsCirculants: 38, totalActif: 2560, capitalSocial: 1380, primesEmission: 720, reportANouveau: 78, resultatExercice: 98, totalCapitauxPropres: 2276, provisions: 28, dettesFinancieres: 182, dettesExploitation: 52, autresDettes: 22, totalPassif: 2560 },
      { annee: 2024, immobilisationsNettes: 2280, autresActifsImmobilises: 52, creancesClients: 35, tresorerie: 110, autresActifsCirculants: 35, totalActif: 2512, capitalSocial: 1350, primesEmission: 700, reportANouveau: 72, resultatExercice: 95, totalCapitauxPropres: 2217, provisions: 30, dettesFinancieres: 195, dettesExploitation: 48, autresDettes: 22, totalPassif: 2512 },
    ],
    comptesResultat: [
      { annee: 2023, produitsLocatifs: 118.0, autresProduits: 5.0, totalProduits: 123.0, chargesImmobilieres: 8.5, chargesGestion: 6.5, chargesFinancieres: 5.8, dotationsProvisions: 2.5, autresCharges: 1.7, totalCharges: 25.0, resultatCourant: 98.0, resultatExceptionnel: 0.0, resultatNet: 98.0, resultatNetParPart: 7.68 },
      { annee: 2024, produitsLocatifs: 115.0, autresProduits: 4.8, totalProduits: 119.8, chargesImmobilieres: 8.8, chargesGestion: 6.2, chargesFinancieres: 6.0, dotationsProvisions: 2.0, autresCharges: 1.8, totalCharges: 24.8, resultatCourant: 95.0, resultatExceptionnel: 0.0, resultatNet: 95.0, resultatNetParPart: 7.45 },
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
    bilans: [
      { annee: 2023, immobilisationsNettes: 990, autresActifsImmobilises: 22, creancesClients: 12, tresorerie: 65, autresActifsCirculants: 18, totalActif: 1107, capitalSocial: 610, primesEmission: 320, reportANouveau: 28, resultatExercice: 55, totalCapitauxPropres: 1013, provisions: 10, dettesFinancieres: 58, dettesExploitation: 18, autresDettes: 8, totalPassif: 1107 },
      { annee: 2024, immobilisationsNettes: 1020, autresActifsImmobilises: 24, creancesClients: 13, tresorerie: 55, autresActifsCirculants: 16, totalActif: 1128, capitalSocial: 630, primesEmission: 335, reportANouveau: 25, resultatExercice: 58, totalCapitauxPropres: 1048, provisions: 8, dettesFinancieres: 48, dettesExploitation: 16, autresDettes: 8, totalPassif: 1128 },
    ],
    comptesResultat: [
      { annee: 2023, produitsLocatifs: 62.0, autresProduits: 2.8, totalProduits: 64.8, chargesImmobilieres: 3.5, chargesGestion: 2.8, chargesFinancieres: 1.5, dotationsProvisions: 0.5, autresCharges: 1.5, totalCharges: 9.8, resultatCourant: 55.0, resultatExceptionnel: 0.0, resultatNet: 55.0, resultatNetParPart: 30.52 },
      { annee: 2024, produitsLocatifs: 65.0, autresProduits: 3.0, totalProduits: 68.0, chargesImmobilieres: 3.8, chargesGestion: 3.0, chargesFinancieres: 1.2, dotationsProvisions: 0.5, autresCharges: 1.5, totalCharges: 10.0, resultatCourant: 58.0, resultatExceptionnel: 0.0, resultatNet: 58.0, resultatNetParPart: 32.20 },
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

  // ============================================================
  // SCPI IMPORTEES DEPUIS INPUT/
  // ============================================================

  buildSCPI({
    id: 'acces-valeur-pierre',
    nom: 'Acces Valeur Pierre',
    societeGestion: 'BNP Paribas REIM',
    type: 'SCPI',
    categorie: 'Bureaux',
    capitalType: 'variable',
    creationDate: '1979-01-01',
    anciennete: 46,
    prixPart: 765,
    prixRetrait: 696.69,
    valeurReconstitution: 773.74,
    td: 3.53,
    tdN1: 3.50,
    tri5ans: 5.29,
    tri10ans: 7.92,
    fraisSouscription: 8.93,
    fraisGestion: 0.96,
    tof: 89.4,
    capitalisation: 1770000000,
    collecteNette: -15000000,
    ratioEndettement: 16.5,
    reportANouveau: 10.93,
    pgr: 2.0,
    nbAssocies: 25501,
    nbImmeubles: 67,
    esg: true,
    partRevenusEtrangers: 0,
    partPlusValues: 5,
    repartitionGeo: [
      { pays: 'Paris intra-muros', pct: 73.6 }, { pays: 'Region parisienne', pct: 21.3 }, { pays: 'Province', pct: 5.0 },
    ],
    repartitionSectorielle: [
      { secteur: 'Bureaux', pct: 92.4 }, { secteur: 'Commerces', pct: 7.6 },
    ],
    historique: [
      { annee: 2020, td: 3.72, prixPart: 645, dividende: 24.00 },
      { annee: 2021, td: 3.86, prixPart: 645, dividende: 24.92 },
      { annee: 2022, td: 4.45, prixPart: 840, dividende: 26.25 },
      { annee: 2023, td: 3.50, prixPart: 840, dividende: 29.44 },
      { annee: 2024, td: 3.53, prixPart: 765, dividende: 29.66 },
    ],
    bilans: [
      { annee: 2023, immobilisationsNettes: 1680, autresActifsImmobilises: 26.7, creancesClients: 22, tresorerie: 85, autresActifsCirculants: 30, totalActif: 1843.7, capitalSocial: 547.6, primesEmission: 680, reportANouveau: 31.0, resultatExercice: 57.2, totalCapitauxPropres: 1315.8, provisions: 18, dettesFinancieres: 292.8, dettesExploitation: 45, autresDettes: 172.1, totalPassif: 1843.7 },
      { annee: 2024, immobilisationsNettes: 1600, autresActifsImmobilises: 26.7, creancesClients: 24, tresorerie: 78, autresActifsCirculants: 28, totalActif: 1756.7, capitalSocial: 547.6, primesEmission: 680, reportANouveau: 26.1, resultatExercice: 57.2, totalCapitauxPropres: 1310.9, provisions: 15, dettesFinancieres: 292.8, dettesExploitation: 42, autresDettes: 96, totalPassif: 1756.7 },
    ],
    comptesResultat: [
      { annee: 2023, produitsLocatifs: 84.5, autresProduits: 2.0, totalProduits: 86.5, chargesImmobilieres: 8.2, chargesGestion: 8.1, chargesFinancieres: 7.5, dotationsProvisions: 1.5, autresCharges: 4.0, totalCharges: 29.3, resultatCourant: 57.2, resultatExceptionnel: 0.0, resultatNet: 57.2, resultatNetParPart: 23.93 },
      { annee: 2024, produitsLocatifs: 82.3, autresProduits: 1.5, totalProduits: 83.8, chargesImmobilieres: 8.3, chargesGestion: 8.1, chargesFinancieres: 7.5, dotationsProvisions: 1.2, autresCharges: 3.0, totalCharges: 28.1, resultatCourant: 55.7, resultatExceptionnel: 1.5, resultatNet: 57.2, resultatNetParPart: 23.93 },
    ],
    immeubles: [
      { nom: 'Tour Mattei', adresse: '205 rue de Bercy', ville: 'Paris', pays: 'France', lat: 48.839, lng: 2.384, type: 'Bureaux', surface: 10190, locataire: 'Multi-locataires', loyer: 2800000 },
      { nom: 'Wagram', adresse: '31-37 avenue de Wagram', ville: 'Paris', pays: 'France', lat: 48.878, lng: 2.297, type: 'Bureaux', surface: 14284, locataire: 'Multi-locataires', loyer: 4200000 },
      { nom: 'CDG Neuilly', adresse: '185 avenue Charles de Gaulle', ville: 'Neuilly-sur-Seine', pays: 'France', lat: 48.884, lng: 2.260, type: 'Bureaux', surface: 13913, locataire: 'Multi-locataires', loyer: 3800000 },
      { nom: 'Panhard Levassor', adresse: '25 quai Panhard et Levassor', ville: 'Paris', pays: 'France', lat: 48.833, lng: 2.375, type: 'Bureaux', surface: 8326, locataire: 'Multi-locataires', loyer: 2200000 },
    ],
    avis: [
      { auteur: 'Michel R.', date: '2024-10-15', note: 3, commentaire: 'SCPI historique mais le TOF a 89,4% et le RAN en baisse sont preoccupants. Beau patrimoine parisien neanmoins.', verifie: true, detenteurDepuis: '2010' },
      { auteur: 'Catherine B.', date: '2024-08-20', note: 3, commentaire: 'Prix de part en forte baisse (-8,9%). La qualite des actifs Paris QCA devrait soutenir a terme.', verifie: true, detenteurDepuis: '2015' },
    ],
  }),

  buildSCPI({
    id: 'accimmo-pierre',
    nom: 'Accimmo Pierre',
    societeGestion: 'BNP Paribas REIM',
    type: 'SCPI',
    categorie: 'Bureaux',
    capitalType: 'variable',
    creationDate: '1990-01-01',
    anciennete: 35,
    prixPart: 180,
    prixRetrait: 163.80,
    valeurReconstitution: 189.54,
    td: 4.28,
    tdN1: 4.15,
    tri5ans: 3.85,
    tri10ans: 4.12,
    fraisSouscription: 9.00,
    fraisGestion: 0.96,
    tof: 91.2,
    capitalisation: 980000000,
    collecteNette: -8000000,
    ratioEndettement: 14.8,
    reportANouveau: 12.50,
    pgr: 1.8,
    nbAssocies: 14200,
    nbImmeubles: 42,
    esg: true,
    partRevenusEtrangers: 15,
    partPlusValues: 4,
    repartitionGeo: [
      { pays: 'Ile-de-France', pct: 72 }, { pays: 'Province', pct: 18 }, { pays: 'Europe', pct: 10 },
    ],
    repartitionSectorielle: [
      { secteur: 'Bureaux', pct: 85 }, { secteur: 'Commerces', pct: 10 }, { secteur: 'Logistique', pct: 5 },
    ],
    historique: [
      { annee: 2020, td: 4.02, prixPart: 195, dividende: 7.84 },
      { annee: 2021, td: 4.10, prixPart: 195, dividende: 8.00 },
      { annee: 2022, td: 4.15, prixPart: 195, dividende: 8.09 },
      { annee: 2023, td: 4.15, prixPart: 195, dividende: 8.09 },
      { annee: 2024, td: 4.28, prixPart: 180, dividende: 7.70 },
    ],
    bilans: [
      { annee: 2023, immobilisationsNettes: 890, autresActifsImmobilises: 18, creancesClients: 12, tresorerie: 52, autresActifsCirculants: 15, totalActif: 987, capitalSocial: 520, primesEmission: 280, reportANouveau: 25, resultatExercice: 38, totalCapitauxPropres: 863, provisions: 12, dettesFinancieres: 78, dettesExploitation: 25, autresDettes: 9, totalPassif: 987 },
      { annee: 2024, immobilisationsNettes: 860, autresActifsImmobilises: 18, creancesClients: 13, tresorerie: 45, autresActifsCirculants: 14, totalActif: 950, capitalSocial: 510, primesEmission: 272, reportANouveau: 22, resultatExercice: 36, totalCapitauxPropres: 840, provisions: 10, dettesFinancieres: 68, dettesExploitation: 23, autresDettes: 9, totalPassif: 950 },
    ],
    comptesResultat: [
      { annee: 2023, produitsLocatifs: 48.5, autresProduits: 2.0, totalProduits: 50.5, chargesImmobilieres: 4.2, chargesGestion: 3.8, chargesFinancieres: 2.5, dotationsProvisions: 0.8, autresCharges: 1.2, totalCharges: 12.5, resultatCourant: 38.0, resultatExceptionnel: 0.0, resultatNet: 38.0, resultatNetParPart: 6.98 },
      { annee: 2024, produitsLocatifs: 46.2, autresProduits: 1.8, totalProduits: 48.0, chargesImmobilieres: 4.5, chargesGestion: 3.5, chargesFinancieres: 2.2, dotationsProvisions: 0.5, autresCharges: 1.3, totalCharges: 12.0, resultatCourant: 36.0, resultatExceptionnel: 0.0, resultatNet: 36.0, resultatNetParPart: 6.62 },
    ],
    immeubles: [
      { nom: 'Immeuble Le Lumiere', adresse: '40 avenue des Terroirs de France', ville: 'Paris', pays: 'France', lat: 48.835, lng: 2.386, type: 'Bureaux', surface: 8500, locataire: 'Multi-locataires', loyer: 2100000 },
      { nom: 'Le Monge', adresse: '22 rue Monge', ville: 'Paris', pays: 'France', lat: 48.850, lng: 2.352, type: 'Bureaux', surface: 3200, locataire: 'SNCF', loyer: 850000 },
    ],
    avis: [
      { auteur: 'Philippe G.', date: '2024-09-25', note: 3, commentaire: 'SCPI classique de bureaux IdF. Rendement moyen, patrimoine vieillissant.', verifie: true, detenteurDepuis: '2012' },
    ],
  }),

  buildSCPI({
    id: 'allianz-home',
    nom: 'Allianz Home',
    societeGestion: 'Immovalor Gestion',
    type: 'SCPI',
    categorie: 'Residentiel',
    capitalType: 'variable',
    creationDate: '2019-06-01',
    anciennete: 6,
    prixPart: 340,
    prixRetrait: 323.00,
    valeurReconstitution: 352.40,
    td: 3.10,
    tdN1: 3.05,
    tri5ans: 2.85,
    tri10ans: 0,
    fraisSouscription: 5.00,
    fraisGestion: 0.80,
    tof: 96.8,
    capitalisation: 280000000,
    collecteNette: 45000000,
    ratioEndettement: 8.5,
    reportANouveau: 8.20,
    pgr: 0.5,
    nbAssocies: 5800,
    nbImmeubles: 28,
    esg: true,
    partRevenusEtrangers: 0,
    partPlusValues: 2,
    repartitionGeo: [
      { pays: 'France', pct: 100 },
    ],
    repartitionSectorielle: [
      { secteur: 'Residentiel', pct: 95 }, { secteur: 'Commerces', pct: 5 },
    ],
    historique: [
      { annee: 2020, td: 2.80, prixPart: 340, dividende: 9.52 },
      { annee: 2021, td: 2.90, prixPart: 340, dividende: 9.86 },
      { annee: 2022, td: 3.05, prixPart: 340, dividende: 10.37 },
      { annee: 2023, td: 3.05, prixPart: 340, dividende: 10.37 },
      { annee: 2024, td: 3.10, prixPart: 340, dividende: 10.54 },
    ],
    bilans: [
      { annee: 2023, immobilisationsNettes: 255, autresActifsImmobilises: 5, creancesClients: 3, tresorerie: 18, autresActifsCirculants: 4, totalActif: 285, capitalSocial: 155, primesEmission: 82, reportANouveau: 8, resultatExercice: 9, totalCapitauxPropres: 254, provisions: 3, dettesFinancieres: 20, dettesExploitation: 5, autresDettes: 3, totalPassif: 285 },
      { annee: 2024, immobilisationsNettes: 268, autresActifsImmobilises: 5, creancesClients: 3, tresorerie: 15, autresActifsCirculants: 4, totalActif: 295, capitalSocial: 162, primesEmission: 85, reportANouveau: 7, resultatExercice: 10, totalCapitauxPropres: 264, provisions: 3, dettesFinancieres: 18, dettesExploitation: 6, autresDettes: 4, totalPassif: 295 },
    ],
    comptesResultat: [
      { annee: 2023, produitsLocatifs: 10.8, autresProduits: 0.5, totalProduits: 11.3, chargesImmobilieres: 0.8, chargesGestion: 0.6, chargesFinancieres: 0.3, dotationsProvisions: 0.2, autresCharges: 0.4, totalCharges: 2.3, resultatCourant: 9.0, resultatExceptionnel: 0.0, resultatNet: 9.0, resultatNetParPart: 9.85 },
      { annee: 2024, produitsLocatifs: 12.0, autresProduits: 0.5, totalProduits: 12.5, chargesImmobilieres: 0.9, chargesGestion: 0.6, chargesFinancieres: 0.3, dotationsProvisions: 0.2, autresCharges: 0.5, totalCharges: 2.5, resultatCourant: 10.0, resultatExceptionnel: 0.0, resultatNet: 10.0, resultatNetParPart: 10.15 },
    ],
    immeubles: [
      { nom: 'Residence Parc Monceau', adresse: '15 rue de Prony', ville: 'Paris', pays: 'France', lat: 48.880, lng: 2.308, type: 'Residentiel', surface: 2200, locataire: 'Multi-locataires', loyer: 480000 },
      { nom: 'Les Jardins de Sceaux', adresse: '8 avenue du President Roosevelt', ville: 'Sceaux', pays: 'France', lat: 48.777, lng: 2.292, type: 'Residentiel', surface: 3500, locataire: 'Multi-locataires', loyer: 520000 },
    ],
    avis: [
      { auteur: 'Laurence D.', date: '2024-10-08', note: 4, commentaire: 'Placement stable et securisant. Le residentiel parisien reste une valeur refuge.', verifie: true, detenteurDepuis: '2020' },
    ],
  }),

  buildSCPI({
    id: 'allianz-pierre',
    nom: 'Allianz Pierre',
    societeGestion: 'Immovalor Gestion',
    type: 'SCPI',
    categorie: 'Bureaux',
    capitalType: 'fixe',
    creationDate: '1985-01-01',
    anciennete: 40,
    prixPart: 345,
    prixRetrait: 310.50,
    valeurReconstitution: 362.25,
    td: 3.88,
    tdN1: 3.90,
    tri5ans: 3.15,
    tri10ans: 4.25,
    fraisSouscription: 10.00,
    fraisGestion: 0.84,
    tof: 90.5,
    capitalisation: 1450000000,
    collecteNette: 0,
    ratioEndettement: 12.0,
    reportANouveau: 15.80,
    pgr: 2.5,
    nbAssocies: 18500,
    nbImmeubles: 55,
    esg: false,
    partRevenusEtrangers: 10,
    partPlusValues: 6,
    repartitionGeo: [
      { pays: 'Paris QCA', pct: 52 }, { pays: 'Region parisienne', pct: 35 }, { pays: 'Province', pct: 8 }, { pays: 'Europe', pct: 5 },
    ],
    repartitionSectorielle: [
      { secteur: 'Bureaux', pct: 88 }, { secteur: 'Commerces', pct: 8 }, { secteur: 'Hotels', pct: 4 },
    ],
    historique: [
      { annee: 2019, td: 4.02, prixPart: 370, dividende: 14.87 },
      { annee: 2020, td: 3.78, prixPart: 370, dividende: 13.99 },
      { annee: 2021, td: 3.80, prixPart: 370, dividende: 14.06 },
      { annee: 2022, td: 3.90, prixPart: 370, dividende: 14.43 },
      { annee: 2023, td: 3.90, prixPart: 365, dividende: 14.24 },
      { annee: 2024, td: 3.88, prixPart: 345, dividende: 13.39 },
    ],
    bilans: [
      { annee: 2023, immobilisationsNettes: 1320, autresActifsImmobilises: 28, creancesClients: 18, tresorerie: 72, autresActifsCirculants: 22, totalActif: 1460, capitalSocial: 820, primesEmission: 430, reportANouveau: 35, resultatExercice: 52, totalCapitauxPropres: 1337, provisions: 15, dettesFinancieres: 72, dettesExploitation: 25, autresDettes: 11, totalPassif: 1460 },
      { annee: 2024, immobilisationsNettes: 1280, autresActifsImmobilises: 28, creancesClients: 20, tresorerie: 65, autresActifsCirculants: 20, totalActif: 1413, capitalSocial: 800, primesEmission: 420, reportANouveau: 32, resultatExercice: 48, totalCapitauxPropres: 1300, provisions: 12, dettesFinancieres: 68, dettesExploitation: 22, autresDettes: 11, totalPassif: 1413 },
    ],
    comptesResultat: [
      { annee: 2023, produitsLocatifs: 62.5, autresProduits: 2.8, totalProduits: 65.3, chargesImmobilieres: 4.8, chargesGestion: 3.5, chargesFinancieres: 2.2, dotationsProvisions: 1.0, autresCharges: 1.8, totalCharges: 13.3, resultatCourant: 52.0, resultatExceptionnel: 0.0, resultatNet: 52.0, resultatNetParPart: 12.38 },
      { annee: 2024, produitsLocatifs: 58.8, autresProduits: 2.5, totalProduits: 61.3, chargesImmobilieres: 5.0, chargesGestion: 3.5, chargesFinancieres: 2.0, dotationsProvisions: 0.8, autresCharges: 2.0, totalCharges: 13.3, resultatCourant: 48.0, resultatExceptionnel: 0.0, resultatNet: 48.0, resultatNetParPart: 11.43 },
    ],
    immeubles: [
      { nom: 'Haussmann Saint-Lazare', adresse: '100 rue Saint-Lazare', ville: 'Paris', pays: 'France', lat: 48.878, lng: 2.325, type: 'Bureaux', surface: 7500, locataire: 'Axa France', loyer: 2400000 },
      { nom: 'La Defense Plaza', adresse: '1 place de la Defense', ville: 'Courbevoie', pays: 'France', lat: 48.892, lng: 2.237, type: 'Bureaux', surface: 12000, locataire: 'Total Energies', loyer: 3800000 },
      { nom: 'Carrefour de la Croix-Rouge', adresse: '3 rue de Sevres', ville: 'Paris', pays: 'France', lat: 48.851, lng: 2.327, type: 'Commerces', surface: 1200, locataire: 'Multi-locataires', loyer: 580000 },
    ],
    avis: [
      { auteur: 'Henri P.', date: '2024-07-15', note: 3, commentaire: 'SCPI a capital fixe historique. Patrimoine de qualite mais rendement en baisse et liquidite limitee.', verifie: true, detenteurDepuis: '2008' },
    ],
  }),

  buildSCPI({
    id: 'alta-convictions',
    nom: 'Alta Convictions',
    societeGestion: 'Altarea Investment Managers',
    type: 'SCPI',
    categorie: 'Diversifiee',
    capitalType: 'variable',
    creationDate: '2023-06-01',
    anciennete: 2,
    prixPart: 250,
    prixRetrait: 250,
    valeurReconstitution: 261.50,
    td: 6.50,
    tdN1: 0,
    tri5ans: 0,
    tri10ans: 0,
    fraisSouscription: 0,
    fraisGestion: 1.50,
    tof: 99.5,
    capitalisation: 120000000,
    collecteNette: 95000000,
    ratioEndettement: 10.0,
    reportANouveau: 5.00,
    pgr: 0.2,
    nbAssocies: 3200,
    nbImmeubles: 12,
    esg: true,
    partRevenusEtrangers: 70,
    partPlusValues: 0,
    repartitionGeo: [
      { pays: 'Espagne', pct: 35 }, { pays: 'France', pct: 30 }, { pays: 'Italie', pct: 20 }, { pays: 'Portugal', pct: 15 },
    ],
    repartitionSectorielle: [
      { secteur: 'Bureaux', pct: 35 }, { secteur: 'Commerces', pct: 30 }, { secteur: 'Logistique', pct: 20 }, { secteur: 'Sante', pct: 15 },
    ],
    historique: [
      { annee: 2023, td: 0, prixPart: 250, dividende: 0 },
      { annee: 2024, td: 6.50, prixPart: 250, dividende: 16.25 },
    ],
    bilans: [
      { annee: 2024, immobilisationsNettes: 108, autresActifsImmobilises: 3, creancesClients: 2, tresorerie: 12, autresActifsCirculants: 3, totalActif: 128, capitalSocial: 68, primesEmission: 35, reportANouveau: 3, resultatExercice: 8, totalCapitauxPropres: 114, provisions: 1, dettesFinancieres: 8, dettesExploitation: 3, autresDettes: 2, totalPassif: 128 },
    ],
    comptesResultat: [
      { annee: 2024, produitsLocatifs: 9.5, autresProduits: 0.4, totalProduits: 9.9, chargesImmobilieres: 0.5, chargesGestion: 0.4, chargesFinancieres: 0.2, dotationsProvisions: 0.1, autresCharges: 0.3, totalCharges: 1.5, resultatCourant: 8.0, resultatExceptionnel: 0.4, resultatNet: 8.4, resultatNetParPart: 15.18 },
    ],
    immeubles: [
      { nom: 'Torre Europa', adresse: 'Paseo de la Castellana 95', ville: 'Madrid', pays: 'Espagne', lat: 40.457, lng: -3.692, type: 'Bureaux', surface: 4500, locataire: 'Telefonica', loyer: 850000 },
      { nom: 'Retail Park Milano', adresse: 'Via Tortona 33', ville: 'Milan', pays: 'Italie', lat: 45.449, lng: 9.165, type: 'Commerces', surface: 3200, locataire: 'Multi-locataires', loyer: 520000 },
    ],
    avis: [
      { auteur: 'Julien M.', date: '2024-12-01', note: 5, commentaire: 'Nouvelle SCPI prometteuse avec 0% frais d\'entree et un TD inaugural tres attractif.', verifie: true, detenteurDepuis: '2023' },
    ],
  }),

  buildSCPI({
    id: 'altixia-cadence-xii',
    nom: 'Altixia Cadence XII',
    societeGestion: 'Altixia REIM',
    type: 'SCPI',
    categorie: 'Diversifiee',
    capitalType: 'variable',
    creationDate: '2017-09-01',
    anciennete: 8,
    prixPart: 190,
    prixRetrait: 172.90,
    valeurReconstitution: 199.50,
    td: 5.20,
    tdN1: 5.55,
    tri5ans: 4.50,
    tri10ans: 0,
    fraisSouscription: 9.00,
    fraisGestion: 0.96,
    tof: 93.5,
    capitalisation: 420000000,
    collecteNette: 25000000,
    ratioEndettement: 18.2,
    reportANouveau: 14.50,
    pgr: 1.2,
    nbAssocies: 8500,
    nbImmeubles: 35,
    esg: false,
    partRevenusEtrangers: 20,
    partPlusValues: 3,
    repartitionGeo: [
      { pays: 'France', pct: 80 }, { pays: 'Espagne', pct: 10 }, { pays: 'Italie', pct: 10 },
    ],
    repartitionSectorielle: [
      { secteur: 'Bureaux', pct: 45 }, { secteur: 'Commerces', pct: 25 }, { secteur: 'Logistique', pct: 15 }, { secteur: 'Sante', pct: 15 },
    ],
    historique: [
      { annee: 2020, td: 5.50, prixPart: 200, dividende: 11.00 },
      { annee: 2021, td: 5.55, prixPart: 200, dividende: 11.10 },
      { annee: 2022, td: 5.55, prixPart: 200, dividende: 11.10 },
      { annee: 2023, td: 5.55, prixPart: 200, dividende: 11.10 },
      { annee: 2024, td: 5.20, prixPart: 190, dividende: 9.88 },
    ],
    bilans: [
      { annee: 2023, immobilisationsNettes: 380, autresActifsImmobilises: 8, creancesClients: 5, tresorerie: 25, autresActifsCirculants: 7, totalActif: 425, capitalSocial: 220, primesEmission: 118, reportANouveau: 14, resultatExercice: 22, totalCapitauxPropres: 374, provisions: 5, dettesFinancieres: 32, dettesExploitation: 10, autresDettes: 4, totalPassif: 425 },
      { annee: 2024, immobilisationsNettes: 375, autresActifsImmobilises: 8, creancesClients: 6, tresorerie: 20, autresActifsCirculants: 7, totalActif: 416, capitalSocial: 215, primesEmission: 115, reportANouveau: 12, resultatExercice: 20, totalCapitauxPropres: 362, provisions: 5, dettesFinancieres: 35, dettesExploitation: 10, autresDettes: 4, totalPassif: 416 },
    ],
    comptesResultat: [
      { annee: 2023, produitsLocatifs: 25.5, autresProduits: 1.2, totalProduits: 26.7, chargesImmobilieres: 1.8, chargesGestion: 1.2, chargesFinancieres: 0.8, dotationsProvisions: 0.3, autresCharges: 0.6, totalCharges: 4.7, resultatCourant: 22.0, resultatExceptionnel: 0.0, resultatNet: 22.0, resultatNetParPart: 10.28 },
      { annee: 2024, produitsLocatifs: 24.2, autresProduits: 1.0, totalProduits: 25.2, chargesImmobilieres: 2.0, chargesGestion: 1.2, chargesFinancieres: 0.8, dotationsProvisions: 0.4, autresCharges: 0.8, totalCharges: 5.2, resultatCourant: 20.0, resultatExceptionnel: 0.0, resultatNet: 20.0, resultatNetParPart: 9.35 },
    ],
    immeubles: [
      { nom: 'Les Docks de Saint-Ouen', adresse: '20 rue des Docks', ville: 'Saint-Ouen', pays: 'France', lat: 48.912, lng: 2.328, type: 'Bureaux', surface: 5200, locataire: 'Multi-locataires', loyer: 980000 },
      { nom: 'Centre Medical Nimes', adresse: '15 boulevard de la Liberation', ville: 'Nimes', pays: 'France', lat: 43.835, lng: 4.360, type: 'Sante', surface: 1800, locataire: 'Clinique du Pont du Gard', loyer: 280000 },
    ],
    avis: [
      { auteur: 'Damien F.', date: '2024-09-10', note: 3, commentaire: 'Prix de part en baisse, rendement correct mais endettement assez eleve.', verifie: true, detenteurDepuis: '2019' },
    ],
  }),

  buildSCPI({
    id: 'elysees-pierre',
    nom: 'Elysees Pierre',
    societeGestion: 'HSBC REIM',
    type: 'SCPI',
    categorie: 'Bureaux',
    capitalType: 'variable',
    creationDate: '1986-01-01',
    anciennete: 39,
    prixPart: 640,
    prixRetrait: 576.00,
    valeurReconstitution: 672.00,
    td: 3.80,
    tdN1: 3.72,
    tri5ans: 2.95,
    tri10ans: 3.85,
    fraisSouscription: 10.00,
    fraisGestion: 0.96,
    tof: 87.2,
    capitalisation: 2100000000,
    collecteNette: -25000000,
    ratioEndettement: 20.5,
    reportANouveau: 18.50,
    pgr: 3.0,
    nbAssocies: 32000,
    nbImmeubles: 78,
    esg: false,
    partRevenusEtrangers: 5,
    partPlusValues: 8,
    repartitionGeo: [
      { pays: 'Paris QCA', pct: 45 }, { pays: 'La Defense', pct: 22 }, { pays: 'Region parisienne', pct: 25 }, { pays: 'Province', pct: 8 },
    ],
    repartitionSectorielle: [
      { secteur: 'Bureaux', pct: 95 }, { secteur: 'Commerces', pct: 5 },
    ],
    historique: [
      { annee: 2019, td: 3.62, prixPart: 835, dividende: 30.23 },
      { annee: 2020, td: 3.20, prixPart: 835, dividende: 26.72 },
      { annee: 2021, td: 3.42, prixPart: 835, dividende: 28.56 },
      { annee: 2022, td: 3.72, prixPart: 780, dividende: 29.02 },
      { annee: 2023, td: 3.72, prixPart: 700, dividende: 26.04 },
      { annee: 2024, td: 3.80, prixPart: 640, dividende: 24.32 },
    ],
    bilans: [
      { annee: 2023, immobilisationsNettes: 1950, autresActifsImmobilises: 42, creancesClients: 28, tresorerie: 110, autresActifsCirculants: 35, totalActif: 2165, capitalSocial: 1180, primesEmission: 620, reportANouveau: 55, resultatExercice: 72, totalCapitauxPropres: 1927, provisions: 25, dettesFinancieres: 148, dettesExploitation: 45, autresDettes: 20, totalPassif: 2165 },
      { annee: 2024, immobilisationsNettes: 1850, autresActifsImmobilises: 40, creancesClients: 30, tresorerie: 95, autresActifsCirculants: 32, totalActif: 2047, capitalSocial: 1120, primesEmission: 590, reportANouveau: 48, resultatExercice: 68, totalCapitauxPropres: 1826, provisions: 22, dettesFinancieres: 140, dettesExploitation: 40, autresDettes: 19, totalPassif: 2047 },
    ],
    comptesResultat: [
      { annee: 2023, produitsLocatifs: 95.0, autresProduits: 4.0, totalProduits: 99.0, chargesImmobilieres: 8.5, chargesGestion: 7.0, chargesFinancieres: 5.5, dotationsProvisions: 3.0, autresCharges: 3.0, totalCharges: 27.0, resultatCourant: 72.0, resultatExceptionnel: 0.0, resultatNet: 72.0, resultatNetParPart: 21.92 },
      { annee: 2024, produitsLocatifs: 90.0, autresProduits: 3.5, totalProduits: 93.5, chargesImmobilieres: 8.8, chargesGestion: 6.5, chargesFinancieres: 5.2, dotationsProvisions: 2.5, autresCharges: 2.5, totalCharges: 25.5, resultatCourant: 68.0, resultatExceptionnel: 0.0, resultatNet: 68.0, resultatNetParPart: 20.70 },
    ],
    immeubles: [
      { nom: 'Le Colisee', adresse: '12 avenue des Champs-Elysees', ville: 'Paris', pays: 'France', lat: 48.870, lng: 2.308, type: 'Bureaux', surface: 8200, locataire: 'LVMH', loyer: 3500000 },
      { nom: 'Tour Ariane', adresse: '5 place de la Pyramide', ville: 'Courbevoie', pays: 'France', lat: 48.893, lng: 2.236, type: 'Bureaux', surface: 18000, locataire: 'Societe Generale', loyer: 4200000 },
      { nom: 'Immeuble Le Bearn', adresse: '28 rue de Berri', ville: 'Paris', pays: 'France', lat: 48.874, lng: 2.306, type: 'Bureaux', surface: 4500, locataire: 'Cabinet Deloitte', loyer: 1800000 },
    ],
    avis: [
      { auteur: 'Georges V.', date: '2024-11-15', note: 2, commentaire: 'Triple baisse de prix de part depuis 2022. TOF faible a 87%. Tres decu de la gestion HSBC.', verifie: true, detenteurDepuis: '2014' },
      { auteur: 'Martine L.', date: '2024-06-30', note: 3, commentaire: 'Le patrimoine QCA reste de qualite mais le bureau de La Defense souffre beaucoup.', verifie: true, detenteurDepuis: '2018' },
    ],
  }),

  buildSCPI({
    id: 'eurovalys',
    nom: 'Eurovalys',
    societeGestion: 'Advenis REIM',
    type: 'SCPI',
    categorie: 'Bureaux',
    capitalType: 'variable',
    creationDate: '2015-10-01',
    anciennete: 10,
    prixPart: 910,
    prixRetrait: 828.10,
    valeurReconstitution: 955.50,
    td: 4.65,
    tdN1: 4.80,
    tri5ans: 3.92,
    tri10ans: 0,
    fraisSouscription: 9.00,
    fraisGestion: 1.20,
    tof: 94.8,
    capitalisation: 850000000,
    collecteNette: 35000000,
    ratioEndettement: 22.0,
    reportANouveau: 12.00,
    pgr: 1.5,
    nbAssocies: 9800,
    nbImmeubles: 18,
    esg: true,
    partRevenusEtrangers: 100,
    partPlusValues: 2,
    repartitionGeo: [
      { pays: 'Allemagne', pct: 100 },
    ],
    repartitionSectorielle: [
      { secteur: 'Bureaux', pct: 92 }, { secteur: 'Logistique', pct: 8 },
    ],
    historique: [
      { annee: 2019, td: 4.50, prixPart: 1030, dividende: 46.35 },
      { annee: 2020, td: 4.50, prixPart: 1030, dividende: 46.35 },
      { annee: 2021, td: 4.50, prixPart: 1030, dividende: 46.35 },
      { annee: 2022, td: 4.80, prixPart: 1010, dividende: 48.48 },
      { annee: 2023, td: 4.80, prixPart: 960, dividende: 46.08 },
      { annee: 2024, td: 4.65, prixPart: 910, dividende: 42.32 },
    ],
    bilans: [
      { annee: 2023, immobilisationsNettes: 780, autresActifsImmobilises: 15, creancesClients: 10, tresorerie: 42, autresActifsCirculants: 12, totalActif: 859, capitalSocial: 440, primesEmission: 235, reportANouveau: 22, resultatExercice: 38, totalCapitauxPropres: 735, provisions: 8, dettesFinancieres: 85, dettesExploitation: 22, autresDettes: 9, totalPassif: 859 },
      { annee: 2024, immobilisationsNettes: 750, autresActifsImmobilises: 15, creancesClients: 11, tresorerie: 38, autresActifsCirculants: 11, totalActif: 825, capitalSocial: 420, primesEmission: 225, reportANouveau: 18, resultatExercice: 36, totalCapitauxPropres: 699, provisions: 8, dettesFinancieres: 88, dettesExploitation: 20, autresDettes: 10, totalPassif: 825 },
    ],
    comptesResultat: [
      { annee: 2023, produitsLocatifs: 45.0, autresProduits: 1.8, totalProduits: 46.8, chargesImmobilieres: 3.2, chargesGestion: 2.5, chargesFinancieres: 2.0, dotationsProvisions: 0.5, autresCharges: 0.6, totalCharges: 8.8, resultatCourant: 38.0, resultatExceptionnel: 0.0, resultatNet: 38.0, resultatNetParPart: 40.82 },
      { annee: 2024, produitsLocatifs: 43.5, autresProduits: 1.5, totalProduits: 45.0, chargesImmobilieres: 3.5, chargesGestion: 2.5, chargesFinancieres: 2.0, dotationsProvisions: 0.5, autresCharges: 0.5, totalCharges: 9.0, resultatCourant: 36.0, resultatExceptionnel: 0.0, resultatNet: 36.0, resultatNetParPart: 38.67 },
    ],
    immeubles: [
      { nom: 'Eschborn Business Tower', adresse: 'Mergenthalerallee 35', ville: 'Eschborn', pays: 'Allemagne', lat: 50.139, lng: 8.568, type: 'Bureaux', surface: 12000, locataire: 'Deutsche Bank', loyer: 2800000 },
      { nom: 'Munich Tech Campus', adresse: 'Ridlerstrasse 55', ville: 'Munich', pays: 'Allemagne', lat: 48.133, lng: 11.543, type: 'Bureaux', surface: 8500, locataire: 'SAP', loyer: 2200000 },
      { nom: 'Hamburg Speicherstadt', adresse: 'Am Sandtorkai 72', ville: 'Hambourg', pays: 'Allemagne', lat: 53.543, lng: 9.990, type: 'Bureaux', surface: 6200, locataire: 'Beiersdorf', loyer: 1500000 },
    ],
    avis: [
      { auteur: 'Werner S.', date: '2024-10-20', note: 4, commentaire: 'Excellente fiscalite (100% Allemagne). Endettement un peu eleve mais patrimoine de qualite.', verifie: true, detenteurDepuis: '2017' },
    ],
  }),

  buildSCPI({
    id: 'ficommerce-proximite',
    nom: 'Ficommerce & Proximite',
    societeGestion: 'Fiducial Gerance',
    type: 'SCPI',
    categorie: 'Commerces',
    capitalType: 'variable',
    creationDate: '2011-03-01',
    anciennete: 14,
    prixPart: 222,
    prixRetrait: 202.02,
    valeurReconstitution: 233.10,
    td: 4.95,
    tdN1: 5.12,
    tri5ans: 3.80,
    tri10ans: 4.15,
    fraisSouscription: 9.00,
    fraisGestion: 0.96,
    tof: 94.5,
    capitalisation: 580000000,
    collecteNette: 15000000,
    ratioEndettement: 12.5,
    reportANouveau: 16.00,
    pgr: 1.8,
    nbAssocies: 11200,
    nbImmeubles: 85,
    esg: false,
    partRevenusEtrangers: 0,
    partPlusValues: 5,
    repartitionGeo: [
      { pays: 'Ile-de-France', pct: 45 }, { pays: 'Province', pct: 55 },
    ],
    repartitionSectorielle: [
      { secteur: 'Commerces', pct: 70 }, { secteur: 'Commerces alimentaires', pct: 20 }, { secteur: 'Bureaux', pct: 10 },
    ],
    historique: [
      { annee: 2019, td: 5.05, prixPart: 235, dividende: 11.87 },
      { annee: 2020, td: 4.80, prixPart: 235, dividende: 11.28 },
      { annee: 2021, td: 5.00, prixPart: 235, dividende: 11.75 },
      { annee: 2022, td: 5.12, prixPart: 230, dividende: 11.78 },
      { annee: 2023, td: 5.12, prixPart: 225, dividende: 11.52 },
      { annee: 2024, td: 4.95, prixPart: 222, dividende: 10.99 },
    ],
    bilans: [
      { annee: 2023, immobilisationsNettes: 530, autresActifsImmobilises: 12, creancesClients: 8, tresorerie: 32, autresActifsCirculants: 10, totalActif: 592, capitalSocial: 310, primesEmission: 165, reportANouveau: 20, resultatExercice: 28, totalCapitauxPropres: 523, provisions: 8, dettesFinancieres: 42, dettesExploitation: 14, autresDettes: 5, totalPassif: 592 },
      { annee: 2024, immobilisationsNettes: 520, autresActifsImmobilises: 12, creancesClients: 9, tresorerie: 28, autresActifsCirculants: 9, totalActif: 578, capitalSocial: 305, primesEmission: 160, reportANouveau: 18, resultatExercice: 27, totalCapitauxPropres: 510, provisions: 7, dettesFinancieres: 42, dettesExploitation: 13, autresDettes: 6, totalPassif: 578 },
    ],
    comptesResultat: [
      { annee: 2023, produitsLocatifs: 32.5, autresProduits: 1.5, totalProduits: 34.0, chargesImmobilieres: 2.5, chargesGestion: 1.8, chargesFinancieres: 0.8, dotationsProvisions: 0.3, autresCharges: 0.6, totalCharges: 6.0, resultatCourant: 28.0, resultatExceptionnel: 0.0, resultatNet: 28.0, resultatNetParPart: 10.72 },
      { annee: 2024, produitsLocatifs: 31.0, autresProduits: 1.2, totalProduits: 32.2, chargesImmobilieres: 2.2, chargesGestion: 1.5, chargesFinancieres: 0.7, dotationsProvisions: 0.3, autresCharges: 0.5, totalCharges: 5.2, resultatCourant: 27.0, resultatExceptionnel: 0.0, resultatNet: 27.0, resultatNetParPart: 10.34 },
    ],
    immeubles: [
      { nom: 'Galerie Marchande Velizy', adresse: 'Centre Commercial Velizy 2', ville: 'Velizy-Villacoublay', pays: 'France', lat: 48.782, lng: 2.191, type: 'Commerces', surface: 3500, locataire: 'Multi-locataires', loyer: 680000 },
      { nom: 'Carrefour Market Montpellier', adresse: '120 avenue de Toulouse', ville: 'Montpellier', pays: 'France', lat: 43.604, lng: 3.877, type: 'Commerces', surface: 2800, locataire: 'Carrefour', loyer: 420000 },
      { nom: 'Retail Park Nantes', adresse: 'ZAC de la Beaujoire', ville: 'Nantes', pays: 'France', lat: 47.250, lng: -1.523, type: 'Commerces', surface: 5200, locataire: 'Decathlon', loyer: 580000 },
    ],
    avis: [
      { auteur: 'Veronique T.', date: '2024-08-12', note: 4, commentaire: 'Bonne SCPI de commerce de proximite. Resiliente face au e-commerce grace a l\'alimentaire.', verifie: true, detenteurDepuis: '2016' },
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
// CHECK DE COHERENCE
// ============================================================

export interface CheckCoherence {
  scpiId: string
  scpiNom: string
  type: 'erreur' | 'alerte' | 'ok'
  categorie: string
  message: string
  detail?: string
}

export function runCoherenceChecks(scpis: SCPI[] = SCPI_DATA): CheckCoherence[] {
  const checks: CheckCoherence[] = []

  for (const scpi of scpis) {
    // 1. Repartition geo = 100%
    const totalGeo = scpi.repartitionGeo.reduce((s, g) => s + g.pct, 0)
    if (Math.abs(totalGeo - 100) > 0.5) {
      checks.push({ scpiId: scpi.id, scpiNom: scpi.nom, type: 'erreur', categorie: 'Repartition geo', message: `Total geo = ${totalGeo.toFixed(1)}% (attendu: 100%)` })
    } else {
      checks.push({ scpiId: scpi.id, scpiNom: scpi.nom, type: 'ok', categorie: 'Repartition geo', message: `Total geo = ${totalGeo.toFixed(1)}%` })
    }

    // 2. Repartition sectorielle = 100%
    const totalSect = scpi.repartitionSectorielle.reduce((s, g) => s + g.pct, 0)
    if (Math.abs(totalSect - 100) > 0.5) {
      checks.push({ scpiId: scpi.id, scpiNom: scpi.nom, type: 'erreur', categorie: 'Repartition sectorielle', message: `Total secteurs = ${totalSect.toFixed(1)}% (attendu: 100%)` })
    } else {
      checks.push({ scpiId: scpi.id, scpiNom: scpi.nom, type: 'ok', categorie: 'Repartition sectorielle', message: `Total secteurs = ${totalSect.toFixed(1)}%` })
    }

    // 3. TD coherent avec historique
    const lastHisto = scpi.historique[scpi.historique.length - 1]
    if (lastHisto && Math.abs(lastHisto.td - scpi.td) > 0.05) {
      checks.push({ scpiId: scpi.id, scpiNom: scpi.nom, type: 'alerte', categorie: 'TD vs Historique', message: `TD fiche (${scpi.td}%) != TD historique ${lastHisto.annee} (${lastHisto.td}%)` })
    } else if (lastHisto) {
      checks.push({ scpiId: scpi.id, scpiNom: scpi.nom, type: 'ok', categorie: 'TD vs Historique', message: `TD coherent: ${scpi.td}%` })
    }

    // 4. Dividende historique coherent avec TD * prix
    if (lastHisto) {
      const divAttendu = lastHisto.prixPart * lastHisto.td / 100
      if (Math.abs(divAttendu - lastHisto.dividende) > 1.0) {
        checks.push({ scpiId: scpi.id, scpiNom: scpi.nom, type: 'alerte', categorie: 'Dividende vs TD', message: `Dividende ${lastHisto.dividende}\u20AC != TD*prix ${divAttendu.toFixed(2)}\u20AC`, detail: `Ecart: ${Math.abs(divAttendu - lastHisto.dividende).toFixed(2)}\u20AC` })
      } else {
        checks.push({ scpiId: scpi.id, scpiNom: scpi.nom, type: 'ok', categorie: 'Dividende vs TD', message: `Dividende coherent: ${lastHisto.dividende}\u20AC` })
      }
    }

    // 5. Bilans: Actif = Passif
    for (const b of scpi.bilans) {
      if (Math.abs(b.totalActif - b.totalPassif) > 0.5) {
        checks.push({ scpiId: scpi.id, scpiNom: scpi.nom, type: 'erreur', categorie: `Bilan ${b.annee}`, message: `Actif (${b.totalActif.toFixed(1)}) != Passif (${b.totalPassif.toFixed(1)})` })
      } else {
        checks.push({ scpiId: scpi.id, scpiNom: scpi.nom, type: 'ok', categorie: `Bilan ${b.annee}`, message: `Equilibre A=P: ${b.totalActif.toFixed(1)} M\u20AC` })
      }

      // Somme des postes actif
      const sumActif = b.immobilisationsNettes + b.autresActifsImmobilises + b.creancesClients + b.tresorerie + b.autresActifsCirculants
      if (Math.abs(sumActif - b.totalActif) > 1.0) {
        checks.push({ scpiId: scpi.id, scpiNom: scpi.nom, type: 'alerte', categorie: `Bilan ${b.annee}`, message: `Somme actifs (${sumActif.toFixed(1)}) != Total actif (${b.totalActif.toFixed(1)})` })
      }

      // Somme des postes passif
      const sumPassif = b.totalCapitauxPropres + b.provisions + b.dettesFinancieres + b.dettesExploitation + b.autresDettes
      if (Math.abs(sumPassif - b.totalPassif) > 1.0) {
        checks.push({ scpiId: scpi.id, scpiNom: scpi.nom, type: 'alerte', categorie: `Bilan ${b.annee}`, message: `Somme passifs (${sumPassif.toFixed(1)}) != Total passif (${b.totalPassif.toFixed(1)})` })
      }

      // Capitaux propres = somme des composants
      const sumKP = b.capitalSocial + b.primesEmission + b.reportANouveau + b.resultatExercice
      if (Math.abs(sumKP - b.totalCapitauxPropres) > 2.0) {
        checks.push({ scpiId: scpi.id, scpiNom: scpi.nom, type: 'alerte', categorie: `Bilan ${b.annee}`, message: `Somme CP (${sumKP.toFixed(1)}) != Total CP (${b.totalCapitauxPropres.toFixed(1)})` })
      }
    }

    // 6. CDR: Total produits - Total charges ~ Resultat
    for (const c of scpi.comptesResultat) {
      const sumProduits = c.produitsLocatifs + c.autresProduits
      if (Math.abs(sumProduits - c.totalProduits) > 0.5) {
        checks.push({ scpiId: scpi.id, scpiNom: scpi.nom, type: 'alerte', categorie: `CDR ${c.annee}`, message: `Somme produits (${sumProduits.toFixed(1)}) != Total (${c.totalProduits.toFixed(1)})` })
      }

      const sumCharges = c.chargesImmobilieres + c.chargesGestion + c.chargesFinancieres + c.dotationsProvisions + c.autresCharges
      if (Math.abs(sumCharges - c.totalCharges) > 0.5) {
        checks.push({ scpiId: scpi.id, scpiNom: scpi.nom, type: 'alerte', categorie: `CDR ${c.annee}`, message: `Somme charges (${sumCharges.toFixed(1)}) != Total (${c.totalCharges.toFixed(1)})` })
      }

      const resultatCalc = c.totalProduits - c.totalCharges
      if (Math.abs(resultatCalc - c.resultatCourant) > 1.0) {
        checks.push({ scpiId: scpi.id, scpiNom: scpi.nom, type: 'alerte', categorie: `CDR ${c.annee}`, message: `Produits-Charges (${resultatCalc.toFixed(1)}) != Resultat courant (${c.resultatCourant.toFixed(1)})` })
      }

      const resultatTotal = c.resultatCourant + c.resultatExceptionnel
      if (Math.abs(resultatTotal - c.resultatNet) > 0.5) {
        checks.push({ scpiId: scpi.id, scpiNom: scpi.nom, type: 'alerte', categorie: `CDR ${c.annee}`, message: `Res. courant + exceptionnel (${resultatTotal.toFixed(1)}) != Res. net (${c.resultatNet.toFixed(1)})` })
      }
    }

    // 7. Coherence CDR et Bilan: resultat net bilan = resultat net CDR
    for (const b of scpi.bilans) {
      const cdr = scpi.comptesResultat.find(c => c.annee === b.annee)
      if (cdr && Math.abs(b.resultatExercice - cdr.resultatNet) > 1.0) {
        checks.push({ scpiId: scpi.id, scpiNom: scpi.nom, type: 'alerte', categorie: `Bilan/CDR ${b.annee}`, message: `Res. bilan (${b.resultatExercice.toFixed(1)}) != Res. CDR (${cdr.resultatNet.toFixed(1)})` })
      }
    }

    // 8. Prix de retrait < Prix de part
    if (scpi.prixRetrait > scpi.prixPart) {
      checks.push({ scpiId: scpi.id, scpiNom: scpi.nom, type: 'erreur', categorie: 'Prix', message: `Prix retrait (${scpi.prixRetrait}\u20AC) > Prix part (${scpi.prixPart}\u20AC)` })
    }

    // 9. TOF dans une plage realiste
    if (scpi.tof < 70 || scpi.tof > 100) {
      checks.push({ scpiId: scpi.id, scpiNom: scpi.nom, type: 'erreur', categorie: 'TOF', message: `TOF ${scpi.tof}% hors plage realiste (70-100%)` })
    }

    // 10. Endettement raisonnable
    if (scpi.ratioEndettement > 40) {
      checks.push({ scpiId: scpi.id, scpiNom: scpi.nom, type: 'erreur', categorie: 'Endettement', message: `Ratio endettement ${scpi.ratioEndettement}% > seuil AMF 40%` })
    } else if (scpi.ratioEndettement > 25) {
      checks.push({ scpiId: scpi.id, scpiNom: scpi.nom, type: 'alerte', categorie: 'Endettement', message: `Ratio endettement ${scpi.ratioEndettement}% eleve (>25%)` })
    }

    // 11. Historique chronologique
    for (let i = 1; i < scpi.historique.length; i++) {
      if (scpi.historique[i].annee <= scpi.historique[i - 1].annee) {
        checks.push({ scpiId: scpi.id, scpiNom: scpi.nom, type: 'erreur', categorie: 'Historique', message: `Historique non chronologique: ${scpi.historique[i - 1].annee} -> ${scpi.historique[i].annee}` })
      }
    }

    // 12. Fichier PDF correspondant dans input/
    const inputFiles = ['ACCES_VALEUR_PIERRE', 'ACCIMMO_PIERRE', 'ACTIVIMMO', 'ALLIANZ_HOME', 'ALLIANZ_PIERRE', 'ALTA_CONVICTIONS', 'ALTIXIA_CADENCE_XII', 'ELYSEES_PIERRE', 'EUROVALYS', 'FICOMMERCE_PROXIMITE']
    const normalizedId = scpi.id.replace(/-/g, '_').toUpperCase()
    const hasInput = inputFiles.some(f => f === normalizedId || normalizedId.includes(f) || f.includes(normalizedId.replace(/_/g, '')))
    if (hasInput) {
      checks.push({ scpiId: scpi.id, scpiNom: scpi.nom, type: 'ok', categorie: 'Source PDF', message: 'Rapport annuel present dans input/' })
    }
  }

  return checks
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
