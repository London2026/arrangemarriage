import React from 'react'

const c = { navy: '#0d1f3c', gold: '#8b6914', sepia: '#5a6e82', textMid: '#2c4a6e' }
const label = { display: 'block', fontFamily: 'Raleway, sans-serif', fontSize: '0.72rem', fontWeight: 600 as const, letterSpacing: '0.18em', textTransform: 'uppercase' as const, color: c.textMid, marginBottom: '0.45rem' }
const inp = { width: '100%', padding: '0.75rem 0.9rem', border: '1px solid rgba(13,31,60,0.18)', background: 'rgba(244,241,235,0.4)', color: c.navy, fontSize: '1rem', fontFamily: '"Cormorant Garamond", Georgia, serif', outline: 'none', borderRadius: '4px', boxSizing: 'border-box' as const, transition: 'border-color 0.2s', appearance: 'auto' as const }
const field = { marginBottom: '1.1rem' }
const focus = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => (e.target.style.borderColor = '#1b3a6b')
const blur  = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => (e.target.style.borderColor = 'rgba(13,31,60,0.18)')

const GENDERS    = ['Man', 'Woman', 'Either']
const RELIGIONS  = ['Hindu', 'Muslim', 'Christian', 'Sikh', 'Jain', 'Buddhist', 'Jewish', 'Zoroastrian', 'Any']
const EDUCATIONS = ["Any", "High School or above", "Diploma or above", "Bachelor's or above", "Master's or above", "Doctorate (PhD)"]
const HEIGHTS    = [
  'Any',
  "Under 5'0\" (below 152 cm)",
  "5'0\" – 5'3\" (152–160 cm)",
  "5'3\" – 5'6\" (160–168 cm)",
  "5'6\" – 5'9\" (168–175 cm)",
  "5'9\" – 6'0\" (175–183 cm)",
  "6'0\" and above (183 cm+)",
]
const COOKING = [
  'Any',
  'Loves cooking',
  'Can cook basic meals',
  'Learning to cook',
  'Prefers eating out',
  'Does not cook',
]

interface Props {
  data: {
    prefGender: string; prefAgeMin: string; prefAgeMax: string
    prefLocation: string; prefReligion: string; prefCaste: string
    prefEducation: string; prefHeight: string; prefCooking: string
    prefOther: string
  }
  onChange: (key: string, value: string) => void
}

function Row({ children }: { children: React.ReactNode }) {
  return <div className="ob-row">{children}</div>
}

