'use client'

import { useState, useMemo } from 'react'
import { SCPI_DATA, SCPI, SCPIAvis } from '../../lib/data'
import AppShell from '../../components/AppShell'

// ============================================================
// TYPES
// ============================================================

interface AvisWithSCPI extends SCPIAvis {
  scpiId: string
  scpiNom: string
}

// ============================================================
// HELPERS
// ============================================================

function formatDateFR(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

function getScpiColor(scpiId: string): string {
  const colors = [
    '#2563EB', '#7C3AED', '#DB2777', '#EA580C', '#16A34A',
    '#0891B2', '#4F46E5', '#C026D3', '#D97706', '#059669',
    '#6366F1', '#E11D48',
  ]
  const index = SCPI_DATA.findIndex(s => s.id === scpiId)
  return colors[index % colors.length]
}

// ============================================================
// STAR SVGs
// ============================================================

function StarFilled({ className }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="#C9A84C" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  )
}

function StarEmpty({ className }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" strokeWidth="1.5" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  )
}

function StarRating({ note, size = 18 }: { note: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i =>
        i <= note ? (
          <svg key={i} width={size} height={size} viewBox="0 0 24 24" fill="#C9A84C" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        ) : (
          <svg key={i} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#C9A84C" strokeWidth="1.5" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        )
      )}
    </div>
  )
}

function ClickableStarRating({ note, onChange }: { note: number; onChange: (n: number) => void }) {
  const [hovered, setHovered] = useState(0)
  const display = hovered || note

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map(i => (
        <button
          key={i}
          type="button"
          onMouseEnter={() => setHovered(i)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(i)}
          className="focus:outline-none transition-transform hover:scale-110"
        >
          {i <= display ? (
            <svg width="28" height="28" viewBox="0 0 24 24" fill="#C9A84C" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          ) : (
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" strokeWidth="1.5" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          )}
        </button>
      ))}
    </div>
  )
}

// ============================================================
// MINI DISTRIBUTION BAR
// ============================================================

function NoteDistributionBar({ avis }: { avis: SCPIAvis[] }) {
  const distribution = [5, 4, 3, 2, 1].map(note => ({
    note,
    count: avis.filter(a => a.note === note).length,
  }))
  const maxCount = Math.max(...distribution.map(d => d.count), 1)

  return (
    <div className="flex flex-col gap-1 w-full">
      {distribution.map(d => (
        <div key={d.note} className="flex items-center gap-2 text-xs">
          <span className="text-[#94A3B8] w-3 text-right">{d.note}</span>
          <div className="flex-1 h-2 bg-white/[0.06] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#C9A84C] rounded-full transition-all"
              style={{ width: `${(d.count / maxCount) * 100}%` }}
            />
          </div>
          <span className="text-[#475569] w-4 text-right">{d.count}</span>
        </div>
      ))}
    </div>
  )
}

// ============================================================
// MAIN COMPONENT
// ============================================================

