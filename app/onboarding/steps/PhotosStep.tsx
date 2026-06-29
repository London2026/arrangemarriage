'use client'

import { useEffect, useRef, useState } from 'react'

interface Props {
  back1: File | null; back2: File | null; front: File | null
  onPhotosChange: (b1: File | null, b2: File | null, f: File | null) => void
  existingBack1Url?: string | null
  existingBack2Url?: string | null
  existingFrontUrl?: string | null
}

const c = { navy: '#0d1f3c', gold: '#8b6914', sepia: '#5a6e82', textMid: '#2c4a6e' }

export default function PhotosStep({ back1, back2, front, onPhotosChange, existingBack1Url, existingBack2Url, existingFrontUrl }: Props) {
  const [p1, setP1] = useState<string | null>(null)
  const [p2, setP2] = useState<string | null>(null)
  const [pf, setPf] = useState<string | null>(null)
  const r1 = useRef<HTMLInputElement>(null)
  const r2 = useRef<HTMLInputElement>(null)
  const rf = useRef<HTMLInputElement>(null)

  useEffect(() => () => { if (p1) URL.revokeObjectURL(p1); if (p2) URL.revokeObjectURL(p2); if (pf) URL.revokeObjectURL(pf) }, [])

  function pick1(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null
    if (p1) URL.revokeObjectURL(p1); setP1(f ? URL.createObjectURL(f) : null)
    onPhotosChange(f, back2, front)
  }
  function pick2(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null
    if (p2) URL.revokeObjectURL(p2); setP2(f ? URL.createObjectURL(f) : null)
    onPhotosChange(back1, f, front)
  }
  function pickF(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null
    if (pf) URL.revokeObjectURL(pf); setPf(f ? URL.createObjectURL(f) : null)
    onPhotosChange(back1, back2, f)
  }

  return (
    <div>
      <style>{`
        .photo-example-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:0.5rem}
        .photo-back-grid{display:grid;grid-template-columns:1fr 1fr;gap:0.75rem}
        @media(max-width:480px){
          .photo-example-grid{grid-template-columns:1fr;gap:0.4rem}
          .photo-example-grid>div{display:flex;align-items:center;gap:0.75rem;text-align:left;padding:0.5rem 0.75rem}
          .photo-example-grid>div .ex-icon{margin-bottom:0;font-size:1.5rem}
          .photo-back-grid{grid-template-columns:1fr}
        }
      `}</style>
      <h2 className="ob-step-h2" style={{ color: c.navy, margin: '0 0 0.25rem' }}>
        Your photos
      </h2>
      <p style={{ fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontSize: '1.15rem', color: c.sepia, margin: '0 0 1rem' }}>
        All photos are required — back-side photos are visible to members, your face photo stays private until revealed.
      </p>
      <div style={{ height: '1px', background: `linear-gradient(to right, ${c.gold}, transparent)`, marginBottom: '1.5rem' }} />

      {/* Back photos */}
      <div style={{ marginBottom: '1.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.6rem' }}>
          <span style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: c.gold }}>
            Back-Side Photos
          </span>
          <span style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.1em', padding: '0.2rem 0.6rem', background: 'rgba(139,105,20,0.08)', border: '1px solid rgba(139,105,20,0.25)', color: c.gold, borderRadius: '20px' }}>
            Visible to members
          </span>
          <span style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.68rem', fontWeight: 700, color: '#c0392b' }}>* Required</span>
        </div>

        <p style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '1.1rem', color: c.textMid, margin: '0 0 1rem', lineHeight: 1.6 }}>
          Your back-side photos will be visible on your profile to all members. Please do not show your face here — share a back view, silhouette, or side profile instead.
        </p>

        {/* Example guide */}
        <div style={{ marginBottom: '1rem', padding: '0.85rem 1rem', background: 'rgba(139,105,20,0.05)', border: '1px solid rgba(139,105,20,0.2)', borderRadius: '8px' }}>
          <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: c.gold, margin: '0 0 0.6rem' }}>
            Example back-side photos
          </p>
          <div className="photo-example-grid">
            {[
              { icon: '🚶', label: 'Walking away', sub: 'Back view, full body' },
              { icon: '🌅', label: 'Silhouette', sub: 'Against sky or window' },
              { icon: '↩️', label: 'Side profile', sub: 'Looking away, outdoors' },
            ].map(ex => (
              <div key={ex.label} style={{ textAlign: 'center', padding: '0.6rem 0.4rem', background: 'rgba(244,241,235,0.5)', border: '1px dashed rgba(139,105,20,0.2)', borderRadius: '6px' }}>
                <div className="ex-icon" style={{ fontSize: '1.75rem', marginBottom: '0.3rem' }}>{ex.icon}</div>
                <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.68rem', fontWeight: 700, color: c.textMid, margin: '0 0 0.15rem' }}>{ex.label}</p>
                <p style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '0.85rem', color: c.sepia, margin: 0 }}>{ex.sub}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="photo-back-grid">
          <PhotoBox label="Photo 1" preview={p1} existingUrl={existingBack1Url} inputRef={r1} onChange={pick1} blurred={false} required />
          <PhotoBox label="Photo 2" preview={p2} existingUrl={existingBack2Url} inputRef={r2} onChange={pick2} blurred={false} required />
        </div>
      </div>

      <div style={{ height: '1px', background: 'rgba(13,31,60,0.08)', margin: '0 0 1.5rem' }} />

      {/* Reveal photo */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.6rem' }}>
          <span style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: c.gold }}>
            Your Reveal Photo
          </span>
          <span style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.1em', padding: '0.2rem 0.6rem', background: 'rgba(13,31,60,0.05)', border: '1px solid rgba(13,31,60,0.15)', color: c.sepia, borderRadius: '20px' }}>
            🔒 Hidden until revealed
          </span>
          <span style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.68rem', fontWeight: 700, color: '#c0392b' }}>* Required</span>
        </div>
        <p style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '1.1rem', color: c.textMid, margin: '0 0 1rem', lineHeight: 1.6 }}>
          Your front face photo will only be revealed when another member clicks &ldquo;Reveal Photo&rdquo; on your profile. The moment this happens, you will receive a notification letting you know which profile has viewed your photo — so you are always in control.
        </p>
        <PhotoBox label="Face photo" preview={pf} existingUrl={existingFrontUrl} inputRef={rf} onChange={pickF} blurred={true} required />
      </div>
    </div>
  )
}

