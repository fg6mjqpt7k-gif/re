'use client'

import { useState, useMemo } from 'react'
import dynamic from 'next/dynamic'
import AppShell from '../../components/AppShell'
import { SCPI_DATA, SCPI, SCPIImmeuble } from '../../lib/data'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TaggedImmeuble extends SCPIImmeuble {
  scpiNom: string
  scpiId: string
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ASSET_TYPES = ['Bureaux', 'Commerces', 'Logistique', 'Sante', 'Hotels', 'Education', 'Residentiel'] as const

const SCPI_COLORS: Record<string, string> = {
  'corum-origin': '#2563EB',
  'iroko-zen': '#10B981',
  'remake-live': '#F59E0B',
  'primovie': '#EF4444',
  'epargne-pierre': '#8B5CF6',
  'transitions-europe': '#EC4899',
  'novaxia-neo': '#06B6D4',
  'immorente': '#F97316',
  'pierval-sante': '#14B8A6',
  'corum-xl': '#6366F1',
  'pfo2': '#A855F7',
  'activimmo': '#84CC16',
}

// ---------------------------------------------------------------------------
// Collect all immeubles tagged with parent SCPI info
// ---------------------------------------------------------------------------

const ALL_IMMEUBLES: TaggedImmeuble[] = SCPI_DATA.flatMap((scpi) =>
  scpi.immeubles.map((imm) => ({
    ...imm,
    scpiNom: scpi.nom,
    scpiId: scpi.id,
  }))
)

const ALL_COUNTRIES = Array.from(new Set(ALL_IMMEUBLES.map((i) => i.pays))).sort()

// ---------------------------------------------------------------------------
// Dynamic import for the map component (SSR: false)
// ---------------------------------------------------------------------------

const MapComponent = dynamic(() => import('./MapComponent'), {
  ssr: false,
  loading: () => (
    <div className="h-[600px] rounded-xl bg-[rgba(19,24,37,0.6)] border border-white/[0.06] flex items-center justify-center">
      <div className="text-[#94A3B8] text-sm">Chargement de la carte...</div>
    </div>
  ),
})

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace('.0', '') + ' M'
  if (n >= 1_000) return (n / 1_000).toFixed(0) + ' k'
  return n.toLocaleString('fr-FR')
}

function formatEuro(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace('.0', '') + ' M\u00a0\u20ac'
  if (n >= 1_000) return (n / 1_000).toFixed(0) + ' k\u00a0\u20ac'
  return n.toLocaleString('fr-FR') + ' \u20ac'
}

// ---------------------------------------------------------------------------
// Stats sidebar component
// ---------------------------------------------------------------------------

