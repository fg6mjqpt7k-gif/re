'use client'

import { useState, useMemo } from 'react'
import { SCPI_DATA, SCPI, calcRevenuNetMensuel } from '../../lib/data'
import AppShell from '../../components/AppShell'

// ============================================================
// TYPES
// ============================================================

interface PortfolioEntry {
  scpiId: string
  nbParts: number
  dateAchat: string // "YYYY-MM"
}

interface AlertConfig {
  scpiId: string
  revalorisationPrix: boolean
  revalorisationSeuil: number
  dividendeTrimestriel: boolean
  tofSeuil: boolean
  tofSeuilValeur: number
}

interface FakeAlert {
  id: number
  date: string
  type: 'revalorisation' | 'dividende' | 'tof'
  scpiNom: string
  message: string
}

// ============================================================
// CONSTANTS
// ============================================================

const TMI_OPTIONS = [
  { label: '0%', value: 0 },
  { label: '11%', value: 11 },
  { label: '30%', value: 30 },
  { label: '41%', value: 41 },
  { label: '45%', value: 45 },
]

const FAKE_ALERTS: FakeAlert[] = [
  {
    id: 1,
    date: '2025-01-28',
    type: 'revalorisation',
    scpiNom: 'Corum Origin',
    message: 'Prix de part revalorise de +2.3% (1135 -> 1161 EUR)',
  },
  {
    id: 2,
    date: '2025-01-15',
    type: 'dividende',
    scpiNom: 'Iroko Zen',
    message: 'Dividende T4 2024 verse : 3.56 EUR/part',
  },
  {
    id: 3,
    date: '2025-01-10',
    type: 'tof',
    scpiNom: 'PFO2',
    message: 'TOF en baisse : 92.1% (seuil configure : 93%)',
  },
  {
    id: 4,
    date: '2024-12-20',
    type: 'dividende',
    scpiNom: 'Remake Live',
    message: 'Dividende T4 2024 verse : 3.97 EUR/part',
  },
]

const BAR_COLORS = [
  '#2563EB', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
  '#EC4899', '#06B6D4', '#F97316', '#6366F1', '#14B8A6',
]

// ============================================================
// HELPERS
// ============================================================

function formatEUR(n: number): string {
  return n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' EUR'
}

function formatPct(n: number): string {
  return n.toFixed(2) + '%'
}

function getScpiById(id: string): SCPI | undefined {
  return SCPI_DATA.find(s => s.id === id)
}

function alertTypeIcon(type: FakeAlert['type']): string {
  switch (type) {
    case 'revalorisation': return 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6'
    case 'dividende': return 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
    case 'tof': return 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'
  }
}

function alertTypeColor(type: FakeAlert['type']): string {
  switch (type) {
    case 'revalorisation': return '#2563EB'
    case 'dividende': return '#10B981'
    case 'tof': return '#EF4444'
  }
}

// ============================================================
// PAGE COMPONENT
// ============================================================

