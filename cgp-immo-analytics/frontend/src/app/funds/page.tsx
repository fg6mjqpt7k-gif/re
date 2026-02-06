'use client'

import { useEffect, useState } from 'react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface Fund {
  id: string
  name: string
  fund_type: string
  category: string | null
  share_price: number | null
  distribution_rate: number | null
  occupancy_rate: number | null
  market_capitalization: number | null
  debt_ratio: number | null
  esg_label: boolean
  management_company: { name: string; short_name: string | null } | null
}

interface FundsResponse {
  items: Fund[]
  total: number
  page: number
  page_size: number
  total_pages: number
}

const CATEGORIES: Record<string, string> = {
  diversifiee: 'Diversifiée',
  bureaux: 'Bureaux',
  commerces: 'Commerces',
  logistique: 'Logistique',
  sante: 'Santé',
  residentiel: 'Résidentiel',
  hotels: 'Hôtels',
  education: 'Éducation',
  mixte: 'Mixte',
}

export default function FundsPage() {
  const [data, setData] = useState<FundsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [fundType, setFundType] = useState('')
  const [sortBy, setSortBy] = useState('name')
  const [sortOrder, setSortOrder] = useState('asc')

  const fetchFunds = () => {
    setLoading(true)
    const params = new URLSearchParams({
      page: page.toString(),
      page_size: '20',
      sort_by: sortBy,
      sort_order: sortOrder,
    })
    if (search) params.set('search', search)
    if (fundType) params.set('fund_type', fundType)

    fetch(`${API_URL}/api/funds/?${params}`)
      .then(res => res.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }

  useEffect(() => { fetchFunds() }, [page, fundType, sortBy, sortOrder])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    fetchFunds()
  }

  const toggleSort = (col: string) => {
    if (sortBy === col) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(col)
      setSortOrder('desc')
    }
  }

  const formatM = (n: number | null) => {
    if (!n) return '—'
    if (n >= 1e9) return `${(n / 1e9).toFixed(1)} Md€`
    if (n >= 1e6) return `${(n / 1e6).toFixed(0)} M€`
    return `${n.toLocaleString('fr-FR')} €`
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Fonds immobiliers</h1>
          <p className="text-slate-500 text-sm mt-1">
            {data ? `${data.total} fonds référencés` : 'Chargement...'}
          </p>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6 flex flex-wrap gap-4 items-center">
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            placeholder="Rechercher un fonds..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
          <button type="submit" className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-primary-700 transition">
            Rechercher
          </button>
        </form>

        <select
          value={fundType}
          onChange={e => { setFundType(e.target.value); setPage(1) }}
          className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="">Tous les types</option>
          <option value="SCPI">SCPI</option>
          <option value="OPCI">OPCI</option>
          <option value="SCI">SCI</option>
        </select>
      </div>

      {/* Tableau */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-slate-600 cursor-pointer hover:text-primary-600"
                    onClick={() => toggleSort('name')}>
                  Fonds {sortBy === 'name' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
                </th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Type</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Catégorie</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Société</th>
                <th className="text-right px-4 py-3 font-medium text-slate-600">Prix part</th>
                <th className="text-right px-4 py-3 font-medium text-slate-600 cursor-pointer hover:text-primary-600"
                    onClick={() => toggleSort('distribution_rate')}>
                  TD {sortBy === 'distribution_rate' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
                </th>
                <th className="text-right px-4 py-3 font-medium text-slate-600 cursor-pointer hover:text-primary-600"
                    onClick={() => toggleSort('occupancy_rate')}>
                  TOF {sortBy === 'occupancy_rate' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
                </th>
                <th className="text-right px-4 py-3 font-medium text-slate-600 cursor-pointer hover:text-primary-600"
                    onClick={() => toggleSort('market_capitalization')}>
                  Capitalisation {sortBy === 'market_capitalization' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
                </th>
                <th className="text-right px-4 py-3 font-medium text-slate-600">Dette</th>
                <th className="text-center px-4 py-3 font-medium text-slate-600">ESG</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={10} className="text-center py-12 text-slate-400">Chargement...</td></tr>
              ) : data?.items.length === 0 ? (
                <tr><td colSpan={10} className="text-center py-12 text-slate-400">Aucun fonds trouvé</td></tr>
              ) : data?.items.map(fund => (
                <tr key={fund.id} className="border-b border-slate-100 hover:bg-slate-50 transition cursor-pointer">
                  <td className="px-4 py-3 font-medium text-slate-900">{fund.name}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      fund.fund_type === 'SCPI' ? 'bg-blue-100 text-blue-700' :
                      fund.fund_type === 'OPCI' ? 'bg-purple-100 text-purple-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {fund.fund_type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{fund.category ? CATEGORIES[fund.category] || fund.category : '—'}</td>
                  <td className="px-4 py-3 text-slate-600">{fund.management_company?.short_name || fund.management_company?.name || '—'}</td>
                  <td className="px-4 py-3 text-right text-slate-900">{fund.share_price ? `${fund.share_price.toLocaleString('fr-FR')} €` : '—'}</td>
                  <td className="px-4 py-3 text-right">
                    {fund.distribution_rate ? (
                      <span className={fund.distribution_rate >= 5 ? 'text-green-600 font-medium' : 'text-slate-900'}>
                        {fund.distribution_rate}%
                      </span>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {fund.occupancy_rate ? (
                      <span className={fund.occupancy_rate < 90 ? 'text-orange-600' : 'text-slate-900'}>
                        {fund.occupancy_rate}%
                      </span>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-3 text-right text-slate-900">{formatM(fund.market_capitalization)}</td>
                  <td className="px-4 py-3 text-right">
                    {fund.debt_ratio ? (
                      <span className={fund.debt_ratio > 25 ? 'text-red-600' : 'text-slate-900'}>
                        {fund.debt_ratio}%
                      </span>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-3 text-center">{fund.esg_label ? '🌱' : ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data && data.total_pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 bg-slate-50">
            <p className="text-sm text-slate-500">
              Page {data.page} sur {data.total_pages} ({data.total} fonds)
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 text-sm border rounded-lg disabled:opacity-50 hover:bg-white transition"
              >
                Précédent
              </button>
              <button
                onClick={() => setPage(p => Math.min(data.total_pages, p + 1))}
                disabled={page === data.total_pages}
                className="px-3 py-1 text-sm border rounded-lg disabled:opacity-50 hover:bg-white transition"
              >
                Suivant
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
