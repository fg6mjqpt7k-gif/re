'use client'

export default function MapPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-4">Carte du patrimoine</h1>
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
        <div className="text-6xl mb-4">🗺️</div>
        <h2 className="text-xl font-semibold text-slate-700 mb-2">Carte interactive — Jour 9-10</h2>
        <p className="text-slate-500 max-w-md mx-auto">
          Visualisez l'ensemble des actifs immobiliers détenus par les fonds, 
          géolocalisés sur une carte Leaflet interactive avec filtres par type, 
          fonds et géographie.
        </p>
      </div>
    </div>
  )
}
