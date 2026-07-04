'use client'

import { useState, useMemo } from 'react'
import ProfileCard, { type ProfileData } from './ProfileCard'
import { maskName } from '@/lib/maskName'

const c = {
  page: '#07111f', card: '#1e3358', border: 'rgba(201,168,76,0.25)',
  ivory: '#f5f0e6', ivoryDim: '#bdb5a6', gold: '#c9a84c', navy: '#0d1f3c',
  sepia: '#5a6e82',
}

interface AIMatch { id: string; score: number; reasons: string[]; profile: ProfileData }

function profileId(id: string) { return '#' + id.slice(0, 8).toUpperCase() }

function scoreLabel(score: number) {
  if (score >= 90) return 'Exceptional Match'
  if (score >= 75) return 'Strong Match'
  if (score >= 60) return 'Good Match'
  return 'Potential Match'
}

function scoreColor(score: number) {
  if (score >= 80) return '#4ade80'
  if (score >= 60) return '#c9a84c'
  return '#f87171'
}

function scoreGradient(score: number) {
  if (score >= 80) return 'linear-gradient(to right, #4ade80, #22c55e)'
  if (score >= 60) return 'linear-gradient(to right, #e8c876, #c9a84c)'
  return 'linear-gradient(to right, #f87171, #ef4444)'
}

function isPositiveReason(r: string): boolean {
  const l = r.toLowerCase()
  const negative = ['mismatch', ' gap', 'conflict', 'falls outside', 'incompatible', 'does not match', 'significant age', 'religion gap', 'location gap']
  return !negative.some(k => l.includes(k))
}

