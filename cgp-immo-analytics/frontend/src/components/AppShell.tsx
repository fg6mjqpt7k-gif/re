'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_ITEMS = [
  { href: '/funds', label: 'Fonds', icon: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z', desc: 'Score Alpha & listing' },
  { href: '/simulateur', label: 'Simulateur', icon: 'M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z', desc: 'Revenus & TRI' },
  { href: '/comparateur', label: 'Comparateur', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z', desc: 'Radar chart' },
  { href: '/alternatives', label: 'Alternatives', icon: 'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4', desc: 'SCPI vs ETF & autres' },
  { href: '/carte', label: 'Carte', icon: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z', desc: 'Patrimoine immobilier' },
  { href: '/portefeuille', label: 'Portefeuille', icon: 'M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z', desc: 'Suivi & alertes' },
  { href: '/communaute', label: 'Communaute', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z', desc: 'Avis verifies' },
  { href: '/recommandation', label: 'IA Conseil', icon: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z', desc: 'Recommandation IA' },
]

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:sticky top-0 left-0 z-50 h-screen w-64 bg-[#0a0f1e] border-r border-white/[0.06] flex flex-col transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {/* Logo */}
        <div className="h-16 flex items-center gap-3 px-5 border-b border-white/[0.06] shrink-0">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#2563EB] rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xs font-mono">IA</span>
            </div>
            <span className="font-semibold text-base text-[#F1F5F9]">CGP Immo</span>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {NAV_ITEMS.map(item => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all group ${
                  isActive
                    ? 'bg-[#2563EB]/10 text-[#60a5fa] font-medium'
                    : 'text-[#94A3B8] hover:bg-white/[0.04] hover:text-[#F1F5F9]'
                }`}
              >
                <svg className={`w-5 h-5 shrink-0 ${isActive ? 'text-[#2563EB]' : 'text-[#475569] group-hover:text-[#94A3B8]'}`} fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                </svg>
                <div>
                  <div>{item.label}</div>
                  <div className={`text-[10px] ${isActive ? 'text-[#60a5fa]/60' : 'text-[#475569]'}`}>{item.desc}</div>
                </div>
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-white/[0.06] shrink-0">
          <div className="flex items-center gap-2 text-[11px] text-[#475569]">
            <div className="w-2 h-2 rounded-full bg-[#10B981]" />
            Donnees a jour
          </div>
          <div className="text-[10px] text-[#475569]/60 mt-1">API ASPIM v2 — Fev. 2025</div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 min-w-0">
        {/* Top bar */}
        <header className="h-16 border-b border-white/[0.06] bg-[#0B1120]/80 backdrop-blur-xl sticky top-0 z-30 flex items-center justify-between px-6">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 -ml-2 text-[#94A3B8] hover:text-[#F1F5F9]"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </button>

          <div className="hidden lg:block" />

          <div className="flex items-center gap-4">
            <Link href="/alertes" className="relative p-2 text-[#94A3B8] hover:text-[#F1F5F9] transition">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
              </svg>
              <span className="absolute top-1 right-1 w-2 h-2 bg-[#EF4444] rounded-full" />
            </Link>
            <div className="w-8 h-8 rounded-full bg-[#2563EB]/20 flex items-center justify-center text-xs font-semibold text-[#60a5fa]">
              CGP
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
