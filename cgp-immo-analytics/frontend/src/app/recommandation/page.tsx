'use client'

import { useState, useMemo } from 'react'
import { SCPI_DATA, SCPI } from '../../lib/data'
import AppShell from '../../components/AppShell'

// ============================================================
// TYPES
// ============================================================

type Objectif = 'revenus' | 'patrimoine' | 'retraite' | 'diversification' | null
type Horizon = '<5' | '5-10' | '10-20' | '>20' | null
type Risque = 'prudent' | 'equilibre' | 'dynamique' | null

interface WizardAnswers {
  objectif: Objectif
  horizon: Horizon
  montant: number
  tmi: number | null
  risque: Risque
  preferences: {
    esg: boolean
    sansFrais: boolean
    revenusEtrangers: boolean
    ancienne: boolean
  }
}

interface ScoredSCPI {
  scpi: SCPI
  score: number
  allocation: number
  justification: string
}

// ============================================================
// ICONS (SVG paths)
// ============================================================

function CoinsIcon() {
  return (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

function BuildingIcon() {
  return (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
    </svg>
  )
}

function ClockIcon() {
  return (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

function PieChartIcon() {
  return (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 107.5 7.5h-7.5V6z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0013.5 3v7.5z" />
    </svg>
  )
}

function ShieldIcon() {
  return (
    <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
    </svg>
  )
}

function BalanceIcon() {
  return (
    <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0012 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.988 5.988 0 01-2.031.352 5.988 5.988 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L18.75 4.971zm-16.5.52c.99-.203 1.99-.377 3-.52m0 0l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.989 5.989 0 01-2.031.352 5.989 5.989 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L5.25 4.971z" />
    </svg>
  )
}

function RocketIcon() {
  return (
    <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.58-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
    </svg>
  )
}

// ============================================================
// HELPERS
// ============================================================

function formatEuro(n: number): string {
  return n.toLocaleString('fr-FR', { maximumFractionDigits: 0 }) + ' \u20AC'
}

function formatPct(n: number, decimals = 2): string {
  return n.toFixed(decimals) + ' %'
}

function scoreColorClass(score: number): string {
  if (score > 75) return 'text-[#2563EB]'
  if (score > 60) return 'text-[#10B981]'
  if (score > 40) return 'text-[#EAB308]'
  return 'text-[#EF4444]'
}

function scoreBadgeBg(score: number): string {
  if (score > 75) return 'bg-[#2563EB]/15 text-[#60a5fa] border-[#2563EB]/30'
  if (score > 60) return 'bg-[#10B981]/15 text-[#34d399] border-[#10B981]/30'
  if (score > 40) return 'bg-[#EAB308]/15 text-[#facc15] border-[#EAB308]/30'
  return 'bg-[#EF4444]/15 text-[#f87171] border-[#EF4444]/30'
}

// ============================================================
// RECOMMENDATION ALGORITHM
// ============================================================

function computeRecommendationScore(scpi: SCPI, answers: WizardAnswers): number {
  let score = 0

  // --- Objectif weighting ---
  switch (answers.objectif) {
    case 'revenus':
      // High TD is most important for income seekers
      score += (scpi.td / 8) * 30
      score += (scpi.tof / 100) * 10
      break
    case 'patrimoine':
      // TRI and capitalisation matter for wealth building
      score += (scpi.tri5ans > 0 ? (scpi.tri5ans / 8) * 20 : (scpi.td / 8) * 15)
      score += (scpi.tri10ans > 0 ? (scpi.tri10ans / 8) * 10 : 0)
      score += Math.min(10, (scpi.capitalisation / 5e9) * 10)
      break
    case 'retraite':
      // Stability and long-term TRI
      score += (scpi.tri10ans > 0 ? (scpi.tri10ans / 8) * 15 : (scpi.tri5ans > 0 ? (scpi.tri5ans / 8) * 10 : (scpi.td / 8) * 8))
      score += (scpi.tof / 100) * 10
      score += Math.min(10, scpi.anciennete / 3)
      score += (100 - scpi.ratioEndettement) / 100 * 5
      break
    case 'diversification':
      // Geographic and sectoral diversification
      score += Math.min(15, scpi.repartitionGeo.length * 2)
      score += Math.min(10, scpi.repartitionSectorielle.length * 2)
      score += (scpi.td / 8) * 15
      break
  }

  // --- Horizon weighting ---
  switch (answers.horizon) {
    case '<5':
      // Penalize high frais souscription for short horizons
      score -= scpi.fraisSouscription * 1.5
      // Favor low entry costs
      score += scpi.fraisSouscription === 0 ? 15 : 0
      break
    case '5-10':
      score -= scpi.fraisSouscription * 0.5
      break
    case '10-20':
      // Frais matter less, TRI matters more
      score += (scpi.tri10ans > 0 ? (scpi.tri10ans / 8) * 5 : 0)
      break
    case '>20':
      // Long term: anciennete and stability
      score += Math.min(8, scpi.anciennete / 4)
      score += (scpi.tri10ans > 0 ? (scpi.tri10ans / 8) * 8 : 0)
      break
  }

  // --- TMI weighting ---
  if (answers.tmi !== null && answers.tmi >= 30) {
    // High TMI: favor high partRevenusEtrangers for tax optimization
    score += (scpi.partRevenusEtrangers / 100) * (answers.tmi / 45) * 15
  }

  // --- Risk appetite ---
  switch (answers.risque) {
    case 'prudent':
      // Favor high TOF, low debt, high anciennete
      score += (scpi.tof / 100) * 12
      score += Math.max(0, (100 - scpi.ratioEndettement * 3) / 100) * 8
      score += Math.min(10, scpi.anciennete / 3)
      // Penalize young SCPI
      if (scpi.anciennete < 5) score -= 10
      break
    case 'equilibre':
      score += (scpi.td / 8) * 8
      score += (scpi.tof / 100) * 6
      score += Math.min(5, scpi.anciennete / 5)
      break
    case 'dynamique':
      // Maximize rendement, accept more risk
      score += (scpi.td / 8) * 18
      score += (scpi.tri5ans > 0 ? (scpi.tri5ans / 8) * 5 : 0)
      break
  }

  // --- Preferences filtering (bonus/penalty) ---
  if (answers.preferences.esg) {
    score += scpi.esg ? 10 : -15
  }

  if (answers.preferences.sansFrais) {
    score += scpi.fraisSouscription === 0 ? 12 : -10
  }

  if (answers.preferences.revenusEtrangers) {
    score += (scpi.partRevenusEtrangers / 100) * 12
  }

  if (answers.preferences.ancienne) {
    score += scpi.anciennete >= 10 ? 10 : -5
  }

  // Baseline from Score Alpha
  score += scpi.scoreAlpha * 0.15

  return score
}

function generateJustification(scpi: SCPI, answers: WizardAnswers): string {
  const reasons: string[] = []

  // Objectif
  switch (answers.objectif) {
    case 'revenus':
      reasons.push(`Taux de distribution de ${scpi.td}%, ideal pour generer des revenus reguliers`)
      break
    case 'patrimoine':
      if (scpi.tri5ans > 0) {
        reasons.push(`TRI 5 ans de ${scpi.tri5ans}%, performant pour la constitution de patrimoine`)
      }
      if (scpi.capitalisation >= 1e9) {
        reasons.push(`Capitalisation de ${(scpi.capitalisation / 1e9).toFixed(1)} Md\u20AC, gage de solidite`)
      }
      break
    case 'retraite':
      if (scpi.anciennete >= 10) {
        reasons.push(`${scpi.anciennete} ans d'historique, fiabilite eprouvee pour un placement retraite`)
      }
      if (scpi.tof >= 96) {
        reasons.push(`TOF de ${scpi.tof}%, tres faible risque de vacance locative`)
      }
      break
    case 'diversification':
      reasons.push(`Presente dans ${scpi.repartitionGeo.length} pays et ${scpi.repartitionSectorielle.length} secteurs`)
      break
  }

  // Frais
  if (scpi.fraisSouscription === 0) {
    reasons.push('Aucun frais de souscription, capital 100% investi des le depart')
  } else if (answers.horizon === '<5' || answers.horizon === '5-10') {
    if (scpi.fraisSouscription < 8) {
      reasons.push(`Frais de souscription contenus a ${scpi.fraisSouscription}%`)
    }
  }

  // TMI / Fiscal
  if (answers.tmi !== null && answers.tmi >= 30 && scpi.partRevenusEtrangers >= 50) {
    reasons.push(`${scpi.partRevenusEtrangers}% de revenus etrangers, optimisation fiscale pour votre TMI de ${answers.tmi}%`)
  }

  // Risk
  if (answers.risque === 'prudent') {
    if (scpi.tof >= 95) reasons.push(`TOF eleve de ${scpi.tof}%, securite du capital privilegiee`)
    if (scpi.ratioEndettement < 15) reasons.push(`Endettement maitrise a ${scpi.ratioEndettement}%`)
  }
  if (answers.risque === 'dynamique' && scpi.td >= 6) {
    reasons.push(`Rendement dynamique de ${scpi.td}% pour maximiser vos revenus`)
  }

  // ESG
  if (answers.preferences.esg && scpi.esg) {
    reasons.push('Label ISR/ESG, aligne avec vos valeurs d\'investissement responsable')
  }

  // Ancienne
  if (answers.preferences.ancienne && scpi.anciennete >= 10) {
    reasons.push(`SCPI etablie depuis ${scpi.anciennete} ans, track record solide`)
  }

  // If we don't have enough reasons, add a generic one based on Score Alpha
  if (reasons.length < 2) {
    reasons.push(`Score Alpha de ${scpi.scoreAlpha}/100, qualite globale superieure`)
  }

  return reasons.slice(0, 3).join('. ') + '.'
}

function getTopRecommendations(answers: WizardAnswers): ScoredSCPI[] {
  // Filter hard constraints first
  let candidates = [...SCPI_DATA]

  // Score all candidates
  const scored = candidates.map(scpi => ({
    scpi,
    score: computeRecommendationScore(scpi, answers),
    allocation: 0,
    justification: generateJustification(scpi, answers),
  }))

  // Sort by score descending
  scored.sort((a, b) => b.score - a.score)

  // Pick top 3
  const top3 = scored.slice(0, 3)

  // Compute allocation percentages
  const totalScore = top3.reduce((sum, s) => sum + Math.max(0, s.score), 0)
  if (totalScore > 0) {
    top3.forEach(s => {
      s.allocation = Math.round((Math.max(0, s.score) / totalScore) * 100)
    })
    // Ensure they sum to 100
    const diff = 100 - top3.reduce((sum, s) => sum + s.allocation, 0)
    if (top3.length > 0) top3[0].allocation += diff
  } else {
    top3.forEach((s, i) => {
      s.allocation = i === 0 ? 34 : 33
    })
  }

  return top3
}

function computeEstimatedRevenue(
  recommendations: ScoredSCPI[],
  montant: number,
  tmi: number,
): { brut: number; net: number; triProjete: number } {
  let totalBrut = 0
  let totalNet = 0
  let weightedTd = 0
  const PS = 17.2

  recommendations.forEach(rec => {
    const alloc = rec.allocation / 100
    const invested = montant * alloc
    const revenuAnnuel = invested * (rec.scpi.td / 100)
    totalBrut += revenuAnnuel

    const revenuFR = revenuAnnuel * ((100 - rec.scpi.partRevenusEtrangers) / 100)
    const revenuETR = revenuAnnuel * (rec.scpi.partRevenusEtrangers / 100)

    const irFR = revenuFR * (tmi / 100)
    const psFR = revenuFR * (PS / 100)
    const tauxEffETR = Math.max(0, tmi - 20)
    const irETR = revenuETR * (tauxEffETR / 100)
    const psETR = revenuETR * (PS / 100)

    totalNet += revenuAnnuel - irFR - psFR - irETR - psETR
    weightedTd += rec.scpi.td * alloc
  })

  // Projected TRI: weighted average of available TRI data
  let triProjete = 0
  let triWeight = 0
  recommendations.forEach(rec => {
    const alloc = rec.allocation / 100
    if (rec.scpi.tri10ans > 0) {
      triProjete += rec.scpi.tri10ans * alloc
      triWeight += alloc
    } else if (rec.scpi.tri5ans > 0) {
      triProjete += rec.scpi.tri5ans * alloc
      triWeight += alloc
    } else {
      triProjete += rec.scpi.td * alloc
      triWeight += alloc
    }
  })
  if (triWeight > 0) triProjete = triProjete / triWeight * triWeight

  return {
    brut: totalBrut / 12,
    net: totalNet / 12,
    triProjete,
  }
}

// ============================================================
// STEP LABELS
// ============================================================

const STEP_LABELS = [
  'Objectif',
  'Horizon',
  'Montant',
  'Fiscalite',
  'Risque',
  'Preferences',
]

// ============================================================
// MAIN COMPONENT
// ============================================================

export default function RecommandationPage() {
  const [currentStep, setCurrentStep] = useState(0)
  const [showResults, setShowResults] = useState(false)
  const [answers, setAnswers] = useState<WizardAnswers>({
    objectif: null,
    horizon: null,
    montant: 50000,
    tmi: null,
    risque: null,
    preferences: {
      esg: false,
      sansFrais: false,
      revenusEtrangers: false,
      ancienne: false,
    },
  })

  const totalSteps = STEP_LABELS.length

  const canProceed = useMemo(() => {
    switch (currentStep) {
      case 0: return answers.objectif !== null
      case 1: return answers.horizon !== null
      case 2: return answers.montant >= 5000
      case 3: return answers.tmi !== null
      case 4: return answers.risque !== null
      case 5: return true // preferences are optional
      default: return false
    }
  }, [currentStep, answers])

  const recommendations = useMemo(() => {
    if (!showResults) return []
    return getTopRecommendations(answers)
  }, [showResults, answers])

  const estimatedRevenue = useMemo(() => {
    if (recommendations.length === 0) return null
    return computeEstimatedRevenue(recommendations, answers.montant, answers.tmi ?? 0)
  }, [recommendations, answers.montant, answers.tmi])

  function handleNext() {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(prev => prev + 1)
    } else {
      setShowResults(true)
    }
  }

  function handlePrevious() {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1)
    }
  }

  function handleRestart() {
    setShowResults(false)
    setCurrentStep(0)
    setAnswers({
      objectif: null,
      horizon: null,
      montant: 50000,
      tmi: null,
      risque: null,
      preferences: {
        esg: false,
        sansFrais: false,
        revenusEtrangers: false,
        ancienne: false,
      },
    })
  }

  // ============================================================
  // RENDER: RESULTS PAGE
  // ============================================================

  if (showResults) {
    return (
      <AppShell>
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-[#2563EB]/15 flex items-center justify-center">
                <svg className="w-5 h-5 text-[#2563EB]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-[#F1F5F9]">Votre allocation SCPI optimisee</h1>
                <p className="text-sm text-[#94A3B8]">Recommandation personnalisee basee sur votre profil investisseur</p>
              </div>
            </div>
          </div>

          {/* Summary Card */}
          {estimatedRevenue && (
            <div className="rounded-xl border border-white/[0.06] bg-gradient-to-br from-[#2563EB]/10 to-[rgba(19,24,37,0.6)] p-6 mb-8">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div>
                  <div className="text-xs text-[#94A3B8] uppercase tracking-wider mb-1">Investissement total</div>
                  <div className="text-2xl font-bold text-[#F1F5F9]">{formatEuro(answers.montant)}</div>
                </div>
                <div>
                  <div className="text-xs text-[#94A3B8] uppercase tracking-wider mb-1">Revenu net mensuel estime</div>
                  <div className="text-2xl font-bold text-[#10B981]">{formatEuro(Math.round(estimatedRevenue.net))}<span className="text-sm text-[#94A3B8] font-normal"> /mois</span></div>
                  <div className="text-xs text-[#475569] mt-0.5">Brut : {formatEuro(Math.round(estimatedRevenue.brut))}/mois</div>
                </div>
                <div>
                  <div className="text-xs text-[#94A3B8] uppercase tracking-wider mb-1">TRI projete</div>
                  <div className="text-2xl font-bold text-[#C9A84C]">{formatPct(estimatedRevenue.triProjete)}</div>
                  <div className="text-xs text-[#475569] mt-0.5">Moyenne ponderee des SCPI selectionnees</div>
                </div>
              </div>
            </div>
          )}

          {/* Top 3 Recommendations */}
          <div className="space-y-4 mb-8">
            {recommendations.map((rec, index) => (
              <div
                key={rec.scpi.id}
                className="rounded-xl border border-white/[0.06] bg-[rgba(19,24,37,0.6)] p-6 hover:border-white/[0.12] transition-colors"
              >
                <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                  {/* Rank + Name */}
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[#2563EB]/15 flex items-center justify-center">
                      <span className="text-lg font-bold text-[#2563EB]">#{index + 1}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-3 flex-wrap mb-1">
                        <h3 className="text-lg font-semibold text-[#F1F5F9]">{rec.scpi.nom}</h3>
                        <span className={`px-2 py-0.5 rounded-md text-xs font-medium border ${scoreBadgeBg(rec.scpi.scoreAlpha)}`}>
                          Alpha {rec.scpi.scoreAlpha}
                        </span>
                        {rec.scpi.esg && (
                          <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-[#10B981]/15 text-[#34d399] border border-[#10B981]/30">
                            ISR
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-[#94A3B8] mb-3">{rec.scpi.societeGestion} &middot; {rec.scpi.categorie}</div>

                      {/* Stats row */}
                      <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm mb-3">
                        <div>
                          <span className="text-[#475569]">TD : </span>
                          <span className="text-[#F1F5F9] font-medium">{formatPct(rec.scpi.td)}</span>
                        </div>
                        <div>
                          <span className="text-[#475569]">Frais : </span>
                          <span className="text-[#F1F5F9] font-medium">{rec.scpi.fraisSouscription === 0 ? 'Aucun' : formatPct(rec.scpi.fraisSouscription)}</span>
                        </div>
                        <div>
                          <span className="text-[#475569]">TOF : </span>
                          <span className="text-[#F1F5F9] font-medium">{formatPct(rec.scpi.tof, 1)}</span>
                        </div>
                        <div>
                          <span className="text-[#475569]">Rev. etrangers : </span>
                          <span className="text-[#F1F5F9] font-medium">{rec.scpi.partRevenusEtrangers}%</span>
                        </div>
                      </div>

                      {/* Justification */}
                      <div className="rounded-lg bg-white/[0.03] border border-white/[0.04] px-4 py-3">
                        <div className="flex items-start gap-2">
                          <svg className="w-4 h-4 text-[#C9A84C] mt-0.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
                          </svg>
                          <p className="text-sm text-[#94A3B8] leading-relaxed">{rec.justification}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Allocation */}
                  <div className="flex-shrink-0 lg:w-36 lg:text-right">
                    <div className="text-xs text-[#94A3B8] uppercase tracking-wider mb-1">Allocation</div>
                    <div className="text-3xl font-bold text-[#2563EB]">{rec.allocation}%</div>
                    <div className="text-sm text-[#475569]">{formatEuro(Math.round(answers.montant * rec.allocation / 100))}</div>
                    {/* Mini bar */}
                    <div className="mt-2 h-2 rounded-full bg-white/[0.1] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#2563EB] transition-all duration-700"
                        style={{ width: `${rec.allocation}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Restart button */}
          <div className="flex justify-center">
            <button
              onClick={handleRestart}
              className="px-8 py-3 rounded-xl bg-[rgba(19,24,37,0.6)] border border-white/[0.06] text-[#94A3B8] hover:text-[#F1F5F9] hover:border-white/[0.12] transition-all text-sm font-medium"
            >
              Refaire la simulation
            </button>
          </div>
        </div>
      </AppShell>
    )
  }

  // ============================================================
  // RENDER: WIZARD STEPS
  // ============================================================

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-[#2563EB]/15 flex items-center justify-center">
              <svg className="w-5 h-5 text-[#2563EB]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#F1F5F9]">Recommandation IA</h1>
              <p className="text-sm text-[#94A3B8]">Trouvez les SCPI ideales pour votre profil en 6 etapes</p>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-[#94A3B8]">Etape {currentStep + 1} sur {totalSteps}</span>
            <span className="text-xs text-[#475569]">{STEP_LABELS[currentStep]}</span>
          </div>
          <div className="h-2 rounded-full bg-white/[0.1] overflow-hidden">
            <div
              className="h-full rounded-full bg-[#2563EB] transition-all duration-500 ease-out"
              style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
            />
          </div>
          {/* Step dots */}
          <div className="flex justify-between mt-3">
            {STEP_LABELS.map((label, i) => (
              <div key={label} className="flex flex-col items-center">
                <div
                  className={`w-3 h-3 rounded-full transition-all ${
                    i < currentStep
                      ? 'bg-[#2563EB]'
                      : i === currentStep
                      ? 'bg-[#2563EB] ring-4 ring-[#2563EB]/20'
                      : 'bg-white/[0.1]'
                  }`}
                />
                <span className={`text-[10px] mt-1.5 hidden sm:block ${
                  i <= currentStep ? 'text-[#94A3B8]' : 'text-[#475569]'
                }`}>{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Step Content Card */}
        <div className="rounded-xl border border-white/[0.06] bg-[rgba(19,24,37,0.6)] p-6 sm:p-8 mb-6">
          {/* Step 1: Objectif */}
          {currentStep === 0 && (
            <div>
              <h2 className="text-xl font-semibold text-[#F1F5F9] mb-2">Quel est votre objectif principal ?</h2>
              <p className="text-sm text-[#94A3B8] mb-6">Selectionnez l&apos;objectif qui correspond le mieux a votre projet d&apos;investissement.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {([
                  { value: 'revenus' as const, label: 'Complement de revenus', desc: 'Generer des revenus reguliers et immediatement disponibles', Icon: CoinsIcon },
                  { value: 'patrimoine' as const, label: 'Constitution de patrimoine', desc: 'Construire un capital immobilier sur le long terme', Icon: BuildingIcon },
                  { value: 'retraite' as const, label: 'Preparation retraite', desc: 'Securiser des revenus complementaires pour la retraite', Icon: ClockIcon },
                  { value: 'diversification' as const, label: 'Diversification', desc: 'Diversifier votre portefeuille avec de l\'immobilier', Icon: PieChartIcon },
                ]).map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setAnswers(prev => ({ ...prev, objectif: opt.value }))}
                    className={`p-5 rounded-xl border text-left transition-all ${
                      answers.objectif === opt.value
                        ? 'border-[#2563EB] bg-[#2563EB]/10 ring-1 ring-[#2563EB]/30'
                        : 'border-white/[0.06] hover:border-white/[0.12] hover:bg-white/[0.02]'
                    }`}
                  >
                    <div className={`mb-3 ${answers.objectif === opt.value ? 'text-[#2563EB]' : 'text-[#475569]'}`}>
                      <opt.Icon />
                    </div>
                    <div className="text-sm font-medium text-[#F1F5F9] mb-1">{opt.label}</div>
                    <div className="text-xs text-[#94A3B8] leading-relaxed">{opt.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Horizon */}
          {currentStep === 1 && (
            <div>
              <h2 className="text-xl font-semibold text-[#F1F5F9] mb-2">Quel est votre horizon d&apos;investissement ?</h2>
              <p className="text-sm text-[#94A3B8] mb-6">L&apos;horizon impacte l&apos;amortissement des frais de souscription et la strategie recommandee.</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {([
                  { value: '<5' as const, label: '< 5 ans', desc: 'Court terme' },
                  { value: '5-10' as const, label: '5-10 ans', desc: 'Moyen terme' },
                  { value: '10-20' as const, label: '10-20 ans', desc: 'Long terme' },
                  { value: '>20' as const, label: '> 20 ans', desc: 'Tres long terme' },
                ]).map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setAnswers(prev => ({ ...prev, horizon: opt.value }))}
                    className={`p-4 rounded-xl border text-center transition-all ${
                      answers.horizon === opt.value
                        ? 'border-[#2563EB] bg-[#2563EB]/10 ring-1 ring-[#2563EB]/30'
                        : 'border-white/[0.06] hover:border-white/[0.12] hover:bg-white/[0.02]'
                    }`}
                  >
                    <div className="text-lg font-semibold text-[#F1F5F9] mb-0.5">{opt.label}</div>
                    <div className="text-xs text-[#94A3B8]">{opt.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Montant */}
          {currentStep === 2 && (
            <div>
              <h2 className="text-xl font-semibold text-[#F1F5F9] mb-2">Quel montant souhaitez-vous investir ?</h2>
              <p className="text-sm text-[#94A3B8] mb-6">Le montant influence les SCPI accessibles et la diversification possible.</p>

              {/* Current amount display */}
              <div className="text-center mb-6">
                <div className="text-4xl font-bold text-[#2563EB]">{formatEuro(answers.montant)}</div>
              </div>

              {/* Slider */}
              <div className="mb-6 px-1">
                <input
                  type="range"
                  min={5000}
                  max={300000}
                  step={1000}
                  value={answers.montant}
                  onChange={(e) => setAnswers(prev => ({ ...prev, montant: Number(e.target.value) }))}
                  className="w-full h-2 rounded-full appearance-none cursor-pointer
                    [&::-webkit-slider-track]:rounded-full [&::-webkit-slider-track]:bg-white/[0.1]
                    [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5
                    [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#2563EB]
                    [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-[#0B1120]
                    [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(37,99,235,0.4)]
                    [&::-moz-range-track]:rounded-full [&::-moz-range-track]:bg-white/[0.1] [&::-moz-range-track]:h-2
                    [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full
                    [&::-moz-range-thumb]:bg-[#2563EB] [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-[#0B1120]"
                />
                <div className="flex justify-between mt-2 text-xs text-[#475569]">
                  <span>5 000 &euro;</span>
                  <span>300 000 &euro;</span>
                </div>
              </div>

              {/* Quick buttons */}
              <div className="flex flex-wrap gap-2 justify-center">
                {[
                  { label: '10k', value: 10000 },
                  { label: '25k', value: 25000 },
                  { label: '50k', value: 50000 },
                  { label: '100k', value: 100000 },
                  { label: '200k', value: 200000 },
                ].map(btn => (
                  <button
                    key={btn.value}
                    onClick={() => setAnswers(prev => ({ ...prev, montant: btn.value }))}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      answers.montant === btn.value
                        ? 'bg-[#2563EB] text-white'
                        : 'bg-white/[0.05] text-[#94A3B8] border border-white/[0.06] hover:bg-white/[0.08] hover:text-[#F1F5F9]'
                    }`}
                  >
                    {btn.label} &euro;
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 4: TMI */}
          {currentStep === 3 && (
            <div>
              <h2 className="text-xl font-semibold text-[#F1F5F9] mb-2">Quelle est votre tranche marginale d&apos;imposition (TMI) ?</h2>
              <p className="text-sm text-[#94A3B8] mb-6">Votre TMI influence la fiscalite de vos revenus SCPI et les strategies d&apos;optimisation possibles.</p>

              <div className="space-y-3 mb-6">
                {[
                  { value: 0, label: '0 %', desc: 'Revenus jusqu\'a 11 294 \u20AC' },
                  { value: 11, label: '11 %', desc: 'Revenus de 11 295 \u20AC a 28 797 \u20AC' },
                  { value: 30, label: '30 %', desc: 'Revenus de 28 798 \u20AC a 82 341 \u20AC' },
                  { value: 41, label: '41 %', desc: 'Revenus de 82 342 \u20AC a 177 106 \u20AC' },
                  { value: 45, label: '45 %', desc: 'Revenus superieurs a 177 106 \u20AC' },
                ].map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setAnswers(prev => ({ ...prev, tmi: opt.value }))}
                    className={`w-full p-4 rounded-xl border text-left flex items-center gap-4 transition-all ${
                      answers.tmi === opt.value
                        ? 'border-[#2563EB] bg-[#2563EB]/10 ring-1 ring-[#2563EB]/30'
                        : 'border-white/[0.06] hover:border-white/[0.12] hover:bg-white/[0.02]'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                      answers.tmi === opt.value ? 'border-[#2563EB]' : 'border-[#475569]'
                    }`}>
                      {answers.tmi === opt.value && (
                        <div className="w-2.5 h-2.5 rounded-full bg-[#2563EB]" />
                      )}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-[#F1F5F9]">{opt.label}</div>
                      <div className="text-xs text-[#94A3B8]">{opt.desc}</div>
                    </div>
                  </button>
                ))}
              </div>

              {/* Info box */}
              <div className="rounded-lg bg-[#2563EB]/5 border border-[#2563EB]/20 p-4">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-[#2563EB] mt-0.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                  </svg>
                  <div className="text-xs text-[#94A3B8] leading-relaxed">
                    <strong className="text-[#F1F5F9]">Impact fiscal : </strong>
                    Plus votre TMI est elevee, plus les SCPI a forte proportion de revenus etrangers sont avantageuses
                    grace aux conventions fiscales internationales. Les revenus de source etrangere beneficient generalement
                    d&apos;un credit d&apos;impot evitant la double imposition.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Risque */}
          {currentStep === 4 && (
            <div>
              <h2 className="text-xl font-semibold text-[#F1F5F9] mb-2">Quelle est votre appetence au risque ?</h2>
              <p className="text-sm text-[#94A3B8] mb-6">Votre profil de risque oriente la selection vers des SCPI plus ou moins dynamiques.</p>
              <div className="space-y-4">
                {([
                  { value: 'prudent' as const, label: 'Prudent', desc: 'Privilegier la securite du capital', subdesc: 'SCPI anciennes, TOF eleve, faible endettement', Icon: ShieldIcon, color: '#10B981' },
                  { value: 'equilibre' as const, label: 'Equilibre', desc: 'Bon compromis rendement/risque', subdesc: 'Mix de SCPI etablies et dynamiques', Icon: BalanceIcon, color: '#2563EB' },
                  { value: 'dynamique' as const, label: 'Dynamique', desc: 'Maximiser le rendement', subdesc: 'SCPI a haut rendement, nouvelles opportunites', Icon: RocketIcon, color: '#C9A84C' },
                ]).map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setAnswers(prev => ({ ...prev, risque: opt.value }))}
                    className={`w-full p-5 rounded-xl border text-left flex items-start gap-4 transition-all ${
                      answers.risque === opt.value
                        ? 'border-[#2563EB] bg-[#2563EB]/10 ring-1 ring-[#2563EB]/30'
                        : 'border-white/[0.06] hover:border-white/[0.12] hover:bg-white/[0.02]'
                    }`}
                  >
                    <div className={`flex-shrink-0 mt-0.5 ${answers.risque === opt.value ? 'text-[#2563EB]' : `text-[${opt.color}]`}`} style={{ color: answers.risque === opt.value ? '#2563EB' : opt.color }}>
                      <opt.Icon />
                    </div>
                    <div>
                      <div className="text-base font-medium text-[#F1F5F9] mb-0.5">{opt.label}</div>
                      <div className="text-sm text-[#94A3B8]">{opt.desc}</div>
                      <div className="text-xs text-[#475569] mt-1">{opt.subdesc}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 6: Preferences */}
          {currentStep === 5 && (
            <div>
              <h2 className="text-xl font-semibold text-[#F1F5F9] mb-2">Vos preferences additionnelles</h2>
              <p className="text-sm text-[#94A3B8] mb-6">Ces criteres optionnels affinent la selection. Vous pouvez en cocher plusieurs ou aucun.</p>
              <div className="space-y-3">
                {([
                  { key: 'esg' as const, label: 'Label ISR/ESG important', desc: 'Privilegier les SCPI avec une demarche d\'investissement socialement responsable' },
                  { key: 'sansFrais' as const, label: 'Sans frais d\'entree prefere', desc: 'Favoriser les SCPI sans frais de souscription (capital 100% investi)' },
                  { key: 'revenusEtrangers' as const, label: 'Revenus etrangers (optimisation fiscale)', desc: 'Privilegier les SCPI a forte proportion de revenus de source etrangere' },
                  { key: 'ancienne' as const, label: 'SCPI ancienne (> 10 ans)', desc: 'Favoriser les SCPI avec un long historique et un track record eprouve' },
                ]).map(opt => (
                  <button
                    key={opt.key}
                    onClick={() =>
                      setAnswers(prev => ({
                        ...prev,
                        preferences: {
                          ...prev.preferences,
                          [opt.key]: !prev.preferences[opt.key],
                        },
                      }))
                    }
                    className={`w-full p-4 rounded-xl border text-left flex items-start gap-4 transition-all ${
                      answers.preferences[opt.key]
                        ? 'border-[#2563EB] bg-[#2563EB]/10 ring-1 ring-[#2563EB]/30'
                        : 'border-white/[0.06] hover:border-white/[0.12] hover:bg-white/[0.02]'
                    }`}
                  >
                    {/* Checkbox */}
                    <div className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center mt-0.5 transition-colors ${
                      answers.preferences[opt.key]
                        ? 'bg-[#2563EB] border-[#2563EB]'
                        : 'border-[#475569]'
                    }`}>
                      {answers.preferences[opt.key] && (
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                      )}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-[#F1F5F9] mb-0.5">{opt.label}</div>
                      <div className="text-xs text-[#94A3B8] leading-relaxed">{opt.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Navigation buttons */}
        <div className="flex items-center justify-between">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className={`px-6 py-2.5 rounded-xl text-sm font-medium transition-all ${
              currentStep === 0
                ? 'opacity-0 pointer-events-none'
                : 'bg-[rgba(19,24,37,0.6)] border border-white/[0.06] text-[#94A3B8] hover:text-[#F1F5F9] hover:border-white/[0.12]'
            }`}
          >
            Precedent
          </button>

          <button
            onClick={handleNext}
            disabled={!canProceed}
            className={`px-8 py-2.5 rounded-xl text-sm font-medium transition-all ${
              canProceed
                ? 'bg-[#2563EB] text-white hover:bg-[#1d4ed8] shadow-lg shadow-[#2563EB]/20'
                : 'bg-[#2563EB]/30 text-white/40 cursor-not-allowed'
            }`}
          >
            {currentStep === totalSteps - 1 ? 'Voir les recommandations' : 'Suivant'}
          </button>
        </div>
      </div>
    </AppShell>
  )
}