export default function DiscoverClient({
  profiles, canReveal, canMeet, meetingsLeft, meetingsTotal, meetingsUsed, ownProfile, initialSavedIds = [],
}: {
  profiles: ProfileData[]; canReveal: boolean; canMeet: boolean; meetingsLeft: number
  meetingsTotal: number; meetingsUsed: number
  ownProfile?: ProfileData | null
  initialSavedIds?: string[]
}) {
  const [search, setSearch] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  // Input state (what user is editing in the panel)
  const [fLocation, setFLocation] = useState('')
  const [fAgeMin, setFAgeMin] = useState('')
  const [fAgeMax, setFAgeMax] = useState('')
  const [fReligion, setFReligion] = useState('')
  const [fCaste, setFCaste] = useState('')
  const [fEducation, setFEducation] = useState('')
  const [fOccupation, setFOccupation] = useState('')
  // Applied state (only updated when Search button is clicked)
  const [applied, setApplied] = useState({ location: '', ageMin: '', ageMax: '', religion: '', caste: '', education: '', occupation: '' })
  const [selected, setSelected] = useState<ProfileData | null>(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiMatches, setAiMatches] = useState<AIMatch[] | null>(null)
  const [aiError, setAiError] = useState('')
  const [savedIds, setSavedIds] = useState<Set<string>>(() => new Set(initialSavedIds))
  const [showSaved, setShowSaved] = useState(false)

  function handleToggleSave(profileId: string, nowSaved: boolean) {
    setSavedIds(prev => {
      const next = new Set(prev)
      if (nowSaved) next.add(profileId); else next.delete(profileId)
      return next
    })
  }

  const activeFilterCount = Object.values(applied).filter(Boolean).length

  function applyFilters() {
    setApplied({ location: fLocation, ageMin: fAgeMin, ageMax: fAgeMax, religion: fReligion, caste: fCaste, education: fEducation, occupation: fOccupation })
  }

  function clearFilters() {
    setFLocation(''); setFAgeMin(''); setFAgeMax('')
    setFReligion(''); setFCaste(''); setFEducation(''); setFOccupation('')
    setApplied({ location: '', ageMin: '', ageMax: '', religion: '', caste: '', education: '', occupation: '' })
  }

  // Unique values from loaded profiles for dropdowns
  const religions  = useMemo(() => [...new Set(profiles.map(p => p.religion).filter(Boolean))].sort(), [profiles])
  const educations = useMemo(() => [...new Set(profiles.map(p => p.education).filter(Boolean))].sort(), [profiles])

  const filtered = useMemo(() => {
    let list = showSaved ? profiles.filter(p => savedIds.has(p.id)) : profiles
    const q = search.trim().toLowerCase().replace(/^#/, '')
    if (q) list = list.filter(p =>
      p.full_name.toLowerCase().includes(q) ||
      p.id.slice(0, 8).toLowerCase().startsWith(q)
    )
    if (applied.location) list = list.filter(p =>
      p.city?.toLowerCase().includes(applied.location.toLowerCase()) ||
      p.country?.toLowerCase().includes(applied.location.toLowerCase())
    )
    if (applied.ageMin) list = list.filter(p => p.age >= parseInt(applied.ageMin))
    if (applied.ageMax) list = list.filter(p => p.age <= parseInt(applied.ageMax))
    if (applied.religion) list = list.filter(p => p.religion === applied.religion)
    if (applied.caste) list = list.filter(p =>
      p.caste?.toLowerCase().includes(applied.caste.toLowerCase())
    )
    if (applied.education) list = list.filter(p => p.education === applied.education)
    if (applied.occupation) list = list.filter(p =>
      p.occupation?.toLowerCase().includes(applied.occupation.toLowerCase())
    )
    return list
  }, [profiles, search, applied, showSaved, savedIds])

  async function handleAiMatch() {
    setAiLoading(true); setAiError(''); setAiMatches(null)
    try {
      const res = await fetch('/api/ai-match', { method: 'POST' })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(body.error || 'AI match failed. Please try again.')
      const { matches } = body
      setAiMatches(matches)
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'Something went wrong')
    } finally { setAiLoading(false) }
  }

  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }

        .disc-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1rem;
        }
        @media (max-width: 900px) {
          .disc-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 500px) {
          .disc-grid { grid-template-columns: repeat(2, 1fr); gap: 0.6rem; }
        }

        .ai-btn {
          padding: 1rem 2.5rem;
          display: flex; align-items: center; gap: 0.6rem;
          transition: all 0.2s;
        }
        @media (max-width: 600px) {
          .ai-btn { width: 100%; justify-content: center; padding: 0.95rem 1rem; }
        }

        .disc-modal-overlay {
          position: fixed; inset: 0;
          background: rgba(0,0,0,0.88);
          z-index: 500;
          display: flex; align-items: center; justify-content: center;
          padding: 1.5rem;
          overflow-y: auto;
        }
        @media (max-width: 600px) {
          .disc-modal-overlay {
            align-items: flex-end;
            padding: 0;
          }
          .disc-modal-inner {
            max-height: 92vh !important;
            border-radius: 16px 16px 0 0 !important;
          }
        }

        .disc-match-headline {
          display: flex; align-items: center; gap: 0.75rem;
          margin-bottom: 0.6rem; flex-wrap: wrap;
        }
        @media (max-width: 600px) {
          .disc-match-headline { gap: 0.4rem; }
          .disc-score-label { margin-left: 0 !important; }
        }

        .compact-card-info { padding: 0.75rem; }
        @media (max-width: 500px) {
          .compact-card-info { padding: 0.5rem; }
          .compact-card-name { font-size: 0.82rem !important; }
          .compact-card-sub { font-size: 0.75rem !important; }
        }

        /* Filter input placeholder text */
        .disc-filter-inp::placeholder { color: #8a9db5 !important; }
        .disc-filter-inp:focus { border-color: #c9a84c !important; }

        .disc-toolbar { display: flex; gap: 0.6rem; flex-wrap: wrap; }
        .disc-toolbar-search { flex: 1; min-width: 160px; position: relative; }
        .disc-icon-btn { padding: 0.75rem 1rem; white-space: nowrap; }
        .disc-icon-btn .btn-label { display: inline; }
        @media (max-width: 480px) {
          .disc-icon-btn { padding: 0.75rem 0.8rem; }
          .disc-icon-btn .btn-label { display: none; }
        }
      `}</style>

      {/* Search bar + filter toggle */}
      <div style={{ marginBottom: '0.75rem' }}>
        <div className="disc-toolbar">
          <div className="disc-toolbar-search">
            <span style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', color: c.sepia, fontSize: '0.9rem' }}>🔍</span>
            <input
              type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by name or Profile ID…"
              style={{ width: '100%', padding: '0.75rem 0.9rem 0.75rem 2.4rem', background: c.card, border: `1px solid ${c.border}`, color: c.ivory, fontFamily: '"Cormorant Garamond", serif', fontSize: '1rem', borderRadius: '8px', outline: 'none', boxSizing: 'border-box' }}
              onFocus={e => (e.target.style.borderColor = c.gold)}
              onBlur={e => (e.target.style.borderColor = c.border)}
            />
          </div>
          {/* Saved toggle */}
          <button onClick={() => setShowSaved(s => !s)} className="disc-icon-btn"
            style={{ background: showSaved ? 'rgba(201,168,76,0.18)' : c.card, border: `1px solid ${showSaved ? c.gold : c.border}`, color: showSaved ? c.gold : c.sepia, borderRadius: '8px', cursor: 'pointer', fontFamily: 'Raleway, sans-serif', fontSize: '0.68rem', fontWeight: 600, letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: '0.4rem', transition: 'all 0.2s' }}>
            ★<span className="btn-label">{showSaved ? ` Saved (${savedIds.size})` : ` Saved`}</span>
          </button>
          {/* Filter toggle button */}
          <button onClick={() => setShowFilters(f => !f)} className="disc-icon-btn"
            style={{ background: showFilters ? 'rgba(201,168,76,0.18)' : c.card, border: `1px solid ${activeFilterCount > 0 ? c.gold : c.border}`, color: activeFilterCount > 0 ? c.gold : c.sepia, borderRadius: '8px', cursor: 'pointer', fontFamily: 'Raleway, sans-serif', fontSize: '0.68rem', fontWeight: 600, letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: '0.4rem', transition: 'all 0.2s' }}>
            ⚙<span className="btn-label"> Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}</span>
          </button>
        </div>

        {/* Filter panel */}
        {showFilters && (
          <div style={{ marginTop: '0.6rem', background: c.card, border: `1px solid ${c.border}`, borderRadius: '10px', padding: '1.1rem 1.25rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.75rem' }}>

              {/* Location */}
              <div>
                <label style={{ display: 'block', fontFamily: 'Raleway, sans-serif', fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: c.gold, marginBottom: '0.35rem' }}>📍 Location</label>
                <input type="text" value={fLocation} onChange={e => setFLocation(e.target.value)}
                  placeholder="City or country…" className="disc-filter-inp"
                  style={{ width: '100%', padding: '0.55rem 0.75rem', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(201,168,76,0.4)', color: c.ivory, fontFamily: '"Cormorant Garamond", serif', fontSize: '0.95rem', borderRadius: '6px', outline: 'none', boxSizing: 'border-box' }}
                  onFocus={e => (e.target.style.borderColor = c.gold)}
                  onBlur={e => (e.target.style.borderColor = c.border)} />
              </div>

              {/* Age range */}
              <div>
                <label style={{ display: 'block', fontFamily: 'Raleway, sans-serif', fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: c.gold, marginBottom: '0.35rem' }}>🎂 Age Range</label>
                <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                  <input type="number" min={18} max={99} value={fAgeMin} onChange={e => setFAgeMin(e.target.value)}
                    placeholder="Min" className="disc-filter-inp"
                    style={{ flex: 1, padding: '0.55rem 0.5rem', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(201,168,76,0.4)', color: c.ivory, fontFamily: '"Cormorant Garamond", serif', fontSize: '0.95rem', borderRadius: '6px', outline: 'none', textAlign: 'center', boxSizing: 'border-box' }}
                    onFocus={e => (e.target.style.borderColor = c.gold)}
                    onBlur={e => (e.target.style.borderColor = c.border)} />
                  <span style={{ color: c.sepia, fontSize: '0.8rem', flexShrink: 0 }}>–</span>
                  <input type="number" min={18} max={99} value={fAgeMax} onChange={e => setFAgeMax(e.target.value)}
                    placeholder="Max" className="disc-filter-inp"
                    style={{ flex: 1, padding: '0.55rem 0.5rem', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(201,168,76,0.4)', color: c.ivory, fontFamily: '"Cormorant Garamond", serif', fontSize: '0.95rem', borderRadius: '6px', outline: 'none', textAlign: 'center', boxSizing: 'border-box' }}
                    onFocus={e => (e.target.style.borderColor = c.gold)}
                    onBlur={e => (e.target.style.borderColor = c.border)} />
                </div>
              </div>

              {/* Religion */}
              <div>
                <label style={{ display: 'block', fontFamily: 'Raleway, sans-serif', fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: c.gold, marginBottom: '0.35rem' }}>🕊 Religion</label>
                <select value={fReligion} onChange={e => setFReligion(e.target.value)}
                  style={{ width: '100%', padding: '0.55rem 0.75rem', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(201,168,76,0.4)', color: fReligion ? c.ivory : '#a0b0c8', fontFamily: '"Cormorant Garamond", serif', fontSize: '0.95rem', borderRadius: '6px', outline: 'none', boxSizing: 'border-box', cursor: 'pointer' }}
                  onFocus={e => (e.target.style.borderColor = c.gold)}
                  onBlur={e => (e.target.style.borderColor = c.border)}>
                  <option value="">Any religion</option>
                  {religions.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>

              {/* Education */}
              <div>
                <label style={{ display: 'block', fontFamily: 'Raleway, sans-serif', fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: c.gold, marginBottom: '0.35rem' }}>🎓 Education</label>
                <select value={fEducation} onChange={e => setFEducation(e.target.value)}
                  style={{ width: '100%', padding: '0.55rem 0.75rem', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(201,168,76,0.4)', color: fEducation ? c.ivory : '#a0b0c8', fontFamily: '"Cormorant Garamond", serif', fontSize: '0.95rem', borderRadius: '6px', outline: 'none', boxSizing: 'border-box', cursor: 'pointer' }}
                  onFocus={e => (e.target.style.borderColor = c.gold)}
                  onBlur={e => (e.target.style.borderColor = c.border)}>
                  <option value="">Any level</option>
                  {educations.map(e => <option key={e} value={e}>{e}</option>)}
                </select>
              </div>

              {/* Caste */}
              <div>
                <label style={{ display: 'block', fontFamily: 'Raleway, sans-serif', fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: c.gold, marginBottom: '0.35rem' }}>🏷 Caste</label>
                <input type="text" value={fCaste} onChange={e => setFCaste(e.target.value)}
                  placeholder="e.g. Brahmin, Kshatriya…" className="disc-filter-inp"
                  style={{ width: '100%', padding: '0.55rem 0.75rem', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(201,168,76,0.4)', color: c.ivory, fontFamily: '"Cormorant Garamond", serif', fontSize: '0.95rem', borderRadius: '6px', outline: 'none', boxSizing: 'border-box' }}
                  onFocus={e => (e.target.style.borderColor = c.gold)}
                  onBlur={e => (e.target.style.borderColor = c.border)}
                  onKeyDown={e => e.key === 'Enter' && applyFilters()} />
              </div>

              {/* Occupation */}
              <div>
                <label style={{ display: 'block', fontFamily: 'Raleway, sans-serif', fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: c.gold, marginBottom: '0.35rem' }}>💼 Occupation</label>
                <input type="text" value={fOccupation} onChange={e => setFOccupation(e.target.value)}
                  placeholder="e.g. Engineer, Doctor…" className="disc-filter-inp"
                  style={{ width: '100%', padding: '0.55rem 0.75rem', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(201,168,76,0.4)', color: c.ivory, fontFamily: '"Cormorant Garamond", serif', fontSize: '0.95rem', borderRadius: '6px', outline: 'none', boxSizing: 'border-box' }}
                  onFocus={e => (e.target.style.borderColor = c.gold)}
                  onBlur={e => (e.target.style.borderColor = c.border)}
                  onKeyDown={e => e.key === 'Enter' && applyFilters()} />
              </div>

            </div>

            {/* Search + Clear row */}
            <div style={{ marginTop: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap' }}>
              {activeFilterCount > 0 ? (
                <button onClick={clearFilters}
                  style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.62rem', fontWeight: 600, letterSpacing: '0.08em', color: '#f87171', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
                  Clear all filters
                </button>
              ) : <span />}
              <button onClick={applyFilters}
                style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#0d1f3c', background: c.gold, border: 'none', borderRadius: '6px', padding: '0.65rem 1.75rem', cursor: 'pointer', transition: 'opacity 0.2s' }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '1')}>
                🔍 Search
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Meeting usage counter — visible only for paid members */}
      {canMeet && meetingsTotal > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.65rem 1.25rem', background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.2)', borderRadius: '8px' }}>
            <span style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: c.ivoryDim }}>
              Meeting requests this month
            </span>
            <div style={{ display: 'flex', gap: '0.4rem' }}>
              {Array.from({ length: meetingsTotal }).map((_, i) => (
                <div key={i} style={{ width: 10, height: 10, borderRadius: '50%', background: i < meetingsUsed ? c.gold : 'rgba(201,168,76,0.2)', border: `1px solid ${i < meetingsUsed ? c.gold : 'rgba(201,168,76,0.3)'}` }} />
              ))}
            </div>
            <span style={{ fontFamily: '"Playfair Display", serif', fontSize: '0.9rem', fontWeight: 700, color: meetingsLeft === 0 ? '#f87171' : '#4ade80' }}>
              {meetingsLeft} remaining
            </span>
          </div>
        </div>
      )}

      {/* Find My Match button */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.75rem' }}>
        <button onClick={handleAiMatch} disabled={aiLoading} className="ai-btn"
          style={{
            background: aiLoading ? 'rgba(201,168,76,0.15)' : 'linear-gradient(135deg, rgba(201,168,76,0.2) 0%, rgba(201,168,76,0.35) 100%)',
            border: `1.5px solid ${c.gold}`, color: c.gold,
            fontFamily: 'Raleway, sans-serif', fontSize: '0.8rem', fontWeight: 700,
            letterSpacing: '0.18em', textTransform: 'uppercase', borderRadius: '10px',
            cursor: aiLoading ? 'default' : 'pointer',
            boxShadow: aiLoading ? 'none' : '0 0 28px rgba(201,168,76,0.18)',
          }}>
          {aiLoading
            ? <><span style={{ animation: 'spin 1s linear infinite', display: 'inline-block', fontSize: '1rem' }}>✦</span> Analysing your profile…</>
            : <><span style={{ fontSize: '1.1rem' }}>✨</span> Find My Match</>}
        </button>
      </div>

      {/* AI error */}
      {aiError && (
        <div style={{ marginBottom: '1.5rem', padding: '0.75rem 1rem', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: '8px', color: '#f87171', fontFamily: '"Cormorant Garamond", serif', fontSize: '0.95rem' }}>
          {aiError}
        </div>
      )}

      {/* AI Match Results */}
      {aiMatches && (() => {
        const strong = aiMatches.filter(m => m.score >= 50)
        return (
          <div style={{ marginBottom: '2rem', background: c.card, border: `1px solid ${c.border}`, borderRadius: '14px', overflow: 'hidden', boxShadow: '0 8px 40px rgba(0,0,0,0.4)' }}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: `1px solid rgba(201,168,76,0.12)`, background: 'linear-gradient(to right, rgba(201,168,76,0.08), transparent)' }}>
              <p style={{ fontFamily: 'var(--font-playfair, "Playfair Display", serif)', fontSize: '1.1rem', fontWeight: 600, color: c.ivory, margin: '0 0 0.2rem' }}>✨ Your Matches</p>
              <p style={{ fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontSize: '0.88rem', color: c.sepia, margin: 0 }}>
                {strong.length > 0
                  ? `${strong.length} match${strong.length > 1 ? 'es' : ''} with 50+ compatibility score — tap any result to view their full profile`
                  : 'No strong matches found right now — check back as more members join'}
              </p>
            </div>

            {strong.length === 0 && (
              <div style={{ padding: '2rem', textAlign: 'center', color: c.sepia, fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontSize: '1.1rem' }}>
                None of the current profiles scored 50 or above for you. Try updating your preferences or check back later.
              </div>
            )}

            {strong.map((m, i) => (
              <div key={m.id} onClick={() => setSelected(m.profile)}
                style={{ padding: '1.25rem 1.5rem', borderBottom: i < strong.length - 1 ? `1px solid rgba(201,168,76,0.08)` : 'none', cursor: 'pointer', transition: 'background 0.2s' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(201,168,76,0.04)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>

                {/* Match headline */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.6rem', flexWrap: 'wrap' }}>
                  <span style={{ fontFamily: '"Courier New", monospace', fontSize: '0.95rem', fontWeight: 900, color: c.gold, letterSpacing: '0.08em', background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.25)', padding: '0.25rem 0.6rem', borderRadius: '6px' }}>
                    {profileId(m.id)}
                  </span>
                  <span style={{ fontFamily: 'var(--font-playfair, "Playfair Display", serif)', fontWeight: 600, color: c.ivory, fontSize: '1.2rem' }}>
                    {maskName(m.profile?.full_name ?? '')}
                  </span>
                  <span style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.75rem', color: c.sepia }}>
                    {m.profile?.age} yrs · {m.profile?.city}
                  </span>
                  <span style={{ marginLeft: 'auto', fontFamily: 'Raleway, sans-serif', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.06em', color: scoreColor(m.score), background: `${scoreColor(m.score)}18`, border: `1px solid ${scoreColor(m.score)}40`, padding: '0.3rem 0.75rem', borderRadius: '20px', whiteSpace: 'nowrap' }}>
                    {scoreLabel(m.score)}
                  </span>
                </div>

                {/* Score bar */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                  <div style={{ flex: 1, height: '7px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px' }}>
                    <div style={{ height: '100%', width: `${m.score}%`, background: scoreGradient(m.score), borderRadius: '4px', transition: 'width 0.6s ease' }} />
                  </div>
                  <span style={{ fontFamily: '"Playfair Display", serif', fontSize: '1.3rem', fontWeight: 700, color: scoreColor(m.score), minWidth: '60px', textAlign: 'right' }}>
                    {m.score}/100
                  </span>
                </div>

                {/* Reasons — colour coded */}
                <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                  {m.reasons.map((r, j) => {
                    const positive = isPositiveReason(r)
                    return (
                      <li key={j} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', padding: '0.5rem 0.75rem', borderRadius: '6px', background: positive ? 'rgba(74,222,128,0.07)' : 'rgba(255,255,255,0.03)', border: `1px solid ${positive ? 'rgba(74,222,128,0.2)' : 'rgba(255,255,255,0.06)'}` }}>
                        <span style={{ fontSize: '0.95rem', marginTop: '0.05rem', flexShrink: 0 }}>{positive ? '✅' : '⚠️'}</span>
                        <span style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '1.1rem', color: positive ? '#a7f3c0' : c.ivoryDim, lineHeight: 1.6, fontWeight: positive ? 600 : 400 }}>{r}</span>
                      </li>
                    )
                  })}
                </ul>

                <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.68rem', fontWeight: 600, letterSpacing: '0.1em', color: c.gold, textTransform: 'uppercase', margin: '0.85rem 0 0', textAlign: 'right' }}>
                  Tap to view full profile →
                </p>
              </div>
            ))}
          </div>
        )
      })()}

      {/* Your Profile preview */}
      {ownProfile && (
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.6rem' }}>
            <span style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#4ade80', background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.3)', borderRadius: '20px', padding: '0.25rem 0.75rem' }}>
              👤 Your Profile — this is how others see you
            </span>
          </div>
          <div style={{ opacity: 1 }}>
            <CompactCard profile={ownProfile} onClick={() => setSelected(ownProfile)} isOwn />
          </div>
          <div style={{ height: '1px', background: 'linear-gradient(to right, rgba(201,168,76,0.3), transparent)', margin: '1.25rem 0' }} />
        </div>
      )}

      {/* Profile count */}
      <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.65rem', color: c.sepia, letterSpacing: '0.08em', marginBottom: '1rem' }}>
        {filtered.length} {filtered.length === 1 ? 'profile' : 'profiles'}{(search || activeFilterCount > 0) ? ' found' : ''}
        {activeFilterCount > 0 && <span style={{ color: c.gold }}> · {activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''} active</span>}
      </p>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 0', color: c.sepia, fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontSize: '1.1rem' }}>
          {showSaved ? 'No saved profiles yet. Tap ★ on any profile to save it.' : 'No profiles match your search.'}
        </div>
      ) : (
        <div className="disc-grid">
          {filtered.map(p => (
            <CompactCard key={p.id} profile={p} onClick={() => setSelected(p)} isSaved={savedIds.has(p.id)} />
          ))}
        </div>
      )}

      {/* Expanded modal */}
      {selected && (
        <div className="disc-modal-overlay" onClick={e => { if (e.target === e.currentTarget) setSelected(null) }}>
          <div className="disc-modal-inner" style={{ position: 'relative', width: '100%', maxWidth: '820px', maxHeight: '93vh', overflowY: 'auto', borderRadius: '16px' }}>
            <button onClick={() => setSelected(null)}
              style={{ position: 'sticky', top: '0.75rem', float: 'right', marginRight: '0.75rem', zIndex: 10, width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(14,26,53,0.9)', border: `1px solid ${c.border}`, color: c.ivoryDim, fontSize: '1.1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              ✕
            </button>
            {ownProfile && selected.id === ownProfile.id && (
              <div style={{ padding: '0.75rem 1.25rem', background: 'rgba(74,222,128,0.08)', borderBottom: '1px solid rgba(74,222,128,0.2)', fontFamily: 'Raleway, sans-serif', fontSize: '0.72rem', fontWeight: 600, color: '#4ade80', letterSpacing: '0.06em' }}>
                👤 This is your profile — exactly as other members see it
              </div>
            )}
            <ProfileCard profile={selected} canReveal={ownProfile?.id !== selected.id && canReveal} canMeet={ownProfile?.id !== selected.id && canMeet} meetingsLeft={meetingsLeft} isOwnProfile={ownProfile?.id === selected.id} isSaved={savedIds.has(selected.id)} onToggleSave={nowSaved => handleToggleSave(selected.id, nowSaved)} />
          </div>
        </div>
      )}
    </>
  )
}

function CompactCard({ profile, onClick, isOwn, isSaved }: { profile: ProfileData; onClick: () => void; isOwn?: boolean; isSaved?: boolean }) {
  const initials = profile.full_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
  const pid = '#' + profile.id.slice(0, 8).toUpperCase()
  return (
    <div onClick={onClick}
      style={{ background: c.card, border: `1px solid ${isOwn ? 'rgba(74,222,128,0.35)' : c.border}`, borderRadius: '12px', overflow: 'hidden', cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s', position: 'relative', maxWidth: isOwn ? '220px' : undefined }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.5)' }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none' }}>

      {isOwn && (
        <div style={{ position: 'absolute', top: '0.4rem', left: '0.4rem', zIndex: 2, fontFamily: 'Raleway, sans-serif', fontSize: '0.55rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#fff', background: 'rgba(74,222,128,0.85)', borderRadius: '4px', padding: '0.15rem 0.45rem' }}>
          You
        </div>
      )}
      {isSaved && (
        <div style={{ position: 'absolute', top: '0.4rem', right: '0.4rem', zIndex: 2, color: '#c9a84c', fontSize: '0.9rem', lineHeight: 1, background: 'rgba(0,0,0,0.55)', borderRadius: '4px', padding: '0.15rem 0.3rem' }}>
          ★
        </div>
      )}
      {profile.back_photo_1_url ? (
        <div style={{ aspectRatio: '1', overflow: 'hidden' }}>
          <img src={profile.back_photo_1_url} alt={maskName(profile.full_name)} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        </div>
      ) : (
        <div style={{ aspectRatio: '1', background: 'linear-gradient(135deg, #152d4e, #1e3d66)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontFamily: '"Playfair Display", serif', fontStyle: 'italic', fontSize: '2rem', color: 'rgba(201,168,76,0.45)' }}>{initials}</span>
        </div>
      )}

      <div className="compact-card-info">
        <p className="compact-card-name" style={{ fontFamily: '"Playfair Display", serif', fontWeight: 600, fontSize: '0.9rem', color: c.ivory, margin: '0 0 0.15rem', lineHeight: 1.2 }}>
          {maskName(profile.full_name)}
        </p>
        <p className="compact-card-sub" style={{ fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontSize: '0.82rem', color: c.sepia, margin: '0 0 0.3rem' }}>
          {profile.age} · {profile.city}
        </p>
        {/* Religion + Caste — clearly visible on separate line */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', marginBottom: '0.3rem' }}>
          {profile.religion && (
            <span style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.52rem', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', padding: '0.12rem 0.45rem', background: 'rgba(201,168,76,0.12)', border: `1px solid rgba(201,168,76,0.28)`, color: c.gold, borderRadius: '20px' }}>
              {profile.religion}
            </span>
          )}
          {profile.caste && (
            <span style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.52rem', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', padding: '0.12rem 0.45rem', background: 'rgba(201,168,76,0.07)', border: `1px solid rgba(201,168,76,0.18)`, color: c.gold, borderRadius: '20px' }}>
              {profile.caste}
            </span>
          )}
        </div>
        <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.58rem', color: c.ivoryDim, margin: '0 0 0.3rem', letterSpacing: '0.04em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {profile.occupation}
        </p>
        <div style={{ display: 'inline-flex', alignItems: 'center', padding: '0.12rem 0.45rem', background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.2)', borderRadius: '4px' }}>
          <span style={{ fontFamily: '"Courier New", monospace', fontSize: '0.65rem', fontWeight: 700, color: c.gold, letterSpacing: '0.06em' }}>{pid}</span>
        </div>
      </div>
    </div>
  )
}
