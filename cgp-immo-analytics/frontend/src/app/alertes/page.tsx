'use client'

import { useState } from 'react'
import AppShell from '../../components/AppShell'
import { SCPI_DATA } from '../../lib/data'

interface Alerte {
  id: string
  scpiId: string
  scpiNom: string
  type: 'prix' | 'dividende' | 'tof' | 'score'
  seuil: number | null
  active: boolean
}

const FAKE_HISTORY = [
  { date: '2025-01-15', scpi: 'Transitions Europe', type: 'dividende', message: 'Dividende T4 2024 verse : 4,08 EUR/part (TD annualise 8,16%)' },
  { date: '2025-01-10', scpi: 'Corum Origin', type: 'prix', message: 'Prix de part stable a 1 135,00 EUR (pas de revalorisation)' },
  { date: '2024-12-20', scpi: 'Iroko Zen', type: 'dividende', message: 'Dividende T4 2024 verse : 3,56 EUR/part (TD annualise 7,12%)' },
  { date: '2024-12-15', scpi: 'PFO2', type: 'tof', message: 'TOF passe sous 93% : 92,1% au T4 2024. Attention a la vacance locative.' },
  { date: '2024-12-01', scpi: 'Remake Live', type: 'prix', message: 'Prix de part maintenu a 204,00 EUR. Valeur de reconstitution : 213,68 EUR (+4,7%)' },
  { date: '2024-11-15', scpi: 'Novaxia Neo', type: 'dividende', message: 'Dividende T3 2024 verse : 3,04 EUR/part. Rendement en legere hausse.' },
]

