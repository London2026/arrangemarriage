'use client'

import { MotionConfig, motion } from 'framer-motion'
import type { ReactNode } from 'react'

// Shared animation primitives. Every component here wraps its children in
// MotionConfig reducedMotion="user" so OS-level reduced-motion preferences
// are honoured automatically (animations collapse to opacity-only).

const EASE = [0.25, 0.1, 0.25, 1] as const

/** Fades + slides content up as it enters the viewport (fires once). */
export function Reveal({ children, delay = 0, y = 24, className, style }: {
  children: ReactNode
  delay?: number
  y?: number
  className?: string
  style?: React.CSSProperties
}) {
  return (
    <MotionConfig reducedMotion="user">
      <motion.div
        className={className}
        style={style}
        initial={{ opacity: 0, y }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-40px' }}
        transition={{ duration: 0.7, delay, ease: EASE }}
      >
        {children}
      </motion.div>
    </MotionConfig>
  )
}

/** Fades + slides content down from the top on mount (for page headers). */
export function FadeDown({ children, delay = 0, className, style }: {
  children: ReactNode
  delay?: number
  className?: string
  style?: React.CSSProperties
}) {
  return (
    <MotionConfig reducedMotion="user">
      <motion.div
        className={className}
        style={style}
        initial={{ opacity: 0, y: -18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay, ease: EASE }}
      >
        {children}
      </motion.div>
    </MotionConfig>
  )
}
