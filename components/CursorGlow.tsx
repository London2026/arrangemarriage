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
      if (el) el.style.background = `radial-gradient(650px circle at ${x}px ${y}px, rgba(201,168,76,0.22) 0%, rgba(201,168,76,0.10) 35%, transparent 70%)`
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

  return <div ref={ref} aria-hidden style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 1 }} />
}
