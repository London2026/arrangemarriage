'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { verifyMember, rejectMemberId, saveCrmStatus, saveCrmNote, updateTicketStatus, saveTicketNote } from './actions'

const c = {
  navy: '#0d1f3c', navy2: '#122d52', navy3: '#1a3a6b',
  gold: '#c9a84c', gold2: '#e8c96b',
  text: '#e8e3d8', text2: 'rgba(232,227,216,0.65)', text3: 'rgba(232,227,216,0.35)',
  border: 'rgba(201,168,76,0.2)', border2: 'rgba(201,168,76,0.08)',
  card: 'rgba(255,255,255,0.04)', card2: 'rgba(255,255,255,0.07)',
  green: '#2e7d52', amber: '#c97a2e', rose: '#9e2a2b',
}

type Tab = 'dashboard' | 'members' | 'meetings' | 'reveals' | 'subscriptions' | 'id_verification' | 'analytics' | 'crm' | 'tickets'

interface IdVerification {
  id: string
  full_name: string
  id_country: string
  doc_url: string | null
  created_at: string
}

interface CountItem { label: string; count: number }

interface Props {
  adminRole: 'owner' | 'support'
  stats: { totalMembers: number; newThisWeek: number; activeSubscribers: number; revealsToday: number; pendingMeetings: number; openTickets: number }
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
  tickets: Record<string, unknown>[]
  defaultTab?: Tab
}

