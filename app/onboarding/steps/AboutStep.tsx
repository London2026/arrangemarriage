import React from 'react'

const c = { navy: '#0d1f3c', gold: '#8b6914', sepia: '#5a6e82', textMid: '#2c4a6e', rose: '#9e2a2b', teal: '#1D5252' }
const label = { display: 'block', fontFamily: 'Raleway, sans-serif', fontSize: '0.72rem', fontWeight: 600 as const, letterSpacing: '0.18em', textTransform: 'uppercase' as const, color: c.textMid, marginBottom: '0.45rem' }
const inp = { width: '100%', padding: '0.75rem 0.9rem', minHeight: '44px', border: '1px solid rgba(13,31,60,0.18)', background: 'rgba(244,241,235,0.4)', color: c.navy, fontSize: '1rem', fontFamily: '"Cormorant Garamond", Georgia, serif', outline: 'none', borderRadius: '4px', boxSizing: 'border-box' as const, transition: 'border-color 0.2s', appearance: 'auto' as const }
const field = { marginBottom: '1.1rem' }
const focus = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => (e.target.style.borderColor = '#1b3a6b')
const blur  = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => (e.target.style.borderColor = 'rgba(13,31,60,0.18)')

const GENDERS   = ['Man', 'Woman', 'Other']
const HOUSING   = ['Own House', 'Rented House', 'Family Home', 'Other']
const YES_NO    = ['No', 'Yes']
const FOOD      = ['Vegetarian', 'Non-Vegetarian', 'Vegan', 'Jain', 'Mix / Flexible']
const SMOKE_ALC = ['No', 'Yes', 'Occasionally']
const RASHI = [
  'Mesha (Aries)', 'Vrishabha (Taurus)', 'Mithuna (Gemini)', 'Karka (Cancer)',
  'Simha (Leo)', 'Kanya (Virgo)', 'Tula (Libra)', 'Vrishchika (Scorpio)',
  'Dhanu (Sagittarius)', 'Makara (Capricorn)', 'Kumbha (Aquarius)', 'Meena (Pisces)',
  "Don't know",
]

interface Props {
  data: {
    firstName: string; lastName: string; age: string; gender: string; city: string; country: string; phone: string
    height: string; weight: string; rashi: string
    brothers: string; sisters: string; fatherOccupation: string; motherOccupation: string
    housing: string; ownFarmLand: string; disability: string; foodHabits: string; smoking: string; alcohol: string; hobby: string
  }
  onChange: (key: string, value: string) => void
}

function Row({ children }: { children: React.ReactNode }) {
  return <div className="ob-row">{children}</div>
}