function StatsSidebar({ immeubles }: { immeubles: TaggedImmeuble[] }) {
  const totalAssets = immeubles.length
  const totalSurface = immeubles.reduce((s, i) => s + i.surface, 0)
  const totalRent = immeubles.reduce((s, i) => s + i.loyer, 0)

  const countryBreakdown = useMemo(() => {
    const map = new Map<string, number>()
    immeubles.forEach((i) => map.set(i.pays, (map.get(i.pays) || 0) + 1))
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
  }, [immeubles])

  const typeBreakdown = useMemo(() => {
    const map = new Map<string, number>()
    immeubles.forEach((i) => map.set(i.type, (map.get(i.type) || 0) + 1))
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
  }, [immeubles])

  const maxCountry = countryBreakdown.length > 0 ? countryBreakdown[0][1] : 1
  const maxType = typeBreakdown.length > 0 ? typeBreakdown[0][1] : 1

  return (
    <div className="space-y-4">
      {/* KPI cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-[rgba(19,24,37,0.6)] border border-white/[0.06] rounded-xl p-4">
          <div className="text-[#475569] text-xs mb-1">Total actifs</div>
          <div className="text-[#F1F5F9] text-xl font-bold">{totalAssets}</div>
        </div>
        <div className="bg-[rgba(19,24,37,0.6)] border border-white/[0.06] rounded-xl p-4">
          <div className="text-[#475569] text-xs mb-1">Surface totale</div>
          <div className="text-[#F1F5F9] text-xl font-bold">{formatNumber(totalSurface)} m&sup2;</div>
        </div>
        <div className="bg-[rgba(19,24,37,0.6)] border border-white/[0.06] rounded-xl p-4">
          <div className="text-[#475569] text-xs mb-1">Loyer annuel</div>
          <div className="text-[#10B981] text-xl font-bold">{formatEuro(totalRent)}</div>
        </div>
      </div>

      {/* Country breakdown */}
      <div className="bg-[rgba(19,24,37,0.6)] border border-white/[0.06] rounded-xl p-4">
        <div className="text-[#F1F5F9] text-sm font-semibold mb-3">Par pays</div>
        <div className="space-y-2">
          {countryBreakdown.map(([country, count]) => (
            <div key={country}>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-[#94A3B8]">{country}</span>
                <span className="text-[#F1F5F9] font-medium">{count}</span>
              </div>
              <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#2563EB] rounded-full transition-all"
                  style={{ width: `${(count / maxCountry) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Type breakdown */}
      <div className="bg-[rgba(19,24,37,0.6)] border border-white/[0.06] rounded-xl p-4">
        <div className="text-[#F1F5F9] text-sm font-semibold mb-3">Par type d&apos;actif</div>
        <div className="space-y-2">
          {typeBreakdown.map(([type, count]) => (
            <div key={type}>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-[#94A3B8]">{type}</span>
                <span className="text-[#F1F5F9] font-medium">{count}</span>
              </div>
              <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#10B981] rounded-full transition-all"
                  style={{ width: `${(count / maxType) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function CartePage() {
  // Filter state
  const [selectedSCPIs, setSelectedSCPIs] = useState<Set<string>>(
    new Set(SCPI_DATA.map((s) => s.id))
  )
  const [selectedTypes, setSelectedTypes] = useState<Set<string>>(
    new Set(ASSET_TYPES)
  )
  const [selectedCountries, setSelectedCountries] = useState<Set<string>>(
    new Set(ALL_COUNTRIES)
  )

  // Dropdown visibility
  const [showSCPIDropdown, setShowSCPIDropdown] = useState(false)
  const [showTypeDropdown, setShowTypeDropdown] = useState(false)
  const [showCountryDropdown, setShowCountryDropdown] = useState(false)

  // Toggle helpers
  function toggleSet(set: Set<string>, value: string): Set<string> {
    const next = new Set(set)
    if (next.has(value)) next.delete(value)
    else next.add(value)
    return next
  }

  function toggleAll(set: Set<string>, allValues: string[]): Set<string> {
    if (set.size === allValues.length) return new Set()
    return new Set(allValues)
  }

  // Filtered immeubles
  const filteredImmeubles = useMemo(
    () =>
      ALL_IMMEUBLES.filter(
        (i) =>
          selectedSCPIs.has(i.scpiId) &&
          selectedTypes.has(i.type) &&
          selectedCountries.has(i.pays)
      ),
    [selectedSCPIs, selectedTypes, selectedCountries]
  )

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Page header */}
        <div>
          <h1 className="text-2xl font-bold text-[#F1F5F9]">Carte du patrimoine</h1>
          <p className="text-[#94A3B8] text-sm mt-1">
            Visualisez l&apos;ensemble des actifs immobiliers detenus par les SCPI
          </p>
        </div>

        {/* Filter bar */}
        <div className="bg-[rgba(19,24,37,0.6)] border border-white/[0.06] rounded-xl p-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* SCPI filter */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowSCPIDropdown(!showSCPIDropdown)
                  setShowTypeDropdown(false)
                  setShowCountryDropdown(false)
                }}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.06] text-sm text-[#F1F5F9] hover:bg-white/[0.08] transition"
              >
                <svg className="w-4 h-4 text-[#2563EB]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
                SCPI ({selectedSCPIs.size}/{SCPI_DATA.length})
                <svg className="w-3 h-3 text-[#475569]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {showSCPIDropdown && (
                <div className="absolute z-50 top-full left-0 mt-1 w-64 bg-[#131825] border border-white/[0.06] rounded-xl shadow-2xl p-2 max-h-72 overflow-y-auto">
                  <button
                    onClick={() => setSelectedSCPIs(toggleAll(selectedSCPIs, SCPI_DATA.map((s) => s.id)))}
                    className="w-full text-left px-3 py-1.5 text-xs text-[#2563EB] hover:bg-white/[0.04] rounded-lg mb-1"
                  >
                    {selectedSCPIs.size === SCPI_DATA.length ? 'Tout deselectionner' : 'Tout selectionner'}
                  </button>
                  {SCPI_DATA.map((scpi) => (
                    <label
                      key={scpi.id}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-white/[0.04] cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedSCPIs.has(scpi.id)}
                        onChange={() => setSelectedSCPIs(toggleSet(selectedSCPIs, scpi.id))}
                        className="rounded border-white/20 bg-white/[0.06] text-[#2563EB] focus:ring-[#2563EB] focus:ring-offset-0"
                      />
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: SCPI_COLORS[scpi.id] || '#94A3B8' }}
                      />
                      <span className="text-sm text-[#F1F5F9] truncate">{scpi.nom}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Asset type filter */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowTypeDropdown(!showTypeDropdown)
                  setShowSCPIDropdown(false)
                  setShowCountryDropdown(false)
                }}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.06] text-sm text-[#F1F5F9] hover:bg-white/[0.08] transition"
              >
                <svg className="w-4 h-4 text-[#10B981]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 0h.008v.008h-.008V7.5z" />
                </svg>
                Type ({selectedTypes.size}/{ASSET_TYPES.length})
                <svg className="w-3 h-3 text-[#475569]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {showTypeDropdown && (
                <div className="absolute z-50 top-full left-0 mt-1 w-56 bg-[#131825] border border-white/[0.06] rounded-xl shadow-2xl p-2 max-h-72 overflow-y-auto">
                  <button
                    onClick={() => setSelectedTypes(toggleAll(selectedTypes, [...ASSET_TYPES]))}
                    className="w-full text-left px-3 py-1.5 text-xs text-[#10B981] hover:bg-white/[0.04] rounded-lg mb-1"
                  >
                    {selectedTypes.size === ASSET_TYPES.length ? 'Tout deselectionner' : 'Tout selectionner'}
                  </button>
                  {ASSET_TYPES.map((type) => (
                    <label
                      key={type}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-white/[0.04] cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedTypes.has(type)}
                        onChange={() => setSelectedTypes(toggleSet(selectedTypes, type))}
                        className="rounded border-white/20 bg-white/[0.06] text-[#10B981] focus:ring-[#10B981] focus:ring-offset-0"
                      />
                      <span className="text-sm text-[#F1F5F9]">{type}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Country filter */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowCountryDropdown(!showCountryDropdown)
                  setShowSCPIDropdown(false)
                  setShowTypeDropdown(false)
                }}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.06] text-sm text-[#F1F5F9] hover:bg-white/[0.08] transition"
              >
                <svg className="w-4 h-4 text-[#F59E0B]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
                </svg>
                Pays ({selectedCountries.size}/{ALL_COUNTRIES.length})
                <svg className="w-3 h-3 text-[#475569]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {showCountryDropdown && (
                <div className="absolute z-50 top-full left-0 mt-1 w-56 bg-[#131825] border border-white/[0.06] rounded-xl shadow-2xl p-2 max-h-72 overflow-y-auto">
                  <button
                    onClick={() => setSelectedCountries(toggleAll(selectedCountries, ALL_COUNTRIES))}
                    className="w-full text-left px-3 py-1.5 text-xs text-[#F59E0B] hover:bg-white/[0.04] rounded-lg mb-1"
                  >
                    {selectedCountries.size === ALL_COUNTRIES.length ? 'Tout deselectionner' : 'Tout selectionner'}
                  </button>
                  {ALL_COUNTRIES.map((country) => (
                    <label
                      key={country}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-white/[0.04] cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedCountries.has(country)}
                        onChange={() => setSelectedCountries(toggleSet(selectedCountries, country))}
                        className="rounded border-white/20 bg-white/[0.06] text-[#F59E0B] focus:ring-[#F59E0B] focus:ring-offset-0"
                      />
                      <span className="text-sm text-[#F1F5F9]">{country}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Total count badge */}
            <div className="ml-auto flex items-center gap-2 px-3 py-2 rounded-lg bg-[#2563EB]/10 border border-[#2563EB]/20">
              <div className="w-2 h-2 rounded-full bg-[#2563EB]" />
              <span className="text-sm font-medium text-[#60a5fa]">
                {filteredImmeubles.length} actif{filteredImmeubles.length !== 1 ? 's' : ''} visible{filteredImmeubles.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>

        {/* Map + Stats layout */}
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-6">
          {/* Map */}
          <div
            className="bg-[rgba(19,24,37,0.6)] border border-white/[0.06] rounded-xl overflow-hidden"
            onClick={() => {
              setShowSCPIDropdown(false)
              setShowTypeDropdown(false)
              setShowCountryDropdown(false)
            }}
          >
            <MapComponent immeubles={filteredImmeubles} scpiColors={SCPI_COLORS} />
          </div>

          {/* Stats sidebar */}
          <StatsSidebar immeubles={filteredImmeubles} />
        </div>

        {/* Legend */}
        <div className="bg-[rgba(19,24,37,0.6)] border border-white/[0.06] rounded-xl p-4">
          <div className="text-[#F1F5F9] text-sm font-semibold mb-3">Legende SCPI</div>
          <div className="flex flex-wrap gap-3">
            {SCPI_DATA.map((scpi) => (
              <div key={scpi.id} className="flex items-center gap-1.5">
                <span
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: SCPI_COLORS[scpi.id] || '#94A3B8' }}
                />
                <span className="text-xs text-[#94A3B8]">{scpi.nom}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  )
}
