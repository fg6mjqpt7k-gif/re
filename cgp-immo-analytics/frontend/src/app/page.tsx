'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'

/* ================================================================
   HOOKS
   ================================================================ */

function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible')
          entry.target.querySelectorAll('.reveal').forEach((child) => child.classList.add('visible'))
        }
      }),
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    )
    observer.observe(el)
    el.querySelectorAll('.reveal').forEach((child) => observer.observe(child))
    return () => observer.disconnect()
  }, [])
  return ref
}

function useCountUp(end: number, decimals = 0) {
  const [value, setValue] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const hasAnimated = useRef(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true
          const startTime = performance.now()
          const animate = (currentTime: number) => {
            const progress = Math.min((currentTime - startTime) / 1500, 1)
            const eased = 1 - Math.pow(1 - progress, 3)
            setValue(Number((eased * end).toFixed(decimals)))
            if (progress < 1) requestAnimationFrame(animate)
          }
          requestAnimationFrame(animate)
        }
      },
      { threshold: 0.5 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [end, decimals])
  return { ref, value }
}

function useNavbarScroll() {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', h, { passive: true })
    return () => window.removeEventListener('scroll', h)
  }, [])
  return scrolled
}

/* ================================================================
   DATA
   ================================================================ */

const FEATURES_10 = [
  {
    num: '01',
    title: 'Simulateur de revenus net mensuel',
    desc: 'Saisissez un montant, votre TMI, et visualisez instantanement le revenu net apres fiscalite. Projection sur 5/10/20 ans.',
    href: '/simulateur',
    color: '#2563EB',
    icon: 'M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z',
  },
  {
    num: '02',
    title: 'Score Alpha SCPI',
    desc: 'Score composite transparent sur 6 axes : rendement, risque, frais, liquidite, diversification, ESG. Simplifie massivement le choix.',
    href: '/funds',
    color: '#6366F1',
    icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
  },
  {
    num: '03',
    title: 'Alertes prix & rendement',
    desc: 'Notification push/email quand une SCPI revalorise sa part ou verse un dividende. Veille proactive en temps reel.',
    href: '/alertes',
    color: '#EF4444',
    icon: 'M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0',
  },
  {
    num: '04',
    title: 'Comparateur radar visuel',
    desc: 'Graphique radar superposant 2-4 SCPI sur 6 axes. Beaucoup plus lisible qu\'un tableau de chiffres.',
    href: '/comparateur',
    color: '#10B981',
    icon: 'M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z',
  },
  {
    num: '05',
    title: 'SCPI vs Alternatives',
    desc: 'Comparez une SCPI a un ETF immobilier, ETF actions, fonds euros ou locatif direct avec les memes parametres.',
    href: '/alternatives',
    color: '#F59E0B',
    icon: 'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4',
  },
  {
    num: '06',
    title: 'Carte interactive du patrimoine',
    desc: 'Tous les immeubles detenus par chaque SCPI, cliquables avec details : loyers, locataires, surface.',
    href: '/carte',
    color: '#EC4899',
    icon: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z',
  },
  {
    num: '07',
    title: 'Portefeuille multi-SCPI',
    desc: 'Saisissez vos parts et suivez en temps reel : rendement pondere, revenus, diversification, alertes de concentration.',
    href: '/portefeuille',
    color: '#8B5CF6',
    icon: 'M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z',
  },
  {
    num: '08',
    title: 'Donnees quasi temps reel',
    desc: 'Scraping intelligent des bulletins trimestriels + flux ASPIM. Premier a publier les chiffres chaque trimestre.',
    href: '/funds',
    color: '#14B8A6',
    icon: 'M13 10V3L4 14h7v7l9-11h-7z',
  },
  {
    num: '09',
    title: 'Avis communautaires verifies',
    desc: 'Le Trustpilot des SCPI : vrais detenteurs de parts notent et commentent chaque SCPI. Dimension sociale inedite.',
    href: '/communaute',
    color: '#F97316',
    icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',
  },
  {
    num: '10',
    title: 'Recommandation IA personnalisee',
    desc: 'Un wizard intelligent pose 5-6 questions et genere une allocation SCPI optimisee avec justification detaillee.',
    href: '/recommandation',
    color: '#C9A84C',
    icon: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z',
  },
]