function Sel({ lbl, k, val, opts, ph, onChange }: { lbl: string; k: string; val: string; opts: string[]; ph: string; onChange: (k: string, v: string) => void }) {
  return (
    <div>
      <label style={label}>{lbl}</label>
      <select value={val} onChange={e => onChange(k, e.target.value)} style={inp} onFocus={focus} onBlur={blur}>
        <option value="">{ph}</option>
        {opts.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  )
}

function Inp({ lbl, k, val, ph, type = 'text', onChange }: { lbl: string; k: string; val: string; ph: string; type?: string; onChange: (k: string, v: string) => void }) {
  return (
    <div>
      <label style={label}>{lbl}</label>
      <input type={type} value={val} onChange={e => onChange(k, e.target.value)} placeholder={ph} style={inp} onFocus={focus} onBlur={blur} />
    </div>
  )
}

export default function AboutStep({ data, onChange }: Props) {
  return (
    <div>
      <h2 className="ob-step-h2" style={{ color: c.navy, margin: '0 0 0.25rem' }}>Tell us about yourself</h2>
      <p style={{ fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontSize: '1rem', color: c.sepia, margin: '0 0 1rem' }}>
        Help us find your perfect match
      </p>
      <div style={{ height: '1px', background: `linear-gradient(to right, ${c.gold}, transparent)`, marginBottom: '1.25rem' }} />

      <style>{`
        .ob-name-grid{display:grid;grid-template-columns:1fr 1fr;gap:0.75rem;margin-bottom:1.1rem}
        @media(max-width:640px){.ob-name-grid{grid-template-columns:1fr}}
        .ob-gender-btn{flex:1;min-height:48px;padding:0.75rem 0.3rem;border-radius:4px;font-family:Raleway,sans-serif;font-size:0.75rem;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;cursor:pointer;transition:all 0.2s;touch-action:manipulation}
      `}</style>

      {/* Name */}
      <div className="ob-name-grid">
        <Inp lbl="First Name" k="firstName" val={data.firstName} ph="e.g. Anup" onChange={onChange} />
        <div>
          <Inp lbl="Last Name" k="lastName" val={data.lastName} ph="e.g. Sharma" onChange={onChange} />
          <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.72rem', color: c.sepia, margin: '0.2rem 0 0', letterSpacing: '0.05em' }}>
            Others see first name + initial only
          </p>
        </div>
      </div>

      {/* Age + Gender */}
      <Row>
        <Inp lbl="Age" k="age" val={data.age} ph="Your age" type="number" onChange={onChange} />
        <div>
          <label style={label}>I am a</label>
          <div style={{ display: 'flex', gap: '0.4rem' }}>
            {GENDERS.map(g => (
              <button key={g} type="button" onClick={() => onChange('gender', g)} className="ob-gender-btn"
                style={{ border: data.gender === g ? '1px solid #1b3a6b' : '1px solid rgba(13,31,60,0.18)', background: data.gender === g ? 'rgba(27,58,107,0.07)' : 'transparent', color: data.gender === g ? '#1b3a6b' : c.sepia }}>
                {g}
              </button>
            ))}
          </div>
        </div>
      </Row>

      {/* Height + Weight */}
      <Row>
        <Inp lbl="Height" k="height" val={data.height} ph="e.g. 5ft 8in or 173 cm" onChange={onChange} />
        <Inp lbl="Weight" k="weight" val={data.weight} ph="e.g. 70 kg" onChange={onChange} />
      </Row>

      {/* Rashi / Zodiac sign */}
      <div style={field}>
        <Sel lbl="Rashi / Zodiac Sign" k="rashi" val={data.rashi} opts={RASHI} ph="Select Rashi" onChange={onChange} />
      </div>

      {/* City + Country */}
      <Row>
        <Inp lbl="City" k="city" val={data.city} ph="Mumbai" onChange={onChange} />
        <Inp lbl="Country" k="country" val={data.country} ph="India" onChange={onChange} />
      </Row>

      {/* Mobile — required */}
      <div style={{ ...field }}>
        <label style={{ ...label, color: c.teal }}>
          Mobile Number <span style={{ color: '#e74c3c' }}>*</span>
        </label>
        <input type="tel" value={data.phone} onChange={e => onChange('phone', e.target.value)}
          placeholder="+91 98765 43210" style={inp} onFocus={focus} onBlur={blur} required />
        <div style={{ marginTop: '0.4rem', background: 'rgba(29,82,82,0.06)', border: '1px solid rgba(29,82,82,0.2)', borderRadius: '4px', padding: '0.45rem 0.7rem' }}>
          <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.78rem', color: c.sepia, margin: 0, lineHeight: 1.5 }}>
            📲 Meeting requests will be sent to this number. Include country code — e.g. <strong style={{ color: c.navy }}>+91</strong> for India.
          </p>
        </div>
      </div>

      {/* Brothers + Sisters */}
      <Row>
        <Inp lbl="No. of Brothers" k="brothers" val={data.brothers} ph="e.g. 1" type="number" onChange={onChange} />
        <Inp lbl="No. of Sisters" k="sisters" val={data.sisters} ph="e.g. 2" type="number" onChange={onChange} />
      </Row>

      {/* Father + Mother occupation */}
      <Row>
        <Inp lbl="Father's Occupation" k="fatherOccupation" val={data.fatherOccupation} ph="e.g. Retired Teacher" onChange={onChange} />
        <Inp lbl="Mother's Occupation" k="motherOccupation" val={data.motherOccupation} ph="e.g. Homemaker" onChange={onChange} />
      </Row>

      {/* Housing + Own Farm Land */}
      <Row>
        <Sel lbl="Housing" k="housing" val={data.housing} opts={HOUSING} ph="Select housing" onChange={onChange} />
        <Sel lbl="Own Farm Land" k="ownFarmLand" val={data.ownFarmLand} opts={YES_NO} ph="Select" onChange={onChange} />
      </Row>

      {/* Disability + Food Habits */}
      <Row>
        <Sel lbl="Disability" k="disability" val={data.disability} opts={YES_NO} ph="Select" onChange={onChange} />
        <Sel lbl="Food Habits" k="foodHabits" val={data.foodHabits} opts={FOOD} ph="Select" onChange={onChange} />
      </Row>

      {/* Hobby */}
      <div style={field}>
        <Inp lbl="Hobby / Interests" k="hobby" val={data.hobby} ph="e.g. Cricket, Reading…" onChange={onChange} />
      </div>

      {/* Smoking + Alcohol */}
      <Row>
        <Sel lbl="Smoking" k="smoking" val={data.smoking} opts={SMOKE_ALC} ph="Select" onChange={onChange} />
        <Sel lbl="Alcohol" k="alcohol" val={data.alcohol} opts={SMOKE_ALC} ph="Select" onChange={onChange} />
      </Row>
    </div>
  )
}