const TABS: { id: Tab; icon: string; label: string }[] = [
  { id: 'dashboard',       icon: '◼',  label: 'Dashboard' },
  { id: 'members',         icon: '👤', label: 'Members' },
  { id: 'crm',             icon: '🗂️', label: 'CRM' },
  { id: 'tickets',         icon: '✉️', label: 'Tickets' },
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

const SUPPORT_TABS: Tab[] = ['dashboard', 'members', 'crm', 'tickets', 'id_verification']

export default function AdminClient({ adminRole, stats, members, meetings, reveals, ratings, planCounts, idVerifications, earnings, locationCounts, casteCounts, religionCounts, tickets: ticketsProp, defaultTab }: Props) {
  const router = useRouter()
  const visibleTabs = adminRole === 'owner' ? TABS : TABS.filter(t => SUPPORT_TABS.includes(t.id))
  const [tab, setTab] = useState<Tab>(defaultTab ?? 'dashboard')
  const [idDocs, setIdDocs] = useState<IdVerification[]>(idVerifications)
  const [idAction, setIdAction] = useState<Record<string, 'verifying' | 'rejecting' | 'done'>>({})
  const [crmFilter, setCrmFilter] = useState<string>('all')
  const [crm, setCrm] = useState<Record<string, { status: string; notes: string; open: boolean }>>(() => {
    const init: Record<string, { status: string; notes: string; open: boolean }> = {}
    for (const m of members) {
      init[m.id as string] = {
        status: (m.crm_status as string) ?? 'new',
        notes:  (m.crm_notes  as string) ?? '',
        open: false,
      }
    }
    return init
  })
  const [ticketFilter, setTicketFilter] = useState<string>('open')
  const [ticketUi, setTicketUi] = useState<Record<string, { status: string; notes: string; open: boolean }>>(() => {
    const init: Record<string, { status: string; notes: string; open: boolean }> = {}
    for (const t of ticketsProp) {
      init[t.id as string] = {
        status: (t.status as string) ?? 'open',
        notes:  (t.admin_notes as string) ?? '',
        open: false,
      }
    }
    return init
  })

  async function handleCrmStatus(id: string, status: string) {
    setCrm(d => ({ ...d, [id]: { ...d[id], status } }))
    await saveCrmStatus(id, status)
  }

  async function handleCrmNoteBlur(id: string, notes: string) {
    await saveCrmNote(id, notes)
  }

  async function handleTicketStatus(id: string, status: string) {
    setTicketUi(d => ({ ...d, [id]: { ...d[id], status } }))
    await updateTicketStatus(id, status)
  }

  async function handleTicketNoteBlur(id: string, notes: string) {
    await saveTicketNote(id, notes)
  }

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
          {visibleTabs.map(t => (
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
              {t.id === 'tickets' && stats.openTickets > 0 && (
                <span className="nav-label" style={{ minWidth: 20, height: 20, borderRadius: '50%', background: '#3b82f6', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 700, flexShrink: 0 }}>
                  {stats.openTickets}
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
              <StatCard icon="✉️" label="Open Tickets"       value={stats.openTickets}        sub="contact form messages" />
            </div>

            {/* Recent members */}
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ fontFamily: '"Playfair Display", serif', fontSize: '1.1rem', color: c.text,
                margin: '0 0 1rem' }}>Recent Members</h3>
              <div style={{ overflowX: 'auto', border: `1px solid ${c.border2}`, borderRadius: 6 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>{['Profile ID','Name','Age','Location','Plan','Joined'].map(h => <th key={h} style={th}>{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {members.filter(m => m.onboarding_complete).slice(0, 10).map((m: any) => (
                      <tr key={m.id} className="admin-row">
                        <td style={{ ...td, fontFamily: '"Courier New", monospace', color: c.gold, fontSize: '0.78rem', letterSpacing: '0.08em' }}>#{(m.id as string).slice(0, 8).toUpperCase()}</td>
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
                  <tr>{['Profile ID','Name','Age','Gender','Location','Religion','Plan','Phone','Joined','Status','Notes'].map(h => <th key={h} style={th}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {members.filter((m: any) => m.onboarding_complete).map((m: any) => {
                    const row = crm[m.id as string] ?? { status: 'new', notes: '', open: false }
                    const statusColour: Record<string, string> = {
                      new:       c.text3,
                      active:    '#4ade80',
                      follow_up: '#fbbf24',
                      matched:   c.gold,
                      inactive:  '#6b7280',
                    }
                    return (
                      <>
                        <tr key={m.id} className="admin-row">
                          <td style={{ ...td, fontFamily: '"Courier New", monospace', color: c.gold, fontSize: '0.78rem', letterSpacing: '0.08em' }}>#{(m.id as string).slice(0, 8).toUpperCase()}</td>
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
                          <td style={td}>
                            <select
                              value={row.status}
                              onChange={e => handleCrmStatus(m.id as string, e.target.value)}
                              style={{ background: 'rgba(0,0,0,0.35)', border: `1px solid ${statusColour[row.status] ?? c.border}`, color: statusColour[row.status] ?? c.text2, borderRadius: 4, fontSize: '0.72rem', fontFamily: 'Raleway, sans-serif', fontWeight: 700, padding: '0.25rem 0.4rem', cursor: 'pointer', outline: 'none' }}>
                              <option value="new">New</option>
                              <option value="active">Active</option>
                              <option value="follow_up">Follow Up</option>
                              <option value="matched">Matched ✓</option>
                              <option value="inactive">Inactive</option>
                            </select>
                          </td>
                          <td style={td}>
                            <button
                              onClick={() => setCrm(d => ({ ...d, [m.id as string]: { ...d[m.id as string], open: !row.open } }))}
                              style={{ background: row.notes ? 'rgba(201,168,76,0.15)' : 'rgba(255,255,255,0.05)', border: `1px solid ${row.notes ? c.border : 'rgba(255,255,255,0.08)'}`, borderRadius: 4, color: row.notes ? c.gold : c.text3, cursor: 'pointer', fontSize: '0.78rem', padding: '0.25rem 0.55rem', fontFamily: 'Raleway, sans-serif' }}>
                              {row.open ? '▲ hide' : row.notes ? '📝 note' : '+ note'}
                            </button>
                          </td>
                        </tr>
                        {row.open && (
                          <tr key={`notes-${m.id}`} style={{ background: 'rgba(0,0,0,0.2)' }}>
                            <td colSpan={11} style={{ padding: '0.6rem 1rem 0.75rem' }}>
                              <textarea
                                defaultValue={row.notes}
                                onBlur={e => {
                                  setCrm(d => ({ ...d, [m.id as string]: { ...d[m.id as string], notes: e.target.value } }))
                                  handleCrmNoteBlur(m.id as string, e.target.value)
                                }}
                                placeholder="Add a note about this member — follow-up reminders, conversation history, anything relevant…"
                                rows={2}
                                style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: `1px solid ${c.border}`, color: c.text, fontFamily: 'Raleway, sans-serif', fontSize: '0.82rem', lineHeight: 1.6, padding: '0.5rem 0.75rem', borderRadius: 4, resize: 'vertical', outline: 'none', boxSizing: 'border-box' }}
                              />
                              <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.62rem', color: c.text3, margin: '0.3rem 0 0' }}>Auto-saves when you click away</p>
                            </td>
                          </tr>
                        )}
                      </>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── CRM ── */}
        {tab === 'crm' && (() => {
          const crmStatuses = [
            { key: 'all',       label: 'All',        color: c.text2 },
            { key: 'follow_up', label: 'Follow Up',  color: '#fbbf24' },
            { key: 'new',       label: 'New',        color: c.text3 },
            { key: 'active',    label: 'Active',     color: '#4ade80' },
            { key: 'matched',   label: 'Matched',    color: c.gold },
            { key: 'inactive',  label: 'Inactive',   color: '#6b7280' },
          ]
          const statusColour: Record<string, string> = {
            new: c.text3, active: '#4ade80', follow_up: '#fbbf24', matched: c.gold, inactive: '#6b7280',
          }
          const completedMembers = members.filter((m: any) => m.onboarding_complete)
          const statusCounts: Record<string, number> = { new: 0, active: 0, follow_up: 0, matched: 0, inactive: 0 }
          for (const m of completedMembers) {
            const s = (crm[m.id as string]?.status) ?? 'new'
            statusCounts[s] = (statusCounts[s] ?? 0) + 1
          }
          const filtered = crmFilter === 'all'
            ? completedMembers
            : completedMembers.filter((m: any) => (crm[m.id as string]?.status ?? 'new') === crmFilter)
          const sorted = [...filtered].sort((a: any, b: any) => {
            const order: Record<string, number> = { follow_up: 0, active: 1, new: 2, matched: 3, inactive: 4 }
            return (order[crm[a.id as string]?.status ?? 'new'] ?? 2) - (order[crm[b.id as string]?.status ?? 'new'] ?? 2)
          })
          return (
            <div>
              {sectionTitle('CRM — Member Pipeline')}

              {/* Status summary */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '0.75rem', marginBottom: '1.75rem' }}>
                {[
                  { key: 'follow_up', label: 'Follow Up',  color: '#fbbf24', icon: '⚡' },
                  { key: 'active',    label: 'Active',     color: '#4ade80', icon: '✅' },
                  { key: 'new',       label: 'New',        color: c.text3,   icon: '🆕' },
                  { key: 'matched',   label: 'Matched',    color: c.gold,    icon: '💍' },
                  { key: 'inactive',  label: 'Inactive',   color: '#6b7280', icon: '💤' },
                ].map(({ key, label, color, icon }) => (
                  <div key={key} onClick={() => setCrmFilter(key === crmFilter ? 'all' : key)}
                    style={{ background: crmFilter === key ? `${color}18` : c.card, border: `1px solid ${crmFilter === key ? color : c.border2}`, borderRadius: 8, padding: '0.9rem 1rem', cursor: 'pointer', transition: 'all 0.15s' }}>
                    <div style={{ fontSize: '1.1rem', marginBottom: '0.3rem' }}>{icon}</div>
                    <div style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.6rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: c.text3, marginBottom: '0.15rem' }}>{label}</div>
                    <div style={{ fontFamily: '"Playfair Display", serif', fontSize: '1.8rem', fontWeight: 700, color, lineHeight: 1 }}>{statusCounts[key] ?? 0}</div>
                  </div>
                ))}
              </div>

              {/* Filter bar */}
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
                {crmStatuses.map(s => (
                  <button key={s.key} onClick={() => setCrmFilter(s.key)}
                    style={{ padding: '0.35rem 0.9rem', borderRadius: 20, border: `1px solid ${crmFilter === s.key ? s.color : c.border2}`, background: crmFilter === s.key ? `${s.color}18` : 'transparent', color: crmFilter === s.key ? s.color : c.text3, fontFamily: 'Raleway, sans-serif', fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer', letterSpacing: '0.06em', transition: 'all 0.15s' }}>
                    {s.label} {s.key !== 'all' && `(${statusCounts[s.key] ?? 0})`}
                  </button>
                ))}
              </div>

              {/* Member cards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {sorted.map((m: any) => {
                  const row = crm[m.id as string] ?? { status: 'new', notes: '', open: false }
                  const isFollowUp = row.status === 'follow_up'
                  return (
                    <div key={m.id} style={{ background: isFollowUp ? 'rgba(251,191,36,0.05)' : c.card, border: `1px solid ${isFollowUp ? 'rgba(251,191,36,0.3)' : c.border2}`, borderRadius: 6, overflow: 'hidden' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem 1rem', flexWrap: 'wrap' }}>
                        <div style={{ fontFamily: '"Courier New", monospace', color: c.gold, fontSize: '0.72rem', letterSpacing: '0.08em', flexShrink: 0 }}>
                          #{(m.id as string).slice(0, 8).toUpperCase()}
                        </div>
                        <div style={{ flex: 1, minWidth: 120 }}>
                          <div style={{ fontFamily: '"Playfair Display", serif', fontSize: '0.95rem', color: c.text, fontWeight: 600 }}>{m.full_name ?? '—'}</div>
                          <div style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.68rem', color: c.text3, marginTop: '0.1rem' }}>
                            {[m.age && `${m.age}y`, m.gender, m.city, m.religion].filter(Boolean).join(' · ')}
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                          {m.phone && <span style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.72rem', color: '#4ade80' }}>📞 {m.phone}</span>}
                          {planBadge(m.plan ?? 'free')}
                          <select
                            value={row.status}
                            onChange={e => handleCrmStatus(m.id as string, e.target.value)}
                            style={{ background: 'rgba(0,0,0,0.35)', border: `1px solid ${statusColour[row.status] ?? c.border}`, color: statusColour[row.status] ?? c.text2, borderRadius: 4, fontSize: '0.72rem', fontFamily: 'Raleway, sans-serif', fontWeight: 700, padding: '0.25rem 0.4rem', cursor: 'pointer', outline: 'none' }}>
                            <option value="new">New</option>
                            <option value="active">Active</option>
                            <option value="follow_up">Follow Up</option>
                            <option value="matched">Matched ✓</option>
                            <option value="inactive">Inactive</option>
                          </select>
                          <button
                            onClick={() => setCrm(d => ({ ...d, [m.id as string]: { ...d[m.id as string], open: !row.open } }))}
                            style={{ background: row.notes ? 'rgba(201,168,76,0.15)' : 'rgba(255,255,255,0.05)', border: `1px solid ${row.notes ? c.border : 'rgba(255,255,255,0.08)'}`, borderRadius: 4, color: row.notes ? c.gold : c.text3, cursor: 'pointer', fontSize: '0.75rem', padding: '0.25rem 0.55rem', fontFamily: 'Raleway, sans-serif' }}>
                            {row.open ? '▲' : row.notes ? '📝' : '+ note'}
                          </button>
                        </div>
                      </div>
                      {row.open && (
                        <div style={{ padding: '0.5rem 1rem 0.75rem', background: 'rgba(0,0,0,0.15)' }}>
                          <textarea
                            defaultValue={row.notes}
                            onBlur={e => {
                              setCrm(d => ({ ...d, [m.id as string]: { ...d[m.id as string], notes: e.target.value } }))
                              handleCrmNoteBlur(m.id as string, e.target.value)
                            }}
                            placeholder="Follow-up reminders, conversation history, anything relevant…"
                            rows={2}
                            style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: `1px solid ${c.border}`, color: c.text, fontFamily: 'Raleway, sans-serif', fontSize: '0.82rem', lineHeight: 1.6, padding: '0.5rem 0.75rem', borderRadius: 4, resize: 'vertical', outline: 'none', boxSizing: 'border-box' }}
                          />
                          <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.6rem', color: c.text3, margin: '0.25rem 0 0' }}>Auto-saves when you click away</p>
                        </div>
                      )}
                    </div>
                  )
                })}
                {sorted.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '3rem', background: c.card, border: `1px solid ${c.border2}`, borderRadius: 8 }}>
                    <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.85rem', color: c.text3, margin: 0 }}>No members in this category</p>
                  </div>
                )}
              </div>
            </div>
          )
        })()}

        {/* ── TICKETS ── */}
        {tab === 'tickets' && (() => {
          const ticketStatuses = [
            { key: 'open',        label: 'Open',        color: '#3b82f6' },
            { key: 'in_progress', label: 'In Progress', color: '#fbbf24' },
            { key: 'resolved',    label: 'Resolved',    color: '#4ade80' },
          ]
          const allTickets = ticketFilter === 'all'
            ? ticketsProp
            : ticketsProp.filter(t => (ticketUi[t.id as string]?.status ?? 'open') === ticketFilter)
          const openCount     = ticketsProp.filter(t => (ticketUi[t.id as string]?.status ?? 'open') === 'open').length
          const progressCount = ticketsProp.filter(t => (ticketUi[t.id as string]?.status ?? 'open') === 'in_progress').length
          const resolvedCount = ticketsProp.filter(t => (ticketUi[t.id as string]?.status ?? 'open') === 'resolved').length

          const ticketStatusColor: Record<string, string> = {
            open: '#3b82f6', in_progress: '#fbbf24', resolved: '#4ade80',
          }

          return (
            <div>
              {sectionTitle('Support Tickets', ticketsProp.length)}

              {/* Summary */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
                {[
                  { key: 'open',        label: 'Open',        count: openCount,     color: '#3b82f6', icon: '📬' },
                  { key: 'in_progress', label: 'In Progress', count: progressCount, color: '#fbbf24', icon: '⏳' },
                  { key: 'resolved',    label: 'Resolved',    count: resolvedCount, color: '#4ade80', icon: '✅' },
                ].map(({ key, label, count, color, icon }) => (
                  <div key={key} onClick={() => setTicketFilter(key === ticketFilter ? 'all' : key)}
                    style={{ background: ticketFilter === key ? `${color}18` : c.card, border: `1px solid ${ticketFilter === key ? color : c.border2}`, borderRadius: 8, padding: '1rem', cursor: 'pointer', transition: 'all 0.15s' }}>
                    <div style={{ fontSize: '1.2rem', marginBottom: '0.3rem' }}>{icon}</div>
                    <div style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.6rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: c.text3 }}>{label}</div>
                    <div style={{ fontFamily: '"Playfair Display", serif', fontSize: '2rem', fontWeight: 700, color, lineHeight: 1.1 }}>{count}</div>
                  </div>
                ))}
              </div>

              {/* Filter bar */}
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
                <button onClick={() => setTicketFilter('all')}
                  style={{ padding: '0.35rem 0.9rem', borderRadius: 20, border: `1px solid ${ticketFilter === 'all' ? c.text2 : c.border2}`, background: ticketFilter === 'all' ? 'rgba(232,227,216,0.08)' : 'transparent', color: ticketFilter === 'all' ? c.text2 : c.text3, fontFamily: 'Raleway, sans-serif', fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer', letterSpacing: '0.06em' }}>
                  All ({ticketsProp.length})
                </button>
                {ticketStatuses.map(s => (
                  <button key={s.key} onClick={() => setTicketFilter(s.key)}
                    style={{ padding: '0.35rem 0.9rem', borderRadius: 20, border: `1px solid ${ticketFilter === s.key ? s.color : c.border2}`, background: ticketFilter === s.key ? `${s.color}18` : 'transparent', color: ticketFilter === s.key ? s.color : c.text3, fontFamily: 'Raleway, sans-serif', fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer', letterSpacing: '0.06em', transition: 'all 0.15s' }}>
                    {s.label}
                  </button>
                ))}
              </div>

              {/* Ticket list */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {allTickets.map((t: any) => {
                  const ui = ticketUi[t.id as string] ?? { status: 'open', notes: '', open: false }
                  const statusColor = ticketStatusColor[ui.status] ?? '#3b82f6'
                  return (
                    <div key={t.id} style={{ background: c.card, border: `1px solid ${ui.status === 'resolved' ? c.border2 : `${statusColor}30`}`, borderRadius: 8, overflow: 'hidden', opacity: ui.status === 'resolved' ? 0.65 : 1 }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', padding: '0.9rem 1rem', cursor: 'pointer' }}
                        onClick={() => setTicketUi(d => ({ ...d, [t.id as string]: { ...d[t.id as string], open: !ui.open } }))}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.25rem', flexWrap: 'wrap' }}>
                            <span style={{ fontFamily: '"Playfair Display", serif', fontSize: '0.95rem', color: c.text, fontWeight: 600 }}>{t.name}</span>
                            <a href={`mailto:${t.email}`} onClick={e => e.stopPropagation()}
                              style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.72rem', color: '#60a5fa', textDecoration: 'none' }}>{t.email}</a>
                          </div>
                          <div style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.8rem', color: c.text2, fontWeight: 500, marginBottom: '0.25rem' }}>
                            {t.subject || 'General Enquiry'}
                          </div>
                          <div style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.72rem', color: c.text3 }}>
                            {new Date(t.created_at).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                          <select
                            value={ui.status}
                            onClick={e => e.stopPropagation()}
                            onChange={e => { e.stopPropagation(); handleTicketStatus(t.id as string, e.target.value) }}
                            style={{ background: 'rgba(0,0,0,0.4)', border: `1px solid ${statusColor}`, color: statusColor, borderRadius: 4, fontSize: '0.7rem', fontFamily: 'Raleway, sans-serif', fontWeight: 700, padding: '0.25rem 0.4rem', cursor: 'pointer', outline: 'none' }}>
                            <option value="open">Open</option>
                            <option value="in_progress">In Progress</option>
                            <option value="resolved">Resolved</option>
                          </select>
                          <span style={{ color: c.text3, fontSize: '0.75rem' }}>{ui.open ? '▲' : '▼'}</span>
                        </div>
                      </div>

                      {ui.open && (
                        <div style={{ borderTop: `1px solid ${c.border2}`, padding: '0.9rem 1rem' }}>
                          <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.82rem', color: c.text2, lineHeight: 1.8, whiteSpace: 'pre-wrap', margin: '0 0 1rem', background: 'rgba(0,0,0,0.15)', padding: '0.75rem', borderRadius: 4 }}>
                            {t.message}
                          </p>
                          <div style={{ marginBottom: '0.25rem' }}>
                            <label style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.62rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: c.text3 }}>Admin Notes</label>
                          </div>
                          <textarea
                            defaultValue={ui.notes}
                            onBlur={e => {
                              setTicketUi(d => ({ ...d, [t.id as string]: { ...d[t.id as string], notes: e.target.value } }))
                              handleTicketNoteBlur(t.id as string, e.target.value)
                            }}
                            placeholder="Internal notes — follow-up actions, resolution steps, context…"
                            rows={2}
                            style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: `1px solid ${c.border}`, color: c.text, fontFamily: 'Raleway, sans-serif', fontSize: '0.82rem', lineHeight: 1.6, padding: '0.5rem 0.75rem', borderRadius: 4, resize: 'vertical', outline: 'none', boxSizing: 'border-box' }}
                          />
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.4rem' }}>
                            <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.6rem', color: c.text3, margin: 0 }}>Auto-saves when you click away</p>
                            <a href={`mailto:${t.email}?subject=Re: ${encodeURIComponent(t.subject || 'Your enquiry')}`}
                              style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.72rem', color: c.gold, textDecoration: 'none', padding: '0.3rem 0.75rem', border: `1px solid ${c.border}`, borderRadius: 4 }}>
                              Reply by email ↗
                            </a>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
                {allTickets.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '4rem 2rem', background: c.card, border: `1px solid ${c.border2}`, borderRadius: 8 }}>
                    <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📭</div>
                    <p style={{ fontFamily: '"Playfair Display", serif', fontSize: '1.1rem', color: c.text, margin: '0 0 0.4rem' }}>
                      {ticketFilter === 'open' ? 'No open tickets' : 'Nothing here'}
                    </p>
                    <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.8rem', color: c.text3, margin: 0 }}>Contact form submissions will appear here.</p>
                  </div>
                )}
              </div>
            </div>
          )
        })()}

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
