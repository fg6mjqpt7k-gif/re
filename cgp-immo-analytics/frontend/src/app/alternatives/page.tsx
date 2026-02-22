'use client'

import { useState, useMemo } from 'react'
import { SCPI_DATA, SCPI, ALTERNATIVES, AlternativeInvestissement, TMI_TRANCHES, PRELEVEMENTS_SOCIAUX } from '../../lib/data'
import AppShell from '../../components/AppShell'

// ============================================================
// TYPES
// ============================================================

interface InvestmentProjection {
  id: string
  nom: string
  type: string
  rendementBrut: number
  fraisEntree: number
  fraisGestion: number
  rendementNet: number
  capitalFinal: number
  revenuCumuleNet: number
  liquidite: string
  risque: string
  ticketMin: number
  fraisTotaux: number
  fiscaliteLabel: string
  evolutionParAn: number[]
}

// ============================================================
// COLORS
// ============================================================

const INVESTMENT_COLORS: Record<string, string> = {
  scpi: '#2563EB',
  'etf-immo': '#8B5CF6',
  'etf-action': '#F59E0B',
  'fonds-euros': '#10B981',
  'locatif-direct': '#EF4444',
}

const LIQUIDITE_COLORS: Record<string, { bg: string; text: string }> = {
  'Immediate (bourse)': { bg: 'rgba(16,185,129,0.15)', text: '#34d399' },
  'Quelques jours': { bg: 'rgba(16,185,129,0.10)', text: '#6ee7b7' },
  'Quelques semaines': { bg: 'rgba(245,158,11,0.15)', text: '#fbbf24' },
  'Tres faible (mois de vente)': { bg: 'rgba(239,68,68,0.15)', text: '#f87171' },
}

const RISQUE_COLORS: Record<string, { bg: string; text: string }> = {
  'Eleve (volatilite marche)': { bg: 'rgba(239,68,68,0.15)', text: '#f87171' },
  'Moyen (vacance, travaux, impayes)': { bg: 'rgba(245,158,11,0.15)', text: '#fbbf24' },
  'Moyen (immobilier non cote)': { bg: 'rgba(245,158,11,0.15)', text: '#fbbf24' },
  'Tres faible (capital garanti)': { bg: 'rgba(16,185,129,0.15)', text: '#34d399' },
}

// ============================================================
// HELPERS
// ============================================================

function formatEUR(n: number): string {
  return n.toLocaleString('fr-FR', { maximumFractionDigits: 0 }) + ' \u20AC'
}

function formatPct(n: number): string {
  return n.toFixed(2) + '%'
}

function getLiquiditeBadge(liquidite: string) {
  const colors = LIQUIDITE_COLORS[liquidite] || { bg: 'rgba(255,255,255,0.06)', text: '#94A3B8' }
  return (
    <span
      className="inline-block px-2 py-0.5 rounded-full text-[11px] font-medium whitespace-nowrap"
      style={{ background: colors.bg, color: colors.text }}
    >
      {liquidite}
    </span>
  )
}

function getRisqueBadge(risque: string) {
  const colors = RISQUE_COLORS[risque] || { bg: 'rgba(255,255,255,0.06)', text: '#94A3B8' }
  return (
    <span
      className="inline-block px-2 py-0.5 rounded-full text-[11px] font-medium whitespace-nowrap"
      style={{ background: colors.bg, color: colors.text }}
    >
      {risque}
    </span>
  )
}

// ============================================================
// COMPUTATION
// ============================================================

