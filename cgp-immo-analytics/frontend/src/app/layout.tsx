import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'CGP Immo Analytics — Analyse IA de fonds immobiliers pour CGP',
  description: 'Analysez, comparez et sélectionnez les meilleurs fonds immobiliers (SCPI, OPCI, SCI) pour vos clients. Scoring IA propriétaire, données AMF vérifiées, conformité DDA intégrée.',
  keywords: 'SCPI, OPCI, SCI, CGP, gestion de patrimoine, analyse fonds immobiliers, scoring IA, AMF, DDA, MIF2',
  openGraph: {
    title: 'CGP Immo Analytics — L\'IA au service du conseil patrimonial',
    description: 'La plateforme de référence pour l\'analyse de fonds immobiliers. Scoring IA, données réglementaires, conformité DDA.',
    locale: 'fr_FR',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="min-h-screen font-sans antialiased">
        {children}
      </body>
    </html>
  )
}