export default function PortefeuillePage() {
  // --- Portfolio state ---
  const [portfolio, setPortfolio] = useState<PortfolioEntry[]>([])

  // --- Form state ---
  const [selectedScpiId, setSelectedScpiId] = useState<string>(SCPI_DATA[0]?.id ?? '')
  const [nbParts, setNbParts] = useState<string>('')
  const [dateAchat, setDateAchat] = useState<string>('')

  // --- TMI ---
  const [tmi, setTmi] = useState<number>(30)

  // --- Alerts state ---
  const [alertConfigs, setAlertConfigs] = useState<AlertConfig[]>([])
  const [alertEmail, setAlertEmail] = useState<string>('')
  const [alertToast, setAlertToast] = useState<boolean>(false)

  // ============================================================
  // ADD TO PORTFOLIO
  // ============================================================

  function handleAdd() {
    if (!selectedScpiId || !nbParts || Number(nbParts) <= 0 || !dateAchat) return
    const entry: PortfolioEntry = {
      scpiId: selectedScpiId,
      nbParts: Number(nbParts),
      dateAchat,
    }
    setPortfolio(prev => [...prev, entry])

    // Initialize alert config for this SCPI if not already present
    if (!alertConfigs.find(a => a.scpiId === selectedScpiId)) {
      setAlertConfigs(prev => [
        ...prev,
        {
          scpiId: selectedScpiId,
          revalorisationPrix: false,
          revalorisationSeuil: 5,
          dividendeTrimestriel: false,
          tofSeuil: false,
          tofSeuilValeur: 93,
        },
      ])
    }

    setNbParts('')
    setDateAchat('')
  }

  function handleRemove(index: number) {
    setPortfolio(prev => {
      const updated = prev.filter((_, i) => i !== index)
      // Clean up alert configs for SCPIs no longer in portfolio
      const remainingIds = new Set(updated.map(e => e.scpiId))
      setAlertConfigs(ac => ac.filter(a => remainingIds.has(a.scpiId)))
      return updated
    })
  }

  // ============================================================
  // ALERT CONFIG
  // ============================================================

  function updateAlertConfig(scpiId: string, field: keyof AlertConfig, value: boolean | number) {
    setAlertConfigs(prev =>
      prev.map(a => (a.scpiId === scpiId ? { ...a, [field]: value } : a))
    )
  }

  function handleSaveAlerts() {
    setAlertToast(true)
    setTimeout(() => setAlertToast(false), 3000)
  }

  // ============================================================
  // COMPUTED VALUES
  // ============================================================

  const portfolioDetails = useMemo(() => {
    return portfolio.map((entry, index) => {
      const scpi = getScpiById(entry.scpiId)
      if (!scpi) return null
      const valeur = entry.nbParts * scpi.prixPart
      const revenuAnnuel = valeur * (scpi.td / 100)
      return { ...entry, index, scpi, valeur, revenuAnnuel }
    }).filter(Boolean) as {
      scpiId: string
      nbParts: number
      dateAchat: string
      index: number
      scpi: SCPI
      valeur: number
      revenuAnnuel: number
    }[]
  }, [portfolio])

  const totalValeur = useMemo(() => {
    return portfolioDetails.reduce((sum, d) => sum + d.valeur, 0)
  }, [portfolioDetails])

  const totalRevenuBrutAnnuel = useMemo(() => {
    return portfolioDetails.reduce((sum, d) => sum + d.revenuAnnuel, 0)
  }, [portfolioDetails])

  const revenuNetMensuel = useMemo(() => {
    if (portfolioDetails.length === 0) return 0
    let totalNet = 0
    for (const d of portfolioDetails) {
      const result = calcRevenuNetMensuel(d.valeur, d.scpi.td, tmi, d.scpi.partRevenusEtrangers)
      totalNet += result.net
    }
    return totalNet
  }, [portfolioDetails, tmi])

  const rendementMoyenPondere = useMemo(() => {
    if (totalValeur === 0) return 0
    return portfolioDetails.reduce((sum, d) => sum + d.scpi.td * (d.valeur / totalValeur), 0)
  }, [portfolioDetails, totalValeur])

  const scoreAlphaMoyenPondere = useMemo(() => {
    if (totalValeur === 0) return 0
    return portfolioDetails.reduce((sum, d) => sum + d.scpi.scoreAlpha * (d.valeur / totalValeur), 0)
  }, [portfolioDetails, totalValeur])

  // --- Diversification aggregation ---
  const geoAgg = useMemo(() => {
    if (totalValeur === 0) return []
    const map: Record<string, number> = {}
    for (const d of portfolioDetails) {
      const weight = d.valeur / totalValeur
      for (const g of d.scpi.repartitionGeo) {
        map[g.pays] = (map[g.pays] || 0) + g.pct * weight
      }
    }
    return Object.entries(map)
      .map(([pays, pct]) => ({ pays, pct }))
      .sort((a, b) => b.pct - a.pct)
  }, [portfolioDetails, totalValeur])

  const sectorAgg = useMemo(() => {
    if (totalValeur === 0) return []
    const map: Record<string, number> = {}
    for (const d of portfolioDetails) {
      const weight = d.valeur / totalValeur
      for (const s of d.scpi.repartitionSectorielle) {
        map[s.secteur] = (map[s.secteur] || 0) + s.pct * weight
      }
    }
    return Object.entries(map)
      .map(([secteur, pct]) => ({ secteur, pct }))
      .sort((a, b) => b.pct - a.pct)
  }, [portfolioDetails, totalValeur])

  const concentrationAlerts = useMemo(() => {
    const alerts: string[] = []
    for (const g of geoAgg) {
      if (g.pct > 40) {
        alerts.push(`Concentration geographique elevee : ${g.pays} a ${g.pct.toFixed(1)}% (seuil 40%)`)
      }
    }
    for (const s of sectorAgg) {
      if (s.pct > 50) {
        alerts.push(`Concentration sectorielle elevee : ${s.secteur} a ${s.pct.toFixed(1)}% (seuil 50%)`)
      }
    }
    return alerts
  }, [geoAgg, sectorAgg])

  // Unique SCPIs in portfolio for alert config
  const uniquePortfolioScpis = useMemo(() => {
    const ids = [...new Set(portfolio.map(e => e.scpiId))]
    return ids.map(id => getScpiById(id)).filter(Boolean) as SCPI[]
  }, [portfolio])

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Page Header + TMI Selector */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#F1F5F9]">Portefeuille SCPI</h1>
            <p className="text-sm text-[#94A3B8] mt-1">Suivi multi-SCPI, diversification & alertes</p>
          </div>
          <div className="flex items-center gap-3">
            <label className="text-sm text-[#94A3B8]">TMI :</label>
            <select
              className="sim-select"
              value={tmi}
              onChange={e => setTmi(Number(e.target.value))}
            >
              {TMI_OPTIONS.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* ============================================================
            SECTION 1: ADD SCPI FORM
           ============================================================ */}
        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold text-[#F1F5F9] mb-4">Ajouter une SCPI au portefeuille</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
            <div>
              <label className="block text-xs text-[#94A3B8] mb-1.5 uppercase tracking-wider">SCPI</label>
              <select
                className="sim-select w-full"
                value={selectedScpiId}
                onChange={e => setSelectedScpiId(e.target.value)}
              >
                {SCPI_DATA.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.nom} — {formatEUR(s.prixPart)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-[#94A3B8] mb-1.5 uppercase tracking-wider">Nombre de parts</label>
              <input
                type="number"
                className="sim-input w-full"
                placeholder="10"
                min={1}
                value={nbParts}
                onChange={e => setNbParts(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs text-[#94A3B8] mb-1.5 uppercase tracking-wider">Date d&apos;achat</label>
              <input
                type="month"
                className="sim-input w-full"
                value={dateAchat}
                onChange={e => setDateAchat(e.target.value)}
              />
            </div>
            <div>
              <button
                onClick={handleAdd}
                disabled={!selectedScpiId || !nbParts || Number(nbParts) <= 0 || !dateAchat}
                className="btn-primary w-full disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Ajouter
              </button>
            </div>
          </div>
        </div>

        {/* ============================================================
            SECTION 2: PORTFOLIO DASHBOARD
           ============================================================ */}
        {portfolioDetails.length > 0 && (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Valeur totale */}
              <div className="glass-card p-5">
                <div className="text-xs text-[#94A3B8] uppercase tracking-wider mb-2">Valeur totale</div>
                <div className="font-tabular text-xl font-semibold text-[#F1F5F9]">{formatEUR(totalValeur)}</div>
              </div>
              {/* Revenu brut annuel */}
              <div className="glass-card p-5">
                <div className="text-xs text-[#94A3B8] uppercase tracking-wider mb-2">Revenu brut annuel</div>
                <div className="font-tabular text-xl font-semibold text-[#F1F5F9]">{formatEUR(totalRevenuBrutAnnuel)}</div>
              </div>
              {/* Revenu net mensuel */}
              <div className="glass-card p-5">
                <div className="text-xs text-[#94A3B8] uppercase tracking-wider mb-2">Revenu net mensuel</div>
                <div className="font-tabular text-xl font-semibold text-[#10B981]">{formatEUR(revenuNetMensuel)}</div>
                <div className="text-[10px] text-[#475569] mt-1">TMI {tmi}%</div>
              </div>
              {/* Rendement moyen pondere */}
              <div className="glass-card p-5">
                <div className="text-xs text-[#94A3B8] uppercase tracking-wider mb-2">Rendement moy. pond.</div>
                <div className="font-tabular text-xl font-semibold text-[#F1F5F9]">{formatPct(rendementMoyenPondere)}</div>
              </div>
              {/* Score Alpha moyen pondere */}
              <div className="glass-card p-5">
                <div className="text-xs text-[#94A3B8] uppercase tracking-wider mb-2">Score Alpha moy.</div>
                <div className="font-tabular text-xl font-semibold text-[#2563EB]">{Math.round(scoreAlphaMoyenPondere)}/100</div>
              </div>
            </div>

            {/* Portfolio Composition Table */}
            <div className="glass-card overflow-hidden">
              <div className="p-5 border-b border-white/[0.06]">
                <h2 className="text-lg font-semibold text-[#F1F5F9]">Composition du portefeuille</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="fund-table">
                  <thead>
                    <tr>
                      <th>SCPI</th>
                      <th>Parts</th>
                      <th>Prix part</th>
                      <th>Valeur</th>
                      <th>Poids</th>
                      <th>TD</th>
                      <th>Revenu annuel</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {portfolioDetails.map((d) => (
                      <tr key={d.index}>
                        <td className="font-medium text-[#F1F5F9]">{d.scpi.nom}</td>
                        <td className="font-tabular">{d.nbParts}</td>
                        <td className="font-tabular">{formatEUR(d.scpi.prixPart)}</td>
                        <td className="font-tabular">{formatEUR(d.valeur)}</td>
                        <td className="font-tabular">{totalValeur > 0 ? formatPct((d.valeur / totalValeur) * 100) : '—'}</td>
                        <td className="font-tabular text-[#10B981]">{formatPct(d.scpi.td)}</td>
                        <td className="font-tabular">{formatEUR(d.revenuAnnuel)}</td>
                        <td>
                          <button
                            onClick={() => handleRemove(d.index)}
                            className="p-1.5 rounded-lg text-[#475569] hover:text-[#EF4444] hover:bg-[#EF4444]/10 transition"
                            title="Retirer"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                    {/* Total row */}
                    <tr className="border-t-2 border-white/[0.12]" style={{ background: 'rgba(37,99,235,0.04)' }}>
                      <td className="font-semibold text-[#F1F5F9]">Total</td>
                      <td className="font-tabular font-semibold">{portfolioDetails.reduce((s, d) => s + d.nbParts, 0)}</td>
                      <td></td>
                      <td className="font-tabular font-semibold">{formatEUR(totalValeur)}</td>
                      <td className="font-tabular font-semibold">100.00%</td>
                      <td className="font-tabular font-semibold text-[#10B981]">{formatPct(rendementMoyenPondere)}</td>
                      <td className="font-tabular font-semibold">{formatEUR(totalRevenuBrutAnnuel)}</td>
                      <td></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Diversification Analysis */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Geographic */}
              <div className="glass-card p-5">
                <h3 className="text-base font-semibold text-[#F1F5F9] mb-4">Repartition geographique</h3>
                <div className="space-y-3">
                  {geoAgg.map((g, i) => (
                    <div key={g.pays}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-[#94A3B8]">{g.pays}</span>
                        <span className="font-tabular text-[#F1F5F9]">{g.pct.toFixed(1)}%</span>
                      </div>
                      <div className="w-full h-2.5 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.min(g.pct, 100)}%`,
                            background: BAR_COLORS[i % BAR_COLORS.length],
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sectoral */}
              <div className="glass-card p-5">
                <h3 className="text-base font-semibold text-[#F1F5F9] mb-4">Repartition sectorielle</h3>
                <div className="space-y-3">
                  {sectorAgg.map((s, i) => (
                    <div key={s.secteur}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-[#94A3B8]">{s.secteur}</span>
                        <span className="font-tabular text-[#F1F5F9]">{s.pct.toFixed(1)}%</span>
                      </div>
                      <div className="w-full h-2.5 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.min(s.pct, 100)}%`,
                            background: BAR_COLORS[i % BAR_COLORS.length],
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Concentration Alerts */}
            {concentrationAlerts.length > 0 && (
              <div className="glass-card p-5 border-l-4" style={{ borderLeftColor: '#F59E0B' }}>
                <div className="flex items-center gap-2 mb-3">
                  <svg className="w-5 h-5 text-[#F59E0B]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <h3 className="text-sm font-semibold text-[#F59E0B]">Alertes de concentration</h3>
                </div>
                <ul className="space-y-1.5">
                  {concentrationAlerts.map((a, i) => (
                    <li key={i} className="text-sm text-[#94A3B8] flex items-start gap-2">
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#F59E0B] shrink-0" />
                      {a}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* ============================================================
                SECTION 3: ALERT CONFIGURATION
               ============================================================ */}
            <div className="glass-card p-6">
              <h2 className="text-lg font-semibold text-[#F1F5F9] mb-1">Configuration des alertes</h2>
              <p className="text-sm text-[#475569] mb-6">Configurez les notifications pour chaque SCPI de votre portefeuille.</p>

              <div className="space-y-5">
                {uniquePortfolioScpis.map(scpi => {
                  const config = alertConfigs.find(a => a.scpiId === scpi.id)
                  if (!config) return null
                  return (
                    <div
                      key={scpi.id}
                      className="rounded-xl p-4"
                      style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
                    >
                      <div className="text-sm font-semibold text-[#F1F5F9] mb-3">{scpi.nom}</div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {/* Revalorisation toggle */}
                        <div className="flex items-start gap-3">
                          <button
                            onClick={() => updateAlertConfig(scpi.id, 'revalorisationPrix', !config.revalorisationPrix)}
                            className={`mt-0.5 relative w-10 h-5 rounded-full transition-colors shrink-0 ${config.revalorisationPrix ? 'bg-[#2563EB]' : 'bg-[#475569]/40'}`}
                          >
                            <span
                              className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${config.revalorisationPrix ? 'translate-x-5' : 'translate-x-0'}`}
                            />
                          </button>
                          <div>
                            <div className="text-xs text-[#F1F5F9]">Revalorisation prix de part</div>
                            <div className="flex items-center gap-1.5 mt-1">
                              <span className="text-[10px] text-[#475569]">Seuil +/-</span>
                              <input
                                type="number"
                                className="sim-input w-16 text-xs py-1 px-2"
                                min={1}
                                max={50}
                                value={config.revalorisationSeuil}
                                onChange={e => updateAlertConfig(scpi.id, 'revalorisationSeuil', Number(e.target.value))}
                              />
                              <span className="text-[10px] text-[#475569]">%</span>
                            </div>
                          </div>
                        </div>

                        {/* Dividende toggle */}
                        <div className="flex items-start gap-3">
                          <button
                            onClick={() => updateAlertConfig(scpi.id, 'dividendeTrimestriel', !config.dividendeTrimestriel)}
                            className={`mt-0.5 relative w-10 h-5 rounded-full transition-colors shrink-0 ${config.dividendeTrimestriel ? 'bg-[#10B981]' : 'bg-[#475569]/40'}`}
                          >
                            <span
                              className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${config.dividendeTrimestriel ? 'translate-x-5' : 'translate-x-0'}`}
                            />
                          </button>
                          <div>
                            <div className="text-xs text-[#F1F5F9]">Dividende trimestriel</div>
                            <div className="text-[10px] text-[#475569] mt-1">Notification a chaque versement</div>
                          </div>
                        </div>

                        {/* TOF toggle */}
                        <div className="flex items-start gap-3">
                          <button
                            onClick={() => updateAlertConfig(scpi.id, 'tofSeuil', !config.tofSeuil)}
                            className={`mt-0.5 relative w-10 h-5 rounded-full transition-colors shrink-0 ${config.tofSeuil ? 'bg-[#EF4444]' : 'bg-[#475569]/40'}`}
                          >
                            <span
                              className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${config.tofSeuil ? 'translate-x-5' : 'translate-x-0'}`}
                            />
                          </button>
                          <div>
                            <div className="text-xs text-[#F1F5F9]">TOF sous seuil</div>
                            <div className="flex items-center gap-1.5 mt-1">
                              <span className="text-[10px] text-[#475569]">Seuil</span>
                              <input
                                type="number"
                                className="sim-input w-16 text-xs py-1 px-2"
                                min={50}
                                max={100}
                                value={config.tofSeuilValeur}
                                onChange={e => updateAlertConfig(scpi.id, 'tofSeuilValeur', Number(e.target.value))}
                              />
                              <span className="text-[10px] text-[#475569]">%</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Email + Save */}
              <div className="mt-6 flex flex-col sm:flex-row items-start sm:items-end gap-4">
                <div className="flex-1 w-full sm:w-auto">
                  <label className="block text-xs text-[#94A3B8] mb-1.5 uppercase tracking-wider">Email de notification</label>
                  <input
                    type="email"
                    className="sim-input w-full sm:w-80"
                    placeholder="votre@email.com"
                    value={alertEmail}
                    onChange={e => setAlertEmail(e.target.value)}
                  />
                </div>
                <button
                  onClick={handleSaveAlerts}
                  className="btn-primary whitespace-nowrap"
                >
                  Sauvegarder alertes
                </button>
              </div>
            </div>

            {/* Simulated Recent Alerts */}
            <div className="glass-card p-6">
              <h2 className="text-lg font-semibold text-[#F1F5F9] mb-4">Dernieres alertes</h2>
              <div className="space-y-3">
                {FAKE_ALERTS.map(alert => (
                  <div
                    key={alert.id}
                    className="flex items-start gap-3 p-3 rounded-lg"
                    style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                      style={{ background: `${alertTypeColor(alert.type)}15` }}
                    >
                      <svg className="w-4 h-4" fill="none" stroke={alertTypeColor(alert.type)} strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d={alertTypeIcon(alert.type)} />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-sm font-medium text-[#F1F5F9]">{alert.scpiNom}</span>
                        <span className="font-tabular text-[10px] text-[#475569]">{alert.date}</span>
                      </div>
                      <p className="text-sm text-[#94A3B8]">{alert.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Empty state */}
        {portfolio.length === 0 && (
          <div className="glass-card p-12 text-center">
            <svg className="w-16 h-16 mx-auto text-[#475569] mb-4" fill="none" stroke="currentColor" strokeWidth="1" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
            </svg>
            <h3 className="text-lg font-semibold text-[#94A3B8] mb-2">Portefeuille vide</h3>
            <p className="text-sm text-[#475569] max-w-md mx-auto">
              Ajoutez votre premiere SCPI ci-dessus pour visualiser votre portefeuille,
              analyser la diversification et configurer vos alertes.
            </p>
          </div>
        )}

        {/* Toast notification */}
        {alertToast && (
          <div
            className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-2xl"
            style={{
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              backdropFilter: 'blur(12px)',
            }}
          >
            <svg className="w-5 h-5 text-[#10B981]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-sm font-medium text-[#10B981]">Alertes sauvegardees avec succes</span>
          </div>
        )}
      </div>
    </AppShell>
  )
}
