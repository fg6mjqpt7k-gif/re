'use client'

import { useEffect, useState } from 'react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface FundOverview {
  funds_by_type: Record<string, number>
  total_market_capitalization: number
  average_distribution_rate: number
}

function StatCard({ label, value, sublabel, tooltip }: {
  label: string
  value: string
  sublabel?: string
  tooltip?: string
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-md transition group relative">
      <p className="text-sm text-slate-500 mb-1">{label}</p>
      <p className="text-3xl font-bold text-slate-900">{value}</p>
      {sublabel && <p className="text-xs text-slate-400 mt-1">{sublabel}</p>}
      {tooltip && (
        <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-slate-100 text-slate-400 text-xs flex items-center justify-center cursor-help group-hover:bg-primary-100 group-hover:text-primary-600 transition"
             title={tooltip}>
          ?
        </div>
      )}
    </div>
  )
}

export default function Dashboard() {
  const [overview, setOverview] = useState<FundOverview | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch(`${API_URL}/api/funds/stats/overview`)
      .then(res => res.json())
      .then(data => {
        setOverview(data)
        setLoading(false)
      })
      .catch(err => {
        setError('Impossible de charger les données. Vérifiez que le backend est lancé.')
        setLoading(false)
      })
  }, [])

  const totalFunds = overview
    ? Object.values(overview.funds_by_type).reduce((a, b) => a + b, 0)
    : 0

  const formatBillions = (n: number) => {
    if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)} Md€`
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(0)} M€`
    return `${n.toLocaleString('fr-FR')} €`
  }

  return (
    <div>
      {/* Hero */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500 mt-1">
          Vue d'ensemble du marché des fonds immobiliers retail français
        </p>
      </div>

      {/* Loading / Error */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-red-700">
          <p className="font-medium">Erreur de connexion</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      )}

      {/* Stats */}
      {overview && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard
              label="Fonds référencés"
              value={totalFunds.toString()}
              sublabel={`${overview.funds_by_type['SCPI'] || 0} SCPI · ${overview.funds_by_type['OPCI'] || 0} OPCI · ${overview.funds_by_type['SCI'] || 0} SCI`}
              tooltip="Nombre total de véhicules immobiliers retail dans notre base"
            />
            <StatCard
              label="Capitalisation totale"
              value={formatBillions(overview.total_market_capitalization)}
              sublabel="Ensemble des fonds"
              tooltip="Somme des capitalisations de tous les fonds actifs"
            />
            <StatCard
              label="Taux de distribution moyen"
              value={`${overview.average_distribution_rate}%`}
              sublabel="TD pondéré"
              tooltip="Le taux de distribution (TD) mesure le rendement annuel distribué aux associés. Il remplace l'ancien TDVM depuis 2022."
            />
            <StatCard
              label="Base de données"
              value="Live"
              sublabel="Mise à jour continue"
            />
          </div>

          {/* Sections à venir */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h2 className="font-semibold text-slate-900 mb-4">🏢 Top SCPI par rendement</h2>
              <p className="text-sm text-slate-400">Module disponible prochainement — Jour 6</p>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h2 className="font-semibold text-slate-900 mb-4">🗺️ Carte du patrimoine</h2>
              <p className="text-sm text-slate-400">Module disponible prochainement — Jour 9</p>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h2 className="font-semibold text-slate-900 mb-4">📊 Données de marché</h2>
              <p className="text-sm text-slate-400">Module disponible prochainement — Jour 8</p>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h2 className="font-semibold text-slate-900 mb-4">⚠️ Scoring de risque</h2>
              <p className="text-sm text-slate-400">Module disponible prochainement — Jour 12</p>
            </div>
          </div>

          {/* Pédagogie - cible étudiants */}
          <div className="mt-8 bg-primary-50 border border-primary-200 rounded-xl p-6">
            <h2 className="font-semibold text-primary-900 mb-2">📚 Comprendre les métriques</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-primary-800">
              <div>
                <p className="font-medium">TD — Taux de Distribution</p>
                <p className="text-primary-600 mt-1">
                  Dividende brut / prix de part au 1er janvier. Remplace le TDVM depuis 2022. Un TD de 5% signifie que pour 1000€ investis, vous recevez 50€ de revenus annuels.
                </p>
              </div>
              <div>
                <p className="font-medium">TOF — Taux d'Occupation Financier</p>
                <p className="text-primary-600 mt-1">
                  Loyers facturés / loyers théoriques si 100% occupé. Un TOF &gt; 90% est considéré comme bon. En dessous de 85%, vigilance.
                </p>
              </div>
              <div>
                <p className="font-medium">RAN — Report à Nouveau</p>
                <p className="text-primary-600 mt-1">
                  Réserve de bénéfices non distribués. Exprimé en jours de distribution, c'est un matelas de sécurité. &gt; 30 jours = confortable.
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
