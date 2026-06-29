'use client'

import { useState } from 'react'

const c = {
  navy: '#0d1f3c', gold: '#8b6914', goldLight: '#c9a84c',
  sepia: '#5a6e82', textMid: '#2c4a6e', border: 'rgba(13,31,60,0.15)',
  teal: '#1D5252', rose: '#9e2a2b',
}

const CATEGORIES = [
  { key: 'favReels',     icon: '🎬', label: 'YOUR FAVOURITE SOCIAL MEDIA REELS',   placeholder: 'e.g. paste a link or type Travel vlogs' },
  { key: 'favYoutube',   icon: '▶️', label: 'YOUR FAVOURITE YOUTUBE CHANNELS',      placeholder: 'e.g. paste a link or type Veritasium' },
  { key: 'favWebSeries', icon: '📺', label: 'YOUR FAVOURITE WEB SERIES ON OTT',     placeholder: 'e.g. Succession, Black Mirror' },
  { key: 'favTravel',    icon: '✈️', label: 'YOUR FAVOURITE TRAVEL DESTINATIONS',   placeholder: 'e.g. Rajasthan, Goa, Switzerland' },
  { key: 'favFoods',     icon: '🍽️', label: 'YOUR FAVOURITE FOODS',                 placeholder: 'e.g. Biryani, Dosa, Pasta' },
  { key: 'favAiTools',   icon: '🤖', label: 'YOUR FAVOURITE AI TOOLS',              placeholder: 'e.g. Claude, Midjourney, Notion AI' },
]

type PersonalityData = { favReels: string; favYoutube: string; favWebSeries: string; favTravel: string; favFoods: string; favAiTools: string }

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

  const isEmpty = chips.length === 0

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
    <div style={{
      background: '#fff',
      border: `1px solid ${isEmpty ? 'rgba(158,42,43,0.35)' : c.border}`,
      borderRadius: '8px', padding: '1rem 1.1rem', marginBottom: '0.75rem',
    }}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '1.1rem' }}>{icon}</span>
          <span style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: c.textMid }}>
            {label}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
          {isEmpty ? (
            <span style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: c.rose, background: 'rgba(158,42,43,0.07)', border: '1px solid rgba(158,42,43,0.2)', borderRadius: '20px', padding: '0.15rem 0.55rem' }}>
              Required
            </span>
          ) : chips.length < 3 ? (
            <span style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: c.teal, background: 'rgba(29,82,82,0.07)', border: '1px solid rgba(29,82,82,0.2)', borderRadius: '20px', padding: '0.15rem 0.55rem' }}>
              + {3 - chips.length} optional
            </span>
          ) : (
            <span style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: c.teal, background: 'rgba(29,82,82,0.07)', border: '1px solid rgba(29,82,82,0.2)', borderRadius: '20px', padding: '0.15rem 0.55rem' }}>
              ✓ Full
            </span>
          )}
          <span style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.8rem', color: c.sepia }}>
            {chips.length}/<strong style={{ fontSize: '1rem', color: c.navy }}>3</strong>
          </span>
        </div>
      </div>

      {/* Added chips */}
      {chips.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '0.6rem' }}>
          {chips.map((chip, i) => (
            <div key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.25rem 0.65rem', background: i === 0 ? 'rgba(29,82,82,0.1)' : 'rgba(29,82,82,0.05)', border: `1px solid ${i === 0 ? 'rgba(29,82,82,0.35)' : 'rgba(29,82,82,0.18)'}`, borderRadius: '20px' }}>
              {isUrl(chip) ? (
                <a href={chip} target="_blank" rel="noopener noreferrer" title={chip}
                  style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '0.9rem', color: c.teal, textDecoration: 'underline', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {shortLabel(chip)}
                </a>
              ) : (
                <span style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '0.9rem', color: c.navy }}>{chip}</span>
              )}
              {i === 0 && <span style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.55rem', fontWeight: 700, color: c.teal, letterSpacing: '0.06em', textTransform: 'uppercase' }}>★</span>}
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
            placeholder={chips.length === 0 ? placeholder : 'Add another (optional)…'}
            style={{ flex: 1, padding: '0.65rem 0.9rem', minHeight: '44px', border: `1px solid ${isEmpty ? 'rgba(158,42,43,0.3)' : c.border}`, background: 'rgba(244,241,235,0.5)', color: c.navy, fontFamily: '"Cormorant Garamond", serif', fontSize: '1rem', fontStyle: 'italic', borderRadius: '5px', outline: 'none' }}
            onFocus={e => (e.target.style.borderColor = c.teal)}
            onBlur={e => (e.target.style.borderColor = isEmpty ? 'rgba(158,42,43,0.3)' : c.border)}
          />
          <button type="button" onClick={addChip} disabled={!input.trim()}
            style={{ width: '44px', height: '44px', background: input.trim() ? c.teal : 'rgba(29,82,82,0.2)', color: '#fff', border: 'none', borderRadius: '5px', cursor: input.trim() ? 'pointer' : 'default', fontSize: '1.1rem', fontWeight: 700, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            +
          </button>
        </div>
      )}
    </div>
  )
}

