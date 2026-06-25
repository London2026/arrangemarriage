'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { verifyMember, rejectMemberId } from './actions'

const c = {
  navy: '#0d1f3c', navy2: '#122d52', navy3: '#1a3a6b',
  gold: '#c9a84c', gold2: '#e8c96b',
  text: '#e8e3d8', text2: 'rgba(232,227,216,0.65)', text3: 'rgba(232,227,216,0.35)',
  border: 'rgba(201,168,76,0.2)', border2: 'rgba(201,168,76,0.08)',
  card: 'rgba(255,255,255,0.04)', card2: 'rgba(255,255,255,0.07)',
  green: '#2e7d52', amber: '#c97a2e', rose: '#9e2a2b',
}

type Tab = 'dashboard' | 'members' | 'meetings' | 'reveals' | 'subscriptions' | 'id_verification' | 'analytics'

interface IdVerification {
  id: string
  full_name: string
  id_country: string
  doc_url: string | null
  created_at: string
}

interface CountItem { label: string; count: number }

interface Props {
  stats: { totalMembers: number; newThisWeek: number; activeSubscribers: number; revealsToday: number; pendingMeetings: number }
  members: Record<string, unknown>[]
  meetings: Record<string, unknown>[]
  reveals: Record<string, unknown>[]
  ratings: Record<string, unknown>[]
  planCounts: Record<string, number>
  idVerifications: IdVerification[]
  earnings: { daily: number; weekly: number; monthly: number; yearly: number }
  locationCounts: CountItem[]
  casteCounts: CountItem[]
  religionCounts: CountItem[]
  defaultTab?: Tab
}

const TABS: { id: Tab; icon: string; label: string }[] = [
  { id: 'dashboard',       icon: '◼',  label: 'Dashboard' },
  { id: 'members',         icon: '👤', label: 'Members' },
  { id: 'meetings',        icon: '🎥', label: 'Meetings' },
  { id: 'reveals',         icon: '💘', label: 'Reveals' },
  { id: 'subscriptions',   icon: '💳', label: 'Subscriptions' },
  { id: 'analytics',       icon: '📊', label: 'Analytics' },
  { id: 'id_verification', icon: '🪪', label: 'ID Verify' },
]

function rupees(n: number) {
  return '₹' + n.toLocaleString('en-IN')
}

function fmt(dateStr: string) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function planBadge(plan: string) {
  const styles: Record<string, { bg: string; color: string }> = {
    free:     { bg: 'rgba(232,227,216,0.08)', color: c.text3 },
    starter:  { bg: 'rgba(201,168,76,0.15)',  color: c.gold  },
    standard: { bg: 'rgba(46,125,82,0.2)',    color: '#4ade80' },
  }
  const s = styles[plan] ?? styles.free
  return (
    <span style={{ padding: '0.2rem 0.6rem', borderRadius: 20, fontSize: '0.7rem', fontWeight: 700,
      letterSpacing: '0.08em', textTransform: 'uppercase', background: s.bg, color: s.color }}>
      {plan ?? 'free'}
    </span>
  )
}

function statusBadge(status: string) {
  const map: Record<string, { bg: string; color: string }> = {
    pending:   { bg: 'rgba(201,122,46,0.2)',  color: '#fbbf24' },
    accepted:  { bg: 'rgba(46,125,82,0.2)',   color: '#4ade80' },
    declined:  { bg: 'rgba(158,42,43,0.2)',   color: '#f87171' },
    cancelled: { bg: 'rgba(120,120,120,0.15)', color: '#9ca3af' },
  }
  const s = map[status] ?? map.pending
  return (
    <span style={{ padding: '0.2rem 0.6rem', borderRadius: 20, fontSize: '0.7rem', fontWeight: 700,
      letterSpacing: '0.08em', textTransform: 'uppercase', background: s.bg, color: s.color }}>
      {status}
    </span>
  )
}

function StatCard({ icon, label, value, sub }: { icon: string; label: string; value: number | string; sub?: string }) {
  return (
    <div style={{ background: c.card2, border: `1px solid ${c.border}`, borderRadius: 8, padding: '1.25rem 1.5rem' }}>
      <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{icon}</div>
      <div style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.65rem', letterSpacing: '0.2em',
        textTransform: 'uppercase', color: c.text3, marginBottom: '0.3rem' }}>{label}</div>
      <div style={{ fontFamily: '"Playfair Display", serif', fontSize: '2.2rem', fontWeight: 700,
        color: c.gold, lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: '0.72rem', color: c.text3, marginTop: '0.3rem' }}>{sub}</div>}
    </div>
  )
}

