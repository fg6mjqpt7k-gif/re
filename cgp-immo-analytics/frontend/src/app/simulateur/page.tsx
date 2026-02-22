'use client'

import { useState, useMemo } from 'react'
import AppShell from '../../components/AppShell'
import {
  SCPI_DATA,
  SCPI,
  TMI_TRANCHES,
  PRELEVEMENTS_SOCIAUX,
  calcRevenuNetMensuel,
  computeIRR,
} from '../../lib/data'

/* ================================================================
   HELPERS
   ================================================================ */

const fmt = (n: number, decimals = 2): string =>
  n.toLocaleString('fr-FR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })

const fmtEur = (n: number, decimals = 2): string => `${fmt(n, decimals)} \u20AC`

/* ================================================================
   TRI SIMULATION LOGIC
   ================================================================ */

interface SimulationResult {
  duration: number
  tri: number | null
  cashFlows: { year: number; dividende: number; valeurPart: number; cumulDividendes: number }[]
  totalDividendes: number
  valeurSortie: number
  gainTotal: number
  gainPct: number
}

function simulateTRI(
  prixPart: number,
  fraisEntree: number,
  rendementBase: number,
  adjustRendement: number,
  adjustPrix: number,
  duree: number,
): SimulationResult {
  const investissement = prixPart
  const rendementAjuste = rendementBase * (1 + adjustRendement / 100)
  const variationPrixAnnuelle = adjustPrix / duree
  const prixFinal = prixPart * (1 + adjustPrix / 100)
  const valeurSortie = prixFinal * (1 - fraisEntree / 100)

  const flows: number[] = [-investissement]
  const details: SimulationResult['cashFlows'] = []
  let cumulDiv = 0

  for (let t = 1; t <= duree; t++) {
    const prixPartAnnee = prixPart * (1 + (variationPrixAnnuelle * t) / 100)
    const dividende = prixPart * rendementAjuste / 100
    cumulDiv += dividende

    details.push({
      year: t,
      dividende: Math.round(dividende * 100) / 100,
      valeurPart: Math.round(prixPartAnnee * 100) / 100,
      cumulDividendes: Math.round(cumulDiv * 100) / 100,
    })

    if (t < duree) {
      flows.push(dividende)
    } else {
      flows.push(dividende + valeurSortie)
    }
  }

  const tri = computeIRR(flows)
  const totalDividendes = cumulDiv
  const gainTotal = totalDividendes + valeurSortie - investissement
  const gainPct = (gainTotal / investissement) * 100

  return {
    duration: duree,
    tri,
    cashFlows: details,
    totalDividendes: Math.round(totalDividendes * 100) / 100,
    valeurSortie: Math.round(valeurSortie * 100) / 100,
    gainTotal: Math.round(gainTotal * 100) / 100,
    gainPct: Math.round(gainPct * 100) / 100,
  }
}

/* ================================================================
   DONUT CSS COMPONENT
   ================================================================ */

function DonutChart({
  netPct,
  irPct,
  psPct,
}: {
  netPct: number
  irPct: number
  psPct: number
}) {
  const netDeg = (netPct / 100) * 360
  const irDeg = (irPct / 100) * 360
  const psDeg = (psPct / 100) * 360

  const gradient = `conic-gradient(
    #10B981 0deg ${netDeg}deg,
    #EF4444 ${netDeg}deg ${netDeg + irDeg}deg,
    #F59E0B ${netDeg + irDeg}deg ${netDeg + irDeg + psDeg}deg
  )`

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative w-40 h-40">
        <div
          className="w-full h-full rounded-full"
          style={{ background: gradient }}
        />
        <div
          className="absolute inset-4 rounded-full flex flex-col items-center justify-center"
          style={{ background: '#0B1120' }}
        >
          <span className="font-tabular text-2xl font-bold text-[#10B981]">
            {netPct.toFixed(1)}%
          </span>
          <span className="text-[10px] text-[#94A3B8] uppercase tracking-wider">Net</span>
        </div>
      </div>
      <div className="flex items-center gap-4 text-xs">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-[#10B981]" />
          <span className="text-[#94A3B8]">Net {netPct.toFixed(1)}%</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-[#EF4444]" />
          <span className="text-[#94A3B8]">IR {irPct.toFixed(1)}%</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]" />
          <span className="text-[#94A3B8]">PS {psPct.toFixed(1)}%</span>
        </div>
      </div>
    </div>
  )
}

/* ================================================================
   PROJECTION TABLE (REVENUS)
   ================================================================ */

function ProjectionRevenusTable({
  netMensuel,
  brutMensuel,
}: {
  netMensuel: number
  brutMensuel: number
}) {
  const horizons = [
    { label: '5 ans', mois: 60 },
    { label: '10 ans', mois: 120 },
    { label: '20 ans', mois: 240 },
  ]

  return (
    <div className="glass-card overflow-hidden">
      <div className="px-4 py-3 border-b border-white/[0.06]">
        <h3 className="text-sm font-semibold text-[#F1F5F9]">Projection des revenus cumules</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="fund-table">
          <thead>
            <tr>
              <th>Horizon</th>
              <th>Revenu brut cumule</th>
              <th>Revenu net cumule</th>
              <th>Impots cumules</th>
            </tr>
          </thead>
          <tbody>
            {horizons.map((h) => {
              const cumulBrut = brutMensuel * h.mois
              const cumulNet = netMensuel * h.mois
              const cumulTax = cumulBrut - cumulNet
              return (
                <tr key={h.label}>
                  <td className="font-medium text-[#F1F5F9]">{h.label}</td>
                  <td className="font-tabular text-[#94A3B8]">{fmtEur(cumulBrut)}</td>
                  <td className="font-tabular text-[#10B981] font-semibold">{fmtEur(cumulNet)}</td>
                  <td className="font-tabular text-[#EF4444]">{fmtEur(cumulTax)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/* ================================================================
   PROJECTION BAR VISUAL (REVENUS)
   ================================================================ */

function RevenusBarVisual({
  netMensuel,
  brutMensuel,
}: {
  netMensuel: number
  brutMensuel: number
}) {
  const horizons = [
    { label: '5 ans', mois: 60 },
    { label: '10 ans', mois: 120 },
    { label: '20 ans', mois: 240 },
  ]

  const maxVal = brutMensuel * 240

  return (
    <div className="glass-card p-5">
      <h3 className="text-sm font-semibold text-[#F1F5F9] mb-5">Evolution des revenus cumules</h3>
      <div className="space-y-4">
        {horizons.map((h) => {
          const cumulBrut = brutMensuel * h.mois
          const cumulNet = netMensuel * h.mois
          const cumulTax = cumulBrut - cumulNet
          const netWidth = maxVal > 0 ? (cumulNet / maxVal) * 100 : 0
          const taxWidth = maxVal > 0 ? (cumulTax / maxVal) * 100 : 0

          return (
            <div key={h.label}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm text-[#94A3B8]">{h.label}</span>
                <span className="font-tabular text-sm text-[#F1F5F9]">{fmtEur(cumulNet, 0)}</span>
              </div>
              <div className="flex h-7 rounded-lg overflow-hidden bg-white/[0.03]">
                <div
                  className="h-full flex items-center justify-center text-[10px] font-tabular text-white/80 transition-all duration-500"
                  style={{ width: `${netWidth}%`, backgroundColor: '#10B981' }}
                >
                  {netWidth > 20 && fmtEur(cumulNet, 0)}
                </div>
                <div
                  className="h-full flex items-center justify-center text-[10px] font-tabular text-white/60 transition-all duration-500"
                  style={{ width: `${taxWidth}%`, backgroundColor: '#EF4444', opacity: 0.5 }}
                >
                  {taxWidth > 15 && fmtEur(cumulTax, 0)}
                </div>
              </div>
            </div>
          )
        })}
      </div>
      <div className="flex items-center gap-5 mt-4 pt-3 border-t border-white/[0.06]">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: '#10B981' }} />
          <span className="text-xs text-[#475569]">Revenu net</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: '#EF4444', opacity: 0.5 }} />
          <span className="text-xs text-[#475569]">Fiscalite</span>
        </div>
      </div>
    </div>
  )
}

/* ================================================================
   TRI: CASH FLOW TABLE
   ================================================================ */

function CashFlowTable({
  data,
  investissement,
}: {
  data: SimulationResult['cashFlows']
  investissement: number
}) {
  return (
    <div className="glass-card overflow-hidden">
      <div className="px-4 py-3 border-b border-white/[0.06]">
        <h3 className="text-sm font-semibold text-[#F1F5F9]">Projection des flux</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="fund-table">
          <thead>
            <tr>
              <th>Annee</th>
              <th>Dividende</th>
              <th>Cumul dividendes</th>
              <th>Valeur de la part</th>
              <th>Valeur totale</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="font-tabular text-[#475569]">0</td>
              <td className="font-tabular text-[#475569]">-</td>
              <td className="font-tabular text-[#475569]">{fmtEur(0)}</td>
              <td className="font-tabular text-[#94A3B8]">{fmtEur(investissement)}</td>
              <td className="font-tabular text-[#EF4444]">-{fmtEur(investissement)}</td>
            </tr>
            {data.map((row) => {
              const valTotale = row.cumulDividendes + row.valeurPart - investissement
              return (
                <tr key={row.year}>
                  <td className="font-tabular text-[#94A3B8]">{row.year}</td>
                  <td className="font-tabular text-[#10B981]">{fmtEur(row.dividende)}</td>
                  <td className="font-tabular text-[#94A3B8]">{fmtEur(row.cumulDividendes)}</td>
                  <td className="font-tabular text-[#94A3B8]">{fmtEur(row.valeurPart)}</td>
                  <td className={`font-tabular ${valTotale >= 0 ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
                    {valTotale >= 0 ? '+' : ''}{fmtEur(valTotale)}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/* ================================================================
   TRI: BAR CHART
   ================================================================ */

function BarChartTRI({
  sim5,
  sim10,
  investissement,
}: {
  sim5: SimulationResult
  sim10: SimulationResult
  investissement: number
}) {
  const maxVal = Math.max(
    sim5.totalDividendes + sim5.valeurSortie,
    sim10.totalDividendes + sim10.valeurSortie,
    investissement,
  )

  const bars = [
    {
      label: 'Investissement',
      segments: [{ value: investissement, color: '#2563EB', label: 'Capital investi' }],
    },
    {
      label: 'Sortie 5 ans',
      segments: [
        { value: sim5.valeurSortie, color: '#2563EB', label: 'Valeur de retrait' },
        { value: sim5.totalDividendes, color: '#10B981', label: 'Dividendes cumules' },
      ],
    },
    {
      label: 'Sortie 10 ans',
      segments: [
        { value: sim10.valeurSortie, color: '#2563EB', label: 'Valeur de retrait' },
        { value: sim10.totalDividendes, color: '#10B981', label: 'Dividendes cumules' },
      ],
    },
  ]

  return (
    <div className="glass-card p-6">
      <h3 className="text-sm font-semibold text-[#F1F5F9] mb-6">Comparaison investissement vs sortie</h3>
      <div className="space-y-5">
        {bars.map((bar, i) => {
          const total = bar.segments.reduce((s, seg) => s + seg.value, 0)
          return (
            <div key={i}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-[#94A3B8]">{bar.label}</span>
                <span className="font-tabular text-sm text-[#F1F5F9]">{fmtEur(total)}</span>
              </div>
              <div className="flex h-8 rounded-lg overflow-hidden bg-white/[0.03]">
                {bar.segments.map((seg, j) => (
                  <div
                    key={j}
                    className="h-full transition-all duration-500 flex items-center justify-center text-[10px] font-tabular text-white/80"
                    style={{
                      width: `${maxVal > 0 ? (seg.value / maxVal) * 100 : 0}%`,
                      backgroundColor: seg.color,
                      opacity: j === 0 ? 1 : 0.7,
                    }}
                  >
                    {(seg.value / maxVal) * 100 > 15 && fmtEur(seg.value, 0)}
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
      <div className="flex items-center gap-5 mt-4 pt-3 border-t border-white/[0.06]">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: '#2563EB' }} />
          <span className="text-xs text-[#475569]">Valeur de retrait</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: '#10B981', opacity: 0.7 }} />
          <span className="text-xs text-[#475569]">Dividendes cumules</span>
        </div>
      </div>
    </div>
  )
}

/* ================================================================
   TRI: RESULT CARD
   ================================================================ */

function ResultCard({
  label,
  value,
  subtext,
  highlight,
  large,
}: {
  label: string
  value: string
  subtext?: string
  highlight?: 'positive' | 'negative' | 'neutral'
  large?: boolean
}) {
  const colorClass =
    highlight === 'positive'
      ? 'text-[#10B981]'
      : highlight === 'negative'
      ? 'text-[#EF4444]'
      : 'text-[#F1F5F9]'

  return (
    <div className={`glass-card p-4 ${large ? 'col-span-2 sm:col-span-1' : ''}`}>
      <p className="text-xs text-[#475569] uppercase tracking-wider mb-1">{label}</p>
      <p className={`font-tabular font-bold ${large ? 'text-3xl' : 'text-xl'} ${colorClass}`}>
        {value}
      </p>
      {subtext && <p className="text-xs text-[#475569] mt-1">{subtext}</p>}
    </div>
  )
}

/* ================================================================
   SLIDER INPUT COMPONENT
   ================================================================ */

function SliderInput({
  label,
  value,
  onChange,
  min,
  max,
  step,
  unit,
  description,
}: {
  label: string
  value: number
  onChange: (v: number) => void
  min: number
  max: number
  step: number
  unit: string
  description?: string
}) {
  const pct = ((value - min) / (max - min)) * 100
  const isPositive = value > 0
  const isNegative = value < 0

  return (
    <div className="mb-5">
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm font-medium text-[#94A3B8]">{label}</label>
        <span
          className={`font-tabular text-sm font-semibold ${
            isPositive ? 'text-[#10B981]' : isNegative ? 'text-[#EF4444]' : 'text-[#F1F5F9]'
          }`}
        >
          {value > 0 ? '+' : ''}
          {value}
          {unit}
        </span>
      </div>
      {description && <p className="text-xs text-[#475569] mb-2">{description}</p>}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="sim-slider w-full"
        style={{
          background: `linear-gradient(to right, #2563EB 0%, #2563EB ${pct}%, rgba(255,255,255,0.1) ${pct}%, rgba(255,255,255,0.1) 100%)`,
        }}
      />
      <div className="flex justify-between text-[10px] text-[#475569] mt-1">
        <span>
          {min}
          {unit}
        </span>
        <span>
          {max > 0 ? '+' : ''}
          {max}
          {unit}
        </span>
      </div>
    </div>
  )
}

/* ================================================================
   MAIN PAGE COMPONENT
   ================================================================ */

export default function SimulateurPage() {
  // -- Global tab state --
  const [activeMainTab, setActiveMainTab] = useState<'revenus' | 'tri'>('revenus')

  // ================ TAB 1: REVENUS STATE ================
  const [selectedScpiId, setSelectedScpiId] = useState<string>(SCPI_DATA[0].id)
  const [montantInvesti, setMontantInvesti] = useState(50000)
  const [selectedTMI, setSelectedTMI] = useState(30)
  const [manualTD, setManualTD] = useState<string>('')
  const [manualPartEtranger, setManualPartEtranger] = useState<string>('')
  const [useManualInput, setUseManualInput] = useState(false)

  // ================ TAB 2: TRI STATE ================
  const [triPrixPart, setTriPrixPart] = useState(200)
  const [triFraisEntree, setTriFraisEntree] = useState(0)
  const [triRendement, setTriRendement] = useState(7.0)
  const [triSelectedPreset, setTriSelectedPreset] = useState<string>('')
  const [adjustRendement, setAdjustRendement] = useState(0)
  const [adjustPrix, setAdjustPrix] = useState(0)
  const [triCashFlowTab, setTriCashFlowTab] = useState<'5ans' | '10ans'>('5ans')

  // ================ TAB 1: DERIVED VALUES ================
  const selectedScpi: SCPI | undefined = useMemo(
    () => SCPI_DATA.find((s) => s.id === selectedScpiId),
    [selectedScpiId],
  )

  const effectiveTD = useManualInput
    ? parseFloat(manualTD) || 0
    : selectedScpi?.td ?? 0

  const effectivePartEtranger = useManualInput
    ? parseFloat(manualPartEtranger) || 0
    : selectedScpi?.partRevenusEtrangers ?? 0

  const revenus = useMemo(
    () => calcRevenuNetMensuel(montantInvesti, effectiveTD, selectedTMI, effectivePartEtranger),
    [montantInvesti, effectiveTD, selectedTMI, effectivePartEtranger],
  )

  const taxBreakdown = useMemo(() => {
    const total = revenus.brut
    if (total <= 0) return { netPct: 100, irPct: 0, psPct: 0 }
    return {
      netPct: (revenus.net / total) * 100,
      irPct: (revenus.ir / total) * 100,
      psPct: (revenus.ps / total) * 100,
    }
  }, [revenus])

  // montant slider percentage for gradient
  const montantPct = ((montantInvesti - 5000) / (500000 - 5000)) * 100

  // ================ TAB 2: DERIVED VALUES ================
  const handleTriPreset = (presetName: string) => {
    setTriSelectedPreset(presetName)
    const scpi = SCPI_DATA.find((s) => s.nom === presetName)
    if (scpi) {
      setTriPrixPart(scpi.prixPart)
      setTriFraisEntree(scpi.fraisSouscription)
      setTriRendement(scpi.td)
      setAdjustRendement(0)
      setAdjustPrix(0)
    }
  }

  const sim5 = useMemo(
    () => simulateTRI(triPrixPart, triFraisEntree, triRendement, adjustRendement, adjustPrix, 5),
    [triPrixPart, triFraisEntree, triRendement, adjustRendement, adjustPrix],
  )

  const sim10 = useMemo(
    () => simulateTRI(triPrixPart, triFraisEntree, triRendement, adjustRendement, adjustPrix, 10),
    [triPrixPart, triFraisEntree, triRendement, adjustRendement, adjustPrix],
  )

  const rendementAjuste = triRendement * (1 + adjustRendement / 100)
  const prixSortieAjuste = triPrixPart * (1 + adjustPrix / 100)

  const formatTRI = (tri: number | null): string => {
    if (tri === null) return 'N/A'
    return (tri * 100).toFixed(2) + '%'
  }

  const triHighlight = (tri: number | null): 'positive' | 'negative' | 'neutral' => {
    if (tri === null) return 'neutral'
    return tri >= 0 ? 'positive' : 'negative'
  }

  // ================================================================
  // RENDER
  // ================================================================

  return (
    <AppShell>
      <div className="max-w-[1280px] mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <div className="inline-flex items-center shimmer-badge rounded-full px-4 py-1.5 text-sm text-[#6366F1] mb-4">
            Simulateur SCPI
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-[#F1F5F9]">
            Simulateur <span className="text-[#2563EB]">Revenus & TRI</span>
          </h1>
          <p className="text-[#94A3B8] mt-3 max-w-2xl text-sm leading-relaxed">
            Estimez vos revenus nets mensuels apres fiscalite ou calculez le Taux de Rendement
            Interne de votre investissement SCPI sur differents horizons.
          </p>
        </div>

        {/* Main Tab Switcher */}
        <div className="flex gap-1 p-1 rounded-xl bg-white/[0.04] border border-white/[0.06] mb-8 w-fit">
          <button
            onClick={() => setActiveMainTab('revenus')}
            className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeMainTab === 'revenus'
                ? 'bg-[#2563EB] text-white shadow-lg shadow-[#2563EB]/20'
                : 'text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-white/[0.04]'
            }`}
          >
            Simulateur de Revenus Mensuel
          </button>
          <button
            onClick={() => setActiveMainTab('tri')}
            className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeMainTab === 'tri'
                ? 'bg-[#2563EB] text-white shadow-lg shadow-[#2563EB]/20'
                : 'text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-white/[0.04]'
            }`}
          >
            Simulateur TRI
          </button>
        </div>

        {/* ================================================================
            TAB 1: SIMULATEUR DE REVENUS MENSUEL
            ================================================================ */}
        {activeMainTab === 'revenus' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* LEFT: Inputs */}
            <div className="lg:col-span-4">
              <div className="glass-card p-6 sticky top-24">
                <h2 className="text-lg font-semibold text-[#F1F5F9] mb-6">Parametres</h2>

                {/* Toggle manual / SCPI selection */}
                <div className="flex items-center gap-3 mb-5">
                  <button
                    onClick={() => setUseManualInput(false)}
                    className={`text-xs px-3 py-1.5 rounded-md transition ${
                      !useManualInput
                        ? 'bg-[#2563EB]/15 text-[#60a5fa] font-medium'
                        : 'text-[#475569] hover:text-[#94A3B8]'
                    }`}
                  >
                    SCPI existante
                  </button>
                  <button
                    onClick={() => setUseManualInput(true)}
                    className={`text-xs px-3 py-1.5 rounded-md transition ${
                      useManualInput
                        ? 'bg-[#2563EB]/15 text-[#60a5fa] font-medium'
                        : 'text-[#475569] hover:text-[#94A3B8]'
                    }`}
                  >
                    Saisie manuelle
                  </button>
                </div>

                {!useManualInput ? (
                  <div className="mb-5">
                    <label className="text-sm font-medium text-[#94A3B8] mb-2 block">
                      Selectionner une SCPI
                    </label>
                    <select
                      value={selectedScpiId}
                      onChange={(e) => setSelectedScpiId(e.target.value)}
                      className="sim-select w-full"
                    >
                      {SCPI_DATA.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.nom} — TD {s.td}%
                        </option>
                      ))}
                    </select>
                    {selectedScpi && (
                      <div className="mt-3 p-3 rounded-lg bg-white/[0.03] border border-white/[0.04]">
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-[#475569]">TD</span>
                            <span className="font-tabular text-[#10B981] ml-2">{selectedScpi.td}%</span>
                          </div>
                          <div>
                            <span className="text-[#475569]">Rev. etranger</span>
                            <span className="font-tabular text-[#94A3B8] ml-2">
                              {selectedScpi.partRevenusEtrangers}%
                            </span>
                          </div>
                          <div>
                            <span className="text-[#475569]">Frais souscr.</span>
                            <span className="font-tabular text-[#94A3B8] ml-2">
                              {selectedScpi.fraisSouscription}%
                            </span>
                          </div>
                          <div>
                            <span className="text-[#475569]">Prix part</span>
                            <span className="font-tabular text-[#94A3B8] ml-2">
                              {fmtEur(selectedScpi.prixPart, 0)}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4 mb-5">
                    <div>
                      <label className="text-sm font-medium text-[#94A3B8] mb-2 block">
                        Taux de distribution (TD)
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          value={manualTD}
                          onChange={(e) => setManualTD(e.target.value)}
                          placeholder="Ex: 5.50"
                          min={0}
                          max={15}
                          step={0.01}
                          className="sim-input w-full pr-8"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#475569] text-sm">
                          %
                        </span>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-[#94A3B8] mb-2 block">
                        Part revenus etrangers
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          value={manualPartEtranger}
                          onChange={(e) => setManualPartEtranger(e.target.value)}
                          placeholder="Ex: 50"
                          min={0}
                          max={100}
                          step={1}
                          className="sim-input w-full pr-8"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#475569] text-sm">
                          %
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="h-px bg-white/[0.06] my-5" />

                {/* Montant investi */}
                <div className="mb-5">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-[#94A3B8]">Montant investi</label>
                    <span className="font-tabular text-sm font-semibold text-[#F1F5F9]">
                      {fmtEur(montantInvesti, 0)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={5000}
                    max={500000}
                    step={1000}
                    value={montantInvesti}
                    onChange={(e) => setMontantInvesti(Number(e.target.value))}
                    className="sim-slider w-full"
                    style={{
                      background: `linear-gradient(to right, #2563EB 0%, #2563EB ${montantPct}%, rgba(255,255,255,0.1) ${montantPct}%, rgba(255,255,255,0.1) 100%)`,
                    }}
                  />
                  <div className="flex justify-between text-[10px] text-[#475569] mt-1">
                    <span>5 000 \u20AC</span>
                    <span>500 000 \u20AC</span>
                  </div>
                </div>

                {/* TMI Selector */}
                <div className="mb-2">
                  <label className="text-sm font-medium text-[#94A3B8] mb-3 block">
                    Tranche Marginale d&apos;Imposition (TMI)
                  </label>
                  <div className="grid grid-cols-5 gap-1.5">
                    {TMI_TRANCHES.map((t) => (
                      <button
                        key={t.taux}
                        onClick={() => setSelectedTMI(t.taux)}
                        className={`py-2 rounded-lg text-sm font-tabular font-medium transition-all ${
                          selectedTMI === t.taux
                            ? 'bg-[#2563EB] text-white shadow-lg shadow-[#2563EB]/20'
                            : 'bg-white/[0.04] text-[#94A3B8] hover:bg-white/[0.08] hover:text-[#F1F5F9]'
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-[#475569] mt-2">
                    Prelevements sociaux: {PRELEVEMENTS_SOCIAUX}%
                  </p>
                </div>
              </div>
            </div>

            {/* RIGHT: Results */}
            <div className="lg:col-span-8">
              {/* Key metrics cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                <div className="glass-card p-4">
                  <p className="text-xs text-[#475569] uppercase tracking-wider mb-1">
                    Revenu brut mensuel
                  </p>
                  <p className="font-tabular text-xl font-bold text-[#F1F5F9]">
                    {fmtEur(revenus.brut)}
                  </p>
                  <p className="text-[10px] text-[#475569] mt-1">
                    {fmtEur(revenus.brut * 12)}/an
                  </p>
                </div>
                <div className="glass-card p-4">
                  <p className="text-xs text-[#475569] uppercase tracking-wider mb-1">
                    IR mensuel
                  </p>
                  <p className="font-tabular text-xl font-bold text-[#EF4444]">
                    -{fmtEur(revenus.ir)}
                  </p>
                  <p className="text-[10px] text-[#475569] mt-1">TMI {selectedTMI}%</p>
                </div>
                <div className="glass-card p-4">
                  <p className="text-xs text-[#475569] uppercase tracking-wider mb-1">
                    Prel. sociaux mensuel
                  </p>
                  <p className="font-tabular text-xl font-bold text-[#F59E0B]">
                    -{fmtEur(revenus.ps)}
                  </p>
                  <p className="text-[10px] text-[#475569] mt-1">PS {PRELEVEMENTS_SOCIAUX}%</p>
                </div>
                <div className="glass-card p-4 border-[#10B981]/30 relative overflow-hidden">
                  <div className="absolute inset-0 bg-[#10B981]/[0.04]" />
                  <div className="relative">
                    <p className="text-xs text-[#10B981] uppercase tracking-wider mb-1 font-semibold">
                      Revenu NET mensuel
                    </p>
                    <p className="font-tabular text-2xl font-bold text-[#10B981]">
                      {fmtEur(revenus.net)}
                    </p>
                    <p className="text-[10px] text-[#10B981]/60 mt-1">
                      {fmtEur(revenus.net * 12)}/an
                    </p>
                  </div>
                </div>
              </div>

              {/* Donut + summary side by side */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="glass-card p-6 flex items-center justify-center">
                  <DonutChart
                    netPct={taxBreakdown.netPct}
                    irPct={taxBreakdown.irPct}
                    psPct={taxBreakdown.psPct}
                  />
                </div>
                <div className="glass-card p-6">
                  <h3 className="text-sm font-semibold text-[#F1F5F9] mb-4">
                    Detail de la fiscalite
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm text-[#94A3B8]">Revenu brut annuel</span>
                        <span className="font-tabular text-sm text-[#F1F5F9]">
                          {fmtEur(revenus.brut * 12)}
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-white/[0.06]">
                        <div className="h-full rounded-full bg-[#94A3B8]" style={{ width: '100%' }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm text-[#EF4444]">Impot sur le revenu</span>
                        <span className="font-tabular text-sm text-[#EF4444]">
                          -{fmtEur(revenus.ir * 12)}
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-white/[0.06]">
                        <div
                          className="h-full rounded-full bg-[#EF4444]"
                          style={{
                            width: `${revenus.brut > 0 ? (revenus.ir / revenus.brut) * 100 : 0}%`,
                          }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm text-[#F59E0B]">Prelevements sociaux</span>
                        <span className="font-tabular text-sm text-[#F59E0B]">
                          -{fmtEur(revenus.ps * 12)}
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-white/[0.06]">
                        <div
                          className="h-full rounded-full bg-[#F59E0B]"
                          style={{
                            width: `${revenus.brut > 0 ? (revenus.ps / revenus.brut) * 100 : 0}%`,
                          }}
                        />
                      </div>
                    </div>
                    <div className="pt-3 border-t border-white/[0.06]">
                      <div className="flex justify-between">
                        <span className="text-sm font-semibold text-[#10B981]">Revenu net annuel</span>
                        <span className="font-tabular text-sm font-bold text-[#10B981]">
                          {fmtEur(revenus.net * 12)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {effectivePartEtranger > 0 && (
                    <div className="mt-4 pt-3 border-t border-white/[0.06]">
                      <p className="text-[11px] text-[#475569] leading-relaxed">
                        Les revenus de source etrangere ({effectivePartEtranger}%) beneficient d&apos;un
                        credit d&apos;impot (convention fiscale) reduisant l&apos;IR effectif.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Projection bars */}
              <div className="mb-6">
                <RevenusBarVisual netMensuel={revenus.net} brutMensuel={revenus.brut} />
              </div>

              {/* Projection table */}
              <div className="mb-6">
                <ProjectionRevenusTable netMensuel={revenus.net} brutMensuel={revenus.brut} />
              </div>

              {/* Methodology / Disclaimer */}
              <div className="glass-card p-4">
                <h4 className="text-xs font-semibold text-[#475569] uppercase tracking-wider mb-2">
                  Methodologie
                </h4>
                <ul className="text-xs text-[#475569] space-y-1 leading-relaxed">
                  <li>
                    Les revenus bruts sont calcules sur la base du Taux de Distribution (TD) applique
                    au montant investi.
                  </li>
                  <li>
                    La fiscalite distingue les revenus de source francaise (IR + PS) et etrangere
                    (credit d&apos;impot ~20% via conventions fiscales + PS).
                  </li>
                  <li>
                    Les prelevements sociaux s&apos;appliquent au taux de {PRELEVEMENTS_SOCIAUX}% sur
                    l&apos;ensemble des revenus.
                  </li>
                  <li>
                    Ce simulateur est indicatif. La fiscalite reelle depend de votre situation
                    personnelle globale.
                  </li>
                </ul>
              </div>

              <p className="text-[11px] text-[#475569]/60 mt-4 leading-relaxed">
                Les performances passees ne prejugent pas des performances futures. Les projections
                presentees sont purement indicatives et ne constituent en aucun cas un conseil en
                investissement.
              </p>
            </div>
          </div>
        )}

        {/* ================================================================
            TAB 2: SIMULATEUR TRI
            ================================================================ */}
        {activeMainTab === 'tri' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* LEFT: Inputs */}
            <div className="lg:col-span-4">
              <div className="glass-card p-6 sticky top-24">
                <h2 className="text-lg font-semibold text-[#F1F5F9] mb-6">Parametres</h2>

                {/* SCPI Preset */}
                <div className="mb-5">
                  <label className="text-sm font-medium text-[#94A3B8] mb-2 block">
                    SCPI de reference
                  </label>
                  <select
                    value={triSelectedPreset}
                    onChange={(e) => handleTriPreset(e.target.value)}
                    className="sim-select w-full"
                  >
                    <option value="">-- Saisie manuelle --</option>
                    {SCPI_DATA.map((s) => (
                      <option key={s.id} value={s.nom}>
                        {s.nom}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="h-px bg-white/[0.06] my-5" />

                {/* Prix de la part */}
                <div className="mb-4">
                  <label className="text-sm font-medium text-[#94A3B8] mb-2 block">
                    Prix de la part
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={triPrixPart}
                      onChange={(e) => {
                        setTriPrixPart(Number(e.target.value))
                        setTriSelectedPreset('')
                      }}
                      min={0}
                      step={1}
                      className="sim-input w-full pr-8"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#475569] text-sm">
                      {'\u20AC'}
                    </span>
                  </div>
                </div>

                {/* Frais d'entree */}
                <div className="mb-4">
                  <label className="text-sm font-medium text-[#94A3B8] mb-2 block">
                    Frais d&apos;entree (souscription)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={triFraisEntree}
                      onChange={(e) => {
                        setTriFraisEntree(Number(e.target.value))
                        setTriSelectedPreset('')
                      }}
                      min={0}
                      max={20}
                      step={0.01}
                      className="sim-input w-full pr-8"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#475569] text-sm">
                      %
                    </span>
                  </div>
                  <p className="text-[11px] text-[#475569] mt-1">
                    Frais deduits a la revente (valeur de retrait)
                  </p>
                </div>

                {/* Taux de distribution */}
                <div className="mb-5">
                  <label className="text-sm font-medium text-[#94A3B8] mb-2 block">
                    Taux de distribution (TD)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={triRendement}
                      onChange={(e) => {
                        setTriRendement(Number(e.target.value))
                        setTriSelectedPreset('')
                      }}
                      min={0}
                      max={15}
                      step={0.01}
                      className="sim-input w-full pr-8"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#475569] text-sm">
                      %
                    </span>
                  </div>
                </div>

                <div className="h-px bg-white/[0.06] my-5" />

                {/* Adjustment Sliders */}
                <h3 className="text-sm font-semibold text-[#F1F5F9] mb-4">
                  Scenarios d&apos;ajustement
                </h3>

                <SliderInput
                  label="Variation du rendement"
                  value={adjustRendement}
                  onChange={setAdjustRendement}
                  min={-20}
                  max={20}
                  step={1}
                  unit="%"
                  description={`TD ajuste : ${rendementAjuste.toFixed(2)}%`}
                />

                <SliderInput
                  label="Evolution du prix de part"
                  value={adjustPrix}
                  onChange={setAdjustPrix}
                  min={-20}
                  max={20}
                  step={1}
                  unit="%"
                  description={`Prix a la sortie : ${fmtEur(prixSortieAjuste)}`}
                />

                <button
                  onClick={() => {
                    setAdjustRendement(0)
                    setAdjustPrix(0)
                  }}
                  className="text-xs text-[#2563EB] hover:underline mt-1"
                >
                  Reinitialiser les ajustements
                </button>
              </div>
            </div>

            {/* RIGHT: Results */}
            <div className="lg:col-span-8">
              {/* TRI + Gain cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                <ResultCard
                  label="TRI 5 ans"
                  value={formatTRI(sim5.tri)}
                  highlight={triHighlight(sim5.tri)}
                  large
                />
                <ResultCard
                  label="TRI 10 ans"
                  value={formatTRI(sim10.tri)}
                  highlight={triHighlight(sim10.tri)}
                  large
                />
                <ResultCard
                  label="Gain total 5 ans"
                  value={`${sim5.gainTotal >= 0 ? '+' : ''}${fmtEur(sim5.gainTotal)}`}
                  subtext={`${sim5.gainPct >= 0 ? '+' : ''}${sim5.gainPct.toFixed(1)}%`}
                  highlight={sim5.gainTotal >= 0 ? 'positive' : 'negative'}
                />
                <ResultCard
                  label="Gain total 10 ans"
                  value={`${sim10.gainTotal >= 0 ? '+' : ''}${fmtEur(sim10.gainTotal)}`}
                  subtext={`${sim10.gainPct >= 0 ? '+' : ''}${sim10.gainPct.toFixed(1)}%`}
                  highlight={sim10.gainTotal >= 0 ? 'positive' : 'negative'}
                />
              </div>

              {/* Detail cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                <ResultCard
                  label="Dividendes 5 ans"
                  value={fmtEur(sim5.totalDividendes)}
                  highlight="positive"
                />
                <ResultCard
                  label="Dividendes 10 ans"
                  value={fmtEur(sim10.totalDividendes)}
                  highlight="positive"
                />
                <ResultCard
                  label="Valeur retrait 5 ans"
                  value={fmtEur(sim5.valeurSortie)}
                  highlight="neutral"
                />
                <ResultCard
                  label="Valeur retrait 10 ans"
                  value={fmtEur(sim10.valeurSortie)}
                  highlight="neutral"
                />
              </div>

              {/* Bar chart */}
              <div className="mb-6">
                <BarChartTRI sim5={sim5} sim10={sim10} investissement={triPrixPart} />
              </div>

              {/* Cash flow table tabs */}
              <div className="mb-6">
                <div className="flex gap-2 mb-0">
                  <button
                    onClick={() => setTriCashFlowTab('5ans')}
                    className={`px-4 py-2 text-sm font-medium rounded-t-lg transition ${
                      triCashFlowTab === '5ans'
                        ? 'bg-white/[0.06] text-[#2563EB] border border-white/[0.06] border-b-transparent'
                        : 'text-[#475569] hover:text-[#94A3B8]'
                    }`}
                  >
                    Projection 5 ans
                  </button>
                  <button
                    onClick={() => setTriCashFlowTab('10ans')}
                    className={`px-4 py-2 text-sm font-medium rounded-t-lg transition ${
                      triCashFlowTab === '10ans'
                        ? 'bg-white/[0.06] text-[#2563EB] border border-white/[0.06] border-b-transparent'
                        : 'text-[#475569] hover:text-[#94A3B8]'
                    }`}
                  >
                    Projection 10 ans
                  </button>
                </div>
                {triCashFlowTab === '5ans' ? (
                  <CashFlowTable data={sim5.cashFlows} investissement={triPrixPart} />
                ) : (
                  <CashFlowTable data={sim10.cashFlows} investissement={triPrixPart} />
                )}
              </div>

              {/* Methodology */}
              <div className="glass-card p-4">
                <h4 className="text-xs font-semibold text-[#475569] uppercase tracking-wider mb-2">
                  Methodologie
                </h4>
                <ul className="text-xs text-[#475569] space-y-1 leading-relaxed">
                  <li>
                    Le TRI (Taux de Rendement Interne) est calcule selon la methode standard avec les
                    flux de tresorerie annuels.
                  </li>
                  <li>
                    Le dividende annuel est base sur le prix de souscription initial multiplie par le
                    taux de distribution ajuste.
                  </li>
                  <li>
                    La valeur de retrait a la sortie est calculee en deduisant les frais d&apos;entree
                    du prix de part ajuste.
                  </li>
                  <li>
                    Les variations de rendement et de prix de part s&apos;appliquent de maniere
                    uniforme sur la duree.
                  </li>
                  <li>
                    Ce simulateur ne tient pas compte de la fiscalite (IR, prelevements sociaux) ni de
                    l&apos;inflation.
                  </li>
                </ul>
              </div>

              <p className="text-[11px] text-[#475569]/60 mt-4 leading-relaxed">
                Les performances passees ne prejugent pas des performances futures. Les projections
                presentees sont purement indicatives et ne constituent en aucun cas un conseil en
                investissement. Investir en SCPI comporte des risques, notamment de perte en capital
                et de liquidite.
              </p>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  )
}
