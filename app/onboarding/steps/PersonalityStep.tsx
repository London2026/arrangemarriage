'use client'

import { useState } from 'react'

const c = {
  navy: '#0d1f3c', gold: '#8b6914', goldLight: '#c9a84c',
  sepia: '#5a6e82', textMid: '#2c4a6e', border: 'rgba(13,31,60,0.15)',
  teal: '#1D5252',
}

const CATEGORIES = [
  { key: 'favReels',     icon: '🎬', label: 'YOUR FAVOURITE SOCIAL MEDIA REELS',   placeholder: 'e.g. paste a link or type Travel vlogs' },
  { key: 'favYoutube',   icon: '▶️', label: 'YOUR FAVOURITE YOUTUBE CHANNELS',      placeholder: 'e.g. paste a link or type Veritasium' },
  { key: 'favWebSeries', icon: '📺', label: 'YOUR FAVOURITE WEB SERIES ON OTT',     placeholder: 'e.g. Succession, Black Mirror' },
  { key: 'favTravel',    icon: '✈️', label: 'YOUR FAVOURITE TRAVEL DESTINATIONS',   placeholder: 'e.g. Rajasthan, Goa, Switzerland' },
  { key: 'favFoods',     icon: '🍽️', label: 'YOUR FAVOURITE FOODS',                 placeholder: 'e.g. Biryani, Dosa, Pasta' },
  { key: 'favAiTools',   icon: '🤖', label: 'YOUR FAVOURITE AI TOOLS',              placeholder: 'e.g. Claude, Midjourney, Notion AI' },
  { key: 'hobby',        icon: '🎯', label: 'HOBBIES & INTERESTS',                  placeholder: 'e.g. Photography, Hiking, Chess' },
]

type PersonalityData = { favReels: string; favYoutube: string; favWebSeries: string; favTravel: string; favFoods: string; favAiTools: string; hobby: string }

interface Props {
  data: PersonalityData
  onChange: (key: string, value: string) => void
}

function isUrl(s: string) { return /^https?:\/\//i.test(s.trim()) }
function shortLabel(url: string) {
  try {
    const u = new URL(url)
    const path = u.pathname.length > 20 ? u.pathname.slice(0, 20) + '…' : u.pathname
    return (u.hostname.replace('www.', '') + path).replace(/\/$/, '')
  } catch { return url.length > 32 ? url.slice(0, 32) + '…' : url }
}

function ChipField({ icon, label, placeholder, value, onChange }: {
  icon: string; label: string; placeholder: string; value: string; onChange: (v: string) => void
}) {
  const [input, setInput] = useState('')
  const chips = value
    ? value.includes(' | ')
      ? value.split(' | ').map(s => s.trim()).filter(Boolean)
      : value.split(',').map(s => s.trim()).filter(Boolean)
    : []

  function addChip() {
    const t = input.trim()
    if (!t || chips.length >= 3) return
    onChange([...chips, t].join(' | '))
    setInput('')
  }

  function removeChip(i: number) {
    onChange(chips.filter((_, idx) => idx !== i).join(' | '))
  }

  return (
    <div style={{ background: '#fff', border: `1px solid ${c.border}`, borderRadius: '8px', padding: '1rem 1.1rem', marginBottom: '0.75rem' }}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '1.1rem' }}>{icon}</span>
          <span style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: c.textMid }}>
            {label}
          </span>
        </div>
        <span style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.8rem', color: c.sepia }}>
          {chips.length}/<strong style={{ fontSize: '1rem', color: c.navy }}>{3}</strong>
        </span>
      </div>

      {/* Added chips */}
      {chips.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '0.6rem' }}>
          {chips.map((chip, i) => (
            <div key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.25rem 0.65rem', background: 'rgba(29,82,82,0.08)', border: '1px solid rgba(29,82,82,0.25)', borderRadius: '20px' }}>
              {isUrl(chip) ? (
                <a href={chip} target="_blank" rel="noopener noreferrer" title={chip}
                  style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '0.9rem', color: c.teal, textDecoration: 'underline', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {shortLabel(chip)}
                </a>
              ) : (
                <span style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '0.9rem', color: c.navy }}>{chip}</span>
              )}
              <button type="button" onClick={() => removeChip(i)}
                style={{ background: 'none', border: 'none', color: c.sepia, cursor: 'pointer', padding: '0 0.1rem', fontSize: '0.8rem', lineHeight: 1, flexShrink: 0 }}>
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input row */}
      {chips.length < 3 && (
        <div style={{ display: 'flex', gap: '0.4rem' }}>
          <input type="text" value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addChip() } }}
            placeholder={chips.length === 0 ? placeholder : 'Add another…'}
            style={{ flex: 1, padding: '0.65rem 0.9rem', border: `1px solid ${c.border}`, background: 'rgba(244,241,235,0.5)', color: c.navy, fontFamily: '"Cormorant Garamond", serif', fontSize: '1rem', fontStyle: 'italic', borderRadius: '5px', outline: 'none' }}
            onFocus={e => (e.target.style.borderColor = c.teal)}
            onBlur={e => (e.target.style.borderColor = c.border)}
          />
          <button type="button" onClick={addChip} disabled={!input.trim()}
            style={{ width: '38px', height: '38px', marginTop: '2px', background: input.trim() ? c.teal : 'rgba(29,82,82,0.2)', color: '#fff', border: 'none', borderRadius: '5px', cursor: input.trim() ? 'pointer' : 'default', fontSize: '1.1rem', fontWeight: 700, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            +
          </button>
        </div>
      )}
    </div>
  )
}

export default function PersonalityStep({ data, onChange }: Props) {
  return (
    <div>
      <h2 className="ob-step-h2" style={{ color: c.navy, margin: '0 0 0.75rem', fontSize: '1.6rem' }}>
        Your personality
      </h2>

      <div style={{ background: '#fff', border: `1px solid ${c.border}`, borderRadius: '8px', padding: '1rem 1.1rem', marginBottom: '1rem' }}>
        <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.9rem', color: c.navy, margin: 0, lineHeight: 1.7 }}>
          Sharing your favourite content and interests gives other members a real sense of who you are — your tastes, your curiosity, and what makes you unique. This helps you find someone who truly connects with you.
        </p>
      </div>

      <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.68rem', fontWeight: 700, color: c.gold, letterSpacing: '0.1em', margin: '0 0 0.5rem' }}>
        ADD UP TO 3 ITEMS PER CATEGORY — type a name or paste a link, then press Enter
      </p>
      <div style={{ height: '1px', background: `linear-gradient(to right, ${c.gold}, transparent)`, marginBottom: '1rem' }} />

      {CATEGORIES.map(cat => (
        <ChipField
          key={cat.key}
          icon={cat.icon}
          label={cat.label}
          placeholder={cat.placeholder}
          value={data[cat.key as keyof PersonalityData] || ''}
          onChange={v => onChange(cat.key, v)}
        />
      ))}
    </div>
  )
}