function BarChart({ data, color }: { data: CountItem[]; color: string }) {
  if (data.length === 0) {
    return <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.8rem', color: c.text3 }}>No data yet</p>
  }
  const max = Math.max(...data.map(d => d.count))
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
      {data.map(d => (
        <div key={d.label} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: 150, flexShrink: 0, fontFamily: 'Raleway, sans-serif', fontSize: '0.78rem',
            color: c.text2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={d.label}>{d.label}</div>
          <div style={{ flex: 1, background: c.card, borderRadius: 4, height: 18, overflow: 'hidden' }}>
            <div style={{ width: `${(d.count / max) * 100}%`, minWidth: 4, background: color, height: '100%', borderRadius: 4 }} />
          </div>
          <div style={{ width: 28, textAlign: 'right', fontFamily: '"Playfair Display", serif', fontSize: '0.85rem',
            fontWeight: 700, color: c.gold, flexShrink: 0 }}>{d.count}</div>
        </div>
      ))}
    </div>
  )
}

const th: React.CSSProperties = {
  fontFamily: 'Raleway, sans-serif', fontSize: '0.62rem', fontWeight: 700,
  letterSpacing: '0.18em', textTransform: 'uppercase', color: c.text3,
  padding: '0.75rem 1rem', textAlign: 'left', borderBottom: `1px solid ${c.border2}`,
  whiteSpace: 'nowrap',
}
const td: React.CSSProperties = {
  padding: '0.75rem 1rem', fontSize: '0.82rem', color: c.text2,
  borderBottom: `1px solid ${c.border2}`, whiteSpace: 'nowrap',
}

