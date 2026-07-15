'use client'

import { useEffect, useRef } from 'react'

/** A soft gold light that follows the cursor. Skipped for reduced-motion users. */
export default function CursorGlow() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const el = ref.current
    if (!el) return

    let frame = 0
    let x = window.innerWidth / 2
    let y = window.innerHeight / 3

    function paint() {
      if (el) el.style.background = `radial-gradient(420px circle at ${x}px ${y}px, rgba(255,255,255,1) 0%, rgba(255,221,120,0.85) 15%, rgba(255,183,51,0.35) 40%, transparent 65%)`
      frame = 0
    }

    function handleMove(e: MouseEvent) {
      x = e.clientX
      y = e.clientY
      if (!frame) frame = requestAnimationFrame(paint)
    }

    function handleLeave() {
      if (el) el.style.background = 'none'
    }

    paint()
    window.addEventListener('mousemove', handleMove)
    document.addEventListener('mouseleave', handleLeave)
    return () => {
      window.removeEventListener('mousemove', handleMove)
      document.removeEventListener('mouseleave', handleLeave)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [])

  return <div ref={ref} aria-hidden style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 40, mixBlendMode: 'screen' }} />
}
