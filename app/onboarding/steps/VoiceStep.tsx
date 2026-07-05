'use client'

import { useEffect, useRef, useState } from 'react'

interface Props {
  onVoiceChange: (blob: Blob | null) => void
  onVoiceEnChange?: (blob: Blob | null) => void
  hasRecording: boolean
  existingUrl?: string | null
  existingEnUrl?: string | null
}

const c = {
  navy: '#0d1f3c', teal: '#1D5252', gold: '#9A7020', goldLight: '#D4A835',
  sepia: '#5A7870', rose: '#C47820', cream: '#FFF9F2', green: '#16a34a',
}

function Recorder({
  label, sublabel, required, onSave, existingUrl,
}: {
  label: string; sublabel: string; required?: boolean
  onSave: (blob: Blob | null) => void
  existingUrl?: string | null
}) {
  const [recording, setRecording] = useState(false)
  const [seconds, setSeconds] = useState(0)
  const [audioUrl, setAudioUrl] = useState<string | null>(existingUrl ?? null)
  const [isExisting, setIsExisting] = useState(!!existingUrl)
  const [denied, setDenied] = useState(false)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<BlobPart[]>([])

  // Sync when existingUrl arrives after mount (async init)
  useEffect(() => {
    if (existingUrl && !audioUrl) {
      setAudioUrl(existingUrl)
      setIsExisting(true)
    }
  }, [existingUrl]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => () => { recorderRef.current?.stream?.getTracks().forEach(t => t.stop()) }, [])

  useEffect(() => {
    if (!recording) return
    const id = setInterval(() => setSeconds(s => {
      if (s >= 60) { stopRecording(); return 60 }
      return s + 1
    }), 1000)
    return () => clearInterval(id)
  }, [recording])

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mime = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4'
      const recorder = new MediaRecorder(stream, { mimeType: mime })
      chunksRef.current = []
      recorder.ondataavailable = e => chunksRef.current.push(e.data)
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mime })
        setAudioUrl(URL.createObjectURL(blob))
        onSave(blob)
        stream.getTracks().forEach(t => t.stop())
      }
      recorder.start()
      recorderRef.current = recorder
      setSeconds(0)
      setRecording(true)
    } catch { setDenied(true) }
  }

  function stopRecording() { recorderRef.current?.stop(); setRecording(false) }
  function reRecord() { setAudioUrl(null); setIsExisting(false); onSave(null); setSeconds(0) }
  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

  return (
    <div style={{ background: '#fff', border: `1.5px solid ${audioUrl ? c.teal : 'rgba(29,82,82,0.2)'}`, borderRadius: '10px', padding: 'clamp(0.9rem, 3vw, 1.25rem) clamp(0.9rem, 4vw, 1.5rem)', marginBottom: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
        <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: c.teal, margin: 0 }}>
          {label}
        </p>
        {required && (
          <span style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#fff', background: c.rose, padding: '0.15rem 0.5rem', borderRadius: '20px' }}>
            Required
          </span>
        )}
      </div>
      <p style={{ fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontSize: '0.9rem', color: c.sepia, margin: '0 0 1rem' }}>{sublabel}</p>

      {denied ? (
        <p style={{ fontFamily: '"Cormorant Garamond", serif', color: '#e74c3c', fontSize: '0.9rem' }}>
          🎙️ Microphone access denied. Please allow it in your browser settings.
        </p>
      ) : audioUrl ? (
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.12em', color: c.green, marginBottom: '0.75rem', textTransform: 'uppercase' }}>
            {isExisting ? '✓ Previously saved — play to hear it' : `✓ Saved (${fmt(seconds)})`}
          </p>
          <audio controls src={audioUrl} preload="none" style={{ width: '100%', marginBottom: '0.75rem', accentColor: c.teal }} />
          <button onClick={reRecord} style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.62rem', color: c.sepia, background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', letterSpacing: '0.05em' }}>
            Re-record
          </button>
        </div>
      ) : (
        <div style={{ textAlign: 'center' }}>
          <button onClick={recording ? stopRecording : startRecording}
            style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.6rem', margin: '0 auto' }}>
            <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: recording ? 'rgba(196,120,32,0.08)' : 'rgba(29,82,82,0.08)', border: `2px solid ${recording ? c.rose : c.teal}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.75rem', transition: 'all 0.3s' }}>
              {recording ? '⏹' : '🎙️'}
            </div>
            <span style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.13em', textTransform: 'uppercase', color: recording ? c.rose : c.teal }}>
              {recording ? 'Stop Recording' : 'Tap to Record'}
            </span>
          </button>

          {recording && (
            <div style={{ marginTop: '1.25rem' }}>
              <p style={{ fontFamily: '"Playfair Display", serif', fontSize: '1.75rem', fontWeight: 700, color: c.navy, margin: '0 0 0.4rem' }}>
                {fmt(seconds)}
              </p>
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: '3px', height: '28px', marginBottom: '0.4rem' }}>
                {Array.from({ length: 10 }).map((_, i) => (
                  <div key={i} style={{ width: '4px', borderRadius: '2px', background: c.rose, animation: `waveBar 0.${7 + (i % 4)}s ease-in-out infinite alternate`, height: `${20 + Math.random() * 10}px` }} />
                ))}
              </div>
              <style>{`@keyframes waveBar { from { height: 20%; } to { height: 100%; } }`}</style>
              <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.58rem', color: c.sepia, letterSpacing: '0.1em' }}>
                {60 - seconds}s remaining
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function VoiceStep({ onVoiceChange, onVoiceEnChange, hasRecording, existingUrl, existingEnUrl }: Props) {
  return (
    <div>
      <h2 className="ob-step-h2" style={{ color: c.navy, margin: '0 0 0.25rem' }}>
        Voice Introduction
      </h2>
      <p style={{ fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontSize: '1rem', color: c.sepia, margin: '0 0 1.25rem' }}>
        आपकी आवाज़ आपकी पहली पहचान है — Your voice is your first impression.
      </p>

      {/* Guidance note */}
      <div style={{ background: 'rgba(29,82,82,0.05)', border: `1.5px solid rgba(29,82,82,0.2)`, borderRadius: '10px', padding: '1rem 1.25rem', marginBottom: '1.5rem' }}>
        <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: c.teal, margin: '0 0 0.6rem' }}>
          🎙️ What to say — क्या बोलें
        </p>
        <ul style={{ margin: 0, padding: '0 0 0 1.1rem', fontFamily: '"Cormorant Garamond", serif', fontSize: '1rem', color: c.navy, lineHeight: 1.9 }}>
          <li><strong>अपना पहला नाम बोलें</strong> — Say your <strong>first name only</strong> (not your surname)</li>
          <li><strong>आप क्या करते हैं</strong> — What do you <strong>do for work</strong></li>
          <li><strong>आपको क्या पसंद है</strong> — What do you <strong>enjoy or love</strong></li>
          <li><strong>आप क्या ढूंढ रहे हैं</strong> — What you are <strong>looking for in a partner</strong></li>
        </ul>
        <div style={{ marginTop: '0.9rem', padding: '0.65rem 0.9rem', background: 'rgba(212,168,53,0.1)', border: `1px solid rgba(212,168,53,0.3)`, borderRadius: '6px' }}>
          <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.68rem', fontWeight: 700, color: c.gold, margin: '0 0 0.2rem', letterSpacing: '0.06em' }}>
            ✨ Practice before recording — रिकॉर्ड करने से पहले अभ्यास करें
          </p>
          <p style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '0.92rem', color: c.sepia, margin: 0, lineHeight: 1.6 }}>
            A warm, clear voice creates a <strong>strong first impression</strong>. Speak naturally and confidently — आपकी आवाज़ में आपकी असली पहचान है।
          </p>
        </div>
      </div>

      {/* Recording 1 — Mother tongue (Required) */}
      <Recorder
        label="Recording 1 — Mother Tongue · मातृभाषा में"
        sublabel="Record in your native language — Hindi, Tamil, Punjabi, Gujarati, Bengali, or any Indian language."
        required
        onSave={onVoiceChange}
        existingUrl={existingUrl}
      />

      {/* Recording 2 — English (Optional) */}
      <Recorder
        label="Recording 2 — English · अंग्रेज़ी में"
        sublabel="Optional but highly recommended — an English introduction greatly increases your matches."
        onSave={onVoiceEnChange ?? (() => {})}
        existingUrl={existingEnUrl}
      />

      <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.62rem', letterSpacing: '0.08em', color: 'rgba(29,82,82,0.5)', textAlign: 'center', marginTop: '0.5rem' }}>
        30–60 seconds each · Keep it natural and warm
      </p>
    </div>
  )
}
