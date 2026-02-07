'use client'

import { useState, useMemo, useCallback } from 'react'

/* ================================================================
   IRR CALCULATION (Newton-Raphson method)
   ================================================================ */

function computeIRR(cashFlows: number[], guess: number = 0.05, maxIter: number = 200, tolerance: number = 1e-10): number | null {
  let rate = guess

  for (let i = 0; i < maxIter; i++) {
    let npv = 0
    let dnpv = 0

    for (let t = 0; t < cashFlows.length; t++) {
      const denom = Math.pow(1 + rate, t)
      npv += cashFlows[t] / denom
      if (t > 0) {
        dnpv -= t * cashFlows[t] / Math.pow(1 + rate, t + 1)
      }
    }

    if (Math.abs(dnpv) < 1e-15) break

    const newRate = rate - npv / dnpv

    if (Math.abs(newRate - rate) < tolerance) {
      return newRate
    }

    rate = newRate

    // Guard against divergence
    if (rate < -0.99 || rate > 10) {
      // Try bisection as fallback
      return computeIRRBisection(cashFlows)
    }
  }

  return computeIRRBisection(cashFlows)
}

function computeIRRBisection(cashFlows: number[], low: number = -0.5, high: number = 5, maxIter: number = 300): number | null {
  const npvAt = (r: number) => cashFlows.reduce((sum, cf, t) => sum + cf / Math.pow(1 + r, t), 0)

  if (npvAt(low) * npvAt(high) > 0) return null

  for (let i = 0; i < maxIter; i++) {
    const mid = (low + high) / 2
    const val = npvAt(mid)

    if (Math.abs(val) < 1e-10 || (high - low) / 2 < 1e-10) {
      return mid
    }

    if (val * npvAt(low) < 0) {
      high = mid
    } else {
      low = mid
    }
  }

  return (low + high) / 2
}

/* ================================================================
   SIMULATION LOGIC
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
  // Montant investi = prix de souscription (frais inclus)
  const investissement = prixPart

  // Rendement ajusté (le slider applique un facteur multiplicatif)
  const rendementAjuste = rendementBase * (1 + adjustRendement / 100)

  // Prix de part final ajusté (variation linéaire sur la durée)
  const variationPrixAnnuelle = adjustPrix / duree
  const prixFinal = prixPart * (1 + adjustPrix / 100)

  // Valeur de retrait à la sortie (on déduit les frais d'entrée qui correspondent aux frais de souscription)
  const valeurSortie = prixFinal * (1 - fraisEntree / 100)

  // Cash flows pour le calcul du TRI
  // t=0: investissement initial (négatif)
  const cashFlows: number[] = [-investissement]

  // Détail année par année
  const details: SimulationResult['cashFlows'] = []
  let cumulDiv = 0

  for (let t = 1; t <= duree; t++) {
    // Prix de part évoluant linéairement chaque année
    const prixPartAnnee = prixPart * (1 + (variationPrixAnnuelle * t) / 100)

    // Dividende annuel basé sur le prix de souscription initial * TD ajusté
    // (conforme à la méthodologie ASPIM : TD = dividende / prix de souscription au 1er janvier)
    const dividende = prixPart * rendementAjuste / 100

    cumulDiv += dividende

    details.push({
      year: t,
      dividende: Math.round(dividende * 100) / 100,
      valeurPart: Math.round(prixPartAnnee * 100) / 100,
      cumulDividendes: Math.round(cumulDiv * 100) / 100,
    })

    if (t < duree) {
      cashFlows.push(dividende)
    } else {
      // Dernière année : dividende + valeur de sortie (retrait)
      cashFlows.push(dividende + valeurSortie)
    }
  }

  const tri = computeIRR(cashFlows)

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
   PRESET SCPI DATA
   ================================================================ */

