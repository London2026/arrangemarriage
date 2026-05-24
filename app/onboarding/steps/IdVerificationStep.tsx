'use client'

import { useRef, useState } from 'react'

const c = { navy: '#0d1f3c', gold: '#8b6914', goldLight: '#c9a84c', sepia: '#5a6e82', textMid: '#2c4a6e', green: '#16a34a' }

const COUNTRIES = [
  'United Kingdom','United States','Canada','Australia','India','Pakistan','Bangladesh',
  'Sri Lanka','Nepal','UAE','Qatar','Kuwait','Bahrain','Oman','Saudi Arabia',
  'Germany','France','Italy','Spain','Netherlands','Belgium','Sweden','Norway',
  'Denmark','Finland','Switzerland','Austria','Ireland','New Zealand','Singapore',
  'Malaysia','South Africa','Kenya','Nigeria','Ghana','Zimbabwe','Uganda','Tanzania',
  'Afghanistan','Albania','Algeria','Angola','Argentina','Armenia','Azerbaijan',
  'Bahamas','Bolivia','Bosnia','Botswana','Brazil','Bulgaria','Cambodia','Cameroon',
  'Chile','China','Colombia','Croatia','Cuba','Cyprus','Czech Republic','DR Congo',
  'Ecuador','Egypt','Ethiopia','Fiji','Georgia','Greece','Guatemala','Hungary',
  'Indonesia','Iran','Iraq','Israel','Jamaica','Japan','Jordan','Kazakhstan',
  'Kosovo','Kyrgyzstan','Laos','Latvia','Lebanon','Libya','Lithuania','Luxembourg',
  'Madagascar','Malawi','Maldives','Malta','Mexico','Moldova','Mongolia','Montenegro',
  'Morocco','Mozambique','Myanmar','Namibia','North Macedonia','Panama','Papua New Guinea',
  'Paraguay','Peru','Philippines','Poland','Portugal','Romania','Russia','Rwanda',
  'Senegal','Serbia','Sierra Leone','Slovakia','Slovenia','Somalia','South Korea',
  'Sudan','Syria','Taiwan','Tajikistan','Thailand','Tunisia','Turkey','Turkmenistan',
  'Ukraine','Uruguay','Uzbekistan','Venezuela','Vietnam','Yemen','Zambia','Other',
].sort()

interface Props {
  idCountry: string
  idFile: File | null
  onIdChange: (country: string, file: File | null) => void
}

export default function IdVerificationStep({ idCountry, idFile, onIdChange }: Props) {
  const [preview, setPreview] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null
    if (preview) URL.revokeObjectURL(preview)
    setPreview(f ? URL.createObjectURL(f) : null)
    onIdChange(idCountry, f)
  }

  const inp = { width: '100%', padding: '0.85rem 1rem', border: '1px solid rgba(13,31,60,0.18)', background: 'rgba(244,241,235,0.4)', color: c.navy, fontSize: '1.05rem', fontFamily: '"Cormorant Garamond", Georgia, serif', outline: 'none', borderRadius: '4px', boxSizing: 'border-box' as const, transition: 'border-color 0.2s' }
  const label = { display: 'block', fontFamily: 'Raleway, sans-serif', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase' as const, color: c.textMid, marginBottom: '0.5rem' }

  return (
    <div>
      <h2 className="ob-step-h2" style={{ color: c.navy, margin: '0 0 0.25rem' }}>
        ID Verification
      </h2>
      <p style={{ fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontSize: '1.1rem', color: c.sepia, margin: '0 0 1rem' }}>
        Verify your identity to build trust with other members
      </p>
      <div style={{ height: '1px', background: `linear-gradient(to right, ${c.gold}, transparent)`, marginBottom: '1.5rem' }} />

      {/* Green tick info box */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem', background: 'rgba(22,163,74,0.07)', border: '1px solid rgba(22,163,74,0.25)', borderRadius: '8px', padding: '1rem 1.1rem', marginBottom: '1.75rem' }}>
        <span style={{ fontSize: '1.75rem', flexShrink: 0, lineHeight: 1 }}>✅</span>
        <div>
          <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: c.green, margin: '0 0 0.4rem' }}>
            Earn a verified green tick
          </p>
          <p style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '1.05rem', color: c.textMid, margin: 0, lineHeight: 1.65 }}>
            Once your ID has been reviewed and approved by the Soul Mate team, a green verification tick will appear on your profile. This lets other members know that you are who you say you are, giving them greater confidence to connect with you.
          </p>
        </div>
      </div>

      {/* Country */}
      <div style={{ marginBottom: '1.4rem' }}>
        <label style={label}>Country of ID document <span style={{ color: '#c0392b' }}>*</span></label>
        <select
          value={idCountry}
          onChange={e => onIdChange(e.target.value, idFile)}
          style={{ ...inp, appearance: 'auto' }}
          onFocus={e => (e.target.style.borderColor = '#1b3a6b')}
          onBlur={e => (e.target.style.borderColor = 'rgba(13,31,60,0.18)')}
        >
          <option value="">Select country</option>
          {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Document upload */}
      <div style={{ marginBottom: '1rem' }}>
        <label style={label}>Upload ID document <span style={{ color: '#c0392b' }}>*</span></label>
        <p style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '1rem', color: c.sepia, margin: '0 0 0.75rem', lineHeight: 1.55 }}>
          Please upload a clear photo or scan of your passport, national ID card, or driving licence. Make sure all four corners are visible and the text is legible.
        </p>

        <button type="button" onClick={() => inputRef.current?.click()}
          style={{ width: '100%', minHeight: '140px', borderRadius: '8px', border: idFile ? '1px solid rgba(22,163,74,0.4)' : '1px dashed rgba(13,31,60,0.25)', background: 'rgba(244,241,235,0.35)', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', overflow: 'hidden', padding: 0, position: 'relative' }}>
          {preview ? (
            <>
              <img src={preview} alt="ID preview" style={{ width: '100%', height: '160px', objectFit: 'cover', display: 'block' }} />
              <div style={{ position: 'absolute', bottom: '8px', right: '10px', background: 'rgba(22,163,74,0.9)', borderRadius: '4px', padding: '0.2rem 0.6rem', fontFamily: 'Raleway, sans-serif', fontSize: '0.65rem', fontWeight: 700, color: '#fff', letterSpacing: '0.06em' }}>
                ✓ Uploaded
              </div>
            </>
          ) : (
            <>
              <span style={{ fontSize: '2rem' }}>🪪</span>
              <span style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.8rem', fontWeight: 600, color: c.sepia }}>Tap to upload ID document</span>
              <span style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.68rem', color: 'rgba(90,110,130,0.6)' }}>Passport · National ID · Driving Licence</span>
            </>
          )}
        </button>
        <input ref={inputRef} type="file" accept="image/*,.pdf" style={{ display: 'none' }} onChange={handleFile} />
      </div>

      {/* Privacy note */}
      <div style={{ background: 'rgba(139,105,20,0.06)', border: '1px solid rgba(139,105,20,0.18)', borderRadius: '6px', padding: '0.75rem 1rem' }}>
        <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.8rem', color: c.sepia, margin: 0, lineHeight: 1.6 }}>
          🔒 <strong>Your document is private.</strong> It is only seen by the Soul Mate team for verification purposes and is never shared with other members.
        </p>
      </div>
    </div>
  )
}