const FUNDS_PREVIEW = [
  { name: 'Transitions Europe', td: 8.16, score: 78, trend: '+0.00' },
  { name: 'Remake Live', td: 7.79, score: 82, trend: '+0.15' },
  { name: 'Iroko Zen', td: 7.12, score: 85, trend: '+0.08' },
  { name: 'Novaxia Neo', td: 6.51, score: 77, trend: '+0.18' },
  { name: 'Corum Origin', td: 6.06, score: 80, trend: '-0.20' },
]

const TESTIMONIALS = [
  { quote: 'Cet outil a transforme ma pratique. Je gagne 3h/semaine sur mes analyses et mes clients apprecient la qualite des preconisations.', name: 'Marie D.', title: 'CGPI independante, Paris' },
  { quote: 'Le Score Alpha est bluffant. Le radar chart a remplace mes tableaux Excel pour presenter les SCPI en clientele.', name: 'Thomas R.', title: 'Directeur associe, Cabinet GP, Lyon' },
  { quote: 'La recommandation IA m\'a fait decouvrir des SCPI que je n\'aurais jamais selectionnees. Mes clients adorent le parcours interactif.', name: 'Sophie L.', title: 'CIF, Bordeaux' },
]

/* ================================================================
   COMPONENTS
   ================================================================ */

function Navbar() {
  const scrolled = useNavbarScroll()
  return (
    <nav className={`navbar-frosted fixed top-0 left-0 right-0 z-50 h-16 ${scrolled ? 'scrolled' : ''}`}>
      <div className="max-w-[1280px] mx-auto px-6 h-full flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xs font-mono">IA</span>
          </div>
          <span className="font-semibold text-lg text-t-primary">CGP Immo Analytics</span>
        </div>
        <div className="hidden lg:flex items-center gap-6 text-sm text-t-secondary">
          <a href="#fonctionnalites" className="hover:text-t-primary transition">10 Fonctionnalites</a>
          <a href="#fonds" className="hover:text-t-primary transition">Fonds</a>
          <a href="#tarifs" className="hover:text-t-primary transition">Tarifs</a>
          <Link href="/recommandation" className="hover:text-t-primary transition">IA Conseil</Link>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/funds" className="btn-ghost text-sm !py-2 !px-4 hidden sm:inline-block">Se connecter</Link>
          <Link href="/funds" className="btn-primary text-sm !py-2 !px-4">Essai gratuit</Link>
        </div>
      </div>
    </nav>
  )
}

function Hero() {
  const ref = useScrollReveal()
  return (
    <section className="relative min-h-screen flex items-center justify-center dot-grid pt-16" ref={ref}>
      <div className="hero-glow" />
      <div className="relative z-10 max-w-[1280px] mx-auto px-6 text-center py-20">
        <div className="reveal inline-flex items-center shimmer-badge rounded-full px-4 py-1.5 text-sm text-compliance mb-8">
          10 outils exclusifs propulses par l&apos;IA
        </div>
        <h1 className="reveal text-4xl sm:text-5xl lg:text-[56px] font-bold leading-tight tracking-[-0.02em] text-t-primary max-w-4xl mx-auto">
          La plateforme SCPI <span className="text-accent">tout-en-un</span> pour les CGP
        </h1>
        <p className="reveal text-lg sm:text-xl text-t-secondary max-w-2xl mx-auto mt-6 leading-relaxed">
          Simulateur fiscal, Score Alpha, comparateur radar, carte interactive, recommandation IA, avis communautaires — tout ce qui manque aux outils existants.
        </p>
        <div className="reveal flex flex-col sm:flex-row items-center justify-center gap-4 mt-10">
          <Link href="/recommandation" className="btn-primary text-base">
            Obtenir ma recommandation IA
          </Link>
          <Link href="/funds" className="btn-ghost text-base flex items-center gap-2">
            Explorer les fonds
          </Link>
        </div>
        <p className="reveal text-sm text-t-tertiary mt-6">
          Sans engagement · Gratuit pour les etudiants CGP · Donnees ASPIM verifiees
        </p>
      </div>
    </section>
  )
}