function computeSCPIProjection(
  scpi: SCPI,
  montant: number,
  duree: number,
  tmi: number,
): InvestmentProjection {
  const td = scpi.td / 100
  const fraisEntreePct = scpi.fraisSouscription / 100
  const fraisGestionPct = scpi.fraisGestion / 100
  const partEtranger = scpi.partRevenusEtrangers / 100

  // Net invested after subscription fees
  const capitalInvesti = montant * (1 - fraisEntreePct)

  // Yearly gross income based on invested amount * TD
  const revenuAnnuelBrut = montant * td

  // Tax on French-source income: TMI + PS
  const revenuFR = revenuAnnuelBrut * (1 - partEtranger)
  const revenuETR = revenuAnnuelBrut * partEtranger

  const irFR = revenuFR * (tmi / 100)
  const psFR = revenuFR * (PRELEVEMENTS_SOCIAUX / 100)

  // Foreign income: tax treaty credit (~20% effective)
  const tauxEffectifETR = Math.max(0, tmi - 20)
  const irETR = revenuETR * (tauxEffectifETR / 100)
  const psETR = revenuETR * (PRELEVEMENTS_SOCIAUX / 100)

  const totalFiscaliteAnnuelle = irFR + psFR + irETR + psETR
  const revenuAnnuelNet = revenuAnnuelBrut - totalFiscaliteAnnuelle

  // Effective net yield after tax and management fees
  const rendementNetEffectif = montant > 0 ? (revenuAnnuelNet / montant) - fraisGestionPct : 0

  // Capital evolution year by year (reinvesting net income conceptually, but for comparison
  // we track capital + cumulated net income)
  const evolution: number[] = []
  let capitalCourant = montant
  for (let y = 1; y <= duree; y++) {
    capitalCourant = capitalCourant * (1 + rendementNetEffectif)
    evolution.push(Math.round(capitalCourant))
  }

  const capitalFinal = evolution[evolution.length - 1] || montant
  const revenuCumuleNet = revenuAnnuelNet * duree

  // Total fees over period
  const fraisTotaux = montant * fraisEntreePct + montant * fraisGestionPct * duree

  return {
    id: scpi.id,
    nom: scpi.nom,
    type: 'SCPI',
    rendementBrut: scpi.td,
    fraisEntree: scpi.fraisSouscription,
    fraisGestion: scpi.fraisGestion,
    rendementNet: rendementNetEffectif * 100,
    capitalFinal,
    revenuCumuleNet: Math.round(revenuCumuleNet),
    liquidite: 'Quelques semaines',
    risque: 'Moyen (immobilier non cote)',
    ticketMin: scpi.prixPart,
    fraisTotaux: Math.round(fraisTotaux),
    fiscaliteLabel: `IR ${tmi}% + PS ${PRELEVEMENTS_SOCIAUX}%`,
    evolutionParAn: evolution,
  }
}

function computeAlternativeProjection(
  alt: AlternativeInvestissement,
  montant: number,
  duree: number,
  tmi: number,
): InvestmentProjection {
  const rendementBrut = alt.rendementMoyen / 100
  const fraisEntreePct = alt.fraisEntree / 100
  const fraisGestionPct = alt.fraisGestion / 100

  let tauxFiscalite: number
  let fiscaliteLabel: string

  if (alt.id === 'fonds-euros') {
    // Fonds euros: PFU 30% (or TMI + PS if TMI < 12.8%)
    // After 8 years: abatement. Simplify to PFU 30%.
    if (duree >= 8) {
      tauxFiscalite = 24.7 // reduced after 8 years with abatement
      fiscaliteLabel = 'PFU reduit (apres 8 ans)'
    } else {
      tauxFiscalite = 30
      fiscaliteLabel = 'PFU 30%'
    }
  } else if (alt.id === 'locatif-direct') {
    // Revenus fonciers: TMI + PS
    tauxFiscalite = tmi + PRELEVEMENTS_SOCIAUX
    fiscaliteLabel = `IR ${tmi}% + PS ${PRELEVEMENTS_SOCIAUX}%`
  } else {
    // ETF: PFU 30% flat tax
    tauxFiscalite = 30
    fiscaliteLabel = 'PFU 30%'
  }

  const capitalNetInvesti = montant * (1 - fraisEntreePct)
  const rendementNet = rendementBrut * (1 - tauxFiscalite / 100) - fraisGestionPct

  const evolution: number[] = []
  let capitalCourant = capitalNetInvesti
  for (let y = 1; y <= duree; y++) {
    capitalCourant = capitalCourant * (1 + rendementNet)
    evolution.push(Math.round(capitalCourant))
  }

  const capitalFinal = evolution[evolution.length - 1] || capitalNetInvesti
  const revenuCumuleNet = capitalFinal - capitalNetInvesti

  const fraisTotaux = montant * fraisEntreePct + capitalNetInvesti * fraisGestionPct * duree

  return {
    id: alt.id,
    nom: alt.nom,
    type: alt.type,
    rendementBrut: alt.rendementMoyen,
    fraisEntree: alt.fraisEntree,
    fraisGestion: alt.fraisGestion,
    rendementNet: rendementNet * 100,
    capitalFinal,
    revenuCumuleNet: Math.round(revenuCumuleNet),
    liquidite: alt.liquidite,
    risque: alt.risque,
    ticketMin: alt.ticketMin,
    fraisTotaux: Math.round(fraisTotaux),
    fiscaliteLabel,
    evolutionParAn: evolution,
  }
}

