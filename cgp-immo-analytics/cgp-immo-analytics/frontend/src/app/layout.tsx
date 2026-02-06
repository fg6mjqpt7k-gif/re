import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'CGP Immo Analytics',
  description: 'Plateforme d\'analyse de fonds immobiliers retail pour CGP',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body className="min-h-screen bg-slate-50">
        <nav className="bg-white border-b border-slate-200 px-6 py-3">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">IA</span>
              </div>
              <span className="font-semibold text-lg text-slate-900">CGP Immo Analytics</span>
              <span className="text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full ml-2">Beta</span>
            </div>
            <div className="flex items-center gap-6 text-sm">
              <a href="/" className="text-slate-600 hover:text-primary-600 transition">Dashboard</a>
              <a href="/funds" className="text-slate-600 hover:text-primary-600 transition">Fonds</a>
              <a href="/map" className="text-slate-600 hover:text-primary-600 transition">Carte</a>
              <a href="/market" className="text-slate-600 hover:text-primary-600 transition">Marché</a>
            </div>
          </div>
        </nav>
        <main className="max-w-7xl mx-auto px-6 py-8">
          {children}
        </main>
      </body>
    </html>
  )
}
