const c = { navy: '#0d1f3c', gold: '#8b6914', sepia: '#5a6e82', textMid: '#2c4a6e' }
const label = { display: 'block', fontFamily: 'Raleway, sans-serif', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase' as const, color: c.textMid, marginBottom: '0.5rem' }
const inp = { width: '100%', padding: '0.85rem 1rem', border: '1px solid rgba(13,31,60,0.18)', background: 'rgba(244,241,235,0.4)', color: c.navy, fontSize: '1.05rem', fontFamily: '"Cormorant Garamond", Georgia, serif', outline: 'none', borderRadius: '4px', boxSizing: 'border-box' as const, transition: 'border-color 0.2s', appearance: 'auto' as const }
const field = { marginBottom: '1.4rem' }
const focus = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => (e.target.style.borderColor = '#1b3a6b')
const blur  = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => (e.target.style.borderColor = 'rgba(13,31,60,0.18)')

const RELIGIONS      = ['Hindu', 'Muslim', 'Christian', 'Sikh', 'Jain', 'Buddhist', 'Jewish', 'Zoroastrian', 'Other', 'Prefer not to say']
const EDUCATIONS     = ["High School", "Diploma", "Bachelor's Degree", "Master's Degree", "Doctorate (PhD)", "Other"]
const MARITAL_STATUS = ['Single', 'Married', 'Separated', 'Widowed']
const KIDS_OPTIONS   = ['No children', 'Has children']

interface Props {
  data: { religion: string; motherTongue: string; education: string; occupation: string; maritalStatus: string; hasKids: string }
  onChange: (key: string, value: string) => void
}

export default function BackgroundStep({ data, onChange }: Props) {
  return (
    <div>
      <h2 className="ob-step-h2" style={{ color: c.navy, margin: '0 0 0.25rem' }}>
        Your heritage
      </h2>
      <p style={{ fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontSize: '1rem', color: c.sepia, margin: '0 0 1rem' }}>
        Background helps us find meaningful connections
      </p>
      <div style={{ height: '1px', background: `linear-gradient(to right, ${c.gold}, transparent)`, marginBottom: '1.25rem' }} />

      <div style={field}>
        <label style={label}>Religion</label>
        <select value={data.religion} onChange={e => onChange('religion', e.target.value)} style={inp} onFocus={focus} onBlur={blur}>
          <option value="">Select religion</option>
          {RELIGIONS.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>

      <div style={field}>
        <label style={label}>Mother Tongue</label>
        <input type="text" value={data.motherTongue} onChange={e => onChange('motherTongue', e.target.value)}
          placeholder="e.g. Gujarati, Tamil, Punjabi…" style={inp} onFocus={focus} onBlur={blur} />
      </div>

      <div style={field}>
        <label style={label}>Education</label>
        <select value={data.education} onChange={e => onChange('education', e.target.value)} style={inp} onFocus={focus} onBlur={blur}>
          <option value="">Select education level</option>
          {EDUCATIONS.map(e => <option key={e} value={e}>{e}</option>)}
        </select>
      </div>

      <div style={field}>
        <label style={label}>Occupation</label>
        <input type="text" value={data.occupation} onChange={e => onChange('occupation', e.target.value)}
          placeholder="e.g. Software Engineer, Doctor…" style={inp} onFocus={focus} onBlur={blur} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div style={field}>
          <label style={label}>Marital Status</label>
          <select value={data.maritalStatus} onChange={e => onChange('maritalStatus', e.target.value)} style={inp} onFocus={focus} onBlur={blur}>
            <option value="">Select status</option>
            {MARITAL_STATUS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div style={field}>
          <label style={label}>Children</label>
          <select value={data.hasKids} onChange={e => onChange('hasKids', e.target.value)} style={inp} onFocus={focus} onBlur={blur}>
            <option value="">Select option</option>
            {KIDS_OPTIONS.map(k => <option key={k} value={k}>{k}</option>)}
          </select>
        </div>
      </div>
    </div>
  )
}