const PRESET_SCPIS = [
  { name: 'Corum Origin', prixPart: 1135, fraisEntree: 11.96, rendement: 6.06 },
  { name: 'Iroko Zen', prixPart: 200, fraisEntree: 0, rendement: 7.12 },
  { name: 'Remake Live', prixPart: 204, fraisEntree: 0, rendement: 7.79 },
  { name: 'Primovie', prixPart: 203, fraisEntree: 9.24, rendement: 4.21 },
  { name: 'Epargne Pierre', prixPart: 208, fraisEntree: 9.00, rendement: 5.28 },
  { name: 'Immorente', prixPart: 340, fraisEntree: 9.60, rendement: 5.00 },
  { name: 'Transitions Europe', prixPart: 200, fraisEntree: 0, rendement: 8.16 },
  { name: 'Novaxia Neo', prixPart: 187, fraisEntree: 0, rendement: 6.51 },
]

/* ================================================================
   COMPONENTS
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
    <div className="mb-6">
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm font-medium text-t-secondary">{label}</label>
        <span className={`font-mono text-sm font-semibold tabular-nums ${
          isPositive ? 'text-success' : isNegative ? 'text-danger' : 'text-t-primary'
        }`}>
          {value > 0 ? '+' : ''}{value}{unit}
        </span>
      </div>
      {description && <p className="text-xs text-t-tertiary mb-2">{description}</p>}
      <div className="relative">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={e => onChange(Number(e.target.value))}
          className="sim-slider w-full"
          style={{
            background: `linear-gradient(to right, var(--accent) 0%, var(--accent) ${pct}%, rgba(255,255,255,0.1) ${pct}%, rgba(255,255,255,0.1) 100%)`
          }}
        />
      </div>
      <div className="flex justify-between text-[10px] text-t-tertiary mt-1">
        <span>{min > 0 ? min : min}{unit}</span>
        <span>{max > 0 ? '+' : ''}{max}{unit}</span>
      </div>
    </div>
  )
}

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
  const colorClass = highlight === 'positive' ? 'text-success' :
    highlight === 'negative' ? 'text-danger' : 'text-t-primary'

  return (
    <div className={`glass-card p-4 ${large ? 'col-span-2 sm:col-span-1' : ''}`}>
      <p className="text-xs text-t-tertiary uppercase tracking-wider mb-1">{label}</p>
      <p className={`font-mono font-bold tabular-nums ${large ? 'text-3xl' : 'text-xl'} ${colorClass}`}>
        {value}
      </p>
      {subtext && <p className="text-xs text-t-tertiary mt-1">{subtext}</p>}
    </div>
  )
}

function CashFlowTable({ data, investissement }: {
  data: SimulationResult['cashFlows']
  investissement: number
}) {
  return (
    <div className="glass-card overflow-hidden mt-6">
      <div className="px-4 py-3 border-b border-white/[0.06]">
        <h3 className="text-sm font-semibold text-t-primary">Projection des flux</h3>
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
              <td className="font-mono text-t-tertiary">0</td>
              <td className="font-mono text-t-tertiary">-</td>
              <td className="font-mono text-t-tertiary">0,00 &euro;</td>
              <td className="font-mono text-t-secondary">{investissement.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} &euro;</td>
              <td className="font-mono text-danger">-{investissement.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} &euro;</td>
            </tr>
            {data.map(row => (
              <tr key={row.year}>
                <td className="font-mono text-t-secondary">{row.year}</td>
                <td className="font-mono text-success">{row.dividende.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} &euro;</td>
                <td className="font-mono text-t-secondary">{row.cumulDividendes.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} &euro;</td>
                <td className="font-mono text-t-secondary">{row.valeurPart.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} &euro;</td>
                <td className={`font-mono ${(row.cumulDividendes + row.valeurPart - investissement) >= 0 ? 'text-success' : 'text-danger'}`}>
                  {(row.cumulDividendes + row.valeurPart - investissement) >= 0 ? '+' : ''}
                  {(row.cumulDividendes + row.valeurPart - investissement).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} &euro;
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function BarChart({ sim5, sim10, investissement }: {
  sim5: SimulationResult
  sim10: SimulationResult
  investissement: number
}) {
  const maxVal = Math.max(
    sim5.totalDividendes + sim5.valeurSortie,
    sim10.totalDividendes + sim10.valeurSortie,
    investissement
  )

  const bars = [
    {
      label: 'Investissement',
      segments: [{ value: investissement, color: 'var(--accent)', label: 'Capital investi' }],
    },
    {
      label: 'Sortie 5 ans',
      segments: [
        { value: sim5.valeurSortie, color: 'var(--accent)', label: 'Valeur de retrait' },
        { value: sim5.totalDividendes, color: 'var(--success)', label: 'Dividendes cumules' },
      ],
    },
    {
      label: 'Sortie 10 ans',
      segments: [
        { value: sim10.valeurSortie, color: 'var(--accent)', label: 'Valeur de retrait' },
        { value: sim10.totalDividendes, color: 'var(--success)', label: 'Dividendes cumules' },
      ],
    },
  ]

  return (
    <div className="glass-card p-6 mt-6">
      <h3 className="text-sm font-semibold text-t-primary mb-6">Comparaison investissement vs sortie</h3>

      <div className="space-y-6">
        {bars.map((bar, i) => {
          const total = bar.segments.reduce((s, seg) => s + seg.value, 0)
          return (
            <div key={i}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-t-secondary">{bar.label}</span>
                <span className="font-mono text-sm text-t-primary tabular-nums">
                  {total.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} &euro;
                </span>
              </div>
              <div className="flex h-8 rounded-lg overflow-hidden bg-white/[0.03]">
                {bar.segments.map((seg, j) => (
                  <div
                    key={j}
                    className="h-full transition-all duration-500 flex items-center justify-center text-[10px] font-mono text-white/80"
                    style={{
                      width: `${(seg.value / maxVal) * 100}%`,
                      backgroundColor: seg.color,
                      opacity: j === 0 ? 1 : 0.7,
                    }}
                  >
                    {(seg.value / maxVal) * 100 > 15 && seg.value.toLocaleString('fr-FR', { maximumFractionDigits: 0 }) + ' \u20AC'}
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      <div className="flex items-center gap-6 mt-4 pt-4 border-t border-white/[0.06]">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: 'var(--accent)' }} />
          <span className="text-xs text-t-tertiary">Valeur de retrait</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: 'var(--success)', opacity: 0.7 }} />
          <span className="text-xs text-t-tertiary">Dividendes cumules</span>
        </div>
      </div>
    </div>
  )
}

/* ================================================================
   MAIN PAGE
   ================================================================ */

