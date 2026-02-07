'use client'

import { useState, useMemo, Fragment } from 'react'
import { SCPI_DATA, SCPI, SCPIBilan, SCPICompteResultat, runCoherenceChecks, CheckCoherence } from '../../lib/data'
import AppShell from '../../components/AppShell'

// ============================================================
// HELPERS
// ============================================================

function formatCapitalisation(n: number): string {
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)} Md\u20AC`
  if (n >= 1e6) return `${(n / 1e6).toFixed(0)} M\u20AC`
  return `${n.toLocaleString('fr-FR')} \u20AC`
}

function scoreColor(score: number): string {
  if (score > 75) return '#2563EB'
  if (score > 60) return '#10B981'
  if (score > 40) return '#EAB308'
  return '#EF4444'
}

function scoreBgClass(score: number): string {
  if (score > 75) return 'score-excellent'
  if (score > 60) return 'score-good'
  if (score > 40) return 'score-average'
  return 'score-poor'
}

function scoreLabel(score: number): string {
  if (score > 75) return 'Excellent'
  if (score > 60) return 'Bon'
  if (score > 40) return 'Moyen'
  return 'Faible'
}

type SortField = 'scoreAlpha' | 'nom' | 'td' | 'tof' | 'capitalisation' | 'fraisSouscription' | 'anciennete'

const SORT_OPTIONS: { value: SortField; label: string }[] = [
  { value: 'scoreAlpha', label: 'Score Alpha' },
  { value: 'td', label: 'Taux de distribution' },
  { value: 'tof', label: "Taux d'occupation" },
  { value: 'capitalisation', label: 'Capitalisation' },
  { value: 'nom', label: 'Nom (A-Z)' },
  { value: 'fraisSouscription', label: 'Frais souscription' },
  { value: 'anciennete', label: 'Anciennete' },
]

// ============================================================
// SCORE BADGE COMPONENT
// ============================================================

function ScoreAlphaBadge({ score, size = 'md' }: { score: number; size?: 'sm' | 'md' }) {
  const color = scoreColor(score)
  const dim = size === 'sm' ? 36 : 48
  const strokeWidth = size === 'sm' ? 3 : 3.5
  const radius = (dim - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference
  const fontSize = size === 'sm' ? 'text-[10px]' : 'text-xs'

  return (
    <div className="relative flex items-center justify-center" style={{ width: dim, height: dim }}>
      <svg width={dim} height={dim} className="transform -rotate-90">
        <circle
          cx={dim / 2}
          cy={dim / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={dim / 2}
          cy={dim / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
      </svg>
      <span
        className={`absolute font-mono font-semibold ${fontSize}`}
        style={{ color }}
      >
        {score}
      </span>
    </div>
  )
}

// ============================================================
// SCORE TOOLTIP COMPONENT
// ============================================================

function ScoreTooltip({ scpi }: { scpi: SCPI }) {
  const details = scpi.scoreDetails
  const bars: { label: string; key: keyof typeof details; icon: string }[] = [
    { label: 'Rendement', key: 'rendement', icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6' },
    { label: 'Risque', key: 'risque', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
    { label: 'Frais', key: 'frais', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
    { label: 'Liquidite', key: 'liquidite', icon: 'M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 00-3.7-3.7 48.678 48.678 0 00-7.324 0 4.006 4.006 0 00-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3l-3-3m-12 3c0 1.232.046 2.453.138 3.662a4.006 4.006 0 003.7 3.7 48.656 48.656 0 007.324 0 4.006 4.006 0 003.7-3.7c.017-.22.032-.441.046-.662M4.5 12l3 3m-3-3l-3 3' },
    { label: 'Diversification', key: 'diversification', icon: 'M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z' },
    { label: 'ESG', key: 'esg', icon: 'M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418' },
  ]

  return (
    <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-3 w-64 glass-card p-4 shadow-2xl pointer-events-none opacity-0 group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity duration-200">
      {/* Arrow */}
      <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-[rgba(19,24,37,0.9)]" />

      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-[#F1F5F9]">Score Alpha</span>
        <span className={`score-pill text-xs ${scoreBgClass(scpi.scoreAlpha)}`}>
          {scpi.scoreAlpha} - {scoreLabel(scpi.scoreAlpha)}
        </span>
      </div>

      <div className="space-y-2.5">
        {bars.map(({ label, key, icon }) => {
          const val = details[key]
          const barColor = scoreColor(val)
          return (
            <div key={key}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  <svg className="w-3 h-3 text-[#475569]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
                  </svg>
                  <span className="text-[11px] text-[#94A3B8]">{label}</span>
                </div>
                <span className="text-[11px] font-mono font-semibold" style={{ color: barColor }}>{val}</span>
              </div>
              <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${val}%`, backgroundColor: barColor }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ============================================================
