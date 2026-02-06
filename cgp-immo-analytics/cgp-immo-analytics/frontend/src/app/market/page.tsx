'use client'

export default function MarketPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-4">Données de marché</h1>
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
        <div className="text-6xl mb-4">📊</div>
        <h2 className="text-xl font-semibold text-slate-700 mb-2">Market Data — Jour 8</h2>
        <p className="text-slate-500 max-w-md mx-auto">
          Données de marché JLL, CBRE, BNP RE : taux de capitalisation, 
          loyers prime, taux de vacance par segment et géographie. 
          Croisement avec les données des fonds.
        </p>
      </div>
    </div>
  )
}
