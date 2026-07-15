import React from 'react'

const c = { navy: '#0d1f3c', gold: '#8b6914', sepia: '#5a6e82', textMid: '#2c4a6e' }
const labelStyle = { display: 'block', fontFamily: 'Raleway, sans-serif', fontSize: '0.72rem', fontWeight: 600 as const, letterSpacing: '0.18em', textTransform: 'uppercase' as const, color: c.textMid, marginBottom: '0.3rem' }
const inpStyle = { width: '100%', padding: '0.75rem 0.9rem', minHeight: '44px', border: '1px solid rgba(13,31,60,0.18)', background: 'rgba(244,241,235,0.4)', color: c.navy, fontSize: '1rem', fontFamily: '"Cormorant Garamond", Georgia, serif', outline: 'none', borderRadius: '4px', boxSizing: 'border-box' as const, transition: 'border-color 0.2s', appearance: 'auto' as const }

const OPTS = ['No', 'Yes', 'Sometimes', 'Never']

interface Props {
  data: { smoking: string; alcohol: string; drugs: string; betting: string }
  onChange: (key: string, value: string) => void
}

const focus = (e: React.FocusEvent<HTMLSelectElement>) => (e.target.style.borderColor = '#1b3a6b')
const blur  = (e: React.FocusEvent<HTMLSelectElement>) => (e.target.style.borderColor = 'rgba(13,31,60,0.18)')

function Habit({ lbl, desc, k, val, onChange }: { lbl: string; desc: string; k: string; val: string; onChange: (k: string, v: string) => void }) {
  return (
    <div>
      <label style={labelStyle}>{lbl}</label>
      <p className="habit-desc" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif', fontStyle: 'italic', fontSize: '0.9rem', color: c.sepia, margin: '0 0 0.4rem', lineHeight: 1.4 }}>{desc}</p>
      <select value={val} onChange={e => onChange(k, e.target.value)} style={inpStyle} onFocus={focus} onBlur={blur}>
        <option value="">Select an answer</option>
        {OPTS.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  )
}

export default function HabitsStep({ data, onChange }: Props) {
  return (
    <div>
      <style>{`
        .habit-desc { min-height: 2.6rem; }
        @media (max-width: 640px) { .habit-desc { min-height: 0; } }
      `}</style>
      <h2 className="ob-step-h2" style={{ color: c.navy, margin: '0 0 0.25rem' }}>Lifestyle & Habits</h2>
      <p style={{ fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontSize: '1rem', color: c.sepia, margin: '0 0 1rem' }}>
        Shared values make for stronger partnerships
      </p>
      <div style={{ height: '1px', background: `linear-gradient(to right, ${c.gold}, transparent)`, marginBottom: '1.25rem' }} />

      <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.78rem', color: c.sepia, margin: '0 0 1.25rem', lineHeight: 1.6, letterSpacing: '0.02em' }}>
        Your answers are visible to potential matches. Honest answers lead to better compatibility — and a better match.
      </p>

      <div className="ob-row">
        <Habit lbl="Smoking" desc="Do you smoke cigarettes, cigars, or use tobacco products?" k="smoking" val={data.smoking} onChange={onChange} />
        <Habit lbl="Drinking" desc="Do you consume alcohol?" k="alcohol" val={data.alcohol} onChange={onChange} />
      </div>
      <div className="ob-row">
        <Habit lbl="Recreational Drugs" desc="Do you use recreational drugs?" k="drugs" val={data.drugs} onChange={onChange} />
        <Habit lbl="Gambling & Betting" desc="Do you gamble, bet, or play games for money?" k="betting" val={data.betting} onChange={onChange} />
      </div>

      <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.72rem', color: 'rgba(90,110,130,0.7)', margin: '0.5rem 0 0', lineHeight: 1.5, letterSpacing: '0.02em' }}>
        All fields are optional. You can update these at any time from your profile settings.
      </p>
    </div>
  )
}