const TYPE_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  prix: { label: 'Prix de part', color: '#2563EB', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
  dividende: { label: 'Dividende', color: '#10B981', icon: 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z' },
  tof: { label: 'TOF', color: '#F59E0B', icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6' },
  score: { label: 'Score Alpha', color: '#6366F1', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
}

export default function AlertesPage() {
  const [alertes, setAlertes] = useState<Alerte[]>(() =>
    SCPI_DATA.slice(0, 4).flatMap(s => [
      { id: `${s.id}-prix`, scpiId: s.id, scpiNom: s.nom, type: 'prix' as const, seuil: 5, active: true },
      { id: `${s.id}-div`, scpiId: s.id, scpiNom: s.nom, type: 'dividende' as const, seuil: null, active: true },
      { id: `${s.id}-tof`, scpiId: s.id, scpiNom: s.nom, type: 'tof' as const, seuil: 90, active: false },
    ])
  )
  const [email, setEmail] = useState('cgp@example.com')
  const [saved, setSaved] = useState(false)
  const [newScpi, setNewScpi] = useState('')
  const [newType, setNewType] = useState<'prix' | 'dividende' | 'tof' | 'score'>('prix')

  const toggleAlerte = (id: string) => {
    setAlertes(prev => prev.map(a => a.id === id ? { ...a, active: !a.active } : a))
    setSaved(false)
  }

  const removeAlerte = (id: string) => {
    setAlertes(prev => prev.filter(a => a.id !== id))
    setSaved(false)
  }

  const addAlerte = () => {
    const scpi = SCPI_DATA.find(s => s.id === newScpi)
    if (!scpi) return
    const id = `${scpi.id}-${newType}-${Date.now()}`
    setAlertes(prev => [...prev, {
      id, scpiId: scpi.id, scpiNom: scpi.nom, type: newType,
      seuil: newType === 'prix' ? 5 : newType === 'tof' ? 90 : null,
      active: true,
    }])
    setSaved(false)
  }

  const handleSave = () => { setSaved(true); setTimeout(() => setSaved(false), 3000) }

  const activeCount = alertes.filter(a => a.active).length

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[#F1F5F9]">Alertes & Notifications</h1>
          <p className="text-[#94A3B8] text-sm mt-1">
            Configurez vos alertes pour etre informe en temps reel des mouvements de vos SCPI.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="glass-card p-4">
            <p className="text-[10px] uppercase tracking-wider text-[#475569]">Alertes actives</p>
            <p className="text-2xl font-bold font-mono text-[#2563EB]">{activeCount}</p>
          </div>
          <div className="glass-card p-4">
            <p className="text-[10px] uppercase tracking-wider text-[#475569]">SCPI suivies</p>
            <p className="text-2xl font-bold font-mono text-[#F1F5F9]">{new Set(alertes.map(a => a.scpiId)).size}</p>
          </div>
          <div className="glass-card p-4">
            <p className="text-[10px] uppercase tracking-wider text-[#475569]">Alertes declenchees (30j)</p>
            <p className="text-2xl font-bold font-mono text-[#F59E0B]">6</p>
          </div>
          <div className="glass-card p-4">
            <p className="text-[10px] uppercase tracking-wider text-[#475569]">Prochaine echeance</p>
            <p className="text-lg font-bold font-mono text-[#10B981]">T1 2025</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Left: Alert config */}
          <div className="lg:col-span-3 space-y-6">
            {/* Add alert */}
            <div className="glass-card p-5">
              <h2 className="text-sm font-semibold text-[#F1F5F9] mb-4">Ajouter une alerte</h2>
              <div className="flex flex-wrap gap-3">
                <select value={newScpi} onChange={e => setNewScpi(e.target.value)} className="sim-select flex-1 min-w-[180px]">
                  <option value="">Choisir une SCPI...</option>
                  {SCPI_DATA.map(s => <option key={s.id} value={s.id}>{s.nom}</option>)}
                </select>
                <select value={newType} onChange={e => setNewType(e.target.value as typeof newType)} className="sim-select">
                  <option value="prix">Prix de part</option>
                  <option value="dividende">Dividende</option>
                  <option value="tof">TOF</option>
                  <option value="score">Score Alpha</option>
                </select>
                <button onClick={addAlerte} disabled={!newScpi} className="px-4 py-2 bg-[#2563EB] text-white text-sm font-medium rounded-lg hover:bg-[#3B82F6] transition disabled:opacity-40">
                  + Ajouter
                </button>
              </div>
            </div>

            {/* Alert list */}
            <div className="glass-card overflow-hidden">
              <div className="px-5 py-3 border-b border-white/[0.06] flex items-center justify-between">
                <h2 className="text-sm font-semibold text-[#F1F5F9]">Mes alertes ({alertes.length})</h2>
                <button onClick={handleSave} className={`px-3 py-1.5 text-xs font-medium rounded-lg transition ${saved ? 'bg-[#10B981]/20 text-[#10B981]' : 'bg-[#2563EB] text-white hover:bg-[#3B82F6]'}`}>
                  {saved ? 'Sauvegarde !' : 'Sauvegarder'}
                </button>
              </div>

              <div className="divide-y divide-white/[0.06]">
                {alertes.length === 0 ? (
                  <div className="px-5 py-8 text-center text-[#475569] text-sm">Aucune alerte configuree</div>
                ) : alertes.map(a => {
                  const cfg = TYPE_CONFIG[a.type]
                  return (
                    <div key={a.id} className="px-5 py-3 flex items-center gap-4 hover:bg-white/[0.02] transition">
                      <svg className="w-5 h-5 shrink-0" style={{ color: cfg.color }} fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d={cfg.icon} />
                      </svg>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-[#F1F5F9]">{a.scpiNom}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ background: `${cfg.color}15`, color: cfg.color }}>
                            {cfg.label}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#475569]">
                          {a.type === 'prix' && `Variation > ${a.seuil}%`}
                          {a.type === 'dividende' && 'Chaque versement trimestriel'}
                          {a.type === 'tof' && `TOF < ${a.seuil}%`}
                          {a.type === 'score' && 'Changement significatif du score'}
                        </p>
                      </div>
                      {/* Toggle */}
                      <button onClick={() => toggleAlerte(a.id)} className={`w-10 h-6 rounded-full transition-colors relative ${a.active ? 'bg-[#2563EB]' : 'bg-white/10'}`}>
                        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${a.active ? 'left-5' : 'left-1'}`} />
                      </button>
                      <button onClick={() => removeAlerte(a.id)} className="p-1 text-[#475569] hover:text-[#EF4444] transition">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Email config */}
            <div className="glass-card p-5">
              <h2 className="text-sm font-semibold text-[#F1F5F9] mb-3">Notifications par email</h2>
              <div className="flex gap-3">
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="sim-input flex-1" placeholder="votre@email.com" />
                <button onClick={handleSave} className="px-4 py-2 bg-[#2563EB] text-white text-sm font-medium rounded-lg hover:bg-[#3B82F6] transition">
                  Mettre a jour
                </button>
              </div>
              <p className="text-[11px] text-[#475569] mt-2">Vous recevrez un email a chaque alerte declenchee.</p>
            </div>
          </div>

          {/* Right: Recent alerts */}
          <div className="lg:col-span-2">
            <div className="glass-card overflow-hidden sticky top-24">
              <div className="px-5 py-3 border-b border-white/[0.06]">
                <h2 className="text-sm font-semibold text-[#F1F5F9]">Dernieres alertes</h2>
              </div>
              <div className="divide-y divide-white/[0.06]">
                {FAKE_HISTORY.map((h, i) => {
                  const cfg = TYPE_CONFIG[h.type]
                  return (
                    <div key={i} className="px-5 py-3">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cfg.color }} />
                        <span className="text-xs font-medium text-[#F1F5F9]">{h.scpi}</span>
                        <span className="text-[10px] text-[#475569] ml-auto">{h.date}</span>
                      </div>
                      <p className="text-[11px] text-[#94A3B8] leading-relaxed">{h.message}</p>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
