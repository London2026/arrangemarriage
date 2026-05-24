'use client'

import { useEffect, useRef, useState } from 'react'

interface Props { onVoiceChange: (blob: Blob | null) => void; hasRecording: boolean }

const c = { navy: '#0d1f3c', gold: '#8b6914', goldLight: '#c9a84c', sepia: '#5a6e82', rose: '#9e2a2b' }

export default function VoiceStep({ onVoiceChange, hasRecording }: Props) {
  const [recording, setRecording] = useState(false)
  const [seconds, setSeconds] = useState(0)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [denied, setDenied] = useState(false)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<BlobPart[]>([])

  useEffect(() => {
    return () => {
      recorderRef.current?.stream?.getTracks().forEach(t => t.stop())
    }
  }, [])

  useEffect(() => {
    if (!recording) return
    const id = setInterval(() => setSeconds(s => { if (s >= 60) { stopRecording(); return 60 } return s + 1 }), 1000)
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
        onVoiceChange(blob)
        stream.getTracks().forEach(t => t.stop())
      }
      recorder.start()
      recorderRef.current = recorder
      setSeconds(0)
      setRecording(true)
    } catch { setDenied(true) }
  }

  function stopRecording() { recorderRef.current?.stop(); setRecording(false) }

  function reRecord() { setAudioUrl(null); onVoiceChange(null); setSeconds(0) }

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

  return (
    <div>
      <h2 className="ob-step-h2" style={{ color: c.navy, margin: '0 0 0.25rem' }}>
        Your voice introduction
      </h2>
      <p style={{ fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontSize: '1rem', color: c.sepia, margin: '0 0 1rem' }}>
        Record 30–60 seconds. Let your personality shine before photos.
      </p>
      <div style={{ height: '1px', background: `linear-gradient(to right, ${c.gold}, transparent)`, marginBottom: '1.5rem' }} />

      {denied ? (
        <div style={{ textAlign: 'center', padding: '2rem', background: 'rgba(158,42,43,0.05)', border: '1px solid rgba(158,42,43,0.2)', borderRadius: '8px' }}>
          <p style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>🎙️</p>
          <p style={{ fontFamily: '"Cormorant Garamond", serif', color: c.rose }}>Microphone access denied. Please allow it in your browser settings.</p>
        </div>
      ) : audioUrl ? (
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'rgba(139,105,20,0.08)', border: `2px solid ${c.gold}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.75rem', margin: '0 auto 0.75rem' }}>
            🎙️
          </div>
          <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.15em', color: c.gold, marginBottom: '1rem', textTransform: 'uppercase' }}>
            ✓ Recording saved ({fmt(seconds)})
          </p>
          <audio controls src={audioUrl} preload="none" style={{ width: '100%', marginBottom: '1rem', accentColor: c.gold }} />
          <button onClick={reRecord} style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.65rem', color: c.sepia, background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', letterSpacing: '0.05em' }}>
            Re-record
          </button>
        </div>
      ) : (
        <div style={{ textAlign: 'center' }}>
          <button onClick={recording ? stopRecording : startRecording} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', margin: '0 auto' }}>
            <div style={{ width: '88px', height: '88px', borderRadius: '50%', background: recording ? 'rgba(158,42,43,0.08)' : 'rgba(139,105,20,0.08)', border: `2px solid ${recording ? c.rose : c.gold}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', transition: 'all 0.3s' }}>
              {recording ? '⏹' : '🎙️'}
            </div>
            <span style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: recording ? c.rose : c.gold }}>
              {recording ? 'Stop Recording' : 'Tap to Record'}
            </span>
          </button>

          {recording && (
            <div style={{ marginTop: '1.5rem' }}>
              <p style={{ fontFamily: '"Playfair Display", serif', fontSize: '2rem', fontWeight: 700, color: c.navy, margin: '0 0 0.5rem' }}>
                {fmt(seconds)}
              </p>
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: '3px', height: '32px', marginBottom: '0.5rem' }}>
                {Array.from({ length: 10 }).map((_, i) => (
                  <div key={i} style={{ width: '4px', borderRadius: '2px', background: c.rose, animation: `waveBar 0.${7 + (i % 4)}s ease-in-out infinite alternate`, height: `${20 + Math.random() * 12}px` }} />
                ))}
              </div>
              <style>{`@keyframes waveBar { from { height: 20%; } to { height: 100%; } }`}</style>
              <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.6rem', color: c.sepia, letterSpacing: '0.1em' }}>
                {60 - seconds}s remaining
              </p>
            </div>
          )}

          {!recording && (
            <p style={{ marginTop: '1.25rem', fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', color: c.sepia, fontSize: '0.9rem' }}>
              Tip: Mention your name, interests, and what you are looking for.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