function PhotoBox({ label, preview, existingUrl, inputRef, onChange, blurred, required }: {
  label: string; preview: string | null; existingUrl?: string | null
  inputRef: React.RefObject<HTMLInputElement | null>
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; blurred: boolean; required?: boolean
}) {
  const displayUrl = preview ?? existingUrl ?? null
  const isSaved = !preview && !!existingUrl
  return (
    <button type="button" onClick={() => inputRef.current?.click()}
      style={{ position: 'relative', width: '100%', aspectRatio: '3/4', borderRadius: '6px', overflow: 'hidden', border: displayUrl ? '1px solid rgba(27,58,107,0.4)' : '1px dashed rgba(13,31,60,0.25)', background: 'rgba(244,241,235,0.4)', cursor: 'pointer', display: 'block' }}>
      {displayUrl ? (
        <>
          <img src={displayUrl} alt={label} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: blurred ? 'blur(10px)' : 'none', transform: blurred ? 'scale(1.1)' : 'none' }} />
          {blurred && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(13,31,60,0.35)' }}>
              <span style={{ fontSize: '1.5rem' }}>🔒</span>
              <span style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.7rem', color: '#fff', letterSpacing: '0.1em', marginTop: '0.25rem' }}>Hidden</span>
            </div>
          )}
          <div style={{ position: 'absolute', bottom: '6px', right: '6px', padding: '0.2rem 0.5rem', background: 'rgba(13,31,60,0.7)', borderRadius: '3px', fontFamily: 'Raleway, sans-serif', fontSize: '0.65rem', color: '#c9a84c', letterSpacing: '0.05em' }}>
            {isSaved ? '✓ Saved' : '✓ Uploaded'}
          </div>
        </>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '0.5rem' }}>
          <span style={{ fontSize: '1.75rem' }}>{blurred ? '🔒' : '📷'}</span>
          <span style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.75rem', fontWeight: 600, color: '#5a6e82', letterSpacing: '0.05em' }}>{label}{required ? ' *' : ''}</span>
          <span style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.68rem', color: 'rgba(90,110,130,0.7)' }}>Tap to upload</span>
        </div>
      )}
      <input ref={inputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={onChange} />
    </button>
  )
}