export default function PersonalityStep({ data, onChange }: Props) {
  const hasSavedData = CATEGORIES.some(cat => !!data[cat.key as keyof PersonalityData])

  return (
    <div>
      <h2 className="ob-step-h2" style={{ color: c.navy, margin: '0 0 0.15rem', fontSize: '2.1rem' }}>
        Your Personality
      </h2>
      <p style={{ fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontSize: '1.35rem', color: c.gold, margin: '0 0 0.75rem' }}>
        आपका व्यक्तित्व
      </p>

      {hasSavedData ? (
        <div style={{ background: 'rgba(29,82,82,0.06)', border: '1px solid rgba(29,82,82,0.25)', borderRadius: '8px', padding: '0.85rem 1.1rem', marginBottom: '1rem' }}>
          <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.9rem', color: '#1d5252', margin: 0, lineHeight: 1.7, fontWeight: 600 }}>
            ✓ Sharing your favourites helps other members understand your personality and choices — and brings you closer to finding the right life partner. Tap any category below to add or remove items.
          </p>
          <p style={{ fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontSize: '0.95rem', color: '#1d5252', margin: '0.4rem 0 0', lineHeight: 1.7 }}>
            अपनी पसंद साझा करने से अन्य सदस्यों को आपका व्यक्तित्व और पसंद समझने में मदद मिलती है — और आपको सही जीवन साथी खोजने में आसानी होती है। नीचे किसी भी श्रेणी पर टैप करके आइटम जोड़ें या हटाएं।
          </p>
        </div>
      ) : (
        <div style={{ background: '#fff', border: `1px solid ${c.border}`, borderRadius: '8px', padding: '1rem 1.1rem', marginBottom: '1rem' }}>
          <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.9rem', color: c.navy, margin: 0, lineHeight: 1.7, fontWeight: 600 }}>
            Sharing your favourite movies, music, travel spots, foods and more helps other members understand your personality and choices — and brings you closer to finding the right life partner.
          </p>
          <p style={{ fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontSize: '0.95rem', color: c.gold, margin: '0.4rem 0 0', lineHeight: 1.7 }}>
            अपनी पसंदीदा फ़िल्में, संगीत, यात्रा स्थल, खाना और बहुत कुछ साझा करना अन्य सदस्यों को आपका व्यक्तित्व और पसंद समझने में मदद करता है — और आपको सही जीवन साथी खोजने के करीब लाता है।
          </p>
        </div>
      )}

      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
        <span style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.68rem', fontWeight: 700, color: c.rose, letterSpacing: '0.08em', textTransform: 'uppercase', background: 'rgba(158,42,43,0.07)', border: '1px solid rgba(158,42,43,0.2)', borderRadius: '20px', padding: '0.2rem 0.7rem' }}>
          1 entry per category required
        </span>
        <span style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.68rem', fontWeight: 700, color: c.teal, letterSpacing: '0.08em', textTransform: 'uppercase', background: 'rgba(29,82,82,0.07)', border: '1px solid rgba(29,82,82,0.2)', borderRadius: '20px', padding: '0.2rem 0.7rem' }}>
          up to 2 more optional
        </span>
      </div>
      <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.85rem', color: c.sepia, margin: '0 0 0.5rem', letterSpacing: '0.02em' }}>
        Type a name or paste a link, then press Enter or +
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