export default function SimulateurPage() {
  // Inputs
  const [prixPart, setPrixPart] = useState(200)
  const [fraisEntree, setFraisEntree] = useState(0)
  const [rendementBase, setRendementBase] = useState(5.0)
  const [selectedPreset, setSelectedPreset] = useState<string>('')

  // Adjustments (-20 to +20)
  const [adjustRendement, setAdjustRendement] = useState(0)
  const [adjustPrix, setAdjustPrix] = useState(0)

  // Active tab for mobile
  const [activeTab, setActiveTab] = useState<'5ans' | '10ans'>('5ans')

  const handlePresetChange = useCallback((presetName: string) => {
    setSelectedPreset(presetName)
    const preset = PRESET_SCPIS.find(s => s.name === presetName)
    if (preset) {
      setPrixPart(preset.prixPart)
      setFraisEntree(preset.fraisEntree)
      setRendementBase(preset.rendement)
      setAdjustRendement(0)
      setAdjustPrix(0)
    }
  }, [])

  // Compute simulations
  const sim5 = useMemo(
    () => simulateTRI(prixPart, fraisEntree, rendementBase, adjustRendement, adjustPrix, 5),
    [prixPart, fraisEntree, rendementBase, adjustRendement, adjustPrix]
  )

  const sim10 = useMemo(
    () => simulateTRI(prixPart, fraisEntree, rendementBase, adjustRendement, adjustPrix, 10),
    [prixPart, fraisEntree, rendementBase, adjustRendement, adjustPrix]
  )

  const rendementAjuste = rendementBase * (1 + adjustRendement / 100)
  const prixSortie5 = prixPart * (1 + adjustPrix / 100)
  const prixSortie10 = prixSortie5 // meme variation totale

  const formatTRI = (tri: number | null): string => {
    if (tri === null) return 'N/A'
    return (tri * 100).toFixed(2) + '%'
  }

  const triHighlight = (tri: number | null): 'positive' | 'negative' | 'neutral' => {
    if (tri === null) return 'neutral'
    return tri >= 0 ? 'positive' : 'negative'
  }

  return (
    <div className="min-h-screen">
      {/* Navbar */}
      <nav className="navbar-frosted fixed top-0 left-0 right-0 z-50 h-16 scrolled">
        <div className="max-w-[1280px] mx-auto px-6 h-full flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a href="/" className="flex items-center gap-3">
              <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xs font-mono">IA</span>
              </div>
              <span className="font-semibold text-lg text-t-primary">CGP Immo Analytics</span>
            </a>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm text-t-secondary">
            <a href="/funds" className="hover:text-t-primary transition">Fonds</a>
            <a href="/simulateur" className="text-accent font-medium">Simulateur TRI</a>
          </div>
          <div className="flex items-center gap-3">
            <a href="/funds" className="btn-ghost text-sm !py-2 !px-4">Fonds</a>
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="pt-24 pb-16 max-w-[1280px] mx-auto px-6">
        {/* Header */}
        <div className="mb-10">
          <div className="inline-flex items-center shimmer-badge rounded-full px-4 py-1.5 text-sm text-compliance mb-4">
            Simulateur SCPI
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-t-primary">
            Simulateur de TRI <span className="text-accent">SCPI</span>
          </h1>
          <p className="text-t-secondary mt-3 max-w-2xl">
            Calculez le Taux de Rendement Interne de votre investissement SCPI sur 5 et 10 ans.
            Ajustez le rendement et l&apos;evolution du prix de part pour simuler differents scenarios.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* LEFT: Inputs */}
          <div className="lg:col-span-4">
            <div className="glass-card p-6 sticky top-24">
              <h2 className="text-lg font-semibold text-t-primary mb-6">Parametres</h2>

              {/* Preset SCPI Selector */}
              <div className="mb-6">
                <label className="text-sm font-medium text-t-secondary mb-2 block">
                  SCPI de reference
                </label>
                <select
                  value={selectedPreset}
                  onChange={e => handlePresetChange(e.target.value)}
                  className="sim-select w-full"
                >
                  <option value="">-- Saisie manuelle --</option>
                  {PRESET_SCPIS.map(s => (
                    <option key={s.name} value={s.name}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div className="h-px bg-white/[0.06] my-6" />

              {/* Prix de la part */}
              <div className="mb-4">
                <label className="text-sm font-medium text-t-secondary mb-2 block">
                  Prix de la part
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={prixPart}
                    onChange={e => {
                      setPrixPart(Number(e.target.value))
                      setSelectedPreset('')
                    }}
                    min={0}
                    step={1}
                    className="sim-input w-full pr-8"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-t-tertiary text-sm">&euro;</span>
                </div>
              </div>

              {/* Frais d'entree */}
              <div className="mb-4">
                <label className="text-sm font-medium text-t-secondary mb-2 block">
                  Frais d&apos;entree (souscription)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={fraisEntree}
                    onChange={e => {
                      setFraisEntree(Number(e.target.value))
                      setSelectedPreset('')
                    }}
                    min={0}
                    max={20}
                    step={0.01}
                    className="sim-input w-full pr-8"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-t-tertiary text-sm">%</span>
                </div>
                <p className="text-[11px] text-t-tertiary mt-1">
                  Frais deduits a la revente (valeur de retrait)
                </p>
              </div>

              {/* Rendement de base */}
              <div className="mb-6">
                <label className="text-sm font-medium text-t-secondary mb-2 block">
                  Taux de distribution (TD)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={rendementBase}
                    onChange={e => {
                      setRendementBase(Number(e.target.value))
                      setSelectedPreset('')
                    }}
                    min={0}
                    max={15}
                    step={0.01}
                    className="sim-input w-full pr-8"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-t-tertiary text-sm">%</span>
                </div>
              </div>

              <div className="h-px bg-white/[0.06] my-6" />

              {/* Sliders */}
              <h3 className="text-sm font-semibold text-t-primary mb-4">
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
                description={`Prix a la sortie : ${prixSortie5.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} \u20AC`}
              />

              {/* Reset */}
              <button
                onClick={() => { setAdjustRendement(0); setAdjustPrix(0) }}
                className="text-xs text-accent hover:underline mt-2"
              >
                Reinitialiser les ajustements
              </button>
            </div>
          </div>

          {/* RIGHT: Results */}
          <div className="lg:col-span-8">
            {/* TRI Cards */}
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
                value={`${sim5.gainTotal >= 0 ? '+' : ''}${sim5.gainTotal.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} \u20AC`}
                subtext={`${sim5.gainPct >= 0 ? '+' : ''}${sim5.gainPct.toFixed(1)}%`}
                highlight={sim5.gainTotal >= 0 ? 'positive' : 'negative'}
              />
              <ResultCard
                label="Gain total 10 ans"
                value={`${sim10.gainTotal >= 0 ? '+' : ''}${sim10.gainTotal.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} \u20AC`}
                subtext={`${sim10.gainPct >= 0 ? '+' : ''}${sim10.gainPct.toFixed(1)}%`}
                highlight={sim10.gainTotal >= 0 ? 'positive' : 'negative'}
              />
            </div>

            {/* Detail cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              <ResultCard
                label="Dividendes 5 ans"
                value={`${sim5.totalDividendes.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} \u20AC`}
                highlight="positive"
              />
              <ResultCard
                label="Dividendes 10 ans"
                value={`${sim10.totalDividendes.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} \u20AC`}
                highlight="positive"
              />
              <ResultCard
                label="Valeur retrait 5 ans"
                value={`${sim5.valeurSortie.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} \u20AC`}
                highlight="neutral"
              />
              <ResultCard
                label="Valeur retrait 10 ans"
                value={`${sim10.valeurSortie.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} \u20AC`}
                highlight="neutral"
              />
            </div>

            {/* Bar chart comparison */}
            <BarChart sim5={sim5} sim10={sim10} investissement={prixPart} />

            {/* Tabs for cash flow tables */}
            <div className="mt-8">
              <div className="flex gap-2 mb-0">
                <button
                  onClick={() => setActiveTab('5ans')}
                  className={`px-4 py-2 text-sm font-medium rounded-t-lg transition ${
                    activeTab === '5ans'
                      ? 'bg-white/[0.06] text-accent border border-white/[0.06] border-b-transparent'
                      : 'text-t-tertiary hover:text-t-secondary'
                  }`}
                >
                  Projection 5 ans
                </button>
                <button
                  onClick={() => setActiveTab('10ans')}
                  className={`px-4 py-2 text-sm font-medium rounded-t-lg transition ${
                    activeTab === '10ans'
                      ? 'bg-white/[0.06] text-accent border border-white/[0.06] border-b-transparent'
                      : 'text-t-tertiary hover:text-t-secondary'
                  }`}
                >
                  Projection 10 ans
                </button>
              </div>

              {activeTab === '5ans' ? (
                <CashFlowTable data={sim5.cashFlows} investissement={prixPart} />
              ) : (
                <CashFlowTable data={sim10.cashFlows} investissement={prixPart} />
              )}
            </div>

            {/* Methodology note */}
            <div className="glass-card p-4 mt-6">
              <h4 className="text-xs font-semibold text-t-tertiary uppercase tracking-wider mb-2">Methodologie</h4>
              <ul className="text-xs text-t-tertiary space-y-1 leading-relaxed">
                <li>Le TRI (Taux de Rendement Interne) est calcule selon la methode standard avec les flux de tresorerie annuels.</li>
                <li>Le dividende annuel est base sur le prix de souscription initial multiplie par le taux de distribution ajuste.</li>
                <li>La valeur de retrait a la sortie est calculee en deduisant les frais d&apos;entree du prix de part ajuste.</li>
                <li>Les variations de rendement et de prix de part s&apos;appliquent de maniere uniforme sur la duree.</li>
                <li>Ce simulateur ne tient pas compte de la fiscalite (IR, prelevements sociaux) ni de l&apos;inflation.</li>
              </ul>
            </div>

            {/* Disclaimer */}
            <p className="text-[11px] text-t-tertiary/60 mt-4 leading-relaxed">
              Les performances passees ne prejugent pas des performances futures. Les projections presentees sont purement indicatives et ne constituent en aucun cas un conseil en investissement. Investir en SCPI comporte des risques, notamment de perte en capital et de liquidite.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