function MetricsBar() {
  const m1 = useCountUp(850)
  const m2 = useCountUp(75)
  const m3 = useCountUp(2500)
  const m4 = useCountUp(97.3, 1)
  const metrics = [
    { ref: m1.ref, value: `${m1.value}+`, label: 'Fonds analyses' },
    { ref: m2.ref, value: `${m2.value} Md\u20AC`, label: 'Capitalisation couverte' },
    { ref: m3.ref, value: `${m3.value}+`, label: 'CGP utilisateurs' },
    { ref: null, value: '10', label: 'Outils exclusifs' },
    { ref: m4.ref, value: `${m4.value}%`, label: 'Satisfaction' },
  ]
  return (
    <section className="relative bg-bg-surface border-y border-white/[0.06] py-12">
      <div className="max-w-[1280px] mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 text-center">
          {metrics.map((m, i) => (
            <div key={i} className="flex flex-col items-center">
              <span ref={m.ref} className="font-mono text-3xl sm:text-4xl font-semibold text-t-primary tabular-nums">{m.value}</span>
              <span className="text-xs uppercase tracking-widest text-t-tertiary mt-2">{m.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function Features10() {
  const ref = useScrollReveal()
  return (
    <section id="fonctionnalites" className="py-24" ref={ref}>
      <div className="max-w-[1280px] mx-auto px-6">
        <div className="text-center mb-16">
          <p className="reveal text-xs uppercase tracking-widest text-accent font-semibold mb-3">Ce qui nous differencie</p>
          <h2 className="reveal text-3xl sm:text-4xl font-bold text-t-primary">10 fonctionnalites que personne d&apos;autre ne propose</h2>
          <p className="reveal text-t-secondary mt-4 max-w-2xl mx-auto">Chaque outil a ete concu pour combler un manque identifie chez les plateformes existantes (scpi-hub, louve invest, france-scpi).</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 reveal-stagger">
          {FEATURES_10.map((f, i) => (
            <Link key={i} href={f.href} className={`reveal glass-card p-6 group cursor-pointer hover:border-white/[0.12] transition-all ${i === 0 ? 'md:col-span-2 lg:col-span-2 lg:row-span-2 p-8' : ''}`}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${f.color}15` }}>
                  <svg className="w-5 h-5" style={{ color: f.color }} fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d={f.icon} />
                  </svg>
                </div>
                <span className="font-mono text-xs font-semibold" style={{ color: f.color }}>{f.num}</span>
              </div>
              <h3 className={`font-semibold text-t-primary mb-2 group-hover:text-accent transition ${i === 0 ? 'text-2xl' : 'text-base'}`}>{f.title}</h3>
              <p className={`text-t-secondary leading-relaxed ${i === 0 ? 'text-base max-w-lg' : 'text-sm'}`}>{f.desc}</p>
              <span className="inline-flex items-center gap-1 text-xs font-medium mt-3 group-hover:gap-2 transition-all" style={{ color: f.color }}>
                Decouvrir <span>&rarr;</span>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

function FundShowcase() {
  const ref = useScrollReveal()
  return (
    <section id="fonds" className="py-24 bg-bg-surface" ref={ref}>
      <div className="max-w-[1280px] mx-auto px-6">
        <div className="text-center mb-16">
          <p className="reveal text-xs uppercase tracking-widest text-accent font-semibold mb-3">Score Alpha en temps reel</p>
          <h2 className="reveal text-3xl sm:text-4xl font-bold text-t-primary">Top SCPI par Score Alpha</h2>
        </div>
        <div className="reveal glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="fund-table">
              <thead>
                <tr>
                  <th>Rang</th>
                  <th>SCPI</th>
                  <th>TD 2024</th>
                  <th>Variation</th>
                  <th>Score Alpha</th>
                </tr>
              </thead>
              <tbody>
                {FUNDS_PREVIEW.map((f, i) => (
                  <tr key={i}>
                    <td className="font-mono text-t-tertiary">{i + 1}</td>
                    <td className="font-medium text-t-primary">{f.name}</td>
                    <td className="font-mono tabular-nums text-success">{f.td.toFixed(2)}%</td>
                    <td className={`font-mono tabular-nums text-sm ${f.trend.startsWith('+') ? 'text-success' : 'text-danger'}`}>{f.trend}%</td>
                    <td>
                      <span className={`score-pill ${f.score >= 80 ? 'score-excellent' : f.score >= 65 ? 'score-good' : 'score-average'}`}>{f.score}/100</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="mt-6 flex items-center justify-between">
          <p className="text-xs text-t-tertiary">Donnees au 31/12/2024. Les performances passees ne prejugent pas des performances futures.</p>
          <Link href="/funds" className="text-sm text-accent font-medium hover:underline flex items-center gap-1">Explorer les 850+ fonds <span>&rarr;</span></Link>
        </div>
      </div>
    </section>
  )
}

function HowItWorks() {
  const ref = useScrollReveal()
  const steps = [
    { num: '01', title: 'Explorez', desc: 'Parcourez 850+ fonds avec Score Alpha, filtres avances et carte interactive du patrimoine.' },
    { num: '02', title: 'Simulez', desc: 'Calculez le revenu net reel apres fiscalite. Comparez avec ETF, fonds euros, locatif direct.' },
    { num: '03', title: 'Recommandez', desc: 'Notre IA genere une allocation SCPI optimisee en 6 questions. Export PDF pour vos clients.' },
  ]
  return (
    <section className="py-24" ref={ref}>
      <div className="max-w-[1280px] mx-auto px-6">
        <h2 className="reveal text-3xl sm:text-4xl font-bold text-t-primary text-center mb-16">3 etapes. Des decisions eclairees.</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 reveal-stagger">
          {steps.map(s => (
            <div key={s.num} className="reveal text-center md:text-left">
              <span className="font-mono text-5xl font-bold text-accent/20 block mb-4">{s.num}</span>
              <h3 className="text-xl font-semibold text-t-primary mb-3">{s.title}</h3>
              <p className="text-t-secondary leading-relaxed text-sm">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function Testimonials() {
  const ref = useScrollReveal()
  return (
    <section className="py-24 bg-bg-surface" ref={ref}>
      <div className="max-w-[1280px] mx-auto px-6">
        <h2 className="reveal text-3xl sm:text-4xl font-bold text-t-primary text-center mb-16">La confiance de milliers de conseillers</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 reveal-stagger">
          {TESTIMONIALS.map((t, i) => (
            <div key={i} className="reveal glass-card p-6">
              <div className="text-4xl text-accent/20 mb-4 leading-none">&ldquo;</div>
              <p className="text-t-secondary text-sm leading-relaxed mb-6">{t.quote}</p>
              <div>
                <p className="font-semibold text-t-primary text-sm">{t.name}</p>
                <p className="text-xs text-t-tertiary mt-0.5">{t.title}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function Pricing() {
  const ref = useScrollReveal()
  const [annual, setAnnual] = useState(false)
  const plans = [
    { name: 'Decouverte', price: 'Gratuit', desc: 'Etudiants CGP et decouverte', features: ['50 fonds', 'Score Alpha basique', 'Simulateur revenus', 'Comparateur 2 SCPI'], cta: 'Commencer', highlighted: false },
    { name: 'Professionnel', price: annual ? '79\u20AC' : '99\u20AC', period: '/mois HT', desc: 'CGP en activite', features: ['850+ fonds illimites', 'Score Alpha avance', '10 outils complets', 'Portefeuille + alertes', 'Recommandation IA', 'Export PDF DDA', 'Support prioritaire'], cta: 'Essai gratuit 14j', highlighted: true, badge: 'Populaire' },
    { name: 'Cabinet', price: 'Sur devis', desc: 'Structures multi-conseillers', features: ['Tout Pro +', 'Multi-utilisateurs', 'API integration', 'Marque blanche', 'Accompagnement dedie'], cta: 'Contacter', highlighted: false },
  ]
  return (
    <section id="tarifs" className="py-24" ref={ref}>
      <div className="max-w-[1280px] mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="reveal text-3xl sm:text-4xl font-bold text-t-primary">Tarifs adaptes a votre activite</h2>
          <div className="reveal flex items-center justify-center gap-3 mt-6">
            <span className={`text-sm ${!annual ? 'text-t-primary' : 'text-t-tertiary'}`}>Mensuel</span>
            <button onClick={() => setAnnual(!annual)} className={`relative w-12 h-6 rounded-full transition ${annual ? 'bg-accent' : 'bg-white/10'}`}>
              <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${annual ? 'left-7' : 'left-1'}`} />
            </button>
            <span className={`text-sm ${annual ? 'text-t-primary' : 'text-t-tertiary'}`}>Annuel <span className="text-success text-xs font-medium">-20%</span></span>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 reveal-stagger">
          {plans.map((p, i) => (
            <div key={i} className={`reveal glass-card p-8 flex flex-col ${p.highlighted ? 'pricing-highlight' : ''}`}>
              {p.badge && <span className="inline-flex self-start text-xs font-semibold bg-accent text-white px-3 py-1 rounded-full mb-4">{p.badge}</span>}
              <h3 className="text-xl font-semibold text-t-primary">{p.name}</h3>
              <p className="text-sm text-t-tertiary mt-1">{p.desc}</p>
              <div className="mt-6 mb-6">
                <span className="text-4xl font-bold text-t-primary font-mono">{p.price}</span>
                {p.period && <span className="text-t-tertiary text-sm">{p.period}</span>}
              </div>
              <ul className="space-y-3 mb-8 flex-grow">
                {p.features.map((f, j) => (
                  <li key={j} className="flex items-start gap-2 text-sm text-t-secondary">
                    <span className="text-success mt-0.5 shrink-0">&#10003;</span>{f}
                  </li>
                ))}
              </ul>
              <Link href="/funds" className={p.highlighted ? 'btn-primary text-center' : 'btn-ghost text-center'}>{p.cta}</Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function FinalCTA() {
  const ref = useScrollReveal()
  return (
    <section className="relative py-24 bg-bg-surface overflow-hidden" ref={ref}>
      <div className="hero-glow" />
      <div className="relative z-10 max-w-[1280px] mx-auto px-6 text-center">
        <h2 className="reveal text-3xl sm:text-4xl font-bold text-t-primary">Pret a transformer votre conseil patrimonial ?</h2>
        <p className="reveal text-t-secondary mt-4 max-w-xl mx-auto">Rejoignez les CGP qui ont deja adopte l&apos;analyse augmentee par l&apos;IA.</p>
        <div className="reveal flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
          <Link href="/recommandation" className="btn-primary text-base">Obtenir ma recommandation IA</Link>
          <Link href="/simulateur" className="btn-ghost text-base">Simuler mes revenus</Link>
        </div>
        <p className="reveal text-xs text-t-tertiary mt-4">Sans carte bancaire · Resiliation a tout moment · Support francais</p>
      </div>
    </section>
  )
}

function Footer() {
  const columns = [
    { title: 'Outils', links: [{ label: 'Simulateur revenus', href: '/simulateur' }, { label: 'Score Alpha', href: '/funds' }, { label: 'Comparateur radar', href: '/comparateur' }, { label: 'SCPI vs Alternatives', href: '/alternatives' }, { label: 'Carte patrimoine', href: '/carte' }] },
    { title: 'Plateforme', links: [{ label: 'Portefeuille', href: '/portefeuille' }, { label: 'Alertes', href: '/alertes' }, { label: 'Communaute', href: '/communaute' }, { label: 'Recommandation IA', href: '/recommandation' }, { label: 'Tous les fonds', href: '/funds' }] },
    { title: 'Ressources', links: [{ label: 'Blog', href: '#' }, { label: 'Guides CGP', href: '#' }, { label: 'FAQ', href: '#' }, { label: 'API Docs', href: '#' }] },
    { title: 'Legal', links: [{ label: 'Mentions legales', href: '#' }, { label: 'Confidentialite', href: '#' }, { label: 'CGU', href: '#' }, { label: 'RGPD', href: '#' }] },
  ]
  return (
    <footer className="border-t border-white/[0.06] pt-16 pb-8">
      <div className="max-w-[1280px] mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          {columns.map((col, i) => (
            <div key={i}>
              <h4 className="text-sm font-semibold text-t-primary mb-4">{col.title}</h4>
              <ul className="space-y-2">
                {col.links.map((l, j) => (
                  <li key={j}><Link href={l.href} className="text-sm text-t-tertiary hover:text-t-secondary transition">{l.label}</Link></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-white/[0.06] pt-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-t-tertiary">
            <span>&copy; 2025 CGP Immo Analytics · Tous droits reserves</span>
            <p className="text-[11px] text-t-tertiary/60 text-center max-w-2xl">Les informations presentees ne constituent pas un conseil en investissement. Les performances passees ne prejugent pas des performances futures.</p>
          </div>
        </div>
      </div>
    </footer>
  )
}

/* ================================================================
   MAIN
   ================================================================ */

export default function Home() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <Hero />
      <MetricsBar />
      <Features10 />
      <FundShowcase />
      <HowItWorks />
      <Testimonials />
      <Pricing />
      <FinalCTA />
      <Footer />
    </div>
  )
}