// ============================================================
// COMPONENTS
// ============================================================

function ComparisonCard({
  projection,
  color,
  isWinner,
}: {
  projection: InvestmentProjection
  color: string
  isWinner: boolean
}) {
  return (
    <div
      className="glass-card p-5 relative overflow-hidden"
      style={isWinner ? { borderColor: '#10B981', boxShadow: '0 0 20px rgba(16,185,129,0.1)' } : {}}
    >
      {isWinner && (
        <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full text-[10px] font-semibold"
          style={{ background: 'rgba(16,185,129,0.15)', color: '#34d399' }}>
          Meilleur capital
        </div>
      )}

      {/* Color strip */}
      <div className="absolute top-0 left-0 right-0 h-1 rounded-t-xl" style={{ background: color }} />

      {/* Header */}
      <div className="mt-1 mb-4">
        <h3 className="text-base font-semibold text-[#F1F5F9]">{projection.nom}</h3>
        <p className="text-xs text-[#475569]">{projection.type}</p>
      </div>

      {/* Metrics */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-xs text-[#94A3B8]">Rendement moyen</span>
          <span className="font-mono text-sm font-semibold text-[#F1F5F9]">{formatPct(projection.rendementBrut)}</span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-xs text-[#94A3B8]">Frais entree</span>
          <span className="font-mono text-sm text-[#F1F5F9]">{formatPct(projection.fraisEntree)}</span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-xs text-[#94A3B8]">Frais gestion</span>
          <span className="font-mono text-sm text-[#F1F5F9]">{formatPct(projection.fraisGestion)}</span>
        </div>

        <div className="h-px bg-white/[0.06]" />

        <div className="flex justify-between items-center">
          <span className="text-xs text-[#94A3B8]">Capital final estime</span>
          <span className="font-mono text-sm font-bold text-[#10B981]">{formatEUR(projection.capitalFinal)}</span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-xs text-[#94A3B8]">Revenu cumule net</span>
          <span className="font-mono text-sm font-semibold text-[#F1F5F9]">{formatEUR(projection.revenuCumuleNet)}</span>
        </div>

        <div className="h-px bg-white/[0.06]" />

        <div className="flex justify-between items-start">
          <span className="text-xs text-[#94A3B8]">Liquidite</span>
          {getLiquiditeBadge(projection.liquidite)}
        </div>

        <div className="flex justify-between items-start">
          <span className="text-xs text-[#94A3B8]">Risque</span>
          {getRisqueBadge(projection.risque)}
        </div>
      </div>
    </div>
  )
}

function EvolutionChart({
  projections,
  duree,
}: {
  projections: InvestmentProjection[]
  duree: number
}) {
  // Find global max for scaling
  const allValues = projections.flatMap(p => p.evolutionParAn)
  const maxVal = Math.max(...allValues, 1)

  const years = Array.from({ length: duree }, (_, i) => i + 1)

  return (
    <div className="glass-card p-6">
      <h3 className="text-lg font-semibold text-[#F1F5F9] mb-2">Evolution du capital</h3>
      <p className="text-xs text-[#475569] mb-6">Progression annuelle du capital investi pour chaque placement</p>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mb-6">
        {projections.map(p => (
          <div key={p.id} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-sm shrink-0"
              style={{ background: INVESTMENT_COLORS[p.id === projections[0].id ? 'scpi' : p.id] || '#94A3B8' }}
            />
            <span className="text-xs text-[#94A3B8]">{p.nom}</span>
          </div>
        ))}
      </div>

      {/* Chart area */}
      <div className="space-y-4">
        {years.map(year => (
          <div key={year}>
            <div className="flex items-center gap-3 mb-1.5">
              <span className="text-xs text-[#475569] font-mono w-12 shrink-0">An {year}</span>
              <div className="flex-1 space-y-1">
                {projections.map(p => {
                  const value = p.evolutionParAn[year - 1] || 0
                  const widthPct = (value / maxVal) * 100
                  const colorKey = p.id === projections[0].id ? 'scpi' : p.id
                  return (
                    <div key={p.id} className="flex items-center gap-2">
                      <div className="flex-1 h-5 rounded bg-white/[0.03] overflow-hidden relative">
                        <div
                          className="h-full rounded transition-all duration-700 flex items-center px-2"
                          style={{
                            width: `${Math.max(widthPct, 2)}%`,
                            background: INVESTMENT_COLORS[colorKey] || '#94A3B8',
                            opacity: 0.85,
                          }}
                        >
                          {widthPct > 20 && (
                            <span className="text-[9px] font-mono text-white/90 whitespace-nowrap">
                              {formatEUR(value)}
                            </span>
                          )}
                        </div>
                      </div>
                      {widthPct <= 20 && (
                        <span className="text-[9px] font-mono text-[#94A3B8] whitespace-nowrap">
                          {formatEUR(value)}
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function SummaryTable({
  projections,
}: {
  projections: InvestmentProjection[]
}) {
  // Define rows
  const rows: { label: string; key: string; format: (p: InvestmentProjection) => string; highestWins: boolean }[] = [
    { label: 'Rendement brut', key: 'rendementBrut', format: p => formatPct(p.rendementBrut), highestWins: true },
    { label: 'Fiscalite', key: 'fiscalite', format: p => p.fiscaliteLabel, highestWins: false },
    { label: 'Rendement net', key: 'rendementNet', format: p => formatPct(p.rendementNet), highestWins: true },
    { label: 'Capital final', key: 'capitalFinal', format: p => formatEUR(p.capitalFinal), highestWins: true },
    { label: 'Risque', key: 'risque', format: p => p.risque, highestWins: false },
    { label: 'Liquidite', key: 'liquidite', format: p => p.liquidite, highestWins: false },
    { label: 'Ticket min', key: 'ticketMin', format: p => formatEUR(p.ticketMin), highestWins: false },
    { label: 'Frais totaux', key: 'fraisTotaux', format: p => formatEUR(p.fraisTotaux), highestWins: false },
  ]

  // Determine winner for numeric rows
  function getWinnerIndex(row: typeof rows[0]): number {
    if (row.key === 'risque' || row.key === 'liquidite' || row.key === 'fiscalite') return -1

    const values = projections.map(p => {
      if (row.key === 'rendementBrut') return p.rendementBrut
      if (row.key === 'rendementNet') return p.rendementNet
      if (row.key === 'capitalFinal') return p.capitalFinal
      if (row.key === 'ticketMin') return p.ticketMin
      if (row.key === 'fraisTotaux') return p.fraisTotaux
      return 0
    })

    if (row.key === 'ticketMin' || row.key === 'fraisTotaux') {
      // Lowest wins
      const min = Math.min(...values)
      return values.indexOf(min)
    }

    if (row.highestWins) {
      const max = Math.max(...values)
      return values.indexOf(max)
    }

    return -1
  }

  return (
    <div className="glass-card overflow-hidden">
      <div className="px-5 py-4 border-b border-white/[0.06]">
        <h3 className="text-lg font-semibold text-[#F1F5F9]">Tableau comparatif</h3>
        <p className="text-xs text-[#475569] mt-1">Le meilleur de chaque categorie est mis en evidence</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="text-left text-[11px] font-semibold uppercase tracking-wider text-[#475569] px-4 py-3 border-b border-white/[0.06] sticky left-0 bg-[rgba(19,24,37,0.95)] z-10 min-w-[140px]">
                Critere
              </th>
              {projections.map(p => (
                <th
                  key={p.id}
                  className="text-right text-[11px] font-semibold uppercase tracking-wider text-[#475569] px-4 py-3 border-b border-white/[0.06] min-w-[140px]"
                >
                  <div className="flex items-center justify-end gap-2">
                    <div
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ background: INVESTMENT_COLORS[p.id === projections[0].id ? 'scpi' : p.id] || '#94A3B8' }}
                    />
                    {p.nom}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(row => {
              const winnerIdx = getWinnerIndex(row)
              return (
                <tr key={row.key} className="border-b border-white/[0.06] hover:bg-white/[0.02] transition-colors">
                  <td className="text-sm text-[#94A3B8] px-4 py-3 sticky left-0 bg-[rgba(19,24,37,0.95)] z-10 font-medium">
                    {row.label}
                  </td>
                  {projections.map((p, idx) => {
                    const isWinner = idx === winnerIdx
                    return (
                      <td
                        key={p.id}
                        className={`text-right px-4 py-3 font-mono text-sm ${
                          isWinner ? 'text-[#10B981] font-bold' : 'text-[#F1F5F9]'
                        }`}
                      >
                        <div className="flex items-center justify-end gap-1.5">
                          {isWinner && (
                            <svg className="w-3.5 h-3.5 text-[#10B981] shrink-0" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                            </svg>
                          )}
                          <span>{row.format(p)}</span>
                        </div>
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ============================================================
// MAIN PAGE
// ============================================================

export default function AlternativesPage() {
  const [selectedSCPIId, setSelectedSCPIId] = useState<string>(SCPI_DATA[0].id)
  const [montant, setMontant] = useState<number>(50000)
  const [duree, setDuree] = useState<number>(10)
  const [tmi, setTmi] = useState<number>(30)

  const dureeOptions = [5, 10, 15, 20]
  const tmiOptions = TMI_TRANCHES.map(t => t.taux)

  const selectedSCPI = useMemo(
    () => SCPI_DATA.find(s => s.id === selectedSCPIId) || SCPI_DATA[0],
    [selectedSCPIId],
  )

  const projections = useMemo(() => {
    const scpiProj = computeSCPIProjection(selectedSCPI, montant, duree, tmi)
    const altProjs = ALTERNATIVES.map(alt => computeAlternativeProjection(alt, montant, duree, tmi))
    return [scpiProj, ...altProjs]
  }, [selectedSCPI, montant, duree, tmi])

  // Determine which projection has the highest capital final
  const bestCapitalIdx = useMemo(() => {
    let maxIdx = 0
    let maxVal = 0
    projections.forEach((p, i) => {
      if (p.capitalFinal > maxVal) {
        maxVal = p.capitalFinal
        maxIdx = i
      }
    })
    return maxIdx
  }, [projections])

  // Slider percentage for background fill
  const montantPct = ((montant - 5000) / (200000 - 5000)) * 100

  return (
    <AppShell>
      <div className="max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="inline-flex items-center shimmer-badge rounded-full px-4 py-1.5 text-sm text-[#6366F1] mb-4">
            Comparateur
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-[#F1F5F9]">
            SCPI vs <span className="text-[#2563EB]">Alternatives</span>
          </h1>
          <p className="text-[#94A3B8] mt-3 max-w-2xl">
            Comparez votre SCPI avec les principales alternatives d&apos;investissement :
            ETF immobilier, ETF actions, fonds euros et investissement locatif direct.
          </p>
        </div>

        {/* ============================================================
            CONFIGURATION PANEL
            ============================================================ */}
        <div className="glass-card p-6 mb-8">
          <h2 className="text-sm font-semibold text-[#F1F5F9] uppercase tracking-wider mb-5">Configuration</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* SCPI Selector */}
            <div>
              <label className="text-xs font-medium text-[#94A3B8] mb-2 block">SCPI de reference</label>
              <select
                value={selectedSCPIId}
                onChange={e => setSelectedSCPIId(e.target.value)}
                className="sim-select w-full"
              >
                {SCPI_DATA.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.nom} (TD {s.td}%)
                  </option>
                ))}
              </select>
            </div>

            {/* Montant investi */}
            <div>
              <label className="text-xs font-medium text-[#94A3B8] mb-2 block">Montant investi</label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={5000}
                  max={200000}
                  step={5000}
                  value={montant}
                  onChange={e => setMontant(Number(e.target.value))}
                  className="sim-slider flex-1"
                  style={{
                    background: `linear-gradient(to right, var(--accent) 0%, var(--accent) ${montantPct}%, rgba(255,255,255,0.1) ${montantPct}%, rgba(255,255,255,0.1) 100%)`,
                  }}
                />
                <span className="font-mono text-sm font-semibold text-[#F1F5F9] tabular-nums w-24 text-right">
                  {formatEUR(montant)}
                </span>
              </div>
              <div className="flex justify-between text-[10px] text-[#475569] mt-1">
                <span>5 000 \u20AC</span>
                <span>200 000 \u20AC</span>
              </div>
            </div>

            {/* Duree */}
            <div>
              <label className="text-xs font-medium text-[#94A3B8] mb-2 block">Duree de placement</label>
              <div className="flex gap-2">
                {dureeOptions.map(d => (
                  <button
                    key={d}
                    onClick={() => setDuree(d)}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                      duree === d
                        ? 'bg-[#2563EB] text-white shadow-lg shadow-[#2563EB]/20'
                        : 'bg-white/[0.05] text-[#94A3B8] hover:bg-white/[0.08] hover:text-[#F1F5F9]'
                    }`}
                  >
                    {d} ans
                  </button>
                ))}
              </div>
            </div>

            {/* TMI */}
            <div>
              <label className="text-xs font-medium text-[#94A3B8] mb-2 block">
                Tranche marginale d&apos;imposition
              </label>
              <div className="flex gap-2">
                {tmiOptions.map(t => (
                  <button
                    key={t}
                    onClick={() => setTmi(t)}
                    className={`flex-1 py-2 rounded-lg text-sm font-mono font-medium transition-all ${
                      tmi === t
                        ? 'bg-[#2563EB] text-white shadow-lg shadow-[#2563EB]/20'
                        : 'bg-white/[0.05] text-[#94A3B8] hover:bg-white/[0.08] hover:text-[#F1F5F9]'
                    }`}
                  >
                    {t}%
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ============================================================
            COMPARISON CARDS
            ============================================================ */}
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-[#475569] uppercase tracking-wider mb-4">
            Projections sur {duree} ans &mdash; {formatEUR(montant)} investis &mdash; TMI {tmi}%
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {projections.map((p, idx) => {
              const colorKey = idx === 0 ? 'scpi' : p.id
              return (
                <ComparisonCard
                  key={p.id}
                  projection={p}
                  color={INVESTMENT_COLORS[colorKey] || '#94A3B8'}
                  isWinner={idx === bestCapitalIdx}
                />
              )
            })}
          </div>
        </div>

        {/* ============================================================
            EVOLUTION CHART
            ============================================================ */}
        <div className="mb-8">
          <EvolutionChart projections={projections} duree={duree} />
        </div>

        {/* ============================================================
            SUMMARY TABLE
            ============================================================ */}
        <div className="mb-8">
          <SummaryTable projections={projections} />
        </div>

        {/* ============================================================
            DISCLAIMER
            ============================================================ */}
        <div className="glass-card p-4 mb-4">
          <h4 className="text-xs font-semibold text-[#475569] uppercase tracking-wider mb-2">Methodologie</h4>
          <ul className="text-xs text-[#475569] space-y-1 leading-relaxed">
            <li>Le capital final est estime selon la formule : Montant x (1 + rendement_net)^duree, apres deduction des frais et de la fiscalite.</li>
            <li>Pour les SCPI, la fiscalite tient compte de la part de revenus etrangers (conventions fiscales) et des prelevements sociaux ({PRELEVEMENTS_SOCIAUX}%).</li>
            <li>Les ETF sont soumis au Prelevement Forfaitaire Unique (PFU) de 30%. Les fonds euros beneficient d&apos;un abattement apres 8 ans.</li>
            <li>L&apos;investissement locatif direct est soumis au bareme de l&apos;IR (revenus fonciers) + prelevements sociaux.</li>
            <li>Les rendements passes ne prejugent pas des rendements futurs. Cette simulation est purement indicative.</li>
          </ul>
        </div>

        <p className="text-[11px] text-[#475569]/60 leading-relaxed pb-8">
          Les performances passees ne prejugent pas des performances futures. Les projections presentees sont
          purement indicatives et ne constituent en aucun cas un conseil en investissement. Investir comporte
          des risques, notamment de perte en capital. Consultez un conseiller en gestion de patrimoine avant
          toute decision d&apos;investissement.
        </p>
      </div>
    </AppShell>
  )
}