export default function PreferencesStep({ data, onChange }: Props) {
  return (
    <div>
      <style>{`
        .pref-gender-btn{flex:1;min-height:48px;padding:0.75rem 0.5rem;border-radius:4px;font-family:Raleway,sans-serif;font-size:0.75rem;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;cursor:pointer;transition:all 0.2s;touch-action:manipulation}
        .pref-age-row{display:flex;align-items:center;gap:0.75rem}
        @media(max-width:480px){.pref-age-row{flex-direction:column;align-items:stretch;gap:0.5rem}.pref-age-sep{display:none}}
      `}</style>
      <h2 className="ob-step-h2" style={{ color: c.navy, margin: '0 0 0.25rem' }}>Who are you looking for?</h2>
      <p style={{ fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontSize: '1rem', color: c.sepia, margin: '0 0 1rem' }}>
        Set your partner preferences
      </p>
      <div style={{ height: '1px', background: `linear-gradient(to right, ${c.gold}, transparent)`, marginBottom: '1.25rem' }} />

      {/* Gender */}
      <div style={field}>
        <label style={label}>Looking for a</label>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {GENDERS.map(g => (
            <button key={g} type="button" onClick={() => onChange('prefGender', g)} className="pref-gender-btn"
              style={{ border: data.prefGender === g ? '1px solid #1b3a6b' : '1px solid rgba(13,31,60,0.18)', background: data.prefGender === g ? 'rgba(27,58,107,0.07)' : 'transparent', color: data.prefGender === g ? '#1b3a6b' : c.sepia }}>
              {g}
            </button>
          ))}
        </div>
      </div>

      {/* Age range */}
      <div style={field}>
        <label style={label}>Age Range</label>
        <div className="pref-age-row">
          <input type="number" min={18} max={99} value={data.prefAgeMin}
            onChange={e => onChange('prefAgeMin', e.target.value)}
            style={{ ...inp, textAlign: 'center' }} onFocus={focus} onBlur={blur} />
          <span className="pref-age-sep" style={{ fontFamily: '"Cormorant Garamond", serif', color: c.sepia, flexShrink: 0 }}>to</span>
          <input type="number" min={18} max={100} value={data.prefAgeMax}
            onChange={e => onChange('prefAgeMax', e.target.value)}
            style={{ ...inp, textAlign: 'center' }} onFocus={focus} onBlur={blur} />
        </div>
      </div>

      {/* Location + Religion */}
      <Row>
        <div>
          <label style={label}>Preferred Location</label>
          <input type="text" value={data.prefLocation} onChange={e => onChange('prefLocation', e.target.value)}
            placeholder="e.g. Mumbai, India or Any" style={inp} onFocus={focus} onBlur={blur} />
        </div>
        <div>
          <label style={label}>Religion Preference</label>
          <select value={data.prefReligion} onChange={e => onChange('prefReligion', e.target.value)} style={inp} onFocus={focus} onBlur={blur}>
            <option value="">Select preference</option>
            {RELIGIONS.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
      </Row>

      {/* Caste Preference */}
      <div style={field}>
        <label style={label}>Caste Preference</label>
        <input type="text" value={data.prefCaste} onChange={e => onChange('prefCaste', e.target.value)}
          placeholder="e.g. Brahmin, Any caste, Open to all…" style={inp}
          onFocus={e => (e.target.style.borderColor = '#1b3a6b')}
          onBlur={e => (e.target.style.borderColor = 'rgba(13,31,60,0.18)')} />
      </div>

      {/* Education + Height */}
      <Row>
        <div>
          <label style={label}>Preferred Education</label>
          <select value={data.prefEducation} onChange={e => onChange('prefEducation', e.target.value)} style={inp} onFocus={focus} onBlur={blur}>
            <option value="">Select preference</option>
            {EDUCATIONS.map(e => <option key={e} value={e}>{e}</option>)}
          </select>
        </div>
        <div>
          <label style={label}>Preferred Height</label>
          <select value={data.prefHeight} onChange={e => onChange('prefHeight', e.target.value)} style={inp} onFocus={focus} onBlur={blur}>
            <option value="">Select preference</option>
            {HEIGHTS.map(h => <option key={h} value={h}>{h}</option>)}
          </select>
        </div>
      </Row>

      {/* Cooking preference */}
      <div style={field}>
        <label style={label}>Cooking Preference</label>
        <select value={data.prefCooking} onChange={e => onChange('prefCooking', e.target.value)} style={inp} onFocus={focus} onBlur={blur}>
          <option value="">Select preference</option>
          {COOKING.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Other Preferences */}
      <div style={field}>
        <label style={label}>Other Preferences</label>
        <textarea
          value={data.prefOther}
          onChange={e => onChange('prefOther', e.target.value)}
          placeholder="Describe any other preferences — family background, lifestyle, values, location, profession, anything that matters to you…"
          rows={5}
          style={{ ...inp, resize: 'vertical', lineHeight: 1.6 }}
          onFocus={e => (e.target.style.borderColor = '#1b3a6b')}
          onBlur={e => (e.target.style.borderColor = 'rgba(13,31,60,0.18)')}
        />
        <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.7rem', color: c.sepia, margin: '0.2rem 0 0' }}>
          Write freely — this helps members understand exactly what you are looking for
        </p>
      </div>
    </div>
  )
}