// EXPANDED ROW COMPONENT
// ============================================================

function ExpandedDetails({ scpi }: { scpi: SCPI }) {
  return (
    <div className="px-6 py-5 bg-[#0a0f1e]/50 border-t border-white/[0.04] animate-fade-in">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Historique */}
        <div className="glass-card p-4" style={{ transform: 'none' }}>
          <h4 className="text-sm font-semibold text-[#F1F5F9] mb-3 flex items-center gap-2">
            <svg className="w-4 h-4 text-[#2563EB]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
            </svg>
            Historique
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="text-left py-2 pr-3 text-[#475569] font-medium">Annee</th>
                  <th className="text-right py-2 px-3 text-[#475569] font-medium">TD</th>
                  <th className="text-right py-2 px-3 text-[#475569] font-medium">Prix part</th>
                  <th className="text-right py-2 pl-3 text-[#475569] font-medium">Dividende</th>
                </tr>
              </thead>
              <tbody>
                {scpi.historique.map(h => (
                  <tr key={h.annee} className="border-b border-white/[0.03]">
                    <td className="py-1.5 pr-3 text-[#94A3B8] font-mono">{h.annee}</td>
                    <td className="py-1.5 px-3 text-right font-mono text-[#10B981]">{h.td.toFixed(2)}%</td>
                    <td className="py-1.5 px-3 text-right font-mono text-[#F1F5F9]">{h.prixPart} \u20AC</td>
                    <td className="py-1.5 pl-3 text-right font-mono text-[#94A3B8]">{h.dividende.toFixed(2)} \u20AC</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Repartition Geographique */}
        <div className="glass-card p-4" style={{ transform: 'none' }}>
          <h4 className="text-sm font-semibold text-[#F1F5F9] mb-3 flex items-center gap-2">
            <svg className="w-4 h-4 text-[#2563EB]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
            </svg>
            Repartition geographique
          </h4>
          <div className="space-y-2">
            {scpi.repartitionGeo.map(g => (
              <div key={g.pays}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-[#94A3B8]">{g.pays}</span>
                  <span className="text-xs font-mono text-[#F1F5F9]">{g.pct}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#2563EB] transition-all duration-500"
                    style={{ width: `${g.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Repartition Sectorielle */}
        <div className="glass-card p-4" style={{ transform: 'none' }}>
          <h4 className="text-sm font-semibold text-[#F1F5F9] mb-3 flex items-center gap-2">
            <svg className="w-4 h-4 text-[#2563EB]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
            </svg>
            Repartition sectorielle
          </h4>
          <div className="space-y-2">
            {scpi.repartitionSectorielle.map(s => {
              const colors = [
                '#2563EB', '#10B981', '#EAB308', '#EF4444', '#8B5CF6',
                '#EC4899', '#F97316', '#06B6D4',
              ]
              const idx = scpi.repartitionSectorielle.indexOf(s)
              const color = colors[idx % colors.length]
              return (
                <div key={s.secteur}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                      <span className="text-xs text-[#94A3B8]">{s.secteur}</span>
                    </div>
                    <span className="text-xs font-mono text-[#F1F5F9]">{s.pct}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${s.pct}%`, backgroundColor: color }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Additional metrics row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 mt-4">
        {[
          { label: 'TRI 5 ans', value: scpi.tri5ans ? `${scpi.tri5ans}%` : 'N/A', color: scpi.tri5ans > 5 ? '#10B981' : '#94A3B8' },
          { label: 'TRI 10 ans', value: scpi.tri10ans ? `${scpi.tri10ans}%` : 'N/A', color: scpi.tri10ans > 5 ? '#10B981' : '#94A3B8' },
          { label: 'Prix part', value: `${scpi.prixPart} \u20AC`, color: '#F1F5F9' },
          { label: 'Endettement', value: `${scpi.ratioEndettement}%`, color: scpi.ratioEndettement > 20 ? '#EF4444' : '#94A3B8' },
          { label: 'Nb associes', value: scpi.nbAssocies.toLocaleString('fr-FR'), color: '#94A3B8' },
          { label: 'Nb immeubles', value: scpi.nbImmeubles.toString(), color: '#94A3B8' },
        ].map(m => (
          <div key={m.label} className="rounded-lg bg-white/[0.03] border border-white/[0.04] px-3 py-2">
            <div className="text-[10px] uppercase tracking-wider text-[#475569] mb-0.5">{m.label}</div>
            <div className="font-mono text-sm font-semibold" style={{ color: m.color }}>{m.value}</div>
          </div>
        ))}
      </div>

      {/* Bilan & Compte de Resultat */}
      {scpi.bilans.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          {/* BILAN */}
          <div className="glass-card p-4" style={{ transform: 'none' }}>
            <h4 className="text-sm font-semibold text-[#F1F5F9] mb-3 flex items-center gap-2">
              <svg className="w-4 h-4 text-[#8B5CF6]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
              </svg>
              Bilan (M\u20AC)
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    <th className="text-left py-2 pr-3 text-[#475569] font-medium">Poste</th>
                    {scpi.bilans.map(b => (
                      <th key={b.annee} className="text-right py-2 px-2 text-[#475569] font-medium">{b.annee}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-white/[0.03]">
                    <td className="py-1.5 pr-3 text-[#60a5fa] font-semibold" colSpan={scpi.bilans.length + 1}>ACTIF</td>
                  </tr>
                  {[
                    { label: 'Immobilisations nettes', key: 'immobilisationsNettes' as keyof SCPIBilan },
                    { label: 'Autres actifs immobilises', key: 'autresActifsImmobilises' as keyof SCPIBilan },
                    { label: 'Creances clients', key: 'creancesClients' as keyof SCPIBilan },
                    { label: 'Tresorerie', key: 'tresorerie' as keyof SCPIBilan },
                    { label: 'Autres actifs circulants', key: 'autresActifsCirculants' as keyof SCPIBilan },
                  ].map(row => (
                    <tr key={row.key} className="border-b border-white/[0.03]">
                      <td className="py-1 pr-3 text-[#94A3B8]">{row.label}</td>
                      {scpi.bilans.map(b => (
                        <td key={b.annee} className="py-1 px-2 text-right font-mono text-[#F1F5F9]">{(b[row.key] as number).toFixed(1)}</td>
                      ))}
                    </tr>
                  ))}
                  <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                    <td className="py-1.5 pr-3 text-[#F1F5F9] font-semibold">Total Actif</td>
                    {scpi.bilans.map(b => (
                      <td key={b.annee} className="py-1.5 px-2 text-right font-mono font-semibold text-[#60a5fa]">{b.totalActif.toFixed(1)}</td>
                    ))}
                  </tr>
                  <tr className="border-b border-white/[0.03]">
                    <td className="py-1.5 pr-3 text-[#10B981] font-semibold pt-3" colSpan={scpi.bilans.length + 1}>PASSIF</td>
                  </tr>
                  {[
                    { label: 'Capital social', key: 'capitalSocial' as keyof SCPIBilan },
                    { label: 'Primes d\'emission', key: 'primesEmission' as keyof SCPIBilan },
                    { label: 'Report a nouveau', key: 'reportANouveau' as keyof SCPIBilan },
                    { label: 'Resultat exercice', key: 'resultatExercice' as keyof SCPIBilan },
                  ].map(row => (
                    <tr key={row.key} className="border-b border-white/[0.03]">
                      <td className="py-1 pr-3 text-[#94A3B8]">{row.label}</td>
                      {scpi.bilans.map(b => (
                        <td key={b.annee} className="py-1 px-2 text-right font-mono text-[#F1F5F9]">{(b[row.key] as number).toFixed(1)}</td>
                      ))}
                    </tr>
                  ))}
                  <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                    <td className="py-1.5 pr-3 text-[#F1F5F9] font-semibold">Capitaux propres</td>
                    {scpi.bilans.map(b => (
                      <td key={b.annee} className="py-1.5 px-2 text-right font-mono font-semibold text-[#10B981]">{b.totalCapitauxPropres.toFixed(1)}</td>
                    ))}
                  </tr>
                  {[
                    { label: 'Provisions', key: 'provisions' as keyof SCPIBilan },
                    { label: 'Dettes financieres', key: 'dettesFinancieres' as keyof SCPIBilan },
                    { label: 'Dettes exploitation', key: 'dettesExploitation' as keyof SCPIBilan },
                    { label: 'Autres dettes', key: 'autresDettes' as keyof SCPIBilan },
                  ].map(row => (
                    <tr key={row.key} className="border-b border-white/[0.03]">
                      <td className="py-1 pr-3 text-[#94A3B8]">{row.label}</td>
                      {scpi.bilans.map(b => (
                        <td key={b.annee} className="py-1 px-2 text-right font-mono text-[#EF4444]/80">{(b[row.key] as number).toFixed(1)}</td>
                      ))}
                    </tr>
                  ))}
                  <tr className="bg-white/[0.02]">
                    <td className="py-1.5 pr-3 text-[#F1F5F9] font-semibold">Total Passif</td>
                    {scpi.bilans.map(b => (
                      <td key={b.annee} className="py-1.5 px-2 text-right font-mono font-semibold text-[#60a5fa]">{b.totalPassif.toFixed(1)}</td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* COMPTE DE RESULTAT */}
          <div className="glass-card p-4" style={{ transform: 'none' }}>
            <h4 className="text-sm font-semibold text-[#F1F5F9] mb-3 flex items-center gap-2">
              <svg className="w-4 h-4 text-[#10B981]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
              </svg>
              Compte de Resultat (M\u20AC)
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    <th className="text-left py-2 pr-3 text-[#475569] font-medium">Poste</th>
                    {scpi.comptesResultat.map(c => (
                      <th key={c.annee} className="text-right py-2 px-2 text-[#475569] font-medium">{c.annee}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-white/[0.03]">
                    <td className="py-1.5 pr-3 text-[#10B981] font-semibold" colSpan={scpi.comptesResultat.length + 1}>PRODUITS</td>
                  </tr>
                  <tr className="border-b border-white/[0.03]">
                    <td className="py-1 pr-3 text-[#94A3B8]">Produits locatifs</td>
                    {scpi.comptesResultat.map(c => (
                      <td key={c.annee} className="py-1 px-2 text-right font-mono text-[#10B981]">{c.produitsLocatifs.toFixed(1)}</td>
                    ))}
                  </tr>
                  <tr className="border-b border-white/[0.03]">
                    <td className="py-1 pr-3 text-[#94A3B8]">Autres produits</td>
                    {scpi.comptesResultat.map(c => (
                      <td key={c.annee} className="py-1 px-2 text-right font-mono text-[#F1F5F9]">{c.autresProduits.toFixed(1)}</td>
                    ))}
                  </tr>
                  <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                    <td className="py-1.5 pr-3 text-[#F1F5F9] font-semibold">Total Produits</td>
                    {scpi.comptesResultat.map(c => (
                      <td key={c.annee} className="py-1.5 px-2 text-right font-mono font-semibold text-[#10B981]">{c.totalProduits.toFixed(1)}</td>
                    ))}
                  </tr>
                  <tr className="border-b border-white/[0.03]">
                    <td className="py-1.5 pr-3 text-[#EF4444] font-semibold pt-2" colSpan={scpi.comptesResultat.length + 1}>CHARGES</td>
                  </tr>
                  {[
                    { label: 'Charges immobilieres', key: 'chargesImmobilieres' as keyof SCPICompteResultat },
                    { label: 'Charges de gestion', key: 'chargesGestion' as keyof SCPICompteResultat },
                    { label: 'Charges financieres', key: 'chargesFinancieres' as keyof SCPICompteResultat },
                    { label: 'Dotations provisions', key: 'dotationsProvisions' as keyof SCPICompteResultat },
                    { label: 'Autres charges', key: 'autresCharges' as keyof SCPICompteResultat },
                  ].map(row => (
                    <tr key={row.key} className="border-b border-white/[0.03]">
                      <td className="py-1 pr-3 text-[#94A3B8]">{row.label}</td>
                      {scpi.comptesResultat.map(c => (
                        <td key={c.annee} className="py-1 px-2 text-right font-mono text-[#EF4444]/80">-{(c[row.key] as number).toFixed(1)}</td>
                      ))}
                    </tr>
                  ))}
                  <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                    <td className="py-1.5 pr-3 text-[#F1F5F9] font-semibold">Total Charges</td>
                    {scpi.comptesResultat.map(c => (
                      <td key={c.annee} className="py-1.5 px-2 text-right font-mono font-semibold text-[#EF4444]">-{c.totalCharges.toFixed(1)}</td>
                    ))}
                  </tr>
                  <tr className="border-b border-white/[0.03]">
                    <td className="py-1.5 pr-3 text-[#8B5CF6] font-semibold pt-2" colSpan={scpi.comptesResultat.length + 1}>RESULTATS</td>
                  </tr>
                  <tr className="border-b border-white/[0.03]">
                    <td className="py-1 pr-3 text-[#94A3B8]">Resultat courant</td>
                    {scpi.comptesResultat.map(c => (
                      <td key={c.annee} className="py-1 px-2 text-right font-mono text-[#F1F5F9]">{c.resultatCourant.toFixed(1)}</td>
                    ))}
                  </tr>
                  <tr className="border-b border-white/[0.03]">
                    <td className="py-1 pr-3 text-[#94A3B8]">Resultat exceptionnel</td>
                    {scpi.comptesResultat.map(c => (
                      <td key={c.annee} className="py-1 px-2 text-right font-mono text-[#94A3B8]">{c.resultatExceptionnel.toFixed(1)}</td>
                    ))}
                  </tr>
                  <tr className="border-b border-white/[0.03] bg-white/[0.02]">
                    <td className="py-1.5 pr-3 text-[#F1F5F9] font-bold">Resultat net</td>
                    {scpi.comptesResultat.map(c => (
                      <td key={c.annee} className="py-1.5 px-2 text-right font-mono font-bold text-[#60a5fa]">{c.resultatNet.toFixed(1)}</td>
                    ))}
                  </tr>
                  <tr className="bg-white/[0.04]">
                    <td className="py-1.5 pr-3 text-[#F1F5F9] font-semibold">Resultat net / part</td>
                    {scpi.comptesResultat.map(c => (
                      <td key={c.annee} className="py-1.5 px-2 text-right font-mono font-semibold text-[#EAB308]">{c.resultatNetParPart.toFixed(2)} \u20AC</td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================================
// MAIN PAGE COMPONENT
// ============================================================

export default function FundsPage() {
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [sortField, setSortField] = useState<SortField>('scoreAlpha')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [showCoherence, setShowCoherence] = useState(false)

  // Coherence checks
  const coherenceResults = useMemo(() => showCoherence ? runCoherenceChecks() : [], [showCoherence])
  const coherenceStats = useMemo(() => {
    if (!showCoherence) return { erreurs: 0, alertes: 0, ok: 0 }
    return {
      erreurs: coherenceResults.filter(c => c.type === 'erreur').length,
      alertes: coherenceResults.filter(c => c.type === 'alerte').length,
      ok: coherenceResults.filter(c => c.type === 'ok').length,
    }
  }, [coherenceResults, showCoherence])

  // Extract unique categories
  const categories = useMemo(() => {
    const cats = new Set(SCPI_DATA.map(s => s.categorie))
    return Array.from(cats).sort()
  }, [])

  // Filtered and sorted data
  const filteredData = useMemo(() => {
    let result = [...SCPI_DATA]

    // Search
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(s =>
        s.nom.toLowerCase().includes(q) ||
        s.societeGestion.toLowerCase().includes(q) ||
        s.categorie.toLowerCase().includes(q)
      )
    }

    // Type filter
    if (typeFilter !== 'all') {
      result = result.filter(s => s.type === typeFilter)
    }

    // Category filter
    if (categoryFilter !== 'all') {
      result = result.filter(s => s.categorie === categoryFilter)
    }

    // Sort
    result.sort((a, b) => {
      let aVal: number | string
      let bVal: number | string

      switch (sortField) {
        case 'nom':
          aVal = a.nom.toLowerCase()
          bVal = b.nom.toLowerCase()
          break
        default:
          aVal = a[sortField] as number
          bVal = b[sortField] as number
      }

      if (aVal < bVal) return sortDir === 'asc' ? -1 : 1
      if (aVal > bVal) return sortDir === 'asc' ? 1 : -1
      return 0
    })

    return result
  }, [search, typeFilter, categoryFilter, sortField, sortDir])

  // Stats
  const stats = useMemo(() => {
    const total = filteredData.length
    if (total === 0) return { total: 0, avgTd: 0, avgScore: 0, avgTof: 0 }
    const avgTd = filteredData.reduce((s, f) => s + f.td, 0) / total
    const avgScore = filteredData.reduce((s, f) => s + f.scoreAlpha, 0) / total
    const avgTof = filteredData.reduce((s, f) => s + f.tof, 0) / total
    return { total, avgTd, avgScore, avgTof }
  }, [filteredData])

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDir(field === 'nom' ? 'asc' : 'desc')
    }
  }

  const sortIndicator = (field: SortField) => {
    if (sortField !== field) return null
    return (
      <svg className="w-3 h-3 inline-block ml-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d={sortDir === 'asc' ? 'M5 15l7-7 7 7' : 'M19 9l-7 7-7-7'} />
      </svg>
    )
  }

  return (
    <AppShell>
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#F1F5F9] mb-1">Fonds SCPI</h1>
        <p className="text-sm text-[#94A3B8]">Analyse Score Alpha et comparaison de {SCPI_DATA.length} fonds immobiliers</p>
      </div>

      {/* ============================================================ */}
      {/* STATS BAR                                                     */}
      {/* ============================================================ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Total Funds */}
        <div className="glass-card p-4 flex items-center gap-4" style={{ transform: 'none' }}>
          <div className="w-10 h-10 rounded-lg bg-[#2563EB]/10 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-[#2563EB]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-[#475569] mb-0.5">Fonds</div>
            <div className="text-xl font-bold font-mono text-[#F1F5F9]">{stats.total}</div>
          </div>
        </div>

        {/* Avg TD */}
        <div className="glass-card p-4 flex items-center gap-4" style={{ transform: 'none' }}>
          <div className="w-10 h-10 rounded-lg bg-[#10B981]/10 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-[#10B981]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
            </svg>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-[#475569] mb-0.5">TD moyen</div>
            <div className="text-xl font-bold font-mono text-[#10B981]">{stats.avgTd.toFixed(2)}%</div>
          </div>
        </div>

        {/* Avg Score */}
        <div className="glass-card p-4 flex items-center gap-4" style={{ transform: 'none' }}>
          <div className="w-10 h-10 rounded-lg bg-[#8B5CF6]/10 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-[#8B5CF6]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
            </svg>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-[#475569] mb-0.5">Score Alpha moy.</div>
            <div className="text-xl font-bold font-mono" style={{ color: scoreColor(Math.round(stats.avgScore)) }}>
              {Math.round(stats.avgScore)}
            </div>
          </div>
        </div>

        {/* Avg TOF */}
        <div className="glass-card p-4 flex items-center gap-4" style={{ transform: 'none' }}>
          <div className="w-10 h-10 rounded-lg bg-[#EAB308]/10 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-[#EAB308]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3H21m-3.75 3H21" />
            </svg>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-[#475569] mb-0.5">TOF moyen</div>
            <div className="text-xl font-bold font-mono text-[#F1F5F9]">{stats.avgTof.toFixed(1)}%</div>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* CHECK DE COHERENCE                                            */}
      {/* ============================================================ */}
      <div className="mb-6">
        <button
          onClick={() => setShowCoherence(!showCoherence)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition ${
            showCoherence
              ? 'bg-[#8B5CF6]/20 text-[#a78bfa] border border-[#8B5CF6]/30'
              : 'bg-white/[0.05] text-[#94A3B8] border border-white/[0.06] hover:border-white/[0.12] hover:text-[#F1F5F9]'
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
          </svg>
          Check de coherence
          {showCoherence && (
            <span className="ml-2 flex items-center gap-2 text-xs">
              {coherenceStats.erreurs > 0 && <span className="px-1.5 py-0.5 rounded bg-[#EF4444]/20 text-[#EF4444]">{coherenceStats.erreurs} err.</span>}
              {coherenceStats.alertes > 0 && <span className="px-1.5 py-0.5 rounded bg-[#EAB308]/20 text-[#EAB308]">{coherenceStats.alertes} alertes</span>}
              <span className="px-1.5 py-0.5 rounded bg-[#10B981]/20 text-[#10B981]">{coherenceStats.ok} ok</span>
            </span>
          )}
        </button>

        {showCoherence && (
          <div className="glass-card mt-3 p-4 animate-fade-in" style={{ transform: 'none' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-[#F1F5F9]">Resultats du check de coherence</h3>
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#EF4444]" />
                  <span className="text-[#94A3B8]">{coherenceStats.erreurs} erreur{coherenceStats.erreurs > 1 ? 's' : ''}</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#EAB308]" />
                  <span className="text-[#94A3B8]">{coherenceStats.alertes} alerte{coherenceStats.alertes > 1 ? 's' : ''}</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#10B981]" />
                  <span className="text-[#94A3B8]">{coherenceStats.ok} ok</span>
                </span>
              </div>
            </div>

            {/* Erreurs et alertes */}
            {coherenceResults.filter(c => c.type !== 'ok').length > 0 ? (
              <div className="space-y-1.5 max-h-[400px] overflow-y-auto">
                {coherenceResults.filter(c => c.type !== 'ok').map((check, i) => (
                  <div
                    key={i}
                    className={`flex items-start gap-3 px-3 py-2 rounded-lg text-xs ${
                      check.type === 'erreur' ? 'bg-[#EF4444]/10 border border-[#EF4444]/20' : 'bg-[#EAB308]/10 border border-[#EAB308]/20'
                    }`}
                  >
                    <span className={`mt-0.5 w-4 h-4 shrink-0 ${check.type === 'erreur' ? 'text-[#EF4444]' : 'text-[#EAB308]'}`}>
                      {check.type === 'erreur' ? (
                        <svg fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>
                      ) : (
                        <svg fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" /></svg>
                      )}
                    </span>
                    <div>
                      <span className="font-semibold text-[#F1F5F9]">{check.scpiNom}</span>
                      <span className="text-[#475569] mx-1.5">/</span>
                      <span className="text-[#94A3B8]">{check.categorie}</span>
                      <p className={`mt-0.5 ${check.type === 'erreur' ? 'text-[#FCA5A5]' : 'text-[#FDE68A]'}`}>{check.message}</p>
                      {check.detail && <p className="text-[#475569] mt-0.5">{check.detail}</p>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-2 px-3 py-4 rounded-lg bg-[#10B981]/10 border border-[#10B981]/20">
                <svg className="w-5 h-5 text-[#10B981]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm text-[#10B981] font-medium">Toutes les donnees sont coherentes</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* FILTER BAR                                                    */}
      {/* ============================================================ */}
      <div className="glass-card p-4 mb-6 flex flex-wrap items-center gap-3" style={{ transform: 'none' }}>
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#475569]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            type="text"
            placeholder="Rechercher un fonds, societe..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm rounded-lg bg-white/[0.05] border border-white/[0.06] text-[#F1F5F9] placeholder-[#475569] focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]/30 transition"
          />
        </div>

        {/* Type filter */}
        <select
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value)}
          className="sim-select text-sm py-2 min-w-[120px]"
        >
          <option value="all">Tous types</option>
          <option value="SCPI">SCPI</option>
          <option value="OPCI">OPCI</option>
          <option value="SCI">SCI</option>
        </select>

        {/* Category filter */}
        <select
          value={categoryFilter}
          onChange={e => setCategoryFilter(e.target.value)}
          className="sim-select text-sm py-2 min-w-[150px]"
        >
          <option value="all">Toutes categories</option>
          {categories.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        {/* Sort */}
        <div className="flex items-center gap-2 ml-auto">
          <span className="text-[11px] text-[#475569] uppercase tracking-wider whitespace-nowrap">Trier par</span>
          <select
            value={sortField}
            onChange={e => {
              const val = e.target.value as SortField
              setSortField(val)
              setSortDir(val === 'nom' ? 'asc' : 'desc')
            }}
            className="sim-select text-sm py-2 min-w-[160px]"
          >
            {SORT_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <button
            onClick={() => setSortDir(prev => prev === 'asc' ? 'desc' : 'asc')}
            className="p-2 rounded-lg bg-white/[0.05] border border-white/[0.06] text-[#94A3B8] hover:text-[#F1F5F9] hover:border-white/[0.12] transition"
            title={sortDir === 'asc' ? 'Croissant' : 'Decroissant'}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d={
                sortDir === 'asc'
                  ? 'M3 4.5h14.25M3 9h9.75M3 13.5h5.25m5.25-.75L17.25 9m0 0L21 12.75M17.25 9v12'
                  : 'M3 4.5h14.25M3 9h9.75M3 13.5h9.75m4.5-4.5v12m0 0l-3.75-3.75M17.25 21L21 17.25'
              } />
            </svg>
          </button>
        </div>
      </div>

      {/* Results count */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-[#475569]">
          {filteredData.length} fonds affiche{filteredData.length > 1 ? 's' : ''}
          {(search || typeFilter !== 'all' || categoryFilter !== 'all') && (
            <button
              onClick={() => { setSearch(''); setTypeFilter('all'); setCategoryFilter('all') }}
              className="ml-2 text-[#2563EB] hover:text-[#60a5fa] transition"
            >
              Reinitialiser les filtres
            </button>
          )}
        </p>
      </div>

      {/* ============================================================ */}
      {/* TABLE                                                         */}
      {/* ============================================================ */}
      <div className="glass-card overflow-hidden" style={{ transform: 'none' }}>
        <div className="overflow-x-auto">
          <table className="fund-table">
            <thead>
              <tr>
                <th className="cursor-pointer hover:text-[#94A3B8] select-none" onClick={() => toggleSort('scoreAlpha')}>
                  Score {sortIndicator('scoreAlpha')}
                </th>
                <th className="cursor-pointer hover:text-[#94A3B8] select-none" onClick={() => toggleSort('nom')}>
                  Fonds {sortIndicator('nom')}
                </th>
                <th>Categorie</th>
                <th className="cursor-pointer hover:text-[#94A3B8] select-none !text-right" onClick={() => toggleSort('td')}>
                  TD {sortIndicator('td')}
                </th>
                <th className="cursor-pointer hover:text-[#94A3B8] select-none !text-right" onClick={() => toggleSort('tof')}>
                  TOF {sortIndicator('tof')}
                </th>
                <th className="!text-right">Frais</th>
                <th className="cursor-pointer hover:text-[#94A3B8] select-none !text-right" onClick={() => toggleSort('capitalisation')}>
                  Capitalisation {sortIndicator('capitalisation')}
                </th>
                <th className="!text-center">ESG</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-[#475569]">
                    Aucun fonds ne correspond a vos criteres
                  </td>
                </tr>
              ) : filteredData.map(scpi => {
                const isExpanded = expandedId === scpi.id
                return (
                  <Fragment key={scpi.id}>
                    <tr
                      className={`cursor-pointer ${isExpanded ? 'bg-[#1a2035] !border-b-0' : ''}`}
                      onClick={() => setExpandedId(isExpanded ? null : scpi.id)}
                    >
                      {/* Score Alpha Badge */}
                      <td className="!py-3">
                        <div className="relative group flex justify-center">
                          <ScoreAlphaBadge score={scpi.scoreAlpha} />
                          <ScoreTooltip scpi={scpi} />
                        </div>
                      </td>

                      {/* Name + Societe */}
                      <td>
                        <div className="flex items-center gap-3">
                          <div>
                            <div className="font-medium text-[#F1F5F9] text-sm">{scpi.nom}</div>
                            <div className="text-[11px] text-[#475569]">{scpi.societeGestion}</div>
                          </div>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                            scpi.type === 'SCPI' ? 'bg-[#2563EB]/10 text-[#60a5fa]' :
                            scpi.type === 'OPCI' ? 'bg-[#8B5CF6]/10 text-[#a78bfa]' :
                            'bg-[#10B981]/10 text-[#34d399]'
                          }`}>
                            {scpi.type}
                          </span>
                        </div>
                      </td>

                      {/* Categorie */}
                      <td>
                        <span className="text-xs text-[#94A3B8]">{scpi.categorie}</span>
                      </td>

                      {/* TD */}
                      <td className="!text-right">
                        <div>
                          <span className={`font-mono font-semibold text-sm ${
                            scpi.td >= 6 ? 'text-[#10B981]' :
                            scpi.td >= 5 ? 'text-[#34d399]' :
                            scpi.td >= 4 ? 'text-[#EAB308]' :
                            'text-[#EF4444]'
                          }`}>
                            {scpi.td.toFixed(2)}%
                          </span>
                          {scpi.tdN1 > 0 && (
                            <div className="text-[10px] text-[#475569] font-mono">
                              N-1: {scpi.tdN1.toFixed(2)}%
                            </div>
                          )}
                        </div>
                      </td>

                      {/* TOF */}
                      <td className="!text-right">
                        <span className={`font-mono text-sm ${
                          scpi.tof >= 97 ? 'text-[#10B981]' :
                          scpi.tof >= 95 ? 'text-[#F1F5F9]' :
                          scpi.tof >= 90 ? 'text-[#EAB308]' :
                          'text-[#EF4444]'
                        }`}>
                          {scpi.tof.toFixed(1)}%
                        </span>
                      </td>

                      {/* Frais */}
                      <td className="!text-right">
                        <div className="text-xs">
                          <div className="font-mono text-[#94A3B8]">
                            {scpi.fraisSouscription > 0 ? (
                              <span>{scpi.fraisSouscription.toFixed(1)}%</span>
                            ) : (
                              <span className="text-[#10B981] font-semibold">0%</span>
                            )}
                            <span className="text-[#475569] mx-1">souscr.</span>
                          </div>
                          <div className="font-mono text-[#475569]">
                            {scpi.fraisGestion.toFixed(2)}%
                            <span className="text-[#475569] ml-1">gestion</span>
                          </div>
                        </div>
                      </td>

                      {/* Capitalisation */}
                      <td className="!text-right">
                        <span className="font-mono text-sm text-[#F1F5F9]">
                          {formatCapitalisation(scpi.capitalisation)}
                        </span>
                      </td>

                      {/* ESG */}
                      <td className="!text-center">
                        {scpi.esg ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#10B981]/10 text-[#34d399] border border-[#10B981]/20">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            ISR
                          </span>
                        ) : (
                          <span className="text-[#475569] text-xs">-</span>
                        )}
                      </td>
                    </tr>

                    {/* Expanded details */}
                    {isExpanded && (
                      <tr>
                        <td colSpan={8} className="!p-0">
                          <ExpandedDetails scpi={scpi} />
                        </td>
                      </tr>
                    )}
                  </Fragment>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  )
}
