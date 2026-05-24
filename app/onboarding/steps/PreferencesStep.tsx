const c = { navy: '#0d1f3c', gold: '#8b6914', sepia: '#5a6e82', textMid: '#2c4a6e' }
const label = { display: 'block', fontFamily: 'Raleway, sans-serif', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase' as const, color: c.textMid, marginBottom: '0.5rem' }
const inp = { width: '100%', padding: '0.85rem 1rem', border: '1px solid rgba(13,31,60,0.18)', background: 'rgba(244,241,235,0.4)', color: c.navy, fontSize: '1.05rem', fontFamily: '"Cormorant Garamond", Georgia, serif', outline: 'none', borderRadius: '4px', boxSizing: 'border-box' as const, transition: 'border-color 0.2s', appearance: 'auto' as const }
const field = { marginBottom: '1.4rem' }
const focus = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => (e.target.style.borderColor = '#1b3a6b')
const blur  = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => (e.target.style.borderColor = 'rgba(13,31,60,0.18)')

const GENDERS   = ['Man', 'Woman', 'Either']
const RELIGIONS = ['Hindu', 'Muslim', 'Christian', 'Sikh', 'Jain', 'Buddhist', 'Jewish', 'Zoroastrian', 'Any']

interface Props {
  data: { prefGender: string; prefAgeMin: string; prefAgeMax: string; prefLocation: string; prefReligion: string }
  onChange: (key: string, value: string) => void
}

export default function PreferencesStep({ data, onChange }: Props) {
  return (
    <div>
      <h2 className="ob-step-h2" style={{ color: c.navy, margin: '0 0 0.25rem' }}>
        Who are you looking for?
      </h2>
      <p style={{ fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontSize: '1rem', color: c.sepia, margin: '0 0 1rem' }}>
        Set your partner preferences
      </p>
      <div style={{ height: '1px', background: `linear-gradient(to right, ${c.gold}, transparent)`, marginBottom: '1.25rem' }} />

      {/* Gender preference */}
      <div style={field}>
        <label style={label}>Looking for a</label>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {GENDERS.map(g => (
            <button key={g} type="button" onClick={() => onChange('prefGender', g)}
              style={{ flex: 1, padding: '0.8rem', border: data.prefGender === g ? '1px solid #1b3a6b' : '1px solid rgba(13,31,60,0.18)', background: data.prefGender === g ? 'rgba(27,58,107,0.07)' : 'transparent', color: data.prefGender === g ? '#1b3a6b' : c.sepia, fontFamily: 'Raleway, sans-serif', fontSize: '0.78rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer', borderRadius: '4px', transition: 'all 0.2s' }}>
              {g}
            </button>
          ))}
        </div>
      </div>

      {/* Age range */}
      <div style={field}>
        <label style={label}>Age Range</label>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <input type="number" min={18} max={99} value={data.prefAgeMin} onChange={e => onChange('prefAgeMin', e.target.value)}
            style={{ ...inp, textAlign: 'center' }} onFocus={focus} onBlur={blur} />
          <span style={{ fontFamily: '"Cormorant Garamond", serif', color: c.sepia, flexShrink: 0 }}>to</span>
          <input type="number" min={18} max={100} value={data.prefAgeMax} onChange={e => onChange('prefAgeMax', e.target.value)}
            style={{ ...inp, textAlign: 'center' }} onFocus={focus} onBlur={blur} />
        </div>
      </div>

      {/* Location */}
      <div style={field}>
        <label style={label}>Preferred Location</label>
        <input type="text" value={data.prefLocation} onChange={e => onChange('prefLocation', e.target.value)}
          placeholder="e.g. London, UK  or  Any" style={inp} onFocus={focus} onBlur={blur} />
      </div>

      {/* Religion preference */}
      <div style={field}>
        <label style={label}>Religion Preference</label>
        <select value={data.prefReligion} onChange={e => onChange('prefReligion', e.target.value)} style={inp} onFocus={focus} onBlur={blur}>
          <option value="">Select preference</option>
          {RELIGIONS.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>
    </div>
  )
}
