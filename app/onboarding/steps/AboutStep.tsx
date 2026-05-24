const c = { navy: '#0d1f3c', gold: '#8b6914', sepia: '#5a6e82', textMid: '#2c4a6e', rose: '#9e2a2b' }
const label = { display: 'block', fontFamily: 'Raleway, sans-serif', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase' as const, color: c.textMid, marginBottom: '0.5rem' }
const inp = { width: '100%', padding: '0.85rem 1rem', border: '1px solid rgba(13,31,60,0.18)', background: 'rgba(244,241,235,0.4)', color: c.navy, fontSize: '1.05rem', fontFamily: '"Cormorant Garamond", Georgia, serif', outline: 'none', borderRadius: '4px', boxSizing: 'border-box' as const, transition: 'border-color 0.2s' }
const field = { marginBottom: '1.4rem' }
const focus = (e: React.FocusEvent<HTMLInputElement>) => (e.target.style.borderColor = '#1b3a6b')
const blur  = (e: React.FocusEvent<HTMLInputElement>) => (e.target.style.borderColor = 'rgba(13,31,60,0.18)')

const GENDERS = ['Man', 'Woman', 'Other']

interface Props {
  data: { firstName: string; lastName: string; age: string; gender: string; city: string; country: string; phone: string }
  onChange: (key: string, value: string) => void
}

export default function AboutStep({ data, onChange }: Props) {
  return (
    <div>
      <h2 className="ob-step-h2" style={{ color: c.navy, margin: '0 0 0.25rem' }}>
        Tell us about yourself
      </h2>
      <p style={{ fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontSize: '1rem', color: c.sepia, margin: '0 0 1rem' }}>
        Help us find your perfect match
      </p>
      <div style={{ height: '1px', background: `linear-gradient(to right, ${c.gold}, transparent)`, marginBottom: '1.25rem' }} />

      {/* First Name + Last Name */}
      <style>{`.ob-name-grid,.ob-loc-grid{display:grid;grid-template-columns:1fr 1fr;gap:0.75rem} @media(max-width:480px){.ob-name-grid,.ob-loc-grid{grid-template-columns:1fr}}`}</style>
      <div className="ob-name-grid" style={{ marginBottom: '1.1rem' }}>
        <div>
          <label style={label}>First Name</label>
          <input type="text" value={data.firstName} onChange={e => onChange('firstName', e.target.value)}
            placeholder="e.g. Anup" style={inp} onFocus={focus} onBlur={blur} />
        </div>
        <div>
          <label style={label}>Last Name</label>
          <input type="text" value={data.lastName} onChange={e => onChange('lastName', e.target.value)}
            placeholder="e.g. Sharma" style={inp} onFocus={focus} onBlur={blur} />
          <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.78rem', color: c.sepia, margin: '0.25rem 0 0', letterSpacing: '0.05em' }}>
            Others see first name + initial only
          </p>
        </div>
      </div>

      {/* Age */}
      <div style={field}>
        <label style={label}>Age</label>
        <input type="number" min={18} max={100} value={data.age} onChange={e => onChange('age', e.target.value)}
          placeholder="Your age" style={inp} onFocus={focus} onBlur={blur} />
      </div>

      {/* Gender */}
      <div style={field}>
        <label style={label}>I am a</label>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {GENDERS.map(g => (
            <button key={g} type="button" onClick={() => onChange('gender', g)}
              style={{ flex: 1, padding: '0.8rem', border: data.gender === g ? `1px solid #1b3a6b` : '1px solid rgba(13,31,60,0.18)', background: data.gender === g ? 'rgba(27,58,107,0.07)' : 'transparent', color: data.gender === g ? '#1b3a6b' : c.sepia, fontFamily: 'Raleway, sans-serif', fontSize: '0.78rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer', borderRadius: '4px', transition: 'all 0.2s' }}>
              {g}
            </button>
          ))}
        </div>
      </div>

      {/* City + Country */}
      <div className="ob-loc-grid">
        <div>
          <label style={label}>City</label>
          <input type="text" value={data.city} onChange={e => onChange('city', e.target.value)}
            placeholder="London" style={inp} onFocus={focus} onBlur={blur} />
        </div>
        <div>
          <label style={label}>Country</label>
          <input type="text" value={data.country} onChange={e => onChange('country', e.target.value)}
            placeholder="United Kingdom" style={inp} onFocus={focus} onBlur={blur} />
        </div>
      </div>

      {/* WhatsApp / Phone */}
      <div style={{ ...field, marginTop: '1.1rem' }}>
        <label style={label}>WhatsApp Number</label>
        <input type="tel" value={data.phone} onChange={e => onChange('phone', e.target.value)}
          placeholder="+44 7911 123456" style={inp} onFocus={focus} onBlur={blur} />
        <div style={{ marginTop: '0.5rem', background: 'rgba(139,105,20,0.07)', border: '1px solid rgba(139,105,20,0.2)', borderRadius: '4px', padding: '0.5rem 0.7rem' }}>
          <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.85rem', color: c.sepia, margin: 0, lineHeight: 1.6 }}>
            📲 You will receive video meeting requests directly on this WhatsApp number. Please include your country code — for example, <strong style={{ color: c.navy }}>+44</strong> for the United Kingdom or <strong style={{ color: c.navy }}>+91</strong> for India.
          </p>
        </div>
      </div>
    </div>
  )
}
