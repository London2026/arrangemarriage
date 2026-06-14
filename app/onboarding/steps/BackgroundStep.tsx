import React from 'react'

const c = { navy: '#0d1f3c', gold: '#8b6914', sepia: '#5a6e82', textMid: '#2c4a6e' }
const label = { display: 'block', fontFamily: 'Raleway, sans-serif', fontSize: '0.72rem', fontWeight: 600 as const, letterSpacing: '0.18em', textTransform: 'uppercase' as const, color: c.textMid, marginBottom: '0.45rem' }
const inp = { width: '100%', padding: '0.85rem 0.9rem', minHeight: '48px', border: '1px solid rgba(13,31,60,0.18)', background: 'rgba(244,241,235,0.4)', color: c.navy, fontSize: '1rem', fontFamily: '"Cormorant Garamond", Georgia, serif', outline: 'none', borderRadius: '4px', boxSizing: 'border-box' as const, transition: 'border-color 0.2s', appearance: 'auto' as const }
const field = { marginBottom: '1.1rem' }
const focus = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => (e.target.style.borderColor = '#1b3a6b')
const blur  = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => (e.target.style.borderColor = 'rgba(13,31,60,0.18)')

const RELIGIONS      = ['Hindu', 'Muslim', 'Christian', 'Sikh', 'Jain', 'Buddhist', 'Jewish', 'Zoroastrian', 'Other', 'Prefer not to say']
const EDUCATIONS     = ["High School", "Diploma", "Bachelor's Degree", "Master's Degree", "Doctorate (PhD)", "Other"]
const MARITAL_STATUS = ['Single', 'Married', 'Separated', 'Widowed']
const KIDS_OPTIONS   = ['No children', 'Has children', 'Not Applicable']
const SALARY_OPTIONS = [
  'Under ₹3 LPA', '₹3–5 LPA', '₹5–8 LPA', '₹8–12 LPA',
  '₹12–20 LPA', '₹20–35 LPA', '₹35–50 LPA', '₹50 LPA+',
  'Prefer to discuss later',
]

interface Props {
  data: {
    religion: string; caste: string; motherTongue: string
    education: string; universityName: string; educationSubject: string; otherQualifications: string
    occupation: string; occupationCity: string; annualSalary: string
    maritalStatus: string; hasKids: string
  }
  onChange: (key: string, value: string) => void
}

function Row({ children }: { children: React.ReactNode }) {
  return <div className="ob-row">{children}</div>
}

export default function BackgroundStep({ data, onChange }: Props) {
  return (
    <div>
      <h2 className="ob-step-h2" style={{ color: c.navy, margin: '0 0 0.25rem' }}>Your heritage</h2>
      <p style={{ fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontSize: '1rem', color: c.sepia, margin: '0 0 1rem' }}>
        Background helps us find meaningful connections
      </p>
      <div style={{ height: '1px', background: `linear-gradient(to right, ${c.gold}, transparent)`, marginBottom: '1.25rem' }} />

      {/* Religion + Caste */}
      <Row>
        <div>
          <label style={label}>Religion</label>
          <select value={data.religion} onChange={e => onChange('religion', e.target.value)} style={inp} onFocus={focus} onBlur={blur}>
            <option value="">Select religion</option>
            {RELIGIONS.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        <div>
          <label style={label}>Caste</label>
          <input type="text" value={data.caste} onChange={e => onChange('caste', e.target.value)}
            placeholder="e.g. Brahmin, Kshatriya…" style={inp} onFocus={focus} onBlur={blur} />
        </div>
      </Row>

      {/* Mother Tongue */}
      <div style={field}>
        <label style={label}>Mother Tongue</label>
        <input type="text" value={data.motherTongue} onChange={e => onChange('motherTongue', e.target.value)}
          placeholder="e.g. Hindi, Tamil…" style={inp} onFocus={focus} onBlur={blur} />
      </div>

      {/* Education level + University name */}
      <Row>
        <div>
          <label style={label}>Education Level</label>
          <select value={data.education} onChange={e => onChange('education', e.target.value)} style={inp} onFocus={focus} onBlur={blur}>
            <option value="">Select level</option>
            {EDUCATIONS.map(e => <option key={e} value={e}>{e}</option>)}
          </select>
        </div>
        <div>
          <label style={label}>University / College Name</label>
          <input type="text" value={data.universityName} onChange={e => onChange('universityName', e.target.value)}
            placeholder="e.g. IIT Bombay, Delhi University…" style={inp} onFocus={focus} onBlur={blur} />
        </div>
      </Row>

      {/* Subject + Other qualifications */}
      <Row>
        <div>
          <label style={label}>Subject / Specialization</label>
          <input type="text" value={data.educationSubject} onChange={e => onChange('educationSubject', e.target.value)}
            placeholder="e.g. Computer Science, MBA…" style={inp} onFocus={focus} onBlur={blur} />
        </div>
        <div>
          <label style={label}>Other Qualifications</label>
          <input type="text" value={data.otherQualifications} onChange={e => onChange('otherQualifications', e.target.value)}
            placeholder="e.g. PhD, CFA, AWS Certified, IELTS…" style={inp} onFocus={focus} onBlur={blur} />
          <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.7rem', color: c.sepia, margin: '0.2rem 0 0' }}>
            PhD, professional certificates, courses — anything relevant
          </p>
        </div>
      </Row>

      {/* Occupation + City of occupation */}
      <Row>
        <div>
          <label style={label}>Occupation</label>
          <input type="text" value={data.occupation} onChange={e => onChange('occupation', e.target.value)}
            placeholder="e.g. Software Engineer…" style={inp} onFocus={focus} onBlur={blur} />
        </div>
        <div>
          <label style={label}>City of Work</label>
          <input type="text" value={data.occupationCity} onChange={e => onChange('occupationCity', e.target.value)}
            placeholder="e.g. Bengaluru, Mumbai…" style={inp} onFocus={focus} onBlur={blur} />
        </div>
      </Row>

      {/* Annual salary */}
      <div style={field}>
        <label style={label}>Annual Salary Range</label>
        <select value={data.annualSalary} onChange={e => onChange('annualSalary', e.target.value)} style={inp} onFocus={focus} onBlur={blur}>
          <option value="">Select range</option>
          {SALARY_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Marital + Kids */}
      <Row>
        <div>
          <label style={label}>Marital Status</label>
          <select value={data.maritalStatus} onChange={e => onChange('maritalStatus', e.target.value)} style={inp} onFocus={focus} onBlur={blur}>
            <option value="">Select status</option>
            {MARITAL_STATUS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label style={label}>Children</label>
          <select value={data.hasKids} onChange={e => onChange('hasKids', e.target.value)} style={inp} onFocus={focus} onBlur={blur}>
            <option value="">Select option</option>
            {KIDS_OPTIONS.map(k => <option key={k} value={k}>{k}</option>)}
          </select>
        </div>
      </Row>
    </div>
  )
}
