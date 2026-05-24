'use client'

import { useState } from 'react'

const c = { navy: '#0d1f3c', gold: '#8b6914', sepia: '#5a6e82', textMid: '#2c4a6e', ivory: '#f5f0e6', border: 'rgba(13,31,60,0.18)' }

const CATEGORIES = [
  { key: 'favReels',      icon: '🎬', label: 'Favourite Reels',        placeholder: 'e.g. paste a link or type Travel vlogs',  full: false },
  { key: 'favYoutube',    icon: '▶️', label: 'YouTube Channels',        placeholder: 'e.g. paste a link or type Veritasium',    full: false },
  { key: 'favWebSeries',  icon: '📺', label: 'Web Series',              placeholder: 'e.g. Succession, Black Mirror',            full: false },
  { key: 'favTravel',     icon: '✈️', label: 'Travel Destinations',     placeholder: 'e.g. Japan, Iceland, New Zealand',         full: false },
  { key: 'favFoods',      icon: '🍽️', label: 'Favourite Foods',         placeholder: 'e.g. Sushi, Pasta, Tacos',                 full: false },
  { key: 'favAiTools',    icon: '🤖', label: 'Favourite AI Tools',      placeholder: 'e.g. Claude, Midjourney, Notion AI',       full: false },
  { key: 'hobby',         icon: '🎯', label: 'Hobbies & Interests',     placeholder: 'e.g. Photography, Hiking, Chess',          full: true  },
]

type PersonalityData = { favReels: string; favYoutube: string; favWebSeries: string; favTravel: string; favFoods: string; favAiTools: string; hobby: string }

interface Props {
  data: PersonalityData
  onChange: (key: string, value: string) => void
}

function isUrl(s: string): boolean {
  return /^https?:\/\//i.test(s.trim())
}

function shortLabel(url: string): string {
  try {
    const u = new URL(url)
    const path = u.pathname.length > 20 ? u.pathname.slice(0, 20) + '…' : u.pathname
    return (u.hostname.replace('www.', '') + path).replace(/\/$/, '')
  } catch {
    return url.length > 32 ? url.slice(0, 32) + '…' : url
  }
}

export default function PersonalityStep({ data, onChange }: Props) {
  return (
    <div>
      <h2 className="ob-step-h2" style={{ color: c.navy, margin: '0 0 0.35rem' }}>
        Your personality
      </h2>
      <div style={{ background: 'rgba(139,105,20,0.07)', border: '1px solid rgba(139,105,20,0.2)', borderRadius: '5px', padding: '0.75rem 1rem', margin: '0 0 0.85rem' }}>
        <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.95rem', color: c.navy, margin: 0, lineHeight: 1.65 }}>
          Sharing your favourite content and interests gives other members a real sense of who you are — your tastes, your curiosity, and what makes you unique. This helps you find someone who truly connects with you.
        </p>
      </div>
      <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.8rem', color: c.gold, letterSpacing: '0.1em', margin: '0 0 1rem' }}>
        ADD UP TO 3 ITEMS PER CATEGORY — type a name or paste a link, then press Enter
      </p>
      <div style={{ height: '1px', background: `linear-gradient(to right, ${c.gold}, transparent)`, marginBottom: '1.25rem' }} />

      <style>{`.ob-personality-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; } @media (max-width: 600px) { .ob-personality-grid { grid-template-columns: 1fr; } }`}</style>
      <div className="ob-personality-grid">
        {CATEGORIES.map(cat => (
          <div key={cat.key} style={cat.full ? { gridColumn: '1 / -1' } : undefined}>
            <ChipField
              icon={cat.icon}
              label={cat.label}
              placeholder={cat.placeholder}
              value={data[cat.key as keyof PersonalityData] || ''}
              onChange={v => onChange(cat.key, v)}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

function ChipField({ icon, label, placeholder, value, onChange }: {
  icon: string; label: string; placeholder: string; value: string; onChange: (v: string) => void
}) {
  const [input, setInput] = useState('')
  // Split on " | " so commas inside URLs (rare) don't cause issues
  // Also support legacy comma-separated values from existing DB data
  const chips = value
    ? value.includes(' | ')
      ? value.split(' | ').map(s => s.trim()).filter(Boolean)
      : value.split(',').map(s => s.trim()).filter(Boolean)
    : []

  function addChip() {
    const trimmed = input.trim()
    if (!trimmed || chips.length >= 3) return
    const next = [...chips, trimmed].join(' | ')
    onChange(next)
    setInput('')
  }

  function removeChip(i: number) {
    const next = chips.filter((_, idx) => idx !== i).join(' | ')
    onChange(next)
  }

  function handleKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') { e.preventDefault(); addChip() }
  }

  return (
    <div style={{ background: 'rgba(244,241,235,0.3)', border: `1px solid ${c.border}`, borderRadius: '6px', padding: '0.75rem', minWidth: 0, overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem' }}>
        <span style={{ fontSize: '1rem', flexShrink: 0 }}>{icon}</span>
        <label style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: c.textMid, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {label}
        </label>
        <span style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.55rem', color: chips.length >= 3 ? c.gold : c.sepia, marginLeft: 'auto', flexShrink: 0 }}>
          {chips.length}/3
        </span>
      </div>

      {/* Chips — stacked vertically so long URLs don't overflow */}
      {chips.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', marginBottom: '0.4rem' }}>
          {chips.map((chip, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.25rem 0.55rem', background: 'rgba(139,105,20,0.1)', border: '1px solid rgba(139,105,20,0.3)', borderRadius: '20px', minWidth: 0, maxWidth: '100%' }}>
              {isUrl(chip) ? (
                <a
                  href={chip}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={chip}
                  style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '0.85rem', color: '#1b3a6b', textDecoration: 'underline', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, minWidth: 0 }}
                >
                  {shortLabel(chip)}
                </a>
              ) : (
                <span style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '0.85rem', color: c.navy, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, minWidth: 0 }}>
                  {chip}
                </span>
              )}
              <button type="button" onClick={() => removeChip(i)} style={{ background: 'none', border: 'none', color: c.sepia, cursor: 'pointer', padding: 0, fontSize: '0.75rem', lineHeight: 1, flexShrink: 0 }}>×</button>
            </div>
          ))}
        </div>
      )}

      {/* Input */}
      {chips.length < 3 && (
        <div style={{ display: 'flex', gap: '0.3rem' }}>
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder={chips.length === 0 ? placeholder : 'Add another…'}
            style={{ flex: 1, padding: '0.6rem 0.75rem', border: `1px solid ${c.border}`, background: 'rgba(244,241,235,0.6)', color: c.navy, fontFamily: '"Cormorant Garamond", serif', fontSize: '1rem', fontStyle: 'italic', borderRadius: '4px', outline: 'none', minWidth: 0 }}
            onFocus={e => (e.target.style.borderColor = '#1b3a6b')}
            onBlur={e => (e.target.style.borderColor = c.border)}
          />
          <button type="button" onClick={addChip} disabled={!input.trim()}
            style={{ padding: '0.4rem 0.7rem', background: input.trim() ? c.navy : 'rgba(13,31,60,0.2)', color: '#f5f0e6', border: 'none', borderRadius: '4px', cursor: input.trim() ? 'pointer' : 'default', fontSize: '0.85rem', fontWeight: 600, flexShrink: 0 }}>
            +
          </button>
        </div>
      )}
    </div>
  )
}