export default function AdminClient({ stats, members, meetings, reveals, ratings, planCounts, idVerifications, earnings, locationCounts, casteCounts, religionCounts, defaultTab }: Props) {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>(defaultTab ?? 'dashboard')
  const [idDocs, setIdDocs] = useState<IdVerification[]>(idVerifications)
  const [idAction, setIdAction] = useState<Record<string, 'verifying' | 'rejecting' | 'done'>>({})

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  async function handleVerify(profileId: string) {
    setIdAction(p => ({ ...p, [profileId]: 'verifying' }))
    try {
      await verifyMember(profileId)
      setIdDocs(d => d.filter(x => x.id !== profileId))
    } finally {
      setIdAction(p => { const n = { ...p }; delete n[profileId]; return n })
    }
  }

  async function handleReject(profileId: string) {
    setIdAction(p => ({ ...p, [profileId]: 'rejecting' }))
    try {
      await rejectMemberId(profileId)
      setIdDocs(d => d.filter(x => x.id !== profileId))
    } finally {
      setIdAction(p => { const n = { ...p }; delete n[profileId]; return n })
    }
  }

  const sectionTitle = (title: string, count?: number) => (
    <div style={{ marginBottom: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem' }}>
        <h2 style={{ fontFamily: '"Playfair Display", serif', fontSize: '1.5rem', color: c.text, margin: 0 }}>{title}</h2>
        {count !== undefined && (
          <span style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.65rem', color: c.text3,
            letterSpacing: '0.15em', textTransform: 'uppercase' }}>{count} records</span>
        )}
      </div>
      <div style={{ height: 1, background: `linear-gradient(to right, ${c.gold}, transparent)`, marginTop: '0.5rem' }} />
    </div>
  )

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: c.navy, color: c.text }}>
      <style>{`
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${c.border}; border-radius: 2px; }
        .admin-row:hover td { background: ${c.card2}; }
        @media (max-width: 768px) {
          .admin-sidebar { width: 56px !important; }
          .admin-sidebar .nav-label { display: none; }
          .admin-sidebar .brand-text { display: none; }
          .admin-main { margin-left: 56px !important; }
        }
      `}</style>

      {/* Sidebar */}
      <aside className="admin-sidebar" style={{ width: 220, minHeight: '100vh', background: 'rgba(0,0,0,0.3)',
        borderRight: `1px solid ${c.border}`, position: 'fixed', top: 0, left: 0, zIndex: 50,
        display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '1.5rem 1.25rem 1rem', borderBottom: `1px solid ${c.border}` }}>
          <span className="brand-text" style={{ fontFamily: '"Playfair Display", serif', fontStyle: 'italic',
            fontSize: '1.25rem', color: c.gold, display: 'block' }}>Arrange Marriage</span>
          <span className="brand-text" style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.55rem',
            letterSpacing: '0.3em', textTransform: 'uppercase', color: c.text3 }}>Admin Panel</span>
        </div>
        <nav style={{ flex: 1, padding: '0.75rem 0' }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', width: '100%',
                padding: '0.7rem 1.25rem', border: 'none', cursor: 'pointer',
                borderLeft: `2px solid ${tab === t.id ? c.gold : 'transparent'}`,
                background: tab === t.id ? 'rgba(201,168,76,0.06)' : 'transparent',
                color: tab === t.id ? c.gold : c.text2,
                fontFamily: 'Raleway, sans-serif', fontSize: '0.82rem', fontWeight: 500,
                transition: 'all 0.15s', textAlign: 'left' }}>
              <span style={{ fontSize: '1rem', width: 18, textAlign: 'center', flexShrink: 0 }}>{t.icon}</span>
              <span className="nav-label" style={{ flex: 1 }}>{t.label}</span>
              {t.id === 'id_verification' && idDocs.length > 0 && (
                <span className="nav-label" style={{ minWidth: 20, height: 20, borderRadius: '50%', background: '#f59e0b', color: '#0d1f3c', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 700, flexShrink: 0 }}>
                  {idDocs.length}
                </span>
              )}
            </button>
          ))}
        </nav>
        <div style={{ padding: '1rem 1.25rem', borderTop: `1px solid ${c.border}`, display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          <a href="/discover" style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.72rem',
            color: c.text3, textDecoration: 'none', letterSpacing: '0.1em' }}>← Back to app</a>
          <button onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem',
            background: 'none', border: 'none', cursor: 'pointer', padding: 0,
            fontFamily: 'Raleway, sans-serif', fontSize: '0.72rem', color: '#f87171', letterSpacing: '0.1em' }}>
            <span>⎋</span> <span className="nav-label">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="admin-main" style={{ marginLeft: 220, flex: 1, padding: '2rem 2.5rem', minWidth: 0 }}>

        {/* ── DASHBOARD ── */}
        {tab === 'dashboard' && (
          <div>
            {sectionTitle('Dashboard')}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2.5rem' }}>
              <StatCard icon="👤" label="Total Members"      value={stats.totalMembers}      sub="completed onboarding" />
              <StatCard icon="✨" label="New This Week"       value={stats.newThisWeek}       sub="joined last 7 days" />
              <StatCard icon="💳" label="Paid Subscribers"    value={stats.activeSubscribers} sub="starter + standard" />
              <StatCard icon="💘" label="Reveals Today"       value={stats.revealsToday}      sub="face photos seen" />
              <StatCard icon="⏳" label="Pending Meetings"    value={stats.pendingMeetings}   sub="awaiting response" />
              <StatCard icon="🪪" label="ID Pending"          value={idDocs.length}           sub="awaiting verification" />
            </div>

            {/* Recent members */}
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ fontFamily: '"Playfair Display", serif', fontSize: '1.1rem', color: c.text,
                margin: '0 0 1rem' }}>Recent Members</h3>
              <div style={{ overflowX: 'auto', border: `1px solid ${c.border2}`, borderRadius: 6 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>{['Name','Age','Location','Plan','Joined'].map(h => <th key={h} style={th}>{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {members.filter(m => m.onboarding_complete).slice(0, 10).map((m: any) => (
                      <tr key={m.id} className="admin-row">
                        <td style={td}>{m.full_name ?? '—'}</td>
                        <td style={td}>{m.age ?? '—'}</td>
                        <td style={td}>{[m.city, m.country].filter(Boolean).join(', ') || '—'}</td>
                        <td style={td}>{planBadge(m.plan ?? 'free')}</td>
                        <td style={td}>{fmt(m.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── MEMBERS ── */}
        {tab === 'members' && (
          <div>
            {sectionTitle('Members', members.filter((m: any) => m.onboarding_complete).length)}
            <div style={{ overflowX: 'auto', border: `1px solid ${c.border2}`, borderRadius: 6 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>{['Name','Age','Gender','Location','Religion','Plan','Phone','Joined'].map(h => <th key={h} style={th}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {members.filter((m: any) => m.onboarding_complete).map((m: any) => (
                    <tr key={m.id} className="admin-row">
                      <td style={{ ...td, color: c.text, fontWeight: 500 }}>{m.full_name ?? '—'}</td>
                      <td style={td}>{m.age ?? '—'}</td>
                      <td style={td}>{m.gender ?? '—'}</td>
                      <td style={td}>{[m.city, m.country].filter(Boolean).join(', ') || '—'}</td>
                      <td style={td}>{m.religion ?? '—'}</td>
                      <td style={td}>{planBadge(m.plan ?? 'free')}</td>
                      <td style={td}>
                        <span style={{ color: m.phone ? '#4ade80' : c.text3, fontSize: '0.75rem' }}>
                          {m.phone ? '✓ ' + m.phone : '—'}
                        </span>
                      </td>
                      <td style={td}>{fmt(m.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── MEETINGS ── */}
        {tab === 'meetings' && (
          <div>
            {sectionTitle('Video Meetings', meetings.length)}
            <div style={{ overflowX: 'auto', border: `1px solid ${c.border2}`, borderRadius: 6, marginBottom: '2.5rem' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>{['Requester','Recipient','Status','Date','Time','Requested'].map(h => <th key={h} style={th}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {meetings.map((m: any) => (
                    <tr key={m.id} className="admin-row">
                      <td style={{ ...td, color: c.text }}>{m.requester_name}</td>
                      <td style={{ ...td, color: c.text }}>{m.recipient_name}</td>
                      <td style={td}>{statusBadge(m.status)}</td>
                      <td style={td}>{m.preferred_date ? fmt(m.preferred_date) : '—'}</td>
                      <td style={td}>{m.preferred_time ?? '—'}</td>
                      <td style={td}>{fmt(m.created_at)}</td>
                    </tr>
                  ))}
                  {meetings.length === 0 && (
                    <tr><td colSpan={6} style={{ ...td, textAlign: 'center', color: c.text3, padding: '2rem' }}>No meetings yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Meeting ratings — visible to admin only */}
            <h3 style={{ fontFamily: '"Playfair Display", serif', fontSize: '1.1rem', color: c.text, margin: '0 0 0.5rem' }}>
              Member Ratings
            </h3>
            <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.72rem', color: c.text3, margin: '0 0 1rem', lineHeight: 1.6 }}>
              Submitted privately by members after their meeting concluded. Not visible to other members.
            </p>
            {ratings.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', background: c.card, border: `1px solid ${c.border2}`, borderRadius: 6 }}>
                <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.8rem', color: c.text3, margin: 0 }}>No ratings submitted yet</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto', border: `1px solid ${c.border2}`, borderRadius: 6 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>{['Rated by','Meeting','Meeting Date','Rating','Submitted'].map(h => <th key={h} style={th}>{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {(ratings as any[]).map(r => (
                      <tr key={r.id} className="admin-row">
                        <td style={{ ...td, color: c.text }}>{r.rater_name}</td>
                        <td style={td}>{r.meeting_requester} ↔ {r.meeting_recipient}</td>
                        <td style={td}>{r.meeting_date ? fmt(r.meeting_date) : '—'}</td>
                        <td style={td}>
                          <span style={{ color: c.gold, fontSize: '1rem', letterSpacing: '0.05em' }}>
                            {'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}
                          </span>
                          <span style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.7rem', color: c.text3, marginLeft: '0.4rem' }}>
                            ({r.rating}/5)
                          </span>
                        </td>
                        <td style={td}>{fmt(r.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── REVEALS ── */}
        {tab === 'reveals' && (
          <div>
            {sectionTitle('Photo Reveals', reveals.length)}
            <div style={{ overflowX: 'auto', border: `1px solid ${c.border2}`, borderRadius: 6 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>{['Viewer','Profile Revealed','Date & Time'].map(h => <th key={h} style={th}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {reveals.map((r: any) => (
                    <tr key={r.id} className="admin-row">
                      <td style={{ ...td, color: c.text }}>{r.viewer_name}</td>
                      <td style={{ ...td, color: c.text }}>{r.viewed_name}</td>
                      <td style={td}>
                        {new Date(r.revealed_at).toLocaleString('en-GB', {
                          day: 'numeric', month: 'short', year: 'numeric',
                          hour: '2-digit', minute: '2-digit',
                        })}
                      </td>
                    </tr>
                  ))}
                  {reveals.length === 0 && (
                    <tr><td colSpan={3} style={{ ...td, textAlign: 'center', color: c.text3, padding: '2rem' }}>No reveals yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── ID VERIFICATION ── */}
        {tab === 'id_verification' && (
          <div>
            {sectionTitle('ID Verification', idDocs.length)}
            {idDocs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '4rem 2rem', background: c.card, border: `1px solid ${c.border2}`, borderRadius: 8 }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>✅</div>
                <p style={{ fontFamily: '"Playfair Display", serif', fontSize: '1.2rem', color: c.text, margin: '0 0 0.4rem' }}>All clear</p>
                <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.8rem', color: c.text3 }}>No pending ID verifications at this time.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {idDocs.map(doc => (
                  <div key={doc.id} style={{ background: c.card2, border: `1px solid ${c.border}`, borderRadius: 8, overflow: 'hidden' }}>
                    <div style={{ padding: '1.25rem 1.5rem', borderBottom: `1px solid ${c.border2}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                      <div>
                        <p style={{ fontFamily: '"Playfair Display", serif', fontSize: '1.1rem', color: c.text, margin: '0 0 0.25rem' }}>{doc.full_name}</p>
                        <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.72rem', color: c.text3, margin: 0, letterSpacing: '0.08em' }}>
                          ID Country: <strong style={{ color: c.text2 }}>{doc.id_country}</strong> · Submitted: {fmt(doc.created_at)}
                        </p>
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button onClick={() => handleVerify(doc.id)} disabled={!!idAction[doc.id]}
                          style={{ padding: '0.5rem 1.25rem', background: 'rgba(46,125,82,0.2)', border: '1px solid rgba(46,125,82,0.5)', color: '#4ade80', fontFamily: 'Raleway, sans-serif', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', borderRadius: 4, cursor: idAction[doc.id] ? 'default' : 'pointer', opacity: idAction[doc.id] ? 0.6 : 1 }}>
                          {idAction[doc.id] === 'verifying' ? 'Verifying…' : '✅ Verify'}
                        </button>
                        <button onClick={() => handleReject(doc.id)} disabled={!!idAction[doc.id]}
                          style={{ padding: '0.5rem 1.25rem', background: 'rgba(158,42,43,0.2)', border: '1px solid rgba(158,42,43,0.5)', color: '#f87171', fontFamily: 'Raleway, sans-serif', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', borderRadius: 4, cursor: idAction[doc.id] ? 'default' : 'pointer', opacity: idAction[doc.id] ? 0.6 : 1 }}>
                          {idAction[doc.id] === 'rejecting' ? 'Rejecting…' : '✗ Reject'}
                        </button>
                      </div>
                    </div>
                    {doc.doc_url ? (
                      <div style={{ padding: '1rem 1.5rem' }}>
                        <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.65rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: c.text3, margin: '0 0 0.6rem' }}>ID Document</p>
                        <a href={doc.doc_url} target="_blank" rel="noopener noreferrer" style={{ display: 'block' }}>
                          <img src={doc.doc_url} alt="ID document" style={{ maxWidth: '480px', width: '100%', borderRadius: 4, border: `1px solid ${c.border2}`, display: 'block' }}
                            onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                        </a>
                        <a href={doc.doc_url} target="_blank" rel="noopener noreferrer"
                          style={{ display: 'inline-block', marginTop: '0.5rem', fontFamily: 'Raleway, sans-serif', fontSize: '0.72rem', color: c.gold, textDecoration: 'underline' }}>
                          Open in new tab ↗
                        </a>
                      </div>
                    ) : (
                      <div style={{ padding: '1rem 1.5rem' }}>
                        <p style={{ fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontSize: '0.9rem', color: c.text3 }}>Document URL expired or unavailable. Reload the page to refresh.</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── SUBSCRIPTIONS ── */}
        {tab === 'subscriptions' && (
          <div>
            {sectionTitle('Subscriptions')}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2.5rem' }}>
              {[
                { plan: 'free',     label: 'Free',     icon: '🔓', color: c.text3 },
                { plan: 'starter',  label: 'Starter',  icon: '⭐', color: c.gold  },
                { plan: 'standard', label: 'Standard', icon: '💎', color: '#4ade80' },
              ].map(({ plan, label, icon, color }) => (
                <div key={plan} style={{ background: c.card2, border: `1px solid ${c.border}`, borderRadius: 8, padding: '1.5rem' }}>
                  <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{icon}</div>
                  <div style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.65rem', letterSpacing: '0.2em',
                    textTransform: 'uppercase', color: c.text3, marginBottom: '0.25rem' }}>{label}</div>
                  <div style={{ fontFamily: '"Playfair Display", serif', fontSize: '2.5rem',
                    fontWeight: 700, color, lineHeight: 1 }}>{planCounts[plan] ?? 0}</div>
                  <div style={{ fontSize: '0.72rem', color: c.text3, marginTop: '0.3rem' }}>members</div>
                </div>
              ))}
            </div>

            <h3 style={{ fontFamily: '"Playfair Display", serif', fontSize: '1.1rem', color: c.text, margin: '0 0 1rem' }}>
              Member Plan Breakdown
            </h3>
            <div style={{ overflowX: 'auto', border: `1px solid ${c.border2}`, borderRadius: 6 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>{['Name','Location','Plan','Phone','Joined'].map(h => <th key={h} style={th}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {members.filter((m: any) => m.onboarding_complete).sort((a: any, b: any) => {
                    const order = { standard: 0, starter: 1, free: 2 }
                    return (order[a.plan as keyof typeof order] ?? 2) - (order[b.plan as keyof typeof order] ?? 2)
                  }).map((m: any) => (
                    <tr key={m.id} className="admin-row">
                      <td style={{ ...td, color: c.text, fontWeight: 500 }}>{m.full_name ?? '—'}</td>
                      <td style={td}>{[m.city, m.country].filter(Boolean).join(', ') || '—'}</td>
                      <td style={td}>{planBadge(m.plan ?? 'free')}</td>
                      <td style={td}>
                        <span style={{ color: m.phone ? '#4ade80' : c.text3, fontSize: '0.75rem' }}>
                          {m.phone ? '✓' : '—'}
                        </span>
                      </td>
                      <td style={td}>{fmt(m.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── ANALYTICS ── */}
        {tab === 'analytics' && (
          <div>
            {sectionTitle('Analytics')}

            <h3 style={{ fontFamily: '"Playfair Display", serif', fontSize: '1.1rem', color: c.text, margin: '0 0 1rem' }}>
              Estimated Recurring Revenue
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem', marginBottom: '0.75rem' }}>
              <StatCard icon="📅" label="Daily"   value={rupees(earnings.daily)} />
              <StatCard icon="🗓️" label="Weekly"  value={rupees(earnings.weekly)} />
              <StatCard icon="📆" label="Monthly" value={rupees(earnings.monthly)} />
              <StatCard icon="📈" label="Yearly"  value={rupees(earnings.yearly)} />
            </div>
            <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.72rem', color: c.text3, margin: '0 0 2.5rem', lineHeight: 1.6 }}>
              Based on current active Starter (₹350/mo) and Standard (₹550/mo) subscribers, projected forward. Actual collections may vary with renewals and cancellations.
            </p>

            <h3 style={{ fontFamily: '"Playfair Display", serif', fontSize: '1.1rem', color: c.text, margin: '0 0 1rem' }}>
              Members by Location (City)
            </h3>
            <div style={{ background: c.card, border: `1px solid ${c.border2}`, borderRadius: 8, padding: '1.25rem 1.5rem', marginBottom: '2.5rem' }}>
              <BarChart data={locationCounts} color={c.gold} />
            </div>

            <h3 style={{ fontFamily: '"Playfair Display", serif', fontSize: '1.1rem', color: c.text, margin: '0 0 1rem' }}>
              Members by Religion
            </h3>
            <div style={{ background: c.card, border: `1px solid ${c.border2}`, borderRadius: 8, padding: '1.25rem 1.5rem', marginBottom: '2.5rem' }}>
              <BarChart data={religionCounts} color="#4ade80" />
            </div>

            <h3 style={{ fontFamily: '"Playfair Display", serif', fontSize: '1.1rem', color: c.text, margin: '0 0 1rem' }}>
              Members by Caste
            </h3>
            <div style={{ background: c.card, border: `1px solid ${c.border2}`, borderRadius: 8, padding: '1.25rem 1.5rem' }}>
              <BarChart data={casteCounts} color="#60a5fa" />
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
