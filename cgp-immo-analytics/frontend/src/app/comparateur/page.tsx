'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import { SCPI_DATA, SCPI } from '../../lib/data'
import AppShell from '../../components/AppShell'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const COLORS = ['#2563EB', '#10B981', '#F59E0B', '#EF4444']

const RADAR_AXES: { key: keyof SCPI['scoreDetails']; label: string }[] = [
  { key: 'rendement', label: 'Rendement' },
  { key: 'risque', label: 'Risque' },
  { key: 'frais', label: 'Frais' },
  { key: 'liquidite', label: 'Liquidite' },
  { key: 'diversification', label: 'Diversification' },
  { key: 'esg', label: 'ESG' },
]

const GEO_COLORS = [
  '#2563EB', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
  '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1',
]

const SECTOR_COLORS = [
  '#8B5CF6', '#06B6D4', '#F97316', '#EC4899', '#84CC16',
  '#2563EB', '#10B981', '#F59E0B', '#EF4444', '#6366F1',
]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatCurrency(n: number): string {
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)} Md\u20AC`
  if (n >= 1e6) return `${(n / 1e6).toFixed(0)} M\u20AC`
  return `${n.toLocaleString('fr-FR')}\u00A0\u20AC`
}

function formatPct(n: number): string {
  return `${n.toFixed(2)}\u00A0%`
}

// ---------------------------------------------------------------------------
// Radar / Spider Chart (Pure SVG)
// ---------------------------------------------------------------------------

function RadarChart({ scpis }: { scpis: SCPI[] }) {
  const size = 400
  const cx = size / 2
  const cy = size / 2
  const maxR = 150
  const axisCount = RADAR_AXES.length
  const angleStep = (2 * Math.PI) / axisCount
  // Start from top (negative Y)
  const startAngle = -Math.PI / 2

  function pointOnAxis(axisIndex: number, valuePct: number): { x: number; y: number } {
    const angle = startAngle + axisIndex * angleStep
    const r = (valuePct / 100) * maxR
    return {
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
    }
  }

  function ringPoints(pct: number): string {
    return Array.from({ length: axisCount }, (_, i) => {
      const p = pointOnAxis(i, pct)
      return `${p.x},${p.y}`
    }).join(' ')
  }

  function scpiPolygon(scpi: SCPI): string {
    return RADAR_AXES.map((axis, i) => {
      const val = scpi.scoreDetails[axis.key]
      const p = pointOnAxis(i, val)
      return `${p.x},${p.y}`
    }).join(' ')
  }

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      className="w-full max-w-[400px] h-auto mx-auto"
      style={{ maxHeight: 400 }}
    >
      {/* Concentric rings */}
      {[25, 50, 75, 100].map((pct) => (
        <polygon
          key={pct}
          points={ringPoints(pct)}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="1"
        />
      ))}

      {/* Axis lines */}
      {RADAR_AXES.map((_, i) => {
        const p = pointOnAxis(i, 100)
        return (
          <line
            key={i}
            x1={cx}
            y1={cy}
            x2={p.x}
            y2={p.y}
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="1"
          />
        )
      })}

      {/* SCPI polygons */}
      {scpis.map((scpi, idx) => (
        <polygon
          key={scpi.id}
          points={scpiPolygon(scpi)}
          fill={COLORS[idx] + '20'}
          stroke={COLORS[idx]}
          strokeWidth="2"
          strokeLinejoin="round"
        />
      ))}

      {/* Data points */}
      {scpis.map((scpi, idx) =>
        RADAR_AXES.map((axis, i) => {
          const val = scpi.scoreDetails[axis.key]
          const p = pointOnAxis(i, val)
          return (
            <circle
              key={`${scpi.id}-${axis.key}`}
              cx={p.x}
              cy={p.y}
              r="3.5"
              fill={COLORS[idx]}
              stroke="#0B1120"
              strokeWidth="1.5"
            />
          )
        })
      )}

      {/* Axis labels */}
      {RADAR_AXES.map((axis, i) => {
        const p = pointOnAxis(i, 115)
        let textAnchor: 'start' | 'middle' | 'end' = 'middle'
        if (p.x < cx - 10) textAnchor = 'end'
        else if (p.x > cx + 10) textAnchor = 'start'
        return (
          <text
            key={axis.key}
            x={p.x}
            y={p.y}
            textAnchor={textAnchor}
            dominantBaseline="central"
            className="fill-[#94A3B8] text-[11px]"
            style={{ fontSize: 11 }}
          >
            {axis.label}
          </text>
        )
      })}
    </svg>
  )
}

// ---------------------------------------------------------------------------
// Comparison Table
// ---------------------------------------------------------------------------

interface RowDef {
  label: string
  getValue: (s: SCPI) => number | string | boolean
  format: (v: number | string | boolean) => string
  higherIsBetter: boolean
  numeric: boolean
}

const TABLE_ROWS: RowDef[] = [
  {
    label: 'Prix part',
    getValue: (s) => s.prixPart,
    format: (v) => `${(v as number).toLocaleString('fr-FR')}\u00A0\u20AC`,
    higherIsBetter: false,
    numeric: true,
  },
  {
    label: 'TD',
    getValue: (s) => s.td,
    format: (v) => formatPct(v as number),
    higherIsBetter: true,
    numeric: true,
  },
  {
    label: 'TRI 5 ans',
    getValue: (s) => s.tri5ans,
    format: (v) => (v as number) > 0 ? formatPct(v as number) : 'N/A',
    higherIsBetter: true,
    numeric: true,
  },
  {
    label: 'TRI 10 ans',
    getValue: (s) => s.tri10ans,
    format: (v) => (v as number) > 0 ? formatPct(v as number) : 'N/A',
    higherIsBetter: true,
    numeric: true,
  },
  {
    label: 'Frais souscription',
    getValue: (s) => s.fraisSouscription,
    format: (v) => formatPct(v as number),
    higherIsBetter: false,
    numeric: true,
  },
  {
    label: 'Frais gestion',
    getValue: (s) => s.fraisGestion,
    format: (v) => formatPct(v as number),
    higherIsBetter: false,
    numeric: true,
  },
  {
    label: 'TOF',
    getValue: (s) => s.tof,
    format: (v) => formatPct(v as number),
    higherIsBetter: true,
    numeric: true,
  },
  {
    label: 'Capitalisation',
    getValue: (s) => s.capitalisation,
    format: (v) => formatCurrency(v as number),
    higherIsBetter: true,
    numeric: true,
  },
  {
    label: 'Endettement',
    getValue: (s) => s.ratioEndettement,
    format: (v) => formatPct(v as number),
    higherIsBetter: false,
    numeric: true,
  },
  {
    label: 'Anciennete',
    getValue: (s) => s.anciennete,
    format: (v) => `${v}\u00A0ans`,
    higherIsBetter: true,
    numeric: true,
  },
  {
    label: 'ESG',
    getValue: (s) => s.esg,
    format: (v) => (v as boolean) ? 'Oui' : 'Non',
    higherIsBetter: true,
    numeric: false,
  },
  {
    label: 'Score Alpha',
    getValue: (s) => s.scoreAlpha,
    format: (v) => `${v}\u00A0/\u00A0100`,
    higherIsBetter: true,
    numeric: true,
  },
]

function ComparisonTable({ scpis }: { scpis: SCPI[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/[0.06]">
            <th className="text-left py-3 px-4 text-[#94A3B8] font-medium text-xs uppercase tracking-wider">
              Metrique
            </th>
            {scpis.map((s, idx) => (
              <th key={s.id} className="text-right py-3 px-4 font-medium text-xs uppercase tracking-wider" style={{ color: COLORS[idx] }}>
                {s.nom}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {TABLE_ROWS.map((row) => {
            const values = scpis.map((s) => row.getValue(s))

            // Determine best/worst among numeric values
            let bestIdx = -1
            let worstIdx = -1
            if (row.numeric && scpis.length >= 2) {
              const numericValues = values.map((v, i) => ({ v: v as number, i }))
              // Filter out 0 values for TRI (N/A)
              const validValues = numericValues.filter((nv) => {
                if ((row.label === 'TRI 5 ans' || row.label === 'TRI 10 ans') && nv.v === 0) return false
                return true
              })
              if (validValues.length >= 2) {
                const sorted = [...validValues].sort((a, b) => a.v - b.v)
                if (row.higherIsBetter) {
                  bestIdx = sorted[sorted.length - 1].i
                  worstIdx = sorted[0].i
                } else {
                  bestIdx = sorted[0].i
                  worstIdx = sorted[sorted.length - 1].i
                }
              }
            }
            if (row.label === 'ESG') {
              const trueCount = values.filter((v) => v === true).length
              const falseCount = values.filter((v) => v === false).length
              if (trueCount > 0 && falseCount > 0) {
                bestIdx = values.findIndex((v) => v === true)
                worstIdx = values.findIndex((v) => v === false)
              }
            }

            return (
              <tr key={row.label} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                <td className="py-3 px-4 text-[#94A3B8] font-medium">{row.label}</td>
                {scpis.map((s, idx) => {
                  const val = values[idx]
                  let cellColor = '#F1F5F9'
                  if (idx === bestIdx) cellColor = '#10B981'
                  else if (idx === worstIdx) cellColor = '#F97316'
                  return (
                    <td
                      key={s.id}
                      className="py-3 px-4 text-right font-mono text-sm"
                      style={{ color: cellColor, fontFamily: "'JetBrains Mono', monospace" }}
                    >
                      {row.format(val)}
                    </td>
                  )
                })}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Stacked Bar Chart (Geographic / Sector)
// ---------------------------------------------------------------------------

function StackedBarChart({
  scpis,
  getData,
  getLabel,
  getPct,
  colorPalette,
  title,
}: {
  scpis: SCPI[]
  getData: (s: SCPI) => { label: string; pct: number }[]
  getLabel: (item: { label: string; pct: number }) => string
  getPct: (item: { label: string; pct: number }) => number
  colorPalette: string[]
  title: string
}) {
  // Collect all unique labels across all SCPI
  const allLabels = useMemo(() => {
    const set = new Set<string>()
    scpis.forEach((s) => {
      getData(s).forEach((item) => set.add(getLabel(item)))
    })
    return Array.from(set)
  }, [scpis, getData, getLabel])

  const labelColorMap = useMemo(() => {
    const map: Record<string, string> = {}
    allLabels.forEach((label, i) => {
      map[label] = colorPalette[i % colorPalette.length]
    })
    return map
  }, [allLabels, colorPalette])

  const barHeight = 36
  const barGap = 16
  const labelWidth = 140
  const chartWidth = 600
  const svgHeight = scpis.length * (barHeight + barGap) + barGap + 40
  const barAreaWidth = chartWidth - labelWidth - 20

  return (
    <div>
      <h3 className="text-base font-semibold text-[#F1F5F9] mb-4">{title}</h3>
      <div className="overflow-x-auto">
        <svg viewBox={`0 0 ${chartWidth} ${svgHeight}`} className="w-full max-w-[600px]" style={{ minWidth: 400 }}>
          {scpis.map((scpi, sIdx) => {
            const items = getData(scpi)
            const y = barGap + sIdx * (barHeight + barGap)
            let offsetX = labelWidth

            return (
              <g key={scpi.id}>
                {/* SCPI name label */}
                <text
                  x={labelWidth - 8}
                  y={y + barHeight / 2}
                  textAnchor="end"
                  dominantBaseline="central"
                  className="fill-[#F1F5F9] text-[12px]"
                  style={{ fontSize: 12 }}
                >
                  {scpi.nom}
                </text>

                {/* Stacked segments */}
                {items.map((item) => {
                  const label = getLabel(item)
                  const pct = getPct(item)
                  const segWidth = (pct / 100) * barAreaWidth
                  const xPos = offsetX
                  offsetX += segWidth

                  return (
                    <g key={label}>
                      <rect
                        x={xPos}
                        y={y}
                        width={Math.max(0, segWidth)}
                        height={barHeight}
                        fill={labelColorMap[label]}
                        rx="2"
                      />
                      {segWidth > 30 && (
                        <text
                          x={xPos + segWidth / 2}
                          y={y + barHeight / 2}
                          textAnchor="middle"
                          dominantBaseline="central"
                          className="fill-white text-[10px] font-medium"
                          style={{ fontSize: 10 }}
                        >
                          {pct}%
                        </text>
                      )}
                    </g>
                  )
                })}

                {/* Border around the full bar */}
                <rect
                  x={labelWidth}
                  y={y}
                  width={barAreaWidth}
                  height={barHeight}
                  fill="none"
                  stroke="rgba(255,255,255,0.06)"
                  strokeWidth="1"
                  rx="2"
                />
              </g>
            )
          })}
        </svg>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mt-3">
        {allLabels.map((label) => (
          <div key={label} className="flex items-center gap-1.5 text-xs text-[#94A3B8]">
            <div className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: labelColorMap[label] }} />
            {label}
          </div>
        ))}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// SCPI Selector (Multi-select dropdown with checkboxes)
// ---------------------------------------------------------------------------

function SCPISelector({
  selected,
  onToggle,
  onRemove,
}: {
  selected: string[]
  onToggle: (id: string) => void
  onRemove: (id: string) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="space-y-3">
      {/* Selected pills */}
      <div className="flex flex-wrap gap-2 min-h-[32px]">
        {selected.map((id, idx) => {
          const scpi = SCPI_DATA.find((s) => s.id === id)
          if (!scpi) return null
          return (
            <span
              key={id}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium text-white"
              style={{ backgroundColor: COLORS[idx] + 'CC' }}
            >
              {scpi.nom}
              <button
                onClick={() => onRemove(id)}
                className="ml-0.5 hover:bg-white/20 rounded-full w-4 h-4 flex items-center justify-center text-xs leading-none"
              >
                x
              </button>
            </span>
          )
        })}
      </div>

      {/* Dropdown */}
      <div ref={ref} className="relative">
        <button
          onClick={() => setOpen(!open)}
          className="w-full flex items-center justify-between px-4 py-3 rounded-lg border border-white/[0.1] bg-[rgba(19,24,37,0.6)] text-sm text-[#F1F5F9] hover:border-[#2563EB]/50 transition-colors"
        >
          <span className="text-[#94A3B8]">
            {selected.length === 0
              ? 'Selectionnez 2 a 4 SCPI a comparer...'
              : `${selected.length} SCPI selectionnee${selected.length > 1 ? 's' : ''}`}
          </span>
          <svg
            className={`w-4 h-4 text-[#475569] transition-transform ${open ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {open && (
          <div className="absolute z-20 mt-1 w-full max-h-64 overflow-y-auto rounded-lg border border-white/[0.1] bg-[#131825] shadow-xl">
            {SCPI_DATA.map((scpi) => {
              const isSelected = selected.includes(scpi.id)
              const isDisabled = !isSelected && selected.length >= 4
              return (
                <button
                  key={scpi.id}
                  onClick={() => {
                    if (!isDisabled || isSelected) onToggle(scpi.id)
                  }}
                  disabled={isDisabled && !isSelected}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors ${
                    isDisabled && !isSelected
                      ? 'text-[#475569] cursor-not-allowed'
                      : 'text-[#F1F5F9] hover:bg-white/[0.04]'
                  }`}
                >
                  {/* Checkbox */}
                  <div
                    className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                      isSelected
                        ? 'bg-[#2563EB] border-[#2563EB]'
                        : 'border-[#475569]'
                    }`}
                  >
                    {isSelected && (
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{scpi.nom}</div>
                    <div className="text-[11px] text-[#475569]">
                      {scpi.societeGestion} &middot; TD {scpi.td.toFixed(2)}% &middot; Score {scpi.scoreAlpha}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function ComparateurPage() {
  const [selectedIds, setSelectedIds] = useState<string[]>([
    'corum-origin',
    'iroko-zen',
  ])

  const selectedSCPIs = useMemo(
    () => selectedIds.map((id) => SCPI_DATA.find((s) => s.id === id)!).filter(Boolean),
    [selectedIds]
  )

  function handleToggle(id: string) {
    setSelectedIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((x) => x !== id)
      }
      if (prev.length >= 4) return prev
      return [...prev, id]
    })
  }

  function handleRemove(id: string) {
    setSelectedIds((prev) => prev.filter((x) => x !== id))
  }

  const canCompare = selectedSCPIs.length >= 2

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-[#F1F5F9]">Comparateur SCPI</h1>
          <p className="text-sm text-[#94A3B8] mt-1">
            Comparez jusqu&apos;a 4 SCPI sur tous les criteres : performance, risque, frais, diversification et ESG.
          </p>
        </div>

        {/* Selector Card */}
        <div
          className="rounded-xl p-6"
          style={{
            background: 'rgba(19,24,37,0.6)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 12,
          }}
        >
          <h2 className="text-sm font-semibold text-[#F1F5F9] mb-3 uppercase tracking-wider">
            Selection des SCPI
          </h2>
          <SCPISelector selected={selectedIds} onToggle={handleToggle} onRemove={handleRemove} />
          {!canCompare && (
            <p className="text-xs text-[#F59E0B] mt-3">
              Selectionnez au moins 2 SCPI pour lancer la comparaison.
            </p>
          )}
        </div>

        {canCompare && (
          <>
            {/* Radar Chart Card */}
            <div
              className="rounded-xl p-6"
              style={{
                background: 'rgba(19,24,37,0.6)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 12,
              }}
            >
              <h2 className="text-sm font-semibold text-[#F1F5F9] mb-1 uppercase tracking-wider">
                Radar Score Alpha
              </h2>
              <p className="text-xs text-[#475569] mb-6">
                6 axes normalises sur 100 — plus l&apos;aire est grande, meilleure est la SCPI.
              </p>

              {/* Legend */}
              <div className="flex flex-wrap gap-4 mb-4 justify-center">
                {selectedSCPIs.map((s, idx) => (
                  <div key={s.id} className="flex items-center gap-2 text-sm">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx] }} />
                    <span className="text-[#F1F5F9] font-medium">{s.nom}</span>
                    <span className="text-[#475569] font-mono text-xs" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                      ({s.scoreAlpha})
                    </span>
                  </div>
                ))}
              </div>

              <RadarChart scpis={selectedSCPIs} />
            </div>

            {/* Comparison Table Card */}
            <div
              className="rounded-xl p-6"
              style={{
                background: 'rgba(19,24,37,0.6)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 12,
              }}
            >
              <h2 className="text-sm font-semibold text-[#F1F5F9] mb-1 uppercase tracking-wider">
                Comparaison detaillee
              </h2>
              <p className="text-xs text-[#475569] mb-4">
                <span className="text-[#10B981]">Vert</span> = meilleure valeur &middot;{' '}
                <span className="text-[#F97316]">Orange</span> = a surveiller
              </p>
              <ComparisonTable scpis={selectedSCPIs} />
            </div>

            {/* Geographic Comparison Card */}
            <div
              className="rounded-xl p-6"
              style={{
                background: 'rgba(19,24,37,0.6)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 12,
              }}
            >
              <h2 className="text-sm font-semibold text-[#F1F5F9] mb-1 uppercase tracking-wider">
                Repartition geographique
              </h2>
              <p className="text-xs text-[#475569] mb-4">
                Poids de chaque pays dans le patrimoine immobilier.
              </p>
              <StackedBarChart
                scpis={selectedSCPIs}
                getData={(s) => s.repartitionGeo.map((g) => ({ label: g.pays, pct: g.pct }))}
                getLabel={(item) => item.label}
                getPct={(item) => item.pct}
                colorPalette={GEO_COLORS}
                title=""
              />
            </div>

            {/* Sector Comparison Card */}
            <div
              className="rounded-xl p-6"
              style={{
                background: 'rgba(19,24,37,0.6)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 12,
              }}
            >
              <h2 className="text-sm font-semibold text-[#F1F5F9] mb-1 uppercase tracking-wider">
                Repartition sectorielle
              </h2>
              <p className="text-xs text-[#475569] mb-4">
                Poids de chaque secteur d&apos;activite dans le patrimoine.
              </p>
              <StackedBarChart
                scpis={selectedSCPIs}
                getData={(s) => s.repartitionSectorielle.map((r) => ({ label: r.secteur, pct: r.pct }))}
                getLabel={(item) => item.label}
                getPct={(item) => item.pct}
                colorPalette={SECTOR_COLORS}
                title=""
              />
            </div>
          </>
        )}
      </div>
    </AppShell>
  )
}
