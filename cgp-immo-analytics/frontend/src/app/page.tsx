'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

/* ================================================================
   HOOKS
   ================================================================ */

function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible')
            // Also reveal children with .reveal class
            entry.target.querySelectorAll('.reveal').forEach((child) => {
              child.classList.add('visible')
            })
          }
        })
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    )

    observer.observe(el)
    el.querySelectorAll('.reveal').forEach((child) => observer.observe(child))

    return () => observer.disconnect()
  }, [])

  return ref
}

function useCountUp(end: number, decimals: number = 0) {
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
          const duration = 1500
          const startTime = performance.now()

          const animate = (currentTime: number) => {
            const elapsed = currentTime - startTime
            const progress = Math.min(elapsed / duration, 1)
            const eased = 1 - Math.pow(1 - progress, 3) // easeOutCubic
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
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return scrolled
}

/* ================================================================
   DATA
   ================================================================ */

const FUNDS_DATA = [
  { name: 'Iroko Zen', type: 'SCPI', td: 7.12, tof: 98.2, score: 91, capitalisation: '462 M€', trend: 'up' },
  { name: 'Remake Live', type: 'SCPI', td: 7.79, tof: 99.5, score: 89, capitalisation: '835 M€', trend: 'up' },
  { name: 'Corum Origin', type: 'SCPI', td: 6.26, tof: 97.6, score: 87, capitalisation: '2.8 Md€', trend: 'up' },
  { name: 'Novaxia Neo', type: 'SCPI', td: 6.51, tof: 97.1, score: 85, capitalisation: '415 M€', trend: 'up' },
  { name: 'Transitions Europe', type: 'SCPI', td: 8.16, tof: 99.0, score: 84, capitalisation: '198 M€', trend: 'up' },
]

const FEATURES = [
  {
    title: 'Scoring IA propriétaire',
    description: 'Chaque SCPI, OPCI et SCI reçoit un score de 0 à 100 calculé par notre algorithme sur 47 critères : rendement, collecte, taux d\'occupation, dette, diversification, liquidité.',
    icon: '◎',
    large: true,
  },
  {
    title: 'Comparateur multi-fonds',
    description: 'Comparez jusqu\'à 5 fonds côte à côte sur tous les indicateurs clés. Export PDF pour vos clients.',
    icon: '⟺',
  },
  {
    title: 'Données réglementaires vérifiées',
    description: 'Rapports annuels, bulletins trimestriels, données AMF — centralisés et toujours à jour.',
    icon: '✓',
  },
  {
    title: 'Simulateur TRI SCPI',
    description: 'Simulez le Taux de Rendement Interne sur 5 et 10 ans. Ajustez rendement et prix de part pour explorer différents scénarios.',
    icon: '⊞',
    link: '/simulateur',
  },
  {
    title: 'Conformité DDA / MIF2',
    description: 'Générez des rapports d\'adéquation et des fiches produit conformes automatiquement.',
    icon: '⊡',
  },
  {
    title: 'Alertes et veille marché',
    description: 'Soyez notifié en temps réel des changements de prix de part, de TD ou d\'événements majeurs.',
    icon: '◈',
  },
]

const TESTIMONIALS = [
  {
    quote: 'Cet outil a transformé ma pratique. Je gagne 3 heures par semaine sur mes analyses de fonds et mes clients apprécient la qualité des préconisations.',
    name: 'Marie D.',
    title: 'CGPI indépendante, Paris',
  },
  {
    quote: 'Le scoring IA est bluffant de précision. C\'est devenu mon outil de référence pour la sélection de SCPI.',
    name: 'Thomas R.',
    title: 'Directeur associé, Cabinet GP, Lyon',
  },
  {
    quote: 'Enfin un outil pensé pour les CGP français. La conformité DDA intégrée, c\'est indispensable.',
    name: 'Sophie L.',
    title: 'CIF, Bordeaux',
  },
]

const COMPLIANCE_ITEMS = [
  { icon: '🏛', title: 'AMF', description: 'Données issues de sources régulées par l\'Autorité des Marchés Financiers' },
  { icon: '📋', title: 'ORIAS', description: 'Compatible avec les obligations d\'enregistrement ORIAS' },
  { icon: '📑', title: 'DDA / MIF2', description: 'Rapports d\'adéquation conformes à la Directive sur la Distribution d\'Assurances' },
  { icon: '🔒', title: 'RGPD', description: 'Protection des données conforme au Règlement Général sur la Protection des Données' },
  { icon: '🛡', title: 'Hébergement France', description: 'Données hébergées en France (infrastructure souveraine)' },
  { icon: '🔐', title: 'Chiffrement', description: 'Chiffrement AES-256 en transit et au repos' },
]

/* ================================================================
   COMPONENTS
   ================================================================ */

function Navbar() {
  const scrolled = useNavbarScroll()

  return (
    <nav className={`navbar-frosted fixed top-0 left-0 right-0 z-50 h-16 ${scrolled ? 'scrolled' : ''}`}>
      <div className="max-w-[1280px] mx-auto px-6 h-full flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xs font-mono">IA</span>
          </div>
          <span className="font-semibold text-lg text-t-primary">CGP Immo Analytics</span>
          <span className="hidden sm:inline-flex items-center gap-1 text-[11px] bg-success/10 text-success px-2 py-0.5 rounded-full font-medium">
            <span className="w-1.5 h-1.5 bg-success rounded-full inline-block" />
            Données à jour
          </span>
        </div>

        {/* Nav links — desktop */}
        <div className="hidden lg:flex items-center gap-8 text-sm text-t-secondary">
          <a href="#plateforme" className="hover:text-t-primary transition">Plateforme</a>
          <a href="#fonds" className="hover:text-t-primary transition">Fonds analysés</a>
          <a href="#methodologie" className="hover:text-t-primary transition">Méthodologie</a>
          <a href="#tarifs" className="hover:text-t-primary transition">Tarifs</a>
          <a href="/simulateur" className="hover:text-t-primary transition">Simulateur TRI</a>
          <a href="#ressources" className="hover:text-t-primary transition">Ressources</a>
        </div>

        {/* CTA */}
        <div className="flex items-center gap-3">
          <a href="/funds" className="btn-ghost text-sm hidden sm:inline-block !py-2 !px-4">
            Se connecter
          </a>
          <a href="/funds" className="btn-primary text-sm !py-2 !px-4">
            Essai gratuit
          </a>
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
        {/* Badge */}
        <div className="reveal inline-flex items-center shimmer-badge rounded-full px-4 py-1.5 text-sm text-compliance mb-8">
          Propulsé par l&apos;Intelligence Artificielle
        </div>

        {/* Headline */}
        <h1 className="reveal text-4xl sm:text-5xl lg:text-[56px] font-bold leading-tight tracking-[-0.02em] text-t-primary max-w-4xl mx-auto">
          L&apos;analyse de fonds immobiliers,{' '}
          <span className="text-accent">réinventée par l&apos;IA</span>
        </h1>

        {/* Subtitle */}
        <p className="reveal text-lg sm:text-xl text-t-secondary max-w-2xl mx-auto mt-6 leading-relaxed">
          Analysez, comparez et sélectionnez les meilleurs fonds immobiliers pour vos clients.
          Données en temps réel, scoring IA propriétaire, conformité DDA intégrée.
        </p>

        {/* CTAs */}
        <div className="reveal flex flex-col sm:flex-row items-center justify-center gap-4 mt-10">
          <a href="/funds" className="btn-primary text-base animate-glow">
            Accéder à la plateforme
          </a>
          <button className="btn-ghost text-base flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs">▶</span>
            Voir une démo
          </button>
        </div>

        {/* Trust line */}
        <p className="reveal text-sm text-t-tertiary mt-6">
          Sans engagement · Gratuit pour les étudiants CGP · Données AMF vérifiées
        </p>

        {/* Trust bar */}
        <div className="reveal mt-12 pt-8 border-t border-white/[0.06]">
          <p className="text-xs text-t-tertiary uppercase tracking-widest mb-4">
            Données issues de sources réglementées
          </p>
          <div className="flex items-center justify-center gap-8 flex-wrap text-t-tertiary/50 text-sm font-medium">
            <span>AMF</span>
            <span className="text-white/10">|</span>
            <span>ORIAS</span>
            <span className="text-white/10">|</span>
            <span>ANACOFI</span>
            <span className="text-white/10">|</span>
            <span>CNCEF</span>
            <span className="text-white/10">|</span>
            <span>ASPIM</span>
          </div>
        </div>
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
    { ref: m1.ref, value: `${m1.value}+`, label: 'Fonds analysés' },
    { ref: m2.ref, value: `${m2.value} Md€`, label: 'Capitalisation couverte' },
    { ref: m3.ref, value: `${m3.value}+`, label: 'CGP utilisateurs' },
    { ref: null, value: '24/7', label: 'Mise à jour continue' },
    { ref: m4.ref, value: `${m4.value}%`, label: 'Satisfaction' },
  ]

  return (
    <section className="relative bg-bg-surface border-y border-white/[0.06] py-12">
      <div className="max-w-[1280px] mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 text-center">
          {metrics.map((m, i) => (
            <div key={i} className="flex flex-col items-center">
              <span ref={m.ref} className="font-mono text-3xl sm:text-4xl font-semibold text-t-primary tabular-nums">
                {m.value}
              </span>
              <span className="text-xs uppercase tracking-widest text-t-tertiary mt-2">
                {m.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function Features() {
  const ref = useScrollReveal()

  return (
    <section id="plateforme" className="py-24" ref={ref}>
      <div className="max-w-[1280px] mx-auto px-6">
        <div className="text-center mb-16">
          <p className="reveal text-xs uppercase tracking-widest text-accent font-semibold mb-3">
            Plateforme
          </p>
          <h2 className="reveal text-3xl sm:text-4xl font-bold text-t-primary">
            Tous les outils pour un conseil éclairé
          </h2>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 reveal-stagger">
          {FEATURES.map((f, i) => (
            <div
              key={i}
              className={`reveal glass-card p-6 ${i === 0 ? 'md:col-span-2 lg:col-span-2 lg:row-span-2' : ''}`}
            >
              <div className={`w-10 h-10 rounded-lg bg-accent/10 text-accent flex items-center justify-center text-xl mb-4 ${i === 0 ? 'w-12 h-12 text-2xl' : ''}`}>
                {f.icon}
              </div>
              <h3 className={`font-semibold text-t-primary mb-2 ${i === 0 ? 'text-2xl' : 'text-lg'}`}>
                {f.title}
              </h3>
              <p className={`text-t-secondary leading-relaxed ${i === 0 ? 'text-base max-w-lg' : 'text-sm'}`}>
                {f.description}
              </p>

              {/* Score gauge preview for main card */}
              {i === 0 && (
                <div className="mt-6 flex items-center gap-3 flex-wrap">
                  <div className="score-pill score-excellent">91/100</div>
                  <div className="score-pill score-good">78/100</div>
                  <div className="score-pill score-average">54/100</div>
                  <div className="score-pill score-poor">28/100</div>
                </div>
              )}
            </div>
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
          <p className="reveal text-xs uppercase tracking-widest text-accent font-semibold mb-3">
            Données en temps réel
          </p>
          <h2 className="reveal text-3xl sm:text-4xl font-bold text-t-primary">
            Suivez la performance de +850 fonds immobiliers
          </h2>
        </div>

        {/* Fund table */}
        <div className="reveal glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="fund-table">
              <thead>
                <tr>
                  <th>Fonds</th>
                  <th>Type</th>
                  <th>TD 2024</th>
                  <th>TOF</th>
                  <th>Capitalisation</th>
                  <th>Score IA</th>
                </tr>
              </thead>
              <tbody>
                {FUNDS_DATA.map((fund, i) => (
                  <tr key={i}>
                    <td className="font-medium text-t-primary">{fund.name}</td>
                    <td>
                      <span className="text-xs font-medium px-2 py-0.5 rounded bg-accent/10 text-accent">
                        {fund.type}
                      </span>
                    </td>
                    <td className="font-mono tabular-nums">
                      <span className="text-success">{fund.td.toFixed(2)}% ▲</span>
                    </td>
                    <td className="font-mono tabular-nums text-t-secondary">
                      {fund.tof.toFixed(1)}%
                    </td>
                    <td className="font-mono tabular-nums text-t-secondary">
                      {fund.capitalisation}
                    </td>
                    <td>
                      <span className={`score-pill ${fund.score >= 85 ? 'score-excellent' : fund.score >= 70 ? 'score-good' : 'score-average'}`}>
                        {fund.score}/100
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Disclaimer + CTA */}
        <div className="mt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <p className="text-xs text-t-tertiary">
            Les performances passées ne préjugent pas des performances futures. Données au 31/12/2024.
          </p>
          <a href="/funds" className="text-sm text-accent font-medium hover:underline flex items-center gap-1">
            Explorer tous les fonds <span>→</span>
          </a>
        </div>
      </div>
    </section>
  )
}

function HowItWorks() {
  const ref = useScrollReveal()
  const steps = [
    {
      num: '01',
      title: 'Recherchez',
      description: 'Accédez à notre base de données complète de SCPI, OPCI et SCI. Filtrez par rendement, risque, thématique ou société de gestion.',
    },
    {
      num: '02',
      title: 'Analysez',
      description: 'Notre IA évalue chaque fonds sur 47 critères. Comparez, simulez et identifiez les meilleures opportunités pour vos clients.',
    },
    {
      num: '03',
      title: 'Recommandez',
      description: 'Générez des fiches de préconisation conformes DDA, exportez vos analyses et partagez avec vos clients en toute confiance.',
    },
  ]

  return (
    <section id="methodologie" className="py-24" ref={ref}>
      <div className="max-w-[1280px] mx-auto px-6">
        <h2 className="reveal text-3xl sm:text-4xl font-bold text-t-primary text-center mb-16">
          Comment ça marche
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 reveal-stagger">
          {steps.map((step) => (
            <div key={step.num} className="reveal text-center md:text-left">
              <span className="font-mono text-5xl font-bold text-accent/20 block mb-4">
                {step.num}
              </span>
              <h3 className="text-xl font-semibold text-t-primary mb-3">
                {step.title}
              </h3>
              <p className="text-t-secondary leading-relaxed text-sm">
                {step.description}
              </p>
            </div>
          ))}
        </div>

        {/* Connecting line — desktop only */}
        <div className="hidden md:block relative -mt-[140px] mb-[80px] px-16">
          <div className="h-px bg-gradient-to-r from-transparent via-accent/20 to-transparent" />
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
        <h2 className="reveal text-3xl sm:text-4xl font-bold text-t-primary text-center mb-16">
          La confiance de milliers de conseillers
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 reveal-stagger">
          {TESTIMONIALS.map((t, i) => (
            <div key={i} className="reveal glass-card p-6">
              <div className="text-4xl text-accent/20 mb-4 leading-none">&ldquo;</div>
              <p className="text-t-secondary text-sm leading-relaxed mb-6">
                {t.quote}
              </p>
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

function SecurityCompliance() {
  const ref = useScrollReveal()

  return (
    <section className="py-24" ref={ref}>
      <div className="max-w-[1280px] mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="reveal text-3xl sm:text-4xl font-bold text-t-primary">
            Sécurité et conformité réglementaire
          </h2>
          <p className="reveal text-t-secondary mt-4 max-w-2xl mx-auto">
            Conçu pour répondre aux exigences les plus strictes du conseil en gestion de patrimoine
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 reveal-stagger">
          {COMPLIANCE_ITEMS.map((item, i) => (
            <div key={i} className="reveal glass-card p-6 flex gap-4">
              <div className="text-2xl flex-shrink-0">{item.icon}</div>
              <div>
                <h3 className="font-semibold text-t-primary text-sm">{item.title}</h3>
                <p className="text-xs text-t-secondary mt-1 leading-relaxed">{item.description}</p>
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
    {
      name: 'Découverte',
      price: 'Gratuit',
      description: 'Idéal pour les étudiants CGP et la découverte',
      features: [
        'Accès limité à 50 fonds',
        'Scoring IA basique',
        'Données publiques AMF',
      ],
      cta: 'Commencer gratuitement',
      highlighted: false,
    },
    {
      name: 'Professionnel',
      price: annual ? '79€' : '99€',
      period: '/mois HT',
      description: 'Pour les CGP en activité',
      features: [
        'Accès illimité à tous les fonds',
        'Scoring IA avancé (47 critères)',
        'Comparateur multi-fonds',
        'Export PDF des analyses',
        'Conformité DDA intégrée',
        'Support prioritaire',
      ],
      cta: 'Essai gratuit 14 jours',
      highlighted: true,
      badge: 'Populaire',
    },
    {
      name: 'Cabinet',
      price: 'Sur devis',
      description: 'Pour les structures multi-conseillers',
      features: [
        'Tout Professionnel +',
        'Multi-utilisateurs',
        'API d\'intégration',
        'Marque blanche possible',
        'Accompagnement dédié',
      ],
      cta: 'Contacter l\'équipe',
      highlighted: false,
    },
  ]

  return (
    <section id="tarifs" className="py-24 bg-bg-surface" ref={ref}>
      <div className="max-w-[1280px] mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="reveal text-3xl sm:text-4xl font-bold text-t-primary">
            Des tarifs adaptés à votre activité
          </h2>

          {/* Toggle */}
          <div className="reveal flex items-center justify-center gap-3 mt-6">
            <span className={`text-sm ${!annual ? 'text-t-primary' : 'text-t-tertiary'}`}>Mensuel</span>
            <button
              onClick={() => setAnnual(!annual)}
              className={`relative w-12 h-6 rounded-full transition ${annual ? 'bg-accent' : 'bg-white/10'}`}
            >
              <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${annual ? 'left-7' : 'left-1'}`} />
            </button>
            <span className={`text-sm ${annual ? 'text-t-primary' : 'text-t-tertiary'}`}>
              Annuel <span className="text-success text-xs font-medium">-20%</span>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 reveal-stagger">
          {plans.map((plan, i) => (
            <div
              key={i}
              className={`reveal glass-card p-8 flex flex-col ${plan.highlighted ? 'pricing-highlight' : ''}`}
            >
              {plan.badge && (
                <span className="inline-flex self-start text-xs font-semibold bg-accent text-white px-3 py-1 rounded-full mb-4">
                  {plan.badge}
                </span>
              )}

              <h3 className="text-xl font-semibold text-t-primary">{plan.name}</h3>
              <p className="text-sm text-t-tertiary mt-1">{plan.description}</p>

              <div className="mt-6 mb-6">
                <span className="text-4xl font-bold text-t-primary font-mono">{plan.price}</span>
                {plan.period && <span className="text-t-tertiary text-sm">{plan.period}</span>}
              </div>

              <ul className="space-y-3 mb-8 flex-grow">
                {plan.features.map((f, j) => (
                  <li key={j} className="flex items-start gap-2 text-sm text-t-secondary">
                    <span className="text-success mt-0.5 flex-shrink-0">✓</span>
                    {f}
                  </li>
                ))}
              </ul>

              <a href="/funds" className={plan.highlighted ? 'btn-primary text-center' : 'btn-ghost text-center'}>
                {plan.cta}
              </a>
            </div>
          ))}
        </div>

        <p className="reveal text-center text-xs text-t-tertiary mt-8">
          Tous les prix sont HT. TVA applicable selon votre régime fiscal.
        </p>
      </div>
    </section>
  )
}

function Resources() {
  const ref = useScrollReveal()

  const articles = [
    {
      category: 'Guide',
      title: 'Comment sélectionner une SCPI pour vos clients en 2025',
      time: '12 min',
    },
    {
      category: 'Analyse',
      title: 'OPCI vs SCPI : analyse comparative complète',
      time: '8 min',
    },
    {
      category: 'Conformité',
      title: 'Les obligations DDA du CGP : checklist pratique',
      time: '6 min',
    },
  ]

  return (
    <section id="ressources" className="py-24" ref={ref}>
      <div className="max-w-[1280px] mx-auto px-6">
        <h2 className="reveal text-3xl sm:text-4xl font-bold text-t-primary text-center mb-16">
          Ressources pour les CGP
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 reveal-stagger">
          {articles.map((a, i) => (
            <div key={i} className="reveal glass-card p-6 group cursor-pointer">
              <span className="text-xs uppercase tracking-widest text-accent font-semibold">
                {a.category}
              </span>
              <h3 className="font-semibold text-t-primary mt-3 mb-3 group-hover:text-accent transition">
                {a.title}
              </h3>
              <p className="text-xs text-t-tertiary">{a.time} de lecture</p>
            </div>
          ))}
        </div>

        <div className="reveal text-center mt-10">
          <a href="#" className="text-sm text-accent font-medium hover:underline">
            Voir toutes les ressources →
          </a>
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
        <h2 className="reveal text-3xl sm:text-4xl font-bold text-t-primary">
          Prêt à transformer votre conseil patrimonial ?
        </h2>
        <p className="reveal text-t-secondary mt-4 max-w-xl mx-auto">
          Rejoignez les CGP qui ont déjà adopté l&apos;analyse augmentée par l&apos;IA.
        </p>
        <div className="reveal mt-8">
          <a href="/funds" className="btn-primary text-base inline-block animate-glow">
            Créer mon compte gratuitement
          </a>
        </div>
        <p className="reveal text-xs text-t-tertiary mt-4">
          Sans carte bancaire · Résiliation à tout moment · Support français
        </p>
      </div>
    </section>
  )
}

function Footer() {
  const columns = [
    {
      title: 'Plateforme',
      links: ['Analyse SCPI', 'Analyse OPCI', 'Analyse SCI', 'Comparateur', 'Simulateur', 'Scoring IA'],
    },
    {
      title: 'Ressources',
      links: ['Blog', 'Guides CGP', 'Webinaires', 'FAQ', 'Documentation API'],
    },
    {
      title: 'Entreprise',
      links: ['À propos', 'Équipe', 'Carrières', 'Presse', 'Contact'],
    },
    {
      title: 'Légal',
      links: ['Mentions légales', 'Confidentialité', 'CGU', 'Cookies', 'RGPD'],
    },
  ]

  return (
    <footer className="border-t border-white/[0.06] pt-16 pb-8">
      <div className="max-w-[1280px] mx-auto px-6">
        {/* Columns */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          {columns.map((col, i) => (
            <div key={i}>
              <h4 className="text-sm font-semibold text-t-primary mb-4">{col.title}</h4>
              <ul className="space-y-2">
                {col.links.map((link, j) => (
                  <li key={j}>
                    <a href="#" className="text-sm text-t-tertiary hover:text-t-secondary transition">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/[0.06] pt-8 space-y-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-t-tertiary">
            <span>&copy; 2025 CGP Immo Analytics · Tous droits réservés</span>
            <span className="text-center">
              Société enregistrée au RCS de Paris · SIRET: XXX XXX XXX XXXXX
            </span>
            <div className="flex items-center gap-4">
              <a href="#" className="hover:text-t-secondary transition">LinkedIn</a>
              <a href="#" className="hover:text-t-secondary transition">Twitter/X</a>
            </div>
          </div>

          {/* Legal disclaimer */}
          <p className="text-[11px] text-t-tertiary/60 text-center leading-relaxed max-w-3xl mx-auto">
            Les informations présentées ne constituent pas un conseil en investissement.
            Les performances passées ne préjugent pas des performances futures.
            Investir en SCPI comporte des risques, notamment de perte en capital.
          </p>
        </div>
      </div>
    </footer>
  )
}

/* ================================================================
   MAIN PAGE
   ================================================================ */

export default function Home() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <Hero />
      <MetricsBar />
      <Features />
      <FundShowcase />
      <HowItWorks />
      <Testimonials />
      <SecurityCompliance />
      <Pricing />
      <Resources />
      <FinalCTA />
      <Footer />
    </div>
  )
}