export default function CommunautePage() {
  // ---- Filters & Sort ----
  const [filterSCPI, setFilterSCPI] = useState<string>('all')
  const [filterVerifie, setFilterVerifie] = useState<'tous' | 'verifies'>('tous')
  const [sortBy, setSortBy] = useState<'recents' | 'meilleure' | 'pire'>('recents')
  const [currentPage, setCurrentPage] = useState(1)

  // ---- Write a Review state ----
  const [newReviewSCPI, setNewReviewSCPI] = useState<string>(SCPI_DATA[0]?.id ?? '')
  const [newReviewNote, setNewReviewNote] = useState(0)
  const [newReviewComment, setNewReviewComment] = useState('')
  const [newReviewCertifie, setNewReviewCertifie] = useState(false)
  const [userReviews, setUserReviews] = useState<AvisWithSCPI[]>([])
  const [submitSuccess, setSubmitSuccess] = useState(false)

  const REVIEWS_PER_PAGE = 5

  // ---- Aggregate all avis ----
  const allAvis = useMemo<AvisWithSCPI[]>(() => {
    const avis: AvisWithSCPI[] = []
    SCPI_DATA.forEach(scpi => {
      scpi.avis.forEach(a => {
        avis.push({ ...a, scpiId: scpi.id, scpiNom: scpi.nom })
      })
    })
    return [...avis, ...userReviews]
  }, [userReviews])

  // ---- Stats ----
  const totalAvis = allAvis.length
  const avisVerifies = allAvis.filter(a => a.verifie).length
  const noteMoyenne = totalAvis > 0
    ? (allAvis.reduce((sum, a) => sum + a.note, 0) / totalAvis).toFixed(1)
    : '0.0'

  // ---- Top 5 SCPI by avg review score ----
  const scpiRankings = useMemo(() => {
    const allSCPIAvis = SCPI_DATA.map(scpi => {
      const avisForSCPI = allAvis.filter(a => a.scpiId === scpi.id)
      const avgNote = avisForSCPI.length > 0
        ? avisForSCPI.reduce((sum, a) => sum + a.note, 0) / avisForSCPI.length
        : 0
      return {
        scpi,
        avgNote,
        count: avisForSCPI.length,
        avis: avisForSCPI,
      }
    })
      .filter(x => x.count > 0)
      .sort((a, b) => b.avgNote - a.avgNote)
      .slice(0, 5)

    return allSCPIAvis
  }, [allAvis])

  // ---- Filtered & Sorted reviews ----
  const filteredAvis = useMemo(() => {
    let result = [...allAvis]

    if (filterSCPI !== 'all') {
      result = result.filter(a => a.scpiId === filterSCPI)
    }
    if (filterVerifie === 'verifies') {
      result = result.filter(a => a.verifie)
    }

    switch (sortBy) {
      case 'recents':
        result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        break
      case 'meilleure':
        result.sort((a, b) => b.note - a.note)
        break
      case 'pire':
        result.sort((a, b) => a.note - b.note)
        break
    }

    return result
  }, [allAvis, filterSCPI, filterVerifie, sortBy])

  // ---- Pagination ----
  const totalPages = Math.max(1, Math.ceil(filteredAvis.length / REVIEWS_PER_PAGE))
  const paginatedAvis = filteredAvis.slice(
    (currentPage - 1) * REVIEWS_PER_PAGE,
    currentPage * REVIEWS_PER_PAGE
  )

  // Reset page when filters change
  useMemo(() => {
    setCurrentPage(1)
  }, [filterSCPI, filterVerifie, sortBy])

  // ---- Submit review ----
  function handleSubmitReview() {
    if (!newReviewSCPI || newReviewNote === 0 || newReviewComment.trim() === '') return

    const scpi = SCPI_DATA.find(s => s.id === newReviewSCPI)
    if (!scpi) return

    const newAvis: AvisWithSCPI = {
      auteur: 'Utilisateur Anonyme',
      date: new Date().toISOString().split('T')[0],
      note: newReviewNote,
      commentaire: newReviewComment.trim(),
      verifie: false,
      scpiId: scpi.id,
      scpiNom: scpi.nom,
    }

    setUserReviews(prev => [newAvis, ...prev])
    setNewReviewNote(0)
    setNewReviewComment('')
    setNewReviewCertifie(false)
    setSubmitSuccess(true)
    setTimeout(() => setSubmitSuccess(false), 3000)
  }

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto space-y-8">

        {/* ============================================================ */}
        {/* PAGE HEADER */}
        {/* ============================================================ */}
        <div>
          <h1 className="text-2xl font-bold text-[#F1F5F9]">Communaute</h1>
          <p className="text-[#94A3B8] mt-1">Le Trustpilot des SCPI — Avis et retours d{"'"}experience des investisseurs</p>
        </div>

        {/* ---- Stats cards ---- */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Total avis */}
          <div className="bg-[rgba(19,24,37,0.6)] border border-white/[0.06] rounded-xl p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#2563EB]/10 flex items-center justify-center">
                <svg className="w-5 h-5 text-[#2563EB]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-[#F1F5F9]">{totalAvis}</p>
                <p className="text-xs text-[#94A3B8]">Avis au total</p>
              </div>
            </div>
          </div>

          {/* Avis verifies */}
          <div className="bg-[rgba(19,24,37,0.6)] border border-white/[0.06] rounded-xl p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#10B981]/10 flex items-center justify-center">
                <svg className="w-5 h-5 text-[#10B981]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-[#F1F5F9]">{avisVerifies}</p>
                <p className="text-xs text-[#94A3B8]">Avis verifies</p>
              </div>
            </div>
          </div>

          {/* Note moyenne */}
          <div className="bg-[rgba(19,24,37,0.6)] border border-white/[0.06] rounded-xl p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#C9A84C]/10 flex items-center justify-center">
                <svg className="w-5 h-5 text-[#C9A84C]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-[#F1F5F9]">{noteMoyenne}<span className="text-sm text-[#94A3B8] font-normal">/5</span></p>
                <p className="text-xs text-[#94A3B8]">Note moyenne globale</p>
              </div>
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* GLOBAL RANKINGS — TOP 5 */}
        {/* ============================================================ */}
        <div>
          <h2 className="text-lg font-semibold text-[#F1F5F9] mb-4">Classement des SCPI par avis</h2>
          <div className="space-y-3">
            {scpiRankings.map((item, index) => (
              <div
                key={item.scpi.id}
                className="bg-[rgba(19,24,37,0.6)] border border-white/[0.06] rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-4"
              >
                {/* Rank */}
                <div className="flex items-center gap-4 sm:w-64 shrink-0">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                    index === 0 ? 'bg-[#C9A84C]/20 text-[#C9A84C]' :
                    index === 1 ? 'bg-[#94A3B8]/20 text-[#94A3B8]' :
                    index === 2 ? 'bg-[#CD7F32]/20 text-[#CD7F32]' :
                    'bg-white/[0.06] text-[#475569]'
                  }`}>
                    {index + 1}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#F1F5F9]">{item.scpi.nom}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <StarRating note={Math.round(item.avgNote)} size={14} />
                      <span className="text-xs text-[#C9A84C] font-medium">{item.avgNote.toFixed(1)}</span>
                      <span className="text-xs text-[#475569]">({item.count} avis)</span>
                    </div>
                  </div>
                </div>

                {/* Distribution bar */}
                <div className="flex-1 min-w-0">
                  <NoteDistributionBar avis={item.avis} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ============================================================ */}
        {/* FILTER / SORT BAR */}
        {/* ============================================================ */}
        <div className="bg-[rgba(19,24,37,0.6)] border border-white/[0.06] rounded-xl p-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            {/* Filter by SCPI */}
            <div className="flex-1">
              <label className="text-xs text-[#475569] block mb-1">Filtrer par SCPI</label>
              <select
                value={filterSCPI}
                onChange={e => setFilterSCPI(e.target.value)}
                className="w-full bg-[#0B1120] border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-[#F1F5F9] focus:outline-none focus:border-[#2563EB] transition"
              >
                <option value="all">Toutes les SCPI</option>
                {SCPI_DATA.map(scpi => (
                  <option key={scpi.id} value={scpi.id}>{scpi.nom}</option>
                ))}
              </select>
            </div>

            {/* Filter verified */}
            <div>
              <label className="text-xs text-[#475569] block mb-1">Verification</label>
              <div className="flex rounded-lg overflow-hidden border border-white/[0.06]">
                <button
                  onClick={() => setFilterVerifie('tous')}
                  className={`px-4 py-2 text-sm transition ${
                    filterVerifie === 'tous'
                      ? 'bg-[#2563EB] text-white'
                      : 'bg-[#0B1120] text-[#94A3B8] hover:text-[#F1F5F9]'
                  }`}
                >
                  Tous
                </button>
                <button
                  onClick={() => setFilterVerifie('verifies')}
                  className={`px-4 py-2 text-sm transition ${
                    filterVerifie === 'verifies'
                      ? 'bg-[#10B981] text-white'
                      : 'bg-[#0B1120] text-[#94A3B8] hover:text-[#F1F5F9]'
                  }`}
                >
                  Verifies uniquement
                </button>
              </div>
            </div>

            {/* Sort */}
            <div>
              <label className="text-xs text-[#475569] block mb-1">Trier par</label>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as typeof sortBy)}
                className="w-full bg-[#0B1120] border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-[#F1F5F9] focus:outline-none focus:border-[#2563EB] transition"
              >
                <option value="recents">Plus recents</option>
                <option value="meilleure">Meilleure note</option>
                <option value="pire">Pire note</option>
              </select>
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* REVIEWS FEED */}
        {/* ============================================================ */}
        <div>
          <h2 className="text-lg font-semibold text-[#F1F5F9] mb-4">
            Avis des investisseurs
            <span className="text-sm font-normal text-[#475569] ml-2">({filteredAvis.length} resultats)</span>
          </h2>

          {paginatedAvis.length === 0 ? (
            <div className="bg-[rgba(19,24,37,0.6)] border border-white/[0.06] rounded-xl p-8 text-center">
              <p className="text-[#94A3B8]">Aucun avis ne correspond aux filtres selectionnes.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {paginatedAvis.map((avis, idx) => (
                <div
                  key={`${avis.scpiId}-${avis.auteur}-${avis.date}-${idx}`}
                  className="bg-[rgba(19,24,37,0.6)] border border-white/[0.06] rounded-xl p-5"
                >
                  {/* Top row: stars + SCPI pill + date */}
                  <div className="flex flex-wrap items-center gap-3 mb-3">
                    <StarRating note={avis.note} />
                    <span
                      className="px-2.5 py-0.5 rounded-full text-xs font-medium text-white"
                      style={{ backgroundColor: getScpiColor(avis.scpiId) }}
                    >
                      {avis.scpiNom}
                    </span>
                    <span className="text-xs text-[#475569] ml-auto">{formatDateFR(avis.date)}</span>
                  </div>

                  {/* Author line */}
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="text-sm font-semibold text-[#F1F5F9]">{avis.auteur}</span>
                    {avis.verifie && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#10B981]/10 text-[#10B981] text-xs font-medium">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                        </svg>
                        Detenteur verifie
                      </span>
                    )}
                    {avis.detenteurDepuis && (
                      <span className="text-xs text-[#475569]">Detenteur depuis {avis.detenteurDepuis}</span>
                    )}
                  </div>

                  {/* Comment */}
                  <p className="text-sm text-[#94A3B8] leading-relaxed">{avis.commentaire}</p>
                </div>
              ))}
            </div>
          )}

          {/* ---- Pagination ---- */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 rounded-lg bg-[rgba(19,24,37,0.6)] border border-white/[0.06] text-sm text-[#94A3B8] hover:text-[#F1F5F9] disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                Precedent
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-9 h-9 rounded-lg text-sm font-medium transition ${
                    page === currentPage
                      ? 'bg-[#2563EB] text-white'
                      : 'bg-[rgba(19,24,37,0.6)] border border-white/[0.06] text-[#94A3B8] hover:text-[#F1F5F9]'
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 rounded-lg bg-[rgba(19,24,37,0.6)] border border-white/[0.06] text-sm text-[#94A3B8] hover:text-[#F1F5F9] disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                Suivant
              </button>
            </div>
          )}
        </div>

        {/* ============================================================ */}
        {/* WRITE A REVIEW */}
        {/* ============================================================ */}
        <div className="bg-[rgba(19,24,37,0.6)] border border-white/[0.06] rounded-xl p-6">
          <h2 className="text-lg font-semibold text-[#F1F5F9] mb-4">Donner votre avis</h2>

          {submitSuccess && (
            <div className="mb-4 p-3 rounded-lg bg-[#10B981]/10 border border-[#10B981]/20 text-[#10B981] text-sm">
              Votre avis a ete publie avec succes. Il apparaitra comme non verifie.
            </div>
          )}

          <div className="space-y-4">
            {/* Select SCPI */}
            <div>
              <label className="text-sm text-[#94A3B8] block mb-1.5">SCPI concernee</label>
              <select
                value={newReviewSCPI}
                onChange={e => setNewReviewSCPI(e.target.value)}
                className="w-full bg-[#0B1120] border border-white/[0.06] rounded-lg px-3 py-2.5 text-sm text-[#F1F5F9] focus:outline-none focus:border-[#2563EB] transition"
              >
                {SCPI_DATA.map(scpi => (
                  <option key={scpi.id} value={scpi.id}>{scpi.nom}</option>
                ))}
              </select>
            </div>

            {/* Star rating */}
            <div>
              <label className="text-sm text-[#94A3B8] block mb-1.5">Votre note</label>
              <ClickableStarRating note={newReviewNote} onChange={setNewReviewNote} />
              {newReviewNote === 0 && (
                <p className="text-xs text-[#475569] mt-1">Cliquez sur une etoile pour noter</p>
              )}
            </div>

            {/* Comment */}
            <div>
              <label className="text-sm text-[#94A3B8] block mb-1.5">Votre commentaire</label>
              <textarea
                value={newReviewComment}
                onChange={e => setNewReviewComment(e.target.value)}
                placeholder="Partagez votre experience avec cette SCPI..."
                rows={4}
                className="w-full bg-[#0B1120] border border-white/[0.06] rounded-lg px-3 py-2.5 text-sm text-[#F1F5F9] placeholder-[#475569] focus:outline-none focus:border-[#2563EB] transition resize-none"
              />
            </div>

            {/* Certify checkbox */}
            <label className="flex items-center gap-3 cursor-pointer group">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={newReviewCertifie}
                  onChange={e => setNewReviewCertifie(e.target.checked)}
                  className="sr-only"
                />
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition ${
                  newReviewCertifie
                    ? 'bg-[#2563EB] border-[#2563EB]'
                    : 'border-white/[0.15] group-hover:border-white/[0.3]'
                }`}>
                  {newReviewCertifie && (
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
              </div>
              <span className="text-sm text-[#94A3B8] group-hover:text-[#F1F5F9] transition">
                Je certifie detenir des parts de cette SCPI
              </span>
            </label>

            {/* Submit */}
            <button
              onClick={handleSubmitReview}
              disabled={newReviewNote === 0 || newReviewComment.trim() === ''}
              className="px-6 py-2.5 rounded-lg bg-[#2563EB] text-white text-sm font-medium hover:bg-[#1d4ed8] transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Publier mon avis
            </button>
          </div>
        </div>

        {/* ============================================================ */}
        {/* VERIFICATION NOTICE */}
        {/* ============================================================ */}
        <div className="bg-[rgba(19,24,37,0.6)] border border-[#2563EB]/20 rounded-xl p-5">
          <div className="flex gap-4">
            <div className="shrink-0 w-10 h-10 rounded-lg bg-[#2563EB]/10 flex items-center justify-center">
              <svg className="w-5 h-5 text-[#2563EB]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[#F1F5F9] mb-1">Comment fonctionnent les avis verifies ?</h3>
              <p className="text-sm text-[#94A3B8] leading-relaxed">
                Les avis marques comme <span className="text-[#10B981] font-medium">&quot;Detenteur verifie&quot;</span> proviennent
                d{"'"}investisseurs ayant fourni une preuve de detention (releve de compte, attestation de la societe de gestion).
                Cette verification garantit que l{"'"}avis emane d{"'"}un veritable associe de la SCPI concernee.
                Les avis non verifies restent visibles mais sont clairement identifies comme tels.
              </p>
            </div>
          </div>
        </div>

      </div>
    </AppShell>
  )
}
